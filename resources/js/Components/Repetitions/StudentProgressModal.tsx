import { BookOpenCheck, RotateCcw } from "lucide-react";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from "@/Components/ui/dialog";
import { ScrollArea } from "@/Components/ui/scroll-area";
import { Button } from "@/Components/ui/button";
import { Badge } from "@/Components/ui/badge";
import { cn } from "@/lib/utils";
import RepetitionsBar from "./RepetitionsBar";
import type { Rating, RecentActivity, TestedThumn } from "./types";

interface TestedHizb {
    hizb_number: number;
    rating: Rating | null;
}

interface StudentForProgress {
    id: number;
    first_name: string;
    last_name: string;
    last_hizb_ascending: number | null;
    last_hizb_descending: number | null;
    tested_thumns: TestedThumn[];
    tested_hizbs: TestedHizb[];
    recent_activities: RecentActivity[];
}

interface Props {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    student: StudentForProgress;
    onAddMemorization: () => void;
    onAddRepetition: () => void;
}

const RATING_LABELS: Record<Rating, string> = {
    great: "جيد جدا",
    good: "ممتاز",
    mid: "جيد",
    bad: "ضعيف",
    not_memorized: "لم يحفظ",
};

const RATING_BADGE_CLASSES: Record<Rating, string> = {
    great: "border-green-200 bg-green-50 text-green-700",
    good: "border-emerald-200 bg-emerald-50 text-emerald-700",
    mid: "border-amber-200 bg-amber-50 text-amber-700",
    bad: "border-red-200 bg-red-50 text-red-700",
    not_memorized: "border-slate-200 bg-slate-50 text-slate-700",
};

function calculateMemorized(ascending: number | null, descending: number | null): number {
    const a = ascending ?? 0;
    const d = descending ? 60 - descending + 1 : 0;
    let overlap = 0;
    if (ascending && descending && ascending >= descending) {
        overlap = ascending - descending + 1;
    }
    return Math.min(60, Math.max(0, a + d - overlap));
}

function activityLabel(a: RecentActivity): string {
    if (a.type === "memorization") {
        if (a.hizb_number !== null && a.thoman_number !== null) {
            return `الحزب ${a.hizb_number} - الثمن ${a.thoman_number}`;
        }
        if (a.hizb_number !== null) {
            return `الحزب ${a.hizb_number}`;
        }
        return "حفظ";
    }
    if (a.hizb_number !== null) {
        return `الحزب ${a.hizb_number}`;
    }
    return "تكرار";
}

function activityDetail(a: RecentActivity): string {
    if (a.type === "repetition" && a.count !== null) {
        return `${a.count} ثمن`;
    }
    return "";
}

function ProgressCard({
    label,
    percentage,
    detail,
    icon,
    tone,
}: {
    label: string;
    percentage: number;
    detail: string;
    icon: React.ReactNode;
    tone: "memorization" | "repetition";
}) {
    const toneClasses =
        tone === "memorization"
            ? {
                wrapper: "border-emerald-200 bg-emerald-50",
                label: "text-emerald-900",
                bar: "bg-emerald-500",
                track: "bg-emerald-200/60",
                icon: "bg-emerald-500 text-white",
            }
            : {
                wrapper: "border-amber-200 bg-amber-50",
                label: "text-amber-900",
                bar: "bg-amber-500",
                track: "bg-amber-200/60",
                icon: "bg-amber-500 text-white",
            };

    return (
        <div className={cn("flex flex-col gap-3 rounded-xl border p-4", toneClasses.wrapper)}>
            <div className="flex items-center justify-between">
                <span className={cn("font-medium", toneClasses.label)}>{label}</span>
                <span className={cn("flex h-8 w-8 items-center justify-center rounded-full", toneClasses.icon)}>
                    {icon}
                </span>
            </div>
            <div className={cn("relative h-2 w-full overflow-hidden rounded-full", toneClasses.track)}>
                <div
                    className={cn("absolute inset-y-0 start-0 transition-all", toneClasses.bar)}
                    style={{ width: `${percentage}%` }}
                />
            </div>
            <div className={cn("flex items-center justify-between text-sm font-semibold tabular-nums", toneClasses.label)}>
                <span>{percentage}%</span>
                <span>{detail}</span>
            </div>
        </div>
    );
}

