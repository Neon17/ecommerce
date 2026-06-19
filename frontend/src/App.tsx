import {Route, Routes, BrowserRouter as Router, Navigate} from "react-router-dom";
import {slugFromSubdomain} from "@/src/lib/shop";
import ProductList from "@/src/pages/ProductList";
import ProductDetails from "@/src/pages/ProductDetails";
import CartPage from "@/src/pages/CartPage";
import Navbar from "@/src/components/Navbar";
import CheckoutPage from "@/src/pages/CheckoutPage";
import RequireAuth from "@/src/components/RequireAuth";
import RequireAdmin from "@/src/components/RequireAdmin";
import LoginForm from "@/src/pages/auth/LoginForm";
import RegisterForm from "@/src/pages/auth/RegisterForm";
import OrdersPage from "@/src/pages/OrdersPage";
import ProfilePage from "@/src/pages/ProfilePage";
import AdminOrdersPage from "@/src/pages/AdminOrdersPage";
import RequireShopManager from "@/src/components/RequireShopManager";
import ShopDashboardPage from "@/src/pages/ShopDashboardPage";
import EsewaCheckout from "./payments/EsewaCheckout";
import KhaltiCheckout from "./payments/KhaltiCheckout";
import OAuthCallback from "./pages/auth/OAuthCallback";

function App() {
    // A shop subdomain is a manager-only surface — customer cart/orders/checkout
    // live on the main domain. On a subdomain those routes redirect home.
    const onSubdomain = slugFromSubdomain();

    return (
      <Router>
         <Navbar />
          <Routes>
              <Route path="/" element={<ProductList />} />
              <Route path="/products/:id" element={<ProductDetails />} />
              <Route path="/login" element={<LoginForm />} />
              <Route path="/register" element={<RegisterForm />} />
              <Route path="/oauth/callback" element={<OAuthCallback />} />
              <Route path="/profile" element={<RequireAuth><ProfilePage /></RequireAuth>} />
              <Route path="/admin" element={<RequireAdmin><AdminOrdersPage /></RequireAdmin>} />
              <Route path="/shop" element={<RequireShopManager><ShopDashboardPage /></RequireShopManager>} />
              {onSubdomain ? (
                  <>
                      <Route path="/cart" element={<Navigate to="/" replace />} />
                      <Route path="/orders" element={<Navigate to="/" replace />} />
                      <Route path="/checkout" element={<Navigate to="/" replace />} />
                  </>
              ) : (
                  <>
                      <Route path="/cart" element={<CartPage />} />
                      <Route path="/orders" element={<RequireAuth><OrdersPage /></RequireAuth>} />
                      <Route path="/checkout" element={<RequireAuth><CheckoutPage /></RequireAuth>} />
                  </>
              )}
              <Route path="/esewa-checkout/:orderId" element={<EsewaCheckout orderId={0} />} />
              <Route path="/khalti-checkout/:orderId" element={<KhaltiCheckout orderId={0} />} /> {/* Placeholder for KhaltiCheckout */}
          </Routes>
      </Router>
    );
}

export default App;
