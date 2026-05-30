import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from "@/Components/ui/dialog";
import { ScrollArea } from "@/Components/ui/scroll-area";
import { Skeleton } from "@/Components/ui/skeleton";
import { usePage } from "@inertiajs/react";
import { Clock, History, User } from "lucide-react";
import { useEffect, useState } from "react";
import {
    STUDENT_EVENT_LABELS,
    STUDENT_FIELD_LABELS,
    STUDENT_MANUAL_PROP_LABELS,
    formatStudentFieldValue,
} from "./studentFieldLabels";

interface ActivityCauser {
    id: number;
    name: string;
    email: string;
}

interface ActivityEntry {
    id: number;
    type: string;
    event: string | null;
    subject_id: number | null;
    subject_type: string | null;
    description: string;
    causer: ActivityCauser | null;
    properties: Record<string, any> | null;
    created_at: string;
}

interface Props {
    studentId: string | number;
    open: boolean;
    onOpenChange: (open: boolean) => void;
}

function formatDateTime(iso: string): string {
    const date = new Date(iso);
    return date.toLocaleString("ar-DZ", {
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
    });
}

const diffEvents = new Set(["updated"]);

// Spatie LogsActivity stores the new values under `properties.attributes`
// (not `properties.new`) when `logOnlyDirty()` is set. PHP empty arrays
// serialize as `[]`, so coerce to a plain object before reading keys.
function normalizeMap(value: unknown): Record<string, any> {
    if (!value || Array.isArray(value)) {
        return {};
    }
    if (typeof value === "object") {
        return value as Record<string, any>;
    }
    return {};
}

function DiffTable({
    oldValues,
    newValues,
}: {
    oldValues: Record<string, any>;
    newValues: Record<string, any>;
}) {
    const keys = Array.from(
        new Set([...Object.keys(oldValues), ...Object.keys(newValues)])
    );

    if (keys.length === 0) {
        return (
            <p className="text-xs text-muted-foreground">
                لا توجد تغييرات مسجلة في هذا الحدث.
            </p>
        );
    }

    const hasOld = Object.keys(oldValues).length > 0;

    return (
        <div className="overflow-hidden rounded-md border">
            <table className="w-full text-xs">
                <thead className="bg-muted text-muted-foreground">
                    <tr>
                        <th className="px-3 py-2 text-start font-medium">
                            الحقل
                        </th>
                        {hasOld && (
                            <th className="px-3 py-2 text-start font-medium">
                                قبل
                            </th>
                        )}
                        <th className="px-3 py-2 text-start font-medium">
                            بعد
                        </th>
                    </tr>
                </thead>
                <tbody>
                    {keys.map((key) => {
                        const label = STUDENT_FIELD_LABELS[key] ?? key;
                        return (
                            <tr key={key} className="border-t">
                                <td className="px-3 py-2 font-medium">
                                    {label}
                                </td>
                                {hasOld && (
                                    <td className="px-3 py-2 text-muted-foreground">
                                        {formatStudentFieldValue(
                                            key,
                                            oldValues[key]
                                        )}
                                    </td>
                                )}
                                <td className="px-3 py-2 text-foreground">
                                    {formatStudentFieldValue(
                                        key,
                                        newValues[key]
                                    )}
                                </td>
                            </tr>
                        );
                    })}
                </tbody>
            </table>
        </div>
    );
}

function PropertyList({ properties }: { properties: Record<string, any> }) {
    const entries = Object.entries(properties).filter(
        ([key]) => !["old", "new", "attributes"].includes(key)
    );

    if (entries.length === 0) {
        return null;
    }

    return (
        <dl className="grid grid-cols-1 gap-1 text-xs sm:grid-cols-2">
            {entries.map(([key, value]) => (
                <div key={key} className="flex items-center gap-2">
                    <dt className="text-muted-foreground">
                        {STUDENT_MANUAL_PROP_LABELS[key] ?? key}:
                    </dt>
                    <dd className="font-medium">
                        {formatStudentFieldValue(key, value)}
                    </dd>
                </div>
            ))}
        </dl>
    );
}

