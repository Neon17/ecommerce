import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { registerSchema, type RegisterFormValues } from '@/src/schemas/authSchema'
import { useAuth } from '@/src/context/AuthContext';
import { useCart } from '@/src/context/CartContext';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { useState } from 'react';

const RegisterForm = () => {
    const { register: registerUser } = useAuth();
    const { syncAfterLogin } = useCart();
    const navigate = useNavigate();
    const location = useLocation();
    const from = (location.state as { from?: { pathname?: string } })?.from?.pathname || "/";
    const [error, setError] = useState<string | null>(null);
    const {
        register,
        handleSubmit,
        formState: { errors, isSubmitting },
    } = useForm<RegisterFormValues>({
        resolver: zodResolver(registerSchema)
    });

    const onSubmit = async (data: RegisterFormValues) => {
         setError(null);
        try {
            const { password2, ...payload } = data;
            await registerUser(payload.username, payload.email, payload.password1, password2);
            await syncAfterLogin();
            navigate(from, { replace: true });
        } catch (err: any) {
            if (err instanceof TypeError && err.message === 'Failed to fetch') {
                setError("Cannot connect to server. Check your network.");
            } else {
                setError(err.message);
            }
        }
    }

    return (
        <form onSubmit={handleSubmit(onSubmit)} className="max-w-md mx-auto p-4 bg-white rounded shadow">
            <h2 className="text-2xl font-bold mb-4">Register</h2>
            {error && (
                <div className="mb-4 p-2 bg-red-100 border border-red-400 text-red-700 rounded">
                    {error}
                </div>
            )}
            <div className="mb-4">
                <label className="block text-gray-700">Username</label>
                <input
                    type="text"
                    {...register("username")}  
                    className={`w-full px-3 py-2 border ${errors.username ? 'border-red-500' : 'border-gray-300'} rounded`}
                />
                {errors.username && <p className="text-red-500 text-sm mt-1">{errors.username.message}</p>}
            </div>
            <div className="mb-4">
                <label className="block text-gray-700">Email</label>
                <input
                    type="email"
                    {...register("email")}  
                    className={`w-full px-3 py-2 border ${errors.email ? 'border-red-500' : 'border-gray-300'} rounded`}
                />
                {errors.email && <p className="text-red-500 text-sm mt-1">{errors.email.message}</p>}
            </div>
            <div className="mb-4">
                <label className="block text-gray-700">Password</label>
                <input
                    type="password"
                    {...register("password1")}  
                    className={`w-full px-3 py-2 border ${errors.password1 ? 'border-red-500' : 'border-gray-300'} rounded`}
                />
                {errors.password1 && <p className="text-red-500 text-sm mt-1">{errors.password1.message}</p>}
            </div>
            <div className="mb-4">
                <label className="block text-gray-700">Confirm Password</label>
                <input
                    type="password"
                    {...register("password2")}  
                    className={`w-full px-3 py-2 border ${errors.password2 ? 'border-red-500' : 'border-gray-300'} rounded`}
                />
                {errors.password2 && <p className="text-red-500 text-sm mt-1">{errors.password2.message}</p>}
            </div>
            <button
                type="submit"
                disabled={isSubmitting}
                className="w-full bg-blue-500 text-white py-2 rounded hover:bg-blue-600 transition-colors"
            >
                {isSubmitting ? "Registering..." : "Register"}
            </button>
            <p className="mt-4 text-center text-sm text-gray-600">
                Already have an account?{" "}
                <Link to="/login" state={{ from: location.state?.from }} className="text-blue-500 hover:underline">
                    Login
                </Link>
            </p>
        </form>
    )

}

export default RegisterForm;