import type { Product } from "./Product";
import type { User } from "./User";

export type Cart = {
    user: User;
    session_key: string;
    created_at: Date;
    total?: number;
    cart_items: CartItem[];
}

export type CartItem = {
    id: number;
    productId: number;
    name: string;
    image: string;
    price: number;
    quantity: number;
}