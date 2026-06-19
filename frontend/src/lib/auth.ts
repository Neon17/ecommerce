const ENV_BASEURL = import.meta.env.VITE_DJANGO_BASE_URL || "http://localhost:8000";

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

const TOKEN_KEY = "token";
const REFRESH_KEY = "refresh_token";

const cookieDomain = (): string | null => {
  const host = window.location.hostname;
  if (host === "localhost" || host.endsWith(".localhost")) return "localhost";
  if (/^\d{1,3}(\.\d{1,3}){3}$/.test(host)) return null;
  const parts = host.split(".");
  return parts.length >= 2 ? parts.slice(-2).join(".") : host;
};

const setCookie = (name: string, value: string) => {
  const d = cookieDomain();
  const domainAttr = d ? `; domain=${d}` : "";
  document.cookie = `${name}=${encodeURIComponent(value)}; path=/${domainAttr}; max-age=${60 * 60 * 24 * 30}; samesite=lax`;
};

const getCookie = (name: string): string | null => {
  const m = document.cookie.match(new RegExp("(?:^|; )" + name + "=([^;]*)"));
  return m ? decodeURIComponent(m[1]) : null;
};

const deleteCookie = (name: string) => {
  const d = cookieDomain();
  const domainAttr = d ? `; domain=${d}` : "";
  document.cookie = `${name}=; path=/${domainAttr}; max-age=0`;
};

export const setToken = (token: string) => {
  localStorage.setItem(TOKEN_KEY, token);
  setCookie(TOKEN_KEY, token);
};

export const setRefreshToken = (token: string) => {
  localStorage.setItem(REFRESH_KEY, token);
  setCookie(REFRESH_KEY, token);
};

export const clearTokens = () => {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(REFRESH_KEY);
  deleteCookie(TOKEN_KEY);
  deleteCookie(REFRESH_KEY);
};

(() => {
  if (!localStorage.getItem(TOKEN_KEY)) {
    const c = getCookie(TOKEN_KEY);
    if (c) localStorage.setItem(TOKEN_KEY, c);
  }
  if (!localStorage.getItem(REFRESH_KEY)) {
    const c = getCookie(REFRESH_KEY);
    if (c) localStorage.setItem(REFRESH_KEY, c);
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
      setToken(data.token);
      return data.token;
    }
    if (response.status === 401) {
      clearTokens();
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
