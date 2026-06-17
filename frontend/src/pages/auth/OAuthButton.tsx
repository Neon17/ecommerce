export default function OAuthButton() {
    const redirectUri = `${import.meta.env.VITE_BASE_URL}/oauth/callback`; 

    const googleAuthUrl = `${import.meta.env.VITE_GOOGLE_BASE_URL}?` +
        `client_id=${import.meta.env.VITE_GOOGLE_CLIENT_ID}` +
        `&redirect_uri=${encodeURIComponent(redirectUri)}` +
        `&response_type=code` +
        `&scope=openid%20email%20profile` +
        `&state=google`; 

    const facebookAuthUrl = `${import.meta.env.VITE_FACEBOOK_BASE_URL}?` +
        `client_id=${import.meta.env.VITE_FACEBOOK_CLIENT_ID}` +
        `&redirect_uri=${encodeURIComponent(redirectUri)}` +
        `&response_type=code` +
        `&scope=email%20public_profile` +
        `&state=facebook`;

    const tiktokAuthUrl = `${import.meta.env.VITE_TIKTOK_BASE_URL}?` +
        `client_id=${import.meta.env.VITE_TIKTOK_CLIENT_ID}` +
        `&redirect_uri=${encodeURIComponent(redirectUri)}` +
        `&response_type=code` +
        `&scope=user.info.basic%20user.info.email` +
        `&state=tiktok`; 

    return (
        <div className="flex justify-center items-center">
            <a href={googleAuthUrl} className="m-1 w-full text-center bg-green-200 text-green-700 py-2 rounded hover:bg-green-300 transition-colors">
                Google
            </a>
            <a href={facebookAuthUrl} className="m-1 w-full text-center bg-green-200 text-green-700 py-2 rounded hover:bg-green-300 transition-colors">
                Facebook
            </a>
            <a href={tiktokAuthUrl} className="m-1 w-full text-center bg-green-200 text-green-700 py-2 rounded hover:bg-green-300 transition-colors">
                Tiktok
            </a>
        </div>
    );
}
