export type User = {
    id: number;
    username: string;
    email?: string;
    is_staff: boolean;
    is_active: boolean;
    is_superuser: boolean;
    // True for superusers or members of the "Order Managers" group.
    is_order_manager: boolean;
    // True for superusers, shop owners, or members of the "Shop Managers" group.
    is_shop_manager: boolean;
    // The shop this user owns, if any (null for group-based managers).
    shop?: { slug: string; name: string } | null;
}