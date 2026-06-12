import { useEffect, useState } from 'react';
import type { Product } from '@/types/Product';
import ProductCard from '@/components/ProductCard';

function ProductList() {
    const [products, setProducts] = useState<Product[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const BASE_URL = import.meta.env.VITE_DJANGO_BASE_URL || 'http://localhost:8000';

    useEffect(() => {
        fetch(`${BASE_URL}/api/products/`)
            .then(response => response.json())
            .then(data => setProducts(data))
            .catch(error => setError(error.message))
            .finally(() => setLoading(false));
    }, [BASE_URL]);

    if (loading) {
        return (
            <div className="grid grid-cols-2 gap-4 sm:gap-6 md:grid-cols-3 lg:grid-cols-4">
                {Array.from({ length: 8 }).map((_, i) => (
                    <div key={i} className="animate-pulse overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-gray-100">
                        <div className="aspect-square w-full bg-gray-200" />
                        <div className="space-y-3 p-4">
                            <div className="h-4 w-3/4 rounded bg-gray-200" />
                            <div className="h-3 w-full rounded bg-gray-200" />
                            <div className="h-5 w-1/3 rounded bg-gray-200" />
                        </div>
                    </div>
                ))}
            </div>
        );
    }

    if (error) {
        return (
            <div className="mx-auto max-w-md rounded-2xl border border-red-100 bg-red-50 p-6 text-center text-red-700">
                <p className="font-semibold">Something went wrong</p>
                <p className="mt-1 text-sm text-red-500">{error}</p>
            </div>
        );
    }

    if (products.length === 0) {
        return (
            <div className="mx-auto max-w-md rounded-2xl border border-dashed border-gray-200 bg-white p-10 text-center text-gray-500">
                No products available.
            </div>
        );
    }

    return (
        <div className="grid grid-cols-2 gap-4 sm:gap-6 md:grid-cols-3 lg:grid-cols-4">
            {products.map(product => (
                <ProductCard key={product.id} product={product} />
            ))}
        </div>
    );
}

export default ProductList;
