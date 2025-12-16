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

// Statistics Types
export interface WidgetPosition {
    x: number;
    y: number;
}

export interface WidgetSize {
    w: number;
    h: number;
}

export interface Widget {
    id: string;
    type: string;
    position: WidgetPosition;
    size: WidgetSize;
    visible: boolean;
}

export interface FinancialStats {
    total_revenue: number;
    total_discount: number;
    net_revenue: number;
    payment_count: number;
    by_type: Array<{
        type: string;
        label: string;
        total: number;
        count: number;
    }>;
    by_club: Array<{
        club_name: string;
        club_id: number;
        total: number;
    }>;
    monthly_trend: Array<{
        month: string;
        total: number;
    }>;
}

export interface AttendanceStats {
    present: number;
    absent: number;
    excused: number;
    total: number;
    rate: number;
    by_status: Array<{
        status: string;
        label: string;
        count: number;
    }>;
    by_club: Array<{
        club_name: string;
        club_id: number;
        total: number;
        present_count: number;
        rate: number;
    }>;
    by_category: Array<{
        category_name: string;
        category_id: number;
        total: number;
        present_count: number;
        rate: number;
    }>;
    most_absent: Array<{
        id: number;
        name: string;
        absent_count: number;
    }>;
}

export interface CategoryBreakdownRow {
    category_id: number | null;
    category_name: string;
    has_insurance: number;
    monthly_paid: number;
    exempt: number;
    late_payment: number;
    total: number;
}

export interface CategoryBreakdown {
    rows: CategoryBreakdownRow[];
    totals: CategoryBreakdownRow;
}

export interface StudentStats {
    total: number;
    active: number;
    by_gender: Array<{
        gender: string;
        label: string;
        count: number;
    }>;
    by_club: Array<{
        club_name: string;
        club_id: number;
        count: number;
    }>;
    by_category: Array<{
        category_name: string;
        category_id: number;
        count: number;
    }>;
    by_club_category: Array<{
        club_name: string;
        club_id: number;
        categories: Array<{
            category_name: string;
            category_id: number;
            count: number;
        }>;
    }>;
    new_registrations: number;
    negative_credit: Array<{
        id: number;
        name: string;
        credit: number;
    }>;
    negative_credit_count: number;
    expiring_insurance: Array<{
        id: number;
        name: string;
        expires_at: string;
    }>;
    expiring_insurance_count: number;
    category_breakdown: CategoryBreakdown;
}

export interface PersonnelStats {
    total: number;
    by_role: Array<{
        role: string;
        label: string;
        count: number;
    }>;
    by_club: Array<{
        club_name: string;
        club_id: number;
        count: number;
    }>;
}

export interface ProgressStats {
    average_percentage: number;
    top_performers: Array<{
        id: number;
        name: string;
        percentage: number;
        total_hizbs: number;
    }>;
    distribution: Array<{
        range: string;
        count: number;
    }>;
    total_students: number;
}

export interface Statistics {
    financial: FinancialStats;
    attendance: AttendanceStats;
    students: StudentStats;
    personnel: PersonnelStats;
    progress: ProgressStats;
}

export interface StatisticsFilters {
    range: string;
    start_date: string | null;
    end_date: string | null;
    club_id: number | null;
    category_id: number | null;
}

export interface Club {
    id: number;
    name: string;
}

export interface Category {
    id: number;
    name: string;
    gender: string;
    display_name: string;
}
