export interface TPersonnelForm {
    firstName: string;
    lastName: string;
    mail: string
    phone?: string;
    club: string [];
    role: string | undefined;
    card?: File | string;
}
export interface TPersonnelFormDB {
    first_name: string;
    last_name: string;
    mail: string;
    phone?: string;
    card?: string;
    club_id: number[];
    role_id: number;
}
