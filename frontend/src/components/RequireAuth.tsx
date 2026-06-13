import type { ReactNode } from "react";

function RequireAuth({ children }: { children: ReactNode }) {
    const token = localStorage.getItem("jwtToken")

    if (!token) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-100">
                <div className="text-center">
                    <h1 className="text-2xl font-bold text-gray-800">Authentication required</h1>
                    <p className="mt-2 text-gray-600">Please log in to continue to checkout.</p>
                </div>
            </div>
        )
    }

    return <>{children}</>
}

export default RequireAuth;
