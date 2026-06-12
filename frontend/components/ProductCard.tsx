import type { Product } from '@/types/Product';

function ProductCard({ product }: { product: Product }) {
    const BASE_URL = import.meta.env.VITE_DJANGO_BASE_URL || 'http://localhost:8000';

    return (
        <div className="group flex flex-col overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-gray-100 transition duration-300 hover:-translate-y-1 hover:shadow-xl">
            <div className="relative aspect-square w-full overflow-hidden bg-gray-100">
                <img
                    src={`${BASE_URL}/${product.image}`}
                    alt={product.name}
                    loading="lazy"
                    className="absolute inset-0 h-full w-full object-cover transition duration-500 group-hover:scale-105"
                />
                {product.category?.name && (
                    <span className="absolute left-3 top-3 rounded-full bg-white/90 px-2.5 py-1 text-xs font-medium text-gray-700 shadow-sm backdrop-blur">
                        {product.category.name}
                    </span>
                )}
            </div>

            <div className="flex flex-1 flex-col gap-2 p-4">
                <h2 className="truncate text-base font-semibold text-gray-900 sm:text-lg" title={product.name}>
                    {product.name}
                </h2>
                {product.description && (
                    <p className="line-clamp-2 text-sm text-gray-500">{product.description}</p>
                )}
                <div className="mt-auto flex items-center justify-between pt-2">
                    <span className="text-lg font-bold text-indigo-600">
                        ${Number(product.price).toFixed(2)}
                    </span>
                    <button
                        type="button"
                        className="rounded-lg bg-indigo-600 px-3 py-1.5 text-sm font-medium text-white transition hover:bg-indigo-700 active:scale-95"
                    >
                        Add
                    </button>
                </div>
            </div>
        </div>
    );
}

export default ProductCard;
