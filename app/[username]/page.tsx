import { createClient } from '@/lib/supabase'
import { notFound } from 'next/navigation'

export default async function StorefrontPage({ params }: { params: Promise<{ username: string }> }) {
  const { username } = await params
  const supabase = createClient()

  const { data: profile } = await supabase.from('profiles').select('*').eq('username', username).single()

  if (!profile) {
    notFound()
  }

  const { data: products } = await supabase.from('products').select('*').eq('creator_id', profile.id).order('created_at', { ascending: false })

  return (
    <div className="max-w-2xl mx-auto p-8">
      <div className="flex flex-col items-center text-center mb-8">
        {profile.avatar_url && (
          <img src={profile.avatar_url} alt={profile.display_name || profile.username} className="w-24 h-24 rounded-full object-cover mb-4" />
        )}
        <h1 className="text-2xl font-bold">{profile.display_name || profile.username}</h1>
        <p className="text-gray-500">@{profile.username}</p>
        {profile.bio && <p className="mt-2 max-w-md">{profile.bio}</p>}
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
        {products && products.length > 0 ? products.map((product: any) => (
          <a key={product.id} href={`/r/${product.id}`} target="_blank" rel="noopener noreferrer" className="border rounded-lg overflow-hidden hover:shadow-lg transition">
            {product.image_url && (
              <img src={product.image_url} alt={product.title} className="w-full h-32 object-cover" />
            )}
            <div className="p-2">
              <p className="text-sm font-medium truncate">{product.title}</p>
              {product.price && <p className="text-sm text-gray-500">₹{product.price}</p>}
            </div>
          </a>
        )) : (
          <p className="text-gray-500 col-span-full text-center">No products yet.</p>
        )}
      </div>
    </div>
  )
}