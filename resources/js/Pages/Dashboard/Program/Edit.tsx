import DashboardLayout from "@/Layouts/DashboardLayout";
import { PageProps } from "@/types";
import { Head } from "@inertiajs/react";
import { useForm, router } from "@inertiajs/react";
import { Input } from "@/Components/ui/input";
import { Button } from "@/Components/ui/button";
import { Label } from "@/Components/ui/label";
import { Calendar } from "@/Components/ui/calendar";
import { Badge } from "@/Components/ui/badge";
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/Components/ui/card";
import {
    Select,
    SelectTrigger,
    SelectValue,
    SelectContent,
    SelectItem,
} from "@/Components/ui/select";
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/Components/ui/popover";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogClose,
} from "@/Components/ui/dialog";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/Components/ui/table";
import { Checkbox } from "@/Components/ui/checkbox";
import {
    CalendarIcon,
    Clock,
    Trash2,
    Plus,
    Check,
    X,
    CalendarDays,
    Edit,
    AlertCircle,
    ArrowLeft,
    List,
    LayoutGrid,
} from "lucide-react";
import { useState, useMemo, useEffect } from "react";
import axios from "axios";
import { format, addDays, isBefore, isAfter, isSameDay, parse } from "date-fns";
import { ar } from "date-fns/locale";
import { DateRange } from "react-day-picker";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { Link } from "@inertiajs/react";

interface ExistingSession {
    id: number;
    date: string;
    start_time: string | null;
    end_time: string | null;
    status: string;
}

interface SessionPreview {
    id: string;
    date: Date;
    dayName: string;
    startTime: string;
    endTime: string;
    isEnabled: boolean;
    isModified: boolean;
    existingId?: number;
}

interface Group {
    id: number;
    name: string;
    students_count: number;
}

interface Program {
    id: number;
    name: string;
    description?: string;
    subject_id: number;
    club_id: number;
    category_id: number;
    group_id: number | null;
    days_of_week: { value: string; label: string }[];
    is_active: boolean;
    start_date: string;
    end_date: string;
    sessions: ExistingSession[];
}

interface Props extends PageProps {
    program: Program;
    subjects: { id: number; name: string }[];
    clubs: { id: number; name: string }[];
    categories: { id: number; name: string; display_name: string }[];
}

const daysOfWeek = [
    { value: "Sat", label: "السبت", dayIndex: 6 },
    { value: "Sun", label: "الأحد", dayIndex: 0 },
    { value: "Mon", label: "الإثنين", dayIndex: 1 },
    { value: "Tue", label: "الثلاثاء", dayIndex: 2 },
    { value: "Wed", label: "الأربعاء", dayIndex: 3 },
    { value: "Thu", label: "الخميس", dayIndex: 4 },
    { value: "Fri", label: "الجمعة", dayIndex: 5 },
];

function getDayName(date: Date): string {
    const dayIndex = date.getDay();
    const day = daysOfWeek.find((d) => d.dayIndex === dayIndex);
    return day?.label || "";
}

function getDayValue(date: Date): string {
    const dayIndex = date.getDay();
    const day = daysOfWeek.find((d) => d.dayIndex === dayIndex);
    return day?.value || "";
}

