import { redirect } from 'next/navigation'

export default function LocalePage() {
  // Redirect locale-prefixed requests to clean root URL
  redirect('/')
}
