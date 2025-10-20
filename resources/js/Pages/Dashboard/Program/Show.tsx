import DashboardLayout from "@/Layouts/DashboardLayout";
import { Head } from "@inertiajs/react";
import { Button } from "@/Components/ui/button";

interface ProgramSession {
    id: number;
    session_date: string;
    start_time: string | null;
    end_time: string | null;
    status: "completed" | "upcoming" | "canceled";
}

interface ProgramDisplay {
    id: number;
    subject_name: string;
    club_name: string;
    category_name: string;
    start_date: string;
    end_date: string;
    days_of_week: string[];
    sessions: ProgramSession[];
    future_sessions: ProgramSession[];
    old_sessions: ProgramSession[];
}

interface ProgramsProps {
    auth: any;
    program: ProgramDisplay;
}

export default function Programs({ auth, program }: ProgramsProps) {
    return (
        <DashboardLayout user={auth.user}>
            <Head title="برنامج" />

            {/* تفاصيل البرنامج */}
            <div className="flex flex-col gap-8">
                <h1 className="text-4xl font-bold text-gray-900">
                    عرض تفاصيل البرنامج
                </h1>

                <div className="m-2 w-full grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div className="bg-slate-50 border p-4 rounded-md">
                        <span className="font-semibold">رقم البرنامج:</span>{" "}
                        {program.id}
                    </div>
                    <div className="border p-4 rounded-md">
                        <span className="font-semibold">المادة:</span>{" "}
                        {program.subject_name}
                    </div>
                    <div className="border p-4 rounded-md">
                        <span className="font-semibold">النادي:</span>{" "}
                        {program.club_name}
                    </div>
                    <div className="border p-4 rounded-md">
                        <span className="font-semibold">التصنيف:</span>{" "}
                        {program.category_name}
                    </div>
                    <div className="border p-4 rounded-md">
                        <span className="font-semibold">تاريخ البداية:</span>{" "}
                        {program.start_date}
                    </div>
                    <div className="border p-4 rounded-md">
                        <span className="font-semibold">تاريخ النهاية:</span>{" "}
                        {program.end_date}
                    </div>
                    <div className="border p-4 rounded-md col-span-1 sm:col-span-3">
                        <span className="font-semibold">الأيام:</span>{" "}
                        {program.days_of_week.join(", ")}
                    </div>
                </div>
            </div>

            {/* الحصص */}
            <div className="flex flex-col gap-8 mt-10">
                <h1 className="text-3xl font-bold text-gray-900">
                    الحصص القادمة
                </h1>

                {program.future_sessions.length > 0 ? (
                    <div className="m-2 w-full grid grid-cols-1 sm:grid-cols-2 gap-4">
                        {program.future_sessions.map((session, index) => (
                            <div
                                key={session.id}
                                className={`border p-4 rounded-md flex justify-between items-center shadow-sm`}
                            >
                                <div className="flex flex-col">
                                    <span className="font-semibold">
                                        حصة {session.id}
                                    </span>
                                    <span className="text-sm text-gray-600">
                                        {session.session_date}
                                    </span>
                                    <span className="text-sm text-gray-500">
                                        {session.start_time ?? "--:--"} -{" "}
                                        {session.end_time ?? "--:--"}
                                    </span>
                                </div>
                                <a
                                    href={route(
                                        "sessions.attendance",
                                        session.id
                                    )}
                                    className="text-blue-500 hover:underline"
                                >
                                    فتح
                                </a>
                            </div>
                        ))}
                    </div>
                ) : (
                    <p className="text-gray-500">لا توجد حصص مسجلة.</p>
                )}
            </div>

            <div className="flex flex-col gap-8 mt-10">
                <h1 className="text-3xl font-bold text-gray-900">
                    الحصص القديمة
                </h1>

                {program.old_sessions.length > 0 ? (
                    <div className="m-2 w-full grid grid-cols-1 sm:grid-cols-2 gap-4">
                        {program.old_sessions.map((session, index) => (
                            <div
                                key={session.id}
                                className="border p-4 rounded-md flex justify-between items-center bg-white shadow-sm"
                            >
                                <div className="flex flex-col">
                                    <span className="font-semibold">
                                        حصة {session.id}
                                    </span>
                                    <span className="text-sm text-gray-600">
                                        {session.session_date}
                                    </span>
                                    <span className="text-sm text-gray-500">
                                        {session.start_time ?? "--:--"} -{" "}
                                        {session.end_time ?? "--:--"}
                                    </span>
                                </div>
                                <a
                                    href={route(
                                        "sessions.attendance",
                                        session.id
                                    )}
                                    className="text-blue-500 hover:underline"
                                >
                                    فتح
                                </a>
                            </div>
                        ))}
                    </div>
                ) : (
                    <p className="text-gray-500">لا توجد حصص مسجلة.</p>
                )}
            </div>
        </DashboardLayout>
    );
}
