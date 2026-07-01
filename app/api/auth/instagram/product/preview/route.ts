import { NextRequest, NextResponse } from 'next/server'

async function tryFetch(url: string): Promise<string | null> {
  const proxies = [
    // Proxy 1: ScraperAPI free tier
    `https://api.scraperapi.com?url=${encodeURIComponent(url)}&render=false`,
    // Proxy 2: AllOrigins
    `https://api.allorigins.win/get?url=${encodeURIComponent(url)}`,
    // Proxy 3: corsproxy
    `https://corsproxy.io/?${encodeURIComponent(url)}`,
    // Proxy 4: thingproxy
    `https://thingproxy.freeboard.io/fetch/${url}`,
  ]

  // Try direct with browser-like headers first
  try {
    const res = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8',
        'Accept-Language': 'en-IN,en;q=0.9,hi;q=0.8',
        'Accept-Encoding': 'gzip, deflate, br',
        'Cache-Control': 'no-cache',
        'Pragma': 'no-cache',
        'Sec-Fetch-Dest': 'document',
        'Sec-Fetch-Mode': 'navigate',
        'Sec-Fetch-Site': 'none',
        'Upgrade-Insecure-Requests': '1',
      },
      signal: AbortSignal.timeout(8000),
    })
    if (res.ok) {
      const text = await res.text()
      if (text.length > 500 && (text.includes('og:title') || text.includes('<title'))) {
        return text
      }
    }
  } catch {}

  // Try proxies
  for (const proxy of proxies) {
    try {
      const res = await fetch(proxy, {
        headers: { 'User-Agent': 'Mozilla/5.0 (compatible; CurateKin/1.0)' },
        signal: AbortSignal.timeout(10000),
      })
      if (!res.ok) continue

      let text = ''
      if (proxy.includes('allorigins')) {
        const json = await res.json()
        text = json?.contents ?? ''
      } else {
        text = await res.text()
      }

      if (text.length > 500) return text
    } catch {}
  }

  return null
}

function get(html: string, patterns: RegExp[]): string {
  for (const p of patterns) {
    const m = html.match(p)
    if (m?.[1]?.trim()) return m[1].trim()
  }
  return ''
}

function cleanTitle(title: string): string {
  return title
    .replace(/ \| .*$/, '')
    .replace(/ - .*$/, '')
    .replace(/ – .*$/, '')
    .replace(/\s+/g, ' ')
    .trim()
}

export async function POST(req: NextRequest) {
  try {
    const { url } = await req.json()
    if (!url?.trim()) return NextResponse.json({ error: 'URL required' }, { status: 400 })

    let parsed: URL
    try { parsed = new URL(url.trim()) }
    catch { return NextResponse.json({ error: 'Invalid URL' }, { status: 400 }) }

    const domain = parsed.hostname.replace('www.', '')
    const html = await tryFetch(parsed.href)

    if (!html) {
      return NextResponse.json({
        error: 'Could not fetch product details automatically. Please fill in the details manually.',
        url: parsed.href,
      }, { status: 422 })
    }

    // Title
    const rawTitle = get(html, [
      /property="og:title"\s+content="([^"]+)"/i,
      /content="([^"]+)"\s+property="og:title"/i,
      /<title[^>]*>([^<]+)/i,
    ])
    const title = cleanTitle(rawTitle)

    // Image
    let image = get(html, [
      /property="og:image"\s+content="([^"]+)"/i,
      /content="([^"]+)"\s+property="og:image"/i,
      /property="og:image:secure_url"\s+content="([^"]+)"/i,
      /name="twitter:image:src"\s+content="([^"]+)"/i,
      /name="twitter:image"\s+content="([^"]+)"/i,
    ])
    if (image?.startsWith('//')) image = `https:${image}`
    else if (image?.startsWith('/')) image = `${parsed.protocol}//${parsed.host}${image}`

    // Price
    let price = get(html, [
      /property="og:price:amount"\s+content="([^"]+)"/i,
      /property="product:price:amount"\s+content="([^"]+)"/i,
      /"price":\s*"([0-9,]+\.?[0-9]*)"/,
      /"selling_price":\s*([0-9]+)/,
      /"mrp":\s*([0-9]+)/,
      /class="[^"]*price[^"]*"[^>]*>\s*[₹$]?\s*([0-9,]+)/,
    ])
    price = price.replace(/,/g, '')

    const currency = domain.endsWith('.in') || ['nykaa','myntra','flipkart','ajio','amazon.in','meesho'].some(s => domain.includes(s)) ? 'INR' : 'USD'
    const sym: Record<string,string> = { INR:'₹', USD:'$', GBP:'£', EUR:'€' }
    const formattedPrice = price ? `${sym[currency] ?? '₹'}${price}` : ''

    // Brand
    const brand = get(html, [
      /property="og:brand"\s+content="([^"]+)"/i,
      /property="product:brand"\s+content="([^"]+)"/i,
      /"brand"[^}]{0,50}"name":\s*"([^"]+)"/i,
      /itemprop="brand"[^>]*>\s*([^<]+)/i,
      /property="og:site_name"\s+content="([^"]+)"/i,
    ]) || domain.split('.')[0].charAt(0).toUpperCase() + domain.split('.')[0].slice(1)

    // Description
    const description = get(html, [
      /property="og:description"\s+content="([^"]+)"/i,
      /name="description"\s+content="([^"]+)"/i,
    ])

    if (!title && !image) {
      return NextResponse.json({
        error: 'Could not read this page. Try right-clicking the product image → Copy image address, then paste it in the image field.',
        url: parsed.href,
      }, { status: 422 })
    }

    return NextResponse.json({ title, description, image, price: formattedPrice, brand, url: parsed.href, domain })

  } catch (err) {
    return NextResponse.json({ error: 'Something went wrong. Please try again.' }, { status: 500 })
  }
}