import {useEffect, useRef} from "react";
import {useNavigate, useSearchParams} from "react-router-dom";
import {useAuth} from "@/src/context/AuthContext";

const BASEURL = import.meta.env.VITE_DJANGO_BASE_URL || "http://localhost:8000";

export default function OAuthCallback() {
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const { fetchUserData } = useAuth();
    const hasProcessed = useRef(false);

    useEffect(() => {
        if (hasProcessed.current) return;
        hasProcessed.current = true;

        const code = searchParams.get("code");
        var provider = searchParams.get("state");
        if (!provider) provider = "google";

        if (code && provider) {
            sendCodeToBackend(code, provider);
        }
    }, [searchParams]);

    const sendCodeToBackend = async (code: string, provider: string) => {
        try {
            if (!provider) {
                throw new Error("Provider is empty");
            } else if (!["google", "facebook", "tiktok"].includes(provider)) {
                throw new Error("Unsupported OAuth provider");
            }
            const response = await fetch(`${BASEURL}/api/auth/${provider}/`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({code}),
            })

            const data = await response.json();
            if (!response.ok) {
                throw new Error(data.error || "OAuth login failed");
            }
            localStorage.setItem("token", data.access);
            if (data.refresh) {
                localStorage.setItem("refresh_token", data.refresh);
            }
            await fetchUserData(data.access);
            navigate("/", {replace: true});
        } catch (err){
            console.error("Error during OAuth callback:", err);
            navigate("/login", {state: {error: "OAuth login failed. Please try again."}});
        }
    }

    return <div>Authenticating with {searchParams.get('state')}...</div>;
}