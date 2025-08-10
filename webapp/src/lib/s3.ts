import { S3Client, DeleteObjectCommand, HeadObjectCommand, GetObjectCommand } from '@aws-sdk/client-s3';
import { Upload } from '@aws-sdk/lib-storage';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { fileUploadSchema } from './schemas';
import { getCloudFrontSignedUrl } from './cloudfront';

// Validate required environment variables
if (!process.env.AWS_ACCESS_KEY_ID || !process.env.AWS_SECRET_ACCESS_KEY) {
  throw new Error('AWS credentials are not properly configured. Please check your environment variables.');
}

// Initialize S3 client once for reuse across requests
export const s3Client = new S3Client({
  region: process.env.NEXT_PUBLIC_AWS_REGION || 'us-east-1',
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  },
});

// Allowed file types and max size
const ALLOWED_MIME_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
const MAX_FILE_SIZE = 8 * 1024 * 1024; // 8MB - Increased limit for larger images

// Folder paths
const SOURCE_IMAGES_FOLDER = 'user-images/';
const APP_IMAGES_FOLDER = 'app-images/';

// Error classes
export class S3UploadError extends Error {
  constructor(message: string, public originalError?: Error) {
    super(message);
    this.name = 'S3UploadError';
  }
}

export class S3ValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'S3ValidationError';
  }
}

// Validate file before upload
const validateUpload = async (buffer: Buffer, mimeType: string) => {
  try {
    if (!ALLOWED_MIME_TYPES.includes(mimeType)) {
      throw new S3ValidationError('Invalid file type. Only JPEG, PNG, and WebP are supported.');
    }

    if (buffer.length > MAX_FILE_SIZE) {
      throw new S3ValidationError(`File size exceeds maximum limit of ${MAX_FILE_SIZE / 1024 / 1024}MB`);
    }
  } catch (error) {
    if (error instanceof Error) {
      throw new S3ValidationError(error.message);
    }
    throw error;
  }
};

// Upload file to S3
export const uploadToS3 = async (buffer: Buffer, key: string, mimeType: string) => {
  await validateUpload(buffer, mimeType);

  // Ensure the file is uploaded to the user-images folder
  const finalKey = key.startsWith(SOURCE_IMAGES_FOLDER) 
    ? key 
    : `${SOURCE_IMAGES_FOLDER}${key}`;

  const upload = new Upload({
    client: s3Client,
    params: {
      Bucket: process.env.AWS_S3_BUCKET!,
      Key: finalKey,
      Body: buffer,
      ContentType: mimeType,
      Metadata: {
        fileSize: buffer.length.toString(),
      },
    },
  });

  try {
    const result = await upload.done();
    return result.Location;
  } catch (error) {
    console.error('Error uploading to S3:', error);
    throw new S3UploadError('Failed to upload file to S3', error as Error);
  }
};

// Upload style image to S3
export const uploadStyleImage = async (file: File, fileName: string, gender: 'default' | 'male' | 'female') => {
  const buffer = Buffer.from(await file.arrayBuffer());
  await validateUpload(buffer, file.type);

  // Ensure we're using webp format for style images (best practice)
  const webpFileName = fileName.endsWith('.webp') 
    ? fileName 
    : `${fileName.replace(/\.[^/.]+$/, '')}.webp`;

  // Create the key with the appropriate gender folder
  const key = `${APP_IMAGES_FOLDER}${gender}/${webpFileName}`;

  const upload = new Upload({
    client: s3Client,
    params: {
      Bucket: process.env.AWS_S3_BUCKET!,
      Key: key,
      Body: buffer,
      ContentType: 'image/webp', // Force WebP content type for style images
      Metadata: {
        originalName: file.name,
        fileSize: file.size.toString(),
        gender: gender,
        type: 'style-image'
      },
    },
  });

  try {
    const result = await upload.done();
    // Construct the S3 URL using environment variables
    const bucket = process.env.AWS_S3_BUCKET;
    const region = process.env.AWS_REGION;
    const s3Url = `https://${bucket}.s3.${region}.amazonaws.com/${key}`;
    
    return {
      url: s3Url,
      key: key,
      filename: webpFileName
    };
  } catch (error) {
    console.error(`Error uploading style image to S3 (${gender}):`, error);
    throw new S3UploadError(`Failed to upload ${gender} style image to S3`, error as Error);
  }
};

// Upload the same image to all gender folders
export const uploadStyleImageAllGenders = async (file: File, fileName: string) => {
  const genders = ['default', 'male', 'female'] as const;
  const results = await Promise.all(
    genders.map(gender => uploadStyleImage(file, fileName, gender))
  );
  
  return {
    filename: results[0].filename,
    urls: {
      default: results[0].url,
      male: results[1].url,
      female: results[2].url
    }
  };
};

// Create presigned URL for reading/downloading
export const createPresignedGetUrl = async (key: string) => {
  try {
    // Handle full URLs (extract just the path part)
    if (key.startsWith('http')) {
      try {
        const url = new URL(key);
        // Extract the path and remove leading slash
        let path = url.pathname.substring(1);
        
        // If path contains bucket name, remove it
        const bucketName = process.env.AWS_S3_BUCKET;
        if (bucketName && path.startsWith(`${bucketName}/`)) {
          path = path.substring(bucketName.length + 1);
        }
        
        key = path;
      } catch (e) {
        console.warn('Failed to parse URL, using as-is:', key);
      }
    }
    
    // Make sure we have a valid key after potential URL parsing
    if (!key) {
      throw new Error('Invalid key provided for presigned URL');
    }

    // Use CloudFront signed URLs for protected paths
    if (key.startsWith('source-images/') || key.startsWith('generated-images/')) {
      return await getCloudFrontSignedUrl(key);
    }
    
    // For other paths, use S3 presigned URLs
    const command = new GetObjectCommand({
      Bucket: process.env.AWS_S3_BUCKET!,
      Key: key,
    });

    return await getSignedUrl(s3Client, command, { expiresIn: 3600 }); // 1 hour
  } catch (error) {
    console.error('Error creating presigned URL:', error);
    throw new S3UploadError('Failed to create presigned URL', error as Error);
  }
};

