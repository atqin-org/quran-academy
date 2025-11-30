import { Card, CardContent } from "@/Components/ui/card";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/Components/ui/select";
import DashboardLayout from "@/Layouts/DashboardLayout";
import { TUser } from "@/types";
import { Head, InfiniteScroll, router } from "@inertiajs/react";
import {
    Calendar,
    CalendarCheck,
    ChevronDown,
    ChevronUp,
    ClipboardCheck,
    Clock,
    CreditCard,
    GraduationCap,
    User,
    Users,
} from "lucide-react";
import { useState } from "react";

export type LogType =
    | "user"
    | "student"
    | "guardian"
    | "payment"
    | "program"
    | "program_session"
    | "attendance";

export interface TActivityLog {
    id: number;
    type: LogType;
    description: string;
    causer: {
        name: string;
        email: string;
    } | null;
    properties: any;
    created_at: string;
}

interface Props {
    auth: { user: TUser };
    logs: {
        data: TActivityLog[];
    };
    filters: {
        type: "all" | LogType;
        sort: "asc" | "desc";
    };
}

const getTypeConfig = (type: LogType) => {
    const config: Record<
        LogType,
        { bg: string; icon: typeof User; label: string }
    > = {
        user: {
            bg: "bg-blue-50 text-blue-700 border-blue-200",
            icon: User,
            label: "مستخدم",
        },
        student: {
            bg: "bg-green-50 text-green-700 border-green-200",
            icon: GraduationCap,
            label: "طالب",
        },
        guardian: {
            bg: "bg-amber-50 text-amber-700 border-amber-200",
            icon: Users,
            label: "ولي أمر",
        },
        payment: {
            bg: "bg-purple-50 text-purple-700 border-purple-200",
            icon: CreditCard,
            label: "دفعة",
        },
        program: {
            bg: "bg-indigo-50 text-indigo-700 border-indigo-200",
            icon: Calendar,
            label: "برنامج",
        },
        program_session: {
            bg: "bg-cyan-50 text-cyan-700 border-cyan-200",
            icon: CalendarCheck,
            label: "حصة",
        },
        attendance: {
            bg: "bg-emerald-50 text-emerald-700 border-emerald-200",
            icon: ClipboardCheck,
            label: "حضور",
        },
    };
    return (
        config[type] || {
            bg: "bg-gray-50 text-gray-700 border-gray-200",
            icon: Clock,
            label: type,
        }
    );
};

const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return "الآن";
    if (diffMins < 60) return `منذ ${diffMins} دقيقة`;
    if (diffHours < 24) return `منذ ${diffHours} ساعة`;
    if (diffDays < 7) return `منذ ${diffDays} يوم`;

    return date.toLocaleDateString("ar-SA", {
        year: "numeric",
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
    });
};

const formatPropertyValue = (value: any): string => {
    if (value === null || value === undefined) return "-";
    if (typeof value === "boolean") return value ? "نعم" : "لا";
    if (typeof value === "object") return JSON.stringify(value);
    return String(value);
};

const getPropertyLabel = (key: string): string => {
    const labels: Record<string, string> = {
        program_name: "اسم البرنامج",
        sessions_count: "عدد الحصص",
        student_id: "رقم الطالب",
        student_name: "اسم الطالب",
        status: "الحالة",
        session_id: "رقم الحصة",
        session_date: "تاريخ الحصة",
        program_id: "رقم البرنامج",
        old: "القيم السابقة",
        new: "القيم الجديدة",
        attributes: "البيانات",
    };
    return labels[key] || key;
};

function JsonSyntaxHighlight({ data }: { data: any }) {
    const jsonString = JSON.stringify(data, null, 2);
    const highlighted = jsonString
        .replace(/"([^"]+)":/g, '<span class="text-blue-600">"$1"</span>:')
        .replace(/: "([^"]+)"/g, ': <span class="text-green-600">"$1"</span>')
        .replace(/: (\d+)/g, ': <span class="text-amber-600">$1</span>')
        .replace(/: (true|false)/g, ': <span class="text-purple-600">$1</span>')
        .replace(/: (null)/g, ': <span class="text-gray-400">$1</span>');

    return (
        <pre
            dir="ltr"
            className="text-xs bg-muted p-2 rounded mt-2 overflow-x-auto max-h-32 overflow-y-auto text-left"
            dangerouslySetInnerHTML={{ __html: highlighted }}
        />
    );
}

function PropertyDisplay({ properties, showInline = false }: { properties: any; showInline?: boolean }) {
    const [isExpanded, setIsExpanded] = useState(false);

    if (!properties || Object.keys(properties).length === 0) {
        return null;
    }

    // For inline display (program_name, sessions_count under causer)
    if (showInline) {
        const inlineKeys = ["program_name", "sessions_count", "student_name", "session_date"];
        const inlineEntries = Object.entries(properties).filter(([key]) =>
            inlineKeys.includes(key)
        );

        if (inlineEntries.length === 0) return null;

        return (
            <div className="space-y-0.5 mt-1">
                {inlineEntries.map(([key, value]) => (
                    <div key={key} className="flex items-center gap-1 text-[11px] text-muted-foreground">
                        <span>{getPropertyLabel(key)}:</span>
                        <span className="font-medium text-foreground">{formatPropertyValue(value)}</span>
                    </div>
                ))}
            </div>
        );
    }

    // For expanded display (JSON objects like old, new, attributes)
    const hasJsonData = Object.keys(properties).some((key) =>
        ["old", "new", "attributes"].includes(key)
    );

    if (!hasJsonData) return null;

    return (
        <div className="space-y-1">
            <button
                onClick={() => setIsExpanded(!isExpanded)}
                className="flex items-center gap-1 text-xs text-primary hover:underline"
            >
                {isExpanded ? (
                    <>
                        <ChevronUp className="size-3" />
                        إخفاء التفاصيل
                    </>
                ) : (
                    <>
                        <ChevronDown className="size-3" />
                        عرض التفاصيل
                    </>
                )}
            </button>
            {isExpanded && <JsonSyntaxHighlight data={properties} />}
        </div>
    );
}

