function addAwsImageHosts(remotePatterns) {
  const seen = new Set(
    remotePatterns.map((p) => `${p.protocol}://${p.hostname}`)
  )
  const push = (hostname, protocol = 'https') => {
    if (!hostname) return
    const key = `${protocol}://${hostname}`
    if (seen.has(key)) return
    seen.add(key)
    remotePatterns.push({ protocol, hostname })
  }

  push('cdn.primeshot.ai')
  // Keep both buckets allowlisted so local/prod can swap env without a next.config rewrite.
  push('primeshot-uploads-01.s3.us-east-1.amazonaws.com')
  push('primeshot-uploads-02.s3.us-east-1.amazonaws.com')
  push('primeshot-uploads-02.s3.amazonaws.com')

  const bucket = process.env.NEXT_PUBLIC_AWS_S3_BUCKET || process.env.AWS_S3_BUCKET
  const region = process.env.NEXT_PUBLIC_AWS_REGION || process.env.AWS_REGION || 'us-east-1'
  if (bucket) {
    push(`${bucket}.s3.${region}.amazonaws.com`)
    push(`${bucket}.s3.amazonaws.com`)
  }

  const dist = process.env.NEXT_PUBLIC_AWS_DISTRIBUTION
  if (dist) {
    try {
      const url = new URL(dist)
      push(url.hostname, url.protocol.replace(':', ''))
    } catch {
      // ignore invalid CDN URL
    }
  }
}

module.exports = { addAwsImageHosts }
