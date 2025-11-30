import DashboardLayout from "@/Layouts/DashboardLayout";
import { Head, Link, useForm, router } from "@inertiajs/react";
import { Button } from "@/Components/ui/button";
import { Badge } from "@/Components/ui/badge";
import { Input } from "@/Components/ui/input";
import { Label } from "@/Components/ui/label";
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/Components/ui/card";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
    DropdownMenuSeparator,
} from "@/Components/ui/dropdown-menu";
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
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/Components/ui/popover";
import { Calendar as CalendarComponent } from "@/Components/ui/calendar";
import {
    MoreHorizontal,
    Calendar,
    Clock,
    BookOpen,
    Pencil,
    ClipboardList,
    Eye,
    XCircle,
    CheckCircle,
    ArrowLeft,
    CalendarIcon,
} from "lucide-react";
import { useState } from "react";
import { format, parse } from "date-fns";
import { ar } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

interface ProgramSession {
    id: number;
    session_date: string;
    start_time: string | null;
    end_time: string | null;
    status: "scheduled" | "completed" | "canceled";
}

interface ProgramDisplay {
    id: number;
    name?: string;
    subject_name: string;
    club_name: string;
    category_name: string;
    start_date: string;
    end_date: string;
    days_of_week: string[] | null;
    sessions: ProgramSession[];
    future_sessions: ProgramSession[];
    old_sessions: ProgramSession[];
}

interface ProgramsProps {
    auth: any;
    program: ProgramDisplay;
}

const dayLabels: Record<string, string> = {
    Sat: "السبت",
    Sun: "الأحد",
    Mon: "الإثنين",
    Tue: "الثلاثاء",
    Wed: "الأربعاء",
    Thu: "الخميس",
    Fri: "الجمعة",
};

const statusLabels: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
    scheduled: { label: "مجدولة", variant: "secondary" },
    completed: { label: "مكتملة", variant: "default" },
    canceled: { label: "ملغاة", variant: "destructive" },
};

function parseSessionDate(dateStr: string): Date | undefined {
    // Try parsing dd/mm/yyyy format
    try {
        const parsed = parse(dateStr, "dd/MM/yyyy", new Date());
        if (!isNaN(parsed.getTime())) return parsed;
    } catch {}

    // Try parsing yyyy-mm-dd format
    try {
        const parsed = parse(dateStr, "yyyy-MM-dd", new Date());
        if (!isNaN(parsed.getTime())) return parsed;
    } catch {}

    return undefined;
}

