import { Button } from "@/Components/ui/button";
import { cn } from "@/lib/utils";
import type { Rating } from "./types";

interface Props {
    value: Rating | null;
    onChange: (value: Rating | null) => void;
    disabled?: boolean;
}

const OPTIONS: Array<{ value: Rating; label: string; activeClass: string }> = [
    { value: "great", label: "جيد جدا", activeClass: "bg-green-600 text-white hover:bg-green-600" },
    { value: "good", label: "جيد", activeClass: "bg-emerald-500 text-white hover:bg-emerald-500" },
    { value: "mid", label: "متوسط", activeClass: "bg-amber-500 text-white hover:bg-amber-500" },
    { value: "bad", label: "ضعيف", activeClass: "bg-red-500 text-white hover:bg-red-500" },
    { value: "not_memorized", label: "لم يحفظ", activeClass: "bg-slate-600 text-white hover:bg-slate-600" },
];

export default function RatingControl({ value, onChange, disabled }: Props) {
    return (
        <div className="flex w-fit items-center gap-1 rounded-md border bg-muted/40 p-1">
            {OPTIONS.map((opt) => {
                const active = value === opt.value;
                return (
                    <Button
                        key={opt.value}
                        type="button"
                        size="sm"
                        variant="ghost"
                        disabled={disabled}
                        onClick={() => onChange(active ? null : opt.value)}
                        className={cn(
                            "h-7 px-3 text-xs font-medium transition-colors",
                            active && opt.activeClass,
                        )}
                    >
                        {opt.label}
                    </Button>
                );
            })}
        </div>
    );
}
