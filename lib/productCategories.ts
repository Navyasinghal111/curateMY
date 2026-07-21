export const STORE_CATEGORIES = [
  'ALL', 'APPAREL', 'ACTIVEWEAR', 'COATS & OUTERWEAR', 'FOOTWEAR',
  'BAGS & PURSES', 'JEWELRY', 'WATCHES', 'EYEWEAR', 'MAKEUP', 'SKINCARE',
  'BATH & BODY', 'HAIRCARE', 'FRAGRANCES', 'NAILS', 'HOME DECOR', 'WISHLIST',
]

export const CATEGORY_SUBCATEGORIES: Record<string, string[]> = {
  APPAREL: ['Tops', 'Dresses', 'Bottoms', 'Denim', 'Knitwear', 'Sets', 'Occasionwear', 'Lingerie & Sleepwear'],
  ACTIVEWEAR: ['Sets', 'Leggings', 'Sports Bras', 'Training Tops', 'Activewear Outerwear'],
  FOOTWEAR: ['Sneakers', 'Flats', 'Heels', 'Boots', 'Sandals', 'Loafers'],
  'BAGS & PURSES': ['Totes', 'Shoulder Bags', 'Crossbody Bags', 'Clutches', 'Backpacks', 'Travel Bags'],
  JEWELRY: ['Earrings', 'Necklaces', 'Rings', 'Bracelets', 'Anklets', 'Hair Accessories'],
  WATCHES: ['Everyday Watches', 'Dress Watches', 'Smartwatches', 'Watch Straps'],
  EYEWEAR: ['Sunglasses', 'Optical Frames', 'Blue-light Glasses'],
  MAKEUP: [
    'Foundation & Concealer', 'Primer, Powder & Setting', 'Blush, Bronzer & Highlighter',
    'Lipstick, Gloss & Liner', 'Lip & Cheek Tint', 'Eyeshadow, Eyeliner & Mascara', 'Brows', 'Palettes',
    'Brushes, Sponges & Tools', 'Makeup Remover',
  ],
  SKINCARE: ['Cleansers', 'Serums', 'Moisturisers', 'Sunscreen', 'Toners & Essences', 'Masks', 'Eye Care', 'Acne Care', 'Lip Care'],
  'BATH & BODY': ['Body Wash', 'Body Lotion', 'Body Oils', 'Hand Care', 'Deodorants', 'Bath Soaks', 'Body SPF'],
  HAIRCARE: ['Shampoo', 'Conditioner', 'Hair Masks', 'Scalp Care', 'Styling', 'Hair Tools', 'Hair Accessories'],
  FRAGRANCES: ['Perfume', 'Mists', 'Discovery Sets', 'Candles', 'Diffusers'],
  'HOME DECOR': ['Candles & Home Fragrance', 'Tableware', 'Bedding', 'Lighting', 'Mirrors', 'Vases & Objects', 'Storage', 'Books & Coffee-table Objects'],
}

export const PRODUCT_CATEGORIES = STORE_CATEGORIES
  .filter(category => category !== 'ALL' && category !== 'WISHLIST')
  .flatMap(category => [
    category,
    ...(CATEGORY_SUBCATEGORIES[category] ?? []).map(subcategory => `${category} - ${subcategory}`),
  ])

export function normalizeProductCategory(value: string | null | undefined) {
  const normalized = value?.trim().toUpperCase()
  return PRODUCT_CATEGORIES.find(category => category.toUpperCase() === normalized) || 'SKINCARE'
}

export function matchesProductCategory(productCategory: string, selectedCategory: string) {
  const category = productCategory?.toUpperCase()

  if (CATEGORY_SUBCATEGORIES[selectedCategory]) {
    return category === selectedCategory || category?.startsWith(`${selectedCategory} - `)
  }

  if (category === 'JEWELRY & WATCHES') {
    return selectedCategory === 'JEWELRY' || selectedCategory === 'WATCHES'
  }

  return category === selectedCategory
}
