import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { uploadToS3 } from '@/lib/s3';
import sharp from 'sharp';
import { v4 as uuidv4 } from 'uuid';
import { imageSchema } from '@/lib/schemas';
import { ChunkMetadata } from '@/lib/upload-utils';
import { promises as fs } from 'fs';
import path from 'path';
import os from 'os';

// Constants for image processing
const MAX_WIDTH = 2048;
const MAX_HEIGHT = 2048;
const WEBP_QUALITY = 85;

// Get temp directory for chunks
const getTempDir = async (uploadId: string) => {
  const tempDir = path.join(os.tmpdir(), 'primeshot-uploads', uploadId);
  await fs.mkdir(tempDir, { recursive: true });
  return tempDir;
};

// Process image with sharp after all chunks are received
async function processImage(buffer: Buffer) {
  try {
    console.log('Starting image processing...');
    
    const metadata = await sharp(buffer).metadata();
    console.log('Image metadata:', metadata);

    let sharpInstance = sharp(buffer);
    sharpInstance = sharpInstance.rotate();

    if (metadata.width && metadata.height) {
      if (metadata.width > MAX_WIDTH || metadata.height > MAX_HEIGHT) {
        sharpInstance = sharpInstance.resize(MAX_WIDTH, MAX_HEIGHT, {
          fit: 'inside',
          withoutEnlargement: true
        });
      }
    }

    const processedBuffer = await sharpInstance
      .webp({ quality: WEBP_QUALITY })
      .toBuffer();

    console.log('Image processing completed successfully');
    
    return {
      buffer: processedBuffer,
      mimeType: 'image/webp'
    };
  } catch (error: unknown) {
    console.error('Image processing error:', error);
    throw new Error(`Image processing failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

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

    const metadata: ChunkMetadata = JSON.parse(metadataStr);
    const chunkBuffer = Buffer.from(await chunkBlob.arrayBuffer());
    
    // Check if upload session exists or create new one
    let { data: session } = await supabase
      .from('upload_sessions')
      .select()
      .eq('id', metadata.uploadId)
      .single();

    if (!session) {
      const { data: newSession, error: createError } = await supabase
        .from('upload_sessions')
        .insert({
          id: metadata.uploadId,
          user_id: user.id,
          order_id: metadata.orderId,
          file_name: metadata.fileName,
          file_size: metadata.fileSize,
          file_type: metadata.fileType,
          total_chunks: metadata.totalChunks,
          status: 'pending'
        })
        .select()
        .single();

      if (createError) {
        throw new Error(`Failed to create upload session: ${createError.message}`);
      }
      session = newSession;
    }

    // Save chunk and update session
    const { error: chunkError } = await supabase
      .from('upload_chunks')
      .insert({
        session_id: session.id,
        chunk_index: metadata.chunkIndex,
        chunk_size: chunkBuffer.length,
        status: 'uploaded'
      });

    if (chunkError) {
      throw new Error(`Failed to save chunk: ${chunkError.message}`);
    }

    // Save chunk to temp storage
    await saveChunk(chunkBuffer, metadata);

    // Check if all chunks are received
    if (await areAllChunksReceived(metadata)) {
      // Update session status
      await supabase
        .from('upload_sessions')
        .update({ status: 'processing' })
        .eq('id', session.id);

      // Combine chunks and process
      const finalBuffer = await combineChunks(metadata);
      const { buffer: processedBuffer, mimeType } = await processImage(finalBuffer);
      
      // Upload to S3
      const cleanOriginalName = metadata.fileName.replace(/\.[^/.]+$/, '');
      const key = `source-images/${user.id}/${metadata.uploadId}-${cleanOriginalName}.webp`;
      const url = await uploadToS3(processedBuffer, key, mimeType);

      // Get image dimensions
      const { width, height } = await sharp(processedBuffer).metadata();
      const safeWidth = width && width > 0 ? width : 1;
      const safeHeight = height && height > 0 ? height : 1;

      // Save to images table
      const imageData = {
        id: uuidv4(),
        user_id: user.id,
        url: url,
        file_name: `${cleanOriginalName}.webp`,
        file_size: processedBuffer.length,
        mime_type: mimeType,
        dimensions: { width: safeWidth, height: safeHeight },
        created_at: new Date().toISOString()
      };

      const validatedData = imageSchema.parse(imageData);
      const { error: dbError } = await supabase
        .from('images')
        .insert(validatedData);

      if (dbError) {
        throw new Error(`DB insert failed: ${dbError.message}`);
      }

      // Clean up chunks and session from database
      const { error: deleteChunksError } = await supabase
        .from('upload_chunks')
        .delete()
        .eq('session_id', session.id);

      if (deleteChunksError) {
        console.error('Failed to cleanup chunks:', deleteChunksError);
        // Don't throw here as the upload was successful
      }

      const { error: deleteSessionError } = await supabase
        .from('upload_sessions')
        .delete()
        .eq('id', session.id);

      if (deleteSessionError) {
        console.error('Failed to cleanup session:', deleteSessionError);
        // Don't throw here as the upload was successful
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