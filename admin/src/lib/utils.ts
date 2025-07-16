import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Formats translation results for a given row/object.
 * @param row The original data row (object)
 * @param columns The columns to translate (array of strings)
 * @param translations The translation result from the API (object mapping lang -> { col: value })
 * @returns Object mapping lang -> { col: value }
 */
export function formatTranslations(row: Record<string, any>, columns: string[], translations: Record<string, Record<string, string>>) {
  const result: Record<string, Record<string, string>> = {};
  for (const lang of Object.keys(translations)) {
    result[lang] = {};
    for (const col of columns) {
      result[lang][col] = translations[lang][col] || row[col] || '';
    }
  }
  return result;
}

/**
 * Formats translation results for an array of rows.
 * @param rows Array of data rows
 * @param columns Columns to translate
 * @param translationsArr Array of translation results (same order as rows)
 * @returns Array of formatted translation objects
 */
export function formatTranslationsBatch(
  rows: Record<string, any>[],
  columns: string[],
  translationsArr: Record<string, Record<string, string>>[]
) {
  return rows.map((row, i) => formatTranslations(row, columns, translationsArr[i]));
}
