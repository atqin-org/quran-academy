import { cn } from "@/lib/utils";
import type { Rating } from "./types";

interface TestedHizb {
    hizb_number: number;
    rating: Rating | null;
}

interface Props {
    /** Cumulative tested hizbs (latest rating per hizb). */
    testedHizbs: TestedHizb[];
    showLabels?: boolean;
    className?: string;
}

const SEGMENT_COUNT = 60;

function colorForRating(rating: Rating | null | undefined): string {
    switch (rating) {
        case "great":
            return "bg-green-600";
        case "good":
            return "bg-emerald-500";
        case "mid":
            return "bg-amber-500";
        case "bad":
            return "bg-red-500";
        case "not_memorized":
            return "bg-slate-600";
        default:
            // Tested but no rating recorded yet — neutral amber-tinted slot
            return "bg-amber-300";
    }
}

export default function RepetitionsBar({ testedHizbs, showLabels = true, className }: Props) {
    const byHizb = new Map<number, Rating | null>();
    testedHizbs.forEach((t) => {
        if (t.hizb_number >= 1 && t.hizb_number <= SEGMENT_COUNT) {
            byHizb.set(t.hizb_number, t.rating);
        }
    });

    const testedCount = byHizb.size;
    const percentage = Math.round((testedCount / SEGMENT_COUNT) * 100);

    // RTL: hizb 1 should sit at the start (right). With dir="rtl" + flex-row,
    // the first child renders on the right, which matches our intent.
    const segments = Array.from({ length: SEGMENT_COUNT }, (_, i) => i + 1);

    return (
        <div className={cn("space-y-0.5", className)} dir="rtl">
            {showLabels && (
                <div className="flex items-center justify-between text-[10px] text-muted-foreground">
                    <span className="font-medium text-amber-600">تكرار</span>
                    <span className="tabular-nums">{percentage}%</span>
                </div>
            )}
            <div className="relative flex h-1.5 w-full overflow-hidden rounded-full bg-muted">
                {segments.map((n) => {
                    const has = byHizb.has(n);
                    return (
                        <div
                            key={n}
                            className={cn("flex-1", has ? colorForRating(byHizb.get(n)) : "bg-transparent")}
                            title={`الحزب ${n}`}
                        />
                    );
                })}
                {/* Center marker at hizb 30/60 boundary */}
                <div className="pointer-events-none absolute inset-y-0 start-[50%] w-px -translate-x-1/2 bg-background/80" />
            </div>
            {showLabels && (
                <div className="flex items-center justify-between text-[10px] text-muted-foreground">
                    <span>حزب</span>
                    <span className="tabular-nums">{testedCount}/60</span>
                </div>
            )}
        </div>
    );
}
