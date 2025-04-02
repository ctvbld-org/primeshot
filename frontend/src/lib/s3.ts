import { S3Client, DeleteObjectCommand, HeadObjectCommand, GetObjectCommand } from '@aws-sdk/client-s3';
import { Upload } from '@aws-sdk/lib-storage';
import { createPresignedPost } from '@aws-sdk/s3-presigned-post';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { fileUploadSchema } from './schemas';

// Environment variable validation
const requiredEnvVars = {
  AWS_ACCESS_KEY_ID: process.env.AWS_ACCESS_KEY_ID,
  AWS_SECRET_ACCESS_KEY: process.env.AWS_SECRET_ACCESS_KEY,
  AWS_REGION: process.env.AWS_REGION,
  AWS_S3_BUCKET: process.env.AWS_S3_BUCKET,
};

Object.entries(requiredEnvVars).forEach(([name, value]) => {
  if (!value) {
    throw new Error(`Missing environment variable: ${name}`);
  }
});

// S3 client configuration
export const s3Client = new S3Client({
  region: process.env.AWS_REGION,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
  },
  maxAttempts: 3, // Enable retry with exponential backoff
});

// Allowed file types and max size
const ALLOWED_MIME_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

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

  const upload = new Upload({
    client: s3Client,
    params: {
      Bucket: process.env.AWS_S3_BUCKET!,
      Key: key,
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

// Create presigned URL for upload
export const createPresignedUploadUrl = async (key: string, contentType: string) => {
  if (!ALLOWED_MIME_TYPES.includes(contentType)) {
    throw new S3ValidationError('Invalid file type. Only JPEG, PNG, and WebP are supported.');
  }

  try {
    const { url, fields } = await createPresignedPost(s3Client, {
      Bucket: process.env.AWS_S3_BUCKET!,
      Key: key,
      Conditions: [
        ['content-length-range', 0, MAX_FILE_SIZE],
        ['starts-with', '$Content-Type', 'image/'],
      ],
      Fields: {
        'Content-Type': contentType,
      },
      Expires: 600, // 10 minutes
    });

    return { url, fields };
  } catch (error) {
    console.error('Error creating presigned URL:', error);
    throw new S3UploadError('Failed to create presigned URL', error as Error);
  }
};

// Create presigned URL for reading/downloading
export const createPresignedGetUrl = async (key: string) => {
  try {
    // First check if object exists
    await s3Client.send(new HeadObjectCommand({
      Bucket: process.env.AWS_S3_BUCKET!,
      Key: key,
    }));

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
    // First check if object exists
    await s3Client.send(new HeadObjectCommand({
      Bucket: process.env.AWS_S3_BUCKET!,
      Key: key,
    }));

    await s3Client.send(new DeleteObjectCommand({
      Bucket: process.env.AWS_S3_BUCKET!,
      Key: key,
    }));
  } catch (error) {
    console.error('Error deleting from S3:', error);
    throw new S3UploadError('Failed to delete file from S3', error as Error);
  }
}; 