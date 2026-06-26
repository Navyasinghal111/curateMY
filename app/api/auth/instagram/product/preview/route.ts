import { NextRequest, NextResponse } from 'next/server'

// Try multiple proxy services as fallbacks
const PROXIES = [
  (url: string) => `https://corsproxy.io/?${encodeURIComponent(url)}`,
  (url: string) => `https://api.allorigins.win/get?url=${encodeURIComponent(url)}`,
  (url: string) => `https://api.codetabs.com/v1/proxy?quest=${encodeURIComponent(url)}`,
]

async function fetchWithProxy(url: string): Promise<string | null> {
  // Try direct first (works for some sites)
  try {
    const res = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.5',
        'Accept-Encoding': 'gzip, deflate, br',
        'Cache-Control': 'no-cache',
      },
      signal: AbortSignal.timeout(6000),
    })
    if (res.ok) {
      const text = await res.text()
      if (text.includes('<html') || text.includes('<meta')) return text
    }
  } catch {}

  // Try each proxy
  for (const proxyFn of PROXIES) {
    try {
      const proxyUrl = proxyFn(url)
      const res = await fetch(proxyUrl, { signal: AbortSignal.timeout(8000) })
      if (!res.ok) continue

      // allorigins returns JSON with .contents
      if (proxyUrl.includes('allorigins')) {
        const json = await res.json()
        if (json?.contents) return json.contents
      } else {
        const text = await res.text()
        if (text && text.length > 100) return text
      }
    } catch {}
  }

  return null
}

function extract(html: string, patterns: RegExp[]): string {
  for (const pattern of patterns) {
    const match = html.match(pattern)
    if (match?.[1]?.trim()) return match[1].trim()
  }
  return ''
}

function extractAll(html: string, patterns: RegExp[]): string[] {
  const results: string[] = []
  for (const pattern of patterns) {
    const matches = [...html.matchAll(new RegExp(pattern.source, 'gi'))]
    for (const m of matches) {
      if (m[1]?.trim()) results.push(m[1].trim())
    }
  }
  return [...new Set(results)]
}

export async function POST(req: NextRequest) {
  try {
    const { url } = await req.json()
    if (!url?.trim()) return NextResponse.json({ error: 'URL is required' }, { status: 400 })

    let parsed: URL
    try { parsed = new URL(url.trim()) } 
    catch { return NextResponse.json({ error: 'Invalid URL' }, { status: 400 }) }

    const domain = parsed.hostname.replace('www.', '')
    const html = await fetchWithProxy(parsed.href)

    if (!html) {
      return NextResponse.json({ error: 'Could not fetch this page. Try pasting the image URL directly.' }, { status: 422 })
    }

    // ── Extract title ──
    const title = extract(html, [
      /property="og:title"\s+content="([^"]+)"/i,
      /content="([^"]+)"\s+property="og:title"/i,
      /name="og:title"\s+content="([^"]+)"/i,
      /<title[^>]*>([^<|]+)/i,
    ]).replace(/ \| .*$/, '').replace(/ - .*$/, '').trim()

    // ── Extract image ──
    let image = extract(html, [
      /property="og:image"\s+content="([^"]+)"/i,
      /content="([^"]+)"\s+property="og:image"/i,
      /property="og:image:secure_url"\s+content="([^"]+)"/i,
      /name="twitter:image"\s+content="([^"]+)"/i,
      /content="([^"]+)"\s+name="twitter:image"/i,
    ])

    // Fix relative URLs
    if (image?.startsWith('//')) image = `https:${image}`
    else if (image?.startsWith('/')) image = `${parsed.protocol}//${parsed.host}${image}`

    // ── Extract price ──
    let price = extract(html, [
      /property="og:price:amount"\s+content="([^"]+)"/i,
      /property="product:price:amount"\s+content="([^"]+)"/i,
      /"price":\s*"([0-9,]+\.?[0-9]*)"/i,
      /"price":\s*([0-9,]+\.?[0-9]*)/i,
      /class="[^"]*selling[^"]*price[^"]*"[^>]*>[^₹$]*[₹$]\s*([0-9,]+)/i,
      /[₹$]\s*([0-9,]+(?:\.[0-9]+)?)/,
    ])

    const currency = extract(html, [
      /property="og:price:currency"\s+content="([^"]+)"/i,
      /property="product:price:currency"\s+content="([^"]+)"/i,
    ]) || (domain.endsWith('.in') || domain.includes('nykaa') || domain.includes('myntra') || domain.includes('amazon.in') || domain.includes('flipkart') ? 'INR' : 'USD')

    const symbols: Record<string, string> = { INR: '₹', USD: '$', GBP: '£', EUR: '€' }
    const formattedPrice = price ? `${symbols[currency] ?? '₹'}${price.replace(/[₹$£€,]/g, '')}` : ''

    // ── Extract brand ──
    const brand = extract(html, [
      /property="og:brand"\s+content="([^"]+)"/i,
      /property="product:brand"\s+content="([^"]+)"/i,
      /"brand"[^}]*?"name":\s*"([^"]+)"/i,
      /itemprop="brand"[^>]*>([^<]+)/i,
      /class="[^"]*brand[^"]*"[^>]*>([^<]+)/i,
      /property="og:site_name"\s+content="([^"]+)"/i,
    ]) || domain.split('.')[0].charAt(0).toUpperCase() + domain.split('.')[0].slice(1)

    // ── Extract description ──
    const description = extract(html, [
      /property="og:description"\s+content="([^"]+)"/i,
      /content="([^"]+)"\s+property="og:description"/i,
      /name="description"\s+content="([^"]+)"/i,
    ])

    // ── Site-specific overrides ──
    // Nykaa specific
    if (domain.includes('nykaa')) {
      const nykaaPrice = extract(html, [/"selling_price":\s*([0-9]+)/i, /"price":\s*([0-9]+)/i])
      if (nykaaPrice) price = nykaaPrice
    }

    if (!title && !image) {
      return NextResponse.json({ 
        error: 'Could not extract product info. Try right-clicking the product image → "Copy image address" and paste it in the image field.' 
      }, { status: 422 })
    }

    return NextResponse.json({
      title:       title || '',
      description: description || '',
      image:       image || '',
      price:       formattedPrice,
      brand:       brand || domain,
      url:         parsed.href,
      domain,
    })

  } catch (err) {
    console.error('Preview error:', err)
    return NextResponse.json({ error: 'Something went wrong. Try again.' }, { status: 500 })
  }
}