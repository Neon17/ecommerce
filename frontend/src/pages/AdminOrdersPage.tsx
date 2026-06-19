import { useEffect, useState } from 'react';

const BASEURL = import.meta.env.VITE_DJANGO_BASE_URL || 'http://localhost:8000';

type OrderItem = {
    id: number;
    product_name: string;
    quantity: number;
    price: string;
};

type SubOrder = {
    id: number;
    shop: number;
    shop_name: string;
    subtotal: string;
    status: string;
    items: OrderItem[];
};

type Order = {
    id: number;
    username: string;
    created_at: string;
    total_price: string;
    name: string;
    address: string;
    phone: string;
    payment_method: string;
    status: string;
    is_paid: boolean;
    items: OrderItem[];
    sub_orders: SubOrder[];
};

const SUBORDER_STATUS_META: Record<string, { label: string; className: string }> = {
    pending: { label: 'Pending', className: 'bg-yellow-100 text-yellow-700' },
    confirmed: { label: 'Confirmed', className: 'bg-green-100 text-green-700' },
    shipped: { label: 'Shipped', className: 'bg-indigo-100 text-indigo-700' },
    delivered: { label: 'Delivered', className: 'bg-gray-200 text-gray-700' },
};

const subStatusMeta = (value: string) =>
    SUBORDER_STATUS_META[value] ?? SUBORDER_STATUS_META.pending;

const STATUS_OPTIONS = [
    { value: 'pending', label: 'Pending' },
    { value: 'paid', label: 'Paid' },
    { value: 'confirmed', label: 'Confirmed' },
    { value: 'on_road', label: 'On the way' },
    { value: 'delivered', label: 'Delivered' },
];

const STATUS_META: Record<string, string> = {
    pending: 'bg-yellow-100 text-yellow-700',
    paid: 'bg-blue-100 text-blue-700',
    confirmed: 'bg-green-100 text-green-700',
    on_road: 'bg-indigo-100 text-indigo-700',
    delivered: 'bg-gray-200 text-gray-700',
};

const statusLabel = (value: string) =>
    STATUS_OPTIONS.find((s) => s.value === value)?.label ?? value;

