import DashboardLayout from "@/Layouts/DashboardLayout";
import { PageProps } from "@/types";
import { Head, Link } from "@inertiajs/react";
import {
    Table,
    TableHeader,
    TableRow,
    TableHead,
    TableBody,
    TableCell,
} from "@/Components/ui/table";
import { Button } from "@/Components/ui/button";

export default function Programs({ auth, programs }: any) {
    const translatedLinks = programs.links.map((link, index) => {
        if (index === 0) {
            link.label = "&laquo;السابق";
        } else if (index === programs.links.length - 1) {
            link.label = "التالي&raquo;";
        }
        return link;
    });
    return (
        <DashboardLayout user={auth.user}>
            <Head title="Programs" />
            <div
                className="flex flex-col items-center justify-start h-full w-full rtl"
                dir="rtl"
            >
                {/* Header */}
                <div className="flex items-center w-full mb-4">
                    <h1 className="text-4xl font-bold text-gray-900">
                        البرامج
                    </h1>
                    <div className="flex-1" />
                    <Link
                        href={route("programs.create")}
                        className="text-primary-foreground font-bold text-center bg-primary p-4 rounded-xl select-none"
                    >
                        سجل برنامج جديد
                    </Link>
                </div>

                {/* Table */}
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead className="text-right">#</TableHead>
                            <TableHead className="text-right">
                                إسم البرنامح
                            </TableHead>
                            <TableHead className="text-right">المادة</TableHead>
                            <TableHead className="text-right">النادي</TableHead>
                            <TableHead className="text-right">الفئة</TableHead>

                            <TableHead className="text-right">
                                تاريخ البداية
                            </TableHead>

                            <TableHead className="text-right">
                                تاريخ النهاية
                            </TableHead>
                            <TableHead className="text-right">
                                إجراءات
                            </TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {programs.data.map((program: any) => (
                            <TableRow key={program.id}>
                                <TableCell className="text-right">
                                    {program.id}
                                </TableCell>
                                <TableCell className="text-right">
                                    {program.name}
                                </TableCell>
                                <TableCell className="text-right">
                                    {program.subject.name}
                                </TableCell>
                                <TableCell className="text-right">
                                    {program.club.name}
                                </TableCell>
                                <TableCell className="text-right">
                                    {program.category.name}
                                </TableCell>
                                <TableCell className="text-right">
                                    {program.start_date}
                                </TableCell>
                                <TableCell className="text-right">
                                    {program.end_date}
                                </TableCell>
                                <TableCell>
                                    <div className="flex gap-2 items-center">
                                        <Link
                                            href={`/programs/${program.id}/edit`}
                                            className="inline-flex items-center px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium shadow-sm transition-all duration-200"
                                        >
                                            تعديل
                                        </Link>

                                        <Link
                                            href={route(
                                                "programs.show",
                                                program.id
                                            )}
                                            className="inline-flex items-center px-3 py-1.5 rounded-lg bg-sky-600 hover:bg-sky-700 text-white text-sm font-medium shadow-sm transition-all duration-200"
                                        >
                                            تفاصيل
                                        </Link>

                                        <Button
                                            variant="destructive"
                                            size="sm"
                                            className="px-3 py-1.5 rounded-lg text-sm font-medium shadow-sm transition-all duration-200 hover:scale-[1.03]"
                                            onClick={() =>
                                                console.log(
                                                    "deleteProgram",
                                                    program.id
                                                )
                                            }
                                        >
                                            حذف
                                        </Button>
                                    </div>
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>

                {/* Pagination */}
                <div className="mt-4 mb-1 flex flex-row-reverse">
                    {translatedLinks.map((link) =>
                        link.url ? (
                            <Link
                                preserveState
                                key={link.label}
                                href={link.url}
                                dangerouslySetInnerHTML={{
                                    __html: link.label,
                                }}
                                className={`p-1.5 md:px-2.5 mx-1 rounded-lg select-none ${
                                    link.active
                                        ? "text-primary-foreground text-base font-bold bg-primary"
                                        : "text-neutral-600 hover:text-neutral-950 hover:ring-2 ring-primary"
                                } ${
                                    !isNaN(link.label) || link.label === "..."
                                        ? "lg:inline-block hidden"
                                        : ""
                                }`}
                            />
                        ) : (
                            <span
                                key={link.label}
                                dangerouslySetInnerHTML={{
                                    __html: link.label,
                                }}
                                className={`p-1.5 mx-1 rounded-lg select-none text-neutral-400 ${
                                    !isNaN(link.label) || link.label === "..."
                                        ? "lg:inline-block hidden"
                                        : ""
                                }`}
                            />
                        )
                    )}
                </div>
            </div>
        </DashboardLayout>
    );
}
