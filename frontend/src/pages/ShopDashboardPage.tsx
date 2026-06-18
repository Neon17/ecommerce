import { useEffect, useState } from "react";
import { useAuth } from "@/src/context/AuthContext";
import { BASEURL } from "@/src/lib/auth";
import { getShopSlug, setShopSlug, slugFromSubdomain, shopFetch } from "@/src/lib/shop";
import type { SubOrder, ManagedProduct } from "@/src/types/SubOrder";

// SubOrder pipeline — keep in sync with SubOrder.STATUS_CHOICES on the backend.
const STATUS_FLOW = ["pending", "confirmed", "shipped", "delivered"] as const;
type SubStatus = (typeof STATUS_FLOW)[number];

const STATUS_META: Record<SubStatus, { label: string; className: string }> = {
    pending: { label: "Pending", className: "bg-yellow-100 text-yellow-700" },
    confirmed: { label: "Confirmed", className: "bg-green-100 text-green-700" },
    shipped: { label: "Shipped", className: "bg-indigo-100 text-indigo-700" },
    delivered: { label: "Delivered", className: "bg-gray-200 text-gray-700" },
};

const nextStatus = (s: SubStatus): SubStatus | null => {
    const i = STATUS_FLOW.indexOf(s);
    return i >= 0 && i < STATUS_FLOW.length - 1 ? STATUS_FLOW[i + 1] : null;
};

type Category = { id: number; name: string };

