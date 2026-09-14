import { NextRequest, NextResponse } from 'next/server'

// Simple signer/proxy: maps relative user image paths to our CDN domain.
// Avatar component in @primeshot/common calls this endpoint expecting { url }.
// If a full URL is provided, we just echo it back.

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const original = searchParams.get('url')
    if (!original) {
      return NextResponse.json({ error: 'Missing url parameter' }, { status: 400 })
    }

    // If already absolute (http/https), return as-is
    if (/^https?:\/\//i.test(original)) {
      return NextResponse.json({ url: original })
    }

    // Normalize to path starting at /user-images
    const idx = original.indexOf('user-images')
    const path = idx >= 0 ? `/${original.slice(idx)}` : original

    // Prefer explicit assets base url, otherwise default to CloudFront
    const base = process.env.NEXT_PUBLIC_AWS_DISTRIBUTION || process.env.NEXT_PUBLIC_ASSETS_BASE_URL || ''
    const resolved = `${base}${path.startsWith('/') ? '' : '/'}${path}`
    return NextResponse.json({ url: resolved })
  } catch (error) {
    console.error('Sign endpoint error:', error)
    return NextResponse.json({ error: 'Failed to resolve URL' }, { status: 500 })
  }
}


