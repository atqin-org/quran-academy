export interface TUser {
    id: number;
    name: string;
    email: string;
    email_verified_at: string;
}

export interface DatabaseBackup {
    id: number;
    user_id: number;
    path: string;
    created_at: string;
    updated_at: string;
}

export type PageProps<T extends Record<string, unknown> = Record<string, unknown>> = T & {
    auth: {
        user: TUser;
    };
};
