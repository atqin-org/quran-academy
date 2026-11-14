import DashboardLayout from "@/Layouts/DashboardLayout";
import { Head, Link, router } from "@inertiajs/react";
import {
    Select,
    SelectTrigger,
    SelectValue,
    SelectContent,
    SelectGroup,
    SelectItem,
} from "@/Components/ui/select";
import { Badge } from "@/Components/ui/badge";
import { Switch } from "@/Components/ui/switch";
import { Label } from "@/Components/ui/label";
import { Button } from "@/Components/ui/button";
import { useEffect, useState } from "react";
import { Save, AlertCircle, Loader2, ArrowRight, BookOpenCheck, RotateCcw, ArrowRightLeft, Minus } from "lucide-react";
import MemorizationBar from "@/Components/Repetitions/MemorizationBar";
import RepetitionsBar from "@/Components/Repetitions/RepetitionsBar";
import StudentSessionModal from "@/Components/Repetitions/StudentSessionModal";
import StudentProgressModal from "@/Components/Repetitions/StudentProgressModal";
import type {
    AttendeeOption,
    IncomingRepetitionSection,
    Rating,
    RecentActivity,
    TestedThumn,
} from "@/Components/Repetitions/types";

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
    attendance_status: "present" | "absent" | "excused" | "late_excused" | "kicked" | null;
    excusedReason?: string;
    hizb_id?: number | null;
    thoman_id?: number | null;
    memorization_rating?: Rating | null;
    memorization_remark?: string | null;
    memorization_direction?: "ascending" | "descending";
    last_hizb_id?: number | null;
    last_hizb_ascending?: number | null;
    last_hizb_descending?: number | null;
    repetitions?: IncomingRepetitionSection[];
    tested_thumns?: TestedThumn[];
    tested_hizbs?: TestedHizb[];
    recent_activities?: RecentActivity[];
}

interface TestedHizb {
    hizb_number: number;
    rating: Rating | null;
}

interface SessionAttendanceProps {
    auth: any;
    session: {
        id: number;
        session_date: string;
        is_optional: boolean;
    };
    program: {
        id: number;
        group_id?: number | null;
        group_name?: string | null;
    };
    students: Student[];
    attendees: AttendeeOption[];
    ahzab: Hizb[];
    athman: Thoman[];
}

function countTestedHizbs(thumns: TestedThumn[] | undefined): number {
    if (!thumns || thumns.length === 0) {
        return 0;
    }
    return new Set(thumns.map((t) => t.hizb_number)).size;
}

// Helper to calculate dual progress
function calculateStudentProgress(student: Student) {
    const ascending = student.last_hizb_ascending ?? 0;
    const descending = student.last_hizb_descending
        ? 60 - student.last_hizb_descending + 1
        : 0;

    // Check for overlap
    let overlap = 0;
    if (
        student.last_hizb_ascending &&
        student.last_hizb_descending &&
        student.last_hizb_ascending >= student.last_hizb_descending
    ) {
        overlap = student.last_hizb_ascending - student.last_hizb_descending + 1;
    }

    const total = Math.min(60, Math.max(0, ascending + descending - overlap));
    const percentage = Math.round((total / 60) * 100);

    return {
        ascending,
        descending,
        total,
        percentage,
        lastAscending: student.last_hizb_ascending,
        lastDescending: student.last_hizb_descending,
    };
}


