import {Link, useNavigate} from "react-router-dom";
import {useCart} from "../context/CartContext";
import {useAuth} from "../context/AuthContext";

const Navbar = () => {
    const {cartItems} = useCart();
    const {user, logout} = useAuth();
    const navigate = useNavigate();
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
                <Link to="/products" className="text-gray-600 hover:text-gray-800">Products</Link>
                <Link to="/cart" className="text-gray-600 hover:text-gray-800">
                    Cart {cartCount > 0 && <span className="ml-1 bg-red-500 text-white rounded-full px-2 text-xs">{cartCount}</span>}
                </Link>
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
            </div>
        </nav>
    )
}

export default Navbar;
