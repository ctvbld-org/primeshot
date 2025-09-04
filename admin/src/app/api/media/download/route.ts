import { NextRequest, NextResponse } from 'next/server'
import { GetObjectCommand, S3Client } from '@aws-sdk/client-s3'
import { getSignedUrl } from '@aws-sdk/s3-request-presigner'

const s3 = new S3Client({
  region: process.env.AWS_REGION || 'us-east-1',
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
  },
})

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const single = searchParams.get('key')
    const keys = searchParams.getAll('keys')
    if (!single && keys.length === 0) return NextResponse.json({ error: 'Missing key(s)' }, { status: 400 })

    const toSign = single ? [single] : keys
    const urls: { key: string; url: string }[] = []
    for (const key of toSign) {
      const cmd = new GetObjectCommand({ Bucket: process.env.AWS_S3_BUCKET!, Key: key })
      const url = await getSignedUrl(s3, cmd, { expiresIn: 300 })
      urls.push({ key, url })
    }
    return NextResponse.json(single ? { url: urls[0].url } : { urls })
  } catch (e) {
    console.error('media/download error', e)
    return NextResponse.json({ error: 'Failed to create download link(s)' }, { status: 500 })
  }
}


