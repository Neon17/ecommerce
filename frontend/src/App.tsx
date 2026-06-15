import {Route, Routes, BrowserRouter as Router} from "react-router-dom";
import ProductList from "@/src/pages/ProductList";
import ProductDetails from "@/src/pages/ProductDetails";
import CartPage from "@/src/pages/CartPage";
import Navbar from "@/src/components/Navbar";
import CheckoutPage from "@/src/pages/CheckoutPage";
import RequireAuth from "@/src/components/RequireAuth";
import LoginForm from "@/src/pages/auth/LoginForm";
import RegisterForm from "@/src/pages/auth/RegisterForm";
import OrdersPage from "@/src/pages/OrdersPage";
import EsewaCheckout from "./payments/EsewaCheckout";
import KhaltiCheckout from "./payments/KhaltiCheckout";
import OAuthCallback from "./pages/auth/OAuthCallback";

function App() {
    return (
      <Router>
         <Navbar />
          <Routes>
              <Route path="/" element={<ProductList />} />
              <Route path="/products/:id" element={<ProductDetails />} />
              <Route path="/cart" element={<CartPage />} />
              <Route path="/login" element={<LoginForm />} />
              <Route path="/register" element={<RegisterForm />} />
              <Route path="/oauth/callback" element={<OAuthCallback />} />
              <Route path="/orders" element={<RequireAuth><OrdersPage /></RequireAuth>} />
              <Route path="/checkout" element={<RequireAuth><CheckoutPage /></RequireAuth>} />
              <Route path="/esewa-checkout/:orderId" element={<EsewaCheckout orderId={0} />} />
              <Route path="/khalti-checkout/:orderId" element={<KhaltiCheckout orderId={0} />} /> {/* Placeholder for KhaltiCheckout */}
          </Routes>
      </Router>
    );
}

export default App;
