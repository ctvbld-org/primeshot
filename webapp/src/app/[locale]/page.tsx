import { redirect } from 'next/navigation'

export default function LocalePage() {
  // Redirect locale-prefixed requests to the root create page
  const basePath = process.env.NEXT_PUBLIC_VERCEL_TARGET_ENV !== 'local' ? '/create' : ''
  redirect(`${basePath}/`)
}