function SessionCard({ session, isPast = false }: { session: ProgramSession; isPast?: boolean }) {
    const [cancelDialogOpen, setCancelDialogOpen] = useState(false);
    const [editDialogOpen, setEditDialogOpen] = useState(false);
    const [editDate, setEditDate] = useState<Date | undefined>(() => parseSessionDate(session.session_date));
    const [editStartTime, setEditStartTime] = useState(session.start_time || "");
    const [editEndTime, setEditEndTime] = useState(session.end_time || "");
    const [isSubmitting, setIsSubmitting] = useState(false);

    const status = statusLabels[session.status] || statusLabels.scheduled;

    const handleSaveEdit = () => {
        if (!editDate) {
            toast.error("يرجى اختيار تاريخ الحصة");
            return;
        }

        setIsSubmitting(true);
        router.post(
            `/sessions/${session.id}/update`,
            {
                session_date: format(editDate, "yyyy-MM-dd"),
                start_time: editStartTime || null,
                end_time: editEndTime || null,
            },
            {
                preserveState: false,
                onSuccess: () => {
                    toast.success("تم تحديث الحصة بنجاح");
                    setEditDialogOpen(false);
                },
                onError: () => {
                    toast.error("حدث خطأ أثناء تحديث الحصة");
                },
                onFinish: () => {
                    setIsSubmitting(false);
                },
            }
        );
    };

    const handleCancelSession = () => {
        router.post(
            `/sessions/${session.id}/cancel`,
            {},
            {
                preserveState: false,
                onSuccess: () => {
                    toast.success("تم إلغاء الحصة بنجاح");
                    setCancelDialogOpen(false);
                },
                onError: () => {
                    toast.error("حدث خطأ أثناء إلغاء الحصة");
                },
            }
        );
    };

    return (
        <>
            <Card className={isPast ? "opacity-75" : ""}>
                <CardContent className="p-4">
                    <div className="flex justify-between items-start">
                        <div className="flex flex-col gap-1">
                            <div className="flex items-center gap-2">
                                <Calendar className="h-4 w-4 text-muted-foreground" />
                                <span className="font-medium">{session.session_date}</span>
                                <Badge variant={status.variant} className="text-xs">
                                    {status.label}
                                </Badge>
                            </div>
                            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                <Clock className="h-3 w-3" />
                                <span>
                                    {session.start_time || "--:--"} - {session.end_time || "--:--"}
                                </span>
                            </div>
                        </div>

                        <DropdownMenu dir="rtl">
                            <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                                    <MoreHorizontal className="h-4 w-4" />
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                                <DropdownMenuItem asChild>
                                    <Link
                                        href={route("sessions.attendance", session.id)}
                                        className="flex items-center gap-2 cursor-pointer"
                                    >
                                        <ClipboardList className="h-4 w-4" />
                                        تسجيل الحضور
                                    </Link>
                                </DropdownMenuItem>
                                <DropdownMenuItem asChild>
                                    <Link
                                        href={route("sessions.attendance", session.id)}
                                        className="flex items-center gap-2 cursor-pointer"
                                    >
                                        <Eye className="h-4 w-4" />
                                        عرض التفاصيل
                                    </Link>
                                </DropdownMenuItem>
                                {session.status !== "completed" && (
                                    <>
                                        <DropdownMenuSeparator />
                                        <DropdownMenuItem
                                            onClick={() => setEditDialogOpen(true)}
                                            className="flex items-center gap-2 cursor-pointer"
                                        >
                                            <Pencil className="h-4 w-4" />
                                            تعديل التاريخ/الوقت
                                        </DropdownMenuItem>
                                        <DropdownMenuItem
                                            onClick={() => setCancelDialogOpen(true)}
                                            className="flex items-center gap-2 cursor-pointer text-red-600 focus:text-red-600"
                                        >
                                            <XCircle className="h-4 w-4" />
                                            إلغاء الحصة
                                        </DropdownMenuItem>
                                    </>
                                )}
                            </DropdownMenuContent>
                        </DropdownMenu>
                    </div>
                </CardContent>
            </Card>

            {/* Edit Session Dialog */}
            <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
                <DialogContent dir="rtl" className="sm:max-w-[425px]">
                    <DialogHeader>
                        <DialogTitle>تعديل الحصة</DialogTitle>
                        <DialogDescription>
                            قم بتعديل تاريخ ووقت الحصة
                        </DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                        {/* Date Picker */}
                        <div className="flex flex-col gap-2">
                            <Label>تاريخ الحصة</Label>
                            <Popover>
                                <PopoverTrigger asChild>
                                    <Button
                                        variant="outline"
                                        className={cn(
                                            "justify-start text-right font-normal",
                                            !editDate && "text-muted-foreground"
                                        )}
                                    >
                                        <CalendarIcon className="ml-2 h-4 w-4" />
                                        {editDate ? (
                                            format(editDate, "dd/MM/yyyy", { locale: ar })
                                        ) : (
                                            <span>اختر التاريخ</span>
                                        )}
                                    </Button>
                                </PopoverTrigger>
                                <PopoverContent className="w-auto p-0" align="start">
                                    <CalendarComponent
                                        mode="single"
                                        selected={editDate}
                                        onSelect={setEditDate}
                                        locale={ar}
                                        initialFocus
                                    />
                                </PopoverContent>
                            </Popover>
                        </div>

                        {/* Time Inputs */}
                        <div className="grid grid-cols-2 gap-4">
                            <div className="flex flex-col gap-2">
                                <Label>وقت البداية</Label>
                                <Input
                                    type="time"
                                    value={editStartTime}
                                    onChange={(e) => setEditStartTime(e.target.value)}
                                />
                            </div>
                            <div className="flex flex-col gap-2">
                                <Label>وقت النهاية</Label>
                                <Input
                                    type="time"
                                    value={editEndTime}
                                    onChange={(e) => setEditEndTime(e.target.value)}
                                />
                            </div>
                        </div>
                    </div>
                    <DialogFooter className="gap-2 sm:gap-0">
                        <DialogClose asChild>
                            <Button variant="outline">إلغاء</Button>
                        </DialogClose>
                        <Button
                            onClick={handleSaveEdit}
                            disabled={isSubmitting}
                            className="gap-2"
                        >
                            {isSubmitting ? "جاري الحفظ..." : "حفظ التعديلات"}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Cancel Session Dialog */}
            <Dialog open={cancelDialogOpen} onOpenChange={setCancelDialogOpen}>
                <DialogContent dir="rtl">
                    <DialogHeader>
                        <DialogTitle>إلغاء الحصة</DialogTitle>
                        <DialogDescription>
                            هل أنت متأكد من إلغاء حصة يوم{" "}
                            <span className="font-semibold">{session.session_date}</span>؟
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter className="gap-2 sm:gap-0">
                        <DialogClose asChild>
                            <Button variant="outline">تراجع</Button>
                        </DialogClose>
                        <Button
                            variant="destructive"
                            className="gap-2"
                            onClick={handleCancelSession}
                        >
                            <XCircle className="h-4 w-4" />
                            إلغاء الحصة
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </>
    );
}

