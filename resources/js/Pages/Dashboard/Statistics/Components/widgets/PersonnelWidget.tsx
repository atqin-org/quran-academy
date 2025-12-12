import { Statistics } from "@/types";
import { Users, UserCog, Shield, Briefcase, GraduationCap } from "lucide-react";

interface Props {
    statistics: Statistics;
}

const roleIcons: Record<string, React.ReactNode> = {
    admin: <Shield className="h-5 w-5 text-red-500" />,
    moderator: <UserCog className="h-5 w-5 text-orange-500" />,
    staff: <Briefcase className="h-5 w-5 text-blue-500" />,
    teacher: <GraduationCap className="h-5 w-5 text-green-500" />,
};

export default function PersonnelWidget({ statistics }: Props) {
    const { personnel } = statistics;

    return (
        <div className="flex flex-col h-full">
            <div className="flex items-center gap-2 text-muted-foreground mb-4">
                <Users className="h-5 w-5" />
                <span className="text-sm">إجمالي الموظفين: {personnel.total}</span>
            </div>

            <div className="grid grid-cols-2 gap-3 flex-1">
                {personnel.by_role.map((item) => (
                    <div
                        key={item.role}
                        className="flex items-center gap-3 p-3 rounded-lg bg-muted/50"
                    >
                        {roleIcons[item.role] || <Users className="h-5 w-5" />}
                        <div className="flex flex-col">
                            <span className="text-lg font-bold">{item.count}</span>
                            <span className="text-xs text-muted-foreground">
                                {item.label}
                            </span>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
