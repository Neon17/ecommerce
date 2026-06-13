import type { CartItem } from "@/src/types/Cart";
import type { Product } from "@/src/types/Product";
import { createContext, useState, useContext, useEffect } from "react";

const BASEURL = import.meta.env.VITE_DJANGO_BASE_URL || "http://localhost:8000"

type CartContextType = {
    cartItems: CartItem[];
    total: number;
    addToCart: (product: Product, quantity?: number) => Promise<void>;
    increaseQuantity: (productId: number) => Promise<void>;
    decreaseQuantity: (productId: number) => Promise<void>;
    removeFromCart: (productId: number) => Promise<void>;
    syncAfterLogin: () => Promise<void>;
}

const CartContext = createContext<CartContextType>({
    cartItems: [],
    total: 0,
    addToCart: async () => {},
    increaseQuantity: async () => {},
    decreaseQuantity: async () => {},
    removeFromCart: async () => {},
    syncAfterLogin: async () => {}
});

export function CartProvider({ children }: { children: React.ReactNode }) {
    const [cartItems, setCartItems] = useState<CartItem[]>([])
    const [total, setTotal] = useState<number>(0)
    const [isCookieEnabled, setIsCookieEnabled] = useState<boolean>(true)

    const applyServerCart = (cart: any) => {
        const items: CartItem[] = (cart.items || []).map((item: any) => ({
            id: item.id,
            productId: item.product,
            name: item.product_name,
            image: item.product_image,
            price: Number(item.product_price),
            quantity: item.quantity
        }))
        setCartItems(items)
        setTotal(Number(cart.total) || 0)
    }

    const saveLocalCart = (items: CartItem[]) => {
        setCartItems(items)
        setTotal(items.reduce((sum, item) => sum + item.price * item.quantity, 0))
        localStorage.setItem("cartItems", JSON.stringify(items))
    }

    useEffect(() => {
        if (!navigator.cookieEnabled) {
            setIsCookieEnabled(false)
            const storedCart = localStorage.getItem("cartItems")
            if (storedCart) {
                saveLocalCart(JSON.parse(storedCart))
            }
        } else {
            const fetchCart = async () => {
                try {
                    const response = await fetch(`${BASEURL}/api/cart/`, {
                        method: "GET",
                        headers: {
                            "Content-Type": "application/json"
                        },
                        credentials: "include"
                    })
                    if (response.ok) {
                        applyServerCart(await response.json())
                    } else {
                        console.error("Failed to fetch cart from server")
                    }
                } catch (error) {
                    console.error("Error fetching cart:", error)
                }
            }
            fetchCart()
        }
    }, [])

    const addToCart = async (product: Product, quantity: number = 1) => {
        if (isCookieEnabled) {
            try {
                const response = await fetch(`${BASEURL}/api/cart/add/`, {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json"
                    },
                    credentials: "include",
                    body: JSON.stringify({ product_id: product.id, quantity })
                })
                if (response.ok) {
                    applyServerCart(await response.json())
                } else {
                    console.error("Failed to add item to cart on server")
                }
            } catch (error) {
                console.error("Error adding item to cart:", error)
            }
        } else {
            const existing = cartItems.find(item => item.productId === product.id)
            const updated = existing
                ? cartItems.map(item => item.productId === product.id ? { ...item, quantity: item.quantity + quantity } : item)
                : [...cartItems, {
                    id: product.id,
                    productId: product.id,
                    name: product.name,
                    image: product.image,
                    price: Number(product.price),
                    quantity
                }]
            saveLocalCart(updated)
        }
    }

    const changeQuantity = async (productId: number, delta: number) => {
        const current = cartItems.find(item => item.productId === productId)
        if (!current) return
        const quantity = current.quantity + delta
        if (quantity < 1) return

        if (isCookieEnabled) {
            try {
                const response = await fetch(`${BASEURL}/api/cart/update/`, {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json"
                    },
                    credentials: "include",
                    body: JSON.stringify({ product_id: productId, quantity })
                })
                if (response.ok) {
                    applyServerCart(await response.json())
                } else {
                    console.error("Failed to update cart on server")
                }
            } catch (error) {
                console.error("Error updating cart:", error)
            }
        } else {
            saveLocalCart(cartItems.map(item => item.productId === productId ? { ...item, quantity } : item))
        }
    }

    const increaseQuantity = (productId: number) => changeQuantity(productId, 1)
    const decreaseQuantity = (productId: number) => changeQuantity(productId, -1)

    const removeFromCart = async (productId: number) => {
        if (isCookieEnabled) {
            try {
                const response = await fetch(`${BASEURL}/api/cart/remove/`, {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json"
                    },
                    credentials: "include",
                    body: JSON.stringify({ product_id: productId })
                })
                if (response.ok) {
                    applyServerCart(await response.json())
                } else {
                    console.error("Failed to remove item from cart on server")
                }
            } catch (error) {
                console.error("Error removing item from cart:", error)
            }
        } else {
            saveLocalCart(cartItems.filter(item => item.productId !== productId))
        }
    }

    const syncAfterLogin = async () => {
        const token = localStorage.getItem("jwtToken")
        if (!token || cartItems.length === 0) return;
        
        if (isCookieEnabled) {
            try {
                await fetch(`${BASEURL}/api/merge-cart/`, {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                        "Authorization": `Bearer ${token}`
                    },
                    credentials: "include"
                })
            } catch (error) {
                console.error("Error merging cart:", error)
            }
        } else {
            const storedCart = localStorage.getItem("cartItems")
            if (storedCart) {
                const items = JSON.parse(storedCart).map((item: CartItem) => ({
                    product_id: item.productId,
                    quantity: item.quantity
                }))
                try {
                    const response = await fetch(`${BASEURL}/api/sync-local-cart/`, {
                        method: "POST",
                        headers: {
                            "Content-Type": "application/json",
                            "Authorization": `Bearer ${token}`
                        },
                        body: JSON.stringify({ items })
                    })
                    if (response.ok) {
                        localStorage.removeItem("cartItems")
                    }
                } catch (error) {
                    console.error("Error syncing local cart:", error)
                }
            }
        }
    }

    return (
        <CartContext.Provider value = {{ cartItems, total, addToCart, increaseQuantity, decreaseQuantity, removeFromCart, syncAfterLogin }}>
            {children}
        </CartContext.Provider>
    )
}

export function useCart() {
    const context = useContext(CartContext)
    if (!context) {
        throw new Error("useCart must be used within a CartProvider")
    }
    return context
}
