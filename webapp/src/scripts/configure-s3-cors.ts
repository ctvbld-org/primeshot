// Load environment variables first
import { config } from 'dotenv';

config();

// Now import AWS-related modules
import { S3Client } from '@aws-sdk/client-s3';
import { GetBucketCorsCommand, PutBucketCorsCommand } from '@aws-sdk/client-s3';

// Create S3 client instance
const s3Client = new S3Client({
  region: process.env.AWS_REGION,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
  }
});

// Verify required environment variables
const requiredEnvVars = {
  AWS_ACCESS_KEY_ID: process.env.AWS_ACCESS_KEY_ID,
  AWS_SECRET_ACCESS_KEY: process.env.AWS_SECRET_ACCESS_KEY,
  AWS_REGION: process.env.AWS_REGION,
  AWS_S3_BUCKET: process.env.AWS_S3_BUCKET,
};

Object.entries(requiredEnvVars).forEach(([name, value]) => {
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
});

async function configureCORS() {
  try {
    console.log('🔍 Checking current CORS configuration...');
    
    // Get current CORS configuration
    const getCorsCommand = new GetBucketCorsCommand({
      Bucket: process.env.AWS_S3_BUCKET!
    });

    try {
      const currentCors = await s3Client.send(getCorsCommand);
      console.log('Current CORS Rules:', JSON.stringify(currentCors.CORSRules, null, 2));
    } catch (corsError) {
      console.log('No existing CORS configuration found');
    }

    const url_prefix = process.env.VERCEL_TARGET_ENV === 'local' ? 'http://' : 'https://'
    const APP_URL = new URL(url_prefix + process.env.VERCEL_PROJECT_PRODUCTION_URL);
 
    // Set up CORS configuration
    const corsConfig = {
      Bucket: process.env.AWS_S3_BUCKET!,
      CORSConfiguration: {
        CORSRules: [
          {
            AllowedHeaders: ['*'],
            AllowedMethods: ['GET', 'PUT', 'POST', 'DELETE', 'HEAD'],
            AllowedOrigins: [
              APP_URL.toString()
            ],
            ExposeHeaders: ['ETag'],
            MaxAgeSeconds: 3600
          }
        ]
      }
    };

    console.log('\n📝 Applying new CORS configuration...');
    const putCorsCommand = new PutBucketCorsCommand(corsConfig);
    await s3Client.send(putCorsCommand);
    
    console.log('✅ CORS configuration updated successfully!');
    
    // Verify the new configuration
    console.log('\n🔍 Verifying new CORS configuration...');
    const verifyConfig = await s3Client.send(getCorsCommand);
    console.log('New CORS Rules:', JSON.stringify(verifyConfig.CORSRules, null, 2));
    
  } catch (error) {
    console.error('❌ Error configuring CORS:', error);
    throw error;
  }
}

configureCORS().catch(console.error); 