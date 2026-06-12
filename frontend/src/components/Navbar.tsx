import {Link} from "react-router-dom";
import {useCart} from "../context/CartContext";

const Navbar = () => {
    const {cartItems} = useCart();
    const cartCount = cartItems.reduce((total, item) => total + item.quantity, 0);

    return (
        <nav className="bg-white shadow-md p-4 flex justify-between items-center">
            <div className="text-xl font-bold">
                <Link to="/">E-Commerce</Link>
            </div>
            <div className="space-x-4">
                <Link to="/" className="text-gray-600 hover:text-gray-800">Home</Link>
                <Link to="/products" className="text-gray-600 hover:text-gray-800">Products</Link>
                <Link to="/cart" className="text-gray-600 hover:text-gray-800">
                    Cart {cartCount > 0 && <span className="ml-1 bg-red-500 text-white rounded-full px-2 text-xs">{cartCount}</span>}
                </Link>
            </div>
        </nav>
    )
}

export default Navbar;