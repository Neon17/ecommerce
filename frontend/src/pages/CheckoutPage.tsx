import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCart } from '@/src/context/CartContext';
import { useAuth } from '@/src/context/AuthContext';

const BASEURL = import.meta.env.VITE_DJANGO_BASE_URL || 'http://localhost:8000';

const refreshAccessToken = async (refreshToken: string): Promise<string | null> => {
  try {
    const response = await fetch(`${BASEURL}/api/refresh`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ refresh: refreshToken }),
    });
    const data = await response.json();
    if (response.ok && data.token) {
      localStorage.setItem("token", data.token);
      return data.token;
    }
    if (response.status === 401) {
      localStorage.removeItem("refresh_token");
    }
    return null;
  } catch (error) {
    console.error("Refresh failed:", error);
    return null;
  }
};

const getValidToken = async (): Promise<string | null> => {
  let token = localStorage.getItem("token");
  if (token) {
    return token;
  }
  const refreshToken = localStorage.getItem("refresh_token");
  if (!refreshToken) return null;
  return await refreshAccessToken(refreshToken);
};

function CheckoutPage() {
  const navigate = useNavigate();
  const { cartItems, clearCart } = useCart();
  const { logout, loading: authLoading } = useAuth(); // to handle logout

  const [form, setForm] = useState({
    name: "",
    address: "",
    phone: "",
    payment_method: "COD",
  });

  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-lg">Loading...</div>
      </div>
    );
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage(null);

    try {
      let token = await getValidToken();
      if (!token) {
        throw new Error("Your session has expired. Please log in again.");
      }

      let response = await fetch(`${BASEURL}/api/orders/create/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          ...form,
          items: cartItems.map(item => ({
            product_id: item.productId,
            quantity: item.quantity,
          })),
        }),
      });

      if (response.status === 401) {
        const refreshToken = localStorage.getItem("refresh_token");
        if (refreshToken) {
          const newToken = await refreshAccessToken(refreshToken);
          if (newToken) {
            response = await fetch(`${BASEURL}/api/orders/create/`, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${newToken}`,
              },
              body: JSON.stringify({
                ...form,
                items: cartItems.map(item => ({
                  product_id: item.productId,
                  quantity: item.quantity,
                })),
              }),
            });
            token = newToken;
          }
        }
        if (response.status === 401) {
          logout();
          throw new Error("Session expired. Please log in again.");
        }
      }

      if (response.ok) {
        setMessage('Order placed successfully!');
        clearCart();
        setTimeout(() => navigate('/orders'), 2000);
      } else {
        const data = await response.json();
        setMessage(data.error || 'Failed to place order. Please try again.');
      }
    } catch (error: any) {
      setMessage(error.message || 'An error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

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
              required
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
              required
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
              required
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
            <p className={`mt-4 text-center ${message.includes('success') ? 'text-green-600' : 'text-red-600'}`}>
              {message}
            </p>
          )}
        </form>
      </div>
    </div>
  );
}

export default CheckoutPage;