import type { User } from "./User";

export type Shop = {
    id: number;
    name: string;
    slug: string;
    owner: User;
    created_at: string;
}