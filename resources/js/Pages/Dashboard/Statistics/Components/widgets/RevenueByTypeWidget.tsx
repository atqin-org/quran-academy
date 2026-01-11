import { Statistics } from "@/types";
import {
    ChartConfig,
    ChartContainer,
    ChartTooltip,
    ChartTooltipContent,
    ChartLegend,
    ChartLegendContent,
} from "@/Components/ui/chart";
import { PieChart, Pie, Cell } from "recharts";

interface Props {
    statistics: Statistics;
}

const COLORS = ["#16a34a", "#2563eb", "#f59e0b", "#ef4444"];

const chartConfig: ChartConfig = {
    sub: {
        label: "اشتراك",
        color: COLORS[0],
    },
    ins: {
        label: "تأمين",
        color: COLORS[1],
    },
};

export default function RevenueByTypeWidget({ statistics }: Props) {
    const { financial } = statistics;
    const data = financial.by_type.map((item, index) => ({
        name: item.label,
        value: item.total,
        fill: COLORS[index % COLORS.length],
    }));

    if (data.length === 0) {
        return (
            <div className="flex items-center justify-center h-full text-muted-foreground">
                لا توجد بيانات
            </div>
        );
    }

    const total = data.reduce((sum, item) => sum + item.value, 0);

    return (
        <div className="flex flex-col h-full">
            <ChartContainer config={chartConfig} className="flex-1 min-h-0 aspect-auto">
                <PieChart>
                    <Pie
                        data={data}
                        cx="50%"
                        cy="50%"
                        innerRadius={45}
                        outerRadius={75}
                        paddingAngle={3}
                        dataKey="value"
                    >
                        {data.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.fill} />
                        ))}
                    </Pie>
                    <ChartTooltip
                        content={
                            <ChartTooltipContent
                                formatter={(value) =>
                                    `${Number(value).toLocaleString("ar-DZ")} د.ج`
                                }
                            />
                        }
                    />
                </PieChart>
            </ChartContainer>
            <div className="flex justify-center gap-4 mt-2">
                {data.map((item, index) => (
                    <div key={index} className="flex items-center gap-1.5 text-xs">
                        <span
                            className="w-2.5 h-2.5 rounded-full"
                            style={{ backgroundColor: item.fill }}
                        />
                        <span>{item.name}</span>
                        <span className="text-muted-foreground">
                            ({((item.value / total) * 100).toFixed(0)}%)
                        </span>
                    </div>
                ))}
            </div>
        </div>
    );
}
