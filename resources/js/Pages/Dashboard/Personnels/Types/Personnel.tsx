export interface TPersonnelForm {
    firstName: string;
    lastName: string;
    mail: string
    phone?: string;
    clubs: number[];
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
    deleted_at: string | null;
    last_activity_at: string | null;
}
