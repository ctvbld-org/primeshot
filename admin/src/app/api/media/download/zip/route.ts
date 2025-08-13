import { NextRequest } from 'next/server'
import { S3Client, GetObjectCommand, HeadObjectCommand } from '@aws-sdk/client-s3'
import { createZipStreamFromS3 } from '@primeshot/common'

export const runtime = 'nodejs'

const s3 = new S3Client({
  region: process.env.AWS_REGION || 'us-east-1',
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
  },
})

async function getSize(key: string): Promise<number> {
  const head = await s3.send(new HeadObjectCommand({ Bucket: process.env.AWS_S3_BUCKET!, Key: key }))
  return head.ContentLength || 0
}

export async function POST(req: NextRequest) {
  try {
    const { keys }: { keys: string[] } = await req.json()
    if (!Array.isArray(keys) || keys.length === 0) return new Response('Missing keys', { status: 400 })

    const MAX_FILES = 200
    const MAX_BYTES = 150 * 1024 * 1024 // 150MB

    // chunk keys by limits
    const sizes = await Promise.all(keys.map(getSize))
    const chunks: string[][] = []
    let current: string[] = []
    let total = 0
    for (let i = 0; i < keys.length; i++) {
      const k = keys[i]
      const sz = sizes[i]
      if (current.length >= MAX_FILES || total + sz > MAX_BYTES) {
        if (current.length === 0) {
          // single file bigger than threshold; still allow alone
          chunks.push([k])
          total = 0
          current = []
        } else {
          chunks.push(current)
          current = [k]
          total = sz
        }
      } else {
        current.push(k)
        total += sz
      }
    }
    if (current.length) chunks.push(current)

    const boundary = Date.now().toString()
    // Return a JSON manifest of parts so the client can request each part separately
    // This route will be used for per-part zips below with ?part=N
    const { searchParams } = new URL(req.url)
    const partParam = searchParams.get('part')
    if (partParam === null) {
      return new Response(JSON.stringify({ parts: chunks }), { headers: { 'Content-Type': 'application/json' } })
    }

    const partIndex = parseInt(partParam, 10)
    const partKeys = chunks[partIndex]
    if (!partKeys) return new Response('Invalid part', { status: 400 })

    const archive = await createZipStreamFromS3(s3, process.env.AWS_S3_BUCKET!, partKeys)
    const stream = new ReadableStream({
      start(controller) {
        archive.on('data', (d: any) => controller.enqueue(d))
        archive.on('error', (e: any) => controller.error(e))
        archive.on('end', () => controller.close())
      }
    })

    const headers = new Headers()
    headers.set('Content-Type', 'application/zip')
    headers.set('Content-Disposition', `attachment; filename="media-${new Date().toISOString().slice(0,16).replace(/[:T]/g,'-')}-part-${partIndex+1}.zip"`)
    return new Response(stream as any, { headers })
  } catch (e: any) {
    const msg = e?.message || 'zip error'
    return new Response(msg, { status: 500 })
  }
}


