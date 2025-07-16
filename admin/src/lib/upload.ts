export async function uploadImageToS3(
  file: File,
  styleName: string,
  existingImages: string[],
  onProgress?: (progress: number) => void,
  uploadPath?: string
): Promise<string> {
  try {
    // Convert image to WebP
    const webpBlob = await convertToWebP(file)

    // Generate filename: [style-name-in-kebab-case]-[n].webp
    const baseName = styleName.trim().toLowerCase().replace(/\s+/g, '-')
    // Find the next available number
    let maxNum = 0
    existingImages.forEach(img => {
      const match = img.match(new RegExp(`^${baseName}-(\\d+)\\.webp$`))
      if (match) {
        const num = parseInt(match[1], 10)
        if (num > maxNum) maxNum = num
      }
    })
    const nextNum = maxNum + 1
    const fileName = `${baseName}-${nextNum}.webp`
    const finalUploadPath = uploadPath || 'app-images/placeholders/styles'

    // Create FormData
    const formData = new FormData()
    formData.append('file', webpBlob, fileName)
    formData.append('uploadPath', finalUploadPath)

    // Upload via API route
    const response = await fetch('/api/upload', {
      method: 'POST',
      body: formData,
    })

    if (!response.ok) {
      throw new Error('Upload failed')
    }

    // Only return the filename for DB storage
    return fileName
  } catch (error) {
    console.error('Upload error:', error)
    throw new Error('Failed to upload image')
  }
}

export async function uploadOptionImageToS3(
  file: File,
  optionName: string,
  existingImages: string[],
  onProgress?: (progress: number) => void
): Promise<string> {
  try {
    // Convert image to WebP
    const webpBlob = await convertToWebP(file)

    // Generate filename: [option-name-in-kebab-case]-[n].webp
    const baseName = optionName.trim().toLowerCase().replace(/\s+/g, '-')
    // Find the next available number
    let maxNum = 0
    existingImages.forEach(img => {
      const match = img.match(new RegExp(`^${baseName}-(\\d+)\\.webp$`))
      if (match) {
        const num = parseInt(match[1], 10)
        if (num > maxNum) maxNum = num
      }
    })
    const nextNum = maxNum + 1
    const fileName = `${baseName}-${nextNum}.webp`
    const uploadPath = 'app-images/placeholders/options'

    // Create FormData
    const formData = new FormData()
    formData.append('file', webpBlob, fileName)
    formData.append('uploadPath', uploadPath)

    // Upload via API route
    const response = await fetch('/api/upload', {
      method: 'POST',
      body: formData,
    })

    if (!response.ok) {
      throw new Error('Upload failed')
    }

    // Only return the filename for DB storage
    return fileName
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