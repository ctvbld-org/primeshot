import Archiver from 'archiver'
import { Readable as NodeReadable } from 'stream'
import type { S3Client } from '@aws-sdk/client-s3'
import { GetObjectCommand } from '@aws-sdk/client-s3'

export interface ZipPartLimits {
  maxFiles?: number
  maxBytes?: number
}

export async function createZipStreamFromS3(
  s3: S3Client,
  bucket: string,
  keys: string[],
  limits?: ZipPartLimits
) {
  const archive = Archiver('zip', { zlib: { level: 9 } })
  archive.on('warning', (e) => archive.emit('error', e as any))

  let totalBytes = 0
  let fileCount = 0
  async function streamToBuffer(stream: NodeJS.ReadableStream): Promise<Buffer> {
    return new Promise((resolve, reject) => {
      const chunks: Buffer[] = []
      stream.on('data', (chunk) => chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk)))
      stream.on('end', () => resolve(Buffer.concat(chunks)))
      stream.on('error', reject)
    })
  }
  ;(async () => {
    for (const key of keys) {
      if (limits?.maxFiles != null && fileCount >= limits.maxFiles) {
        throw new Error(`zip maxFiles exceeded: ${limits.maxFiles}`)
      }
      const resp = await s3.send(new GetObjectCommand({ Bucket: bucket, Key: key }))
      // Normalize AWS SDK v3 Body to a Buffer for consistent typing across runtimes
      const anyBody = resp.Body as any
      let buffer: Buffer | undefined
      if (typeof anyBody?.transformToByteArray === 'function') {
        const bytes: Uint8Array = await anyBody.transformToByteArray()
        buffer = Buffer.from(bytes)
      } else if (anyBody?.pipe) {
        buffer = await streamToBuffer(anyBody as NodeJS.ReadableStream)
      } else if (anyBody?.transformToWebStream) {
        const nodeStream = NodeReadable.fromWeb(anyBody.transformToWebStream())
        buffer = await streamToBuffer(nodeStream as unknown as NodeJS.ReadableStream)
      }
      if (!buffer) throw new Error(`Missing S3 Body for key: ${key}`)
      const contentLen = Number(resp.ContentLength ?? 0)
      if (limits?.maxBytes != null) {
        // pre-check using ContentLength if present
        if (totalBytes + contentLen > limits.maxBytes) {
          throw new Error(`zip maxBytes exceeded: ${limits.maxBytes}`)
        }
        totalBytes += contentLen
      }
      const name = key.split('/').pop() || 'file'
      archive.append(buffer, { name })
      fileCount += 1
    }
    archive.finalize()
  })().catch((e) => archive.emit('error', e))
  return archive
}


