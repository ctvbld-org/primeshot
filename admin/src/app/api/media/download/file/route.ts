import { NextRequest } from 'next/server'
import { S3Client, GetObjectCommand } from '@aws-sdk/client-s3'

export const runtime = 'nodejs'

const s3 = new S3Client({
  region: process.env.AWS_REGION || 'us-east-1',
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
  },
})

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const key = searchParams.get('key') || ''
  if (!key) return new Response('Missing key', { status: 400 })
  const cmd = new GetObjectCommand({ Bucket: process.env.AWS_S3_BUCKET!, Key: key })
  const obj = await s3.send(cmd)
  const body = obj.Body as ReadableStream
  const basename = key.split('/').pop() || 'file'
  const headers = new Headers()
  headers.set('Content-Type', (obj.ContentType as string) || 'application/octet-stream')
  headers.set('Content-Disposition', `attachment; filename="${basename}"`)
  headers.set('Cache-Control', 'private, max-age=0')
  return new Response(body as any, { headers })
}


