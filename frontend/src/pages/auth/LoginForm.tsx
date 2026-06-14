import { useState } from "react";
import { useAuth } from '@/src/context/AuthContext';
import { useCart } from '@/src/context/CartContext';
import { useNavigate, useLocation, Link } from "react-router-dom";

export default function LoginForm() {
    const { login } = useAuth();
    const { syncAfterLogin } = useCart();
    const [username, setUsername] = useState("");
    const [password, setPassword] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const navigate = useNavigate();
    const location = useLocation();
    const from = (location.state as { from?: { pathname?: string } })?.from?.pathname || "/";

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!username.trim() || !password.trim()) {
            setError("Please enter both username and password");
            return;
        }
        setIsLoading(true);
        try {
            await login(username, password);
            await syncAfterLogin();
            setUsername("");
            setPassword("");
            navigate(from, { replace: true });
        } catch (err) {
             setError(err instanceof Error ? err.message : "An unexpected error occurred");
        } finally {
            setIsLoading(false);
        }
    }

    return (
        <form onSubmit={handleSubmit} className="max-w-md mx-auto p-4 bg-white rounded shadow">
            <h2 className="text-2xl font-bold mb-4">Login</h2>

            {error && (
                <div className="mb-4 p-2 bg-red-100 border border-red-400 text-red-700 rounded">
                {error}
                </div>
            )}
            <div className="mb-4">
                <label className="block text-gray-700">Username</label>
                <input
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded"
                />
            </div>
            <div className="mb-4">
                <label className="block text-gray-700">Password</label>
                <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded"
                />  
            </div>
            <button
                type="submit"
                className="w-full bg-blue-500 text-white py-2 rounded hover:bg-blue-600 transition-colors"
            >
                {isLoading ? "Logging in..." : "Login"}
            </button>
            <p className="mt-4 text-center text-sm text-gray-600">
                Don't have an account?{" "}
                <Link to="/register" state={{ from: location.state?.from }} className="text-blue-500 hover:underline">
                    Register
                </Link>
            </p>
        </form>
    );
}

