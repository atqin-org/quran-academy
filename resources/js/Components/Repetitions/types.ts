export type Rating = "good" | "mid" | "bad";

export type ThumnResult = "good" | "bad" | "skip";

export interface HizbOption {
    id: number;
    number: number;
    start: string;
}

export interface ThomanOption {
    id: number;
    number: number;
    start: string;
    hizb_id: number;
}

export interface AttendeeOption {
    id: number;
    first_name: string;
    last_name: string;
    is_deleted?: boolean;
}

export interface CurrentUserOption {
    id: number;
    name: string;
}

export interface RepetitionThumnDraft {
    thoman_id: number;
    thoman_number: number;
    result: ThumnResult;
    mistakes_count: number | null;
    note: string;
}

export interface RepetitionSectionDraft {
    localId: string;
    hizb_id: number | null;
    tester_user_id: number | null;
    tester_student_id: number | null;
    overall_rating: Rating | null;
    remark: string;
    thumns: RepetitionThumnDraft[];
}

export interface RepetitionPayloadSection {
    hizb_id: number;
    tester_user_id: number | null;
    tester_student_id: number | null;
    overall_rating: Rating | null;
    remark: string | null;
    thumns: Array<{
        thoman_id: number;
        result: "good" | "bad";
        mistakes_count: number | null;
        note: string | null;
    }>;
}

export interface IncomingRepetitionSection {
    id: number;
    hizb_id: number;
    hizb_number: number | null;
    tester_user_id: number | null;
    tester_student_id: number | null;
    overall_rating: Rating | null;
    remark: string | null;
    thumns: Array<{
        thoman_id: number;
        thoman_number: number | null;
        result: "good" | "bad";
        mistakes_count: number | null;
        note: string | null;
    }>;
}

export interface TestedThumn {
    hizb_number: number;
    thoman_number: number;
    result: "good" | "bad";
}

export interface RecentActivity {
    type: "memorization" | "repetition";
    date: string | null;
    hizb_number: number | null;
    thoman_number: number | null;
    rating: Rating | null;
    count: number | null;
}
