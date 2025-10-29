import { NextRequest, NextResponse } from 'next/server'
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3'
import sharp from 'sharp'

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
    const processVariants = formData.get('processVariants') === 'true'

    // Optional fields for server-side processing
    const baseName = (formData.get('baseName') as string) || ''
    const nextNumRaw = (formData.get('nextNum') as string) || ''
    const variantWidthsRaw = (formData.get('variantWidths') as string) || ''

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

    // Helper to upload a buffer to S3
    async function putToS3(key: string, body: Buffer, contentType: string) {
      const cmd = new PutObjectCommand({
        Bucket: process.env.AWS_S3_BUCKET!,
        Key: key,
        Body: body,
        ContentType: contentType,
      })
      await s3Client.send(cmd)
    }

    // If requested, process server-side image variants using sharp
    if (processVariants) {
      const bytes = await file.arrayBuffer()
      const inputBuffer = Buffer.from(bytes)
      let variantWidths: number[] = []
      try {
        variantWidths = variantWidthsRaw ? JSON.parse(variantWidthsRaw) : []
      } catch {
        // ignore, fall back to defaults
      }
      // For Stripe product images, output a single PNG (no variants)
      if (uploadPath.includes('website-images/stripes')) {
        const baseFileName = `${baseName || 'img'}-${nextNumRaw || '1'}.png`
        const pngBuffer = await sharp(inputBuffer)
          .rotate()
          .resize({ width: 1024, withoutEnlargement: true, fit: 'inside', kernel: sharp.kernel.lanczos3 })
          .png()
          .toBuffer()
        await putToS3(`${uploadPath}/${baseFileName}`, pngBuffer, 'image/png')
        console.log('Uploaded Stripe PNG image to S3 at', `${uploadPath}/${baseFileName}`)
        return NextResponse.json({ fileName: baseFileName })
      }

      // Default: WebP variants workflow
      if (!Array.isArray(variantWidths) || variantWidths.length === 0) {
        variantWidths = [320, 640, 960, 1280, 1920, 2560]
      }
      const maxWidth = Math.max(...variantWidths)
      const baseFileName = `${baseName || 'img'}-${nextNumRaw || '1'}.webp`

      async function buildWebp(width: number, quality: number) {
        return await sharp(inputBuffer)
          .rotate()
          .resize({ width, height: width, fit: 'inside', withoutEnlargement: true, kernel: sharp.kernel.lanczos3 })
          .sharpen()
          .webp({ quality, effort: 5, nearLossless: false, smartSubsample: false })
          .toBuffer()
      }

      const baseBuffer = await buildWebp(maxWidth, maxWidth >= 1280 ? 92 : 90)
      await putToS3(`${uploadPath}/${baseFileName}`, baseBuffer, 'image/webp')

      const smaller = variantWidths.filter((w) => w < maxWidth).sort((a, b) => a - b)
      for (const w of smaller) {
        const q = w >= 1280 ? 92 : 88
        const buf = await buildWebp(w, q)
        const name = `${baseName || 'img'}-${nextNumRaw || '1'}-w${w}.webp`
        await putToS3(`${uploadPath}/${name}`, buf, 'image/webp')
      }

      console.log('Successfully uploaded processed variants to S3 at', uploadPath)
      return NextResponse.json({ fileName: baseFileName })
    }

    // Default: upload the file as-is
    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)

    const fileName = file.name
    const key = `${uploadPath}/${fileName}`

    const contentType = isDirectUpload
      ? getMimeType(fileName)
      : (file.type || 'image/webp')

    await putToS3(key, buffer, contentType)

    console.log('Successfully uploaded file to S3:', key)

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