import { redirect } from 'next/navigation'

export default function LocaleFavouritesPage() {
  // Redirect locale-prefixed requests to the root favourites
  const basePath = process.env.NEXT_PUBLIC_VERCEL_TARGET_ENV !== 'local' ? '/create' : ''
  redirect(`${basePath}/favourites`)
}
