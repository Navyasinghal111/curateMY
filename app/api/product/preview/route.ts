import { NextRequest, NextResponse } from 'next/server'

const KEY = process.env.SCRAPER_API_KEY
const scraperConfigured = !!KEY
const scrapeUrl = (url: string, render = false) =>
  `https://api.scraperapi.com?api_key=${KEY}&url=${encodeURIComponent(url)}&render=${render}&country_code=in`

type Provider = 'scraperapi' | 'direct' | 'proxy'
// Distinct from Provider: ScraperAPI is actually tried twice (plain, then
// JS-rendered) — this labels each individual network attempt so neither
// one's outcome can be swallowed by the other under a shared 'scraperapi'
// label.
type AttemptLabel = 'scraperapi' | 'scraperapi-render' | 'direct' | 'proxy'
type AttemptOutcome = { attempt: AttemptLabel; status: number | null; error: string | null }
type FetchResult = {
  html: string | null
  providerUsed: Provider | null
  providerResponseStatus: number | null
  attempts: AttemptOutcome[]
}

// TEMP DEBUG — remove once the live "Could not fetch product" reports are
// root-caused. Surfaces which upstream attempt ran and what it returned so
// a bare fetch failure can be traced to a specific provider/status instead
// of staying opaque. Never includes the key, HTML, or scraped product data.
function diagLog(domain: string, providerUsed: Provider | null, providerResponseStatus: number | null, errorCode: string, attempts: AttemptOutcome[]) {
  const diagnostics = { providerUsed, scraperConfigured, providerResponseStatus, errorCode, attempts }
  console.log('[product-preview]', { domain, ...diagnostics })
  return diagnostics
}

async function fetchHtml(url: string): Promise<FetchResult> {
  // cache: 'no-store' on every attempt — this route proxies live,
  // fast-changing third-party pages (and their bot-check/error
  // responses); Next.js's fetch cache must never replay a stale
  // success or a stale block indefinitely across requests.
  const attempts: { attempt: AttemptLabel; provider: Provider; fn: () => Promise<Response> }[] = [
    ...(KEY ? [
      { attempt: 'scraperapi' as const, provider: 'scraperapi' as const, fn: () => fetch(scrapeUrl(url), { cache: 'no-store' as const, signal: AbortSignal.timeout(15000) }) },
      { attempt: 'scraperapi-render' as const, provider: 'scraperapi' as const, fn: () => fetch(scrapeUrl(url, true), { cache: 'no-store' as const, signal: AbortSignal.timeout(20000) }) },
    ] : []),
    { attempt: 'direct' as const, provider: 'direct' as const, fn: () => fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
        'Accept-Language': 'en-IN,en;q=0.9',
      },
      cache: 'no-store' as const,
      signal: AbortSignal.timeout(8000),
    }) },
    { attempt: 'proxy' as const, provider: 'proxy' as const, fn: () => fetch(`https://api.allorigins.win/get?url=${encodeURIComponent(url)}`, { cache: 'no-store' as const, signal: AbortSignal.timeout(10000) }) },
  ]

  let lastProvider: Provider | null = null
  let lastStatus: number | null = null
  // Per-attempt outcome log — status if the request completed, or just the
  // error's name (e.g. "AbortError", "TypeError") if it threw. Never the
  // error message, which can echo the request URL/key on some runtimes.
  const log: AttemptOutcome[] = []

  for (const { attempt, provider, fn } of attempts) {
    try {
      const res = await fn()
      lastProvider = provider
      lastStatus = res.status
      log.push({ attempt, status: res.status, error: null })
      if (!res.ok) continue
      const isAllOrigins = res.url?.includes('allorigins')
      const text = isAllOrigins ? (await res.json())?.contents : await res.text()
      if (text?.length > 500) return { html: text, providerUsed: provider, providerResponseStatus: res.status, attempts: log }
    } catch (err) {
      lastProvider = provider
      lastStatus = null
      log.push({ attempt, status: null, error: err instanceof Error ? err.name : 'UnknownError' })
    }
  }
  return { html: null, providerUsed: lastProvider, providerResponseStatus: lastStatus, attempts: log }
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

function priceText(value: unknown): string {
  if (typeof value === 'number') return String(value)
  if (typeof value === 'string') return value
  if (value && typeof value === 'object') {
    const object = value as Record<string, unknown>
    return priceText(object.price ?? object.value ?? object.amount)
  }
  return ''
}

