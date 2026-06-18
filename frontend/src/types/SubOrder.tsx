// One shop's slice of a customer's master order. Mirrors SubOrderSerializer.
export type SubOrderItem = {
    id: number;
    product: number;
    product_name: string;
    quantity: number;
    price: string;
};

export type SubOrder = {
    id: number;
    order: number;
    shop: number;
    shop_name: string;
    subtotal: string;
    status: "pending" | "confirmed" | "shipped" | "delivered";
    items: SubOrderItem[];
    created_at: string;
};

// Mirrors ManageProductSerializer (the vendor-facing write serializer).
export type ManagedProduct = {
    id: number;
    shop: number;
    category: number;
    name: string;
    description: string;
    price: string;
    image: string | null;
    created_at: string;
};
