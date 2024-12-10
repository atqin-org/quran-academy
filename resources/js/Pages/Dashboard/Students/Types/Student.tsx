export interface TStudentForm {
    firstName: string;
    lastName: string;
    gender: string | undefined;
    birthdate: Date | undefined;
    socialStatus: string | undefined;
    hasCronicDisease: string | undefined;
    cronicDisease?: string;
    familyStatus?: string;
    father?: {
        name?: string;
        job?: string;
        phone?: string;
    };
    mother?: {
        name?: string;
        job?: string;
        phone?: string;
    };
    club: string | undefined;
    category: string | undefined;
    subscription: string | undefined;
    insurance?: boolean;
    picture?: File | string;
    file?: File | string;
}
export interface TStudentFormDB {
    first_name: string;
    last_name: string;
    gender: "male" | "female";
    birthdate: Date;
    social_status: "good" | "mid" | "low";
    has_cronic_disease: boolean;
    cronic_disease?: string;
    family_status?: string;
    father?: {
        name?: string;
        job?: string;
        phone?: string;
    };
    mother?: {
        name?: string;
        job?: string;
        phone?: string;
    };
    subscription?: string;
    subscription_expire_at?: Date;
    insurance_expire_at?: Date;
    picture?: string;
    file?: string;
    club_id: number;
    category_id: number;
}
export interface TSiblings {
    id: number;
    first_name: string;
    last_name: string;
    gender: "male" | "female";
    birthdate: Date;
    father?: {
        name?: string;
        job?: string;
        phone?: string;
    };
    mother?: {
        name?: string;
        job?: string;
        phone?: string;
    };
    ahzab?: string;
    subscription?: string;
    subscription_expire_at?: string;
    insurance_expire_at?: string;
    shared_guardian: string;
    club_id: number;
    category: {
        id: number;
        name: string;
        gender?: string;
    };
}
