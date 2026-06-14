import { Link, useParams } from "react-router-dom";
import type { Product } from "@/src/types/Product";
import { useEffect, useState } from "react";
import { useCart } from "../context/CartContext";

function ProductDetails() {
  const { id } = useParams();
  const BASEURL = import.meta.env.VITE_DJANGO_BASE_URL || 'http://localhost:8000';
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { addToCart } = useCart();

  useEffect(() => {
    console.log("Fetching product with id:", id);
    setLoading(true);
    setError(null);
    
    fetch(`${BASEURL}/api/products/${id}/`)
      .then(response => {
        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
        return response.json();
      })
      .then(data => {
        console.log("Product data received:", data);
        setProduct(data);
      })
      .catch(error => {
        console.error("Fetch error:", error);
        setError(error.message);
      })
      .finally(() => setLoading(false));
  }, [BASEURL, id]);

  // Safe image URL builder
  const getImageUrl = (imagePath: string | undefined) => {
    if (!imagePath) return "https://placehold.co/600x400?text=No+Image";
    if (imagePath.startsWith("http")) return imagePath;
    // Remove leading slash if present to avoid double slash
    const cleanPath = imagePath.startsWith("/") ? imagePath.slice(1) : imagePath;
    return `${BASEURL}/${cleanPath}`;
  };

  // Loading
  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-gray-100 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-2xl shadow-xl overflow-hidden">
          <div className="h-64 bg-gray-200 animate-pulse"></div>
          <div className="p-6 space-y-4">
            <div className="h-6 bg-gray-200 rounded animate-pulse w-3/4"></div>
            <div className="h-4 bg-gray-200 rounded animate-pulse w-1/2"></div>
            <div className="h-8 bg-gray-200 rounded animate-pulse w-1/3"></div>
            <div className="h-20 bg-gray-200 rounded animate-pulse"></div>
          </div>
        </div>
      </div>
    );
  }

  // Error
  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-gray-100 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-6 text-center">
          <div className="text-red-500 text-6xl mb-4">⚠️</div>
          <h2 className="text-xl font-semibold text-gray-800 mb-2">Error Loading Product</h2>
          <p className="text-gray-600 mb-6">{error}</p>
          <p className="text-sm text-gray-500 mb-4">Check console for details. Make sure your Django backend is running on {BASEURL}</p>
          <button
            onClick={() => window.location.reload()}
            className="px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  // Not found
  if (!product) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-gray-100 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-6 text-center">
          <div className="text-gray-400 text-6xl mb-4">🔍</div>
          <h2 className="text-xl font-semibold text-gray-800 mb-2">Product Not Found</h2>
          <p className="text-gray-600 mb-6">No product with ID "{id}" exists.</p>
          <Link to="/" className="inline-block px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700">
            Browse Products
          </Link>
        </div>
      </div>
    );
  }

  // Success - render product details
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-gray-100 flex items-center justify-center p-4">
      <div className="max-w-2xl w-full bg-white rounded-2xl shadow-2xl overflow-hidden">
        {/* Image */}
        <div className="relative h-80 bg-gray-100">
          <img
            src={getImageUrl(product.image)}
            alt={product.name || "Product"}
            className="w-full h-full object-cover"
            onError={(e) => {
              e.currentTarget.src = "https://placehold.co/600x400?text=Image+Not+Found";
            }}
          />
        </div>

        {/* Content */}
        <div className="p-6 md:p-8">
          <div className="flex flex-wrap justify-between items-start gap-2 mb-3">
            <h1 className="text-2xl md:text-3xl font-bold text-gray-900">
              {product.name || "Unnamed Product"}
            </h1>
            <span className="text-2xl font-bold text-indigo-600">
              ${typeof product.price === 'number' ? product.price.toFixed(2) : product.price}
            </span>
          </div>

          {/* Category - safe access */}
          <div className="mb-4">
            <span className="inline-block bg-gray-100 text-gray-700 text-sm font-medium px-3 py-1 rounded-full">
              {product.category?.name || "General"}
            </span>
          </div>

          {/* Description */}
          <div className="mb-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-2">Description</h3>
            <p className="text-gray-600 leading-relaxed">
              {product.description || "No description available for this product."}
            </p>
          </div>

          {/* Details table */}
          <div className="border-t border-gray-100 pt-4 mb-6">
            <div className="grid grid-cols-2 gap-2 text-sm">
              <div className="text-gray-500">Product ID:</div>
              <div className="text-gray-800 font-mono">{product.id}</div>
              <div className="text-gray-500">Availability:</div>
              <div className="text-green-600 font-medium">In Stock</div>
            </div>
          </div>

          {/* Buttons */}
          <div className="flex flex-col sm:flex-row gap-3">
            <Link
              to="/"
              className="flex-1 text-center px-4 py-3 border border-gray-300 text-gray-700 font-medium rounded-xl hover:bg-gray-50 transition"
            >
              ← Back to Products
            </Link>
            <button
              onClick={() => addToCart(product)}
              className="flex-1 px-4 py-3 bg-indigo-600 text-white font-medium rounded-xl hover:bg-indigo-700 transition shadow-md"
            >
              Add to Cart 🛒
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default ProductDetails;