export default function StudentProgressModal({
    open,
    onOpenChange,
    student,
    onAddMemorization,
    onAddRepetition,
}: Props) {
    const memorizedCount = calculateMemorized(student.last_hizb_ascending, student.last_hizb_descending);
    const memorizedPercentage = Math.round((memorizedCount / 60) * 100);

    const testedHizbs = new Set(student.tested_thumns.map((t) => t.hizb_number)).size;
    const testedPercentage = Math.round((testedHizbs / 60) * 100);

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-2xl gap-0 p-0">
                <DialogHeader className="border-b px-6 py-4">
                    <div className="space-y-1">
                        <DialogTitle className="text-base">
                            {student.first_name} {student.last_name}
                        </DialogTitle>
                        <p className="text-xs text-muted-foreground">رقم الطالب: #{student.id}</p>
                    </div>
                </DialogHeader>

                <ScrollArea className="max-h-[70vh]" dir="rtl">
                    <div className="space-y-6 px-6 py-4" dir="rtl">
                        <div className="space-y-3">
                            <h3 className="text-sm font-semibold">نظرة عامة على التقدم</h3>
                            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                                <div className="flex flex-col gap-3 rounded-xl border border-amber-200 bg-amber-50 p-4">
                                    <div className="flex items-center justify-between">
                                        <span className="font-medium text-amber-900">التكرار</span>
                                        <span className="flex h-8 w-8 items-center justify-center rounded-full bg-amber-500 text-white">
                                            <RotateCcw className="h-4 w-4" />
                                        </span>
                                    </div>
                                    <RepetitionsBar testedHizbs={student.tested_hizbs} showLabels={false} />
                                    <div className="flex items-center justify-between text-sm font-semibold tabular-nums text-amber-900">
                                        <span>{testedPercentage}%</span>
                                        <span>{testedHizbs}/60 حزب</span>
                                    </div>
                                </div>
                                <ProgressCard
                                    label="الحفظ"
                                    percentage={memorizedPercentage}
                                    detail={`${memorizedCount}/60 حزب`}
                                    icon={<BookOpenCheck className="h-4 w-4" />}
                                    tone="memorization"
                                />
                            </div>
                        </div>

                        <div className="space-y-3">
                            <h3 className="text-sm font-semibold">النشاطات الأخيرة</h3>
                            {student.recent_activities.length === 0 ? (
                                <p className="rounded-md border border-dashed p-4 text-center text-xs text-muted-foreground">
                                    لا توجد نشاطات مسجلة بعد
                                </p>
                            ) : (
                                <ul className="divide-y rounded-md border">
                                    {student.recent_activities.map((a, i) => (
                                        <li key={i} className="flex items-center justify-between gap-3 px-3 py-2">
                                            <div className="flex items-center gap-3">
                                                <span
                                                    className={cn(
                                                        "h-2 w-2 shrink-0 rounded-full",
                                                        a.type === "memorization" ? "bg-emerald-500" : "bg-amber-500",
                                                    )}
                                                />
                                                <div className="space-y-0.5">
                                                    <p className="text-sm font-medium">{activityLabel(a)}</p>
                                                    {activityDetail(a) && (
                                                        <p className="text-xs text-muted-foreground">{activityDetail(a)}</p>
                                                    )}
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                {a.rating && (
                                                    <Badge variant="outline" className={cn("text-[10px]", RATING_BADGE_CLASSES[a.rating])}>
                                                        {RATING_LABELS[a.rating]}
                                                    </Badge>
                                                )}
                                                <span className="text-xs text-muted-foreground tabular-nums">{a.date ?? ""}</span>
                                            </div>
                                        </li>
                                    ))}
                                </ul>
                            )}
                        </div>
                    </div>
                </ScrollArea>

                <div className="grid grid-cols-2 gap-3 border-t bg-muted/40 px-6 py-4">
                    <Button
                        onClick={onAddMemorization}
                        className="gap-2 bg-emerald-600 text-white hover:bg-emerald-700"
                    >
                        <BookOpenCheck className="h-4 w-4" />
                        إضافة حفظ
                    </Button>
                    <Button
                        onClick={onAddRepetition}
                        className="gap-2 bg-amber-600 text-white hover:bg-amber-700"
                    >
                        <RotateCcw className="h-4 w-4" />
                        إضافة تكرار
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    );
}
