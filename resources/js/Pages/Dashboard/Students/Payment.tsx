import DashboardLayout from "@/Layouts/DashboardLayout";
import { PageProps } from "@/types";
import { Head, useForm } from "@inertiajs/react";
interface DashboardProps extends PageProps {
    student: any;
    payment: any;
}

export default function Dashboard({ auth, student,payment }: DashboardProps) {
    return (
        <DashboardLayout user={auth.user}>
            <Head title="Dashboard" />

            <div className=" flex flex-col gap-10">
                <h1 className="text-4xl font-bold text-gray-900">
                    دفع الطالب
                </h1>
                <div className="">
                    {JSON.stringify(payment)}

                </div>
            </div>
        </DashboardLayout>
    );
}
