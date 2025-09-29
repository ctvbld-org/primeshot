import { redirect } from 'next/navigation'

export default function LocaleExplorePage() {
  // Redirect locale-prefixed requests to the root explore
  const basePath = process.env.NEXT_PUBLIC_VERCEL_TARGET_ENV !== 'local' ? '/create' : ''
  redirect(`${basePath}/explore`)
}
