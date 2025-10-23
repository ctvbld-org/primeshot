import type { Character } from '@/../../webapp/src/types/jobs'
import { getWebsiteCdnUrl } from '@/lib/utils/cdn'

/**
 * Mock characters for demo/preview mode on the marketing website.
 * These characters are displayed in the GenerateBar when in demo mode.
 */
export const MOCK_CHARACTERS: Character[] = [
  {
    id: 'demo-james-1',
    user_id: 'demo-user',
    name: 'James',
    status: 'ready',
    thumbnail_url: getWebsiteCdnUrl('/homepage/james-selfie-w640.webp'),
    image_count: 9,
    created_at: new Date('2024-01-15T10:00:00Z').toISOString(),
    updated_at: new Date('2024-01-15T10:08:00Z').toISOString(),
  },
  {
    id: 'demo-james-2',
    user_id: 'demo-user',
    name: 'James 2',
    status: 'training',
    thumbnail_url: getWebsiteCdnUrl('/homepage/james-selfie2-w640.webp'),
    image_count: 9,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 'demo-laura',
    user_id: 'demo-user',
    name: 'Laura',
    status: 'ready',
    thumbnail_url: getWebsiteCdnUrl('/homepage/hero-compare-2-w960.webp'),
    image_count: 9,
    created_at: new Date('2024-01-10T14:30:00Z').toISOString(),
    updated_at: new Date('2024-01-10T14:38:00Z').toISOString(),
  },
]

