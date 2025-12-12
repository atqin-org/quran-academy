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
    total: {
        label: "الإيرادات",
        color: "#2563eb",
    },
};

export default function RevenueByClubWidget({ statistics }: Props) {
    const { financial } = statistics;
    const data = financial.by_club.map((item) => ({
        name: item.club_name,
        total: item.total,
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
            <BarChart data={data} layout="vertical" margin={{ top: 5, right: 10, left: 10, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                <XAxis type="number" tickFormatter={(v) => `${(v/1000).toFixed(0)}k`} fontSize={11} />
                <YAxis
                    dataKey="name"
                    type="category"
                    width={70}
                    tick={{ fontSize: 11 }}
                />
                <ChartTooltip
                    content={
                        <ChartTooltipContent
                            formatter={(value) =>
                                `${Number(value).toLocaleString("ar-DZ")} د.ج`
                            }
                        />
                    }
                />
                <Bar dataKey="total" fill="var(--color-total)" radius={[0, 4, 4, 0]} />
            </BarChart>
        </ChartContainer>
    );
}