function EntryCard({
    entry,
    currentUserId,
}: {
    entry: ActivityEntry;
    currentUserId: number | undefined;
}) {
    const isSelf =
        entry.causer && currentUserId && entry.causer.id === currentUserId;
    const causerName = entry.causer
        ? isSelf
            ? "أنت"
            : entry.causer.name
        : "النظام";

    const eventLabel = entry.event
        ? STUDENT_EVENT_LABELS[entry.event] ?? entry.event
        : entry.description;

    const oldValues = normalizeMap(entry.properties?.old);
    const newValues = normalizeMap(entry.properties?.attributes);
    const showDiff = entry.event ? diffEvents.has(entry.event) : false;

    return (
        <div className="space-y-2 rounded-md border bg-card p-3">
            <div className="flex flex-wrap items-center gap-2 text-sm">
                <History className="size-4 text-muted-foreground" />
                <span className="font-medium">{eventLabel}</span>
                <span className="rounded-full bg-muted px-2 py-0.5 text-[11px] text-muted-foreground">
                    {causerName}
                </span>
                <span className="ms-auto text-[11px] text-muted-foreground">
                    {formatDateTime(entry.created_at)}
                </span>
            </div>

            {entry.event !== "created" && entry.description && (
                <p className="text-xs text-muted-foreground">
                    {entry.description}
                </p>
            )}

            {showDiff && (
                <DiffTable oldValues={oldValues} newValues={newValues} />
            )}

            {entry.properties && !showDiff && (
                <PropertyList properties={entry.properties} />
            )}
        </div>
    );
}

export default function StudentLogModal({
    studentId,
    open,
    onOpenChange,
}: Props) {
    const { props } = usePage<any>();
    const currentUserId = props?.auth?.user?.id as number | undefined;
    const [logs, setLogs] = useState<ActivityEntry[] | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (!open) {
            return;
        }
        let cancelled = false;
        setLoading(true);
        setError(null);
        fetch(`/students/${studentId}/activity-log`, {
            headers: { Accept: "application/json" },
            credentials: "same-origin",
        })
            .then(async (res) => {
                if (!res.ok) {
                    throw new Error(`HTTP ${res.status}`);
                }
                const json = await res.json();
                if (!cancelled) {
                    setLogs(json.logs ?? []);
                }
            })
            .catch(() => {
                if (!cancelled) {
                    setError("تعذر تحميل السجل");
                }
            })
            .finally(() => {
                if (!cancelled) {
                    setLoading(false);
                }
            });
        return () => {
            cancelled = true;
        };
    }, [open, studentId]);

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent dir="rtl" className="max-w-2xl">
                <DialogHeader>
                    <DialogTitle>سجل التغييرات</DialogTitle>
                    <DialogDescription>
                        جميع الأحداث المسجلة على هذا الطالب مرتبة من الأحدث
                        للأقدم.
                    </DialogDescription>
                </DialogHeader>

                <ScrollArea className="max-h-[70vh] pe-2" dir="rtl">
                    {loading && (
                        <div className="space-y-2">
                            {[0, 1, 2].map((i) => (
                                <Skeleton key={i} className="h-20 w-full" />
                            ))}
                        </div>
                    )}

                    {!loading && error && (
                        <div className="py-8 text-center text-sm text-destructive">
                            {error}
                        </div>
                    )}

                    {!loading && !error && logs && logs.length === 0 && (
                        <div className="flex flex-col items-center justify-center py-10 text-muted-foreground">
                            <Clock className="mb-2 size-8" />
                            <p className="text-sm">لا توجد سجلات لهذا الطالب</p>
                        </div>
                    )}

                    {!loading && !error && logs && logs.length > 0 && (
                        <div className="space-y-3">
                            {logs.map((entry) => (
                                <EntryCard
                                    key={entry.id}
                                    entry={entry}
                                    currentUserId={currentUserId}
                                />
                            ))}
                        </div>
                    )}
                </ScrollArea>

                <div className="flex items-center gap-2 text-[11px] text-muted-foreground">
                    <User className="size-3" />
                    <span>السجل خاص بالطالب رقم {studentId}</span>
                </div>
            </DialogContent>
        </Dialog>
    );
}
