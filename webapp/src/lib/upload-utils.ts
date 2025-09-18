import { v4 as uuidv4 } from 'uuid';
import { FileWithScore } from './types';
import { createClient } from '@/lib/supabase/client';

// Default part size; server may override via init response
export const DEFAULT_PART_SIZE = 6 * 1024 * 1024; // 6 MiB

// Generate a 400x400 WebP thumbnail with optional face-aware crop (0..1 box)
export async function generateThumbnailWebP(
  file: File & { faceBox?: { x: number; y: number; width: number; height: number } }
): Promise<Blob> {
  const imgBitmap = await createImageBitmap(file);
  const srcW = imgBitmap.width;
  const srcH = imgBitmap.height;

  // Compute square crop
  let sx = 0, sy = 0, side = Math.min(srcW, srcH);
  const fb = (file as any).faceBox as { x: number; y: number; width: number; height: number } | undefined;
  if (fb && fb.width > 0 && fb.height > 0) {
    const margin = 0.15;
    const nx = Math.max(0, fb.x - margin);
    const ny = Math.max(0, fb.y - margin);
    const nw = Math.min(1 - nx, fb.width + margin * 2);
    const nh = Math.min(1 - ny, fb.height + margin * 2);
    const px = Math.round(nx * srcW);
    const py = Math.round(ny * srcH);
    const pw = Math.round(nw * srcW);
    const ph = Math.round(nh * srcH);
    side = Math.min(srcW, srcH, Math.max(pw, ph));
    const cx = px + Math.floor(pw / 2);
    const cy = py + Math.floor(ph / 2);
    sx = Math.max(0, Math.min(srcW - side, Math.round(cx - side / 2)));
    sy = Math.max(0, Math.min(srcH - side, Math.round(cy - side / 2)));
  } else {
    sx = Math.floor((srcW - side) / 2);
    sy = Math.floor((srcH - side) / 2);
  }

  const canvas = new OffscreenCanvas(400, 400);
  const ctx = canvas.getContext('2d')!;
  ctx.drawImage(imgBitmap, sx, sy, side, side, 0, 0, 400, 400);
  const blob = await canvas.convertToBlob({ type: 'image/webp', quality: 0.85 });
  try { imgBitmap.close(); } catch {}
  return blob;
}

type FaceBox = { x: number; y: number; width: number; height: number } | undefined;

interface InitResponse { uploadId: string; key: string; partSize: number; contentType: string }

function getBasePath(): string {
  // Prefer explicit env var in prod
  const env = (process.env.NEXT_PUBLIC_BASE_PATH || '').trim();
  if (env) return env.startsWith('/') ? env.replace(/\/$/, '') : `/${env.replace(/\/$/, '')}`;

  // Fallback to Next runtime data on client
  if (typeof window !== 'undefined') {
    const ap = (window as any).__NEXT_DATA__?.assetPrefix as string | undefined;
    if (ap) return ap.startsWith('/') ? ap.replace(/\/$/, '') : `/${ap.replace(/\/$/, '')}`;
  }

  return '';
}

function withBasePath(path: string): string {
  const base = getBasePath();
  const p = path.startsWith('/') ? path : `/${path}`;
  return `${base}${p}`;
}

async function authAndEndpoint() {
  const supabase = createClient();
  const { data: { session }, error } = await supabase.auth.getSession();
  if (error || !session) throw new Error('Authentication required for upload');
  const apiBase = withBasePath('/api/upload-chunk');
  return { apiBase };
}

async function initMultipart(
  file: FileWithScore & File,
  characterId: string,
  opts: { isFirstImage?: boolean; faceBox?: FaceBox; qualityScore?: number; thumbnailBlob?: Blob | null }
): Promise<InitResponse> {
  const { apiBase } = await authAndEndpoint();
  const uploadId = uuidv4();
  const metadata = {
    uploadId,
    fileName: file.name || 'unnamed',
    fileType: file.type || 'application/octet-stream',
    fileSize: file.size,
    totalChunks: Math.ceil(file.size / DEFAULT_PART_SIZE),
    characterId,
    isFirstImage: opts.isFirstImage === true,
    qualityScore: opts.qualityScore,
    faceBox: opts.faceBox
  };
  const form = new FormData();
  form.append('action', 'init');
  form.append('metadata', JSON.stringify(metadata));
  if (opts.thumbnailBlob) form.append('thumbnail', opts.thumbnailBlob, 'thumbnail.webp');

  const res = await fetch(`${apiBase}?action=init`, {
    method: 'POST',
    // Cookie-based auth; no Authorization header needed
    body: form
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || `Init failed (${res.status})`);
  }
  const data = await res.json();
  return { uploadId: data.uploadId, key: data.key, partSize: data.partSize || DEFAULT_PART_SIZE, contentType: data.contentType };
}

