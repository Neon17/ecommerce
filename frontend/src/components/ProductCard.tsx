import type { Product } from '@/src/types/Product';
import { Link } from 'react-router-dom';
import { useCart } from '@/src/context/CartContext';
import { useAuth } from '@/src/context/AuthContext';
import { slugFromSubdomain } from '@/src/lib/shop';

function ProductCard({ product }: { product: Product }) {
    const BASE_URL = import.meta.env.VITE_DJANGO_BASE_URL || 'http://localhost:8000';
    const { cartItems, addToCart, increaseQuantity, decreaseQuantity, removeFromCart } = useCart();
    const { user } = useAuth();

    // No buyer cart on a shop subdomain (manager-only) or for a shop manager.
    const cartDisabled = slugFromSubdomain() || !!user?.is_shop_manager;
    const quantity = cartItems.find(item => item.productId === product.id)?.quantity ?? 0;

    // The card is a Link — keep cart clicks from navigating to the detail page.
    const stop = (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
    };

    return (
        <Link to={`/products/${product.id}`} className="group flex flex-col overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-gray-100 transition duration-300 hover:-translate-y-1 hover:shadow-xl">
        <div className="group flex flex-col overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-gray-100 transition duration-300 hover:-translate-y-1 hover:shadow-xl">
            <div className="relative aspect-square w-full overflow-hidden bg-gray-100">
                <img
                    src={`${BASE_URL}/${product.image}`}
                    alt={product.name}
                    loading="lazy"
                    className="absolute inset-0 h-full w-full object-cover transition duration-500 group-hover:scale-105"
                />
                {product.category?.name && (
                    <span className="absolute left-3 top-3 rounded-full bg-white/90 px-2.5 py-1 text-xs font-medium text-gray-700 shadow-sm backdrop-blur">
                        {product.category.name}
                    </span>
                )}
            </div>

            <div className="flex flex-1 flex-col gap-2 p-4">
                <h2 className="truncate text-base font-semibold text-gray-900 sm:text-lg" title={product.name}>
                    {product.name}
                </h2>
                {product.description && (
                    <p className="line-clamp-2 text-sm text-gray-500">{product.description}</p>
                )}
                <div className="mt-auto flex items-center justify-between pt-2">
                    <span className="text-lg font-bold text-indigo-600">
                        ${Number(product.price).toFixed(2)}
                    </span>
                    {!cartDisabled && (
                        quantity === 0 ? (
                            <button
                                type="button"
                                onClick={(e) => { stop(e); addToCart(product); }}
                                className="rounded-lg bg-indigo-600 px-3 py-1.5 text-sm font-medium text-white transition hover:bg-indigo-700 active:scale-95"
                            >
                                Add
                            </button>
                        ) : (
                            <div className="flex items-center gap-2">
                                <button
                                    type="button"
                                    onClick={(e) => { stop(e); quantity <= 1 ? removeFromCart(product.id) : decreaseQuantity(product.id); }}
                                    className="w-8 h-8 flex items-center justify-center rounded-lg bg-gray-100 text-gray-700 hover:bg-gray-200 active:scale-95"
                                >
                                    −
                                </button>
                                <span className="w-6 text-center text-sm font-medium">{quantity}</span>
                                <button
                                    type="button"
                                    onClick={(e) => { stop(e); increaseQuantity(product.id); }}
                                    className="w-8 h-8 flex items-center justify-center rounded-lg bg-indigo-600 text-white hover:bg-indigo-700 active:scale-95"
                                >
                                    +
                                </button>
                            </div>
                        )
                    )}
                </div>
            </div>
        </div>
        </Link>
    );
}

export default ProductCard;
