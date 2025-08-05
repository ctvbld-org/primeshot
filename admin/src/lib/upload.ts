import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3'
import { v4 as uuidv4 } from 'uuid'

// Client-side upload will use API route
const s3Client = null as any // We'll use the API route for uploads

export async function uploadImageToS3(
  file: File,
  uploadPath: string,
  onProgress?: (progress: number) => void
): Promise<string> {
  try {
    // Convert image to WebP
    const webpBlob = await convertToWebP(file)
    
    // Create FormData
    const formData = new FormData()
    formData.append('file', webpBlob, 'image.webp')
    formData.append('uploadPath', uploadPath)

    // Upload via API route
    const response = await fetch('/api/upload', {
      method: 'POST',
      body: formData,
    })

    if (!response.ok) {
      throw new Error('Upload failed')
    }

    const { url } = await response.json()
    
    return url
  } catch (error) {
    console.error('Upload error:', error)
    throw new Error('Failed to upload image')
  }
}

async function convertToWebP(file: File): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    
    reader.onload = (e) => {
      const img = new Image()
      
      img.onload = () => {
        const canvas = document.createElement('canvas')
        const ctx = canvas.getContext('2d')!
        
        // Set max dimensions
        const maxWidth = 1920
        const maxHeight = 1920
        
        let width = img.width
        let height = img.height
        
        // Calculate new dimensions while maintaining aspect ratio
        if (width > maxWidth || height > maxHeight) {
          const aspectRatio = width / height
          
          if (width > height) {
            width = maxWidth
            height = width / aspectRatio
          } else {
            height = maxHeight
            width = height * aspectRatio
          }
        }
        
        canvas.width = width
        canvas.height = height
        
        // Draw and convert to WebP
        ctx.drawImage(img, 0, 0, width, height)
        
        canvas.toBlob(
          (blob) => {
            if (blob) {
              resolve(blob)
            } else {
              reject(new Error('Failed to convert image'))
            }
          },
          'image/webp',
          0.85 // Quality
        )
      }
      
      img.onerror = () => reject(new Error('Failed to load image'))
      img.src = e.target?.result as string
    }
    
    reader.onerror = () => reject(new Error('Failed to read file'))
    reader.readAsDataURL(file)
  })
}

// For server-side upload (API route)
export async function uploadImageFromServer(
  buffer: Buffer,
  uploadPath: string,
  contentType: string
): Promise<string> {
  const fileName = `${uuidv4()}.webp`
  const key = `${uploadPath}/${fileName}`

  const command = new PutObjectCommand({
    Bucket: process.env.AWS_S3_BUCKET!,
    Key: key,
    Body: buffer,
    ContentType: 'image/webp',
  })

  await s3Client.send(command)

  return `https://${process.env.AWS_S3_BUCKET}.s3.${process.env.AWS_REGION || 'us-east-1'}.amazonaws.com/${key}`
}