import { authFetch, BASEURL } from "@/src/lib/auth";

const SHOP_SLUG_KEY = "shop_slug";

const RESERVED = ["www", "api", "localhost", "127"];


export const getShopSlug = (): string | null => {
  const host = window.location.hostname; // no port
  const parts = host.split(".");
  if (parts.length >= 2 && !RESERVED.includes(parts[0])) {
    return parts[0];
  }
  return localStorage.getItem(SHOP_SLUG_KEY);
};

// Dev helper: pin a slug when there's no real subdomain to read from.
export const setShopSlug = (slug: string) => {
  if (slug) localStorage.setItem(SHOP_SLUG_KEY, slug);
  else localStorage.removeItem(SHOP_SLUG_KEY);
};

// True when the slug comes from the URL itself rather than the dev override.
export const slugFromSubdomain = (): boolean => {
  const parts = window.location.hostname.split(".");
  return parts.length >= 2 && !RESERVED.includes(parts[0]);
};

/**
 * authFetch + the `X-Shop-Slug` header every shop-scoped endpoint needs.
 * Throws if no shop is in context so we fail loudly instead of silently
 * hitting the API with no shop (which would 404 via ShopScopedMixin anyway).
 */
export const shopFetch = (path: string, init: RequestInit = {}): Promise<Response> => {
  const slug = getShopSlug();
  if (!slug) throw new Error("No shop selected. Open your shop's subdomain or pick one.");
  return authFetch(`${BASEURL}${path}`, {
    ...init,
    headers: { ...init.headers, "X-Shop-Slug": slug },
  });
};
