import { Statistics } from "@/types";
import { Progress } from "@/Components/ui/progress";
import { Users, UserCheck, UserX, UserMinus } from "lucide-react";

interface Props {
    statistics: Statistics;
}

export default function AttendanceRateWidget({ statistics }: Props) {
    const { attendance } = statistics;

    const getProgressColor = (rate: number) => {
        if (rate >= 80) return "bg-green-500";
        if (rate >= 60) return "bg-yellow-500";
        return "bg-red-500";
    };

    return (
        <div className="flex flex-col justify-center h-full space-y-4">
            <div className="text-center">
                <div className="text-4xl font-bold text-primary">
                    {attendance.rate}%
                </div>
                <div className="text-sm text-muted-foreground">نسبة الحضور</div>
            </div>

            <Progress
                value={attendance.rate}
                className="h-3"
            />

            <div className="grid grid-cols-3 gap-2 text-center text-xs">
                <div className="flex flex-col items-center gap-1">
                    <UserCheck className="h-4 w-4 text-green-500" />
                    <span className="font-semibold">{attendance.present}</span>
                    <span className="text-muted-foreground">حاضر</span>
                </div>
                <div className="flex flex-col items-center gap-1">
                    <UserX className="h-4 w-4 text-red-500" />
                    <span className="font-semibold">{attendance.absent}</span>
                    <span className="text-muted-foreground">غائب</span>
                </div>
                <div className="flex flex-col items-center gap-1">
                    <UserMinus className="h-4 w-4 text-yellow-500" />
                    <span className="font-semibold">{attendance.excused}</span>
                    <span className="text-muted-foreground">معذور</span>
                </div>
            </div>

            <div className="text-center text-xs text-muted-foreground">
                إجمالي التسجيلات: {attendance.total}
            </div>
        </div>
    );
}