export default function Attendance({
    auth,
    session,
    program,
    students: initialStudents,
    attendees,
    ahzab,
    athman,
}: SessionAttendanceProps) {
    // Track students locally to update direction immediately
    const [students, setStudents] = useState(initialStudents);

    // Sync local state when fresh props arrive (e.g. after saving the session modal triggers router.reload).
    // Without this the indicator dots and progress bars stay stale after a save.
    useEffect(() => {
        setStudents(initialStudents);
    }, [initialStudents]);
    const [isOptional, setIsOptional] = useState(session.is_optional ?? false);
    const [isSaving, setIsSaving] = useState(false);
    const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
    const [modalStudentId, setModalStudentId] = useState<number | null>(null);
    const [modalDefaultTab, setModalDefaultTab] = useState<"memorization" | "repetitions">("memorization");
    const [progressStudentId, setProgressStudentId] = useState<number | null>(null);

    const openModal = (studentId: number, tab: "memorization" | "repetitions") => {
        setModalDefaultTab(tab);
        setModalStudentId(studentId);
    };

    const closeModal = () => {
        setModalStudentId(null);
        router.reload({ only: ["students", "attendees"] });
    };

    const openProgress = (studentId: number) => setProgressStudentId(studentId);
    const closeProgress = () => setProgressStudentId(null);

    const modalStudent = students.find((s) => s.id === modalStudentId) ?? null;
    const progressStudent = students.find((s) => s.id === progressStudentId) ?? null;

    const [attendance, setAttendance] = useState<Record<number, any>>(() =>
        initialStudents.reduce((acc, s) => {
            acc[s.id] = {
                status: s.attendance_status || "",
                excusedReason: s.excusedReason || "",
                hizb_id: s.hizb_id || "",
                thoman_id: s.thoman_id || "",
            };
            return acc;
        }, {} as Record<number, any>)
    );

    const canSave = hasUnsavedChanges;

    // Handle direction change for a student
    const handleDirectionChange = (
        studentId: number,
        direction: "ascending" | "descending"
    ) => {
        // Update local state immediately for responsive UI
        setStudents((prev) =>
            prev.map((s) =>
                s.id === studentId
                    ? { ...s, memorization_direction: direction }
                    : s
            )
        );

        // Send to server
        router.put(
            route("students.direction", studentId),
            { direction },
            { preserveScroll: true }
        );
    };

    const handleChange = (studentId: number, field: string, value: any) => {
        setAttendance((prev) => ({
            ...prev,
            [studentId]: {
                ...prev[studentId],
                [field]: value,
            },
        }));
        setHasUnsavedChanges(true);
    };

    // Save all attendance records at once
    const saveAll = () => {
        if (!canSave) return;

        setIsSaving(true);

        // Collect all attendance data to save
        const attendanceData = Object.entries(attendance).map(([studentId, data]) => ({
            student_id: parseInt(studentId),
            status: data.status,
            hizb_id: data.hizb_id || null,
            thoman_id: data.thoman_id || null,
            reason: data.excusedReason || null,
        }));

        router.post(
            route("sessions.recordAttendanceBulk", session.id),
            { attendance: attendanceData },
            {
                preserveScroll: true,
                onSuccess: () => {
                    setHasUnsavedChanges(false);
                    setIsSaving(false);
                },
                onError: () => {
                    setIsSaving(false);
                },
            }
        );
    };

    const rowColor = (status: string) => {
        switch (status) {
            case "present":
                return "bg-green-50";
            case "absent":
                return "bg-red-50";
            case "excused":
                return "bg-yellow-50";
            case "late_excused":
                return "bg-orange-50";
            case "kicked":
                return "bg-purple-50";
            default:
                return "";
        }
    };

    const handleOptionalToggle = (checked: boolean) => {
        setIsOptional(checked);
        router.put(
            route("sessions.toggleOptional", session.id),
            { is_optional: checked },
            { preserveScroll: true }
        );
    };

    return (
        <DashboardLayout user={auth.user}>
            <Head title="تسجيل الحضور" />

            <div className="flex flex-col gap-8">
                <div className="flex items-center justify-between">
                    <div className="flex flex-col gap-2">
                        <Link
                            href={route("programs.show", program.id)}
                            className="inline-flex items-center gap-1 text-sm text-gray-600 hover:text-gray-900 w-fit"
                        >
                            <ArrowRight className="h-4 w-4" />
                            العودة إلى البرنامج
                        </Link>
                        <h1 className="text-3xl font-bold text-gray-900">
                            تسجيل الحضور - الجلسة {session.id}
                        </h1>
                    </div>
                    <div className="flex items-center gap-3">
                        {hasUnsavedChanges && (
                            <span className="text-sm text-amber-600 flex items-center gap-1">
                                <AlertCircle className="h-4 w-4" />
                                تغييرات غير محفوظة
                            </span>
                        )}
                        <Button
                            onClick={saveAll}
                            disabled={!canSave || isSaving}
                            className="flex items-center gap-2"
                        >
                            {isSaving ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                                <Save className="h-4 w-4" />
                            )}
                            حفظ التغييرات
                        </Button>
                    </div>
                </div>

                {/* Stats Cards */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {/* Marked Count */}
                    {(() => {
                        const markedCount = Object.values(attendance).filter(a => a.status).length;
                        const unmarkedCount = students.length - markedCount;
                        const allMarked = unmarkedCount === 0;
                        return (
                            <div className={`bg-white shadow rounded-lg p-4 border-e-4 ${allMarked ? 'border-green-500' : 'border-amber-500'}`}>
                                <div className="text-sm text-gray-500">التقدم</div>
                                <div className="text-2xl font-bold">{markedCount}/{students.length}</div>
                                {!allMarked && (
                                    <div className="text-xs text-amber-600 mt-1">
                                        متبقي {unmarkedCount} طالب
                                    </div>
                                )}
                                {allMarked && (
                                    <div className="text-xs text-green-600 mt-1">
                                        تم تسجيل الجميع
                                    </div>
                                )}
                            </div>
                        );
                    })()}

                    {/* All Statuses */}
                    <div className="bg-white shadow rounded-lg p-4">
                        <div className="text-sm text-gray-500 mb-2">الحالات</div>
                        <div className="grid grid-cols-5 gap-2 text-center">
                            <div>
                                <div className="text-lg font-bold text-green-600">
                                    {Object.values(attendance).filter(a => a.status === 'present').length}
                                </div>
                                <div className="text-[10px] text-gray-500">حاضر</div>
                            </div>
                            <div>
                                <div className="text-lg font-bold text-red-600">
                                    {Object.values(attendance).filter(a => a.status === 'absent').length}
                                </div>
                                <div className="text-[10px] text-gray-500">غائب</div>
                            </div>
                            <div>
                                <div className="text-lg font-bold text-yellow-600">
                                    {Object.values(attendance).filter(a => a.status === 'excused').length}
                                </div>
                                <div className="text-[10px] text-gray-500">معذر</div>
                            </div>
                            <div>
                                <div className="text-lg font-bold text-orange-600">
                                    {Object.values(attendance).filter(a => a.status === 'late_excused').length}
                                </div>
                                <div className="text-[10px] text-gray-500">متأخر</div>
                            </div>
                            <div>
                                <div className="text-lg font-bold text-purple-600">
                                    {Object.values(attendance).filter(a => a.status === 'kicked').length}
                                </div>
                                <div className="text-[10px] text-gray-500">مطرود</div>
                            </div>
                        </div>
                    </div>

                    {/* Optional Toggle Card */}
                    <div className="bg-white shadow rounded-lg p-4 flex items-center justify-between">
                        <div>
                            <Label htmlFor="optional-toggle" className="font-medium text-gray-900 cursor-pointer">
                                حصة اختيارية
                            </Label>
                            <p className="text-xs text-gray-500">
                                لا تخصم الرصيد
                            </p>
                        </div>
                        <Switch
                            id="optional-toggle"
                            checked={isOptional}
                            onCheckedChange={handleOptionalToggle}
                        />
                    </div>
                </div>

                {progressStudent && (
                    <StudentProgressModal
                        open={progressStudentId !== null}
                        onOpenChange={(open) => {
                            if (!open) closeProgress();
                        }}
                        student={{
                            id: progressStudent.id,
                            first_name: progressStudent.first_name,
                            last_name: progressStudent.last_name,
                            last_hizb_ascending: progressStudent.last_hizb_ascending ?? null,
                            last_hizb_descending: progressStudent.last_hizb_descending ?? null,
                            tested_thumns: progressStudent.tested_thumns ?? [],
                            tested_hizbs: progressStudent.tested_hizbs ?? [],
                            recent_activities: progressStudent.recent_activities ?? [],
                        }}
                        onAddMemorization={() => {
                            closeProgress();
                            openModal(progressStudent.id, "memorization");
                        }}
                        onAddRepetition={() => {
                            closeProgress();
                            openModal(progressStudent.id, "repetitions");
                        }}
                    />
                )}

                {modalStudent && (
                    <StudentSessionModal
                        open={modalStudentId !== null}
                        onOpenChange={(open) => {
                            if (!open) closeModal();
                        }}
                        defaultTab={modalDefaultTab}
                        sessionId={session.id}
                        student={{
                            id: modalStudent.id,
                            first_name: modalStudent.first_name,
                            last_name: modalStudent.last_name,
                            attendance_status: modalStudent.attendance_status ?? "present",
                            hizb_id: modalStudent.hizb_id ?? null,
                            thoman_id: modalStudent.thoman_id ?? null,
                            memorization_rating: modalStudent.memorization_rating ?? null,
                            memorization_remark: modalStudent.memorization_remark ?? null,
                            last_hizb_ascending: modalStudent.last_hizb_ascending ?? null,
                            last_hizb_descending: modalStudent.last_hizb_descending ?? null,
                            repetitions: modalStudent.repetitions ?? [],
                        }}
                        ahzab={ahzab}
                        athman={athman}
                        attendees={attendees}
                        currentUser={{ id: auth.user.id, name: auth.user.name }}
                    />
                )}

                <div className="overflow-x-auto bg-white shadow rounded-lg">
                    <table className="w-full border-collapse">
                        <thead>
                            <tr className="bg-gray-100 text-start">
                                <th className="p-3 border w-12">#</th>
                                <th className="p-3 border min-w-[200px]">الاسم والتقدم</th>
                                <th className="p-3 border w-28">الحالة</th>
                                <th className="p-3 border min-w-[280px]">السبب / التلاوة</th>
                            </tr>
                        </thead>
                        <tbody>
                            {students.map((student, index) => {
                                const studentData = attendance[student.id] || {};
                                const {
                                    status = "",
                                    excusedReason = "",
                                    hizb_id = "",
                                    thoman_id = "",
                                } = studentData;

                                return (
                                    <tr
                                        key={student.id}
                                        className={`${rowColor(status)} hover:bg-gray-50/50 transition-colors`}
                                    >
                                        <td className="p-3 border text-center font-medium text-gray-500">
                                            {index + 1}
                                        </td>
                                        <td className="p-3 border">
                                            <div className="flex items-center justify-between gap-2">
                                                <button
                                                    type="button"
                                                    onClick={() => openProgress(student.id)}
                                                    className="text-start font-medium text-gray-900 hover:text-primary"
                                                    title="عرض تفاصيل التقدم"
                                                >
                                                    {student.first_name} {student.last_name}
                                                </button>
                                                <button
                                                    type="button"
                                                    onClick={() =>
                                                        handleDirectionChange(
                                                            student.id,
                                                            student.memorization_direction === "ascending"
                                                                ? "descending"
                                                                : "ascending",
                                                        )
                                                    }
                                                    className="inline-flex w-20 shrink-0 items-center justify-center gap-1 rounded-md px-1.5 py-0.5 text-[10px] font-medium text-emerald-600 hover:bg-emerald-50"
                                                    title="انقر لتغيير الاتجاه"
                                                >
                                                    <span className="tabular-nums">
                                                        {student.memorization_direction === "ascending" ? "تصاعدي ↑" : "تنازلي ↓"}
                                                    </span>
                                                    <ArrowRightLeft className="h-3 w-3 opacity-50" />
                                                </button>
                                            </div>
                                            <button
                                                type="button"
                                                onClick={() => openProgress(student.id)}
                                                className="mt-2 block w-full cursor-pointer space-y-1.5 rounded-md text-start transition-colors hover:bg-gray-50"
                                                title="عرض تفاصيل التقدم"
                                            >
                                                <MemorizationBar
                                                    memorized={calculateStudentProgress(student).total}
                                                />
                                                <RepetitionsBar
                                                    testedHizbs={student.tested_hizbs ?? []}
                                                />
                                            </button>
                                        </td>

                                        <td className="p-3 border">
                                            <Select
                                                value={status}
                                                onValueChange={(value) =>
                                                    handleChange(student.id, "status", value)
                                                }
                                            >
                                                <SelectTrigger className="w-full">
                                                    <SelectValue placeholder="اختر" />
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
                                                            غائب بعذر
                                                        </SelectItem>
                                                        <SelectItem value="late_excused">
                                                            متأخر بعذر
                                                        </SelectItem>
                                                        <SelectItem value="kicked">
                                                            مطرود
                                                        </SelectItem>
                                                    </SelectGroup>
                                                </SelectContent>
                                            </Select>
                                        </td>

                                        <td className="p-3 border">
                                            {status === "excused" && (
                                                <input
                                                    type="text"
                                                    className="border p-2 rounded w-full text-sm"
                                                    placeholder="اكتب السبب"
                                                    value={excusedReason}
                                                    onChange={(e) =>
                                                        handleChange(
                                                            student.id,
                                                            "excusedReason",
                                                            e.target.value
                                                        )
                                                    }
                                                />
                                            )}

                                            {(status === "present" || status === "late_excused") && (() => {
                                                const hasRepetitions = (student.repetitions?.length ?? 0) > 0;
                                                const hasMemorization =
                                                    student.memorization_rating !== null && student.memorization_rating !== undefined;
                                                const memorizationDotColor =
                                                    student.memorization_rating === "great"
                                                        ? "bg-green-600"
                                                        : student.memorization_rating === "good"
                                                        ? "bg-emerald-500"
                                                        : student.memorization_rating === "mid"
                                                        ? "bg-amber-500"
                                                        : student.memorization_rating === "bad"
                                                        ? "bg-red-500"
                                                        : student.memorization_rating === "not_memorized"
                                                        ? "bg-slate-600"
                                                        : "bg-slate-400";
                                                // Aggregated "تقييم المقطع" across all repetition sections in this session.
                                                // Green only when every rated section is good/great, red only when
                                                // every rated section is bad/not_memorized, otherwise amber (mixed
                                                // or any mid, or no rated section).
                                                const repetitionDotColor = (() => {
                                                    const ratings = (student.repetitions ?? [])
                                                        .map((r) => r.overall_rating)
                                                        .filter((r): r is Rating => r != null);
                                                    if (ratings.length === 0) {
                                                        return "bg-amber-500";
                                                    }
                                                    if (ratings.every((r) => r === "good" || r === "great")) {
                                                        return "bg-emerald-500";
                                                    }
                                                    if (ratings.every((r) => r === "bad" || r === "not_memorized")) {
                                                        return "bg-red-500";
                                                    }
                                                    return "bg-amber-500";
                                                })();
                                                return (
                                                    <div className="flex items-center justify-center gap-2">
                                                        <Button
                                                            type="button"
                                                            size="sm"
                                                            variant="outline"
                                                            className="gap-1"
                                                            onClick={() => openModal(student.id, "repetitions")}
                                                        >
                                                            {hasRepetitions && (
                                                                <span
                                                                    className={`inline-block h-1.5 w-1.5 rounded-full ${repetitionDotColor}`}
                                                                    aria-hidden
                                                                />
                                                            )}
                                                            <RotateCcw className="h-3.5 w-3.5" />
                                                            تكرار
                                                            {hasRepetitions && (
                                                                <Badge variant="secondary" className="ms-1 h-4 px-1 text-[10px]">
                                                                    {student.repetitions!.length}
                                                                </Badge>
                                                            )}
                                                        </Button>
                                                        <Button
                                                            type="button"
                                                            size="sm"
                                                            variant="outline"
                                                            className="gap-1"
                                                            onClick={() => openModal(student.id, "memorization")}
                                                        >
                                                            {hasMemorization && (
                                                                <span
                                                                    className={`inline-block h-1.5 w-1.5 rounded-full ${memorizationDotColor}`}
                                                                    aria-hidden
                                                                />
                                                            )}
                                                            <BookOpenCheck className="h-3.5 w-3.5" />
                                                            حفظ
                                                        </Button>
                                                    </div>
                                                );
                                            })()}

                                            {(status === "absent" || status === "kicked" || status === "") && (
                                                <div className="flex items-center justify-center text-gray-300">
                                                    <Minus className="h-5 w-5" />
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
