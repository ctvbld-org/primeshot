import { NextRequest } from 'next/server'
import { S3Client, GetObjectCommand } from '@aws-sdk/client-s3'
import sharp from 'sharp'

export const runtime = 'nodejs'

const s3 = new S3Client({
  region: process.env.AWS_REGION || 'us-east-1',
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
  },
})

async function streamToBuffer(stream: any): Promise<Buffer> {
  const chunks: Buffer[] = []
  return new Promise((resolve, reject) => {
    stream.on('data', (chunk: Buffer) => chunks.push(Buffer.from(chunk)))
    stream.on('end', () => resolve(Buffer.concat(chunks)))
    stream.on('error', (err: any) => reject(err))
  })
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const key = searchParams.get('key') || ''
    const w = Math.max(32, Math.min(parseInt(searchParams.get('w') || '480', 10) || 480, 2048))
    if (!key) return new Response('Missing key', { status: 400 })

    const cmd = new GetObjectCommand({ Bucket: process.env.AWS_S3_BUCKET!, Key: key })
    const obj = await s3.send(cmd)
    const body = obj.Body as any
    const buf = await streamToBuffer(body)

    // Resize inside bounds, no upscaling, convert to webp
    const out = await sharp(buf)
      .rotate() // respect EXIF
      .resize({ width: w, withoutEnlargement: true, fit: 'inside' })
      .webp({ quality: 85 })
      .toBuffer()

    const headers = new Headers()
    headers.set('Content-Type', 'image/webp')
    headers.set('Cache-Control', 'public, max-age=86400, immutable')
    return new Response(out, { headers })
  } catch (e) {
    console.error('thumbnail error', e)
    return new Response('Error', { status: 500 })
  }
}


