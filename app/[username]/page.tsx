import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { notFound } from 'next/navigation'
import StorefrontClient from './StorefrontClient'

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

  const { data: products } = await supabase
    .from('storefront_products')
    .select('id, title, brand, price, image_url, product_url, category')
    .eq('creator_id', creator.id)
    .eq('active', true)
    .order('created_at', { ascending: false })

  const { data: { user } } = await supabase.auth.getUser()
  const isOwner = user?.id === creator.id

  return (
    <StorefrontClient
      creator={creator}
      initialProducts={(products ?? []).map(p => ({
        id: p.id, title: p.title, brand: p.brand,
        price: p.price, image: p.image_url,
        url: p.product_url, category: p.category,
      }))}
      isOwner={isOwner}
    />
  )
}