export default function ProgramEdit({
    auth,
    program,
    subjects,
    clubs,
    categories,
}: Props) {
    const [step, setStep] = useState<1 | 2 | 3>(1);

    // Initialize date range from program data
    const [dateRange, setDateRange] = useState<DateRange | undefined>(() => {
        if (program.start_date && program.end_date) {
            return {
                from: new Date(program.start_date),
                to: new Date(program.end_date),
            };
        }
        return undefined;
    });

    // Initialize selected days from program data
    const [selectedDays, setSelectedDays] = useState<string[]>(() => {
        return program.days_of_week?.map(d => d.value) || [];
    });

    const [defaultStartTime, setDefaultStartTime] = useState("08:00");
    const [defaultEndTime, setDefaultEndTime] = useState("10:00");
    const [sessions, setSessions] = useState<SessionPreview[]>([]);
    const [editingSession, setEditingSession] = useState<SessionPreview | null>(null);
    const [editDialogOpen, setEditDialogOpen] = useState(false);
    const [isInitialized, setIsInitialized] = useState(false);
    const [sessionsViewMode, setSessionsViewMode] = useState<"table" | "calendar">("table");
    const [addSessionDialogOpen, setAddSessionDialogOpen] = useState(false);
    const [newSessionDate, setNewSessionDate] = useState<Date | undefined>();
    const [groups, setGroups] = useState<Group[]>([]);

    const { data, setData, post, processing, errors } = useForm({
        name: program.name || "",
        subject_id: program.subject_id?.toString() || "",
        club_id: program.club_id?.toString() || "",
        category_id: program.category_id?.toString() || "",
        group_id: program.group_id?.toString() || "all",
        days_of_week: [] as { value: string; label: string }[],
        start_date: program.start_date || "",
        end_date: program.end_date || "",
        sessions: [] as { date: string; start_time: string; end_time: string }[],
    });

    // Initialize sessions from existing program sessions
    useEffect(() => {
        if (!isInitialized && program.sessions && program.sessions.length > 0) {
            const existingSessions: SessionPreview[] = program.sessions.map((s, index) => {
                const date = new Date(s.date);
                return {
                    id: `existing-${s.id}`,
                    date,
                    dayName: getDayName(date),
                    startTime: s.start_time || "08:00",
                    endTime: s.end_time || "10:00",
                    isEnabled: true,
                    isModified: false,
                    existingId: s.id,
                };
            });
            setSessions(existingSessions);

            // Set default times from first session if available
            if (existingSessions.length > 0) {
                setDefaultStartTime(existingSessions[0].startTime);
                setDefaultEndTime(existingSessions[0].endTime);
            }

            setIsInitialized(true);
        }
    }, [program.sessions, isInitialized]);

    // Regenerate sessions when date range or selected days change (only after initialization)
    useEffect(() => {
        if (isInitialized && dateRange?.from && dateRange?.to && selectedDays.length > 0) {
            generateSessions();
        }
    }, [dateRange, selectedDays, isInitialized]);

    // Fetch groups when club or category changes
    useEffect(() => {
        if (data.club_id && data.category_id) {
            axios
                .get(route("groups.index"), {
                    params: {
                        club_id: data.club_id,
                        category_id: data.category_id,
                    },
                })
                .then((response) => {
                    setGroups(response.data.groups || []);
                    // If current group_id is not in the new groups list, clear it
                    const groupIds = (response.data.groups || []).map((g: Group) => String(g.id));
                    if (data.group_id && data.group_id !== "all" && !groupIds.includes(data.group_id)) {
                        setData("group_id", "all");
                    }
                })
                .catch(() => {
                    setGroups([]);
                });
        } else {
            setGroups([]);
        }
    }, [data.club_id, data.category_id]);

    const generateSessions = () => {
        if (!dateRange?.from || !dateRange?.to) return;

        const newSessions: SessionPreview[] = [];
        let currentDate = new Date(dateRange.from);
        let idCounter = 0;

        while (isBefore(currentDate, dateRange.to) || isSameDay(currentDate, dateRange.to)) {
            const dayValue = getDayValue(currentDate);
            if (selectedDays.includes(dayValue)) {
                // Check if session already exists (to preserve modifications)
                const existingSession = sessions.find(
                    (s) => isSameDay(s.date, currentDate)
                );

                if (existingSession) {
                    newSessions.push(existingSession);
                } else {
                    newSessions.push({
                        id: `session-${idCounter++}`,
                        date: new Date(currentDate),
                        dayName: getDayName(currentDate),
                        startTime: defaultStartTime,
                        endTime: defaultEndTime,
                        isEnabled: true,
                        isModified: false,
                    });
                }
            }
            currentDate = addDays(currentDate, 1);
        }

        setSessions(newSessions);
    };

    const toggleDay = (dayValue: string) => {
        setSelectedDays((prev) =>
            prev.includes(dayValue)
                ? prev.filter((d) => d !== dayValue)
                : [...prev, dayValue]
        );
    };

    const toggleSession = (sessionId: string) => {
        setSessions((prev) =>
            prev.map((s) =>
                s.id === sessionId
                    ? { ...s, isEnabled: !s.isEnabled, isModified: true }
                    : s
            )
        );
    };

    const updateSessionTime = (sessionId: string, startTime: string, endTime: string) => {
        setSessions((prev) =>
            prev.map((s) =>
                s.id === sessionId
                    ? { ...s, startTime, endTime, isModified: true }
                    : s
            )
        );
    };

    const addCustomSession = (date: Date) => {
        // Check if session already exists on this date
        const existingSession = sessions.find((s) => isSameDay(s.date, date));
        if (existingSession) {
            toast.error("توجد حصة بالفعل في هذا التاريخ");
            return;
        }

        const newSession: SessionPreview = {
            id: `custom-${Date.now()}`,
            date,
            dayName: getDayName(date),
            startTime: defaultStartTime,
            endTime: defaultEndTime,
            isEnabled: true,
            isModified: true,
        };
        setSessions((prev) => [...prev, newSession].sort((a, b) => a.date.getTime() - b.date.getTime()));
        toast.success("تم إضافة الحصة الاستثنائية");
    };

    const handleAddExceptionalSession = () => {
        if (!newSessionDate) {
            toast.error("يرجى اختيار تاريخ الحصة");
            return;
        }
        addCustomSession(newSessionDate);
        setAddSessionDialogOpen(false);
        setNewSessionDate(undefined);
    };

    const removeSession = (sessionId: string) => {
        setSessions((prev) => prev.filter((s) => s.id !== sessionId));
    };

    // Get all dates with sessions for calendar view
    const sessionDates = useMemo(() => {
        return sessions.map((s) => s.date);
    }, [sessions]);

    const enabledSessions = useMemo(() => sessions.filter((s) => s.isEnabled), [sessions]);

    const canProceedToStep2 = data.name && data.subject_id && data.club_id && data.category_id;
    const canProceedToStep3 = dateRange?.from && dateRange?.to && selectedDays.length > 0 && enabledSessions.length > 0;

    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleSubmit = () => {
        // Prepare data for submission
        const sessionsData = enabledSessions.map((s) => ({
            date: format(s.date, "yyyy-MM-dd"),
            start_time: s.startTime,
            end_time: s.endTime,
        }));

        // Prepare days_of_week as objects with value and label
        const daysData = selectedDays.map((d) => {
            const dayInfo = daysOfWeek.find((day) => day.value === d);
            return { value: d, label: dayInfo?.label || d };
        });

        setIsSubmitting(true);
        router.post(route("programs.update", program.id), {
            name: data.name,
            subject_id: data.subject_id,
            club_id: data.club_id,
            category_id: data.category_id,
            group_id: data.group_id === "all" ? null : data.group_id,
            days_of_week: daysData,
            start_date: dateRange?.from ? format(dateRange.from, "yyyy-MM-dd") : "",
            end_date: dateRange?.to ? format(dateRange.to, "yyyy-MM-dd") : "",
            sessions: sessionsData,
        }, {
            onFinish: () => setIsSubmitting(false),
        });
    };

    return (
        <DashboardLayout user={auth.user}>
            <Head title="تعديل البرنامج" />
            <div className="flex flex-col gap-6">
                {/* Header */}
                <div className="flex items-center justify-between">
                    <h1 className="text-3xl font-bold text-gray-900">تعديل البرنامج</h1>
                </div>

                {/* Steps Indicator */}
                <div className="flex items-center justify-center gap-2">
                    {[1, 2, 3].map((s) => (
                        <div key={s} className="flex items-center">
                            <div
                                className={cn(
                                    "w-10 h-10 rounded-full flex items-center justify-center font-bold transition-colors",
                                    step >= s
                                        ? "bg-primary text-primary-foreground"
                                        : "bg-muted text-muted-foreground"
                                )}
                            >
                                {step > s ? <Check className="h-5 w-5" /> : s}
                            </div>
                            {s < 3 && (
                                <div
                                    className={cn(
                                        "w-20 h-1 mx-2 rounded transition-colors",
                                        step > s ? "bg-primary" : "bg-muted"
                                    )}
                                />
                            )}
                        </div>
                    ))}
                </div>
                <div className="flex items-center justify-center gap-16 text-sm text-muted-foreground">
                    <span>معلومات البرنامج</span>
                    <span>الجدول الزمني</span>
                    <span>معاينة وتأكيد</span>
                </div>

                {/* Step 1: Basic Info */}
                {step === 1 && (
                    <Card>
                        <CardHeader>
                            <CardTitle>معلومات البرنامج</CardTitle>
                            <CardDescription>عدّل المعلومات الأساسية للبرنامج</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="flex flex-col gap-2">
                                    <Label>اسم البرنامج</Label>
                                    <Input
                                        value={data.name}
                                        onChange={(e) => setData("name", e.target.value)}
                                        placeholder="أدخل اسم البرنامج"
                                        dir="rtl"
                                    />
                                    {errors.name && (
                                        <p className="text-red-500 text-sm">{errors.name}</p>
                                    )}
                                </div>

                                <div className="flex flex-col gap-2">
                                    <Label>المادة</Label>
                                    <Select
                                        value={data.subject_id}
                                        onValueChange={(val) => setData("subject_id", val)}
                                        dir="rtl"
                                    >
                                        <SelectTrigger>
                                            <SelectValue placeholder="اختر المادة" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {subjects.map((s: any) => (
                                                <SelectItem key={s.id} value={String(s.id)}>
                                                    {s.name}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>

                                <div className="flex flex-col gap-2">
                                    <Label>النادي</Label>
                                    <Select
                                        value={data.club_id}
                                        onValueChange={(val) => setData("club_id", val)}
                                        dir="rtl"
                                    >
                                        <SelectTrigger>
                                            <SelectValue placeholder="اختر النادي" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {clubs.map((c: any) => (
                                                <SelectItem key={c.id} value={String(c.id)}>
                                                    {c.name}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>

                                <div className="flex flex-col gap-2">
                                    <Label>الفئة</Label>
                                    <Select
                                        value={data.category_id}
                                        onValueChange={(val) => setData("category_id", val)}
                                        dir="rtl"
                                    >
                                        <SelectTrigger>
                                            <SelectValue placeholder="اختر الفئة" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {categories.map((cat: any) => (
                                                <SelectItem key={cat.id} value={String(cat.id)}>
                                                    {cat.display_name}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>

                            {/* Group Selection - only show if groups exist */}
                            {groups.length > 0 && (
                                <div className="flex flex-col gap-2">
                                    <Label>الفوج (اختياري)</Label>
                                    <Select
                                        value={data.group_id}
                                        onValueChange={(val) => setData("group_id", val)}
                                        dir="rtl"
                                    >
                                        <SelectTrigger>
                                            <SelectValue placeholder="جميع الطلاب" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="all">جميع الطلاب</SelectItem>
                                            {groups.map((group) => (
                                                <SelectItem key={group.id} value={String(group.id)}>
                                                    فوج {group.name} ({group.students_count} طالب)
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                    <p className="text-sm text-muted-foreground">
                                        اختر فوجاً محدداً أو اترك الحقل فارغاً لتشمل جميع طلاب الفصل
                                    </p>
                                </div>
                            )}

                            <div className="flex justify-end pt-4">
                                <Button
                                    onClick={() => setStep(2)}
                                    disabled={!canProceedToStep2}
                                    className="gap-2"
                                >
                                    التالي
                                    <CalendarDays className="h-4 w-4" />
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                )}

                {/* Step 2: Schedule */}
                {step === 2 && (
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        {/* Date Range & Days Selection */}
                        <Card>
                            <CardHeader>
                                <CardTitle>الجدول الزمني</CardTitle>
                                <CardDescription>حدد فترة البرنامج وأيام الحصص</CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-6">
                                {/* Date Range Picker */}
                                <div className="flex flex-col gap-2">
                                    <Label>فترة البرنامج</Label>
                                    <Popover>
                                        <PopoverTrigger asChild>
                                            <Button
                                                variant="outline"
                                                className={cn(
                                                    "justify-start text-right font-normal",
                                                    !dateRange && "text-muted-foreground"
                                                )}
                                            >
                                                <CalendarIcon className="ml-2 h-4 w-4" />
                                                {dateRange?.from ? (
                                                    dateRange.to ? (
                                                        <>
                                                            {format(dateRange.from, "dd/MM/yyyy", { locale: ar })} -{" "}
                                                            {format(dateRange.to, "dd/MM/yyyy", { locale: ar })}
                                                        </>
                                                    ) : (
                                                        format(dateRange.from, "dd/MM/yyyy", { locale: ar })
                                                    )
                                                ) : (
                                                    <span>اختر فترة البرنامج</span>
                                                )}
                                            </Button>
                                        </PopoverTrigger>
                                        <PopoverContent className="w-auto p-0" align="start">
                                            <Calendar
                                                initialFocus
                                                mode="range"
                                                defaultMonth={dateRange?.from}
                                                selected={dateRange}
                                                onSelect={setDateRange}
                                                numberOfMonths={2}
                                                locale={ar}
                                            />
                                        </PopoverContent>
                                    </Popover>
                                </div>

                                {/* Days Selection */}
                                <div className="flex flex-col gap-2">
                                    <Label>أيام الحصص</Label>
                                    <div className="flex flex-wrap gap-2">
                                        {daysOfWeek.map((day) => (
                                            <Badge
                                                key={day.value}
                                                variant={selectedDays.includes(day.value) ? "default" : "outline"}
                                                className="cursor-pointer px-3 py-2 text-sm"
                                                onClick={() => toggleDay(day.value)}
                                            >
                                                {day.label}
                                            </Badge>
                                        ))}
                                    </div>
                                </div>

                                {/* Default Time */}
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="flex flex-col gap-2">
                                        <Label>وقت البداية الافتراضي</Label>
                                        <Input
                                            type="time"
                                            value={defaultStartTime}
                                            onChange={(e) => setDefaultStartTime(e.target.value)}
                                        />
                                    </div>
                                    <div className="flex flex-col gap-2">
                                        <Label>وقت النهاية الافتراضي</Label>
                                        <Input
                                            type="time"
                                            value={defaultEndTime}
                                            onChange={(e) => setDefaultEndTime(e.target.value)}
                                        />
                                    </div>
                                </div>

                                <Button
                                    variant="outline"
                                    onClick={generateSessions}
                                    className="w-full gap-2"
                                >
                                    <CalendarDays className="h-4 w-4" />
                                    إعادة توليد الحصص
                                </Button>
                            </CardContent>
                        </Card>

                        {/* Sessions Preview */}
                        <Card>
                            <CardHeader>
                                <div className="flex items-center justify-between">
                                    <div>
                                        <CardTitle className="flex items-center gap-2">
                                            معاينة الحصص
                                            <Badge variant="secondary">
                                                {enabledSessions.length} حصة
                                            </Badge>
                                        </CardTitle>
                                        <CardDescription>
                                            يمكنك تعديل أو حذف الحصص حسب الحاجة
                                        </CardDescription>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={() => setAddSessionDialogOpen(true)}
                                            className="gap-1"
                                        >
                                            <Plus className="h-4 w-4" />
                                            حصة استثنائية
                                        </Button>
                                        <div className="flex border rounded-md">
                                            <Button
                                                variant={sessionsViewMode === "table" ? "secondary" : "ghost"}
                                                size="sm"
                                                onClick={() => setSessionsViewMode("table")}
                                                className="rounded-l-none"
                                            >
                                                <List className="h-4 w-4" />
                                            </Button>
                                            <Button
                                                variant={sessionsViewMode === "calendar" ? "secondary" : "ghost"}
                                                size="sm"
                                                onClick={() => setSessionsViewMode("calendar")}
                                                className="rounded-r-none"
                                            >
                                                <LayoutGrid className="h-4 w-4" />
                                            </Button>
                                        </div>
                                    </div>
                                </div>
                            </CardHeader>
                            <CardContent>
                                {sessions.length === 0 ? (
                                    <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
                                        <CalendarDays className="h-12 w-12 mb-2" />
                                        <p>اختر فترة البرنامج وأيام الحصص لعرض المعاينة</p>
                                    </div>
                                ) : sessionsViewMode === "table" ? (
                                    <div className="max-h-[400px] overflow-y-auto">
                                        <Table>
                                            <TableHeader>
                                                <TableRow>
                                                    <TableHead className="w-[50px]"></TableHead>
                                                    <TableHead className="text-right">التاريخ</TableHead>
                                                    <TableHead className="text-right">اليوم</TableHead>
                                                    <TableHead className="text-right">الوقت</TableHead>
                                                    <TableHead className="w-[100px]"></TableHead>
                                                </TableRow>
                                            </TableHeader>
                                            <TableBody>
                                                {sessions.map((session) => (
                                                    <TableRow
                                                        key={session.id}
                                                        className={cn(
                                                            !session.isEnabled && "opacity-50 bg-muted/50"
                                                        )}
                                                    >
                                                        <TableCell>
                                                            <Checkbox
                                                                checked={session.isEnabled}
                                                                onCheckedChange={() => toggleSession(session.id)}
                                                            />
                                                        </TableCell>
                                                        <TableCell>
                                                            {format(session.date, "dd/MM/yyyy")}
                                                            {session.isModified && (
                                                                <Badge variant="outline" className="mr-2 text-xs">
                                                                    معدل
                                                                </Badge>
                                                            )}
                                                            {session.existingId && (
                                                                <Badge variant="secondary" className="mr-2 text-xs">
                                                                    موجود
                                                                </Badge>
                                                            )}
                                                        </TableCell>
                                                        <TableCell>{session.dayName}</TableCell>
                                                        <TableCell>
                                                            <div className="flex items-center gap-1 text-sm">
                                                                <Clock className="h-3 w-3" />
                                                                {session.startTime} - {session.endTime}
                                                            </div>
                                                        </TableCell>
                                                        <TableCell>
                                                            <div className="flex gap-1">
                                                                <Button
                                                                    variant="ghost"
                                                                    size="sm"
                                                                    onClick={() => {
                                                                        setEditingSession(session);
                                                                        setEditDialogOpen(true);
                                                                    }}
                                                                >
                                                                    <Edit className="h-4 w-4" />
                                                                </Button>
                                                                <Button
                                                                    variant="ghost"
                                                                    size="sm"
                                                                    onClick={() => removeSession(session.id)}
                                                                    className="text-red-500 hover:text-red-600"
                                                                >
                                                                    <Trash2 className="h-4 w-4" />
                                                                </Button>
                                                            </div>
                                                        </TableCell>
                                                    </TableRow>
                                                ))}
                                            </TableBody>
                                        </Table>
                                    </div>
                                ) : (
                                    <div className="flex justify-center">
                                        <Calendar
                                            mode="multiple"
                                            selected={sessionDates}
                                            locale={ar}
                                            numberOfMonths={2}
                                            defaultMonth={dateRange?.from || new Date()}
                                            modifiers={{
                                                disabled: sessions.filter((s) => !s.isEnabled).map((s) => s.date),
                                            }}
                                            modifiersClassNames={{
                                                disabled: "opacity-30 line-through",
                                            }}
                                            onDayClick={(day) => {
                                                const session = sessions.find((s) => isSameDay(s.date, day));
                                                if (session) {
                                                    setEditingSession(session);
                                                    setEditDialogOpen(true);
                                                }
                                            }}
                                            classNames={{
                                                day_selected: "bg-primary text-primary-foreground hover:bg-primary/90",
                                            }}
                                        />
                                    </div>
                                )}
                            </CardContent>
                        </Card>

                        {/* Navigation */}
                        <div className="lg:col-span-2 flex justify-between">
                            <Button variant="outline" onClick={() => setStep(1)}>
                                السابق
                            </Button>
                            <Button
                                onClick={() => setStep(3)}
                                disabled={!canProceedToStep3}
                                className="gap-2"
                            >
                                معاينة وتأكيد
                                <Check className="h-4 w-4" />
                            </Button>
                        </div>
                    </div>
                )}

                {/* Step 3: Review & Confirm */}
                {step === 3 && (
                    <div className="space-y-6">
                        <Card>
                            <CardHeader>
                                <CardTitle>مراجعة البرنامج</CardTitle>
                                <CardDescription>تأكد من صحة المعلومات قبل الحفظ</CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-6">
                                {/* Program Info Summary */}
                                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                    <div>
                                        <p className="text-sm text-muted-foreground">اسم البرنامج</p>
                                        <p className="font-medium">{data.name}</p>
                                    </div>
                                    <div>
                                        <p className="text-sm text-muted-foreground">المادة</p>
                                        <p className="font-medium">
                                            {subjects.find((s: any) => String(s.id) === data.subject_id)?.name}
                                        </p>
                                    </div>
                                    <div>
                                        <p className="text-sm text-muted-foreground">النادي</p>
                                        <p className="font-medium">
                                            {clubs.find((c: any) => String(c.id) === data.club_id)?.name}
                                        </p>
                                    </div>
                                    <div>
                                        <p className="text-sm text-muted-foreground">الفئة</p>
                                        <p className="font-medium">
                                            {categories.find((c: any) => String(c.id) === data.category_id)?.display_name}
                                        </p>
                                    </div>
                                </div>

                                {/* Group Info */}
                                {groups.length > 0 && (
                                    <div className="mt-4">
                                        <p className="text-sm text-muted-foreground">الفوج</p>
                                        <p className="font-medium">
                                            {data.group_id
                                                ? `فوج ${groups.find((g) => String(g.id) === data.group_id)?.name}`
                                                : "جميع الطلاب"}
                                        </p>
                                    </div>
                                )}

                                <div className="border-t pt-4">
                                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                                        <div>
                                            <p className="text-sm text-muted-foreground">فترة البرنامج</p>
                                            <p className="font-medium">
                                                {dateRange?.from && format(dateRange.from, "dd/MM/yyyy")} -{" "}
                                                {dateRange?.to && format(dateRange.to, "dd/MM/yyyy")}
                                            </p>
                                        </div>
                                        <div>
                                            <p className="text-sm text-muted-foreground">أيام الحصص</p>
                                            <div className="flex gap-1 flex-wrap">
                                                {selectedDays.map((d) => (
                                                    <Badge key={d} variant="secondary">
                                                        {daysOfWeek.find((day) => day.value === d)?.label}
                                                    </Badge>
                                                ))}
                                            </div>
                                        </div>
                                        <div>
                                            <p className="text-sm text-muted-foreground">عدد الحصص</p>
                                            <p className="font-medium text-lg">{enabledSessions.length} حصة</p>
                                        </div>
                                    </div>
                                </div>

                                {/* Sessions List */}
                                <div className="border-t pt-4">
                                    <h3 className="font-medium mb-4">قائمة الحصص</h3>
                                    <div className="max-h-[300px] overflow-y-auto rounded-md border">
                                        <Table>
                                            <TableHeader>
                                                <TableRow>
                                                    <TableHead className="text-right">#</TableHead>
                                                    <TableHead className="text-right">التاريخ</TableHead>
                                                    <TableHead className="text-right">اليوم</TableHead>
                                                    <TableHead className="text-right">الوقت</TableHead>
                                                </TableRow>
                                            </TableHeader>
                                            <TableBody>
                                                {enabledSessions.map((session, index) => (
                                                    <TableRow key={session.id}>
                                                        <TableCell>{index + 1}</TableCell>
                                                        <TableCell>
                                                            {format(session.date, "dd/MM/yyyy")}
                                                        </TableCell>
                                                        <TableCell>{session.dayName}</TableCell>
                                                        <TableCell>
                                                            {session.startTime} - {session.endTime}
                                                        </TableCell>
                                                    </TableRow>
                                                ))}
                                            </TableBody>
                                        </Table>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        {/* Navigation */}
                        <div className="flex justify-between">
                            <Button variant="outline" onClick={() => setStep(2)}>
                                السابق
                            </Button>
                            <Button
                                onClick={handleSubmit}
                                disabled={isSubmitting}
                                className="gap-2"
                            >
                                {isSubmitting ? "جاري الحفظ..." : "حفظ التعديلات"}
                                <Check className="h-4 w-4" />
                            </Button>
                        </div>
                    </div>
                )}

                {/* Edit Session Dialog */}
                <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
                    <DialogContent dir="rtl">
                        <DialogHeader>
                            <DialogTitle>تعديل الحصة</DialogTitle>
                            <DialogDescription>
                                {editingSession && format(editingSession.date, "EEEE dd/MM/yyyy", { locale: ar })}
                            </DialogDescription>
                        </DialogHeader>
                        {editingSession && (
                            <div className="grid grid-cols-2 gap-4 py-4">
                                <div className="flex flex-col gap-2">
                                    <Label>وقت البداية</Label>
                                    <Input
                                        type="time"
                                        value={editingSession.startTime}
                                        onChange={(e) =>
                                            setEditingSession({
                                                ...editingSession,
                                                startTime: e.target.value,
                                            })
                                        }
                                    />
                                </div>
                                <div className="flex flex-col gap-2">
                                    <Label>وقت النهاية</Label>
                                    <Input
                                        type="time"
                                        value={editingSession.endTime}
                                        onChange={(e) =>
                                            setEditingSession({
                                                ...editingSession,
                                                endTime: e.target.value,
                                            })
                                        }
                                    />
                                </div>
                            </div>
                        )}
                        <DialogFooter>
                            <DialogClose asChild>
                                <Button variant="outline">إلغاء</Button>
                            </DialogClose>
                            <Button
                                onClick={() => {
                                    if (editingSession) {
                                        updateSessionTime(
                                            editingSession.id,
                                            editingSession.startTime,
                                            editingSession.endTime
                                        );
                                        setEditDialogOpen(false);
                                    }
                                }}
                            >
                                حفظ التعديلات
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>

                {/* Add Exceptional Session Dialog */}
                <Dialog open={addSessionDialogOpen} onOpenChange={setAddSessionDialogOpen}>
                    <DialogContent dir="rtl" className="sm:max-w-[425px]">
                        <DialogHeader>
                            <DialogTitle>إضافة حصة استثنائية</DialogTitle>
                            <DialogDescription>
                                أضف حصة استثنائية خارج الجدول الزمني المحدد
                            </DialogDescription>
                        </DialogHeader>
                        <div className="py-4">
                            <div className="flex flex-col gap-2">
                                <Label>تاريخ الحصة</Label>
                                <Popover>
                                    <PopoverTrigger asChild>
                                        <Button
                                            variant="outline"
                                            className={cn(
                                                "justify-start text-right font-normal",
                                                !newSessionDate && "text-muted-foreground"
                                            )}
                                        >
                                            <CalendarIcon className="ml-2 h-4 w-4" />
                                            {newSessionDate ? (
                                                format(newSessionDate, "dd/MM/yyyy", { locale: ar })
                                            ) : (
                                                <span>اختر التاريخ</span>
                                            )}
                                        </Button>
                                    </PopoverTrigger>
                                    <PopoverContent className="w-auto p-0" align="start">
                                        <Calendar
                                            mode="single"
                                            selected={newSessionDate}
                                            onSelect={setNewSessionDate}
                                            locale={ar}
                                            initialFocus
                                        />
                                    </PopoverContent>
                                </Popover>
                            </div>
                        </div>
                        <DialogFooter className="gap-2 sm:gap-0">
                            <DialogClose asChild>
                                <Button variant="outline">إلغاء</Button>
                            </DialogClose>
                            <Button onClick={handleAddExceptionalSession} className="gap-2">
                                <Plus className="h-4 w-4" />
                                إضافة الحصة
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
            </div>
        </DashboardLayout>
    );
}
