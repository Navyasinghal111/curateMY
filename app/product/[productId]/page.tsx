import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { notFound } from 'next/navigation'
import Link from 'next/link'

type Props = { params: Promise<{ productId: string }> }

function retailerName(url: string) {
  try {
    const host = new URL(url).hostname.replace(/^www\./, '')
    const name = host.split('.')[0]
    return name.charAt(0).toUpperCase() + name.slice(1)
  } catch {
    return 'retailer'
  }
}

export async function generateMetadata({ params }: Props) {
  const { productId } = await params
  const cookieStore = await cookies()
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { getAll: () => cookieStore.getAll() } }
  )
  const { data: product } = await supabase
    .from('storefront_products')
    .select('title, brand')
    .eq('id', productId)
    .eq('active', true)
    .maybeSingle()

  return { title: product ? `${product.title} | CurateKin` : 'CurateKin' }
}

export default async function ProductPage({ params }: Props) {
  const { productId } = await params
  const cookieStore = await cookies()
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { getAll: () => cookieStore.getAll() } }
  )

  const { data: product } = await supabase
    .from('storefront_products')
    .select('id, title, brand, price, image_url, product_url, category, description, creator_id')
    .eq('id', productId)
    .eq('active', true)
    .maybeSingle()

  if (!product) notFound()

  const { data: creator } = await supabase
    .from('profiles')
    .select('username, display_name, avatar_url')
    .eq('id', product.creator_id)
    .eq('status', 'approved')
    .maybeSingle()

  if (!creator) notFound()

  const retailer = retailerName(product.product_url)
  const backHref = `/${creator.username}`

  return (
    <main className="product-page">
      <style>{`
        *{box-sizing:border-box}
        .product-page{min-height:100vh;background:#F0EDE8;color:#1a1a1a;font-family:DM Sans,system-ui,sans-serif}
        .product-nav{height:72px;display:flex;align-items:center;justify-content:space-between;padding:0 48px;background:#1a1a1a;color:#fff}
        .product-logo{font-family:'Fanwood Text',Georgia,serif;font-size:28px;color:#fff;text-decoration:none}
        .product-logo em{color:#c89b63;font-style:italic}
        .back-link{font-size:11px;letter-spacing:.08em;text-transform:uppercase;color:#d8d2c8;text-decoration:none}
        .back-link:hover{color:#fff}
        .product-shell{display:grid;grid-template-columns:1fr 1fr;min-height:calc(100vh - 72px)}
        .product-visual{display:flex;align-items:center;justify-content:center;min-height:calc(100vh - 72px);padding:clamp(32px,7vw,100px);background:#E8E4DE;border-right:1px solid rgba(26,26,26,.1)}
        .product-visual img{display:block;width:100%;height:100%;max-height:calc(100vh - 180px);object-fit:contain;object-position:center}
        .product-visual-fallback{font-family:'Fanwood Text',Georgia,serif;font-size:96px;font-style:italic;color:rgba(26,26,26,.15)}
        .product-info{display:flex;flex-direction:column;justify-content:center;padding:clamp(36px,8vw,120px);background:#F7F5F1}
        .product-kicker{margin:0 0 18px;color:#8c867e;font-size:12px;letter-spacing:.1em;text-transform:uppercase}
        .product-title{max-width:620px;margin:0 0 24px;font-family:'Fanwood Text',Georgia,serif;font-size:clamp(38px,4.5vw,68px);font-weight:400;line-height:.98;letter-spacing:-.02em}
        .product-price{margin:0 0 32px;font-family:'Cormorant Garamond',Georgia,serif;font-size:27px;color:#312d29}
        .curator-line{display:flex;align-items:center;gap:10px;margin:0 0 34px;color:#8c867e;font-size:12px}
        .curator-line img,.curator-initials{width:28px;height:28px;border-radius:50%;object-fit:cover;background:#c8a47a}
        .curator-initials{display:flex;align-items:center;justify-content:center;color:#fff;font-family:'Fanwood Text',Georgia,serif;font-size:14px;font-style:italic}
        .curator-line a{color:#5e574f;text-decoration:underline;text-underline-offset:3px}
        .recommendation{max-width:540px;margin:0 0 34px;padding-top:20px;border-top:1px solid rgba(26,26,26,.16)}
        .recommendation-label{margin-bottom:7px;color:#a08f7c;font-size:10px;letter-spacing:.12em;text-transform:uppercase}
        .recommendation-text{font-family:'Fanwood Text',Georgia,serif;font-size:20px;font-style:italic;line-height:1.35;color:#5e574f}
        .shop-link{display:flex;align-items:center;justify-content:center;min-height:52px;max-width:420px;background:#1a1a1a;color:#fff;text-decoration:none;font-size:11px;font-weight:600;letter-spacing:.12em;text-transform:uppercase}
        .shop-link:hover{background:#38332e}
        .category-note{margin-top:18px;color:#a09a92;font-size:11px;letter-spacing:.08em;text-transform:uppercase}
        @media (max-width:768px){
          .product-nav{height:62px;padding:0 20px}.product-logo{font-size:23px}.back-link{font-size:9px}
          .product-shell{display:flex;flex-direction:column;min-height:calc(100vh - 62px)}
          .product-visual{order:0;min-height:52vh;height:52vh;padding:28px;border-right:0;border-bottom:1px solid rgba(26,26,26,.1)}
          .product-visual img{max-height:100%}.product-info{order:1;padding:38px 24px 56px;justify-content:flex-start}
          .product-title{font-size:42px}.product-price{font-size:24px;margin-bottom:24px}.curator-line{margin-bottom:28px}
        }
      `}</style>
      <nav className="product-nav">
        <Link className="product-logo" href="/">Curate<em>Kin</em></Link>
        <a className="back-link" href={backHref}>Back to {creator.display_name}&apos;s collection</a>
      </nav>
      <div className="product-shell">
        <div className="product-visual">
          {product.image_url ? (
            <img src={product.image_url} alt={product.title} />
          ) : (
            <span className="product-visual-fallback">{product.title.slice(0, 1)}</span>
          )}
        </div>
        <section className="product-info">
          <p className="product-kicker">{product.brand} <span aria-hidden="true">•</span> {product.category}</p>
          <h1 className="product-title">{product.title}</h1>
          <p className="product-price">{product.price}</p>
          <div className="curator-line">
            {creator.avatar_url ? (
              <img src={creator.avatar_url} alt="" />
            ) : (
              <span className="curator-initials">{creator.display_name.slice(0, 1)}</span>
            )}
            <span>Curated by <a href={backHref}>{creator.display_name}</a></span>
          </div>
          {product.description && (
            <div className="recommendation">
              <p className="recommendation-label">Why this curator picked it</p>
              <p className="recommendation-text">{product.description}</p>
            </div>
          )}
          <a className="shop-link" href={`/r/${product.id}`} target="_blank" rel="noopener noreferrer">
            Shop now at {retailer}
          </a>
          <p className="category-note">Curated on CurateKin</p>
        </section>
      </div>
    </main>
  )
}
