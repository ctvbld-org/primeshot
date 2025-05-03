import { S3Client, DeleteObjectCommand, HeadObjectCommand, GetObjectCommand } from '@aws-sdk/client-s3';
import { Upload } from '@aws-sdk/lib-storage';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { fileUploadSchema } from './schemas';

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
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

// Folder paths
const SOURCE_IMAGES_FOLDER = 'source-images/';
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
const validateFile = async (file: File) => {
  try {
    await fileUploadSchema.parseAsync({
      file,
      contentType: file.type,
      maxSize: MAX_FILE_SIZE,
    });

    if (!ALLOWED_MIME_TYPES.includes(file.type)) {
      throw new S3ValidationError('Invalid file type. Only JPEG, PNG, and WebP are supported.');
    }

    if (file.size > MAX_FILE_SIZE) {
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
export const uploadToS3 = async (file: File, key: string) => {
  await validateFile(file);

  // Ensure the file is uploaded to the source-images folder
  const finalKey = key.startsWith(SOURCE_IMAGES_FOLDER) 
    ? key 
    : `${SOURCE_IMAGES_FOLDER}${key}`;

  const upload = new Upload({
    client: s3Client,
    params: {
      Bucket: process.env.AWS_S3_BUCKET!,
      Key: finalKey,
      Body: file,
      ContentType: file.type,
      Metadata: {
        originalName: file.name,
        fileSize: file.size.toString(),
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
  await validateFile(file);

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
      Body: file,
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
    
    // We don't need to force the source-images prefix - just use whatever path is in the database
    // This handles both source-images/ and app-images/ paths
    const command = new GetObjectCommand({
      Bucket: process.env.AWS_S3_BUCKET!,
      Key: key,
    });

    return await getSignedUrl(s3Client, command, { expiresIn: 3600 }); // 1 hour
  } catch (error) {
    console.error('Error creating presigned get URL:', error);
    throw new S3UploadError('Failed to create presigned get URL', error as Error);
  }
};

// Delete file from S3
export const deleteFromS3 = async (key: string) => {
  try {
    // Ensure we're looking in the correct folder
    const finalKey = key.startsWith(SOURCE_IMAGES_FOLDER) 
      ? key 
      : `${SOURCE_IMAGES_FOLDER}${key}`;
      
    // First check if object exists
    await s3Client.send(new HeadObjectCommand({
      Bucket: process.env.AWS_S3_BUCKET!,
      Key: finalKey,
    }));

    await s3Client.send(new DeleteObjectCommand({
      Bucket: process.env.AWS_S3_BUCKET!,
      Key: finalKey,
    }));
  } catch (error) {
    console.error('Error deleting from S3:', error);
    throw new S3UploadError('Failed to delete file from S3', error as Error);
  }
}; 