function jsonLdOffer(offers: unknown): { price: string; outOfStock: boolean } {
  if (!offers) return { price: '', outOfStock: false }
  const offerList = Array.isArray(offers) ? offers : [offers]
  const candidates: { price: string; rank: number }[] = []
  let sawOutOfStock = false

  for (const value of offerList) {
    if (!value || typeof value !== 'object') continue
    const offer = value as Record<string, unknown>
    const availability = String(offer.availability ?? '')
    if (/outofstock|soldout|discontinued/i.test(availability)) {
      sawOutOfStock = true
      continue
    }

    const add = (raw: unknown, rank: number) => {
      const price = priceText(raw)
      if (price) candidates.push({ price, rank })
    }

    add(offer.price, 100)
    add(offer.lowPrice, 98)

    const specifications = Array.isArray(offer.priceSpecification)
      ? offer.priceSpecification
      : offer.priceSpecification ? [offer.priceSpecification] : []
    for (const specification of specifications) {
      if (!specification || typeof specification !== 'object') continue
      const spec = specification as Record<string, unknown>
      const priceType = String(spec.priceType ?? '').toLowerCase()
      const rank = /sale|discount|current|offer|selling/i.test(priceType)
        ? 120
        : /list|mrp|original|regular/i.test(priceType) ? 75 : 95
      add(spec.price ?? spec.value, rank)
    }

    add(offer.salePrice ?? offer.sellingPrice ?? offer.discountedPrice ?? offer.currentPrice ?? offer.offerPrice, 115)
    add(offer.mrp ?? offer.listPrice ?? offer.originalPrice, 70)
  }

  candidates.sort((left, right) => right.rank - left.rank)
  return { price: candidates[0]?.price ?? '', outOfStock: !candidates.length && sawOutOfStock }
}

// ── Image validation — reject tracking pixels, logos, placeholders,
// and loader graphics by their conventional naming, then resolve
// whatever's left to an absolute URL relative to the product page. ────
const BAD_IMAGE_PATTERN = /(sprite|placeholder|blank[-_.]|1x1|pixel|spacer|loading|lazyload|lazy[-_]load|no[-_]?image|noimage|logo[-_.]|favicon|transparent)/i

