import { createClient } from '@/lib/supabase/server'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import Image from "next/image";
import { redirect } from 'next/navigation'

export default async function Home() {
  const supabase = await createClient();

  const { data, error } = await supabase.auth.getUser()
  
  if (!data.user) {
    redirect('/auth/signin')
  }

  redirect('/app')
}
