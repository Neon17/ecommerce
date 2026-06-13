import type { User } from "./User";
import type { Product } from "./Product";

export type Order = {
    id: number;
    user: User;
    total_price: number;
    name: string;
    address: string;
    phone: string;
    payment_method: string;
    created_at: Date;
}

export type OrderItem = {
    order: Order;
    product: Product;
    quantity: number;
    price: number;
}