import { NextRequest, NextResponse } from 'next/server'
import { DeleteObjectsCommand, ListObjectsV2Command, S3Client } from '@aws-sdk/client-s3'

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
    const inputKeys: string[] = Array.isArray(body.keys) ? body.keys : []
    if (inputKeys.length === 0) return NextResponse.json({ error: 'No keys' }, { status: 400 })

    // Expand any folder key (ending with /) into its contained objects
    const expanded: string[] = []
    for (const k of inputKeys) {
      if (k.endsWith('/')) {
        let ContinuationToken: string | undefined
        do {
          const list = await s3.send(new ListObjectsV2Command({
            Bucket: process.env.AWS_S3_BUCKET!,
            Prefix: k,
            ContinuationToken,
          }))
          for (const obj of list.Contents || []) {
            if (obj.Key) expanded.push(obj.Key)
          }
          ContinuationToken = list.IsTruncated ? list.NextContinuationToken : undefined
        } while (ContinuationToken)
      } else {
        expanded.push(k)
      }
    }

    if (expanded.length === 0) return NextResponse.json({ success: true, deleted: 0 })

    const chunks = []
    for (let i = 0; i < expanded.length; i += 1000) chunks.push(expanded.slice(i, i + 1000))
    for (const batch of chunks) {
      await s3.send(new DeleteObjectsCommand({
        Bucket: process.env.AWS_S3_BUCKET!,
        Delete: { Objects: batch.map((Key) => ({ Key })) },
      }))
    }

    return NextResponse.json({ success: true, deleted: expanded.length })
  } catch (e) {
    console.error('media/delete error', e)
    return NextResponse.json({ error: 'Failed to delete' }, { status: 500 })
  }
}


