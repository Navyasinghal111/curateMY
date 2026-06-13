import { createClient } from '@/lib/supabase'
import { NextResponse } from 'next/server'

export async function GET(
  request: Request,
  { params }: { params: Promise<{ productId: string }> }
) {
  const { productId } = await params
  const supabase = createClient()

  const { data: product } = await supabase
    .from('products')
    .select('affiliate_url')
    .eq('id', productId)
    .single()

  if (!product) {
    return NextResponse.redirect(new URL('/', request.url))
  }

  await supabase.from('clicks').insert({ product_id: productId })

  return NextResponse.redirect(product.affiliate_url)
}