// Delete file from S3
export const deleteFromS3 = async (key: string): Promise<{ deleted: boolean; key: string }> => {
  try {
    // Ensure we're looking in the correct folder
    const finalKey = key.startsWith(SOURCE_IMAGES_FOLDER) 
      ? key 
      : `${SOURCE_IMAGES_FOLDER}${key}`;
      
    try {
      // First check if object exists
      await s3Client.send(new HeadObjectCommand({
        Bucket: process.env.AWS_S3_BUCKET!,
        Key: finalKey,
      }));
      
      // Object exists, proceed with deletion
      await s3Client.send(new DeleteObjectCommand({
        Bucket: process.env.AWS_S3_BUCKET!,
        Key: finalKey,
      }));
      
      console.log(`✅ Successfully deleted S3 object: ${finalKey}`);
      return { deleted: true, key: finalKey };
      
    } catch (headError: any) {
      // Check if error is specifically "object not found"
      if (headError?.name === 'NotFound' || headError?.$metadata?.httpStatusCode === 404) {
        console.warn(`⚠️ S3 object not found (already deleted?): ${finalKey}`);
        return { deleted: false, key: finalKey };
      }
      
      // For other head errors, still try to delete (object might exist but head failed)
      console.warn(`⚠️ HeadObject failed for ${finalKey}, attempting delete anyway:`, headError);
      
      try {
        await s3Client.send(new DeleteObjectCommand({
          Bucket: process.env.AWS_S3_BUCKET!,
          Key: finalKey,
        }));
        
        console.log(`✅ Successfully deleted S3 object: ${finalKey} (despite head failure)`);
        return { deleted: true, key: finalKey };
        
      } catch (deleteError: any) {
        // If delete also fails and it's a "not found" error, that's OK
        if (deleteError?.name === 'NoSuchKey' || deleteError?.$metadata?.httpStatusCode === 404) {
          console.warn(`⚠️ S3 object not found during delete: ${finalKey}`);
          return { deleted: false, key: finalKey };
        }
        
        // For any other delete error, throw it
        throw deleteError;
      }
    }
  } catch (error) {
    console.error(`❌ Error deleting from S3 (${key}):`, error);
    throw new S3UploadError(`Failed to delete file from S3: ${key}`, error as Error);
  }
};

// Delete entire character folder from S3
export const deleteCharacterFolder = async (characterId: string, userId: string): Promise<{ 
  success: boolean; 
  deletedCount: number; 
  errors: string[] 
}> => {
  try {
    const { ListObjectsV2Command, DeleteObjectsCommand } = await import('@aws-sdk/client-s3');
    
    const folderPrefix = `${SOURCE_IMAGES_FOLDER}${userId}/training/${characterId}/`;
    console.log(`🗂️ Deleting character folder: ${folderPrefix}`);
    
    // List all objects in the character folder
    const listCommand = new ListObjectsV2Command({
      Bucket: process.env.AWS_S3_BUCKET!,
      Prefix: folderPrefix,
    });
    
    const listResponse = await s3Client.send(listCommand);
    const objects = listResponse.Contents || [];
    
    if (objects.length === 0) {
      console.warn(`⚠️ No objects found in character folder: ${folderPrefix}`);
      return { success: true, deletedCount: 0, errors: [] };
    }
    
    console.log(`🗂️ Found ${objects.length} objects in character folder`);
    
    // Use batch deletion for efficiency (like backend implementation)
    const objectsToDelete = objects.filter(obj => obj.Key).map(obj => ({ Key: obj.Key! }));
    
    if (objectsToDelete.length === 0) {
      return { success: true, deletedCount: 0, errors: [] };
    }
    
    const deleteCommand = new DeleteObjectsCommand({
      Bucket: process.env.AWS_S3_BUCKET!,
      Delete: {
        Objects: objectsToDelete,
        Quiet: false,
      },
    });
    
    const deleteResponse = await s3Client.send(deleteCommand);
    
    const deletedCount = deleteResponse.Deleted?.length || 0;
    const s3Errors = deleteResponse.Errors || [];
    const errors = s3Errors.map(err => `Failed to delete ${err.Key}: ${err.Message}`);
    
    if (deletedCount > 0) {
      console.log(`✅ Successfully deleted ${deletedCount} objects from character folder`);
    }
    
    if (errors.length > 0) {
      console.error(`❌ Failed to delete some S3 objects:`, errors);
    }
    
    const success = errors.length === 0;
    console.log(`🗂️ Character folder cleanup complete: ${deletedCount}/${objects.length} deleted, ${errors.length} errors`);
    
    return { success, deletedCount, errors };
    
  } catch (error) {
    console.error(`❌ Error deleting character folder ${characterId}:`, error);
    return { 
      success: false, 
      deletedCount: 0, 
      errors: [`Failed to delete character folder: ${error}`] 
    };
  }
}; 