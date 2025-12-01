export interface TUser {
    id: number;
    name: string;
    last_name: string;
    phone: string;
    email: string;
    email_verified_at: string;
    role: string;
}

export interface DatabaseBackup {
    id: number;
    user_id: number;
    path: string;
    size: number | null;
    type: 'manual' | 'scheduled';
    is_scheduled: boolean;
    created_at: string;
    updated_at: string;
    formatted_size: string;
    user?: {
        id: number;
        name: string;
    };
}

export interface BackupSettings {
    schedule_enabled: boolean;
    schedule_frequency: 'hourly' | 'daily' | 'weekly' | 'monthly';
    schedule_minute: number;
    schedule_hour: number;
    schedule_day_of_week: number;
    schedule_day_of_month: number;
    max_backups: number;
    retention_days: number;
}

export type PageProps<T extends Record<string, unknown> = Record<string, unknown>> = T & {
    auth: {
        user: TUser;
    };
};
