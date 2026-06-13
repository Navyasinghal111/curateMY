'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase'
import { useRouter } from 'next/navigation'

export default function Dashboard() {
  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState('')

  const [username, setUsername] = useState('')
  const [displayName, setDisplayName] = useState('')
  const [bio, setBio] = useState('')
  const [avatarUrl, setAvatarUrl] = useState('')

  const [products, setProducts] = useState<any[]>([])
  const [productTitle, setProductTitle] = useState('')
  const [productImage, setProductImage] = useState('')
  const [productPrice, setProductPrice] = useState('')
  const [productUrl, setProductUrl] = useState('')
  const [productSaving, setProductSaving] = useState(false)
  const [productMessage, setProductMessage] = useState('')

  const router = useRouter()
  const supabase = createClient()

  const loadProducts = async (userId: string) => {
    const { data } = await supabase
      .from('products')
      .select('*')
      .eq('creator_id', userId)
      .order('created_at', { ascending: false })

    setProducts(data || [])
  }

  useEffect(() => {
    const checkUser = async () => {
      const { data } = await supabase.auth.getUser()
      if (!data.user) {
        router.push('/login')
        return
      }
      setUser(data.user)

      const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', data.user.id)
        .single()

      if (profile) {
        setUsername(profile.username || '')
        setDisplayName(profile.display_name || '')
        setBio(profile.bio || '')
        setAvatarUrl(profile.avatar_url || '')
      }

      await loadProducts(data.user.id)

      setLoading(false)
    }
    checkUser()
  }, [])

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    setMessage('')

    const { error } = await supabase
      .from('profiles')
      .update({
        display_name: displayName,
        bio,
        avatar_url: avatarUrl,
      })
      .eq('id', user.id)

    if (error) {
      setMessage('Error: ' + error.message)
    } else {
      setMessage('Profile updated!')
    }
    setSaving(false)
  }

  const handleAddProduct = async (e: React.FormEvent) => {
    e.preventDefault()
    setProductSaving(true)
    setProductMessage('')

    const { error } = await supabase.from('products').insert({
      creator_id: user.id,
      title: productTitle,
      image_url: productImage,
      price: productPrice ? parseFloat(productPrice) : null,
      original_url: productUrl,
      affiliate_url: productUrl, // for now, same as original — affiliate conversion comes later
    })

    if (error) {
      setProductMessage('Error: ' + error.message)
    } else {
      setProductMessage('Product added!')
      setProductTitle('')
      setProductImage('')
      setProductPrice('')
      setProductUrl('')
      await loadProducts(user.id)
    }
    setProductSaving(false)
  }

  const handleDeleteProduct = async (id: string) => {
    await supabase.from('products').delete().eq('id', id)
    await loadProducts(user.id)
  }

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push('/login')
  }

  if (loading) return <p className="p-8">Loading...</p>

  return (
    <div className="p-8 max-w-md">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Dashboard</h1>
        <button onClick={handleLogout} className="text-sm underline">
          Log Out
        </button>
      </div>

      <p className="mb-4 text-sm text-gray-500">
        Your storefront: /{username}
      </p>

      <h2 className="text-lg font-bold mb-2">Edit Profile</h2>
      <form onSubmit={handleSave} className="flex flex-col gap-4 mb-8">
        {message && <p className="text-sm">{message}</p>}

        <label className="flex flex-col gap-1">
          <span className="text-sm font-medium">Display Name</span>
          <input
            type="text"
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
            className="border p-2 rounded"
          />
        </label>

        <label className="flex flex-col gap-1">
          <span className="text-sm font-medium">Bio</span>
          <textarea
            value={bio}
            onChange={(e) => setBio(e.target.value)}
            className="border p-2 rounded"
            rows={3}
          />
        </label>

        <label className="flex flex-col gap-1">
          <span className="text-sm font-medium">Avatar URL</span>
          <input
            type="text"
            value={avatarUrl}
            onChange={(e) => setAvatarUrl(e.target.value)}
            className="border p-2 rounded"
            placeholder="https://example.com/photo.jpg"
          />
        </label>

        <button
          type="submit"
          disabled={saving}
          className="bg-black text-white p-2 rounded"
        >
          {saving ? 'Saving...' : 'Save Profile'}
        </button>
      </form>

      <h2 className="text-lg font-bold mb-2">Add Product</h2>
      <form onSubmit={handleAddProduct} className="flex flex-col gap-4 mb-8">
        {productMessage && <p className="text-sm">{productMessage}</p>}

        <label className="flex flex-col gap-1">
          <span className="text-sm font-medium">Product Title</span>
          <input
            type="text"
            value={productTitle}
            onChange={(e) => setProductTitle(e.target.value)}
            className="border p-2 rounded"
            required
          />
        </label>

        <label className="flex flex-col gap-1">
          <span className="text-sm font-medium">Image URL</span>
          <input
            type="text"
            value={productImage}
            onChange={(e) => setProductImage(e.target.value)}
            className="border p-2 rounded"
            placeholder="https://example.com/product.jpg"
          />
        </label>

        <label className="flex flex-col gap-1">
          <span className="text-sm font-medium">Price</span>
          <input
            type="number"
            value={productPrice}
            onChange={(e) => setProductPrice(e.target.value)}
            className="border p-2 rounded"
            placeholder="999"
          />
        </label>

        <label className="flex flex-col gap-1">
          <span className="text-sm font-medium">Product URL</span>
          <input
            type="text"
            value={productUrl}
            onChange={(e) => setProductUrl(e.target.value)}
            className="border p-2 rounded"
            placeholder="https://amazon.in/product-link"
            required
          />
        </label>

        <button
          type="submit"
          disabled={productSaving}
          className="bg-black text-white p-2 rounded"
        >
          {productSaving ? 'Adding...' : 'Add Product'}
        </button>
      </form>

      <h2 className="text-lg font-bold mb-2">Your Products</h2>
      <div className="flex flex-col gap-3">
        {products.length === 0 && (
          <p className="text-sm text-gray-500">No products yet.</p>
        )}
        {products.map((product) => (
          <div key={product.id} className="border p-3 rounded flex justify-between items-center">
            <div>
              <p className="font-medium">{product.title}</p>
              {product.price && <p className="text-sm text-gray-500">₹{product.price}</p>}
            </div>
            <button
              onClick={() => handleDeleteProduct(product.id)}
              className="text-sm text-red-500 underline"
            >
              Delete
            </button>
          </div>
        ))}
      </div>
    </div>
  )
}