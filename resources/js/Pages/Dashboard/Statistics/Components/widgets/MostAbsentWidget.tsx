import { Statistics } from "@/types";
import { Link } from "@inertiajs/react";
import { UserX } from "lucide-react";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/Components/ui/table";
import { Badge } from "@/Components/ui/badge";

interface Props {
    statistics: Statistics;
}

export default function MostAbsentWidget({ statistics }: Props) {
    const { attendance } = statistics;

    if (attendance.most_absent.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center h-full text-muted-foreground gap-2">
                <UserX className="h-8 w-8 text-green-500" />
                <span>لا توجد غيابات</span>
            </div>
        );
    }

    return (
        <div className="h-full overflow-auto">
            <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead className="w-10">#</TableHead>
                        <TableHead>الطالب</TableHead>
                        <TableHead className="text-left w-24">الغيابات</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {attendance.most_absent.map((student, index) => (
                        <TableRow key={student.id}>
                            <TableCell className="text-center text-muted-foreground">
                                {index + 1}
                            </TableCell>
                            <TableCell>
                                <Link
                                    href={`/students/${student.id}`}
                                    className="hover:underline text-primary"
                                >
                                    {student.name}
                                </Link>
                            </TableCell>
                            <TableCell className="text-left">
                                <Badge
                                    variant={
                                        student.absent_count > 5
                                            ? "destructive"
                                            : "secondary"
                                    }
                                >
                                    {student.absent_count}
                                </Badge>
                            </TableCell>
                        </TableRow>
                    ))}
                </TableBody>
            </Table>
        </div>
    );
}
