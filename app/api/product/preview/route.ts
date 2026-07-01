import { NextRequest, NextResponse } from 'next/server'

const KEY = process.env.SCRAPER_API_KEY
const scrapeUrl = (url: string, render = false) =>
  `https://api.scraperapi.com?api_key=${KEY}&url=${encodeURIComponent(url)}&render=${render}&country_code=in`

async function fetchHtml(url: string): Promise<string | null> {
  const attempts: (() => Promise<Response>)[] = [
    ...(KEY ? [
      () => fetch(scrapeUrl(url), { signal: AbortSignal.timeout(15000) }),
      () => fetch(scrapeUrl(url, true), { signal: AbortSignal.timeout(20000) }),
    ] : []),
    () => fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
        'Accept-Language': 'en-IN,en;q=0.9',
      },
      signal: AbortSignal.timeout(8000),
    }),
    () => fetch(`https://api.allorigins.win/get?url=${encodeURIComponent(url)}`, { signal: AbortSignal.timeout(10000) }),
  ]

  for (const attempt of attempts) {
    try {
      const res = await attempt()
      if (!res.ok) continue
      const isAllOrigins = res.url?.includes('allorigins')
      const text = isAllOrigins ? (await res.json())?.contents : await res.text()
      if (text?.length > 500) return text
    } catch {}
  }
  return null
}

const g = (html: string, patterns: RegExp[]): string => {
  for (const p of patterns) {
    const m = html.match(p)
    if (m?.[1]?.trim()) return m[1].trim()
  }
  return ''
}

const cleanTitle = (t: string) => t.replace(/ [|\-] .*$/, '').replace(/\s+/g, ' ').trim()
const cleanPrice = (p: string) => p.replace(/,/g, '').replace(/[^0-9.]/g, '')

function extract(html: string, domain: string, parsed: URL) {
  const is = (s: string) => domain.includes(s)

  const title = g(html, [
    ...(is('amazon') ? [/id="productTitle"[^>]*>\s*([^<]+)/i] : []),
    ...(is('flipkart') ? [/class="[^"]*B_NuCI[^"]*"[^>]*>([^<]+)/] : []),
    ...(is('myntra') ? [/"name":"([^"]+)","type"/] : []),
    /property="og:title"[\s\S]{0,20}content="([^"]+)"/i,
    /content="([^"]+)"[\s\S]{0,20}property="og:title"/i,
    /<title[^>]*>([^<]+)/i,
  ])

  const price = g(html, [
    ...(is('amazon') ? [/class="[^"]*a-price-whole[^"]*"[^>]*>([0-9,]+)/] : []),
    ...(is('flipkart') ? [/class="[^"]*_30jeq3[^"]*"[^>]*>([0-9,]+)/] : []),
    /"(?:price|offer_price|discounted_price|discountedPrice|selling_price|mrp)":[\s"]*([0-9,]+)/,
    /property="og:price:amount"[\s\S]{0,20}content="([^"]+)"/i,
    /class="[^"]*price[^"]*"[^>]*>\s*[^0-9]*([0-9,]+)/,
  ])

  let image = g(html, [
    ...(is('amazon') ? [/"(?:hiRes|large)":"(https[^"]+)"/] : []),
    ...(is('flipkart') ? [/"url":"(https:\/\/rukminim[^"]+)"/] : []),
    /property="og:image"[\s\S]{0,20}content="([^"]+)"/i,
    /content="([^"]+)"[\s\S]{0,20}property="og:image"/i,
    /name="twitter:image"[\s\S]{0,20}content="([^"]+)"/i,
  ])
  if (image?.startsWith('//')) image = `https:${image}`
  else if (image?.startsWith('/')) image = `${parsed.protocol}//${parsed.host}${image}`

  const brand = g(html, [
    /"(?:brand|brandName)":"([^"]+)"/,
    /"brand"[^}]{0,80}"name":\s*"([^"]+)"/i,
    /property="og:(?:brand|site_name)"[\s\S]{0,20}content="([^"]+)"/i,
  ]) || domain.split('.')[0].replace(/^./, c => c.toUpperCase())

  return { title, price, image, brand }
}

export async function POST(req: NextRequest) {
  try {
    const { url } = await req.json()
    if (!url?.trim()) return NextResponse.json({ error: 'URL required' }, { status: 400 })

    let parsed: URL
    try { parsed = new URL(url.trim()) }
    catch { return NextResponse.json({ error: 'Invalid URL' }, { status: 400 }) }

    const domain = parsed.hostname.replace('www.', '')
    const html = await fetchHtml(parsed.href)
    if (!html) return NextResponse.json({ error: 'Could not fetch product. Fill in manually.', url: parsed.href }, { status: 422 })

    const raw = extract(html, domain, parsed)
    const title = cleanTitle(raw.title)
    const priceNum = cleanPrice(raw.price)
    const isIndian = domain.endsWith('.in') || ['nykaa','myntra','flipkart','ajio','meesho'].some(s => domain.includes(s))
    const price = priceNum ? `${isIndian ? '₹' : '$'}${priceNum}` : ''
    const description = g(html, [
      /property="og:description"[\s\S]{0,20}content="([^"]+)"/i,
      /name="description"[\s\S]{0,20}content="([^"]+)"/i,
    ])

    if (!title && !raw.image) return NextResponse.json({ error: 'Could not read this page. Try pasting the image URL manually.', url: parsed.href }, { status: 422 })

    return NextResponse.json({ title, description, image: raw.image, price, brand: raw.brand, url: parsed.href, domain })
  } catch {
    return NextResponse.json({ error: 'Something went wrong. Please try again.' }, { status: 500 })
  }
}