import { Head, Link } from '@inertiajs/react';
import { PageProps } from '@/types';
import DashboardLayout from '@/Layouts/DashboardLayout';

export default function Dashboard({ auth }: PageProps) {
    return (
        <DashboardLayout
            user={auth.user}
        >
            <Head title="⚠️ Under Construction" />
            <div className="flex flex-col items-center justify-center  h-full">
                <Link
                    className="text-xl text-primary-foreground font-bold text-center bg-primary p-4 rounded-xl select-none"
                    href="/dashboard/student/create"
                >
                    سجل طالب جديد
                </Link>
            </div>
        </DashboardLayout>
    );
}
