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
import { Badge } from "@/Components/ui/badge";
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from "@/Components/ui/tooltip";
import { useState, useMemo } from "react";

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
    memorization_direction?: "ascending" | "descending";
    last_hizb_id?: number | null;
    last_hizb_ascending?: number | null;
    last_hizb_descending?: number | null;
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

// Mini Progress Bar Component with Direction Toggle and Session Progress
function MiniProgressBar({
    student,
    ahzab,
    onDirectionChange,
    currentSessionHizbId,
}: {
    student: Student;
    ahzab: Hizb[];
    onDirectionChange: (direction: "ascending" | "descending") => void;
    currentSessionHizbId?: string | number;
}) {
    const progress = calculateStudentProgress(student);
    const direction = student.memorization_direction ?? "descending";

    // Calculate suggested next hizb
    const suggestedHizbNumber =
        direction === "ascending"
            ? (student.last_hizb_ascending ?? 0) + 1
            : (student.last_hizb_descending ?? 61) - 1;

    const suggestedHizb = ahzab.find((h) => h.number === suggestedHizbNumber);

    // Find current session hizb details
    const currentHizb = currentSessionHizbId
        ? ahzab.find((h) => h.id.toString() === currentSessionHizbId.toString())
        : null;

    // Calculate pending progress (hizb selected in current session)
    const getPendingProgress = () => {
        if (!currentHizb) return { ascending: 0, descending: 0 };

        const hizbNumber = currentHizb.number;

        // Check if this hizb extends current progress
        if (hizbNumber <= 30) {
            // Ascending range
            const currentMax = student.last_hizb_ascending ?? 0;
            if (hizbNumber > currentMax) {
                // New progress in ascending direction
                return {
                    ascending: hizbNumber - currentMax,
                    descending: 0,
                };
            }
        } else {
            // Descending range
            const currentMin = student.last_hizb_descending ?? 61;
            if (hizbNumber < currentMin) {
                // New progress in descending direction
                return {
                    ascending: 0,
                    descending: currentMin - hizbNumber,
                };
            }
        }

        return { ascending: 0, descending: 0 };
    };

    const pending = getPendingProgress();
    const hasPendingProgress = pending.ascending > 0 || pending.descending > 0;

    const toggleDirection = () => {
        const newDirection = direction === "ascending" ? "descending" : "ascending";
        onDirectionChange(newDirection);
    };

    // Calculate total including pending
    const totalWithPending = Math.min(
        60,
        progress.total + pending.ascending + pending.descending
    );
    const percentageWithPending = Math.round((totalWithPending / 60) * 100);

    return (
        <TooltipProvider>
            <Tooltip>
                <TooltipTrigger asChild>
                    <div className="mt-2 cursor-help">
                        {/* Progress Bar */}
                        <div className="relative h-3 bg-gray-200 rounded-full overflow-hidden">
                            {/* Ascending solid (green from left) */}
                            {progress.ascending > 0 && (
                                <div
                                    className="absolute top-0 left-0 h-full bg-green-500 transition-all"
                                    style={{
                                        width: `${(progress.ascending / 60) * 100}%`,
                                    }}
                                />
                            )}
                            {/* Ascending pending (striped green) */}
                            {pending.ascending > 0 && (
                                <div
                                    className="absolute top-0 h-full transition-all"
                                    style={{
                                        left: `${(progress.ascending / 60) * 100}%`,
                                        width: `${(pending.ascending / 60) * 100}%`,
                                        background:
                                            "repeating-linear-gradient(45deg, #22c55e, #22c55e 2px, #86efac 2px, #86efac 4px)",
                                    }}
                                />
                            )}
                            {/* Descending solid (blue from right) */}
                            {progress.descending > 0 && (
                                <div
                                    className="absolute top-0 right-0 h-full bg-blue-500 transition-all"
                                    style={{
                                        width: `${(progress.descending / 60) * 100}%`,
                                    }}
                                />
                            )}
                            {/* Descending pending (striped blue) */}
                            {pending.descending > 0 && (
                                <div
                                    className="absolute top-0 h-full transition-all"
                                    style={{
                                        right: `${(progress.descending / 60) * 100}%`,
                                        width: `${(pending.descending / 60) * 100}%`,
                                        background:
                                            "repeating-linear-gradient(-45deg, #3b82f6, #3b82f6 2px, #93c5fd 2px, #93c5fd 4px)",
                                    }}
                                />
                            )}
                            {/* Center marker */}
                            <div className="absolute top-0 left-1/2 w-px h-full bg-gray-400" />
                        </div>

                        {/* Direction indicator and progress */}
                        <div className="flex justify-between items-center mt-1 text-[10px] text-gray-500">
                            <button
                                type="button"
                                onClick={(e) => {
                                    e.stopPropagation();
                                    toggleDirection();
                                }}
                                className="flex items-center gap-1 hover:opacity-70 transition-opacity"
                                title="انقر لتغيير الاتجاه"
                            >
                                {direction === "ascending" ? (
                                    <Badge
                                        variant="outline"
                                        className="text-[9px] px-1 py-0 h-4 bg-green-50 border-green-300 text-green-700 cursor-pointer hover:bg-green-100"
                                    >
                                        ↑ تصاعدي ⟲
                                    </Badge>
                                ) : (
                                    <Badge
                                        variant="outline"
                                        className="text-[9px] px-1 py-0 h-4 bg-blue-50 border-blue-300 text-blue-700 cursor-pointer hover:bg-blue-100"
                                    >
                                        ↓ تنازلي ⟲
                                    </Badge>
                                )}
                            </button>
                            <span className="font-medium">
                                {hasPendingProgress ? (
                                    <span className="text-primary">
                                        {percentageWithPending}% ({totalWithPending}/60)
                                        <span className="text-[8px] mr-1">+{pending.ascending + pending.descending}</span>
                                    </span>
                                ) : (
                                    `${progress.percentage}% (${progress.total}/60)`
                                )}
                            </span>
                        </div>
                    </div>
                </TooltipTrigger>
                <TooltipContent side="bottom" className="text-right">
                    <div className="space-y-1 text-xs">
                        <p className="font-semibold border-b pb-1">التقدم في الحفظ</p>
                        <div className="flex items-center gap-2">
                            <div className="w-2 h-2 bg-green-500 rounded" />
                            <span>
                                تصاعدي (1→):{" "}
                                {progress.lastAscending
                                    ? `حزب ${progress.lastAscending}`
                                    : "لم يبدأ"}
                                {pending.ascending > 0 && (
                                    <span className="text-primary mr-1">
                                        (+{pending.ascending} هذه الجلسة)
                                    </span>
                                )}
                            </span>
                        </div>
                        <div className="flex items-center gap-2">
                            <div className="w-2 h-2 bg-blue-500 rounded" />
                            <span>
                                تنازلي (←60):{" "}
                                {progress.lastDescending
                                    ? `حزب ${progress.lastDescending}`
                                    : "لم يبدأ"}
                                {pending.descending > 0 && (
                                    <span className="text-primary mr-1">
                                        (+{pending.descending} هذه الجلسة)
                                    </span>
                                )}
                            </span>
                        </div>
                        <p className="pt-1 border-t font-medium">
                            المجموع: {progress.total} حزب ({progress.percentage}%)
                            {hasPendingProgress && (
                                <span className="text-primary mr-1">
                                    → {totalWithPending} ({percentageWithPending}%)
                                </span>
                            )}
                        </p>
                        {currentHizb && (
                            <p className="text-primary pt-1 border-t">
                                الجلسة الحالية: حزب {currentHizb.number} ({currentHizb.start})
                            </p>
                        )}
                        {!currentHizb && suggestedHizb && (
                            <p className="text-muted-foreground pt-1">
                                التالي المقترح: {suggestedHizb.start}
                            </p>
                        )}
                        <p className="text-muted-foreground pt-1 border-t">
                            انقر على الاتجاه لتغييره
                        </p>
                    </div>
                </TooltipContent>
            </Tooltip>
        </TooltipProvider>
    );
}

