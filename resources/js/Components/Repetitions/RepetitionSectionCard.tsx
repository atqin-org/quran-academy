import { useMemo } from "react";
import { Trash2 } from "lucide-react";
import { Button } from "@/Components/ui/button";
import { Card } from "@/Components/ui/card";
import { Label } from "@/Components/ui/label";
import { Textarea } from "@/Components/ui/textarea";
import MemorizedHizbSelect from "./MemorizedHizbSelect";
import RatingControl from "./RatingControl";
import TesterSelect from "./TesterSelect";
import ThumnButton from "./ThumnButton";
import type {
    AttendeeOption,
    CurrentUserOption,
    HizbOption,
    Rating,
    RepetitionSectionDraft,
    RepetitionThumnDraft,
    ThomanOption,
} from "./types";

interface Props {
    index: number;
    section: RepetitionSectionDraft;
    onChange: (next: RepetitionSectionDraft) => void;
    onRemove: () => void;
    canRemove: boolean;
    ahzab: HizbOption[];
    athman: ThomanOption[];
    attendees: AttendeeOption[];
    currentUser: CurrentUserOption;
    excludeStudentId: number;
    lastHizbAscending: number | null;
    lastHizbDescending: number | null;
    errors?: Record<string, string>;
}

const ORDINAL_AR = [
    "الأول",
    "الثاني",
    "الثالث",
    "الرابع",
    "الخامس",
    "السادس",
    "السابع",
    "الثامن",
    "التاسع",
    "العاشر",
];

function buildThumns(athman: ThomanOption[], hizbId: number | null, existing: RepetitionThumnDraft[]): RepetitionThumnDraft[] {
    if (hizbId === null) {
        return [];
    }
    const byNumber = new Map(existing.map((t) => [t.thoman_number, t]));
    return athman
        .filter((t) => t.hizb_id === hizbId)
        .sort((a, b) => a.number - b.number)
        .map((t) => byNumber.get(t.number) ?? {
            thoman_id: t.id,
            thoman_number: t.number,
            result: "skip" as const,
            mistakes_count: null,
            note: "",
        });
}

export default function RepetitionSectionCard({
    index,
    section,
    onChange,
    onRemove,
    canRemove,
    ahzab,
    athman,
    attendees,
    currentUser,
    excludeStudentId,
    lastHizbAscending,
    lastHizbDescending,
    errors = {},
}: Props) {
    const setHizb = (hizbId: number | null) => {
        onChange({
            ...section,
            hizb_id: hizbId,
            thumns: buildThumns(athman, hizbId, []),
        });
    };

    const setThumn = (next: RepetitionThumnDraft) => {
        onChange({
            ...section,
            thumns: section.thumns.map((t) => (t.thoman_number === next.thoman_number ? next : t)),
        });
    };

    const startByNumber = useMemo(() => {
        const map = new Map<number, string>();
        if (section.hizb_id !== null) {
            for (const t of athman) {
                if (t.hizb_id === section.hizb_id) {
                    map.set(t.number, t.start);
                }
            }
        }
        return map;
    }, [athman, section.hizb_id]);

    const title = `المقطع ${ORDINAL_AR[index] ?? `رقم ${index + 1}`}`;

    return (
        <Card className="space-y-4 border-slate-200 bg-slate-50/70 p-4 shadow-md">
            <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold">{title}</h3>
                {canRemove && (
                    <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={onRemove}
                        className="h-7 gap-1 text-red-600 hover:bg-red-50 hover:text-red-700"
                    >
                        <Trash2 className="h-3.5 w-3.5" />
                        حذف
                    </Button>
                )}
            </div>

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div className="space-y-1">
                    <Label className="text-xs text-muted-foreground">الحزب</Label>
                    <MemorizedHizbSelect
                        value={section.hizb_id}
                        onChange={setHizb}
                        ahzab={ahzab}
                        lastHizbAscending={lastHizbAscending}
                        lastHizbDescending={lastHizbDescending}
                    />
                    {errors.hizb_id && <p className="text-xs text-red-600">{errors.hizb_id}</p>}
                </div>
                <div className="space-y-1">
                    <Label className="text-xs text-muted-foreground">المستظهر</Label>
                    <TesterSelect
                        value={{
                            tester_user_id: section.tester_user_id,
                            tester_student_id: section.tester_student_id,
                        }}
                        onChange={(next) => onChange({ ...section, ...next })}
                        currentUser={currentUser}
                        attendees={attendees}
                        excludeStudentId={excludeStudentId}
                    />
                    {(errors.tester_user_id || errors.tester_student_id) && (
                        <p className="text-xs text-red-600">
                            {errors.tester_user_id || errors.tester_student_id}
                        </p>
                    )}
                </div>
            </div>

            {section.hizb_id !== null && section.thumns.length > 0 && (
                <div className="grid grid-cols-1 items-start gap-2 sm:grid-cols-2">
                    <div className="flex flex-col gap-2">
                        {section.thumns.slice(0, 4).map((t) => (
                            <ThumnButton
                                key={t.thoman_number}
                                thumn={t}
                                onChange={setThumn}
                                start={startByNumber.get(t.thoman_number)}
                            />
                        ))}
                    </div>
                    <div className="flex flex-col gap-2">
                        {section.thumns.slice(4).map((t) => (
                            <ThumnButton
                                key={t.thoman_number}
                                thumn={t}
                                onChange={setThumn}
                                start={startByNumber.get(t.thoman_number)}
                            />
                        ))}
                    </div>
                </div>
            )}

            <div className="space-y-1">
                <Label className="text-xs text-muted-foreground">تقييم المقطع</Label>
                <RatingControl
                    value={section.overall_rating}
                    onChange={(v) => onChange({ ...section, overall_rating: v as Rating | null })}
                />
            </div>

            <div className="space-y-1">
                <Label className="text-xs text-muted-foreground">ملاحظات المعلم</Label>
                <Textarea
                    rows={2}
                    placeholder="ملاحظات حول هذا المقطع من التكرار..."
                    value={section.remark}
                    onChange={(e) => onChange({ ...section, remark: e.target.value })}
                />
            </div>
        </Card>
    );
}