async function signPart(uploadId: string, key: string, partNumber: number): Promise<string> {
  const { apiBase } = await authAndEndpoint();
  const res = await fetch(`${apiBase}?action=sign-part`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ action: 'sign-part', uploadId, key, partNumber })
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || `sign-part failed (${res.status})`);
  }
  const data = await res.json();
  return data.url as string;
}

async function completeMultipart(uploadId: string, key: string, parts: { partNumber: number; etag: string }[]): Promise<string> {
  const { apiBase } = await authAndEndpoint();
  const res = await fetch(`${apiBase}?action=complete`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ action: 'complete', uploadId, key, parts })
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || `complete failed (${res.status})`);
  }
  const data = await res.json();
  return data.url as string;
}

export async function abortMultipart(uploadId: string, key: string): Promise<void> {
  try {
    const { apiBase } = await authAndEndpoint();
    await fetch(`${apiBase}?action=abort`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'abort', uploadId, key })
    });
  } catch (e) {
    console.warn('Abort failed (ignored):', e);
  }
}

function normalizeEtag(etag: string | null): string {
  if (!etag) return '';
  const t = etag.trim();
  if (/^".*"$/.test(t)) return t;
  return `"${t.replace(/^\"|\"$/g, '')}"`;
}

export async function uploadFileInChunks(
  file: FileWithScore & { size: number; slice: File['slice'] },
  characterId: string,
  onProgress?: (progress: number) => void,
): Promise<string> {
  // Prepare optional client-side thumbnail once
  let thumbnailBlob: Blob | null = null;
  try {
    if ((file as any).isFirstImage === true) {
      thumbnailBlob = await generateThumbnailWebP(file as any);
    }
  } catch {}

  const init = await initMultipart(file as any, characterId, {
    isFirstImage: (file as any).isFirstImage === true,
    faceBox: (file as any).faceBox,
    qualityScore: (file as any).score !== undefined ? Math.round(Math.min(100, Math.max(0, (file as any).score))) : undefined,
    thumbnailBlob
  });

  const partSize = Math.max(DEFAULT_PART_SIZE, init.partSize || DEFAULT_PART_SIZE);
  const totalParts = Math.ceil(file.size / partSize);
  const parts: { partNumber: number; etag: string }[] = [];
  const concurrency = 4;
  let nextPart = 1;
  let uploadedBytes = 0;

  async function uploadOne(partNumber: number) {
    const start = (partNumber - 1) * partSize;
    const end = Math.min(start + partSize, file.size);
    const chunk = file.slice(start, end);

    let attempt = 0;
    const maxAttempts = 3;
    while (attempt < maxAttempts) {
      try {
        const url = await signPart(init.uploadId, init.key, partNumber);
        const res = await fetch(url, { method: 'PUT', body: chunk });
        if (!res.ok) throw new Error(`PUT failed ${res.status}`);
        const etag = normalizeEtag(res.headers.get('ETag') || res.headers.get('Etag'));
        if (!etag) throw new Error('Missing ETag on part upload');
        parts[partNumber - 1] = { partNumber, etag };
        uploadedBytes += chunk.size;
        if (onProgress) onProgress((uploadedBytes / file.size) * 100);
        return;
      } catch (e) {
        attempt++;
        if (attempt >= maxAttempts) throw e;
        await new Promise(r => setTimeout(r, 500 * attempt + Math.random() * 250));
      }
    }
  }

  const workers: Promise<void>[] = [];
  for (let i = 0; i < Math.min(concurrency, totalParts); i++) {
    workers.push((async function run() {
      while (true) {
        const current = nextPart;
        if (current > totalParts) break;
        nextPart++;
        await uploadOne(current);
      }
    })());
  }
  await Promise.all(workers);

  // Complete
  const url = await completeMultipart(init.uploadId, init.key, parts);
  if (onProgress) onProgress(100);
  return url;
}