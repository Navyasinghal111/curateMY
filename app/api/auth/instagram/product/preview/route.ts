import { NextRequest, NextResponse } from 'next/server'

const SCRAPER_KEY = process.env.SCRAPER_API_KEY

// ── fetch via ScraperAPI (handles JS-rendered pages & bot blocks) ─
async function fetchWithScraper(url: string): Promise<string | null> {
  // Try ScraperAPI first if key is available
  if (SCRAPER_KEY) {
    try {
      const scraperUrl = `https://api.scraperapi.com?api_key=${SCRAPER_KEY}&url=${encodeURIComponent(url)}&render=false&country_code=in`
      const res = await fetch(scraperUrl, { signal: AbortSignal.timeout(15000) })
      if (res.ok) {
        const text = await res.text()
        if (text.length > 500) return text
      }
    } catch {}

    // Try with JS rendering for sites that need it (Nykaa, Myntra etc)
    try {
      const scraperUrl = `https://api.scraperapi.com?api_key=${SCRAPER_KEY}&url=${encodeURIComponent(url)}&render=true&country_code=in`
      const res = await fetch(scraperUrl, { signal: AbortSignal.timeout(20000) })
      if (res.ok) {
        const text = await res.text()
        if (text.length > 500) return text
      }
    } catch {}
  }

  // Fallback: direct fetch with browser-like headers
  try {
    const res = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8',
        'Accept-Language': 'en-IN,en;q=0.9,hi;q=0.8',
        'Cache-Control': 'no-cache',
      },
      signal: AbortSignal.timeout(8000),
    })
    if (res.ok) {
      const text = await res.text()
      if (text.length > 500) return text
    }
  } catch {}

  // Last resort: AllOrigins proxy
  try {
    const res = await fetch(`https://api.allorigins.win/get?url=${encodeURIComponent(url)}`, {
      signal: AbortSignal.timeout(10000),
    })
    if (res.ok) {
      const json = await res.json()
      if (json?.contents?.length > 500) return json.contents
    }
  } catch {}

  return null
}

// ── extract a value using multiple regex patterns ─────────────────
function get(html: string, patterns: RegExp[]): string {
  for (const p of patterns) {
    const m = html.match(p)
    if (m?.[1]?.trim()) return m[1].trim()
  }
  return ''
}

// ── site-specific extractors for major Indian sites ───────────────
function extractNykaa(html: string) {
  const title = get(html, [
    /"name":"([^"]+)","description"/,
    /property="og:title" content="([^"]+)"/i,
    /<title>([^<]+)/i,
  ])
  const price = get(html, [
    /"price":(\d+)/,
    /"offer_price":(\d+)/,
    /"discounted_price":(\d+)/,
    /class="[^"]*price[^"]*"[^>]*>[\s₹]*([0-9,]+)/,
  ])
  const image = get(html, [
    /property="og:image" content="([^"]+)"/i,
    /"image":"([^"]+)"/,
  ])
  const brand = get(html, [
    /"brand":"([^"]+)"/,
    /"brandName":"([^"]+)"/,
    /property="og:brand" content="([^"]+)"/i,
  ])
  return { title, price, image, brand }
}

function extractMyntra(html: string) {
  const title = get(html, [
    /"name":"([^"]+)","type"/,
    /property="og:title" content="([^"]+)"/i,
    /<title>([^<]+)/i,
  ])
  const price = get(html, [
    /"price":(\d+)/,
    /"discountedPrice":(\d+)/,
    /"mrp":(\d+)/,
  ])
  const image = get(html, [
    /property="og:image" content="([^"]+)"/i,
    /"images":\["([^"]+)"/,
  ])
  const brand = get(html, [
    /"brand":"([^"]+)"/,
    /"brandName":"([^"]+)"/,
  ])
  return { title, price, image, brand }
}

function extractAmazon(html: string) {
  const title = get(html, [
    /id="productTitle"[^>]*>\s*([^<]+)/i,
    /property="og:title" content="([^"]+)"/i,
    /<title>([^<|]+)/i,
  ])
  const price = get(html, [
    /class="[^"]*a-price-whole[^"]*"[^>]*>([0-9,]+)/,
    /"priceAmount":([0-9.]+)/,
    /id="priceblock_ourprice"[^>]*>[\s₹$]*([0-9,]+)/,
  ])
  const image = get(html, [
    /property="og:image" content="([^"]+)"/i,
    /"hiRes":"([^"]+)"/,
    /"large":"([^"]+)"/,
  ])
  const brand = get(html, [
    /id="bylineInfo"[^>]*>[^<]*(?:Brand|Visit)[^<]*<[^>]+>([^<]+)/i,
    /"brand":"([^"]+)"/,
  ])
  return { title, price, image, brand }
}