export default function Index({ auth, logs, filters }: Props) {
    const handleFilterChange = (newFilters: Partial<typeof filters>) => {
        router.visit(route("admin.logs.index"), {
            data: { ...filters, ...newFilters },
            only: ["logs", "filters"],
            reset: ["logs"],
        });
    };

    return (
        <DashboardLayout user={auth.user}>
            <Head title="سجلات النظام" />

            <div className="space-y-4">
                <div className="flex items-center justify-between">
                    <h2 className="text-2xl font-bold">سجلات النظام</h2>
                    <div className="flex gap-2">
                        <Select
                            value={filters.type}
                            onValueChange={(value) =>
                                handleFilterChange({
                                    type: value as typeof filters.type,
                                })
                            }
                        >
                            <SelectTrigger className="w-[140px]">
                                <SelectValue placeholder="نوع السجل" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">الكل</SelectItem>
                                <SelectItem value="user">مستخدمين</SelectItem>
                                <SelectItem value="student">طلاب</SelectItem>
                                <SelectItem value="guardian">
                                    أولياء أمور
                                </SelectItem>
                                <SelectItem value="payment">مدفوعات</SelectItem>
                                <SelectItem value="program">برامج</SelectItem>
                                <SelectItem value="program_session">
                                    حصص
                                </SelectItem>
                                <SelectItem value="attendance">حضور</SelectItem>
                            </SelectContent>
                        </Select>

                        <Select
                            value={filters.sort}
                            onValueChange={(value) =>
                                handleFilterChange({
                                    sort: value as "asc" | "desc",
                                })
                            }
                        >
                            <SelectTrigger className="w-[120px]">
                                <SelectValue placeholder="الترتيب" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="desc">الأحدث</SelectItem>
                                <SelectItem value="asc">الأقدم</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                </div>

                {logs.data.length !== 0 ? (
                    <Card>
                        <CardContent className="p-0">
                            <InfiniteScroll
                                data="logs"
                                preserveUrl
                                loading={() => (
                                    <div className="flex items-center justify-center py-3 border-t">
                                        <div className="size-4 animate-spin rounded-full border-2 border-primary border-t-transparent" />
                                        <span className="mr-2 text-xs text-muted-foreground">
                                            جاري التحميل...
                                        </span>
                                    </div>
                                )}
                            >
                                {logs.data.map((log, index) => {
                                    const typeConfig = getTypeConfig(log.type);
                                    const Icon = typeConfig.icon;

                                    return (
                                        <div
                                            key={`${log.id}-${log.type}-${index}`}
                                            className="flex items-start gap-3 px-4 py-2.5 border-b last:border-b-0 hover:bg-muted/30 transition-colors"
                                        >
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-center gap-2">
                                                    <div
                                                        className={`p-1.5 rounded-md border shrink-0 ${typeConfig.bg}`}
                                                    >
                                                        <Icon className="size-3.5" />
                                                    </div>
                                                    <span className="font-medium text-sm">
                                                        {log.description}
                                                    </span>
                                                    <span
                                                        className={`px-1.5 py-0.5 rounded text-[10px] ${typeConfig.bg}`}
                                                    >
                                                        {typeConfig.label}
                                                    </span>
                                                </div>
                                                <div className="flex items-center gap-1 text-[11px] text-muted-foreground mt-0.5 mr-8">
                                                    <User className="size-3" />
                                                    {log.causer?.name || "النظام"}
                                                </div>
                                                {log.properties && (
                                                    <div className="mr-8">
                                                        <PropertyDisplay
                                                            properties={log.properties}
                                                            showInline
                                                        />
                                                    </div>
                                                )}
                                                {log.properties && (
                                                    <div className="mr-8 mt-1">
                                                        <PropertyDisplay
                                                            properties={log.properties}
                                                        />
                                                    </div>
                                                )}
                                            </div>

                                            <span className="shrink-0 text-[11px] text-muted-foreground mt-1">
                                                {formatDate(log.created_at)}
                                            </span>
                                        </div>
                                    );
                                })}
                            </InfiniteScroll>
                        </CardContent>
                    </Card>
                ) : (
                    <Card>
                        <CardContent className="py-8 text-center">
                            <Clock className="size-10 mx-auto text-muted-foreground mb-3" />
                            <p className="text-muted-foreground text-sm">
                                لا توجد سجلات
                            </p>
                        </CardContent>
                    </Card>
                )}
            </div>
        </DashboardLayout>
    );
}
