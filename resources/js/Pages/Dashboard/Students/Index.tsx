import { Head, Link } from "@inertiajs/react";
import { PageProps } from "@/types";
import DashboardLayout from "@/Layouts/DashboardLayout";
import { StudentDisplay, columns } from "./Columns";
import { DataTable } from "./DataTable";

const data: StudentDisplay[] = [
    {
        id: "1",
        name: "احمد علي",
        age: 12,
        club: "مالك ابن أنس",
        ahzab: 1,
        category: "التلقين",
        gender: "male",
        birthdate: new Date(),
        subscription: 2000,
        insurance_expire_at: null,
        subscription_expire_at:  new Date(),
    },
    {
        id: "2",
        name: "طارق حمومي",
        age: 19,
        club: "مالك ابن أنس",
        ahzab: 30,
        category: "التلقين",
        gender: "female",
        birthdate: new Date(),
        subscription: 2000,
        insurance_expire_at: new Date(),
        subscription_expire_at:null,
    },
    {
        id: "3",
        name: "عمر عباس",
        age: 24,
        club: "مالك ابن أنس",
        ahzab: 18,
        category: "التلقين",
        gender: "male",
        birthdate: new Date(),
        subscription: 2000,
        insurance_expire_at: new Date("2023-12-12"),
        subscription_expire_at: new Date("2024-12-25"),
    },
];
interface DashboardProps extends PageProps {
    students: any[];
}
export default function Dashboard({ auth, students }: DashboardProps) {
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
                <DataTable columns={columns} data={data} />

                <div className="mt-4">
                    <h1 className="text-2xl font-bold text-center">الطلاب</h1>
                    <div className="grid grid-cols-1 gap-2 mt-4">
                        {students.map((student) => (
                            <Link
                                key={student.id}
                                href={`/dashboard/students/${student.id}/edit`}
                                className=" text-black "
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
