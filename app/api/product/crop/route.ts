import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import sharp from 'sharp'

export const runtime = 'nodejs'

const MAX_IMAGE_BYTES = 12 * 1024 * 1024
const MAX_PIXELS = 24_000_000

function numberInRange(value: unknown, min: number, max: number, fallback: number) {
  return typeof value === 'number' && Number.isFinite(value) ? Math.min(max, Math.max(min, value)) : fallback
}

function safeImageUrl(value: unknown) {
  if (typeof value !== 'string') return null
  try {
    const url = new URL(value)
    const host = url.hostname.toLowerCase()
    const privateIpv4 = /^(10\.|127\.|0\.0\.0\.0$|169\.254\.|192\.168\.|172\.(1[6-9]|2\d|3[0-1])\.)/
    if (!['http:', 'https:'].includes(url.protocol) || host === 'localhost' || host.endsWith('.local') || host === '::1' || privateIpv4.test(host)) return null
    return url
  } catch {
    return null
  }
}

async function fetchImageDirect(url: URL) {
  let next = url
  for (let hop = 0; hop < 4; hop += 1) {
    const response = await fetch(next, { redirect:'manual', headers:{ Accept:'image/avif,image/webp,image/*,*/*;q=0.8', 'User-Agent':'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/131.0 Safari/537.36' } })
    if ([301, 302, 303, 307, 308].includes(response.status)) {
      const location = response.headers.get('location')
      const redirected = location ? safeImageUrl(new URL(location, next).toString()) : null
      if (!redirected) throw new Error('unsafe_redirect')
      next = redirected
      continue
    }
    const length = Number(response.headers.get('content-length') || 0)
    // Some retailer CDNs serve valid image bytes as application/octet-stream.
    // Let sharp validate the bytes instead of rejecting those responses by MIME label.
    if (!response.ok || length > MAX_IMAGE_BYTES) throw new Error('image_fetch_failed')
    const bytes = Buffer.from(await response.arrayBuffer())
    if (bytes.length > MAX_IMAGE_BYTES) throw new Error('image_too_large')
    return bytes
  }
  throw new Error('too_many_redirects')
}

async function fetchImage(url: URL) {
  try {
    return await fetchImageDirect(url)
  } catch (directError) {
    const scraperKey = process.env.SCRAPER_API_KEY
    if (!scraperKey) throw directError

    const scraperUrl = new URL('https://api.scraperapi.com/')
    scraperUrl.searchParams.set('api_key', scraperKey)
    scraperUrl.searchParams.set('url', url.toString())
    const response = await fetch(scraperUrl, {
      headers: { Accept:'image/avif,image/webp,image/*,*/*;q=0.8' },
    })
    const length = Number(response.headers.get('content-length') || 0)
    if (!response.ok || length > MAX_IMAGE_BYTES) throw directError
    const bytes = Buffer.from(await response.arrayBuffer())
    if (bytes.length > MAX_IMAGE_BYTES) throw new Error('image_too_large')
    return bytes
  }
}

export async function POST(request: NextRequest) {
  const cookieStore = await cookies()
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { getAll: () => cookieStore.getAll() } }
  )
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error:'Please log in.' }, { status:401 })

  try {
    const body = await request.json()
    const imageUrl = safeImageUrl(body.imageUrl)
    if (!imageUrl) return NextResponse.json({ error:'Invalid image URL.' }, { status:400 })

    const zoom = numberInRange(body.zoom, 1, 2.5, 1)
    const x = numberInRange(body.x, -100, 100, 0)
    const y = numberInRange(body.y, -100, 100, 0)
    const input = await fetchImage(imageUrl)
    const normalised = await sharp(input, { limitInputPixels: MAX_PIXELS })
      .rotate()
      .flatten({ background:'#ffffff' })
      .jpeg({ quality:92, mozjpeg:true })
      .toBuffer({ resolveWithObject:true })
    const metadata = normalised.info
    if (!metadata.width || !metadata.height || Math.min(metadata.width, metadata.height) < 480) throw new Error('image_too_small')

    const trimmed = await sharp(normalised.data, { limitInputPixels: MAX_PIXELS })
      .trim({ background:'#ffffff', threshold:12 })
      .toBuffer({ resolveWithObject:true })
    const hasUsefulTrim = !!trimmed.info.width && !!trimmed.info.height
      && trimmed.info.width >= metadata.width * 0.12
      && trimmed.info.height >= metadata.height * 0.12
    const source = hasUsefulTrim ? trimmed : normalised
    const sourceWidth = source.info.width
    const sourceHeight = source.info.height
    if (!sourceWidth || !sourceHeight) throw new Error('invalid_image')

    let output: Buffer
    if (zoom === 1 && x === 0 && y === 0) {
      const fitted = await sharp(source.data, { limitInputPixels: MAX_PIXELS })
        .resize({ width:1080, height:1380, fit:'inside', withoutEnlargement:false })
        .toBuffer({ resolveWithObject:true })
      if (!fitted.info.width || !fitted.info.height) throw new Error('invalid_fitted_image')
      output = await sharp({
        create:{ width:1200, height:1500, channels:3, background:'#ffffff' },
      })
        .composite([{ input:fitted.data, left:Math.round((1200 - fitted.info.width) / 2), top:Math.round((1500 - fitted.info.height) / 2) }])
        .jpeg({ quality:90, mozjpeg:true })
        .toBuffer()
    } else {
      const frameRatio = 4 / 5
      const baseWidth = Math.min(sourceWidth, Math.round(sourceHeight * frameRatio))
      const baseHeight = Math.round(baseWidth / frameRatio)
      const cropWidth = Math.max(1, Math.round(baseWidth / zoom))
      const cropHeight = Math.max(1, Math.round(baseHeight / zoom))
      const left = Math.round(((sourceWidth - cropWidth) / 2) + ((x / 100) * (sourceWidth - cropWidth) / 2))
      const top = Math.round(((sourceHeight - cropHeight) / 2) + ((y / 100) * (sourceHeight - cropHeight) / 2))
      output = await sharp(source.data, { limitInputPixels: MAX_PIXELS })
        .extract({ left:Math.max(0, Math.min(left, sourceWidth - cropWidth)), top:Math.max(0, Math.min(top, sourceHeight - cropHeight)), width:cropWidth, height:cropHeight })
        .resize({ width:1200, height:1500, fit:'fill' })
        .jpeg({ quality:90, mozjpeg:true })
        .toBuffer()
    }

    return new NextResponse(new Uint8Array(output), { headers:{ 'Content-Type':'image/jpeg', 'Cache-Control':'no-store' } })
  } catch {
    return NextResponse.json({ error:'Could not frame this image. Try a different image or use less zoom.' }, { status:422 })
  }
}
