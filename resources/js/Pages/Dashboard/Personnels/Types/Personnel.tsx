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
    name: string;
    last_name: string;
    email: string;
    phone?: string;
    card?: string;
    clubs: {
        id: number;
        name: string;
    }[];
    role: number;
}
