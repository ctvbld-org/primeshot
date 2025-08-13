export async function uploadImageToS3(
  file: File,
  styleName: string,
  existingImages: string[],
  onProgress?: (progress: number) => void,
  uploadPath?: string
): Promise<string> {
  try {
    // Generate filename: [style-name-in-kebab-case]-[n].webp
    const sanitized = (styleName || '').trim().toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-_]/g, '')
    const fallbackStamp = new Date().toISOString().replace(/[-:.TZ]/g, '').slice(0, 14)
    const baseName = sanitized || `img-${fallbackStamp}`
    // Find the next available number
    let maxNum = 0
    const esc = baseName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
    existingImages.forEach(img => {
      const match = img.match(new RegExp(`^${esc}-(\\d+)\\.webp$`))
      if (match) {
        const num = parseInt(match[1], 10)
        if (num > maxNum) maxNum = num
      }
    })
    const nextNum = maxNum + 1
    const finalUploadPath = uploadPath || 'app-images/placeholders/styles'

    // Decide variant widths by upload path
    const isOptions = /app-images\/placeholders\/options/.test(finalUploadPath)
    const variantWidths = isOptions ? [320, 640, 960] : [320, 640, 960, 1280, 1920, 2560]
    const baseWidth = Math.max(...variantWidths)

    // Upload base (largest) without suffix (DB stores this)
    const baseFileName = `${baseName}-${nextNum}.webp`
    const baseBlob = await convertToWebP(file, baseWidth, baseWidth, 0.95)
    await uploadBlob(baseBlob, baseFileName, finalUploadPath)
    onProgress?.(25)

    // Upload smaller variants with -w{width} suffix (exclude baseWidth to avoid duplicate)
    const variantUploads = variantWidths
      .filter((w) => w < baseWidth)
      .map(async (w, idx, arr) => {
        const q = w >= 1280 ? 0.92 : 0.88
        const variantBlob = await convertToWebP(file, w, w, q)
        const name = `${baseName}-${nextNum}-w${w}.webp`
        await uploadBlob(variantBlob, name, finalUploadPath)
        onProgress?.(25 + Math.round(((idx + 1) / arr.length) * 75))
      })
    await Promise.all(variantUploads)

    // Return the base filename for DB storage
    return baseFileName
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
    // Generate filename: [option-name-in-kebab-case]-[n].webp
    const sanitized = (optionName || '').trim().toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-_]/g, '')
    const fallbackStamp = new Date().toISOString().replace(/[-:.TZ]/g, '').slice(0, 14)
    const baseName = sanitized || `img-${fallbackStamp}`
    // Find the next available number
    let maxNum = 0
    const esc = baseName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
    existingImages.forEach(img => {
      const match = img.match(new RegExp(`^${esc}-(\\d+)\\.webp$`))
      if (match) {
        const num = parseInt(match[1], 10)
        if (num > maxNum) maxNum = num
      }
    })
    const nextNum = maxNum + 1
    const uploadPath = 'app-images/placeholders/options'

    // Options cap at 960 and variants [320, 640, 960]
    const variantWidths = [320, 640, 960]
    const baseWidth = 960
    const baseFileName = `${baseName}-${nextNum}.webp`

    const baseBlob = await convertToWebP(file, baseWidth, baseWidth, 0.95)
    await uploadBlob(baseBlob, baseFileName, uploadPath)
    onProgress?.(30)

    const variantUploads = variantWidths
      .filter((w) => w < baseWidth)
      .map(async (w, idx, arr) => {
        const q = w >= 960 ? 0.92 : 0.88
        const variantBlob = await convertToWebP(file, w, w, q)
        const name = `${baseName}-${nextNum}-w${w}.webp`
        await uploadBlob(variantBlob, name, uploadPath)
        onProgress?.(30 + Math.round(((idx + 1) / arr.length) * 70))
      })
    await Promise.all(variantUploads)

    return baseFileName
  } catch (error) {
    console.error('Upload error:', error)
    throw new Error('Failed to upload image')
  }
}

async function convertToWebP(
  file: File,
  maxWidth: number = 2560,
  maxHeight: number = 2560,
  quality: number = 0.95
): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    
    reader.onload = (e) => {
      const img = new Image()
      
      img.onload = () => {
        const canvas = document.createElement('canvas')
        const ctx = canvas.getContext('2d')!
        
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
          quality // Quality
        )
      }
      
      img.onerror = () => reject(new Error('Failed to load image'))
      img.src = e.target?.result as string
    }
    
    reader.onerror = () => reject(new Error('Failed to read file'))
    reader.readAsDataURL(file)
  })
}

async function uploadBlob(blob: Blob, fileName: string, uploadPath: string): Promise<void> {
  const formData = new FormData()
  const wrapped = new File([blob], fileName, { type: 'image/webp' })
  formData.append('file', wrapped, fileName)
  formData.append('uploadPath', uploadPath)
  const res = await fetch('/api/upload', { method: 'POST', body: formData })
  if (!res.ok) throw new Error('Upload failed')
}