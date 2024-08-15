import { Head } from '@inertiajs/react';
import { PageProps } from '@/types';
import DashboardLayout from '@/Layouts/DashboardLayout';

export default function Dashboard({ auth }: PageProps) {
    return (
        <DashboardLayout
            user={auth.user}
        >
            <Head title="Under Construction" />
            <div className="flex flex-col items-center justify-center  h-full">
                <div className="text-4xl font-bold text-center border-dashed border-4 border-yellow-500 p-12 rounded-lg select-none">
                    هذه الصفحة قيد الإنشاء
                    ⚠️🏗️🚧
                </div>
            </div>
        </DashboardLayout>
    );
}
