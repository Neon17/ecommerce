import { createContext, useContext, useEffect, useState } from 'react'
import type { Product } from '@/src/types/Product'

export type CartItem = {
  id: number // CartItem id (used as React key)
  productId: number // Product id (used for all cart API calls)
  name: string
  price: number
  image: string
  quantity: number
}

type CartContextType = {
  cartItems: CartItem[]
  total: number
  addToCart: (product: Product) => void
  removeFromCart: (productId: number) => void
  updateQuantity: (productId: number, quantity: number) => void
  increaseQuantity: (productId: number) => void
  decreaseQuantity: (productId: number) => void
  clearCart: () => void
}

const CartContext = createContext<CartContextType>({
  cartItems: [],
  total: 0,
  addToCart: () => {},
  removeFromCart: () => {},
  updateQuantity: () => {},
  increaseQuantity: () => {},
  decreaseQuantity: () => {},
  clearCart: () => {},
})

const STORAGE_KEY = 'cart'

const toNumber = (value: unknown): number => {
  const n = typeof value === 'number' ? value : parseFloat(String(value))
  return Number.isFinite(n) ? n : 0
}

// Map a raw cart item from the Django CartSerializer to our CartItem shape.
const mapItem = (raw: any): CartItem => ({
  id: raw.id,
  productId: raw.product,
  name: raw.product_name,
  price: toNumber(raw.product_price),
  image: raw.product_image ?? '',
  quantity: toNumber(raw.quantity),
})

const computeTotal = (items: CartItem[]): number =>
  items.reduce((sum, item) => sum + item.price * item.quantity, 0)

const loadCart = (): CartItem[] => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw)
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

export const CartProvider = ({ children }: { children: React.ReactNode }) => {
  const BASEURL = import.meta.env.VITE_DJANGO_BASE_URL || 'http://localhost:8000'
  const initialItems = loadCart()
  const [cartItems, setCartItems] = useState<CartItem[]>(initialItems)
  const [total, setTotal] = useState(() => computeTotal(initialItems))

  // Apply a full cart payload from the backend (returned by every cart endpoint).
  const applyCart = (data: any) => {
    const items = Array.isArray(data?.items) ? data.items.map(mapItem) : []
    setCartItems(items)
    setTotal(toNumber(data?.total))
  }

  const fetchCart = async () => {
    try {
      const response = await fetch(`${BASEURL}/api/cart/`)
      if (!response.ok) throw new Error('Failed to fetch cart')
      applyCart(await response.json())
    } catch (error) {
      console.error('Error fetching cart:', error)
    }
  }

  useEffect(() => {
    fetchCart()
  }, [])

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(cartItems))
  }, [cartItems])

  const post = (path: string, body: object) =>
    fetch(`${BASEURL}/api/cart/${path}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    })

  const addToCart = async (product: Product) => {
    try {
      const response = await post('add/', { product_id: product.id, quantity: 1 })
      if (response.ok) applyCart(await response.json())
    } catch (error) {
      console.error('Error adding to cart:', error)
    }
  }

  const removeFromCart = async (productId: number) => {
    try {
      const response = await post('remove/', { product_id: productId })
      if (response.ok) applyCart(await response.json())
    } catch (error) {
      console.error('Error removing from cart:', error)
    }
  }

  const updateQuantity = async (productId: number, quantity: number) => {
    if (quantity < 1) return
    try {
      const response = await post('update/', { product_id: productId, quantity })
      if (response.ok) applyCart(await response.json())
    } catch (error) {
      console.error('Error updating cart quantity:', error)
    }
  }

  const increaseQuantity = (productId: number) => {
    const item = cartItems.find((i) => i.productId === productId)
    if (item) updateQuantity(productId, item.quantity + 1)
  }

  const decreaseQuantity = (productId: number) => {
    const item = cartItems.find((i) => i.productId === productId)
    if (item && item.quantity > 1) updateQuantity(productId, item.quantity - 1)
  }

  const clearCart = async () => {
    setCartItems([])
    setTotal(0)
  }

  return (
    <CartContext.Provider
      value={{
        cartItems,
        total,
        addToCart,
        removeFromCart,
        updateQuantity,
        increaseQuantity,
        decreaseQuantity,
        clearCart,
      }}
    >
      {children}
    </CartContext.Provider>
  )
}

export const useCart = () => useContext(CartContext)