function extractFlipkart(html: string) {
  const title = get(html, [
    /class="[^"]*B_NuCI[^"]*"[^>]*>([^<]+)/,
    /property="og:title" content="([^"]+)"/i,
    /<title>([^<]+)/i,
  ])
  const price = get(html, [
    /class="[^"]*_30jeq3[^"]*"[^>]*>₹([0-9,]+)/,
    /"price":(\d+)/,
    /"selling_price":(\d+)/,
  ])
  const image = get(html, [
    /property="og:image" content="([^"]+)"/i,
    /"url":"(https:\/\/rukminim[^"]+)"/,
  ])
  const brand = get(html, [
    /"brand":"([^"]+)"/,
    /property="og:brand" content="([^"]+)"/i,
  ])
  return { title, price, image, brand }
}

// ── generic extractor for any other site ─────────────────────────
function extractGeneric(html: string, parsed: URL) {
  const title = get(html, [
    /property="og:title"\s+content="([^"]+)"/i,
    /content="([^"]+)"\s+property="og:title"/i,
    /<title[^>]*>([^<]+)/i,
  ])
  const price = get(html, [
    /property="og:price:amount"\s+content="([^"]+)"/i,
    /property="product:price:amount"\s+content="([^"]+)"/i,
    /"price":\s*"?([0-9,]+\.?[0-9]*)"?/,
    /"selling_price":\s*([0-9]+)/,
    /"mrp":\s*([0-9]+)/,
    /class="[^"]*price[^"]*"[^>]*>\s*[₹$]?\s*([0-9,]+)/,
  ])
  let image = get(html, [
    /property="og:image"\s+content="([^"]+)"/i,
    /content="([^"]+)"\s+property="og:image"/i,
    /name="twitter:image"\s+content="([^"]+)"/i,
  ])
  if (image?.startsWith('//')) image = `https:${image}`
  else if (image?.startsWith('/')) image = `${parsed.protocol}//${parsed.host}${image}`

  const brand = get(html, [
    /property="og:brand"\s+content="([^"]+)"/i,
    /"brand"[^}]{0,50}"name":\s*"([^"]+)"/i,
    /property="og:site_name"\s+content="([^"]+)"/i,
  ])
  return { title, price, image, brand }
}

function cleanTitle(title: string): string {
  return title.replace(/ \| .*$/, '').replace(/ - .*$/, '').replace(/ – .*$/, '').replace(/\s+/g, ' ').trim()
}

function cleanPrice(price: string): string {
  return price.replace(/,/g, '').replace(/[^0-9.]/g, '')
}

export async function POST(req: NextRequest) {
  try {
    const { url } = await req.json()
    if (!url?.trim()) return NextResponse.json({ error: 'URL required' }, { status: 400 })

    let parsed: URL
    try { parsed = new URL(url.trim()) }
    catch { return NextResponse.json({ error: 'Invalid URL' }, { status: 400 }) }

    const domain = parsed.hostname.replace('www.', '')
    const html = await fetchWithScraper(parsed.href)

    if (!html) {
      return NextResponse.json({
        error: 'Could not fetch product details. Please fill in manually.',
        url: parsed.href,
      }, { status: 422 })
    }

    // Route to site-specific extractor
    let raw = { title: '', price: '', image: '', brand: '' }
    if (domain.includes('nykaa'))    raw = extractNykaa(html)
    else if (domain.includes('myntra'))   raw = extractMyntra(html)
    else if (domain.includes('amazon'))   raw = extractAmazon(html)
    else if (domain.includes('flipkart')) raw = extractFlipkart(html)
    else                                  raw = extractGeneric(html, parsed)

    // Clean up
    const title = cleanTitle(raw.title)
    const priceNum = cleanPrice(raw.price)
    const isIndian = domain.endsWith('.in') || ['nykaa','myntra','flipkart','ajio','meesho','amazon.in'].some(s => domain.includes(s))
    const formattedPrice = priceNum ? `${isIndian ? '₹' : '$'}${priceNum}` : ''

    let image = raw.image || ''
    if (image.startsWith('//')) image = `https:${image}`
    else if (image.startsWith('/')) image = `${parsed.protocol}//${parsed.host}${image}`

    const brand = raw.brand || domain.split('.')[0].charAt(0).toUpperCase() + domain.split('.')[0].slice(1)

    const description = get(html, [
      /property="og:description"\s+content="([^"]+)"/i,
      /name="description"\s+content="([^"]+)"/i,
    ])

    if (!title && !image) {
      return NextResponse.json({
        error: 'Could not read this page. Try pasting the image URL manually.',
        url: parsed.href,
      }, { status: 422 })
    }

    return NextResponse.json({ title, description, image, price: formattedPrice, brand, url: parsed.href, domain })

  } catch {
    return NextResponse.json({ error: 'Something went wrong. Please try again.' }, { status: 500 })
  }
}