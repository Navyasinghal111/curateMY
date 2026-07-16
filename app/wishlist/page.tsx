'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase'

type Product = {
  id: string
  title: string
  brand: string
  price: string
  image_url: string | null
  product_url: string | null
  category: string | null
  description: string | null
}

export default function WishlistPage() {
  const [products, setProducts] = useState<Product[]>([])
  const [userId, setUserId] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    let mounted = true

    const loadWishlist = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        router.replace('/login')
        return
      }

      if (!mounted) return
      setUserId(user.id)

      const { data: savedRows, error: savedError } = await supabase
        .from('saved_products')
        .select('product_id')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })

      if (savedError) {
        setError('We could not load your wishlist.')
        setLoading(false)
        return
      }

      const productIds = (savedRows ?? []).map(row => row.product_id)
      if (productIds.length === 0) {
        setProducts([])
        setLoading(false)
        return
      }

      const { data: productRows, error: productsError } = await supabase
        .from('storefront_products')
        .select('id, title, brand, price, image_url, product_url, category, description')
        .in('id', productIds)
        .eq('active', true)

      if (productsError) {
        setError('We could not load your wishlist.')
        setLoading(false)
        return
      }

      const productsById = new Map((productRows ?? []).map(product => [product.id, product]))
      setProducts(productIds.map(id => productsById.get(id)).filter((product): product is Product => Boolean(product)))
      setLoading(false)
    }

    loadWishlist()
    return () => { mounted = false }
  }, [])

  const removeProduct = async (productId: string) => {
    if (!userId) return

    const { error: removeError } = await supabase
      .from('saved_products')
      .delete()
      .eq('user_id', userId)
      .eq('product_id', productId)

    if (removeError) {
      setError('We could not update your wishlist. Please try again.')
      return
    }

    setProducts(previous => previous.filter(product => product.id !== productId))
  }

  return (
    <main className="wishlist-page">
      <style>{`
        *{box-sizing:border-box}
        .wishlist-page{min-height:100vh;background:#F0EDE8;color:#1a1a1a;font-family:'DM Sans',system-ui,sans-serif}
        .wishlist-nav{height:64px;display:flex;align-items:center;justify-content:space-between;padding:0 48px;background:#1a1a1a;color:#fff}
        .wishlist-logo{font-family:'Fanwood Text',Georgia,serif;font-size:28px;text-decoration:none;color:#fff}
        .wishlist-logo em{color:#C99A6A;font-style:italic}
        .wishlist-back{color:rgba(255,255,255,0.72);font-size:12px;text-decoration:none;letter-spacing:0.04em}
        .wishlist-back:hover{color:#fff}
        .wishlist-content{padding:58px 48px 88px;max-width:1500px;margin:0 auto}
        .wishlist-kicker{font-size:10px;letter-spacing:0.18em;color:#8B1A1A;text-transform:uppercase;margin-bottom:10px}
        .wishlist-title{font-family:'Fanwood Text',Georgia,serif;font-size:46px;font-weight:400;margin-bottom:10px}
        .wishlist-intro{font-size:13px;color:#8c867e;margin-bottom:34px}
        .wishlist-grid{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:16px}
        .wishlist-card{background:#fff;position:relative;display:flex;flex-direction:column;min-width:0}
        .wishlist-image-link{display:block;position:relative;text-decoration:none;color:inherit}
        .wishlist-image{aspect-ratio:4/5;background:#E8E4DE;padding:12px;display:flex;align-items:center;justify-content:center;overflow:hidden}
        .wishlist-image img{width:100%;height:100%;object-fit:contain;object-position:center}
        .wishlist-placeholder{font-family:'Fanwood Text',Georgia,serif;font-size:56px;font-style:italic;color:rgba(26,26,26,0.14)}
        .wishlist-star{position:absolute;top:12px;right:12px;z-index:2;width:34px;height:34px;border:1px solid rgba(26,26,26,0.14);border-radius:50%;background:rgba(255,255,255,0.94);color:#8B1A1A;font-size:22px;line-height:1;cursor:pointer}
        .wishlist-star:hover{background:#fff}
        .wishlist-info{padding:14px 14px 16px;min-height:124px}
        .wishlist-brand{font-size:9px;letter-spacing:0.13em;text-transform:uppercase;color:#aaa;margin-bottom:5px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
        .wishlist-product-title{font-size:14px;line-height:1.4;font-weight:500;height:2.8em;overflow:hidden;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical}
        .wishlist-note{font-family:'Fanwood Text',Georgia,serif;font-style:italic;color:#8a8478;font-size:11px;margin-top:6px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
        .wishlist-price{font-family:'Cormorant Garamond',Georgia,serif;font-size:18px;margin-top:14px}
        .wishlist-shop{display:block;background:#1a1a1a;color:#fff;text-align:center;text-decoration:none;margin:0 14px 14px;padding:10px;font-size:11px;letter-spacing:0.08em}
        .wishlist-shop:hover{background:#333}
        .wishlist-empty{background:#fff;padding:90px 24px;text-align:center;border:1px solid rgba(26,26,26,0.08)}
        .wishlist-empty h2{font-family:'Fanwood Text',Georgia,serif;font-size:32px;font-weight:400;margin-bottom:10px}
        .wishlist-empty p{font-size:13px;color:#8c867e;margin-bottom:22px}
        .wishlist-explore{display:inline-block;background:#1a1a1a;color:#fff;text-decoration:none;padding:11px 18px;font-size:11px;letter-spacing:0.08em}
        .wishlist-error{color:#8B1A1A;font-size:13px;margin:18px 0}
        .wishlist-loading{font-family:'Fanwood Text',Georgia,serif;font-size:26px;font-style:italic;color:#8c867e;padding:70px 0}
        @media (max-width:1100px){.wishlist-grid{grid-template-columns:repeat(3,minmax(0,1fr))}}
        @media (max-width:768px){
          .wishlist-nav{height:56px;padding:0 20px}
          .wishlist-logo{font-size:24px}
          .wishlist-content{padding:38px 16px 60px}
          .wishlist-title{font-size:36px}
          .wishlist-grid{grid-template-columns:repeat(2,minmax(0,1fr));gap:10px}
          .wishlist-info{padding:10px;height:120px;min-height:0}
          .wishlist-product-title{font-size:12px}
          .wishlist-price{font-size:16px;margin-top:10px}
          .wishlist-shop{margin:0 10px 10px;padding:8px;font-size:10px}
        }
      `}</style>

      <nav className="wishlist-nav">
        <Link href="/" className="wishlist-logo">Curate<em>Kin</em></Link>
        <Link href="/creators" className="wishlist-back">BACK TO BROWSING</Link>
      </nav>

      <section className="wishlist-content">
        <p className="wishlist-kicker">Your saved pieces</p>
        <h1 className="wishlist-title">Wishlist</h1>
        <p className="wishlist-intro">A private edit of the pieces you want to come back to.</p>

        {error && <p className="wishlist-error">{error}</p>}
        {loading ? (
          <p className="wishlist-loading">Loading your edit...</p>
        ) : products.length === 0 ? (
          <div className="wishlist-empty">
            <h2>Your wishlist is empty</h2>
            <p>Save pieces from any curator and they will gather here.</p>
            <Link href="/creators" className="wishlist-explore">EXPLORE CURATORS</Link>
          </div>
        ) : (
          <div className="wishlist-grid">
            {products.map(product => (
              <article key={product.id} className="wishlist-card">
                <Link href={`/product/${product.id}`} className="wishlist-image-link">
                  <div className="wishlist-image">
                    {product.image_url
                      ? <img src={product.image_url} alt={product.title} />
                      : <span className="wishlist-placeholder">{product.title[0]}</span>}
                  </div>
                </Link>
                <button type="button" className="wishlist-star" aria-label={`Remove ${product.title} from wishlist`} onClick={() => removeProduct(product.id)}>★</button>
                <Link href={`/product/${product.id}`} className="wishlist-image-link">
                  <div className="wishlist-info">
                    <p className="wishlist-brand">{product.brand}</p>
                    <p className="wishlist-product-title">{product.title}</p>
                    {product.description && <p className="wishlist-note">{product.description}</p>}
                    <p className="wishlist-price">{product.price}</p>
                  </div>
                </Link>
                <a href={`/r/${product.id}`} target="_blank" rel="noopener noreferrer" className="wishlist-shop">SHOP NOW</a>
              </article>
            ))}
          </div>
        )}
      </section>
    </main>
  )
}
