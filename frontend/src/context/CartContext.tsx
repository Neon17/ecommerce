import type { CartItem } from "@/src/types/Cart";
import type { Product } from "@/src/types/Product";
import { createContext, useState, useContext, useEffect } from "react";
import { useAuth } from "./AuthContext";

const BASEURL = import.meta.env.VITE_DJANGO_BASE_URL || "http://localhost:8000"

type CartContextType = {
    cartItems: CartItem[];
    total: number;
    addToCart: (product: Product, quantity?: number) => Promise<void>;
    increaseQuantity: (productId: number) => Promise<void>;
    decreaseQuantity: (productId: number) => Promise<void>;
    removeFromCart: (productId: number) => Promise<void>;
    clearCart: () => void;
    syncAfterLogin: () => Promise<void>;
}

const CartContext = createContext<CartContextType>({
    cartItems: [],
    total: 0,
    addToCart: async () => {},
    increaseQuantity: async () => {},
    decreaseQuantity: async () => {},
    removeFromCart: async () => {},
    clearCart: () => {},
    syncAfterLogin: async () => {}
});

export function CartProvider({ children }: { children: React.ReactNode }) {
    const [cartItems, setCartItems] = useState<CartItem[]>([])
    const [total, setTotal] = useState<number>(0)
    const [isCookieEnabled, setIsCookieEnabled] = useState<boolean>(true)
    const [mergePrompt, setMergePrompt] = useState<{ guest_count: number; user_count: number } | null>(null)
    const { user } = useAuth();

    const authHeaders = (): Record<string, string> => {
        const headers: Record<string, string> = { "Content-Type": "application/json" }
        const token = localStorage.getItem("token")
        if (token) headers["Authorization"] = `Bearer ${token}`
        return headers
    }

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

    const fetchServerCart = async () => {
        try {
            const response = await fetch(`${BASEURL}/api/cart/`, {
                method: "GET",
                headers: authHeaders(),
                credentials: "include",
            });
            if (response.ok) {
                const cartData = await response.json();
                applyServerCart(cartData);
            } else {
                console.error("Failed to fetch cart from server");
            }
        } catch (error) {
            console.error("Error fetching cart:", error);
        }
    };

    useEffect(() => {
        if (isCookieEnabled) fetchServerCart();
    }, [user])

    useEffect(() => {
        if (!navigator.cookieEnabled) {
            setIsCookieEnabled(false)
            const storedCart = localStorage.getItem("cartItems")
            if (storedCart) {
                saveLocalCart(JSON.parse(storedCart))
            }
        }
    }, [])

    const addToCart = async (product: Product, quantity: number = 1) => {
        if (isCookieEnabled) {
            try {
                const response = await fetch(`${BASEURL}/api/cart/add/`, {
                    method: "POST",
                    headers: authHeaders(),
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
                    headers: authHeaders(),
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
                    headers: authHeaders(),
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

    const clearCart = () => {
        setCartItems([])
        setTotal(0)
        localStorage.removeItem("cartItems")
    }

    const syncAfterLogin = async () => {
        const token = localStorage.getItem("token")
        if (!token) return;

        if (isCookieEnabled) {
            try {
                const response = await fetch(`${BASEURL}/api/merge-cart/`, {
                    method: "POST",
                    headers: authHeaders(),
                    credentials: "include"
                })
                const data = await response.json()
                if (data.status === "needs_choice") {
                    setMergePrompt({ guest_count: data.guest_count, user_count: data.user_count })
                    return
                }
                await fetchServerCart()
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

    const resolveMerge = async (mode: "merge" | "discard" | "clear") => {
        try {
            await fetch(`${BASEURL}/api/merge-cart/`, {
                method: "POST",
                headers: authHeaders(),
                credentials: "include",
                body: JSON.stringify({ mode })
            })
            await fetchServerCart()
        } catch (error) {
            console.error("Error resolving cart merge:", error)
        } finally {
            setMergePrompt(null)
        }
    }

    return (
        <CartContext.Provider value = {{ cartItems, total, addToCart, increaseQuantity, decreaseQuantity, removeFromCart, clearCart, syncAfterLogin }}>
            {children}
            {mergePrompt && <MergeCartModal prompt={mergePrompt} onChoose={resolveMerge} />}
        </CartContext.Provider>
    )
}

type MergeCartModalProps = {
    prompt: { guest_count: number; user_count: number };
    onChoose: (mode: "merge" | "discard" | "clear") => void;
}

function MergeCartModal({ prompt, onChoose }: MergeCartModalProps) {
    return (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/40 p-4">
            <div className="w-full max-w-md rounded-lg bg-white p-6 shadow-xl">
                <h2 className="text-lg font-bold text-gray-900">Welcome back!</h2>
                <p className="mt-2 text-sm text-gray-600">
                    You have {prompt.guest_count} item{prompt.guest_count === 1 ? "" : "s"} in your guest cart
                    {prompt.user_count > 0 && (
                        <> and {prompt.user_count} item{prompt.user_count === 1 ? "" : "s"} saved to your account</>
                    )}
                    . What would you like to do?
                </p>
                <div className="mt-5 space-y-2">
                    <button
                        onClick={() => onChoose("merge")}
                        className="w-full rounded-lg bg-blue-600 py-2.5 text-sm font-medium text-white hover:bg-blue-700"
                    >
                        Merge into my account cart
                    </button>
                    <button
                        onClick={() => onChoose("discard")}
                        className="w-full rounded-lg border border-gray-300 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50"
                    >
                        Keep guest cart for later
                    </button>
                    <button
                        onClick={() => onChoose("clear")}
                        className="w-full rounded-lg border border-red-300 py-2.5 text-sm font-medium text-red-600 hover:bg-red-50"
                    >
                        Clear guest cart
                    </button>
                </div>
            </div>
        </div>
    )
}

export function useCart() {
    const context = useContext(CartContext)
    if (!context) {
        throw new Error("useCart must be used within a CartProvider")
    }
    return context
}
