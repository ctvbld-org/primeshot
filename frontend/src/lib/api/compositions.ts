import { createClient } from '@/lib/supabase/client'
import { InsertComposition, Composition } from '@/lib/types'

export async function saveComposition(composition: InsertComposition): Promise<Composition> {
  const supabase = createClient()
  
  const { data, error } = await supabase
    .from('compositions')
    .insert(composition)
    .select()
    .single()
    
  if (error) {
    throw new Error(`Failed to save composition: ${error.message}`)
  }
  
  return data as Composition
} 