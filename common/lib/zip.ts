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
  keys: string[]
) {
  const archive = Archiver('zip', { zlib: { level: 9 } })
  ;(async () => {
    for (const key of keys) {
      const resp = await s3.send(new GetObjectCommand({ Bucket: bucket, Key: key }))
      const body = resp.Body as any
      const name = key.split('/').pop() || 'file'
      archive.append(body as any, { name })
    }
    archive.finalize()
  })().catch((e) => archive.emit('error', e))
  return archive
}


