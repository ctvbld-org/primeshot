import { NextRequest, NextResponse } from 'next/server'
import { S3Client, ListObjectsV2Command } from '@aws-sdk/client-s3'

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
    const prefixParam = searchParams.get('prefix') || ''
    const prefix = prefixParam === '/' ? '' : prefixParam
    const max = Math.min(parseInt(searchParams.get('max') || '1000', 10) || 1000, 1000)

    const cmd = new ListObjectsV2Command({
      Bucket: process.env.AWS_S3_BUCKET!,
      Prefix: prefix,
      Delimiter: '/',
      MaxKeys: max,
    })
    const res = await s3.send(cmd)

    const folders = (res.CommonPrefixes || [])
      .map((p) => p.Prefix || '')
      .filter((p) => p)

    // Exclude face-models only at bucket root
    const filteredFolders = prefix === ''
      ? folders.filter((p) => !p.startsWith('face-models/'))
      : folders

    const files = (res.Contents || [])
      .filter((obj) => obj.Key && obj.Key !== prefix) // skip folder marker
      .map((obj) => ({
        key: obj.Key!,
        name: obj.Key!.slice(prefix.length),
        size: obj.Size || 0,
        lastModified: obj.LastModified ? new Date(obj.LastModified).toISOString() : null,
        contentType: undefined as string | undefined,
      }))

    return NextResponse.json({ folders: filteredFolders, files })
  } catch (e) {
    console.error('media/list error', e)
    return NextResponse.json({ error: 'Failed to list media' }, { status: 500 })
  }
}


