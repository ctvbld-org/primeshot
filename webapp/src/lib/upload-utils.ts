import { v4 as uuidv4 } from 'uuid';
import { FileWithScore } from './types';
import { createClient } from '@/lib/supabase/client';

// Size of each chunk in bytes (2MB)
export const CHUNK_SIZE = 2 * 1024 * 1024;

export interface ChunkMetadata {
  chunkIndex: number;
  totalChunks: number;
  fileSize: number;
  fileName: string;
  fileType: string;
  uploadId: string;
  characterId: string;
  qualityScore?: number;
  // Optional normalized face box hint from client analysis (0..1)
  faceBox?: { x: number; y: number; width: number; height: number };
  // Marks that this file is the first accepted image in the batch
  isFirstImage?: boolean;
}

export function* createChunks(
  file: FileWithScore & { size: number; slice: File['slice'] },
  characterId: string,
  chunkSize: number = CHUNK_SIZE
): Generator<{ chunk: Blob; metadata: ChunkMetadata }> {
  if (!file.size) {
    console.warn('Empty file provided for chunked upload');
    return;
  }

  const totalChunks = Math.ceil(file.size / chunkSize);
  const uploadId = uuidv4(); // Unique ID for this chunked upload

  for (let chunkIndex = 0; chunkIndex < totalChunks; chunkIndex++) {
    const start = chunkIndex * chunkSize;
    const end = Math.min(start + chunkSize, file.size);
    const chunk = file.slice(start, end);

    const metadata: ChunkMetadata = {
      chunkIndex,
      totalChunks,
      fileSize: file.size,
      fileName: file.name || 'unnamed',
      fileType: file.type || 'application/octet-stream',
      uploadId,
      characterId,
      // API expects an integer (0-100). Round and clamp the score if provided.
      qualityScore: file.score !== undefined ? Math.round(Math.min(100, Math.max(0, file.score))) : undefined,
      faceBox: file.faceBox,
      isFirstImage: file.isFirstImage
    };

    yield { chunk, metadata };
  }
}

export async function uploadChunk(
  chunk: Blob,
  metadata: ChunkMetadata,
  onProgress?: (progress: number) => void
): Promise<Response> {
  const supabase = createClient();
  
  // Get the current session for authentication
  const { data: { session }, error: sessionError } = await supabase.auth.getSession();
  
  if (sessionError || !session) {
    throw new Error('Authentication required for upload');
  }

  const formData = new FormData();
  formData.append('chunk', chunk);
  formData.append('metadata', JSON.stringify(metadata));

  // Use Supabase Edge Function URL
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const edgeFunctionUrl = `${supabaseUrl}/functions/v1/upload-chunk`;

  return new Promise<Response>((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    
    xhr.open('POST', edgeFunctionUrl);
    
    // Add authentication header
    xhr.setRequestHeader('Authorization', `Bearer ${session.access_token}`);
    
    xhr.upload.addEventListener('progress', (event) => {
      if (event.lengthComputable && onProgress) {
        const percentComplete = (event.loaded / event.total) * 100;
        onProgress(percentComplete);
      }
    });
    
    xhr.addEventListener('load', () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        const response = new Response(xhr.response, {
          status: xhr.status,
          headers: {
            'Content-Type': xhr.getResponseHeader('Content-Type') || 'application/json'
          }
        });
        resolve(response);
      } else {
        reject(new Error(`HTTP error ${xhr.status}`));
      }
    });
    
    xhr.addEventListener('error', () => reject(new Error('Network error')));
    xhr.addEventListener('abort', () => reject(new Error('Upload aborted')));
    
    xhr.send(formData);
  });
}

