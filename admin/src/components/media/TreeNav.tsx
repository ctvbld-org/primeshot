'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { MinusSquare, PlusSquare, Folder as FolderIcon } from 'lucide-react'
import styles from './tree.module.css'
import { getApiUrl } from '@primeshot/common'

type ListResponse = { folders: string[] }

async function listFolders(prefix: string): Promise<string[]> {
  const res = await fetch(getApiUrl(`/api/media/list?prefix=${encodeURIComponent(prefix)}`))
  if (!res.ok) throw new Error('Failed to list')
  const data = (await res.json()) as ListResponse
  return data.folders || []
}

function getSegments(prefix: string): string[] {
  const parts = prefix.split('/').filter(Boolean)
  const acc: string[] = []
  let p = ''
  for (const part of parts) { p += part + '/'; acc.push(p) }
  return acc
}

export function TreeNav({ selectedPrefix, onSelect }: { selectedPrefix: string; onSelect: (p: string) => void }) {
  const [cache, setCache] = useState<Map<string, string[]>>(new Map())
  const [expanded, setExpanded] = useState<Set<string>>(new Set())
  const root = ''

  const ensureLoaded = useCallback(async (pfx: string) => {
    if (cache.has(pfx)) return
    const children = await listFolders(pfx)
    setCache(prev => new Map(prev).set(pfx, children))
  }, [cache])

  const toggle = useCallback(async (pfx: string) => {
    const next = new Set(expanded)
    if (next.has(pfx)) {
      next.delete(pfx)
      setExpanded(next)
    } else {
      await ensureLoaded(pfx)
      next.add(pfx)
      setExpanded(next)
    }
  }, [expanded, ensureLoaded])

  // Load root on mount
  useEffect(() => { ensureLoaded(root) }, [ensureLoaded])

  // Auto-expand the full path to the selected prefix, including each parent segment
  useEffect(() => {
    const segments = getSegments(selectedPrefix)
    ;(async () => {
      const next = new Set(expanded)
      // Always ensure and expand root
      await ensureLoaded(root)
      next.add(root)

      // Walk down the path, ensuring parents are loaded and expanded
      let parent = root
      for (const seg of segments) {
        // Ensure the current parent is loaded and expanded
        await ensureLoaded(parent)
        next.add(parent)
        // Advance to the next segment and expand it as well
        parent = seg
        await ensureLoaded(parent)
        next.add(parent)
      }
      setExpanded(next)
    })()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedPrefix])

  const renderNode = useCallback((parent: string) => {
    const children = cache.get(parent) || []
    return (
      <ul className={styles.list}>
        {children.map(child => {
          const label = child.slice(parent.length).replace(/\/$/, '')
          const isExpanded = expanded.has(child)
          const hasChildren = true // unknown until loaded; show plus by default
          return (
            <li key={child} className={`${styles.item} ${selectedPrefix === child ? styles.active : ''}`}>
              <div className={styles.row}>
                <button className={styles.toggle} onClick={(e) => { e.stopPropagation(); toggle(child) }} aria-label={isExpanded ? 'Collapse' : 'Expand'}>
                  {isExpanded ? <MinusSquare size={14} /> : <PlusSquare size={14} />}
                </button>
                <button className={styles.label} onClick={() => onSelect(child)}>
                  <FolderIcon size={12} className={styles.folderIcon} />{label}
                </button>
              </div>
              {isExpanded && renderNode(child)}
            </li>
          )
        })}
      </ul>
    )
  }, [cache, expanded, onSelect, selectedPrefix, toggle])

  return (
    <div className={styles.treeRoot}>
      {renderNode(root)}
    </div>
  )
}


