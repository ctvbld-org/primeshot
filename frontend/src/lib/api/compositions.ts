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

export async function deleteComposition(id: string, userId: string): Promise<void> {
  const supabase = createClient()
  
  const { error } = await supabase
    .from('compositions')
    .delete()
    .eq('id', id)
    .eq('user_id', userId)
    
  if (error) {
    throw new Error(`Failed to delete composition: ${error.message}`)
  }
} 