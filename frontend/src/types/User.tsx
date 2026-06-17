export type User = {
    id: number;
    username: string;
    email?: string;
    is_staff: boolean;
    is_active: boolean;
    is_superuser: boolean;
    // True for superusers or members of the "Order Managers" group.
    is_order_manager: boolean;
}