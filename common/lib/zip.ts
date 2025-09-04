import Archiver from 'archiver'
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
  ;(async () => {
    for (const key of keys) {
      if (limits?.maxFiles != null && fileCount >= limits.maxFiles) {
        throw new Error(`zip maxFiles exceeded: ${limits.maxFiles}`)
      }
      const resp = await s3.send(new GetObjectCommand({ Bucket: bucket, Key: key }))
      const body = resp.Body as NodeJS.ReadableStream | undefined
      if (!body) throw new Error(`Missing S3 Body for key: ${key}`)
      const contentLen = Number(resp.ContentLength ?? 0)
      if (limits?.maxBytes != null) {
        // pre-check using ContentLength if present
        if (totalBytes + contentLen > limits.maxBytes) {
          throw new Error(`zip maxBytes exceeded: ${limits.maxBytes}`)
        }
        totalBytes += contentLen
      }
      const name = key.split('/').pop() || 'file'
      archive.append(body, { name })
      fileCount += 1
    }
    archive.finalize()
  })().catch((e) => archive.emit('error', e))
  return archive
}


