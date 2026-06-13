import {Route, Routes, BrowserRouter as Router} from "react-router-dom";
import ProductList from "@/src/pages/ProductList";
import ProductDetails from "@/src/pages/ProductDetails";
import CartPage from "@/src/pages/CartPage";
import Navbar from "@/src/components/Navbar";
import CheckoutPage from "@/src/pages/CheckoutPage";
import RequireAuth from "@/src/components/RequireAuth";

function App() {
    return (
      <Router>
         <Navbar />
          <Routes>
              <Route path="/" element={<ProductList />} />
              <Route path="/products/:id" element={<ProductDetails />} />
              <Route path="/cart" element={<CartPage />} />
              <Route path="/checkout" element={<RequireAuth><CheckoutPage /></RequireAuth>} />
          </Routes>
      </Router>
    );
}

export default App;
