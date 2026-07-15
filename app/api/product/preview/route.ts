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

const decodeEntities = (s: string) => s
  .replace(/&#x27;/g, "'").replace(/&#39;/g, "'").replace(/&amp;/g, '&')
  .replace(/&quot;/g, '"').replace(/&#x2F;/g, '/').replace(/&nbsp;/g, ' ')

const cleanTitle = (t: string) => decodeEntities(t).replace(/ [|\-] .*$/, '').replace(/\s+/g, ' ').trim()
const cleanPrice = (p: string) => p.replace(/,/g, '').replace(/[^0-9.]/g, '')

// ── JSON-LD (schema.org Product) — the highest-priority, most reliable
// source when a retailer provides it, since it's structured data meant
// to be machine-read rather than scraped. ─────────────────────────────
function collectJsonLdNodes(parsed: unknown): Record<string, unknown>[] {
  if (Array.isArray(parsed)) return parsed.flatMap(collectJsonLdNodes)
  if (!parsed || typeof parsed !== 'object') return []
  const obj = parsed as Record<string, unknown>
  const nodes: Record<string, unknown>[] = [obj]
  if (Array.isArray(obj['@graph'])) nodes.push(...(obj['@graph'] as Record<string, unknown>[]))
  if (obj.mainEntity && typeof obj.mainEntity === 'object') nodes.push(obj.mainEntity as Record<string, unknown>)
  return nodes
}

function findJsonLdProduct(html: string): Record<string, unknown> | null {
  const blocks = html.matchAll(/<script[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi)
  for (const b of blocks) {
    let parsed: unknown
    try { parsed = JSON.parse(b[1].trim()) } catch { continue }
    for (const node of collectJsonLdNodes(parsed)) {
      const t = node['@type']
      if (t === 'Product' || (Array.isArray(t) && t.includes('Product'))) return node
    }
  }
  return null
}

function jsonLdBrand(brand: unknown): string {
  if (!brand) return ''
  if (typeof brand === 'string') return brand
  const name = (brand as Record<string, unknown>)?.name
  return typeof name === 'string' ? name : ''
}

function jsonLdImages(image: unknown): string[] {
  if (!image) return []
  const arr = Array.isArray(image) ? image : [image]
  return arr
    .map(i => typeof i === 'string' ? i : (i as Record<string, unknown>)?.url)
    .filter((x): x is string => typeof x === 'string' && x.length > 0)
}

function jsonLdOffer(offers: unknown): { price: string; outOfStock: boolean } {
  if (!offers) return { price: '', outOfStock: false }
  const offer = (Array.isArray(offers) ? offers[0] : offers) as Record<string, unknown>
  const availability = String(offer?.availability ?? '')
  const outOfStock = /outofstock|soldout|discontinued/i.test(availability)
  if (outOfStock) return { price: '', outOfStock: true }
  const priceSpec = offer?.priceSpecification as Record<string, unknown> | undefined
  const priceRaw = offer?.price ?? priceSpec?.price ?? ''
  return { price: String(priceRaw ?? ''), outOfStock: false }
}

// ── Image validation — reject tracking pixels, logos, placeholders,
// and loader graphics by their conventional naming, then resolve
// whatever's left to an absolute URL relative to the product page. ────
const BAD_IMAGE_PATTERN = /(sprite|placeholder|blank[-_.]|1x1|pixel|spacer|loading|lazyload|lazy[-_]load|no[-_]?image|noimage|logo[-_.]|favicon|transparent)/i

function resolveProductImage(candidate: string | undefined | null, base: URL): string | null {
  if (!candidate || BAD_IMAGE_PATTERN.test(candidate)) return null
  try {
    const resolved = new URL(candidate, base).href
    return BAD_IMAGE_PATTERN.test(resolved) ? null : resolved
  } catch { return null }
}

// ── Data-integrity checks — never silently accept a bot-block page,
// a login wall, or a redirect to unrelated content as if it were the
// real product. ────────────────────────────────────────────────────
const SUSPICIOUS_TITLE_PATTERNS = [
  /robot check/i, /access denied/i, /are you a human/i, /just a moment/i,
  /attention required/i, /captcha/i, /page not found/i, /^404\b/,
  /\bsign in\b/i, /log ?in to continue/i, /verify you are human/i,
  /pardon our interruption/i, /security check/i, /unusual traffic/i,
]

function looksSuspicious(title: string): boolean {
  const t = title.trim()
  if (t.length < 2) return true
  return SUSPICIOUS_TITLE_PATTERNS.some(p => p.test(t))
}

function domainsRelated(a: string, b: string): boolean {
  return a === b || a.endsWith(`.${b}`) || b.endsWith(`.${a}`)
}

// ── Carefully scoped retailer fallback — only ever fills gaps left by
// JSON-LD/OG/meta above, never overrides good structured data with a
// weaker regex guess. Intentionally kept narrow to a few known sites,
// not a general-purpose scraper. ───────────────────────────────────
function extractSiteSpecific(html: string, domain: string) {
  const is = (s: string) => domain.includes(s)
  const title = g(html, [
    ...(is('amazon') ? [/id="productTitle"[^>]*>\s*([^<]+)/i] : []),
    ...(is('flipkart') ? [/class="[^"]*B_NuCI[^"]*"[^>]*>([^<]+)/] : []),
    ...(is('myntra') ? [/"name":"([^"]+)","type"/] : []),
  ])
  const price = g(html, [
    ...(is('amazon') ? [/class="[^"]*a-price-whole[^"]*"[^>]*>([0-9,]+)/] : []),
    ...(is('flipkart') ? [/class="[^"]*_30jeq3[^"]*"[^>]*>([0-9,]+)/] : []),
    /"(?:price|offer_price|discounted_price|discountedPrice|selling_price|mrp)":[\s"]*([0-9,]+)/,
    /class="[^"]*price[^"]*"[^>]*>\s*[^0-9]*([0-9,]+)/,
  ])
  const image = g(html, [
    ...(is('amazon') ? [/"(?:hiRes|large)":"(https[^"]+)"/] : []),
    ...(is('flipkart') ? [/"url":"(https:\/\/rukminim[^"]+)"/] : []),
  ])
  const brand = g(html, [
    /"(?:brand|brandName)":"([^"]+)"/,
    /"brand"[^}]{0,80}"name":\s*"([^"]+)"/i,
  ])
  return { title, price, image, brand }
}

