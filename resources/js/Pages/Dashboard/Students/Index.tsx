import { Head, Link } from "@inertiajs/react";
import { PageProps } from "@/types";
import DashboardLayout from "@/Layouts/DashboardLayout";
import { StudentDisplay, columns } from "./Columns";
import { DataTable } from "./DataTable";

interface DashboardProps extends PageProps {
    students: { data: StudentDisplay[]; links: any[] };
}
export default function Dashboard({ auth, students }: DashboardProps) {
    console.log(students);
        const translatedLinks = students.links.map((link, index) => {
        if (index === 0) {
            link.label = "&laquo;السابق";
        } else if (index === students.links.length - 1) {
            link.label = "التالي&raquo;";
        }
        return link;
    });
    return (
        <DashboardLayout user={auth.user}>
            <Head title="⚠️ Under Construction" />
            <div className="flex flex-col items-center justify-start h-full">
                <div className="flex items-center w-full">
                    <h1 className="text-4xl font-bold text-gray-900">الطالب</h1>
                    <div className="flex-1"></div>
                    <Link
                        className="text-primary-foreground font-bold text-center bg-primary p-4 rounded-xl select-none"
                        href="/dashboard/students/create"
                    >
                        سجل طالب جديد
                    </Link>
                </div>
                <DataTable columns={columns} data={students.data} />
                <div className="mt-2 flex">
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
                                        ? "md:inline-block hidden"
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
                                        ? "md:inline-block hidden"
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
