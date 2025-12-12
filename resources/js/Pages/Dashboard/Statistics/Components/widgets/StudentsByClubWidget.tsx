import { Statistics } from "@/types";
import {
    ChartConfig,
    ChartContainer,
    ChartTooltip,
    ChartTooltipContent,
} from "@/Components/ui/chart";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid } from "recharts";

interface Props {
    statistics: Statistics;
}

const chartConfig: ChartConfig = {
    count: {
        label: "عدد الطلاب",
        color: "#8b5cf6",
    },
};

export default function StudentsByClubWidget({ statistics }: Props) {
    const { students } = statistics;
    const data = students.by_club.map((item) => ({
        name: item.club_name,
        count: item.count,
    }));

    if (data.length === 0) {
        return (
            <div className="flex items-center justify-center h-full text-muted-foreground">
                لا توجد بيانات
            </div>
        );
    }

    return (
        <ChartContainer config={chartConfig} className="h-full w-full aspect-auto">
            <BarChart data={data} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="name" tick={{ fontSize: 10 }} angle={-45} textAnchor="end" height={60} />
                <YAxis tick={{ fontSize: 11 }} width={30} />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Bar dataKey="count" fill="var(--color-count)" radius={[4, 4, 0, 0]} />
            </BarChart>
        </ChartContainer>
    );
}
