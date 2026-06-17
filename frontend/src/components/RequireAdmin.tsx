import type { ReactNode } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "@/src/context/AuthContext";

// Only lets Order Managers (superusers or the "Order Managers" group) through.
// Everyone else is sent home.
function RequireAdmin({ children }: { children: ReactNode }) {
    const { user, loading } = useAuth();
    const location = useLocation();

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-100">
                <p className="text-gray-600">Loading...</p>
            </div>
        );
    }

    if (!user) {
        return <Navigate to="/login" state={{ from: location }} replace />;
    }

    if (!user.is_order_manager) {
        return <Navigate to="/" replace />;
    }

    return <>{children}</>;
}

export default RequireAdmin;
