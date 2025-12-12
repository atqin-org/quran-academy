import { Statistics } from "@/types";
import { Link } from "@inertiajs/react";
import { Trophy, Medal } from "lucide-react";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/Components/ui/table";
import { Progress } from "@/Components/ui/progress";

interface Props {
    statistics: Statistics;
}

export default function TopPerformersWidget({ statistics }: Props) {
    const { progress } = statistics;

    if (progress.top_performers.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center h-full text-muted-foreground gap-2">
                <Trophy className="h-8 w-8" />
                <span>لا توجد بيانات</span>
            </div>
        );
    }

    const getMedalIcon = (index: number) => {
        if (index === 0)
            return <Medal className="h-5 w-5 text-yellow-500" />;
        if (index === 1)
            return <Medal className="h-5 w-5 text-gray-400" />;
        if (index === 2)
            return <Medal className="h-5 w-5 text-amber-600" />;
        return <span className="w-5 text-center text-xs text-muted-foreground">{index + 1}</span>;
    };

    return (
        <div className="h-full overflow-auto">
            <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead className="w-10">#</TableHead>
                        <TableHead>الطالب</TableHead>
                        <TableHead className="w-24">الأحزاب</TableHead>
                        <TableHead className="w-32">التقدم</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {progress.top_performers.map((student, index) => (
                        <TableRow key={student.id}>
                            <TableCell className="text-center">
                                {getMedalIcon(index)}
                            </TableCell>
                            <TableCell>
                                <Link
                                    href={`/students/${student.id}`}
                                    className="hover:underline text-primary"
                                >
                                    {student.name}
                                </Link>
                            </TableCell>
                            <TableCell className="text-center">
                                {student.total_hizbs}/60
                            </TableCell>
                            <TableCell>
                                <div className="flex items-center gap-2">
                                    <Progress
                                        value={student.percentage}
                                        className="h-2 flex-1"
                                    />
                                    <span className="text-xs font-medium w-10">
                                        {student.percentage}%
                                    </span>
                                </div>
                            </TableCell>
                        </TableRow>
                    ))}
                </TableBody>
            </Table>
        </div>
    );
}
