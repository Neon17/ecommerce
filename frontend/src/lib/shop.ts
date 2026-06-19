import { authFetch, BASEURL } from "@/src/lib/auth";

const SHOP_SLUG_KEY = "shop_slug";

const RESERVED = ["www", "api", "localhost", "127", "admin"];


export const isAdminSubdomain = (): boolean =>
  window.location.hostname.split(".")[0] === "admin";

export const getShopSlug = (): string | null => {
  const host = window.location.hostname; // no port
  const parts = host.split(".");
  if (parts.length >= 2 && !RESERVED.includes(parts[0])) {
    return parts[0];
  }
  return localStorage.getItem(SHOP_SLUG_KEY);
};

export const setShopSlug = (slug: string|null) => {
  if (slug) localStorage.setItem(SHOP_SLUG_KEY, slug);
  else localStorage.removeItem(SHOP_SLUG_KEY);
};

export const slugFromSubdomain = (): boolean => {
  const parts = window.location.hostname.split(".");
  return parts.length >= 2 && !RESERVED.includes(parts[0]);
};

export const shopFetch = (path: string, init: RequestInit = {}): Promise<Response> => {
  const slug = getShopSlug();
  if (!slug) throw new Error("No shop selected. Open your shop's subdomain or pick one.");
  return authFetch(`${BASEURL}${path}`, init);
};