function ShopDashboardPage() {
    const { user } = useAuth();
    const [tab, setTab] = useState<"orders" | "products">("orders");
    // The active slug, plus a dev-only text field to switch it on localhost.
    const [slug, setSlug] = useState<string | null>(getShopSlug());
    const [slugInput, setSlugInput] = useState(slug ?? user?.shop?.slug ?? "");
    const onSubdomain = slugFromSubdomain();

    const applySlug = () => {
        setShopSlug(slugInput.trim());
        setSlug(getShopSlug());
    };

    return (
        <div className="min-h-screen bg-gray-100 p-6">
            <div className="max-w-5xl mx-auto">
                <div className="mb-6">
                    <h1 className="text-2xl font-bold">Shop Manager</h1>
                    <p className="text-gray-500">
                        Manage orders and products for your storefront.
                    </p>
                </div>

                {/* Shop context — the "subdomain" surface */}
                <div className="bg-white rounded-xl shadow p-5 mb-6">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                        <div>
                            <p className="text-sm text-gray-500">Active shop</p>
                            <p className="text-lg font-semibold">
                                {slug ? <span className="text-indigo-600">{slug}</span> : "— none —"}
                            </p>
                            <p className="text-xs text-gray-400 mt-0.5">
                                {onSubdomain
                                    ? "Resolved from this page's subdomain."
                                    : "No subdomain — using the slug you pick below (dev mode)."}
                            </p>
                        </div>
                        {!onSubdomain && (
                            <div className="flex items-end gap-2">
                                <div>
                                    <label className="block text-xs text-gray-500 mb-1">Shop slug</label>
                                    <input
                                        value={slugInput}
                                        onChange={(e) => setSlugInput(e.target.value)}
                                        placeholder="e.g. legacy"
                                        className="border border-gray-300 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
                                    />
                                </div>
                                <button
                                    onClick={applySlug}
                                    className="bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium px-4 py-1.5 rounded-lg"
                                >
                                    Use shop
                                </button>
                            </div>
                        )}
                    </div>
                </div>

                {!slug ? (
                    <p className="text-gray-600">
                        Pick a shop slug above (or visit your shop's subdomain) to get started.
                    </p>
                ) : (
                    <>
                        {/* Tabs */}
                        <div className="flex gap-2 mb-4">
                            {(["orders", "products"] as const).map((t) => (
                                <button
                                    key={t}
                                    onClick={() => setTab(t)}
                                    className={`px-4 py-1.5 rounded-lg text-sm font-medium capitalize ${
                                        tab === t
                                            ? "bg-indigo-600 text-white"
                                            : "bg-white text-gray-600 hover:bg-gray-50"
                                    }`}
                                >
                                    {t}
                                </button>
                            ))}
                        </div>

                        {/* `key={slug}` remounts the panel when the shop changes so it refetches. */}
                        {tab === "orders" ? (
                            <ShopOrders key={slug} />
                        ) : (
                            <ShopProducts key={slug} />
                        )}
                    </>
                )}
            </div>
        </div>
    );
}

/* ----------------------------- Orders panel ----------------------------- */

function ShopOrders() {
    const [orders, setOrders] = useState<SubOrder[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [savingId, setSavingId] = useState<number | null>(null);

    useEffect(() => {
        (async () => {
            try {
                const res = await shopFetch("/api/shop/orders/");
                if (!res.ok) throw new Error("Failed to load orders");
                setOrders(await res.json());
            } catch (err) {
                setError(err instanceof Error ? err.message : "Something went wrong");
            } finally {
                setLoading(false);
            }
        })();
    }, []);

    const updateStatus = async (id: number, status: SubStatus) => {
        setSavingId(id);
        setError(null);
        try {
            const res = await shopFetch(`/api/shop/orders/${id}/`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ status }),
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.detail || "Failed to update order");
            setOrders((prev) => prev.map((o) => (o.id === id ? { ...o, status: data.status } : o)));
        } catch (err) {
            setError(err instanceof Error ? err.message : "Something went wrong");
        } finally {
            setSavingId(null);
        }
    };

    if (loading) return <p className="text-gray-600">Loading orders...</p>;

    return (
        <>
            {error && <p className="text-red-600 mb-4">{error}</p>}
            {!error && orders.length === 0 && (
                <p className="text-gray-600">No orders for this shop yet.</p>
            )}
            <div className="space-y-4">
                {orders.map((o) => {
                    const meta = STATUS_META[o.status] ?? STATUS_META.pending;
                    const next = nextStatus(o.status);
                    return (
                        <div key={o.id} className="bg-white rounded-xl shadow p-5">
                            <div className="flex flex-wrap justify-between items-start gap-3 mb-3">
                                <div>
                                    <div className="flex items-center gap-2">
                                        <span className="font-semibold">
                                            Sub-order #{o.id}
                                        </span>
                                        <span className="text-xs text-gray-400">
                                            (order #{o.order})
                                        </span>
                                        <span
                                            className={`text-xs font-medium px-2 py-0.5 rounded-full ${meta.className}`}
                                        >
                                            {meta.label}
                                        </span>
                                    </div>
                                    <p className="text-sm text-gray-500 mt-1">
                                        {new Date(o.created_at).toLocaleString()}
                                    </p>
                                </div>
                                <span className="font-bold text-lg">${o.subtotal}</span>
                            </div>

                            <div>
                                <p className="font-medium text-gray-900 mb-1 text-sm">Items</p>
                                <ul className="divide-y text-sm">
                                    {o.items.map((it) => (
                                        <li
                                            key={it.id}
                                            className="flex justify-between py-1 text-gray-700"
                                        >
                                            <span>
                                                {it.product_name} × {it.quantity}
                                            </span>
                                            <span>${it.price}</span>
                                        </li>
                                    ))}
                                </ul>
                            </div>

                            <div className="mt-4 pt-4 border-t flex flex-wrap items-center gap-3">
                                <label className="text-sm text-gray-600">Status:</label>
                                <select
                                    value={o.status}
                                    disabled={savingId === o.id}
                                    onChange={(e) => updateStatus(o.id, e.target.value as SubStatus)}
                                    className="border border-gray-300 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
                                >
                                    {STATUS_FLOW.map((s) => (
                                        <option key={s} value={s}>
                                            {STATUS_META[s].label}
                                        </option>
                                    ))}
                                </select>
                                {next && (
                                    <button
                                        onClick={() => updateStatus(o.id, next)}
                                        disabled={savingId === o.id}
                                        className="ml-auto bg-green-600 hover:bg-green-700 text-white text-sm font-medium px-4 py-1.5 rounded-lg disabled:opacity-50"
                                    >
                                        Mark {STATUS_META[next].label}
                                    </button>
                                )}
                                {savingId === o.id && (
                                    <span className="text-sm text-gray-400">Saving...</span>
                                )}
                            </div>
                        </div>
                    );
                })}
            </div>
        </>
    );
}

/* ---------------------------- Products panel ---------------------------- */

const emptyForm = { name: "", price: "", category: "", description: "" };

function ShopProducts() {
    const [products, setProducts] = useState<ManagedProduct[]>([]);
    const [categories, setCategories] = useState<Category[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [form, setForm] = useState(emptyForm);
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        (async () => {
            try {
                const [pRes, cRes] = await Promise.all([
                    shopFetch("/api/shop/products/"),
                    fetch(`${BASEURL}/api/categories/`),
                ]);
                if (!pRes.ok) throw new Error("Failed to load products");
                setProducts(await pRes.json());
                if (cRes.ok) setCategories(await cRes.json());
            } catch (err) {
                setError(err instanceof Error ? err.message : "Something went wrong");
            } finally {
                setLoading(false);
            }
        })();
    }, []);

    const addProduct = async (e: React.FormEvent) => {
        e.preventDefault();
        setSaving(true);
        setError(null);
        try {
            const res = await shopFetch("/api/shop/products/", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    name: form.name,
                    price: form.price,
                    category: Number(form.category),
                    description: form.description,
                }),
            });
            const data = await res.json();
            if (!res.ok) throw new Error(JSON.stringify(data));
            setProducts((prev) => [...prev, data]);
            setForm(emptyForm);
        } catch (err) {
            setError(err instanceof Error ? err.message : "Something went wrong");
        } finally {
            setSaving(false);
        }
    };

    const removeProduct = async (id: number) => {
        setError(null);
        try {
            const res = await shopFetch(`/api/shop/products/${id}/`, { method: "DELETE" });
            if (!res.ok && res.status !== 204) throw new Error("Failed to delete product");
            setProducts((prev) => prev.filter((p) => p.id !== id));
        } catch (err) {
            setError(err instanceof Error ? err.message : "Something went wrong");
        }
    };

    if (loading) return <p className="text-gray-600">Loading products...</p>;

    return (
        <>
            {error && <p className="text-red-600 mb-4 break-all">{error}</p>}

            {/* Add product */}
            <form onSubmit={addProduct} className="bg-white rounded-xl shadow p-5 mb-6">
                <p className="font-medium text-gray-900 mb-3">Add a product</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <input
                        required
                        value={form.name}
                        onChange={(e) => setForm({ ...form, name: e.target.value })}
                        placeholder="Name"
                        className="border border-gray-300 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
                    />
                    <input
                        required
                        type="number"
                        step="0.01"
                        min="0"
                        value={form.price}
                        onChange={(e) => setForm({ ...form, price: e.target.value })}
                        placeholder="Price"
                        className="border border-gray-300 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
                    />
                    <select
                        required
                        value={form.category}
                        onChange={(e) => setForm({ ...form, category: e.target.value })}
                        className="border border-gray-300 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
                    >
                        <option value="" disabled>
                            Select category
                        </option>
                        {categories.map((c) => (
                            <option key={c.id} value={c.id}>
                                {c.name}
                            </option>
                        ))}
                    </select>
                    <input
                        value={form.description}
                        onChange={(e) => setForm({ ...form, description: e.target.value })}
                        placeholder="Description (optional)"
                        className="border border-gray-300 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
                    />
                </div>
                <button
                    type="submit"
                    disabled={saving}
                    className="mt-3 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium px-4 py-1.5 rounded-lg disabled:opacity-50"
                >
                    {saving ? "Adding..." : "Add product"}
                </button>
            </form>

            {/* Product list */}
            {products.length === 0 ? (
                <p className="text-gray-600">No products in this shop yet.</p>
            ) : (
                <div className="bg-white rounded-xl shadow divide-y">
                    {products.map((p) => (
                        <div key={p.id} className="flex items-center justify-between gap-3 p-4">
                            <div>
                                <p className="font-medium">{p.name}</p>
                                <p className="text-sm text-gray-500">${p.price}</p>
                            </div>
                            <button
                                onClick={() => removeProduct(p.id)}
                                className="text-sm text-red-600 hover:text-red-800"
                            >
                                Delete
                            </button>
                        </div>
                    ))}
                </div>
            )}
        </>
    );
}

export default ShopDashboardPage;
