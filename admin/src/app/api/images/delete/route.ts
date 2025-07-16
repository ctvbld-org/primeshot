import { NextRequest, NextResponse } from 'next/server'
import { S3Client, DeleteObjectCommand } from '@aws-sdk/client-s3'

// Initialize S3 client with server-side credentials
const s3Client = new S3Client({
  region: process.env.AWS_REGION || 'us-east-1',
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
  },
})

export async function POST(request: NextRequest) {
  try {
    const { images, s3Path } = await request.json()

    // Validate input
    if (!Array.isArray(images) || !s3Path) {
      return NextResponse.json(
        { error: 'Invalid request: images array and s3Path required' },
        { status: 400 }
      )
    }

    // Delete images from S3
    const deletePromises = images.map(async (filename: string) => {
      // Skip if filename is empty or already a full URL
      if (!filename || filename.startsWith('http')) {
        return { filename, status: 'skipped' }
      }

      const key = `${s3Path}/${filename}`
      
      try {
        const command = new DeleteObjectCommand({
          Bucket: process.env.AWS_S3_BUCKET!,
          Key: key,
        })
        
        await s3Client.send(command)
        console.log(`Successfully deleted image: ${key}`)
        return { filename, status: 'deleted' }
      } catch (error) {
        console.error(`Failed to delete image ${key}:`, error)
        return { filename, status: 'failed', error: error instanceof Error ? error.message : 'Unknown error' }
      }
    })

    // Execute all image deletions in parallel
    const results = await Promise.all(deletePromises)

    const deletedCount = results.filter(r => r.status === 'deleted').length
    const failedCount = results.filter(r => r.status === 'failed').length

    return NextResponse.json({ 
      success: true, 
      message: `Processed ${images.length} images: ${deletedCount} deleted, ${failedCount} failed`,
      deletedCount,
      failedCount,
      results
    })

  } catch (error) {
    console.error('Delete images error:', error)
    return NextResponse.json(
      { error: 'Failed to delete images' },
      { status: 500 }
    )
  }
} 