// Smart Hizb Select with grouped options
function SmartHizbSelect({
    student,
    ahzab,
    selectedHizbId,
    onSelect,
}: {
    student: Student;
    ahzab: Hizb[];
    selectedHizbId: string;
    onSelect: (value: string) => void;
}) {
    const direction = student.memorization_direction ?? "descending";
    const progress = calculateStudentProgress(student);

    // Calculate suggested next hizb number
    const suggestedHizbNumber =
        direction === "ascending"
            ? (student.last_hizb_ascending ?? 0) + 1
            : (student.last_hizb_descending ?? 61) - 1;

    // Check if a hizb is memorized
    const isMemorized = (hizbNumber: number) => {
        const fromAscending =
            student.last_hizb_ascending && hizbNumber <= student.last_hizb_ascending;
        const fromDescending =
            student.last_hizb_descending && hizbNumber >= student.last_hizb_descending;
        return fromAscending || fromDescending;
    };

    // Sort hizbs based on direction
    const sortedHizbs = useMemo(() => {
        return [...ahzab].sort((a, b) => {
            if (direction === "descending") {
                return b.number - a.number;
            }
            return a.number - b.number;
        });
    }, [ahzab, direction]);

    // Group hizbs
    const suggestedHizb = sortedHizbs.find((h) => h.number === suggestedHizbNumber);
    const remainingHizbs = sortedHizbs.filter(
        (h) => h.number !== suggestedHizbNumber && !isMemorized(h.number)
    );
    const memorizedHizbs = sortedHizbs.filter(
        (h) => h.number !== suggestedHizbNumber && isMemorized(h.number)
    );

    return (
        <Select value={selectedHizbId} onValueChange={onSelect}>
            <SelectTrigger className="w-full">
                <SelectValue placeholder="اختر الحزب" />
            </SelectTrigger>
            <SelectContent className="max-h-[300px]">
                {/* Suggested Hizb */}
                {suggestedHizb && (
                    <SelectGroup>
                        <SelectLabel className="text-primary font-bold text-xs">
                            المقترح التالي
                        </SelectLabel>
                        <SelectItem
                            value={suggestedHizb.id.toString()}
                            className="bg-primary/10 font-semibold border-r-2 border-primary"
                        >
                            <span className="flex items-center gap-2">
                                <span className="text-primary">◀</span>
                                <span>حزب {suggestedHizb.number}</span>
                                <span className="text-gray-500 text-xs">
                                    ({suggestedHizb.start})
                                </span>
                            </span>
                        </SelectItem>
                    </SelectGroup>
                )}

                {/* Remaining Hizbs */}
                {remainingHizbs.length > 0 && (
                    <SelectGroup>
                        <SelectLabel className="text-xs text-gray-500">
                            المتبقي
                        </SelectLabel>
                        {remainingHizbs.map((hizb) => (
                            <SelectItem key={hizb.id} value={hizb.id.toString()}>
                                <span className="flex items-center gap-2">
                                    <span>حزب {hizb.number}</span>
                                    <span className="text-gray-400 text-xs">
                                        ({hizb.start})
                                    </span>
                                </span>
                            </SelectItem>
                        ))}
                    </SelectGroup>
                )}

                {/* Memorized Hizbs */}
                {memorizedHizbs.length > 0 && (
                    <SelectGroup>
                        <SelectLabel className="text-xs text-gray-400">
                            تم حفظه
                        </SelectLabel>
                        {memorizedHizbs.map((hizb) => (
                            <SelectItem
                                key={hizb.id}
                                value={hizb.id.toString()}
                                className="text-gray-400"
                            >
                                <span className="flex items-center gap-2">
                                    <span className="text-green-500">✓</span>
                                    <span>حزب {hizb.number}</span>
                                    <span className="text-gray-300 text-xs">
                                        ({hizb.start})
                                    </span>
                                </span>
                            </SelectItem>
                        ))}
                    </SelectGroup>
                )}
            </SelectContent>
        </Select>
    );
}

