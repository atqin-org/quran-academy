import DashboardLayout from "@/Layouts/DashboardLayout";
import { Head, router } from "@inertiajs/react";
import {
    Select,
    SelectTrigger,
    SelectValue,
    SelectContent,
    SelectGroup,
    SelectLabel,
    SelectItem,
} from "@/Components/ui/select";
import { useState } from "react";


interface Hizb {
    id: number;
    number: number;
    start: string;
}

interface Thoman {
    id: number;
    number: number;
    start: string;
    hizb_id: number;
}



interface Student {
    id: number;
    first_name: string;
    last_name: string;
    attendance_status: "present" | "absent" | "excused" | null;
    excusedReason?: string;
    hizb_id?: number | null;
    thoman_id?: number | null;
    
}

interface SessionAttendanceProps {
    auth: any;
    session: {
        id: number;
        session_date: string;
    };
    students: Student[];
    ahzab: Hizb[];
    athman: Thoman[];
}
export default function Attendance({
    auth,
    session,
    students,
    ahzab,
    athman
}: SessionAttendanceProps) {
    // حالة لكل طالب: attendance + excusedReason
    const [attendance, setAttendance] = useState<Record<number, any>>(() =>
        students.reduce((acc, s) => {
            acc[s.id] = {
                status: s.attendance_status || "",
                excusedReason: s.excusedReason || "",
                hizb_id: s.hizb_id || "",
                thoman_id: s.thoman_id || "",
          
            };
            return acc;
        }, {} as Record<number, any>)
    );

    const handleChange = (studentId: number, field: string, value: any) => {
        setAttendance((prev) => ({
            ...prev,
            [studentId]: {
                ...prev[studentId],
                [field]: value,
            },
        }));

        // إرسال مباشرةً عند تحديث الحالة أو التلاوة
        router.post(
            route("sessions.recordAttendance", session.id),
            {
                student_id: studentId,
                status:
                    field === "status" ? value : attendance[studentId].status,
                hizb_id:
                    field === "hizb_id" ? value : attendance[studentId].hizb_id,
                thoman_id:
                    field === "thoman_id"
                        ? value
                        : attendance[studentId].thoman_id,
                reason:
                    field === "excusedReason"
                        ? value
                        : attendance[studentId].excusedReason,
            },
            { preserveScroll: true }
        );
    };

 
    const rowColor = (status: string) => {
        switch (status) {
            case "present":
                return "bg-green-100";
            case "absent":
                return "bg-red-100";
            case "excused":
                return "bg-yellow-100";
            default:
                return "";
        }
    };

    return (
        <DashboardLayout user={auth.user}>
            <Head title="تسجيل الحضور" />

            <div className="flex flex-col gap-8">
                <h1 className="text-3xl font-bold text-gray-900">
                    تسجيل الحضور - الجلسة {session.id}
                </h1>

                <div className="overflow-x-auto bg-white shadow rounded-lg">
                    <table className="w-full border-collapse">
                        <thead>
                            <tr className="bg-gray-100 text-right">
                                <th className="p-3 border">#</th>
                                <th className="p-3 border">الاسم</th>
                                <th className="p-3 border">الحالة</th>
                                <th className="p-3 border">السبب / التلاوة</th>
                            </tr>
                        </thead>
                        <tbody>
                            {students.map((student, index) => {
                                const studentData =
                                    attendance[student.id] || {};
                                const {
                                    status = "",
                                    excusedReason = "",
                                    hizb_id = "",
                                    thoman_id = "",
                                } = studentData;

                                return (
                                    <tr
                                        key={student.id}
                                        className={`${rowColor(
                                            status
                                        )} hover:bg-gray-50`}
                                    >
                                        <td className="p-3 border">
                                            {index + 1}
                                        </td>
                                        <td className="p-3 border">
                                            {student.first_name}{" "}
                                            {student.last_name}
                                        </td>

                                        {/* الحالة */}
                                        <td className="p-3 border">
                                            <Select
                                                value={status}
                                                onValueChange={(value) =>
                                                    handleChange(
                                                        student.id,
                                                        "status",
                                                        value
                                                    )
                                                }
                                            >
                                                <SelectTrigger className="w-[100px]">
                                                    <SelectValue placeholder="اختر الحالة" />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    <SelectGroup>
                                                        <SelectItem value="present">
                                                            حاضر
                                                        </SelectItem>
                                                        <SelectItem value="absent">
                                                            غائب
                                                        </SelectItem>
                                                        <SelectItem value="excused">
                                                            مُعذَر
                                                        </SelectItem>
                                                    </SelectGroup>
                                                </SelectContent>
                                            </Select>
                                        </td>

                                        {/* السبب أو التلاوة */}
                                        <td className="p-3 border">
                                            {status === "excused" && (
                                                <input
                                                    type="text"
                                                    className="border p-1 rounded w-full"
                                                    placeholder="اكتب السبب"
                                                    value={excusedReason}
                                                    onChange={(e) =>
                                                        handleChange(
                                                            student.id,
                                                            "excusedReason",
                                                            e.target.value
                                                        )
                                                    }
                                                    onBlur={() =>
                                                        router.post(
                                                            route(
                                                                "sessions.recordAttendance",
                                                                session.id
                                                            ),
                                                            {
                                                                student_id:
                                                                    student.id,
                                                                status,
                                                                excusedReason: excusedReason,
                                                            },
                                                            {
                                                                preserveScroll:
                                                                    true,
                                                            }
                                                        )
                                                    }
                                                />
                                            )}

                                            {status === "present" && (
                                                <div className="flex gap-2 w-full">
                                                    {/* اختيار الحزب */}
                                                    <Select
                                                        value={hizb_id.toString()}
                                                        onValueChange={(
                                                            value
                                                        ) =>
                                                            handleChange(
                                                                student.id,
                                                                "hizb_id",
                                                                value
                                                            )
                                                        }
                                                    >
                                                        <SelectTrigger className="w-1/2">
                                                            <SelectValue placeholder="اختر الحزب" />
                                                        </SelectTrigger>
                                                        <SelectContent>
                                                            <SelectGroup>
                                                                {ahzab.map(
                                                                    (hizb) => (
                                                                        <SelectItem
                                                                            key={
                                                                                hizb.id
                                                                            }
                                                                            value={hizb.id.toString()}
                                                                        >
                                                                        
                                                                            {
                                                                                hizb.start
                                                                            }
                                                                        </SelectItem>
                                                                    )
                                                                )}
                                                            </SelectGroup>
                                                        </SelectContent>
                                                    </Select>

                                                    {/* اختيار الثمن */}
                                                    <Select
                                                        value={thoman_id.toString()}
                                                        onValueChange={(
                                                            value
                                                        ) =>
                                                            handleChange(
                                                                student.id,
                                                                "thoman_id",
                                                                value
                                                            )
                                                        }
                                                    >
                                                        <SelectTrigger className="w-1/2">
                                                            <SelectValue placeholder="اختر الثمن" />
                                                        </SelectTrigger>
                                                        <SelectContent>
                                                            <SelectGroup>
                                                                {athman
                                                                    .filter(
                                                                        (t) =>
                                                                            t.hizb_id.toString() ===
                                                                            hizb_id.toString()
                                                                    )
                                                                    .map(
                                                                        (
                                                                            thoman
                                                                        ) => (
                                                                            <SelectItem
                                                                                key={
                                                                                    thoman.id
                                                                                }
                                                                                value={thoman.id.toString()}
                                                                            >
                                                                   
                                                                                {
                                                                                    thoman.start
                                                                                }
                                                                            </SelectItem>
                                                                        )
                                                                    )}
                                                            </SelectGroup>
                                                        </SelectContent>
                                                    </Select>
                                                </div>
                                            )}
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            </div>
        </DashboardLayout>
    );
}
