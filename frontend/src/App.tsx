import {Route, Routes, BrowserRouter as Router} from "react-router-dom";
import ProductList from "@/src/pages/ProductList";
import ProductDetails from "@/src/pages/ProductDetails";

function App() {
    const header = (
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
    )

    return (
      <Router>
          <Routes>
              <Route path="/" element={<><>{header}</><ProductList /></>} />
              <Route path="/products/:id" element={<><>{header}</><ProductDetails /></>} />
          </Routes>
      </Router>
    );
}

export default App;
