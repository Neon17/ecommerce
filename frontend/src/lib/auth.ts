const ENV_BASEURL = import.meta.env.VITE_DJANGO_BASE_URL || "http://localhost:8000";

// Subdomain is the single source of truth for the active shop. When the app is
// served from `<slug>.<host>`, point the API at the matching backend subdomain
// so Django's ShopContextMiddleware reads the shop straight from the host —
// no `X-Shop-Slug` header, no cookies.
const RESERVED_SUBDOMAINS = ["www", "api", "localhost", "127"];

const subdomainSlug = ((): string | null => {
  const parts = window.location.hostname.split(".");
  if (parts.length >= 2 && !RESERVED_SUBDOMAINS.includes(parts[0])) return parts[0];
  return null;
})();

export const BASEURL = ((): string => {
  if (!subdomainSlug) return ENV_BASEURL;
  try {
    const url = new URL(ENV_BASEURL);
    url.hostname = `${subdomainSlug}.${url.hostname}`;
    return url.origin;
  } catch {
    return ENV_BASEURL;
  }
})();

export class SessionExpiredError extends Error {
  constructor(message = "Your session has expired. Please log in again.") {
    super(message);
    this.name = "SessionExpiredError";
  }
}

export const refreshAccessToken = async (refreshToken: string): Promise<string | null> => {
  try {
    const response = await fetch(`${BASEURL}/api/refresh`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ refresh: refreshToken }),
    });
    const data = await response.json();
    if (response.ok && data.token) {
      localStorage.setItem("token", data.token);
      return data.token;
    }
    if (response.status === 401) {
      localStorage.removeItem("refresh_token");
    }
    return null;
  } catch (error) {
    console.error("Refresh failed:", error);
    return null;
  }
};

export const getValidToken = async (): Promise<string | null> => {
  const token = localStorage.getItem("token");
  if (token) return token;

  const refreshToken = localStorage.getItem("refresh_token");
  if (!refreshToken) return null;
  return await refreshAccessToken(refreshToken);
};

export const authFetch = async (input: string, init: RequestInit = {}): Promise<Response> => {
  let token = await getValidToken();
  if (!token) throw new SessionExpiredError();

  const withAuth = (accessToken: string): RequestInit => ({
    ...init,
    headers: { ...init.headers, Authorization: `Bearer ${accessToken}` },
  });

  let response = await fetch(input, withAuth(token));

  if (response.status === 401) {
    const refreshToken = localStorage.getItem("refresh_token");
    const newToken = refreshToken ? await refreshAccessToken(refreshToken) : null;
    if (newToken) {
      token = newToken;
      response = await fetch(input, withAuth(newToken));
    }
  }

  return response;
};
