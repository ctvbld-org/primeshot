import { NextRequest, NextResponse } from 'next/server'
import { PutObjectCommand, S3Client } from '@aws-sdk/client-s3'

const s3 = new S3Client({
  region: process.env.AWS_REGION || 'us-east-1',
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
  },
})

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}))
    const key = String(body.key || '')
    if (!key || !key.endsWith('/')) {
      return NextResponse.json({ error: 'Key must end with /' }, { status: 400 })
    }
    // Prevent creating under face-models at root
    if (key.startsWith('face-models/')) {
      return NextResponse.json({ error: 'Not allowed' }, { status: 403 })
    }
    await s3.send(new PutObjectCommand({
      Bucket: process.env.AWS_S3_BUCKET!,
      Key: key,
      Body: new Uint8Array(),
    }))
    return NextResponse.json({ success: true })
  } catch (e) {
    console.error('media/folder error', e)
    return NextResponse.json({ error: 'Failed to create folder' }, { status: 500 })
  }
}


