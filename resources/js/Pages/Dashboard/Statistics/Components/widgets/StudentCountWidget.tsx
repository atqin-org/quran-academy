import { Statistics } from "@/types";
import { GraduationCap, UserPlus } from "lucide-react";

interface Props {
    statistics: Statistics;
}

export default function StudentCountWidget({ statistics }: Props) {
    const { students } = statistics;

    return (
        <div className="flex flex-col justify-center h-full">
            <div className="flex items-center gap-2 text-muted-foreground mb-2">
                <GraduationCap className="h-5 w-5" />
                <span className="text-sm">إجمالي الطلاب</span>
            </div>
            <div className="text-3xl font-bold text-primary">{students.total}</div>

            <div className="flex gap-4 mt-4">
                {students.by_gender.map((item) => (
                    <div
                        key={item.gender}
                        className="flex items-center gap-2 text-sm"
                    >
                        <span
                            className={`w-3 h-3 rounded-full ${
                                item.gender === "male" ? "bg-blue-500" : "bg-pink-500"
                            }`}
                        />
                        <span className="text-muted-foreground">{item.label}:</span>
                        <span className="font-semibold">{item.count}</span>
                    </div>
                ))}
            </div>

            {students.new_registrations > 0 && (
                <div className="flex items-center gap-2 mt-3 text-sm text-green-600">
                    <UserPlus className="h-4 w-4" />
                    <span>تسجيلات جديدة: {students.new_registrations}</span>
                </div>
            )}
        </div>
    );
}
