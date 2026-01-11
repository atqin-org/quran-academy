import { Statistics } from "@/types";
import {
    ChartConfig,
    ChartContainer,
    ChartTooltip,
    ChartTooltipContent,
} from "@/Components/ui/chart";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid } from "recharts";
import { BookOpen, TrendingUp } from "lucide-react";

interface Props {
    statistics: Statistics;
}

const chartConfig: ChartConfig = {
    count: {
        label: "عدد الطلاب",
        color: "#10b981",
    },
};

export default function ProgressOverviewWidget({ statistics }: Props) {
    const { progress } = statistics;

    return (
        <div className="flex flex-col h-full">
            <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-1 text-green-600">
                    <TrendingUp className="h-4 w-4" />
                    <span className="text-lg font-bold">
                        {progress.average_percentage}%
                    </span>
                </div>
                <span className="text-xs text-muted-foreground">
                    {progress.total_students} طالب
                </span>
            </div>

            <div className="flex-1 min-h-0">
                <ChartContainer config={chartConfig} className="h-full w-full aspect-auto">
                    <BarChart data={progress.distribution} margin={{ top: 5, right: 5, left: 0, bottom: 5 }}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} />
                        <XAxis
                            dataKey="range"
                            tick={{ fontSize: 10 }}
                        />
                        <YAxis tick={{ fontSize: 10 }} width={25} />
                        <ChartTooltip content={<ChartTooltipContent />} />
                        <Bar
                            dataKey="count"
                            fill="var(--color-count)"
                            radius={[4, 4, 0, 0]}
                        />
                    </BarChart>
                </ChartContainer>
            </div>
        </div>
    );
}
