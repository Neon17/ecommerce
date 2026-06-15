import { useEffect, useState } from 'react';
import EsewaCheckout from '@/src/payments/EsewaCheckout';
import KhaltiCheckout from '@/src/payments/KhaltiCheckout';

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
    status: string;
    is_paid: boolean;
    items: OrderItem[];
};

const ONLINE_METHODS = ['Esewa', 'Khalti'];

const STATUS_META: Record<string, { label: string; className: string }> = {
    pending: { label: 'Pending', className: 'bg-yellow-100 text-yellow-700' },
    paid: { label: 'Paid', className: 'bg-blue-100 text-blue-700' },
    confirmed: { label: 'Confirmed', className: 'bg-green-100 text-green-700' },
    on_road: { label: 'On the way', className: 'bg-indigo-100 text-indigo-700' },
    delivered: { label: 'Delivered', className: 'bg-gray-200 text-gray-700' },
};

function OrdersPage() {
    const [orders, setOrders] = useState<Order[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [refetchTrigger, setRefetchTrigger] = useState(0);

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
            const data = await response.json();
            setOrders(data);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Something went wrong');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchOrders();
    }, [refetchTrigger]);

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

    const onPaymentSuccess = () => {
        setRefetchTrigger(prev => prev + 1);
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
                                <div className="flex items-center gap-3">
                                    <span
                                        className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                                            (STATUS_META[order.status] ?? STATUS_META.pending).className
                                        }`}
                                    >
                                        {(STATUS_META[order.status] ?? STATUS_META.pending).label}
                                    </span>
                                    <span className="text-sm text-gray-500">
                                        {new Date(order.created_at).toLocaleDateString()}
                                    </span>
                                </div>
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
                            <div className="mt-3 flex items-center justify-between">
                                <button
                                    onClick={() => handleCancel(order.id)}
                                    className="text-sm text-red-600 hover:underline"
                                >
                                    Cancel order
                                </button>
                                {ONLINE_METHODS.includes(order.payment_method) && !order.is_paid && (
                                    <div className="w-36">
                                        {order.payment_method === 'Esewa' && (
                                            <EsewaCheckout
                                                orderId={order.id}
                                                onSuccess={onPaymentSuccess}
                                                onError={(msg) => setError(msg)}
                                            />
                                        )}
                                        {order.payment_method === 'Khalti' && (
                                            <KhaltiCheckout
                                                orderId={order.id}
                                                onSuccess={onPaymentSuccess}
                                                onError={(msg) => setError(msg)}
                                            />
                                        )}
                                    </div>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}

export default OrdersPage;