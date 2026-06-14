import { useState } from "react";
import {Link, useNavigate} from "react-router-dom";
import {useCart} from "../context/CartContext";
import {useAuth} from "../context/AuthContext";
import CartDrawer from "./CartDrawer";

const Navbar = () => {
    const {cartItems} = useCart();
    const {user, logout} = useAuth();
    const navigate = useNavigate();
    const [cartOpen, setCartOpen] = useState(false);
    const cartCount = cartItems.reduce((total, item) => total + item.quantity, 0);

    const handleLogout = () => {
        logout();
        navigate("/");
    };

    return (
        <nav className="bg-white shadow-md p-4 flex justify-between items-center">
            <div className="text-xl font-bold">
                <Link to="/">E-Commerce</Link>
            </div>
            <div className="space-x-4 flex items-center">
                <Link to="/" className="text-gray-600 hover:text-gray-800">Home</Link>
                {user ? (
                    <>
                        <Link to="/orders" className="text-gray-600 hover:text-gray-800">Orders</Link>
                        <button onClick={handleLogout} className="text-gray-600 hover:text-gray-800">
                            Logout
                        </button>
                    </>
                ) : (
                    <Link to="/login" className="text-gray-600 hover:text-gray-800">Login</Link>
                )}
                <button
                    onClick={() => setCartOpen(true)}
                    aria-label="Open cart"
                    className="relative text-gray-600 hover:text-gray-800"
                >
                    <svg
                        xmlns="http://www.w3.org/2000/svg"
                        fill="none"
                        viewBox="0 0 24 24"
                        strokeWidth={1.8}
                        stroke="currentColor"
                        className="w-6 h-6"
                    >
                        <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="M2.25 3h1.386c.51 0 .955.343 1.087.835l.383 1.437M7.5 14.25a3 3 0 0 0-3 3h15.75m-12.75-3h11.218c1.121-2.3 2.1-4.684 2.924-7.138a60.114 60.114 0 0 0-16.536-1.84M7.5 14.25 5.106 5.272M6 20.25a.75.75 0 1 1-1.5 0 .75.75 0 0 1 1.5 0Zm12.75 0a.75.75 0 1 1-1.5 0 .75.75 0 0 1 1.5 0Z"
                        />
                    </svg>
                    {cartCount > 0 && (
                        <span className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full px-1.5 text-xs">
                            {cartCount}
                        </span>
                    )}
                </button>
            </div>

            <CartDrawer open={cartOpen} onClose={() => setCartOpen(false)} />
        </nav>
    )
}

export default Navbar;
