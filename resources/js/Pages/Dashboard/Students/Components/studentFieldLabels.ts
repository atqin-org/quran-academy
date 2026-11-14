export const STUDENT_FIELD_LABELS: Record<string, string> = {
    first_name: "الاسم الأول",
    last_name: "اللقب",
    gender: "الجنس",
    birthdate: "تاريخ الميلاد",
    social_status: "الحالة الاجتماعية",
    cronic_disease: "الأمراض المزمنة",
    family_status: "الوضع العائلي",
    ahzab: "الأحزاب",
    subscription: "الاشتراك الشهري",
    sessions_credit: "رصيد الحصص",
    club_id: "النادي",
    category_id: "الفئة",
    group_id: "الفوج",
    father_id: "الأب",
    mother_id: "الأم",
};

export const STUDENT_MANUAL_PROP_LABELS: Record<string, string> = {
    student_name: "اسم الطالب",
    student_id: "رقم الطالب",
    canonical_name: "الطالب الأساسي",
    canonical_id: "رقم الطالب الأساسي",
    duplicate_name: "الطالب المكرر",
    transferred_payment_count: "عدد الدفعات المنقولة",
    deleted_payment_count: "عدد الدفعات المحذوفة",
};

export const STUDENT_EVENT_LABELS: Record<string, string> = {
    created: "إنشاء",
    updated: "تحديث",
    deleted: "حذف",
    archived: "أرشفة",
    restored: "استعادة",
    force_deleted: "حذف نهائي",
    merged_and_force_deleted: "دمج وحذف نهائي",
};

const GENDER_LABELS: Record<string, string> = {
    male: "ذكر",
    female: "أنثى",
};

const SOCIAL_STATUS_LABELS: Record<string, string> = {
    good: "جيدة",
    mid: "متوسطة",
    low: "ضعيفة",
};

export function formatStudentFieldValue(field: string, value: unknown): string {
    if (value === null || value === undefined || value === "") {
        return "—";
    }
    if (field === "gender" && typeof value === "string") {
        return GENDER_LABELS[value] ?? value;
    }
    if (field === "social_status" && typeof value === "string") {
        return SOCIAL_STATUS_LABELS[value] ?? value;
    }
    if (field === "birthdate" && typeof value === "string") {
        return value.slice(0, 10);
    }
    if (typeof value === "boolean") {
        return value ? "نعم" : "لا";
    }
    if (typeof value === "object") {
        return JSON.stringify(value);
    }
    return String(value);
}
