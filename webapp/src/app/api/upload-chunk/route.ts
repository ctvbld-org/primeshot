import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { uploadToS3 } from '@/lib/s3';
import { v4 as uuidv4 } from 'uuid';
import { imageSchema } from '@/lib/schemas';
import { ChunkMetadata } from '@/lib/upload-utils';
import { promises as fs } from 'fs';
import path from 'path';
import os from 'os';
import { z } from 'zod';

// Security limits
const MAX_FILE_SIZE = 100 * 1024 * 1024; // 100MB
const MAX_CHUNKS = 1000;
const MAX_CHUNK_SIZE = 5 * 1024 * 1024; // 5MB
const ALLOWED_MIME_TYPES = ['image/jpeg', 'image/png', 'image/webp'] as const;



// UUID v4 validation regex
const UUID_V4_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

// Metadata validation schema
const chunkMetadataSchema = z.object({
  uploadId: z.string().uuid(),
  characterId: z.string().uuid(),
  chunkIndex: z.number().int().min(0),
  totalChunks: z.number().int().min(1).max(MAX_CHUNKS)
    .refine(val => val <= MAX_CHUNKS, {
      message: `Maximum number of chunks exceeded (limit: ${MAX_CHUNKS})`
    }),
  fileName: z.string().min(1).max(255),
  fileSize: z.number().positive()
    .max(MAX_FILE_SIZE)
    .refine(val => val <= MAX_FILE_SIZE, {
      message: `File size exceeds limit (${MAX_FILE_SIZE / 1024 / 1024}MB)`
    }),
  fileType: z.enum(ALLOWED_MIME_TYPES, {
    errorMap: () => ({ message: `Only ${ALLOWED_MIME_TYPES.join(', ')} files are allowed` })
  }),
  qualityScore: z.number().int().min(0).max(100).optional()
}).refine(data => data.chunkIndex < data.totalChunks, {
  message: "chunkIndex must be less than totalChunks"
});

// Get temp directory for chunks
const getTempDir = async (uploadId: string) => {
  // Validate uploadId is a valid UUID v4 to prevent path traversal
  if (!UUID_V4_REGEX.test(uploadId)) {
    throw new Error('Invalid uploadId format - must be a valid UUID v4');
  }
  const tempDir = path.join(os.tmpdir(), 'primeshot-uploads', uploadId);
  await fs.mkdir(tempDir, { recursive: true });
  return tempDir;
};



// Save chunk to temp directory
async function saveChunk(chunk: Buffer, metadata: ChunkMetadata) {
  const tempDir = await getTempDir(metadata.uploadId);
  const chunkPath = path.join(tempDir, `chunk-${metadata.chunkIndex}`);
  await fs.writeFile(chunkPath, chunk);
  return chunkPath;
}

// Check if all chunks are received and validate integrity
async function areAllChunksReceived(metadata: ChunkMetadata) {
  const tempDir = await getTempDir(metadata.uploadId);
  try {
    // Get all chunk files
    const files = await fs.readdir(tempDir);
    
    // Create a Set to track unique chunk indices
    const receivedChunks = new Set<number>();
    
    // Validate each chunk file
    for (const file of files) {
      // Extract chunk index from filename
      const match = file.match(/^chunk-(\d+)$/);
      if (!match) continue;
      
      const chunkIndex = parseInt(match[1], 10);
      
      // Validate chunk index is within expected range
      if (chunkIndex < 0 || chunkIndex >= metadata.totalChunks) {
        console.warn(`Invalid chunk index ${chunkIndex} found for upload ${metadata.uploadId}`);
        continue;
      }
      
      // Check if chunk file exists and has content
      try {
        const stats = await fs.stat(path.join(tempDir, file));
        if (stats.size === 0) {
          console.warn(`Empty chunk file found: ${file}`);
          continue;
        }
        receivedChunks.add(chunkIndex);
      } catch (err) {
        console.warn(`Error checking chunk file ${file}:`, err);
        continue;
      }
    }
    
    // Verify we have all expected chunks (0 to totalChunks-1)
    for (let i = 0; i < metadata.totalChunks; i++) {
      if (!receivedChunks.has(i)) {
        return false;
      }
    }
    
    return true;
  } catch (err) {
    console.error(`Error checking chunks for upload ${metadata.uploadId}:`, err);
    return false;
  }
}

