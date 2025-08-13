import { NextRequest, NextResponse } from 'next/server'
import { S3Client, ListObjectsV2Command } from '@aws-sdk/client-s3'

const s3Client = new S3Client({
  region: process.env.AWS_REGION || 'us-east-1',
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
  },
})

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const prefix = searchParams.get('prefix') || ''
    const max = Math.min(parseInt(searchParams.get('max') || '100', 10) || 100, 100)

    if (!prefix) {
      return NextResponse.json({ error: 'Missing prefix parameter' }, { status: 400 })
    }

    const command = new ListObjectsV2Command({
      Bucket: process.env.AWS_S3_BUCKET!,
      Prefix: prefix.endsWith('/') ? prefix : `${prefix}/`,
      Delimiter: '/',
      MaxKeys: max,
    })

    const res = await s3Client.send(command)
    const contents = res.Contents || []

    const base = prefix.endsWith('/') ? prefix : `${prefix}/`

    const files = contents
      .filter(obj => obj.Key && !obj.Key.endsWith('/'))
      .map(obj => ({
        key: obj.Key!,
        filename: obj.Key!.startsWith(base) ? obj.Key!.slice(base.length) : obj.Key!,
        size: obj.Size || 0,
        lastModified: obj.LastModified ? new Date(obj.LastModified).toISOString() : null,
      }))

    return NextResponse.json({ files })
  } catch (error) {
    console.error('S3 list error:', error)
    return NextResponse.json({ error: 'Failed to list images' }, { status: 500 })
  }
}