export default function Programs({ auth, program }: ProgramsProps) {
    return (
        <DashboardLayout user={auth.user}>
            <Head title="تفاصيل البرنامج" />

            <div className="flex flex-col gap-6">
                {/* Header */}
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <Link href={route("programs.index")}>
                            <Button variant="ghost" size="sm" className="gap-2">
                                <ArrowLeft className="h-4 w-4" />
                                العودة
                            </Button>
                        </Link>
                        <h1 className="text-3xl font-bold text-gray-900">
                            تفاصيل البرنامج
                        </h1>
                    </div>
                    <Link href={`/programs/${program.id}/edit`}>
                        <Button variant="outline" className="gap-2">
                            <Pencil className="h-4 w-4" />
                            تعديل البرنامج
                        </Button>
                    </Link>
                </div>

                {/* Program Info Card */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <BookOpen className="h-5 w-5" />
                            معلومات البرنامج
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                            <div className="flex flex-col gap-1 p-3 bg-muted/50 rounded-lg">
                                <span className="text-sm text-muted-foreground">رقم البرنامج</span>
                                <span className="font-semibold">#{program.id}</span>
                            </div>
                            <div className="flex flex-col gap-1 p-3 bg-muted/50 rounded-lg">
                                <span className="text-sm text-muted-foreground">المادة</span>
                                <span className="font-semibold">{program.subject_name}</span>
                            </div>
                            <div className="flex flex-col gap-1 p-3 bg-muted/50 rounded-lg">
                                <span className="text-sm text-muted-foreground">النادي</span>
                                <span className="font-semibold">{program.club_name}</span>
                            </div>
                            <div className="flex flex-col gap-1 p-3 bg-muted/50 rounded-lg">
                                <span className="text-sm text-muted-foreground">الفئة</span>
                                <span className="font-semibold">{program.category_name}</span>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-4">
                            <div className="flex flex-col gap-1 p-3 border rounded-lg">
                                <span className="text-sm text-muted-foreground flex items-center gap-1">
                                    <Calendar className="h-3 w-3" />
                                    تاريخ البداية
                                </span>
                                <span className="font-semibold">{program.start_date}</span>
                            </div>
                            <div className="flex flex-col gap-1 p-3 border rounded-lg">
                                <span className="text-sm text-muted-foreground flex items-center gap-1">
                                    <Calendar className="h-3 w-3" />
                                    تاريخ النهاية
                                </span>
                                <span className="font-semibold">{program.end_date}</span>
                            </div>
                            <div className="flex flex-col gap-1 p-3 border rounded-lg">
                                <span className="text-sm text-muted-foreground">أيام الحصص</span>
                                <div className="flex flex-wrap gap-1">
                                    {program.days_of_week && program.days_of_week.filter(Boolean).length > 0 ? (
                                        program.days_of_week.filter(Boolean).map((day) => (
                                            <Badge key={day} variant="secondary" className="text-xs">
                                                {dayLabels[day] || day}
                                            </Badge>
                                        ))
                                    ) : (
                                        <span className="text-sm text-muted-foreground">لم يتم تحديد أيام</span>
                                    )}
                                </div>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Stats Cards */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between pb-2">
                            <CardTitle className="text-sm font-medium text-muted-foreground">
                                الحصص القادمة
                            </CardTitle>
                            <Calendar className="h-4 w-4 text-blue-500" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold text-blue-600">
                                {program.future_sessions.length}
                            </div>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between pb-2">
                            <CardTitle className="text-sm font-medium text-muted-foreground">
                                الحصص المكتملة
                            </CardTitle>
                            <CheckCircle className="h-4 w-4 text-emerald-500" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold text-emerald-600">
                                {program.old_sessions.filter(s => s.status === "completed").length}
                            </div>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between pb-2">
                            <CardTitle className="text-sm font-medium text-muted-foreground">
                                إجمالي الحصص
                            </CardTitle>
                            <BookOpen className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">
                                {program.future_sessions.length + program.old_sessions.length}
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Future Sessions */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Calendar className="h-5 w-5 text-blue-500" />
                            الحصص القادمة
                        </CardTitle>
                        <CardDescription>
                            {program.future_sessions.length > 0
                                ? `${program.future_sessions.length} حصة قادمة`
                                : "لا توجد حصص قادمة"}
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        {program.future_sessions.length > 0 ? (
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                                {program.future_sessions.map((session) => (
                                    <SessionCard key={session.id} session={session} />
                                ))}
                            </div>
                        ) : (
                            <div className="text-center py-8 text-muted-foreground">
                                <Calendar className="h-12 w-12 mx-auto mb-2 opacity-50" />
                                <p>لا توجد حصص قادمة مسجلة</p>
                            </div>
                        )}
                    </CardContent>
                </Card>

                {/* Past Sessions */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Clock className="h-5 w-5 text-muted-foreground" />
                            الحصص السابقة
                        </CardTitle>
                        <CardDescription>
                            {program.old_sessions.length > 0
                                ? `${program.old_sessions.length} حصة سابقة`
                                : "لا توجد حصص سابقة"}
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        {program.old_sessions.length > 0 ? (
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                                {program.old_sessions.map((session) => (
                                    <SessionCard key={session.id} session={session} isPast />
                                ))}
                            </div>
                        ) : (
                            <div className="text-center py-8 text-muted-foreground">
                                <Clock className="h-12 w-12 mx-auto mb-2 opacity-50" />
                                <p>لا توجد حصص سابقة مسجلة</p>
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>
        </DashboardLayout>
    );
}