// ── Main extraction pipeline: JSON-LD > Open Graph > standard meta
// tags > site-specific fallback (only for whatever's still missing). ──
function extract(html: string, domain: string, parsed: URL) {
  const ld = findJsonLdProduct(html)

  const ogTitle = g(html, [/property="og:title"[\s\S]{0,20}content="([^"]+)"/i, /content="([^"]+)"[\s\S]{0,20}property="og:title"/i])
  const metaTitle = g(html, [/<title[^>]*>([^<]+)/i])
  const ogImage = g(html, [/property="og:image"[\s\S]{0,20}content="([^"]+)"/i, /content="([^"]+)"[\s\S]{0,20}property="og:image"/i])
  const twitterImage = g(html, [/name="twitter:image"[\s\S]{0,20}content="([^"]+)"/i])
  const ogPrice = g(html, [/property="(?:og:price:amount|product:price:amount)"[\s\S]{0,20}content="([^"]+)"/i])
  const ogSiteName = g(html, [/property="og:site_name"[\s\S]{0,20}content="([^"]+)"/i])
  const ogUrl = g(html, [/property="og:url"[\s\S]{0,20}content="([^"]+)"/i])

  let title = String(ld?.name ?? '') || ogTitle || metaTitle || ''
  let brand = jsonLdBrand(ld?.brand) || ogSiteName || ''
  const { price: ldPrice, outOfStock } = jsonLdOffer(ld?.offers)
  let rawPrice = ldPrice || (outOfStock ? '' : ogPrice)

  const imageCandidates = [...jsonLdImages(ld?.image), ogImage, twitterImage]
  let image: string | null = null
  for (const c of imageCandidates) {
    const resolved = resolveProductImage(c, parsed)
    if (resolved) { image = resolved; break }
  }

  if (!title || !brand || (!rawPrice && !outOfStock) || !image) {
    const site = extractSiteSpecific(html, domain)
    if (!title) title = site.title
    if (!brand) brand = site.brand
    if (!rawPrice && !outOfStock) rawPrice = site.price
    if (!image) image = resolveProductImage(site.image, parsed)
  }

  if (!brand) brand = domain.split('.')[0].replace(/^./, c => c.toUpperCase())

  return {
    title: cleanTitle(title),
    brand: decodeEntities(brand),
    rawPrice,
    outOfStock,
    image,
    canonicalUrl: (typeof ld?.url === 'string' ? ld.url : '') || ogUrl || undefined,
  }
}

