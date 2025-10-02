export async function uploadImageToS3(
  file: File,
  styleName: string,
  existingImages: string[],
  onProgress?: (progress: number) => void,
  uploadPath?: string
): Promise<string> {
  try {
    // Generate base name from style name and enforce presence for styles
    const finalUploadPath = uploadPath || 'app-images/placeholders/styles'
    const isStyleUpload = /app-images\/placeholders\/styles/.test(finalUploadPath)
    const sanitized = (styleName || '').trim().toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-_]/g, '')
    if (isStyleUpload && !sanitized) {
      throw new Error('Style name is required for style image uploads')
    }
    const baseName = sanitized || 'img'

    // Determine next number by scanning S3 (authoritative), falling back to current form list
    let maxNum = 0
    try {
      const params = new URLSearchParams({ prefix: finalUploadPath, max: '500' })
      const res = await fetch(`/api/images/list?${params.toString()}`)
      if (res.ok) {
        const json = await res.json()
        const files: { filename: string }[] = Array.isArray(json?.files) ? json.files : []
        const esc = baseName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
        for (const f of files) {
          const m = String(f.filename || '').match(new RegExp(`^${esc}-(\\d+)\\.webp$`))
          if (m) {
            const n = parseInt(m[1], 10)
            if (!Number.isNaN(n) && n > maxNum) maxNum = n
          }
        }
      }
    } catch {
      // ignore, will fall back to existingImages array below
    }

    if (maxNum === 0) {
      const esc2 = baseName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
      existingImages.forEach(img => {
        const match = img.match(new RegExp(`^${esc2}-(\\d+)\\.webp$`))
        if (match) {
          const num = parseInt(match[1], 10)
          if (num > maxNum) maxNum = num
        }
      })
    }

    const nextNum = maxNum + 1

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
    const res = await fetch('/api/upload', { method: 'POST', body: form })
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
    const res = await fetch('/api/upload', { method: 'POST', body: form })
    if (!res.ok) throw new Error('Upload failed')
    const data = await res.json()
    onProgress?.(100)

    return data.fileName || `${baseName}-${nextNum}.webp`
  } catch (error) {
    console.error('Upload error:', error)
    throw new Error('Failed to upload image')
  }
}
