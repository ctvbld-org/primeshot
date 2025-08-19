import { NextRequest, NextResponse } from 'next/server'
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3'

// Initialize S3 client with server-side credentials
const s3Client = new S3Client({
  region: process.env.AWS_REGION || 'us-east-1',
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
  },
})

// Helper function to get MIME type from file extension
function getMimeType(fileName: string): string {
  const ext = fileName.toLowerCase().split('.').pop()
  const mimeTypes: Record<string, string> = {
    'json': 'application/json',
    'txt': 'text/plain',
    'md': 'text/markdown',
    'yaml': 'application/x-yaml',
    'yml': 'application/x-yaml',
    'xml': 'application/xml',
    'csv': 'text/csv',
    'js': 'application/javascript',
    'ts': 'application/typescript',
    'py': 'text/x-python',
    'sh': 'application/x-sh',
    'bat': 'application/x-bat',
    'cfg': 'text/plain',
    'conf': 'text/plain',
    'log': 'text/plain',
    // Image types
    'png': 'image/png',
    'jpg': 'image/jpeg',
    'jpeg': 'image/jpeg',
    'gif': 'image/gif',
    'webp': 'image/webp',
    'svg': 'image/svg+xml',
    'bmp': 'image/bmp',
    'ico': 'image/x-icon',
    // Other common types
    'pdf': 'application/pdf',
    'zip': 'application/zip',
    'tar': 'application/x-tar',
    'gz': 'application/gzip'
  }
  return mimeTypes[ext || ''] || 'application/octet-stream'
}

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const file = formData.get('file') as File
    const uploadPath = formData.get('uploadPath') as string
    const isDirectUpload = formData.get('directUpload') === 'true'

    console.log('Upload API called with:', {
      fileName: file?.name,
      fileSize: file?.size,
      uploadPath,
      isDirectUpload
    })

    if (!file || !uploadPath) {
      console.log('Missing file or upload path')
      return NextResponse.json(
        { error: 'Missing file or upload path' },
        { status: 400 }
      )
    }

    // Convert file to buffer
    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)

    // Use the filename provided by the frontend
    const fileName = file.name
    const key = `${uploadPath}/${fileName}`

    // Determine content type
    const contentType = isDirectUpload 
      ? getMimeType(fileName) 
      : (file.type || 'image/webp')

    // Upload to S3
    const command = new PutObjectCommand({
      Bucket: process.env.AWS_S3_BUCKET!,
      Key: key,
      Body: buffer,
      ContentType: contentType,
    })

    await s3Client.send(command)

    console.log('Successfully uploaded file to S3:', key)

    // Return the S3 URL (optional, but not used for DB storage)
    const url = `https://${process.env.AWS_S3_BUCKET}.s3.${process.env.AWS_REGION || 'us-east-1'}.amazonaws.com/${key}`
    return NextResponse.json({ url })
  } catch (error) {
    console.error('S3 upload error:', error)
    return NextResponse.json(
      { error: 'Failed to upload file' },
      { status: 500 }
    )
  }
}