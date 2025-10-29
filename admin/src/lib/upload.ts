import { getApiUrl } from '@primeshot/common'

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
    // Server-side processing via /api/upload using Sharp
    const form = new FormData()
    form.append('file', file, file.name)
    form.append('uploadPath', finalUploadPath)
    form.append('processVariants', 'true')
    form.append('baseName', baseName)
    form.append('nextNum', String(nextNum))
    form.append('variantWidths', JSON.stringify(variantWidths))

    onProgress?.(10)
    const res = await fetch(getApiUrl('/api/upload'), { method: 'POST', body: form })
    if (!res.ok) throw new Error('Upload failed')
    const data = await res.json()
    onProgress?.(100)

    // Return the base filename for DB storage
    return data.fileName || `${baseName}-${nextNum}.webp`
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
    const form = new FormData()
    form.append('file', file, file.name)
    form.append('uploadPath', uploadPath)
    form.append('processVariants', 'true')
    form.append('baseName', baseName)
    form.append('nextNum', String(nextNum))
    form.append('variantWidths', JSON.stringify(variantWidths))

    onProgress?.(10)
    const res = await fetch(getApiUrl('/api/upload'), { method: 'POST', body: form })
    if (!res.ok) throw new Error('Upload failed')
    const data = await res.json()
    onProgress?.(100)

    return data.fileName || `${baseName}-${nextNum}.webp`
  } catch (error) {
    console.error('Upload error:', error)
    throw new Error('Failed to upload image')
  }
}
