import { Check, Minus, Plus, X } from "lucide-react";
import { Textarea } from "@/Components/ui/textarea";
import { Label } from "@/Components/ui/label";
import { cn } from "@/lib/utils";
import type { RepetitionThumnDraft, ThumnResult } from "./types";

interface Props {
    thumn: RepetitionThumnDraft;
    onChange: (next: RepetitionThumnDraft) => void;
}

function MistakesStepper({
    value,
    onChange,
    max = 999,
}: {
    value: number | null;
    onChange: (v: number | null) => void;
    max?: number;
}) {
    const current = value ?? 0;
    const dec = () => {
        const next = Math.max(0, current - 1);
        onChange(next === 0 && value === null ? null : next);
    };
    const inc = () => {
        onChange(Math.min(max, current + 1));
    };
    const handleType = (raw: string) => {
        const digits = raw.replace(/\D+/g, "");
        if (digits === "") {
            onChange(null);
            return;
        }
        onChange(Math.min(max, parseInt(digits, 10)));
    };

    return (
        <div className="flex h-8 w-full items-stretch overflow-hidden rounded-md border bg-background">
            <button
                type="button"
                aria-label="إنقاص"
                onClick={dec}
                className="flex w-9 shrink-0 items-center justify-center border-e text-muted-foreground transition-colors hover:bg-muted disabled:cursor-not-allowed disabled:opacity-40"
                disabled={current <= 0}
            >
                <Minus className="h-3.5 w-3.5" />
            </button>
            <input
                type="text"
                inputMode="numeric"
                pattern="[0-9]*"
                value={value ?? ""}
                placeholder="0"
                onChange={(e) => handleType(e.target.value)}
                className="min-w-0 flex-1 bg-transparent text-center text-sm tabular-nums outline-none"
            />
            <button
                type="button"
                aria-label="زيادة"
                onClick={inc}
                className="flex w-9 shrink-0 items-center justify-center border-s text-muted-foreground transition-colors hover:bg-muted disabled:cursor-not-allowed disabled:opacity-40"
                disabled={current >= max}
            >
                <Plus className="h-3.5 w-3.5" />
            </button>
        </div>
    );
}

function IconButton({
    active,
    onClick,
    icon,
    activeClass,
    label,
}: {
    active: boolean;
    onClick: () => void;
    icon: React.ReactNode;
    activeClass: string;
    label: string;
}) {
    return (
        <button
            type="button"
            aria-label={label}
            onClick={onClick}
            className={cn(
                "inline-flex h-7 w-9 items-center justify-center rounded-md border bg-background text-muted-foreground transition-colors",
                "hover:bg-muted",
                active && activeClass,
            )}
        >
            {icon}
        </button>
    );
}

export default function ThumnButton({ thumn, onChange }: Props) {
    const setResult = (next: ThumnResult) => {
        // Toggle off if already selected
        const result: ThumnResult = thumn.result === next ? "skip" : next;
        onChange({
            ...thumn,
            result,
            mistakes_count: result === "bad" ? thumn.mistakes_count : null,
            note: result === "bad" ? thumn.note : "",
        });
    };

    const isBad = thumn.result === "bad";

    return (
        <div
            className={cn(
                "rounded-lg border bg-background p-3 transition-colors",
                isBad && "border-red-200 bg-red-50/40",
                thumn.result === "good" && "border-emerald-200 bg-emerald-50/40",
                thumn.result === "skip" && "border-muted",
            )}
        >
            <div className="flex items-center justify-between gap-2">
                <span className="text-sm font-medium">الثمن {thumn.thoman_number}</span>
                <div className="flex items-center gap-1">
                    <IconButton
                        label="جيد"
                        active={thumn.result === "good"}
                        onClick={() => setResult("good")}
                        icon={<Check className="h-4 w-4" />}
                        activeClass="border-emerald-500 bg-emerald-100 text-emerald-700"
                    />
                    <IconButton
                        label="خطأ"
                        active={isBad}
                        onClick={() => setResult("bad")}
                        icon={<X className="h-4 w-4" />}
                        activeClass="border-red-500 bg-red-100 text-red-700"
                    />
                    <IconButton
                        label="تخطي"
                        active={thumn.result === "skip"}
                        onClick={() => setResult("skip")}
                        icon={<Minus className="h-4 w-4" />}
                        activeClass="border-sky-500 bg-sky-100 text-sky-700"
                    />
                </div>
            </div>

            {isBad && (
                <div className="mt-3 space-y-2 border-t pt-3">
                    <div className="space-y-1">
                        <Label className="text-xs text-muted-foreground">عدد الأخطاء</Label>
                        <MistakesStepper
                            value={thumn.mistakes_count}
                            onChange={(v) => onChange({ ...thumn, mistakes_count: v })}
                        />
                    </div>
                    <div className="space-y-1">
                        <Label className="text-xs text-muted-foreground">ملاحظة</Label>
                        <Textarea
                            rows={2}
                            placeholder="ملاحظات حول الثمن..."
                            value={thumn.note}
                            onChange={(e) => onChange({ ...thumn, note: e.target.value })}
                        />
                    </div>
                </div>
            )}
        </div>
    );
}
