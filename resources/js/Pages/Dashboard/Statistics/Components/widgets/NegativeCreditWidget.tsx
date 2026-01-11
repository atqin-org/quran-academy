import { Statistics } from "@/types";
import { Link } from "@inertiajs/react";
import { AlertTriangle } from "lucide-react";
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

export default function NegativeCreditWidget({ statistics }: Props) {
    const { students } = statistics;

    if (students.negative_credit.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center h-full text-muted-foreground gap-2">
                <AlertTriangle className="h-8 w-8 text-green-500" />
                <span>لا يوجد طلاب برصيد سالب</span>
            </div>
        );
    }

    return (
        <div className="h-full overflow-auto">
            <div className="flex items-center gap-2 mb-3">
                <AlertTriangle className="h-4 w-4 text-red-500" />
                <span className="text-sm text-muted-foreground">
                    {students.negative_credit_count} طالب برصيد سالب
                </span>
            </div>
            <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead>الطالب</TableHead>
                        <TableHead className="text-left">الرصيد</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {students.negative_credit.map((student) => (
                        <TableRow key={student.id}>
                            <TableCell>
                                <Link
                                    href={`/students/${student.id}`}
                                    className="hover:underline text-primary"
                                >
                                    {student.name}
                                </Link>
                            </TableCell>
                            <TableCell className="text-left">
                                <Badge variant="destructive">
                                    {student.credit}
                                </Badge>
                            </TableCell>
                        </TableRow>
                    ))}
                </TableBody>
            </Table>
        </div>
    );
}
