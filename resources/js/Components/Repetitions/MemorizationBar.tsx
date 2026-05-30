import { cn } from "@/lib/utils";

interface Props {
    /** Number of hizbs memorized (0-60). */
    memorized: number;
    /** Show "حفظ" label + percentages. */
    showLabels?: boolean;
    className?: string;
}

export default function MemorizationBar({ memorized, showLabels = true, className }: Props) {
    const safe = Math.min(60, Math.max(0, memorized));
    const percentage = Math.round((safe / 60) * 100);

    return (
        <div className={cn("space-y-0.5", className)}>
            {showLabels && (
                <div className="flex items-center justify-between text-[10px] text-muted-foreground">
                    <span className="font-medium text-emerald-600">حفظ</span>
                    <span className="tabular-nums">{percentage}%</span>
                </div>
            )}
            <div className="relative h-1.5 w-full overflow-hidden rounded-full bg-muted">
                <div
                    className="absolute inset-y-0 start-0 bg-emerald-500 transition-all"
                    style={{ width: `${percentage}%` }}
                />
            </div>
            {showLabels && (
                <div className="flex items-center justify-between text-[10px] text-muted-foreground">
                    <span>حزب</span>
                    <span className="tabular-nums">{safe}/60</span>
                </div>
            )}
        </div>
    );
}