function resolveProductImage(candidate: string | undefined | null, base: URL): string | null {
  if (!candidate || BAD_IMAGE_PATTERN.test(candidate)) return null
  try {
    const cleaned = candidate.replace(/&amp;/gi, '&').replace(/\\u0026/g, '&').replace(/\\\//g, '/')
    const resolved = new URL(cleaned, base).href
    return BAD_IMAGE_PATTERN.test(resolved) ? null : resolved
  } catch { return null }
}

type ImageCandidate = { url: string; score: number }

function normalizeRetailImage(url: string, domain: string) {
  if (!domain.includes('amazon')) return url

  try {
    const image = new URL(url)
    // Amazon's URL suffix is a display-size transform, not the source image.
    image.pathname = image.pathname.replace(/\._[^/]+(?=\.(?:jpe?g|png|webp)$)/i, '')
    return image.href
  } catch {
    return url
  }
}

function addImageCandidate(candidates: ImageCandidate[], value: string, score: number, page: URL) {
  const resolved = resolveProductImage(value, page)
  if (!resolved || /\.svg(?:$|[?#])/i.test(resolved)) return
  candidates.push({ url: normalizeRetailImage(resolved, page.hostname), score })
}

function collectMarkupImageCandidates(html: string, candidates: ImageCandidate[], page: URL) {
  const addMatches = (pattern: RegExp, score: number) => {
    for (const match of html.matchAll(pattern)) addImageCandidate(candidates, match[1], score, page)
  }

  addMatches(/"(?:hiRes|large)":"(https[^"\\]+)"/gi, 125)
  addMatches(/(?:data-zoom-image|data-large-image|data-original)=["']([^"']+)["']/gi, 115)
  addMatches(/property=["']og:image(?::secure_url)?["'][^>]*content=["']([^"']+)["']/gi, 80)
  addMatches(/content=["']([^"']+)["'][^>]*property=["']og:image(?::secure_url)?["']/gi, 80)
  addMatches(/name=["']twitter:image(?::src)?["'][^>]*content=["']([^"']+)["']/gi, 65)
}

function embeddedImageSize(url: string) {
  const values = Array.from(url.matchAll(/(?:[?&](?:w|width|h|height)=|_(?:SX|SY|SL|AC_UF))(\d{2,4})/gi))
    .map(match => Number.parseInt(match[1], 10))
  return values.length ? Math.max(...values) : 0
}

function rankProductImages(candidates: ImageCandidate[]) {
  const weakImage = /(?:icon|avatar|swatch|variant|thumbnail|thumb|banner|hero|carousel|social|share|review)/i
  const editorialImage = /(?:hires|hi-res|original|zoom|large|full|studio|packshot|white|product)/i
  const best = new Map<string, number>()

  for (const candidate of candidates) {
    const size = embeddedImageSize(candidate.url)
    let score = candidate.score
    if (size >= 1200) score += 22
    else if (size >= 800) score += 14
    else if (size > 0 && size <= 400) score -= 28
    if (editorialImage.test(candidate.url)) score += 8
    if (weakImage.test(candidate.url)) score -= 70
    best.set(candidate.url, Math.max(best.get(candidate.url) ?? -Infinity, score))
  }

  return [...best.entries()]
    .sort(([, left], [, right]) => right - left)
    .map(([url]) => url)
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
    /"(?:price|offer_price|discounted_price|discountedPrice|selling_price|sellingPrice|salePrice|currentPrice|offerPrice|finalPrice|mrp)":[\s"]*["']?([0-9,]+(?:\.[0-9]+)?)/i,
    /(?:data-)?(?:sale-price|selling-price|discounted-price|current-price|offer-price|final-price|price)=["'][^0-9]*([0-9,]+(?:\.[0-9]+)?)/i,
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
  let rawPrice = ldPrice || (outOfStock ? '' : ogPrice) || g(html, [
    /itemprop=["']price["'][^>]*content=["']([^"']+)["']/i,
    /content=["']([^"']+)["'][^>]*itemprop=["']price["']/i,
  ])
  const site = extractSiteSpecific(html, domain)

  // Retail pages commonly expose several image versions. Collect them all,
  // then choose the canonical/high-resolution product shot instead of blindly
  // accepting the first social-preview or thumbnail URL in the document.
  const imageCandidates: ImageCandidate[] = []
  jsonLdImages(ld?.image).forEach(image => addImageCandidate(imageCandidates, image, 120, parsed))
  if (site.image) addImageCandidate(imageCandidates, site.image, 125, parsed)
  if (ogImage) addImageCandidate(imageCandidates, ogImage, 80, parsed)
  if (twitterImage) addImageCandidate(imageCandidates, twitterImage, 65, parsed)
  collectMarkupImageCandidates(html, imageCandidates, parsed)
  const rankedImages = rankProductImages(imageCandidates)
  let image = rankedImages[0] || null

  if (!title || !brand || (!rawPrice && !outOfStock) || !image) {
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
  const sources = [
    { text: title.toLowerCase(), weight: 6 },
    { text: description.toLowerCase(), weight: 2 },
    { text: url.toLowerCase().replace(/[-_]/g, ' '), weight: 1 },
  ]

  // Order matters: more specific / compound terms checked first so
  // e.g. "hair serum" matches Haircare before generic "serum" matches Skincare
  const map: [string[], string][] = [
    // Home fragrance needs to win before perfume/fragrance.
    [['scented candle','candle','reed diffuser','room diffuser','home fragrance'], 'Home Decor - Candles & Home Fragrance'],
    [['discovery set','discovery kit','sample set','fragrance set'], 'Fragrances - Discovery Sets'],
    [['body mist','fragrance mist'], 'Fragrances - Mists'],
    [['eau de parfum','eau de toilette','eau de cologne','perfume','fragrance','cologne','attar','parfum','scent'], 'Fragrances - Perfume'],
    [['shampoo'], 'Haircare - Shampoo'],
    [['conditioner'], 'Haircare - Conditioner'],
    [['hair mask'], 'Haircare - Hair Masks'],
    [['scalp'], 'Haircare - Scalp Care'],
    [['hair dryer','hair straightener','hair curler','hair styler','hair tool'], 'Haircare - Hair Tools'],
    [['hair clip','hair band','hair accessory','scrunchie'], 'Haircare - Hair Accessories'],
    [['hair','leave-in','leave in'], 'Haircare - Styling'],
    // Body products are checked before skincare because body SPF and body oils
    // often contain otherwise-generic skincare words.
    [['body wash','shower gel','shower cream'], 'Bath & Body - Body Wash'],
    [['body lotion','body cream','body butter'], 'Bath & Body - Body Lotion'],
    [['body oil'], 'Bath & Body - Body Oils'],
    [['hand cream','hand wash','hand lotion'], 'Bath & Body - Hand Care'],
    [['deodorant'], 'Bath & Body - Deodorants'],
    [['bath salt','bath soak','bubble bath'], 'Bath & Body - Bath Soaks'],
    [['body sunscreen','body spf'], 'Bath & Body - Body SPF'],
    // Makeup is deliberately split into the exact storefront filters. Specific
    // terms must stay above the general "makeup" fallback at the end.
    [['makeup remover','makeup removal','cleansing balm','cleansing oil'], 'Makeup - Makeup Remover'],
    [['brush set','makeup brush','makeup sponge','beauty blender','blending sponge','powder puff','makeup tool'], 'Makeup - Brushes, Sponges & Tools'],
    [['eyebrow','brow pencil','brow gel','brow pomade','brow powder','brow definer'], 'Makeup - Brows'],
    [['lip & cheek','lip and cheek','lip + cheek','multi-use lip','multi use lip','cheek tint'], 'Makeup - Lip & Cheek Tint'],
    [['lipstick','lip gloss','lip liner','lip tint','lip stain','lip crayon','lip lacquer'], 'Makeup - Lipstick, Gloss & Liner'],
    [['makeup palette','eyeshadow palette','face palette','blush palette'], 'Makeup - Palettes'],
    [['eyeshadow','eye shadow','eyeliner','eye liner','mascara','kajal','kohl','eye pencil'], 'Makeup - Eyeshadow, Eyeliner & Mascara'],
    [['blush','cheek shade','cheek color','cheek colour','bronzer','bronzing','highlighter','contour','illuminator'], 'Makeup - Blush, Bronzer & Highlighter'],
    [['foundation','concealer','bb cream','cc cream','tinted moisturiser','tinted moisturizer'], 'Makeup - Foundation & Concealer'],
    [['primer','setting powder','loose powder','compact powder','pressed powder','setting spray','fixing spray','makeup fixer'], 'Makeup - Primer, Powder & Setting'],
    [['makeup'], 'Makeup'],
    [['face wash','facial cleanser','cleanser','micellar'], 'Skincare - Cleansers'],
    [['face serum','vitamin c serum','hyaluronic','niacinamide','retinol'], 'Skincare - Serums'],
    [['face cream','moisturiser','moisturizer'], 'Skincare - Moisturisers'],
    [['sunscreen','spf'], 'Skincare - Sunscreen'],
    [['toner','essence'], 'Skincare - Toners & Essences'],
    [['face mask','sheet mask'], 'Skincare - Masks'],
    [['eye cream','eye serum'], 'Skincare - Eye Care'],
    [['acne','pimple'], 'Skincare - Acne Care'],
    [['lip balm','lip treatment'], 'Skincare - Lip Care'],
    [['exfoliant','scrub','skincare','skin care'], 'Skincare'],
    [['sneaker'], 'Footwear - Sneakers'],
    [['boot'], 'Footwear - Boots'],
    [['heel','stiletto','wedge'], 'Footwear - Heels'],
    [['sandal','kolhapuri','mojari'], 'Footwear - Sandals'],
    [['loafer'], 'Footwear - Loafers'],
    [['flat shoe','pump','mule','slipper','footwear'], 'Footwear - Flats'],
    [['tote bag'], 'Bags & Purses - Totes'],
    [['shoulder bag'], 'Bags & Purses - Shoulder Bags'],
    [['crossbody','sling bag'], 'Bags & Purses - Crossbody Bags'],
    [['clutch'], 'Bags & Purses - Clutches'],
    [['backpack'], 'Bags & Purses - Backpacks'],
    [['duffel','travel bag'], 'Bags & Purses - Travel Bags'],
    [['top-handle bag','top handle bag','handbag','hand bag','wallet','purse','satchel','pouch','bag'], 'Bags & Purses'],
    [['smartwatch'], 'Watches - Smartwatches'],
    [['watch strap'], 'Watches - Watch Straps'],
    [['wrist watch','watch'], 'Watches - Everyday Watches'],
    [['earring'], 'Jewelry - Earrings'],
    [['chain necklace','choker','necklace','pendant'], 'Jewelry - Necklaces'],
    [['finger ring','ring'], 'Jewelry - Rings'],
    [['bracelet','bangle'], 'Jewelry - Bracelets'],
    [['anklet'], 'Jewelry - Anklets'],
    [['hair jewellery','hair jewelry'], 'Jewelry - Hair Accessories'],
    [['brooch','jewellery','jewelry'], 'Jewelry'],
    [['sunglasses'], 'Eyewear - Sunglasses'],
    [['blue light','blue-light'], 'Eyewear - Blue-light Glasses'],
    [['optical frame','eyeglasses','eye glasses'], 'Eyewear - Optical Frames'],
    [['jacket','overcoat','blazer','trench coat','parka','windbreaker','shrug','cape','outerwear'], 'Coats & Outerwear'],
    [['sports bra'], 'Activewear - Sports Bras'],
    [['activewear','workout','gym wear','gymwear','training'], 'Activewear'],
    [['leggings'], 'Activewear - Leggings'],
    [['dress','kurta','saree','lehenga','jeans','trouser','skirt','shorts','co-ord','jumpsuit','romper','palazzo','salwar','kurti','tshirt','t-shirt','sweater','hoodie','sweatshirt','cardigan','tank top','blouse','shirt','top'], 'Apparel'],
  ]

  let bestCategory = ''
  let bestScore = 0

  // Score every signal across the full title, description, and URL. Longer
  // phrases are stronger than generic single words, and the product title is
  // the most reliable source for classification.
  for (const [keywords, category] of map) {
    let score = 0
    for (const keyword of keywords) {
      const normalizedKeyword = keyword.toLowerCase().replace(/[-_]/g, ' ')
      const phraseWeight = normalizedKeyword.includes(' ') ? 8 : 2
      for (const source of sources) {
        if (source.text.includes(normalizedKeyword)) score += phraseWeight * source.weight
      }
    }
    if (score > bestScore) {
      bestCategory = category
      bestScore = score
    }
  }

  return bestCategory || 'Skincare'
}

export async function POST(req: NextRequest) {
  let domain = ''
  let providerUsed: Provider | null = null
  let providerResponseStatus: number | null = null
  let attemptLog: AttemptOutcome[] = []
  try {
    const { url } = await req.json()
    if (!url?.trim()) {
      return NextResponse.json({ error: 'URL required', diagnostics: diagLog(domain, providerUsed, providerResponseStatus, 'MISSING_URL', attemptLog) }, { status: 400 })
    }

    let parsed: URL
    try { parsed = new URL(url.trim()) }
    catch {
      return NextResponse.json({ error: 'Invalid URL', diagnostics: diagLog(domain, providerUsed, providerResponseStatus, 'INVALID_URL', attemptLog) }, { status: 400 })
    }

    domain = parsed.hostname.replace('www.', '')
    const fetched = await fetchHtml(parsed.href)
    providerUsed = fetched.providerUsed
    providerResponseStatus = fetched.providerResponseStatus
    attemptLog = fetched.attempts
    if (!fetched.html) {
      return NextResponse.json({
        error: 'Could not fetch product. Fill in manually.', url: parsed.href,
        diagnostics: diagLog(domain, providerUsed, providerResponseStatus, 'FETCH_FAILED', attemptLog),
      }, { status: 422 })
    }

    const raw = extract(fetched.html, domain, parsed)

    // Data integrity: a missing or suspicious (bot-block / login /
    // error page) title means we didn't actually land on a real
    // product page — fail closed rather than let a shopper-facing
    // card get saved with the wrong content.
    if (!raw.title || looksSuspicious(raw.title)) {
      return NextResponse.json({
        error: 'Could not read this page. Try pasting the image URL manually.', url: parsed.href,
        diagnostics: diagLog(domain, providerUsed, providerResponseStatus, 'SUSPICIOUS_CONTENT', attemptLog),
      }, { status: 422 })
    }

    // Never silently accept a page that isn't actually the pasted
    // retailer's domain (e.g. a proxy fallback landing on an
    // unrelated redirect target).
    if (raw.canonicalUrl) {
      try {
        const canonicalHost = new URL(raw.canonicalUrl).hostname.replace('www.', '')
        if (!domainsRelated(canonicalHost, domain)) {
          return NextResponse.json({
            error: 'This link did not match the expected retailer page. Please check the URL.', url: parsed.href,
            diagnostics: diagLog(domain, providerUsed, providerResponseStatus, 'DOMAIN_MISMATCH', attemptLog),
          }, { status: 422 })
        }
      } catch {}
    }

    const priceNum = cleanPrice(raw.rawPrice || '')
    const isIndian = domain.endsWith('.in') || ['nykaa','myntra','flipkart','ajio','meesho','tirabeauty'].some(s => domain.includes(s))
    const price = priceNum ? `${isIndian ? '₹' : '$'}${priceNum}` : ''

    const description = decodeEntities(g(fetched.html, [
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
    if (!price) warnings.push('Current price unavailable — enter the sale price manually.')
    if (!raw.image) warnings.push('Product image unavailable — add it manually.')

    return NextResponse.json({
      title: raw.title, description, image: raw.image, price, brand: raw.brand,
      category, url: parsed.href, domain, warnings,
      diagnostics: diagLog(domain, providerUsed, providerResponseStatus, 'OK', attemptLog),
    })
  } catch {
    return NextResponse.json({
      error: 'Something went wrong. Please try again.',
      diagnostics: diagLog(domain, providerUsed, providerResponseStatus, 'SERVER_ERROR', attemptLog),
    }, { status: 500 })
  }
}
