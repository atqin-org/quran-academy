import { Statistics } from "@/types";
import {
    ChartConfig,
    ChartContainer,
    ChartTooltip,
    ChartTooltipContent,
} from "@/Components/ui/chart";
import { PieChart, Pie, Cell } from "recharts";

interface Props {
    statistics: Statistics;
}

const COLORS = {
    present: "#22c55e",
    absent: "#ef4444",
    excused: "#f59e0b",
};

const chartConfig: ChartConfig = {
    present: {
        label: "حاضر",
        color: COLORS.present,
    },
    absent: {
        label: "غائب",
        color: COLORS.absent,
    },
    excused: {
        label: "معذور",
        color: COLORS.excused,
    },
};

export default function AttendanceChartWidget({ statistics }: Props) {
    const { attendance } = statistics;
    const data = attendance.by_status.map((item) => ({
        name: item.label,
        value: item.count,
        fill: COLORS[item.status as keyof typeof COLORS] || "#94a3b8",
    }));

    if (attendance.total === 0) {
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
                    <ChartTooltip content={<ChartTooltipContent />} />
                </PieChart>
            </ChartContainer>
            <div className="flex justify-center gap-3 mt-2 flex-wrap">
                {data.map((item, index) => (
                    <div key={index} className="flex items-center gap-1.5 text-xs">
                        <span
                            className="w-2.5 h-2.5 rounded-full"
                            style={{ backgroundColor: item.fill }}
                        />
                        <span>{item.name}</span>
                        <span className="text-muted-foreground">
                            ({total > 0 ? ((item.value / total) * 100).toFixed(0) : 0}%)
                        </span>
                    </div>
                ))}
            </div>
        </div>
    );
}
