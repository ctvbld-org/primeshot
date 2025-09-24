import { NextRequest, NextResponse } from 'next/server'
import sharp from 'sharp'
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3'
import { createClient } from '@/lib/supabase/server'

const s3 = new S3Client({
  region: process.env.AWS_REGION || 'us-east-1',
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
  },
})

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const formData = await req.formData()
    const file = formData.get('file') as File | null
    if (!file) return NextResponse.json({ error: 'Missing file' }, { status: 400 })

    const arrayBuffer = await file.arrayBuffer()
    const input = Buffer.from(arrayBuffer)

    // Center-crop square then resize to 100x100 and output WebP
    const webp = await sharp(input)
      .rotate()
      .resize({ width: 100, height: 100, fit: 'cover', position: 'centre' })
      .webp({ quality: 85 })
      .toBuffer()

    const key = `user-images/${user.id}/avatar.webp`
    const put = new PutObjectCommand({
      Bucket: process.env.AWS_S3_BUCKET!,
      Key: key,
      Body: webp,
      ContentType: 'image/webp',
      CacheControl: 'public, max-age=31536000, immutable',
    })
    await s3.send(put)

    const region = process.env.AWS_REGION || 'us-east-1'
    const url = `https://${process.env.AWS_S3_BUCKET}.s3.${region}.amazonaws.com/${key}`
    return NextResponse.json({ url, key })
  } catch (error) {
    console.error('Avatar upload error:', error)
    return NextResponse.json({ error: 'Failed to upload avatar' }, { status: 500 })
  }
}

export function OPTIONS() { return NextResponse.json({}, { status: 200 }) }