// Create a lock file for the upload
async function createLock(uploadId: string): Promise<boolean> {
  const tempDir = await getTempDir(uploadId);
  const lockPath = path.join(tempDir, '.lock');
  try {
    // Try to create lock file - will fail if it already exists
    await fs.writeFile(lockPath, '', { flag: 'wx' });
    return true;
  } catch {
    return false;
  }
}

// Release the lock
async function releaseLock(uploadId: string) {
  const tempDir = await getTempDir(uploadId);
  const lockPath = path.join(tempDir, '.lock');
  try {
    await fs.unlink(lockPath);
  } catch {
    // Ignore errors during lock release
  }
}

// Combine chunks into final file
async function combineChunks(metadata: ChunkMetadata) {
  const tempDir = await getTempDir(metadata.uploadId);
  const chunks: Buffer[] = [];

  // Acquire lock before processing
  if (!await createLock(metadata.uploadId)) {
    throw new Error('Another process is currently combining chunks');
  }

  try {
    // Verify chunks again under lock to prevent race conditions
    if (!await areAllChunksReceived(metadata)) {
      throw new Error('Some chunks are missing during combination');
    }

    for (let i = 0; i < metadata.totalChunks; i++) {
      const chunkPath = path.join(tempDir, `chunk-${i}`);
      const chunk = await fs.readFile(chunkPath);
      if (chunk.length === 0) {
        throw new Error(`Empty chunk found at index ${i}`);
      }
      chunks.push(chunk);
    }

    const finalBuffer = Buffer.concat(chunks);
    
    // Clean up temp directory
    await fs.rm(tempDir, { recursive: true, force: true });
    
    return finalBuffer;
  } catch (error) {
    // Clean up lock in case of error
    await releaseLock(metadata.uploadId);
    throw error;
  }
}

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: userError } = await supabase.auth.getUser();

    if (userError || !user) {
      console.error('Unauthorized access attempt', userError);
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const formData = await request.formData();
    const chunkBlob = formData.get('chunk') as Blob;
    const metadataStr = formData.get('metadata') as string;

    if (!chunkBlob || !metadataStr) {
      return NextResponse.json({ error: 'Missing chunk or metadata' }, { status: 400 });
    }

    // Validate chunk size before processing
    if (chunkBlob.size > MAX_CHUNK_SIZE) {
      return NextResponse.json({ 
        error: `Chunk size exceeds limit (${MAX_CHUNK_SIZE / 1024 / 1024}MB)` 
      }, { status: 400 });
    }

    let metadata: ChunkMetadata;
    try {
      const parsedMetadata = JSON.parse(metadataStr);
      metadata = chunkMetadataSchema.parse(parsedMetadata);
    } catch (error) {
      console.error('Metadata validation error:', error);
      return NextResponse.json({ 
        error: error instanceof z.ZodError 
          ? error.errors.map(e => `${e.path.join('.')}: ${e.message}`).join(', ')
          : 'Invalid metadata format'
      }, { status: 400 });
    }

    // Validate that the character exists and belongs to the user
    const { data: character, error: characterError } = await supabase
      .from('characters')
      .select('id, user_id, status')
      .eq('id', metadata.characterId)
      .eq('user_id', user.id)
      .neq('status', 'deleted') // Exclude soft-deleted characters
      .single();

    if (characterError || !character) {
      console.error('Character validation failed:', characterError);
      return NextResponse.json({ 
        error: 'Character not found or does not belong to user' 
      }, { status: 403 });
    }

    // Check if character is in appropriate status for uploading
    if (character.status !== 'queued') {
      return NextResponse.json({ 
        error: `Character is in '${character.status}' status and cannot accept uploads` 
      }, { status: 400 });
    }

    // Only validate subscription on first chunk (chunk 0) to avoid repeating validation for every chunk
    if (metadata.chunkIndex === 0) {
      console.log(`Validating subscription for character training for user ${user.id}`);
      
      // Validate subscription and character training permissions
      const { data: subscription, error: subscriptionError } = await supabase
        .from('user_subscriptions')
        .select('plan_name, status, current_period_end')
        .eq('user_id', user.id)
        .eq('status', 'active')
        .single();

      console.log('Subscription query result:', { subscription, subscriptionError });

      if (subscriptionError || !subscription) {
        console.error('No active subscription found:', subscriptionError);
        return NextResponse.json({ 
          error: 'Active subscription required for character training' 
        }, { status: 403 });
      }

      // Get available credits using the credit balance function
      const { data: creditBalance, error: creditError } = await supabase
        .rpc('get_user_available_credits', { user_uuid: user.id });

      console.log('Credit balance query result:', { creditBalance, creditError });

      if (creditError) {
        console.error('Failed to get credit balance:', creditError);
        return NextResponse.json({ 
          error: 'Failed to check credit balance' 
        }, { status: 500 });
      }

      // Fetch character training cost using centralized pricing utility
      let CHARACTER_TRAINING_CREDITS = 30; // Default fallback
      try {
        const { data: creditCosts, error: costError } = await supabase
          .from('credit_costs')
          .select('type, value');

        if (costError) {
          console.error('Failed to fetch credit costs from database:', costError);
        } else if (creditCosts) {
          // Transform to key-value format for compatibility
          const costsMap = creditCosts.reduce((acc: Record<string, number>, cost: any) => {
            acc[cost.type] = cost.value;
            return acc;
          }, {} as Record<string, number>);

          // Try CHARACTER_TRAINING first, fallback to FACE_MODEL_TRAINING for compatibility
          CHARACTER_TRAINING_CREDITS = costsMap['CHARACTER_TRAINING'] || costsMap['FACE_MODEL_TRAINING'] || 30;
        }
      } catch (error) {
        console.error('Error fetching character training cost:', error);
        // Use fallback value
      }

      if (creditBalance < CHARACTER_TRAINING_CREDITS) {
        return NextResponse.json({ 
          error: `Insufficient credits for character training. Need ${CHARACTER_TRAINING_CREDITS} credits, but only ${creditBalance} available.` 
        }, { status: 403 });
      }

      console.log('Subscription validation passed for character upload');
    }

    const chunkBuffer = Buffer.from(await chunkBlob.arrayBuffer());

    // Additional runtime chunk size validation as defense in depth
    if (chunkBuffer.length > MAX_CHUNK_SIZE) {
      return NextResponse.json({ 
        error: `Chunk size exceeds limit (${MAX_CHUNK_SIZE / 1024 / 1024}MB)` 
      }, { status: 400 });
    }
    
    // Check if upload session exists or create new one with race condition handling
    let { data: session } = await supabase
      .from('upload_sessions')
      .select()
      .eq('id', metadata.uploadId)
      .single();

    if (!session) {
      // Try to create new session, but handle race condition if another request created it first
      const { data: newSession, error: createError } = await supabase
        .from('upload_sessions')
        .insert({
          id: metadata.uploadId,
          user_id: user.id,
          character_id: metadata.characterId,
          file_name: metadata.fileName,
          file_size: metadata.fileSize,
          file_type: metadata.fileType,
          total_chunks: metadata.totalChunks,
          quality_score: metadata.qualityScore,
          status: 'pending'
        })
        .select()
        .single();

      if (createError) {
        // If error is due to duplicate key (session already exists), fetch it
        if (createError.code === '23505' || createError.message.includes('duplicate key')) {
          const { data: existingSession } = await supabase
            .from('upload_sessions')
            .select()
            .eq('id', metadata.uploadId)
            .single();
          
          if (existingSession) {
            session = existingSession;
          } else {
            throw new Error(`Failed to create or retrieve upload session: ${createError.message}`);
          }
        } else {
          throw new Error(`Failed to create upload session: ${createError.message}`);
        }
      } else {
        session = newSession;
      }
    }

    // Face model stays in 'queued' status during uploads
    // Status will only change when training starts

    // Check if chunk already exists and upsert to prevent duplicates
    const { data: existingChunk } = await supabase
      .from('upload_chunks')
      .select('id')
      .eq('session_id', session.id)
      .eq('chunk_index', metadata.chunkIndex)
      .single();

    if (existingChunk) {
      // Chunk already exists, update it
      const { error: updateError } = await supabase
        .from('upload_chunks')
        .update({
          chunk_size: chunkBuffer.length,
          status: 'uploaded',
          updated_at: new Date().toISOString()
        })
        .eq('session_id', session.id)
        .eq('chunk_index', metadata.chunkIndex);

      if (updateError) {
        throw new Error(`Failed to update chunk: ${updateError.message}`);
      }
    } else {
      // Chunk doesn't exist, insert it
      const { error: insertError } = await supabase
        .from('upload_chunks')
        .insert({
          session_id: session.id,
          chunk_index: metadata.chunkIndex,
          chunk_size: chunkBuffer.length,
          status: 'uploaded'
        });

      if (insertError) {
        throw new Error(`Failed to insert chunk: ${insertError.message}`);
      }
    }

    // Save chunk to temp storage (only if it doesn't already exist)
    const tempDir = await getTempDir(metadata.uploadId);
    const chunkPath = path.join(tempDir, `chunk-${metadata.chunkIndex}`);
    
    // Check if chunk file already exists to prevent overwriting
    try {
      await fs.access(chunkPath);
      // File already exists, no need to save again
      console.log(`Chunk ${metadata.chunkIndex} already exists in temp storage`);
    } catch {
      // File doesn't exist, save it
      await saveChunk(chunkBuffer, metadata);
    }

    // Check if all chunks are received
    const allChunksReceived = await areAllChunksReceived(metadata);
    console.log(`Upload ${metadata.uploadId}: All chunks received: ${allChunksReceived}, chunk ${metadata.chunkIndex}/${metadata.totalChunks}`);
    
    if (allChunksReceived) {
      // Update session status
      await supabase
        .from('upload_sessions')
        .update({ status: 'processing' })
        .eq('id', session.id);

      // Combine chunks
      const finalBuffer = await combineChunks(metadata);
      
      // Upload original file to S3
      const cleanOriginalName = metadata.fileName.replace(/\.[^/.]+$/, '');
      const fileExtension = metadata.fileName.split('.').pop() || 'jpg';
      const key = `user-images/${user.id}/${metadata.characterId}/source/${metadata.uploadId}-${cleanOriginalName}.${fileExtension}`;
      const url = await uploadToS3(finalBuffer, key, metadata.fileType);

      // Use original file dimensions (we'll set defaults since we're not processing)
      const safeWidth = 1;
      const safeHeight = 1;

              // Save to images table
        const imageData = {
          id: uuidv4(),
          user_id: user.id,
          character_id: metadata.characterId,
          url: url,
          file_name: `${cleanOriginalName}.${fileExtension}`,
          file_size: finalBuffer.length,
          mime_type: metadata.fileType,
          dimensions: { width: safeWidth, height: safeHeight },
          created_at: new Date().toISOString(),
          quality_score: metadata.qualityScore
        };

      const validatedData = imageSchema.parse(imageData);
      const { error: dbError } = await supabase
        .from('images')
        .insert(validatedData);

      if (dbError) {
        throw new Error(`DB insert failed: ${dbError.message}`);
      }

      // Increment image_count in characters table
      const { error: updateCountError } = await supabase.rpc('increment_image_count', {
        character_id: metadata.characterId
      });

      if (updateCountError) {
        console.error('Failed to update character image count:', updateCountError);
        // Don't fail the upload, just log the error
      }

      // Check if character needs a thumbnail (first image uploaded)
          const { data: character } = await supabase
      .from('characters')
      .select('thumbnail_url')
      .eq('id', metadata.characterId)
        .single();

      // If character doesn't have a thumbnail yet, set it to this image's URL
      if (character && !character.thumbnail_url) {
        await supabase
          .from('characters')
          .update({ thumbnail_url: url })
          .eq('id', metadata.characterId);
        
        console.log(`Set thumbnail for character ${metadata.characterId}: ${url}`);
      }

      // Update character status to 'uploaded' since upload is complete
      await supabase
        .from('characters')
        .update({ status: 'uploaded' })
        .eq('id', metadata.characterId);

      // Clean up chunks and session from database after successful upload
      console.log(`Starting cleanup for upload session: ${session.id}`);
      
      // Count chunks before cleanup for verification
      const { count: chunkCount } = await supabase
        .from('upload_chunks')
        .select('*', { count: 'exact' })
        .eq('session_id', session.id);
        
      console.log(`Found ${chunkCount} chunks to cleanup for session: ${session.id}`);
      
      // Method 1: Delete chunks first, then session
      const { error: deleteChunksError, count: deletedChunksCount } = await supabase
        .from('upload_chunks')
        .delete()
        .eq('session_id', session.id);

      if (deleteChunksError) {
        console.error('Failed to cleanup chunks:', deleteChunksError);
      } else {
        console.log(`Successfully deleted ${deletedChunksCount || 'unknown number of'} chunks for session: ${session.id}`);
      }

      // Delete the session
      const { error: deleteSessionError, count: deletedSessionsCount } = await supabase
        .from('upload_sessions')
        .delete()
        .eq('id', session.id);

      if (deleteSessionError) {
        console.error('Failed to cleanup session:', deleteSessionError);
        
        // Fallback: Try method 2 - force cleanup with direct queries
        console.log('Attempting fallback cleanup method for session:', session.id);
        
        try {
          // Use raw SQL queries to force cleanup
          await supabase.from('upload_chunks').delete().eq('session_id', session.id);
          await supabase.from('upload_sessions').delete().eq('id', session.id);
          console.log('Fallback cleanup completed for session:', session.id);
        } catch (fallbackError) {
          console.error('Fallback cleanup failed:', fallbackError);
          // Log error details for debugging but don't fail the upload
          console.error('Session ID:', session.id);
          console.error('User ID:', user.id);
        }
      } else {
        console.log(`Successfully cleaned up session: ${session.id} (deleted ${deletedSessionsCount || 1} session record)`);
      }
      
      // Verify cleanup was successful
      const { count: remainingChunks } = await supabase
        .from('upload_chunks')
        .select('*', { count: 'exact' })
        .eq('session_id', session.id);
        
      const { count: remainingSessions } = await supabase
        .from('upload_sessions')
        .select('*', { count: 'exact' })
        .eq('id', session.id);
        
      if ((remainingChunks ?? 0) > 0 || (remainingSessions ?? 0) > 0) {
        console.error(`Cleanup verification failed! Remaining chunks: ${remainingChunks ?? 0}, remaining sessions: ${remainingSessions ?? 0}`);
      } else {
        console.log(`Cleanup verification successful - no remaining data for session: ${session.id}`);
      }

      // Clean up temp files
      const tempDir = await getTempDir(metadata.uploadId);
      await fs.rm(tempDir, { recursive: true, force: true });

      return NextResponse.json({ url });
    }

    // Update completed chunks count
    const { count } = await supabase
      .from('upload_chunks')
      .select('*', { count: 'exact' })
      .eq('session_id', session.id)
      .eq('status', 'uploaded');

    await supabase
      .from('upload_sessions')
      .update({ completed_chunks: count })
      .eq('id', session.id);

    // Not the last chunk, just acknowledge receipt
    return NextResponse.json({ received: true });

  } catch (error) {
    console.error('Chunk upload error:', error);
    const message = error instanceof Error ? error.message : 'Internal server error during upload';
    return NextResponse.json({ error: message }, { status: 500 });
  }
} 