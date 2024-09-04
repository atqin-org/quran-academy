
export interface TStudentForm {
    firstName: string;
    lastName: string;
    gender: string | undefined;
    birthdate: Date | undefined;
    socialStatus: string | undefined;
    hasCronicDisease: string | undefined;
    cronicDisease?: string;
    familyStatus?: string;
    fatherName?: string;
    motherName?: string;
    fatherJob?: string;
    motherJob?: string;
    fatherPhone?: string;
    motherPhone?: string;
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
    father_job?: string;
    mother_job?: string;
    father_phone?: string;
    mother_phone?: string;
    subscription?: string;
    subscription_expire_at?: Date;
    insurance_expire_at?: Date;
    picture?: string;
    file?: string;
    id_club: number;
    id_category: number;
}
