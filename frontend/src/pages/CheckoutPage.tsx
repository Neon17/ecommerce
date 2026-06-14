import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCart } from '@/src/context/CartContext';

const BASEURL = import.meta.env.VITE_DJANGO_BASE_URL || 'http://localhost:8000';

function CheckoutPage() {
    const navigate = useNavigate();
    const { cartItems, clearCart } = useCart();

    const [form, setForm] = useState({
        name: "",
        address: "",
        phone: "",
        payment_method: "COD",
    })

    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState<string | null>(null);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        setForm({ ...form, [e.target.name]: e.target.value });
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setMessage(null);

        try {
            const token = localStorage.getItem("token");
            const response = await fetch(`${BASEURL}/api/orders/create/`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`,
                },
                credentials: 'include',
                body: JSON.stringify({
                    ...form,
                    items: cartItems.map(item => ({
                        product_id: item.productId,
                        quantity: item.quantity,
                    })),
                }),
            });

            if (response.ok) {
                setMessage('Order placed successfully!');
                clearCart();
                setTimeout(() => navigate('/'), 2000);
            } else {
                const data = await response.json();
                setMessage(data.error || 'Failed to place order. Please try again.');
            }
        } catch (error) {
            setMessage('An error occurred while placing the order. Please try again.');
        } finally {
            setLoading(false);
        }
    }

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-100">
            <div className="bg-white p-8 rounded shadow-md w-full max-w-md">
                <h2 className="text-2xl font-bold mb-6 text-center">Checkout</h2>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium mb-1">Name</label>
                        <input
                            type="text"
                            name="name"
                            value={form.name}
                            onChange={handleChange}
                            className="w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring focus:border-blue-300"
                            placeholder="John Doe"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium mb-1">Address</label>
                        <input
                            type="text"
                            name="address"
                            value={form.address}
                            onChange={handleChange}
                            className="w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring focus:border-blue-300"
                            placeholder="123 Main St, City, Country"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium mb-1">Phone</label>
                        <input
                            type="text"
                            name="phone"
                            value={form.phone}
                            onChange={handleChange}
                            className="w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring focus:border-blue-300"
                            placeholder="+1234567890"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium mb-1">Payment Method</label>
                        <select
                            name="payment_method"
                            value={form.payment_method}
                            onChange={handleChange}
                            className="w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring focus:border-blue-300"
                        >
                            <option value="COD">Cash on Delivery</option>
                            <option value="CARD">Credit/Debit Card</option>
                            <option value="Esewa">Esewa</option>
                            <option value="Khalti">Khalti</option>
                        </select>
                    </div>
                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700 transition-colors"
                    >
                        {loading ? "Processing..." : "Place Order"}
                    </button>
                    {message && (
                        <p className={`mt-4 text-center text-red-600`}> 
                            {message}
                        </p>
                    )}
                </form>
            </div>
        </div>
    )
}

export default CheckoutPage;