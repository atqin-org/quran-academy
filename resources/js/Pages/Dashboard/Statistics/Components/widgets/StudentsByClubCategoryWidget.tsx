import { Statistics } from "@/types";
import {
    ChartConfig,
    ChartContainer,
    ChartTooltip,
    ChartTooltipContent,
} from "@/Components/ui/chart";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Legend, ResponsiveContainer } from "recharts";
import { useMemo } from "react";

interface Props {
    statistics: Statistics;
}

const COLORS = ["#8b5cf6", "#f59e0b", "#22c55e", "#ef4444", "#3b82f6", "#ec4899", "#14b8a6", "#f97316"];

export default function StudentsByClubCategoryWidget({ statistics }: Props) {
    const { students } = statistics;
    const { data, categories, chartConfig } = useMemo(() => {
        // Get all unique categories
        const categorySet = new Set<string>();
        students.by_club_category.forEach((club) => {
            club.categories.forEach((cat) => categorySet.add(cat.category_name));
        });
        const categories = Array.from(categorySet);

        // Build chart config
        const chartConfig: ChartConfig = {};
        categories.forEach((cat, idx) => {
            chartConfig[cat] = {
                label: cat,
                color: COLORS[idx % COLORS.length],
            };
        });

        // Transform data for stacked bar chart
        const data = students.by_club_category.map((club) => {
            const row: Record<string, string | number> = { name: club.club_name };
            club.categories.forEach((cat) => {
                row[cat.category_name] = cat.count;
            });
            return row;
        });

        return { data, categories, chartConfig };
    }, [students.by_club_category]);

    if (data.length === 0) {
        return (
            <div className="flex items-center justify-center h-full text-muted-foreground">
                لا توجد بيانات
            </div>
        );
    }

    return (
        <ChartContainer config={chartConfig} className="h-full w-full aspect-auto">
            <BarChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="name" tick={{ fontSize: 10 }} angle={-45} textAnchor="end" height={60} />
                <YAxis tick={{ fontSize: 11 }} width={30} />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Legend
                    wrapperStyle={{ fontSize: 10 }}
                    formatter={(value) => <span className="text-xs">{value}</span>}
                />
                {categories.map((cat, idx) => (
                    <Bar
                        key={cat}
                        dataKey={cat}
                        stackId="a"
                        fill={COLORS[idx % COLORS.length]}
                        radius={idx === categories.length - 1 ? [4, 4, 0, 0] : [0, 0, 0, 0]}
                    />
                ))}
            </BarChart>
        </ChartContainer>
    );
}
