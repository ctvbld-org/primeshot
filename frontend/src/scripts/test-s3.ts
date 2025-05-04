// Load environment variables first
import { config } from 'dotenv';

config();

// Now import AWS-related modules
import { S3Client } from '@aws-sdk/client-s3';
import { HeadBucketCommand, ListObjectsV2Command, PutObjectCommand, GetObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3';
import { Upload } from '@aws-sdk/lib-storage';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

// Create S3 client instance
const s3Client = new S3Client({
  region: process.env.AWS_REGION,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
  }
});

// Utility functions
async function uploadToS3(file: File, key: string) {
  const upload = new Upload({
    client: s3Client,
    params: {
      Bucket: process.env.AWS_S3_BUCKET!,
      Key: key,
      Body: file,
      ContentType: file.type,
    },
  });

  const result = await upload.done();
  return result.Location;
}

async function createPresignedGetUrl(key: string) {
  const command = new GetObjectCommand({
    Bucket: process.env.AWS_S3_BUCKET!,
    Key: key,
  });

  return await getSignedUrl(s3Client, command, { expiresIn: 3600 });
}

async function deleteFromS3(key: string) {
  await s3Client.send(new DeleteObjectCommand({
    Bucket: process.env.AWS_S3_BUCKET!,
    Key: key,
  }));
}

async function testS3Configuration() {
  try {
    // Test 1: Verify bucket exists and is accessible
    console.log('🔍 Testing bucket access...');
    await s3Client.send(new HeadBucketCommand({
      Bucket: process.env.AWS_S3_BUCKET!
    }));
    console.log('✅ Bucket exists and is accessible');

    // Test 2: Verify folder structure
    console.log('\n🔍 Checking folder structure...');
    const folders = ['source-images', 'generated-images'];
    for (const folder of folders) {
      const command = new ListObjectsV2Command({
        Bucket: process.env.AWS_S3_BUCKET!,
        Prefix: `${folder}/`,
        MaxKeys: 1
      });
      const response = await s3Client.send(command);
      
      if (!response.Contents?.length) {
        console.log(`📁 Creating ${folder} folder...`);
        await s3Client.send(new PutObjectCommand({
          Bucket: process.env.AWS_S3_BUCKET!,
          Key: `${folder}/`,
          Body: ''
        }));
        console.log(`✅ Created ${folder} folder`);
      } else {
        console.log(`✅ ${folder} folder exists`);
      }
    }

    // Test 3: Test CORS by attempting a test upload
    console.log('\n🔍 Testing CORS configuration...');
    const testBuffer = Buffer.from('test image data');
    const testBlob = new Blob([testBuffer], { type: 'image/jpeg' });
    const testFile = new File([testBlob], 'test.jpg', { type: 'image/jpeg' });
    const testKey = 'source-images/test-cors.jpg';
    
    try {
      await uploadToS3(testFile, testKey);
      console.log('✅ Upload test successful');
      
      const url = await createPresignedGetUrl(testKey);
      console.log('✅ Presigned URL generation successful');
      console.log('🔗 Test URL:', url);
      
      await deleteFromS3(testKey);
      console.log('✅ Delete test successful');
    } catch (error) {
      console.error('❌ CORS test failed:', error);
      throw error;
    }

    console.log('\n✨ All S3 tests passed successfully!');
  } catch (error) {
    console.error('\n❌ S3 configuration test failed:', error);
    throw error;
  }
}

testS3Configuration().catch(console.error); 