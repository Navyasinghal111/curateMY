import { NextRequest, NextResponse } from 'next/server'

export async function POST(req: NextRequest) {
  try {
    const { url } = await req.json()
    if (!url || typeof url !== 'string') return NextResponse.json({ error: 'URL is required' }, { status: 400 })

    let parsed: URL
    try { parsed = new URL(url) } catch { return NextResponse.json({ error: 'Invalid URL' }, { status: 400 }) }

    const res = await fetch(parsed.href, {
      headers: { 'User-Agent': 'Mozilla/5.0 (compatible; CurateKin/1.0)', 'Accept': 'text/html' },
      signal: AbortSignal.timeout(8000),
    })
    if (!res.ok) return NextResponse.json({ error: 'Could not fetch product page' }, { status: 400 })

    const html = await res.text()
    const get = (patterns: RegExp[]) => { for (const p of patterns) { const m = html.match(p); if (m?.[1]?.trim()) return m[1].trim() } return '' }

    const title = get([/property="og:title"\s+content="([^"]+)"/i, /content="([^"]+)"\s+property="og:title"/i, /<title[^>]*>([^<]+)<\/title>/i])
    const image = get([/property="og:image"\s+content="([^"]+)"/i, /content="([^"]+)"\s+property="og:image"/i])
    const description = get([/property="og:description"\s+content="([^"]+)"/i, /name="description"\s+content="([^"]+)"/i])
    const price = get([/property="og:price:amount"\s+content="([^"]+)"/i, /"price":\s*"?([0-9,]+\.?[0-9]*)"?/i])
    const currency = get([/property="og:price:currency"\s+content="([^"]+)"/i]) || 'INR'
    const brand = get([/property="og:brand"\s+content="([^"]+)"/i, /"brand":\s*\{[^}]*"name":\s*"([^"]+)"/i]) || get([/property="og:site_name"\s+content="([^"]+)"/i])

    if (!title && !image) return NextResponse.json({ error: 'Could not extract product info from this URL.' }, { status: 422 })

    let imageUrl = image
    if (imageUrl?.startsWith('//')) imageUrl = `https:${imageUrl}`
    else if (imageUrl?.startsWith('/')) imageUrl = `${parsed.protocol}//${parsed.host}${imageUrl}`

    const symbols: Record<string,string> = { INR:'₹', USD:'$', GBP:'£', EUR:'€' }
    const formattedPrice = price ? `${symbols[currency] ?? currency}${price.replace(/[₹$£€]/g,'')}` : ''

    return NextResponse.json({ title, description, image: imageUrl, price: formattedPrice, brand: brand || parsed.hostname.replace('www.',''), url: parsed.href })
  } catch (err) {
    return NextResponse.json({ error: 'Something went wrong. Please try again.' }, { status: 500 })
  }
}