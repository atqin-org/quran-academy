import { useMemo, useState } from "react";
import { router } from "@inertiajs/react";
import { Loader2 } from "lucide-react";
import { Button } from "@/Components/ui/button";
import { Label } from "@/Components/ui/label";
import { Textarea } from "@/Components/ui/textarea";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/Components/ui/select";
import RatingControl from "./RatingControl";
import type { HizbOption, Rating, ThomanOption } from "./types";

interface Props {
    sessionId: number;
    studentId: number;
    initial: {
        status: string;
        hizb_id: number | null;
        thoman_id: number | null;
        memorization_rating: Rating | null;
        memorization_remark: string | null;
    };
    ahzab: HizbOption[];
    athman: ThomanOption[];
    onSaved: () => void;
    onCancel: () => void;
}

export default function MemorizationForm({
    sessionId,
    studentId,
    initial,
    ahzab,
    athman,
    onSaved,
    onCancel,
}: Props) {
    const [hizbId, setHizbId] = useState<number | null>(initial.hizb_id);
    const [thomanId, setThomanId] = useState<number | null>(initial.thoman_id);
    const [rating, setRating] = useState<Rating | null>(initial.memorization_rating);
    const [remark, setRemark] = useState<string>(initial.memorization_remark ?? "");
    const [saving, setSaving] = useState(false);
    const [errors, setErrors] = useState<Record<string, string>>({});

    const availableThumns = useMemo(() => {
        if (hizbId === null) {
            return [];
        }
        return athman.filter((t) => t.hizb_id === hizbId).sort((a, b) => a.number - b.number);
    }, [hizbId, athman]);

    const selectedThumn = availableThumns.find((t) => t.id === thomanId);

    const handleSave = () => {
        setSaving(true);
        setErrors({});
        router.post(
            route("sessions.recordAttendanceBulk", sessionId),
            {
                attendance: [
                    {
                        student_id: studentId,
                        status: initial.status,
                        hizb_id: hizbId,
                        thoman_id: thomanId,
                        memorization_rating: rating,
                        memorization_remark: remark.trim() === "" ? null : remark,
                    },
                ],
            },
            {
                preserveScroll: true,
                preserveState: true,
                onSuccess: () => {
                    setSaving(false);
                    onSaved();
                },
                onError: (errs) => {
                    setSaving(false);
                    setErrors(errs as Record<string, string>);
                },
                onFinish: () => setSaving(false),
            },
        );
    };

    return (
        <div className="space-y-4">
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div className="space-y-1">
                    <Label className="text-xs text-muted-foreground">الحزب</Label>
                    <Select
                        value={hizbId !== null ? String(hizbId) : ""}
                        onValueChange={(v) => {
                            setHizbId(v === "" ? null : Number(v));
                            setThomanId(null);
                        }}
                        dir="rtl"
                    >
                        <SelectTrigger className="h-9">
                            <SelectValue placeholder="إختر..." />
                        </SelectTrigger>
                        <SelectContent>
                            {ahzab.map((h) => (
                                <SelectItem key={h.id} value={String(h.id)}>
                                    <span className="flex flex-col items-start">
                                        <span>الحزب {h.number}</span>
                                        <span className="text-xs text-muted-foreground">{h.start}</span>
                                    </span>
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>
                <div className="space-y-1">
                    <Label className="text-xs text-muted-foreground">الثمن</Label>
                    <Select
                        value={thomanId !== null ? String(thomanId) : ""}
                        onValueChange={(v) => setThomanId(v === "" ? null : Number(v))}
                        disabled={hizbId === null}
                        dir="rtl"
                    >
                        <SelectTrigger className="h-9">
                            <SelectValue placeholder="إختر...">
                                {selectedThumn ? `الثمن ${selectedThumn.number}` : null}
                            </SelectValue>
                        </SelectTrigger>
                        <SelectContent>
                            {availableThumns.map((t) => (
                                <SelectItem key={t.id} value={String(t.id)}>
                                    <span className="flex flex-col items-start gap-1 py-1">
                                        <span className="text-sm font-medium">الثمن {t.number}</span>
                                        {t.start && (
                                            <span className="font-quran text-base leading-relaxed text-muted-foreground">
                                                {t.start}
                                            </span>
                                        )}
                                    </span>
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>
            </div>

            {selectedThumn?.start && (
                <div className="rounded-lg border border-emerald-100 bg-emerald-50/50 p-3">
                    <p className="mb-1 text-[10px] font-medium text-emerald-700">
                        بداية الثمن {selectedThumn.number}
                    </p>
                    <p dir="rtl" className="font-quran text-xl leading-loose text-foreground">
                        {selectedThumn.start}
                    </p>
                </div>
            )}

            <div className="space-y-1">
                <Label className="text-xs text-muted-foreground">التقييم</Label>
                <RatingControl value={rating} onChange={setRating} />
            </div>

            <div className="space-y-1">
                <Label className="text-xs text-muted-foreground">ملاحظات المعلم</Label>
                <Textarea
                    rows={3}
                    placeholder="ملاحظات حول حفظ الطالب لهذه الجلسة..."
                    value={remark}
                    onChange={(e) => setRemark(e.target.value)}
                />
            </div>

            {Object.values(errors).length > 0 && (
                <div className="rounded-md border border-red-200 bg-red-50 p-2 text-xs text-red-700">
                    {Object.values(errors).slice(0, 3).map((msg, i) => (
                        <p key={i}>{msg}</p>
                    ))}
                </div>
            )}

            <div className="flex items-center gap-2 border-t pt-4">
                <Button onClick={handleSave} disabled={saving} className="gap-2">
                    {saving && <Loader2 className="h-4 w-4 animate-spin" />}
                    حفظ التسجيل
                </Button>
                <Button variant="outline" onClick={onCancel} disabled={saving}>
                    إلغاء
                </Button>
            </div>
        </div>
    );
}
