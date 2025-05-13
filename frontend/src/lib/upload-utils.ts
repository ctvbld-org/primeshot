import { v4 as uuidv4 } from 'uuid';
import { FileWithScore } from './types';

// Size of each chunk in bytes (2MB)
export const CHUNK_SIZE = 2 * 1024 * 1024;

export interface ChunkMetadata {
  chunkIndex: number;
  totalChunks: number;
  fileSize: number;
  fileName: string;
  fileType: string;
  uploadId: string;
  orderId: string;
  qualityScore?: number;
}

export function* createChunks(file: FileWithScore, orderId: string, chunkSize: number = CHUNK_SIZE) {
  // Handle empty files
  if (file.size === 0) {
    const metadata: ChunkMetadata = {
      chunkIndex: 0,
      totalChunks: 1,
      fileSize: 0,
      fileName: file.name,
      fileType: file.type,
      uploadId: uuidv4(),
      orderId,
      qualityScore: 0
    };
    yield { chunk: new Blob(), metadata };
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
      fileName: file.name,
      fileType: file.type,
      uploadId,
      orderId,
      qualityScore: file.score
    };

    yield { chunk, metadata };
  }
}

export async function uploadChunk(
  chunk: Blob,
  metadata: ChunkMetadata,
  onProgress?: (progress: number) => void
): Promise<Response> {
  const formData = new FormData();
  formData.append('chunk', chunk);
  formData.append('metadata', JSON.stringify(metadata));

  return new Promise<Response>((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    
    xhr.open('POST', '/api/upload-chunk');
    
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

export async function uploadFileInChunks(
  file: File,
  orderId: string,
  onProgress?: (progress: number) => void,
): Promise<string> {
  const chunks = createChunks(file, orderId);
  let uploadedChunks = 0;

  for (const { chunk, metadata } of chunks) {

    let retries = 0;
    const maxRetries = 3;
    
    while (retries <= maxRetries) {
      try {
        const response = await uploadChunk(chunk, metadata, onProgress);
        
        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          if (retries < maxRetries) {
            retries++;
            console.warn(`Chunk upload failed, retrying (${retries}/${maxRetries})...`);
            continue;
          }
          throw new Error(errorData.error || 'Failed to upload chunk');
        }

        uploadedChunks++;
        if (onProgress) {
          onProgress((uploadedChunks / metadata.totalChunks) * 100);
        }

        // If this was the last chunk, get the final URL
        if (uploadedChunks === metadata.totalChunks) {
          const result = await response.json();
          return result.url;
        }
        break; // Exit retry loop on success
      } catch (error) {
        if (retries < maxRetries) {
          retries++;
          console.warn(`Chunk upload error, retrying (${retries}/${maxRetries})...`, error);
          await new Promise(resolve => setTimeout(resolve, 1000 * retries)); // Exponential backoff
          continue;
        }
        console.error(`Error uploading chunk ${metadata.chunkIndex}:`, error);
        throw error;
      }
    }
  }

  throw new Error('Failed to complete chunked upload');
} 