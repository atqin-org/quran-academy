import DashboardLayout from "@/Layouts/DashboardLayout";
import { TUser } from "@/types";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/Components/ui/table";
import { useState } from "react";
import { Head, router, WhenVisible } from "@inertiajs/react";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/Components/ui/select";

export type LogType = "user" | "student" | "guardian" | "payment" | "program" | "program_session" | "attendance";

export interface TActivityLog {
    data: {
        id: number;
        type: LogType;
        description: string;
        causer: {
            name: string;
            email: string;
        } | null;
        properties: any;
        created_at: string;
    };
}
interface Props {
    auth: { user: TUser };
    logs: Array<TActivityLog>;
    logsPaginate: any;
    filters: {
        type: "all" | TActivityLog["data"]["type"];
        sort: "asc" | "desc";
    };
    page: number;
    lastPage: number;
}

const getTypeStyle = (type: LogType) => {
    const styles: Record<LogType, string> = {
        user: "bg-blue-100 text-blue-800",
        student: "bg-green-100 text-green-800",
        guardian: "bg-yellow-100 text-yellow-800",
        payment: "bg-purple-100 text-purple-800",
        program: "bg-indigo-100 text-indigo-800",
        program_session: "bg-cyan-100 text-cyan-800",
        attendance: "bg-emerald-100 text-emerald-800",
    };
    return styles[type] || "bg-gray-100 text-gray-800";
};

const getTypeLabel = (type: LogType) => {
    const labels: Record<LogType, string> = {
        user: "مستخدم",
        student: "طالب",
        guardian: "ولي أمر",
        payment: "دفع",
        program: "برنامج",
        program_session: "حصة",
        attendance: "حضور",
    };
    return labels[type] || type;
};

function CollapsibleProperties({ properties }: { properties: any }) {
    const [isExpanded, setIsExpanded] = useState(false);

    const collapsedView = JSON.stringify(properties).slice(0, 50) + "...";
    const expandedView = JSON.stringify(properties, null, 2);

    return (
        <pre
            className="text-sm cursor-pointer hover:bg-gray-50 p-2 rounded"
            onClick={() => setIsExpanded(!isExpanded)}
        >
            {isExpanded ? expandedView : collapsedView}
        </pre>
    );
}

export default function Index({ auth, logs, filters, page, lastPage }: Props) {
    const handleFilterChange = (newFilters: Partial<typeof filters>) => {
        router.get(
            route("admin.logs.index"),
            { ...filters, ...newFilters },
            { preserveState: true }
        );
    };

    return (
        <DashboardLayout user={auth.user}>
            <Head title="Logs" />

            <div className="space-y-4">
                <h2 className="text-2xl font-bold">سجلات النظام</h2>

                <div className="flex gap-4 items-center mb-4">
                    <Select
                        value={filters.type}
                        onValueChange={(value) =>
                            handleFilterChange({
                                type: value as typeof filters.type,
                            })
                        }
                    >
                        <SelectTrigger className="w-[180px]">
                            <SelectValue placeholder="نوع السجل" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">جميع السجلات</SelectItem>
                            <SelectItem value="user">مستخدمين</SelectItem>
                            <SelectItem value="student">طلاب</SelectItem>
                            <SelectItem value="guardian">أولياء أمور</SelectItem>
                            <SelectItem value="payment">مدفوعات</SelectItem>
                            <SelectItem value="program">برامج</SelectItem>
                            <SelectItem value="program_session">حصص</SelectItem>
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
                        <SelectTrigger className="w-[180px]">
                            <SelectValue placeholder="الترتيب" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="desc">الأحدث</SelectItem>
                            <SelectItem value="asc">الأقدم</SelectItem>
                        </SelectContent>
                    </Select>
                </div>

                <div className="border rounded-lg">
                    {logs.length !== 0 ? (
                        (
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead className="text-start">
                                            التاريخ
                                        </TableHead>
                                        <TableHead className="text-start">
                                            النوع
                                        </TableHead>
                                        <TableHead className="text-start">
                                            الوصف
                                        </TableHead>
                                        <TableHead className="text-start">
                                            المستخدم
                                        </TableHead>
                                        <TableHead className="text-start">
                                            التغييرات
                                        </TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {logs.map((log, index) => (
                                        <TableRow
                                            key={`${log.data.id}-${log.data.type}-${index}`}
                                        >
                                            <TableCell>
                                                {log.data.created_at}
                                            </TableCell>
                                            <TableCell>
                                                <span
                                                    className={`px-2 py-1 rounded-full text-xs ${getTypeStyle(
                                                        log.data.type
                                                    )}`}
                                                >
                                                    {getTypeLabel(
                                                        log.data.type
                                                    )}
                                                </span>
                                            </TableCell>
                                            <TableCell>
                                                {log.data.description}
                                            </TableCell>
                                            <TableCell>
                                                {log.data.causer?.name ||
                                                    "النظام"}
                                            </TableCell>
                                            <TableCell className="w-1/3">
                                                <CollapsibleProperties
                                                    properties={
                                                        log.data.properties
                                                    }
                                                />
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        )!
                    ) : (
                        <div className="p-4 text-center text-gray-500">
                            لا توجد سجلات
                        </div>
                    )}
                    {page < lastPage && (
                        <WhenVisible
                            always
                            fallback={<div className="flex items-center justify-center my-2">
                                <div className="size-6 animate-spin rounded-full border-4 border-primary border-t-transparent" />
                            </div>}
                            params={{
                                data: { page: page + 1, type: filters.type, sort: filters.sort },
                                only: ["logs", "page"],
                                preserveUrl: true,
                            }}
                            data="logs"
                        >
                            <div className="flex items-center justify-center my-2">
                                <div className="size-6 animate-spin rounded-full border-4 border-primary border-t-transparent" />
                            </div>
                        </WhenVisible>
                    )}
                </div>
            </div>
        </DashboardLayout>
    );
}
