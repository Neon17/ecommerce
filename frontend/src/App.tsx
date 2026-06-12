import ProductList from "@/pages/ProductList";

function App() {
    return (
        <div className="min-h-screen bg-gray-50">
            <header className="sticky top-0 z-10 border-b border-gray-100 bg-white/80 backdrop-blur">
                <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4 sm:px-6 lg:px-8">
                    <h1 className="text-xl font-bold tracking-tight text-gray-900 sm:text-2xl">
                        <span className="text-indigo-600">Shop</span>Hub
                    </h1>
                    <span className="hidden text-sm text-gray-500 sm:block">
                        Discover our latest products
                    </span>
                </div>
            </header>

            <main className="mx-auto max-w-7xl px-4 py-6 sm:px-6 sm:py-8 lg:px-8">
                <div className="mb-6">
                    <h2 className="text-2xl font-bold tracking-tight text-gray-900 sm:text-3xl">
                        Products
                    </h2>
                    <p className="mt-1 text-sm text-gray-500">
                        Browse the full collection.
                    </p>
                </div>
                <ProductList />
            </main>
        </div>
    );
}

export default App;
