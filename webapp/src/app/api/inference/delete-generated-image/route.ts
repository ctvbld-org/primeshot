import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { s3Client } from '@/lib/s3'
import { DeleteObjectCommand } from '@aws-sdk/client-s3'

function assertUserImagesKey(key: string): string {
  const clean = decodeURIComponent(key || '')
  if (!clean.startsWith('user-images/')) {
    throw new Error('Invalid key')
  }
  return clean
}

export async function POST(req: Request) {
  try {
    const supabase = await createClient()
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { imageId } = await req.json()
    if (!imageId) {
      return NextResponse.json({ error: 'Missing imageId' }, { status: 400 })
    }

    const { data: row, error: rowErr } = await supabase
      .from('generated_images')
      .select('id,inference_id,user_id,web_path,original_path')
      .eq('id', imageId)
      .single()

    if (rowErr || !row) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 })
    }
    if (row.user_id !== user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const bucket = process.env.NEXT_PUBLIC_AWS_S3_BUCKET || process.env.AWS_S3_BUCKET
    if (!bucket) {
      return NextResponse.json({ error: 'S3 bucket not configured' }, { status: 500 })
    }

    // Expand keys: delete web/orig and also web resized variants -w480/-w720 if applicable
    const rawKeys = [row.web_path, row.original_path].filter(Boolean) as string[]
    const baseKeys = rawKeys.map(assertUserImagesKey)
    const deleteKeys: string[] = []
    for (const k of baseKeys) {
      deleteKeys.push(k)
      if (/\.webp$/i.test(k)) {
        const sizes = [480, 720, 1024]
        for (const s of sizes) {
          deleteKeys.push(k.replace(/\.webp$/i, `-w${s}.webp`))
        }
      }
    }

    for (const key of deleteKeys) {
      try {
        await s3Client.send(new DeleteObjectCommand({ Bucket: bucket!, Key: key }))
      } catch (e) {
        console.warn('S3 delete failed for', key, e)
      }
    }

    const { error: delErr } = await supabase
      .from('generated_images')
      .delete()
      .eq('id', imageId)

    if (delErr) {
      return NextResponse.json({ error: delErr.message }, { status: 500 })
    }

    const { count, error: countErr } = await supabase
      .from('generated_images')
      .select('id', { count: 'exact', head: true })
      .eq('inference_id', row.inference_id)

    if (countErr) {
      return NextResponse.json({ error: countErr.message }, { status: 500 })
    }

    if (!count || count === 0) {
      await supabase
        .from('inference_jobs')
        .update({ status: 'deleted' })
        .eq('id', row.inference_id)
    }

    // Verify not present anymore
    const { data: verify } = await supabase
      .from('generated_images')
      .select('id')
      .eq('id', imageId)
      .maybeSingle()

    return NextResponse.json({ success: !verify, jobId: row.inference_id, remaining: count || 0 })
  } catch (e: any) {
    console.error('Delete generated image API failed', e)
    return NextResponse.json({ error: e?.message || 'Server error' }, { status: 500 })
  }
}


