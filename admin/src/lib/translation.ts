// Utility functions for admin translation automation
import axios from 'axios'

// Ensure API calls respect Next.js basePath in production
function getApiPath(path: string): string {
  if (typeof window !== 'undefined') {
    const hasAdminPrefix = typeof window !== 'undefined' && window.location.pathname.startsWith('/admin')
    return hasAdminPrefix ? `/admin${path}` : path
  }
  return path
}

// Keep in sync with API config
const translationColumns: Record<string, string[]> = {
  styles: ['name'],
  wardrobe: ['label'],
  scene: ['label'],
  color: ['label'],
  credit_packs: ['name', 'description'],
  subscriptions: ['display_name', 'description'],
}

export function getTranslatableColumns(table: string): string[] {
  return translationColumns[table] || []
}

export function getTargetLanguages(): string[] {
  return ['de', 'es', 'fr', 'it', 'ja', 'nl', 'pt', 'zh']
}

export function shouldTranslateRow(
  original: Record<string, any> | undefined,
  updated: Record<string, any>,
  columns: string[]
): boolean {
  if (!original) return true // new row
  return columns.some((col) => original[col] !== updated[col])
}

export async function translateRow(
  table: string,
  row: Record<string, any>,
  targetLanguages: string[] = getTargetLanguages()
): Promise<Record<string, any>> {
  const res = await axios.post(getApiPath('/api/translate'), {
    table,
    rows: [row],
    targetLanguages,
  })
  if (!res.data || !res.data.translations || !Array.isArray(res.data.translations)) {
    throw new Error('Invalid translation response')
  }
  return res.data.translations[0]
} 