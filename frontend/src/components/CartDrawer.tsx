import { useCart } from "../context/CartContext";
import { Link } from "react-router-dom";

const BASEURL = import.meta.env.VITE_DJANGO_BASE_URL || "http://localhost:8000";

const getImageUrl = (path?: string) => {
    if (!path) return "https://placehold.co/100x100?text=No+Image";
    if (path.startsWith("http")) return path;
    const clean = path.startsWith("/") ? path.slice(1) : path;
    return `${BASEURL}/${clean}`;
};

type CartDrawerProps = {
    open: boolean;
    onClose: () => void;
};

const CartDrawer = ({ open, onClose }: CartDrawerProps) => {
    const { cartItems, total, removeFromCart, increaseQuantity, decreaseQuantity } = useCart();

    return (
        <>
            {/* Backdrop */}
            <div
                onClick={onClose}
                className={`fixed inset-0 bg-black/40 z-40 transition-opacity duration-300 ${
                    open ? "opacity-100" : "opacity-0 pointer-events-none"
                }`}
            />

            {/* Drawer panel */}
            <aside
                className={`fixed top-0 right-0 h-full w-full max-w-md bg-white z-50 shadow-xl flex flex-col transition-transform duration-300 ${
                    open ? "translate-x-0" : "translate-x-full"
                }`}
            >
                <div className="flex items-center justify-between p-4 border-b">
                    <h2 className="text-lg font-bold">Your Cart</h2>
                    <button
                        onClick={onClose}
                        aria-label="Close cart"
                        className="text-gray-500 hover:text-gray-800 text-2xl leading-none"
                    >
                        &times;
                    </button>
                </div>

                <div className="flex-1 overflow-y-auto p-4">
                    {cartItems.length === 0 ? (
                        <p className="text-center text-gray-600 mt-10">Your cart is empty.</p>
                    ) : (
                        <ul className="divide-y divide-gray-100">
                            {cartItems.map((item) => (
                                <li key={item.id} className="py-4 flex items-center">
                                    <img
                                        src={getImageUrl(item.image)}
                                        alt={item.name}
                                        className="w-16 h-16 object-contain rounded"
                                        onError={(e) => {
                                            e.currentTarget.src = "https://placehold.co/100x100?text=No+Image";
                                        }}
                                    />
                                    <div className="flex-1 ml-4">
                                        <h3 className="font-semibold text-gray-900 text-sm">{item.name}</h3>
                                        <p className="text-gray-500 text-sm">${item.price.toFixed(2)}</p>
                                        <div className="flex items-center gap-2 mt-2">
                                            <button
                                                onClick={() => decreaseQuantity(item.productId)}
                                                disabled={item.quantity <= 1}
                                                className="w-7 h-7 flex items-center justify-center bg-gray-100 rounded text-gray-700 hover:bg-gray-200 disabled:opacity-40 disabled:cursor-not-allowed"
                                            >
                                                −
                                            </button>
                                            <span className="w-6 text-center text-sm font-medium">{item.quantity}</span>
                                            <button
                                                onClick={() => increaseQuantity(item.productId)}
                                                className="w-7 h-7 flex items-center justify-center bg-gray-100 rounded text-gray-700 hover:bg-gray-200"
                                            >
                                                +
                                            </button>
                                            <button
                                                onClick={() => removeFromCart(item.productId)}
                                                className="ml-auto text-red-500 text-sm hover:text-red-700"
                                            >
                                                Remove
                                            </button>
                                        </div>
                                    </div>
                                </li>
                            ))}
                        </ul>
                    )}
                </div>

                {cartItems.length > 0 && (
                    <div className="border-t p-4">
                        <div className="flex justify-between items-center mb-4">
                            <span className="font-semibold">Total:</span>
                            <span className="text-xl font-bold">${total.toFixed(2)}</span>
                        </div>
                        <Link
                            to="/checkout"
                            onClick={onClose}
                            className="block w-full text-center bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700 transition-colors"
                        >
                            Checkout
                        </Link>
                        <Link
                            to="/cart"
                            onClick={onClose}
                            className="block w-full text-center mt-2 text-blue-600 text-sm hover:underline"
                        >
                            View full cart
                        </Link>
                    </div>
                )}
            </aside>
        </>
    );
};

export default CartDrawer;