export default function Attendance({
    auth,
    session,
    students: initialStudents,
    ahzab,
    athman,
}: SessionAttendanceProps) {
    // Track students locally to update direction immediately
    const [students, setStudents] = useState(initialStudents);

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
                return "bg-green-50";
            case "absent":
                return "bg-red-50";
            case "excused":
                return "bg-yellow-50";
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
                                            <div className="font-medium text-gray-900">
                                                {student.first_name} {student.last_name}
                                            </div>
                                            <MiniProgressBar
                                                student={student}
                                                ahzab={ahzab}
                                                onDirectionChange={(direction) =>
                                                    handleDirectionChange(student.id, direction)
                                                }
                                                currentSessionHizbId={status === "present" ? hizb_id : undefined}
                                            />
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
                                                            مُعذَر
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
                                                    onBlur={() =>
                                                        router.post(
                                                            route(
                                                                "sessions.recordAttendance",
                                                                session.id
                                                            ),
                                                            {
                                                                student_id: student.id,
                                                                status,
                                                                excusedReason: excusedReason,
                                                            },
                                                            { preserveScroll: true }
                                                        )
                                                    }
                                                />
                                            )}

                                            {status === "present" && (
                                                <div className="flex gap-2">
                                                    <div className="flex-1">
                                                        <SmartHizbSelect
                                                            student={student}
                                                            ahzab={ahzab}
                                                            selectedHizbId={hizb_id.toString()}
                                                            onSelect={(value) =>
                                                                handleChange(
                                                                    student.id,
                                                                    "hizb_id",
                                                                    value
                                                                )
                                                            }
                                                        />
                                                    </div>
                                                    <div className="flex-1">
                                                        <Select
                                                            value={thoman_id.toString()}
                                                            onValueChange={(value) =>
                                                                handleChange(
                                                                    student.id,
                                                                    "thoman_id",
                                                                    value
                                                                )
                                                            }
                                                        >
                                                            <SelectTrigger className="w-full">
                                                                <SelectValue placeholder="الثمن" />
                                                            </SelectTrigger>
                                                            <SelectContent>
                                                                <SelectGroup>
                                                                    {athman
                                                                        .filter(
                                                                            (t) =>
                                                                                t.hizb_id.toString() ===
                                                                                hizb_id.toString()
                                                                        )
                                                                        .map((thoman) => (
                                                                            <SelectItem
                                                                                key={thoman.id}
                                                                                value={thoman.id.toString()}
                                                                            >
                                                                                {thoman.start}
                                                                            </SelectItem>
                                                                        ))}
                                                                </SelectGroup>
                                                            </SelectContent>
                                                        </Select>
                                                    </div>
                                                </div>
                                            )}

                                            {status === "absent" && (
                                                <span className="text-gray-400 text-sm">-</span>
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
