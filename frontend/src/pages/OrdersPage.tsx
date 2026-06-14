import { useEffect, useState } from 'react';

const BASEURL = import.meta.env.VITE_DJANGO_BASE_URL || 'http://localhost:8000';

type OrderItem = {
    id: number;
    product_name: string;
    quantity: number;
    price: string;
};

type Order = {
    id: number;
    created_at: string;
    total_price: string;
    name: string;
    address: string;
    phone: string;
    payment_method: string;
    items: OrderItem[];
};

function OrdersPage() {
    const [orders, setOrders] = useState<Order[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchOrders = async () => {
            try {
                const token = localStorage.getItem('token');
                const response = await fetch(`${BASEURL}/api/orders/`, {
                    headers: { Authorization: `Bearer ${token}` },
                    credentials: 'include',
                });
                if (!response.ok) {
                    throw new Error('Failed to load orders');
                }
                setOrders(await response.json());
            } catch (err) {
                setError(err instanceof Error ? err.message : 'Something went wrong');
            } finally {
                setLoading(false);
            }
        };
        fetchOrders();
    }, []);

    const handleCancel = async (orderId: number) => {
        if (!window.confirm('Cancel this order?')) return;
        try {
            const token = localStorage.getItem('token');
            const response = await fetch(`${BASEURL}/api/orders/${orderId}/delete/`, {
                method: 'DELETE',
                headers: { Authorization: `Bearer ${token}` },
                credentials: 'include',
            });
            if (!response.ok) {
                throw new Error('Failed to cancel order');
            }
            setOrders((prev) => prev.filter((o) => o.id !== orderId));
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Something went wrong');
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-100">
                <p className="text-gray-600">Loading your orders...</p>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-100 p-6">
            <div className="max-w-2xl mx-auto">
                <h2 className="text-2xl font-bold mb-6">My Orders</h2>

                {error && <p className="text-red-600 mb-4">{error}</p>}

                {!error && orders.length === 0 && (
                    <p className="text-gray-600">You haven't placed any orders yet.</p>
                )}

                <div className="space-y-4">
                    {orders.map((order) => (
                        <div key={order.id} className="bg-white rounded shadow p-4">
                            <div className="flex justify-between items-center mb-2">
                                <span className="font-semibold">Order #{order.id}</span>
                                <span className="text-sm text-gray-500">
                                    {new Date(order.created_at).toLocaleDateString()}
                                </span>
                            </div>
                            <ul className="text-sm text-gray-700 mb-2 divide-y">
                                {order.items.map((item) => (
                                    <li key={item.id} className="flex justify-between py-1">
                                        <span>{item.product_name} × {item.quantity}</span>
                                        <span>${item.price}</span>
                                    </li>
                                ))}
                            </ul>
                            <div className="flex justify-between text-sm border-t pt-2">
                                <span className="text-gray-500">{order.payment_method}</span>
                                <span className="font-bold">Total: ${order.total_price}</span>
                            </div>
                            <button
                                onClick={() => handleCancel(order.id)}
                                className="mt-3 text-sm text-red-600 hover:underline"
                            >
                                Cancel order
                            </button>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}

export default OrdersPage;
