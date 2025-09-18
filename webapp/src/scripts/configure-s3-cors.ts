// Load environment variables first
import { config } from 'dotenv';

const args = process.argv.slice(2);

function resolveEnvPath(): string | undefined {
  if (args.includes('--staging')) return '.env.staging';
  if (args.includes('--prod') || args.includes('--production')) return '.env.production';
  const envArg = args.find(a => a.startsWith('--env='))?.split('=')[1];
  if (envArg) return `.env.${envArg}`;
  return '.env';
}

const envPath = resolveEnvPath();
config({ path: envPath });
console.log(`Using env file: ${envPath}`);

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

// ---- CLI options ----------------------------------------------------------
// --add-origins=https://a.com,https://b.com
// --origin=https://c.com  (repeatable)
// --replace-origins       (overwrite instead of merge)
// --no-env-origin         (do not include NEXT_PUBLIC_APP_URL)

function toOrigin(input?: string | null): string | null {
  if (!input) return null;
  const trimmed = input.trim();
  if (!trimmed) return null;
  try {
    const hasScheme = /^(https?:)?\/\//i.test(trimmed);
    const url = new URL(hasScheme ? trimmed : `https://${trimmed}`);
    return `${url.protocol}//${url.host}`;
  } catch {
    return null;
  }
}

function parseAddedOrigins(argv: string[]): string[] {
  const listArg = argv.find(a => a.startsWith('--add-origins='))?.split('=')[1] || '';
  const repeated = argv.filter(a => a.startsWith('--origin=')).map(a => a.split('=')[1]);
  const raw = [
    ...listArg.split(',').map(s => s.trim()).filter(Boolean),
    ...repeated
  ];
  const set = new Set<string>();
  for (const r of raw) {
    const o = toOrigin(r);
    if (o) set.add(o);
  }
  return Array.from(set);
}

const addedOrigins = parseAddedOrigins(args);
const replaceOrigins = args.includes('--replace-origins');
const includeEnvOrigin = !args.includes('--no-env-origin');
const envOrigin = includeEnvOrigin ? toOrigin(process.env.NEXT_PUBLIC_APP_URL || '') : null;

async function configureCORS() {
  try {
    console.log('🔍 Checking current CORS configuration...');
    
    // Get current CORS configuration
    const getCorsCommand = new GetBucketCorsCommand({
      Bucket: process.env.AWS_S3_BUCKET!
    });

    let currentRules: any[] = [];
    try {
      const currentCors = await s3Client.send(getCorsCommand);
      currentRules = currentCors.CORSRules ? [...currentCors.CORSRules] : [];
      console.log('Current CORS Rules:', JSON.stringify(currentRules, null, 2));
    } catch (corsError) {
      console.log('No existing CORS configuration found');
      currentRules = [];
    }

    // Ensure at least one rule exists that we can modify
    if (currentRules.length === 0) {
      currentRules.push({
        AllowedHeaders: ['*'],
        AllowedMethods: ['GET', 'PUT', 'POST', 'DELETE', 'HEAD'],
        AllowedOrigins: [],
        ExposeHeaders: ['ETag'],
        MaxAgeSeconds: 3600
      });
    }

    const rule = currentRules[0];

    const existing = Array.isArray(rule.AllowedOrigins) ? rule.AllowedOrigins : [];
    const normalizedExisting = existing.map((o: string) => toOrigin(o)).filter(Boolean) as string[];
    const finalSet = new Set<string>(replaceOrigins ? [] : normalizedExisting);

    if (envOrigin) finalSet.add(envOrigin);
    for (const o of addedOrigins) finalSet.add(o);

    if (finalSet.size === 0) {
      throw new Error('No origins specified or found. Provide --add-origins/--origin or ensure NEXT_PUBLIC_APP_URL is set.');
    }

    rule.AllowedOrigins = Array.from(finalSet).sort();

    const corsConfig = {
      Bucket: process.env.AWS_S3_BUCKET!,
      CORSConfiguration: {
        CORSRules: currentRules
      }
    };

    console.log('\n📝 Applying merged CORS configuration...');
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