function AdminOrdersPage() {
    const [orders, setOrders] = useState<Order[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [savingId, setSavingId] = useState<number | null>(null);
    const [expanded, setExpanded] = useState<Set<number>>(new Set());

    const toggleExpanded = (orderId: number) =>
        setExpanded((prev) => {
            const next = new Set(prev);
            next.has(orderId) ? next.delete(orderId) : next.add(orderId);
            return next;
        });

    const fetchOrders = async () => {
        try {
            const token = localStorage.getItem('token');
            const response = await fetch(`${BASEURL}/api/admin/orders/`, {
                headers: { Authorization: `Bearer ${token}` },
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
    }, []);

    const updateStatus = async (orderId: number, status: string) => {
        setSavingId(orderId);
        setError(null);
        try {
            const token = localStorage.getItem('token');
            const response = await fetch(`${BASEURL}/api/admin/orders/${orderId}/status/`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({ status }),
            });
            const data = await response.json();
            if (!response.ok) {
                throw new Error(data.error || 'Failed to update order');
            }
            // Update just this order in place using what the server returned.
            setOrders((prev) =>
                prev.map((o) =>
                    o.id === orderId ? { ...o, status: data.status, is_paid: data.is_paid } : o
                )
            );
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Something went wrong');
        } finally {
            setSavingId(null);
        }
    };

    // Quick numbers for the summary cards.
    const totalOrders = orders.length;
    const pendingCount = orders.filter((o) => o.status === 'pending').length;
    const revenue = orders
        .filter((o) => o.is_paid)
        .reduce((sum, o) => sum + Number(o.total_price), 0);

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-100">
                <p className="text-gray-600">Loading orders...</p>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-100 p-6">
            <div className="max-w-5xl mx-auto">
                <div className="mb-6">
                    <h1 className="text-2xl font-bold">Admin Dashboard</h1>
                    <p className="text-gray-500">Manage every order placed in your store.</p>
                </div>

                {/* Summary cards */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
                    <div className="bg-white rounded-xl shadow p-5">
                        <p className="text-sm text-gray-500">Total Orders</p>
                        <p className="text-3xl font-bold mt-1">{totalOrders}</p>
                    </div>
                    <div className="bg-white rounded-xl shadow p-5">
                        <p className="text-sm text-gray-500">Pending</p>
                        <p className="text-3xl font-bold mt-1 text-yellow-600">{pendingCount}</p>
                    </div>
                    <div className="bg-white rounded-xl shadow p-5">
                        <p className="text-sm text-gray-500">Revenue (paid)</p>
                        <p className="text-3xl font-bold mt-1 text-green-600">${revenue.toFixed(2)}</p>
                    </div>
                </div>

                {error && <p className="text-red-600 mb-4">{error}</p>}

                {!error && orders.length === 0 && (
                    <p className="text-gray-600">No orders have been placed yet.</p>
                )}

                <div className="space-y-4">
                    {orders.map((order) => (
                        <div key={order.id} className="bg-white rounded-xl shadow p-5">
                            {/* Header row */}
                            <div className="flex flex-wrap justify-between items-start gap-3 mb-3">
                                <div>
                                    <div className="flex items-center gap-2">
                                        <span className="font-semibold">Order #{order.id}</span>
                                        <span
                                            className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                                                STATUS_META[order.status] ?? STATUS_META.pending
                                            }`}
                                        >
                                            {statusLabel(order.status)}
                                        </span>
                                        {order.is_paid && (
                                            <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-green-100 text-green-700">
                                                Paid
                                            </span>
                                        )}
                                    </div>
                                    <p className="text-sm text-gray-500 mt-1">
                                        by <span className="font-medium">{order.username}</span> ·{' '}
                                        {new Date(order.created_at).toLocaleString()}
                                    </p>
                                </div>
                                <span className="font-bold text-lg">${order.total_price}</span>
                            </div>

                            {/* Customer + items */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                                <div className="text-gray-700">
                                    <p className="font-medium text-gray-900 mb-1">Delivery</p>
                                    <p>{order.name}</p>
                                    <p>{order.address}</p>
                                    <p>{order.phone}</p>
                                    <p className="mt-1 text-gray-500">Payment: {order.payment_method}</p>
                                </div>
                                <div>
                                    <p className="font-medium text-gray-900 mb-1">Items</p>
                                    <ul className="divide-y">
                                        {order.items.map((item) => (
                                            <li key={item.id} className="flex justify-between py-1 text-gray-700">
                                                <span>{item.product_name} × {item.quantity}</span>
                                                <span>${item.price}</span>
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            </div>

                            {/* Per-shop breakdown — which shop, and what each has done. */}
                            {order.sub_orders?.length > 0 && (
                                <div className="mt-4 pt-4 border-t">
                                    <button
                                        onClick={() => toggleExpanded(order.id)}
                                        className="text-sm font-medium text-indigo-600 hover:text-indigo-800"
                                    >
                                        {expanded.has(order.id) ? '▾' : '▸'} Sub-orders
                                        <span className="text-gray-400 font-normal">
                                            {' '}({order.sub_orders.length} shop{order.sub_orders.length > 1 ? 's' : ''})
                                        </span>
                                    </button>

                                    {expanded.has(order.id) && (
                                        <div className="mt-3 space-y-3">
                                            {order.sub_orders.map((sub) => {
                                                const meta = subStatusMeta(sub.status);
                                                return (
                                                    <div
                                                        key={sub.id}
                                                        className="border border-gray-100 rounded-lg p-3 bg-gray-50"
                                                    >
                                                        <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
                                                            <div className="flex items-center gap-2">
                                                                <span className="font-medium text-gray-900">
                                                                    {sub.shop_name}
                                                                </span>
                                                                <span className="text-xs text-gray-400">
                                                                    (sub-order #{sub.id})
                                                                </span>
                                                                <span
                                                                    className={`text-xs font-medium px-2 py-0.5 rounded-full ${meta.className}`}
                                                                >
                                                                    {meta.label}
                                                                </span>
                                                            </div>
                                                            <span className="font-semibold text-gray-700">
                                                                ${sub.subtotal}
                                                            </span>
                                                        </div>
                                                        <ul className="divide-y text-sm">
                                                            {sub.items.map((it) => (
                                                                <li
                                                                    key={it.id}
                                                                    className="flex justify-between py-1 text-gray-700"
                                                                >
                                                                    <span>{it.product_name} × {it.quantity}</span>
                                                                    <span>${it.price}</span>
                                                                </li>
                                                            ))}
                                                        </ul>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    )}
                                </div>
                            )}

                            {/* Admin actions */}
                            <div className="mt-4 pt-4 border-t flex flex-wrap items-center gap-3">
                                <label className="text-sm text-gray-600">Change status:</label>
                                <select
                                    value={order.status}
                                    disabled={savingId === order.id}
                                    onChange={(e) => updateStatus(order.id, e.target.value)}
                                    className="border border-gray-300 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
                                >
                                    {STATUS_OPTIONS.map((s) => (
                                        <option key={s.value} value={s.value}>
                                            {s.label}
                                        </option>
                                    ))}
                                </select>

                                {order.status === 'pending' && (
                                    <button
                                        onClick={() => updateStatus(order.id, 'confirmed')}
                                        disabled={savingId === order.id}
                                        className="ml-auto bg-green-600 hover:bg-green-700 text-white text-sm font-medium px-4 py-1.5 rounded-lg disabled:opacity-50"
                                    >
                                        Approve order
                                    </button>
                                )}
                                {savingId === order.id && (
                                    <span className="text-sm text-gray-400">Saving...</span>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}

export default AdminOrdersPage;
