import { redirect } from 'next/navigation'

export default function RootPage() {
  // This should never be reached with Next.js i18n, but just in case
  redirect('/en')
}