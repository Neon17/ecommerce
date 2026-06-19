import { useEffect, useState } from 'react';
import type { Product } from '@/src/types/Product';
import ProductCard from '@/src/components/ProductCard';
import { BASEURL } from '@/src/lib/auth';

function ProductList() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);
    setError(null);
    fetch(`${BASEURL}/api/products/`)
      .then(response => {
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        return response.json();
      })
      .then(data => setProducts(data))
      .catch(err => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  // Hero / header section
  const Header = () => (
    <div className="mb-10 text-center md:text-left">
      <h1 className="text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">
        Our Collection
      </h1>
      <p className="mt-2 text-lg text-gray-600 max-w-2xl mx-auto md:mx-0">
        Discover handpicked products crafted with care and quality.
      </p>
      <div className="mt-4 h-1 w-20 bg-indigo-500 rounded-full mx-auto md:mx-0"></div>
    </div>
  );

  // Loading skeletons (shimmer effect)
  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-gray-100 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <Header />
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 md:gap-8">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="animate-pulse">
                <div className="overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-gray-100">
                  <div className="aspect-square w-full bg-gray-200" />
                  <div className="p-4 space-y-3">
                    <div className="h-5 w-3/4 rounded bg-gray-200" />
                    <div className="h-4 w-full rounded bg-gray-200" />
                    <div className="h-6 w-1/3 rounded bg-gray-200" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // Error state with retry button
  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-gray-100 py-12 px-4 flex items-center justify-center">
        <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8 text-center">
          <div className="text-5xl mb-4">⚠️</div>
          <h2 className="text-2xl font-semibold text-gray-800 mb-2">Failed to load products</h2>
          <p className="text-gray-500 mb-6">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="px-6 py-2 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition shadow-md"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  // Empty state
  if (products.length === 0) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-gray-100 py-12 px-4 flex items-center justify-center">
        <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8 text-center">
          <div className="text-6xl mb-4">🛍️</div>
          <h2 className="text-2xl font-semibold text-gray-800 mb-2">No products yet</h2>
          <p className="text-gray-500">Check back later for new arrivals!</p>
        </div>
      </div>
    );
  }

  // Success - display products
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-gray-100 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <Header />
        
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 md:gap-8">
            {products.map(product => (
              <ProductCard key={product.id} product={product} />
            ))}
        </div>

        {/* Optional: subtle footer */}
        <div className="mt-16 text-center text-sm text-gray-400 border-t border-gray-200 pt-8">
          ✨ {products.length} amazing products waiting for you
        </div>
      </div>
    </div>
  );
}

export default ProductList;