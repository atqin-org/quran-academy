import { Button } from "@/Components/ui/button";
import { Input } from "@/Components/ui/input";
import DashboardLayout from "@/Layouts/DashboardLayout";
import { PageProps } from "@/types";
import { Head, Link, useForm } from "@inertiajs/react";
import {
    Banknote,
    CheckIcon,
    ChevronDownIcon,
    PauseIcon,
    XIcon,
} from "lucide-react";
import { useState } from "react";
interface DashboardProps extends PageProps {
    student: any;
    payments: Payment[];
}
interface Payment {
    id: number;
    type: string;
    value: number;
    start_at: string;
    end_at: string;
    user_id: number;
    student_id: number;
    created_at: string;
}
export default function Dashboard({ auth, student, payments }: DashboardProps) {
    const [input, setInput] = useState<number>(0);
    if (isNaN(input) || input < 0) setInput(0);

    return (
        <DashboardLayout user={auth.user}>
            <Head title="Dashboard" />

            <div className=" flex flex-col gap-10">
                <h1 className="text-4xl font-bold text-gray-900">دفع الطالب</h1>
                <div className="flex flex-col gap-4">
                    <h2 className="flex gap-1 items-center">
                        <span className="text-xl font-bold text-gray-900">
                            الاشتراك الشهري
                        </span>
                        <span className="text-sm text-gray-500">
                            (
                            {new Intl.NumberFormat("ar-DZ", {
                                style: "currency",
                                currency: "DZD",
                            }).format(student.subscription)}
                            /شهريا )
                        </span>
                    </h2>
                    <div className="">
                        <Input
                            className="w-80"
                            placeholder="المبلغ..."
                            value={input}
                            onChange={(e) => setInput(+e.target.value)}
                        />
                        <div className="ps-3 mt-2">
                            {/**
                             * prevew how mutch sessions the student will have after the payment
                             */}
                            <div className="flex gap-2 text-sm text-gray-500">
                                <p>
                                    {Math.floor(
                                        (input * 16) / student.subscription
                                    )}{" "}
                                    حصة
                                </p>
                                <span>|</span>
                                <p>
                                    {Math.floor(input / student.subscription)}{" "}
                                    شهر
                                </p>
                            </div>
                        </div>
                    </div>
                    <Link
                        href={`/students/${student.id}/payment`}
                        className="w-40 flex gap-2 items-center justify-center py-2 text-center bg-primary hover:bg-primary/90 text-white rounded-lg"
                        as="button"
                        method="post"
                    >
                        <Banknote className="inline-block h-5 w-5" />
                        دفع
                    </Link>
                    <div className="space-y-4 relative">
                        {payments.map((payment, index) => (
                            <div key={payment.id} className="flex items-center">
                                <div className="relative z-10 flex items-center justify-center">
                                    <div
                                        className={`w-4 h-4 rounded-full border-4 ${getStatusColor(
                                            payment.type
                                        )}`}
                                    />
                                    <div className="absolute w-2 h-2 bg-white rounded-full" />
                                </div>
                                <div className="flex-grow ms-4 rtl:text-right ltr:text-left">
                                    <p className="text-sm font-medium">
                                        <span>
                                            {payment.type === "sub"
                                                ? "تم الدفع"
                                                : payment.type === "ins"
                                                ? "تأخر الدفع"
                                                : "مخيم / عطلة"}{" "}
                                        </span>
                                        {new Date(
                                            payment.created_at
                                        ).toLocaleDateString()}
                                    </p>
                                    <p className="text-xs text-gray-500">
                                        {new Intl.NumberFormat("ar-DZ", {
                                            style: "currency",
                                            currency: "DZD",
                                        }).format(payment.value)}
                                    </p>
                                </div>
                            </div>
                        ))}
                        {/* Add a gray line connecting the dots */}
                        <div className="absolute h-[90%] w-0.5 bg-gray-200 start-[7px] top-0 z-[1]" />
                    </div>
                    <Button
                        variant="outline"
                        className="w-fit"
                        onClick={() => console.log("Show more")}
                    >
                        عرض المزيد <ChevronDownIcon className="ms-2 h-4 w-4" />
                    </Button>
                </div>
            </div>
        </DashboardLayout>
    );
}
function getStatusColor(type: Payment["type"]) {
    switch (type) {
        case "sub":
            return "border-green-500";
        case "ins":
            return "border-red-500";
        case "paused":
            return "border-gray-500";
    }
}
