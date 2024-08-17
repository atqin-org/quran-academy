import { Head, Link } from "@inertiajs/react";
import { PageProps } from "@/types";
import DashboardLayout from "@/Layouts/DashboardLayout";
interface DashboardProps extends PageProps {
    students: any[];
}
export default function Dashboard({ auth, students }: DashboardProps) {
    return (
        <DashboardLayout user={auth.user}>
            <Head title="⚠️ Under Construction" />
            <div className="flex flex-col items-center justify-center  h-full">
                <Link
                    className="text-xl text-primary-foreground font-bold text-center bg-primary p-4 rounded-xl select-none"
                    href="/dashboard/student/create"
                >
                    سجل طالب جديد
                </Link>
                <div className="mt-4">
                    <h1 className="text-2xl font-bold text-center">الطلاب</h1>
                    <div className="grid grid-cols-1 gap-4 mt-4">
                        {students.map((student) => (
                            <Link
                                key={student.id}
                                href={`/dashboard/student/${student.id}`}
                                className="bg-primary-foreground text-black p-4 rounded-lg"
                            >
                                {student.first_name} {student.last_name}
                            </Link>
                        ))}
                    </div>
                </div>
            </div>
        </DashboardLayout>
    );
}
