import { useCart } from "../context/CartContext";
import { Link } from "react-router-dom";

const BASEURL = import.meta.env.VITE_DJANGO_BASE_URL || "http://localhost:8000";


const getImageUrl = (path?: string) => {
    if (!path) return "https://placehold.co/100x100?text=No+Image";
    if (path.startsWith("http")) return path;
    const clean = path.startsWith("/") ? path.slice(1) : path;
    return `${BASEURL}/${clean}`;
};

function CartPage() {
    const { cartItems, total, removeFromCart, increaseQuantity, decreaseQuantity } = useCart();

    return (
        <div className="min-h-screen bg-gray-100 py-10 px-4">
            <h1 className="text-3xl font-bold text-center mb-8">🛒 Your Cart</h1>

            <div className="max-w-4xl mx-auto bg-white rounded-2xl shadow-lg p-8">
                {cartItems.length === 0 ? (
                    <p className="text-center text-gray-600">
                        Your cart is empty.{" "}
                        <a href="/products" className="text-blue-500 hover:underline">Shop now!</a>
                    </p>
                ) : (
                    <>
                        <ul className="divide-y divide-gray-100">
                            {cartItems.map((item) => (
                                <li key={item.id} className="py-6 flex items-center">
                                    <img
                                        src={getImageUrl(item.image)}
                                        alt={item.name}
                                        className="w-20 h-20 object-contain rounded"
                                        onError={(e) => {
                                            e.currentTarget.src = "https://placehold.co/100x100?text=No+Image";
                                        }}
                                    />
                                    <div className="flex-1 ml-6">
                                        <h2 className="text-lg font-bold text-gray-900">{item.name}</h2>
                                        <p className="text-gray-500">${item.price.toFixed(2)}</p>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <button
                                            onClick={() => decreaseQuantity(item.productId)}
                                            disabled={item.quantity <= 1}
                                            className="w-9 h-9 flex items-center justify-center bg-gray-100 rounded-lg text-gray-700 hover:bg-gray-200 disabled:opacity-40 disabled:cursor-not-allowed"
                                        >
                                            −
                                        </button>
                                        <span className="w-6 text-center font-medium">{item.quantity}</span>
                                        <button
                                            onClick={() => increaseQuantity(item.productId)}
                                            className="w-9 h-9 flex items-center justify-center bg-gray-100 rounded-lg text-gray-700 hover:bg-gray-200"
                                        >
                                            +
                                        </button>
                                        <button
                                            onClick={() => removeFromCart(item.productId)}
                                            className="ml-4 text-red-500 font-medium hover:text-red-700"
                                        >
                                            Remove
                                        </button>
                                    </div>
                                </li>
                            ))}
                        </ul>

                        <div className="border-t-2 border-gray-300 mt-2 pt-6 flex justify-between items-center">
                            <span className="text-xl font-bold">Total:</span>
                            <span className="text-2xl font-bold">${total.toFixed(2)}</span>
                            <Link to="/checkout" className="ml-6 bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors">
                               Checkout
                            </Link>
                        </div>
                    </>
                )}
            </div>
        </div>
    );
}

export default CartPage;
