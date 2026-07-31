import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { notFound } from 'next/navigation'
import StorefrontClient from './StorefrontClient'
import { logEvent } from '@/lib/logEvent'

type Props = { params: Promise<{ username: string }> }

export async function generateMetadata({ params }: Props) {
  const { username } = await params
  const cookieStore = await cookies()
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { getAll: () => cookieStore.getAll() } }
  )
  const { data } = await supabase
    .from('profiles')
    .select('display_name, username, bio')
    .eq('username', username)
    .eq('status', 'approved')
    .single()
  if (!data) return { title: 'CurateKin' }
  return {
    title: `${data.display_name} — CurateKin`,
    description: data.bio ?? `Shop ${data.display_name}'s curated collection on CurateKin.`,
  }
}

export default async function StorefrontPage({ params }: Props) {
  const { username } = await params
  const cookieStore = await cookies()
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { getAll: () => cookieStore.getAll() } }
  )

  const { data: creator } = await supabase
    .from('profiles')
    .select('id, username, display_name, avatar_url, city, bio, instagram_handle, instagram_verified, primary_platform, primary_followers')
    .eq('username', username)
    .eq('status', 'approved')
    .single()

  if (!creator) notFound()

  // Awaited (not fire-and-forget) — in a serverless request handler the
  // function can terminate as soon as the response is sent, so an
  // un-awaited insert risks silently never completing.
  await logEvent(supabase, 'storefront_view', { creatorId: creator.id })

  const { data: products } = await supabase
    .from('storefront_products')
    .select('id, title, brand, price, price_original, image_url, product_url, category, description')
    .eq('creator_id', creator.id)
    .eq('active', true)
    .order('created_at', { ascending: false })

  // Edits are additive. Until the one-time Edits migration has run, the
  // storefront continues to render normally with no Edit entries.
  const { data: editRows, error: editsError } = await supabase
    .from('creator_edits')
    .select('id, title, cover_image_url')
    .eq('creator_id', creator.id)
    .eq('status', 'published')
    .order('published_at', { ascending: false })

  const editIds = editsError ? [] : (editRows ?? []).map(edit => edit.id)
  const { data: editProductRows } = editIds.length
    ? await supabase
        .from('creator_edit_products')
        .select('edit_id, product_id, position')
        .in('edit_id', editIds)
        .order('position', { ascending: true })
    : { data: [] as { edit_id: string; product_id: string; position: number }[] }

  const editProductIds = [...new Set((editProductRows ?? []).map(row => row.product_id))]
  const { data: editProducts } = editProductIds.length
    ? await supabase
        .from('storefront_products')
        .select('id, title, brand, price, price_original, image_url, product_url, category, description')
        .in('id', editProductIds)
        .eq('active', true)
    : { data: [] as typeof products }

  const productsById = new Map((editProducts ?? []).map(product => [product.id, product]))
  const productsByEdit = new Map<string, typeof products>()
  ;(editProductRows ?? []).forEach(row => {
    const product = productsById.get(row.product_id)
    if (product) productsByEdit.set(row.edit_id, [...(productsByEdit.get(row.edit_id) ?? []), product])
  })

  const { data: { user } } = await supabase.auth.getUser()
  const isOwner = user?.id === creator.id

  return (
    <StorefrontClient
      creator={creator}
      initialProducts={(products ?? []).map(p => ({
        id: p.id, title: p.title, brand: p.brand,
        price: p.price, priceOriginal: p.price_original, image: p.image_url,
        url: p.product_url, category: p.category,
        description: p.description,
      }))}
      initialEdits={(editRows ?? []).map(edit => ({
        id: edit.id,
        title: edit.title,
        coverImage: edit.cover_image_url,
        products: (productsByEdit.get(edit.id) ?? []).map(p => ({
          id: p.id, title: p.title, brand: p.brand,
          price: p.price, priceOriginal: p.price_original, image: p.image_url,
          url: p.product_url, category: p.category,
          description: p.description,
        })),
      }))}
      isOwner={isOwner}
    />
  )
}
