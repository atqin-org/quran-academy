import { useState } from "react";
import { router } from "@inertiajs/react";
import { Loader2, Plus } from "lucide-react";
import { Button } from "@/Components/ui/button";
import RepetitionSectionCard from "./RepetitionSectionCard";
import type {
    AttendeeOption,
    CurrentUserOption,
    HizbOption,
    IncomingRepetitionSection,
    RepetitionPayloadSection,
    RepetitionSectionDraft,
    ThomanOption,
} from "./types";

interface Props {
    sessionId: number;
    studentId: number;
    initialSections: IncomingRepetitionSection[];
    ahzab: HizbOption[];
    athman: ThomanOption[];
    attendees: AttendeeOption[];
    currentUser: CurrentUserOption;
    lastHizbAscending: number | null;
    lastHizbDescending: number | null;
    onSaved: () => void;
    onCancel: () => void;
}

function emptySection(): RepetitionSectionDraft {
    return {
        localId: typeof crypto !== "undefined" && "randomUUID" in crypto
            ? crypto.randomUUID()
            : Math.random().toString(36).slice(2),
        hizb_id: null,
        tester_user_id: null,
        tester_student_id: null,
        overall_rating: null,
        remark: "",
        thumns: [],
    };
}

function hydrate(incoming: IncomingRepetitionSection[], athman: ThomanOption[]): RepetitionSectionDraft[] {
    if (incoming.length === 0) {
        return [emptySection()];
    }
    return incoming.map((s) => {
        const sectionThumns = athman
            .filter((t) => t.hizb_id === s.hizb_id)
            .sort((a, b) => a.number - b.number);
        const byThomanId = new Map(s.thumns.map((t) => [t.thoman_id, t]));
        return {
            localId: `incoming-${s.id}`,
            hizb_id: s.hizb_id,
            tester_user_id: s.tester_user_id,
            tester_student_id: s.tester_student_id,
            overall_rating: s.overall_rating,
            remark: s.remark ?? "",
            thumns: sectionThumns.map((t) => {
                const existing = byThomanId.get(t.id);
                return {
                    thoman_id: t.id,
                    thoman_number: t.number,
                    result: existing?.result ?? "skip",
                    mistakes_count: existing?.mistakes_count ?? null,
                    note: existing?.note ?? "",
                };
            }),
        };
    });
}

function toPayload(section: RepetitionSectionDraft): RepetitionPayloadSection | null {
    if (section.hizb_id === null) {
        return null;
    }
    return {
        hizb_id: section.hizb_id,
        tester_user_id: section.tester_user_id,
        tester_student_id: section.tester_student_id,
        overall_rating: section.overall_rating,
        remark: section.remark.trim() === "" ? null : section.remark,
        thumns: section.thumns
            .filter((t) => t.result === "good" || t.result === "bad")
            .map((t) => ({
                thoman_id: t.thoman_id,
                result: t.result as "good" | "bad",
                mistakes_count: t.result === "bad" ? t.mistakes_count : null,
                note: t.result === "bad" && t.note.trim() !== "" ? t.note : null,
            })),
    };
}

export default function RepetitionsForm({
    sessionId,
    studentId,
    initialSections,
    ahzab,
    athman,
    attendees,
    currentUser,
    lastHizbAscending,
    lastHizbDescending,
    onSaved,
    onCancel,
}: Props) {
    const [sections, setSections] = useState<RepetitionSectionDraft[]>(() =>
        hydrate(initialSections, athman),
    );
    const [saving, setSaving] = useState(false);
    const [errors, setErrors] = useState<Record<string, string>>({});

    const updateSection = (localId: string, next: RepetitionSectionDraft) => {
        setSections((prev) => prev.map((s) => (s.localId === localId ? next : s)));
    };

    const removeSection = (localId: string) => {
        setSections((prev) => prev.filter((s) => s.localId !== localId));
    };

    const addSection = () => {
        setSections((prev) => [...prev, emptySection()]);
    };

    const handleSave = () => {
        const payload = sections
            .map(toPayload)
            .filter((s): s is RepetitionPayloadSection => s !== null);

        setSaving(true);
        setErrors({});

        router.post(
            route("sessions.recordRepetitionsBulk", sessionId),
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            { student_id: studentId, sections: payload as any },
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

    const errorFor = (sectionIndex: number, field: string): string | undefined => {
        return errors[`sections.${sectionIndex}.${field}`];
    };

    return (
        <div className="space-y-4">
            <div className="space-y-3">
                {sections.map((section, idx) => (
                    <RepetitionSectionCard
                        key={section.localId}
                        index={idx}
                        section={section}
                        onChange={(next) => updateSection(section.localId, next)}
                        onRemove={() => removeSection(section.localId)}
                        canRemove={sections.length > 1}
                        ahzab={ahzab}
                        athman={athman}
                        attendees={attendees}
                        currentUser={currentUser}
                        excludeStudentId={studentId}
                        lastHizbAscending={lastHizbAscending}
                        lastHizbDescending={lastHizbDescending}
                        errors={{
                            hizb_id: errorFor(idx, "hizb_id") ?? "",
                            tester_user_id: errorFor(idx, "tester_user_id") ?? "",
                            tester_student_id: errorFor(idx, "tester_student_id") ?? "",
                        }}
                    />
                ))}
            </div>

            <Button
                type="button"
                variant="outline"
                onClick={addSection}
                className="w-full gap-2 border-dashed"
            >
                <Plus className="h-4 w-4" />
                إضافة مقطع آخر للتكرار
            </Button>

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
                    حفظ جميع التسجيلات
                </Button>
                <Button variant="outline" onClick={onCancel} disabled={saving}>
                    إلغاء
                </Button>
            </div>
        </div>
    );
}