export async function cleanupFailedUpload(uploadId: string): Promise<void> {
  try {
    const supabase = createClient();
    
    // Get the current session for authentication
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    
    if (sessionError || !session) {
      console.warn('Cannot cleanup upload: authentication required');
      return;
    }

    // Delete chunks first (due to foreign key constraint)
    const { error: deleteChunksError } = await supabase
      .from('upload_chunks')
      .delete()
      .eq('session_id', uploadId);

    if (deleteChunksError) {
      console.warn('Failed to cleanup chunks:', deleteChunksError);
    }

    // Delete the upload session
    const { error: deleteSessionError } = await supabase
      .from('upload_sessions')
      .delete()
      .eq('id', uploadId);

    if (deleteSessionError) {
      console.warn('Failed to cleanup session:', deleteSessionError);
    }

    console.log('Successfully cleaned up failed upload:', uploadId);
  } catch (error) {
    console.warn('Error during upload cleanup:', error);
  }
}

// Helper to detect "duplicate chunk" errors coming from either response JSON or thrown Errors
function isDuplicateChunkError(err: any): boolean {
  if (!err) return false;
  // Error instance check
  if (err instanceof Error) {
    return err.message?.toLowerCase().includes('duplicate');
  }
  // API error payload check
  if (typeof err === 'object' && 'error' in err && typeof err.error === 'string') {
    return (err.error as string).toLowerCase().includes('duplicate');
  }
  return false;
}

export async function uploadFileInChunks(
  file: FileWithScore & { size: number; slice: File['slice'] },
  characterId: string,
  onProgress?: (progress: number) => void,
): Promise<string> {
  const chunks = createChunks(file, characterId);
  let uploadedChunks = 0;
  let uploadId: string | null = null;

  try {
    for (const { chunk, metadata } of chunks) {
      uploadId = metadata.uploadId; // Store uploadId for cleanup if needed
      
      let retries = 0;
      const maxRetries = 3;
      let chunkUploaded = false;
      
      while (retries <= maxRetries && !chunkUploaded) {
        try {
          const response = await uploadChunk(chunk, metadata, onProgress);
          
          if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            
            // Check if error is due to duplicate chunk (already uploaded)
            if (isDuplicateChunkError(errorData)) {
              console.log(`Chunk ${metadata.chunkIndex} already exists, continuing...`);
              chunkUploaded = true;
              uploadedChunks++;
              if (onProgress) {
                onProgress((uploadedChunks / metadata.totalChunks) * 100);
              }
              break;
            }
            
            if (retries < maxRetries) {
              retries++;
              console.warn(`Chunk upload failed, retrying (${retries}/${maxRetries})...`);
              // Add exponential backoff with jitter to prevent thundering herd
              await new Promise(resolve => setTimeout(resolve, (1000 * retries) + Math.random() * 1000));
              continue;
            }
            throw new Error(errorData.error || 'Failed to upload chunk');
          }

          // Success response
          chunkUploaded = true;
          uploadedChunks++;
          if (onProgress) {
            onProgress((uploadedChunks / metadata.totalChunks) * 100);
          }

          // If this was the last chunk, get the final URL
          if (uploadedChunks === metadata.totalChunks) {
            const result = await response.json();
            return result.url;
          }
          
        } catch (error) {
          // Check if error message indicates chunk already exists
          if (isDuplicateChunkError(error)) {
            console.log(`Chunk ${metadata.chunkIndex} already uploaded, continuing...`);
            chunkUploaded = true;
            uploadedChunks++;
            if (onProgress) {
              onProgress((uploadedChunks / metadata.totalChunks) * 100);
            }
            break;
          }
          
          if (retries < maxRetries) {
            retries++;
            console.warn(`Chunk upload error, retrying (${retries}/${maxRetries})...`, error);
            // Add exponential backoff with jitter
            await new Promise(resolve => setTimeout(resolve, (1000 * retries) + Math.random() * 1000));
            continue;
          }
          console.error(`Error uploading chunk ${metadata.chunkIndex}:`, error);
          throw error;
        }
      }
      
      if (!chunkUploaded) {
        throw new Error(`Failed to upload chunk ${metadata.chunkIndex} after ${maxRetries} retries`);
      }
    }

    throw new Error('Failed to complete chunked upload');
  } catch (error) {
    // Clean up failed upload if we have an uploadId
    if (uploadId) {
      console.log(`Cleaning up failed upload ${uploadId}...`);
      await cleanupFailedUpload(uploadId);
    }
    throw error;
  }
} 