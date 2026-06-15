export default function OAuthButton() {
    const googleAuthUrl = `${import.meta.env.VITE_GOOGLE_BASE_URL}?` + 
        `client_id=${import.meta.env.VITE_GOOGLE_CLIENT_ID}` +
        `&redirect_uri=${import.meta.env.VITE_GOOGLE_REDIRECT_URI}` +
        `&response_type=code` +
        `&scope=openid%20email%20profile`;

    const facebookAuthUrl = `${import.meta.env.VITE_FACEBOOK_BASE_URL}?` +
        `client_id=${import.meta.env.VITE_FACEBOOK_CLIENT_ID}` +
        `&redirect_uri=${import.meta.env.VITE_FACEBOOK_REDIRECT_URI}` +
        `&response_type=code` +
        `&scope=email%20public_profile`;

    const tiktokAuthUrl = `${import.meta.env.VITE_TIKTOK_BASE_URL}?` +
        `client_id=${import.meta.env.VITE_TIKTOK_CLIENT_ID}` +
        `&redirect_uri=${import.meta.env.VITE_TIKTOK_REDIRECT_URI}` +
        `&response_type=code` +
        `&scope=user.info.basic`;

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
    )
}
