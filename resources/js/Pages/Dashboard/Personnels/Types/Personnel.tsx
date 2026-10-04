export interface TPersonnelForm {
    firstName: string;
    lastName: string;
    mail: string
    phone?: string;
    clubs: number[];
    /** club id → allowed category ids; a missing or empty list means every category */
    club_categories: Record<number, number[]>;
    role: string | undefined;
    card?: File | string;
}
export interface TPersonnelFormDB {
    id: number;
    name: string;
    last_name: string;
    email: string;
    phone?: string;
    card?: string;
    clubs: {
        id: number;
        name: string;
    }[];
    role: string;
    category_restrictions?: {
        id: number;
        name: string;
        display_name?: string;
        pivot: { club_id: number };
    }[];
    status?: "pending" | "active";
    deleted_at: string | null;
    last_activity_at: string | null;
}
