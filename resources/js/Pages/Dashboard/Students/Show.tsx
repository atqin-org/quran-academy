import DashboardLayout from "@/Layouts/DashboardLayout";
import { Head } from "@inertiajs/react";
import { Card, CardContent } from "@/Components/ui/card";
import { Progress } from "@/Components/ui/progress";
import { LineChart, Line, CartesianGrid, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";

export default function Shows({ auth, student, progress, attendanceStats, progressTimeline }: any) {
    return (
        <DashboardLayout user={auth.user}>
            <Head title={`الطالب ${student.name}`} />

            <div className="grid gap-4 md:grid-cols-2">
                {/* معلومات عامة */}
                <Card>
                    <CardContent className="p-4">
                        <h2 className="text-lg font-bold mb-2">معلومات الطالب</h2>
                        <p>الاسم: {student.name}</p>
                        <p>النادي: {student.club?.name}</p>
                        <p>الفئة: {student.category?.name}</p>
                        <p>الأب: {student.father?.name}</p>
                        <p>الأم: {student.mother?.name}</p>
                    </CardContent>
                </Card>

                {/* تقدّم في القرآن */}
                <Card>
                    <CardContent className="p-4">
                        <h2 className="text-lg font-bold mb-2">التقدّم في القرآن</h2>
                        <Progress value={progress} className="w-full" />
                        <p className="mt-2">{progress}% مكتمل</p>
                    </CardContent>
                </Card>

                {/* إحصائيات الحضور */}
                <Card>
                    <CardContent className="p-4">
                        <h2 className="text-lg font-bold mb-2">إحصائيات الحضور</h2>
                        <ul>
                            <li>حاضر: {attendanceStats.present}</li>
                            <li>غائب: {attendanceStats.absent}</li>
                            <li>معذور: {attendanceStats.excused}</li>
                        </ul>
                    </CardContent>
                </Card>
            </div>

            {/* مخطط التقدّم مع الزمن */}
            <Card className="mt-6">
                <CardContent className="p-4">
                    <h2 className="text-lg font-bold mb-4">التقدّم مع مرور الوقت</h2>
                    <ResponsiveContainer width="100%" height={300}>
                        <LineChart data={progressTimeline}>
                            <CartesianGrid stroke="#ccc" />
                            <XAxis dataKey="date" />
                            <YAxis domain={[0, 100]} tickFormatter={(value) => `${value}%`} />
                            <Tooltip formatter={(value: any) => `${value}%`} />
                            <Line type="monotone" dataKey="progress" stroke="#4f46e5" strokeWidth={2} />
                        </LineChart>
                    </ResponsiveContainer>
                </CardContent>
            </Card>
        </DashboardLayout>
    );
}
