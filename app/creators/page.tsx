import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import CreatorsClient from './CreatorsClient'

export const metadata = {
  title: 'Curators — CurateKin',
  description: 'Browse every curator on CurateKin — real people sharing the products they genuinely use.',
}

type Creator = {
  id: string
  username: string
  display_name: string
  avatar_url: string
  bio: string
  city?: string
  productCount: number
}

export default async function CreatorsPage() {
  const cookieStore = await cookies()
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { getAll: () => cookieStore.getAll() } }
  )

  const { data: profiles } = await supabase
    .from('profiles')
    .select('id, username, display_name, avatar_url, bio, city')
    .eq('status', 'approved')
    .order('created_at', { ascending: true })

  // Count active products per creator without depending on any
  // implicit foreign-key relationship being auto-detected — just
  // fetch and count directly, which always works.
  const { data: products } = await supabase
    .from('storefront_products')
    .select('creator_id')
    .eq('active', true)

  const counts = new Map<string, number>()
  for (const p of products ?? []) {
    counts.set(p.creator_id, (counts.get(p.creator_id) ?? 0) + 1)
  }

  const creators: Creator[] = (profiles ?? []).map(p => ({
    ...p,
    productCount: counts.get(p.id) ?? 0,
  }))

  return <CreatorsClient creators={creators} />
}