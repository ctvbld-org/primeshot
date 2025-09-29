import { redirect } from 'next/navigation'

export default function LocaleAdminPage() {
  // Redirect locale-prefixed requests to the root admin
  redirect('/admin')
}