// ── auto-detect category from title/description/url ───────────────
function detectCategory(title: string, description: string, url: string): string {
  const text = `${title} ${description} ${url}`.toLowerCase()

  // Order matters: more specific / compound terms checked first so
  // e.g. "hair serum" matches Haircare before generic "serum" matches Skincare
  const map: [string[], string][] = [
    [['hair','shampoo','conditioner','scalp','leave-in','leave in'], 'Haircare'],
    [['lipstick','foundation','concealer','mascara','eyeliner','eyeshadow','blush','bronzer','bronzing','highlighter','makeup','kajal','kohl','primer','setting spray','contour','lip gloss','lip liner','bb cream','cc cream'], 'Makeup'],
    [['face serum','face wash','face cream','face mask','moisturiser','moisturizer','sunscreen','spf','toner','cleanser','retinol','vitamin c serum','hyaluronic','niacinamide','exfoliant','scrub','micellar','skincare','skin care'], 'Skincare'],
    [['sneaker','boot','heel','sandal','loafer','flat shoe','pump','mule','slipper','footwear','stiletto','wedge','kolhapuri','mojari'], 'Footwear'],
    [['handbag','tote bag','clutch','backpack','sling bag','wallet','purse','satchel','crossbody','pouch','duffel'], 'Bags & Purses'],
    [['necklace','earring','finger ring','bracelet','wrist watch','bangle','anklet','pendant','brooch','jewellery','jewelry','chain necklace','choker'], 'Jewelry & Watches'],
    [['jacket','overcoat','blazer','trench coat','parka','windbreaker','shrug','cape','outerwear'], 'Coats & Outerwear'],
    [['dress','kurta','saree','lehenga','jeans','trouser','skirt','shorts','co-ord','jumpsuit','romper','palazzo','salwar','kurti','tshirt','t-shirt','sweater','hoodie','sweatshirt','cardigan','leggings','tank top','blouse','shirt','top'], 'Apparel'],
  ]

  for (const [keywords, category] of map) {
    if (keywords.some(k => text.includes(k))) return category
  }
  return 'Skincare' // default
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

    // Data integrity: a missing or suspicious (bot-block / login /
    // error page) title means we didn't actually land on a real
    // product page — fail closed rather than let a shopper-facing
    // card get saved with the wrong content.
    if (!raw.title || looksSuspicious(raw.title)) {
      return NextResponse.json({ error: 'Could not read this page. Try pasting the image URL manually.', url: parsed.href }, { status: 422 })
    }

    // Never silently accept a page that isn't actually the pasted
    // retailer's domain (e.g. a proxy fallback landing on an
    // unrelated redirect target).
    if (raw.canonicalUrl) {
      try {
        const canonicalHost = new URL(raw.canonicalUrl).hostname.replace('www.', '')
        if (!domainsRelated(canonicalHost, domain)) {
          return NextResponse.json({ error: 'This link did not match the expected retailer page. Please check the URL.', url: parsed.href }, { status: 422 })
        }
      } catch {}
    }

    const priceNum = cleanPrice(raw.rawPrice || '')
    const isIndian = domain.endsWith('.in') || ['nykaa','myntra','flipkart','ajio','meesho','tirabeauty'].some(s => domain.includes(s))
    const price = priceNum ? `${isIndian ? '₹' : '$'}${priceNum}` : ''

    const description = decodeEntities(g(html, [
      /property="og:description"[\s\S]{0,20}content="([^"]+)"/i,
      /name="description"[\s\S]{0,20}content="([^"]+)"/i,
    ]))

    const category = detectCategory(raw.title, description, parsed.href)

    // Soft warnings — the extraction succeeded overall (a real,
    // verified product page), but a specific field couldn't be found
    // (e.g. an out-of-stock listing with no current price). These are
    // not failures: the client fills what it has and asks the creator
    // to complete the rest, rather than discarding a good result.
    const warnings: string[] = []
    if (!price) warnings.push('Price unavailable — enter manually.')
    if (!raw.image) warnings.push('Product image unavailable — add it manually.')

    return NextResponse.json({
      title: raw.title, description, image: raw.image, price, brand: raw.brand,
      category, url: parsed.href, domain, warnings,
    })
  } catch {
    return NextResponse.json({ error: 'Something went wrong. Please try again.' }, { status: 500 })
  }
}
