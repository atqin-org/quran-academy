import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head } from '@inertiajs/react';
import { PageProps } from '@/types';
import DashboardLayout from '@/Layouts/DashboardLayout';
import { Button } from '@/Components/ui/button';

export default function Dashboard({ auth }: PageProps) {
    return (
        <DashboardLayout
            user={auth.user}
        >
            <Head title="Dashboard" />

            <div className="py-12">
                <div className="max-w-7xl mx-auto sm:px-6 lg:px-8">
                    <div className="bg-white overflow-hidden shadow-sm sm:rounded-lg">
                        <h1 className="text-3xl p-6 text-gray-900">السلام عليكم</h1>
                    </div>
                </div>
            </div>
        </DashboardLayout>
    );
}
