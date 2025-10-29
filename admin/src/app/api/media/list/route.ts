import { NextRequest, NextResponse } from 'next/server'
import { S3Client, ListObjectsV2Command, ListObjectsV2CommandOutput, CommonPrefix, _Object } from '@aws-sdk/client-s3'

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

    // Collect all results across pagination
    const allFolders = new Set<string>()
    const allFiles: Array<{
      key: string
      name: string
      size: number
      lastModified: string | null
      contentType: string | undefined
    }> = []

    let continuationToken: string | undefined = undefined
    let isTruncated = true

    // Paginate through all results
    while (isTruncated) {
      const cmd: ListObjectsV2Command = new ListObjectsV2Command({
        Bucket: process.env.AWS_S3_BUCKET!,
        Prefix: prefix,
        Delimiter: '/',
        MaxKeys: 1000,
        ContinuationToken: continuationToken,
      })
      const res: ListObjectsV2CommandOutput = await s3.send(cmd)

      // Collect folders
      const folders = (res.CommonPrefixes || [])
        .map((p: CommonPrefix) => p.Prefix || '')
        .filter((p: string) => p)
      
      folders.forEach((f: string) => allFolders.add(f))

      // Collect files
      const files = (res.Contents || [])
        .filter((obj: _Object) => obj.Key && obj.Key !== prefix) // skip folder marker
        .map((obj: _Object) => ({
          key: obj.Key!,
          name: obj.Key!.slice(prefix.length),
          size: obj.Size || 0,
          lastModified: obj.LastModified ? new Date(obj.LastModified).toISOString() : null,
          contentType: undefined as string | undefined,
        }))
      
      allFiles.push(...files)

      // Check if there are more results
      isTruncated = res.IsTruncated || false
      continuationToken = res.NextContinuationToken
    }

    // Convert Set to Array and apply filters
    const foldersArray = Array.from(allFolders)
    
    // Exclude face-models only at bucket root
    const filteredFolders = prefix === ''
      ? foldersArray.filter((p) => !p.startsWith('face-models/'))
      : foldersArray

    return NextResponse.json({ folders: filteredFolders, files: allFiles })
  } catch (e) {
    console.error('media/list error', e)
    return NextResponse.json({ error: 'Failed to list media' }, { status: 500 })
  }
}


