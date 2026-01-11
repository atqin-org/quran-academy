import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/Components/ui/table";
import { CategoryBreakdown, Statistics } from "@/types";

interface Props {
    statistics: Statistics;
}

export function exportCategoryBreakdownToCSV(
    category_breakdown: CategoryBreakdown
) {
    const headers = [
        "الفئة",
        "مأمن",
        "مسدد الاشتراك",
        "معفى",
        "متأخر في الدفع",
        "المجموع",
    ];

    const rows = category_breakdown.rows.map((row) => [
        row.category_name,
        row.has_insurance,
        row.monthly_paid,
        row.exempt,
        row.late_payment,
        row.total,
    ]);

    // Add totals row
    rows.push([
        category_breakdown.totals.category_name,
        category_breakdown.totals.has_insurance,
        category_breakdown.totals.monthly_paid,
        category_breakdown.totals.exempt,
        category_breakdown.totals.late_payment,
        category_breakdown.totals.total,
    ]);

    const csvContent = [
        headers.join(","),
        ...rows.map((row) => row.join(",")),
    ].join("\n");

    // Add BOM for proper Arabic encoding in Excel
    const BOM = "\uFEFF";
    const blob = new Blob([BOM + csvContent], {
        type: "text/csv;charset=utf-8;",
    });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute(
        "download",
        `تقرير_الطلاب_حسب_الفئة_${new Date().toISOString().split("T")[0]}.csv`
    );
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}

export default function CategoryBreakdownWidget({ statistics }: Props) {
    const { category_breakdown } = statistics.students;

    if (category_breakdown.rows.length === 0) {
        return (
            <div className="flex items-center justify-center h-full text-muted-foreground">
                لا توجد بيانات
            </div>
        );
    }

    return (
        <div className="flex flex-col h-full">
            <div className="flex-1 overflow-auto">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead className="text-right sticky top-0 bg-background">
                                الفئة
                            </TableHead>
                            <TableHead className="text-center sticky top-0 bg-background">
                                مأمن
                            </TableHead>
                            <TableHead className="text-center sticky top-0 bg-background">
                                مسدد
                            </TableHead>
                            <TableHead className="text-center sticky top-0 bg-background">
                                معفى
                            </TableHead>
                            <TableHead className="text-center sticky top-0 bg-background">
                                متأخر
                            </TableHead>
                            <TableHead className="text-center sticky top-0 bg-background">
                                المجموع
                            </TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {category_breakdown.rows.map((row) => (
                            <TableRow key={row.category_id}>
                                <TableCell className="font-medium text-right">
                                    {row.category_name}
                                </TableCell>
                                <TableCell className="text-center">
                                    {row.has_insurance}
                                </TableCell>
                                <TableCell className="text-center text-green-600">
                                    {row.monthly_paid}
                                </TableCell>
                                <TableCell className="text-center text-blue-600">
                                    {row.exempt}
                                </TableCell>
                                <TableCell className="text-center text-red-600">
                                    {row.late_payment}
                                </TableCell>
                                <TableCell className="text-center font-semibold">
                                    {row.total}
                                </TableCell>
                            </TableRow>
                        ))}
                        <TableRow className="bg-muted/50 font-bold">
                            <TableCell className="text-right">
                                {category_breakdown.totals.category_name}
                            </TableCell>
                            <TableCell className="text-center">
                                {category_breakdown.totals.has_insurance}
                            </TableCell>
                            <TableCell className="text-center text-green-600">
                                {category_breakdown.totals.monthly_paid}
                            </TableCell>
                            <TableCell className="text-center text-blue-600">
                                {category_breakdown.totals.exempt}
                            </TableCell>
                            <TableCell className="text-center text-red-600">
                                {category_breakdown.totals.late_payment}
                            </TableCell>
                            <TableCell className="text-center">
                                {category_breakdown.totals.total}
                            </TableCell>
                        </TableRow>
                    </TableBody>
                </Table>
            </div>
        </div>
    );
}
