import { Button } from "@/Components/ui/button";
import { Input } from "@/Components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/Components/ui/tabs";
import DashboardLayout from "@/Layouts/DashboardLayout";
import { PageProps } from "@/types";
import { Head, useForm } from "@inertiajs/react";
import { Banknote, ChevronDownIcon } from "lucide-react";

interface DashboardProps extends PageProps {
    student: any;
    payments: Payment[];
}

interface Payment {
    id: number;
    type: string;
    value: number;
    status: string;
    start_at: string;
    end_at: string;
    user_id: number;
    student_id: number;
    created_at: string;
}

export default function Dashboard({ auth, student, payments }: DashboardProps) {
    const formatDate = (date: Date) => {
        const pad = (num: number) => (num < 10 ? "0" + num : num);
        return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(
            date.getDate()
        )} ${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(
            date.getSeconds()
        )}`;
    };

    const calculateExpect = (value: number, startAt: string) => {
        if (isNaN(value) || value < 0 || !student.subscription) return null;

        const duration = Math.floor(value / student.subscription);
        const sessions = Math.floor((value * 16) / student.subscription);
        const endDate = new Date(startAt);
        endDate.setMonth(endDate.getMonth() + duration);

        return {
            duration,
            sessions,
            change: 0,
            start_at: startAt,
            end_at: formatDate(endDate),
        };
    };

    const { data, setData, post, errors } = useForm({
        student_id: student.id,
        user_id: auth.user?.id || 1,
        value: 0,
        type: student.subscription === 0 ? "ins" : "sub",
        status: "in_time",
        expect: calculateExpect(
            0,
            payments[0]?.end_at ?? new Date().toISOString()
        ),
    });

    const handleValueChange = (newValue: number) => {
        const validValue = isNaN(newValue) || newValue < 0 ? 0 : newValue;
        const newExpect = calculateExpect(
            validValue,
            data.expect?.start_at ?? new Date().toISOString()
        );
        setData({
            ...data,
            value: validValue,
            expect: newExpect,
        });
    };

    const handleTypeChange = (newType: string) => {
        setData("type", newType);
    };
    return (
        <DashboardLayout user={auth.user}>
            <Head title="Dashboard" />

            <div className="flex flex-col gap-10">
                <h1 className="text-4xl font-bold text-gray-900">دفع الطالب</h1>
                <h3 className="">
                    <span>الطالب: </span>
                    <span className="">
                        {student.first_name} {student.last_name}
                    </span>
                </h3>
                <div className="flex md:items-start items-center justify-center flex-col md:flex-row gap-24">
                    <Tabs
                        defaultValue={student.subscription == 0 ? "ins" : "sub"}
                        dir="rtl"
                        className="flex flex-col justify-center items-center"
                    >
                        <TabsList className="w-fit">
                            <TabsTrigger
                                disabled={student.subscription == 0}
                                onClick={() => handleTypeChange("sub")}
                                value="sub"
                            >
                                الاشتراك
                            </TabsTrigger>
                            <TabsTrigger
                                onClick={() => handleTypeChange("ins")}
                                value="ins"
                            >
                                التأمين
                            </TabsTrigger>
                        </TabsList>

                        <TabsContent
                            value="sub"
                            className="flex justify-center"
                        >
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
                                        value={data.value}
                                        onChange={(e) =>
                                            handleValueChange(+e.target.value)
                                        }
                                    />
                                    <div className="ps-3 mt-2">
                                        <div className="flex flex-col gap-2 text-sm text-gray-500">
                                            <div className="flex gap-2">
                                                <p>
                                                    {data.expect?.sessions} حصة
                                                </p>
                                                <span>|</span>
                                                <p>
                                                    {data.expect?.duration} شهر
                                                </p>
                                            </div>
                                            <p>
                                                من{" "}
                                                {new Intl.DateTimeFormat(
                                                    "ar-DZ",
                                                    {
                                                        year: "numeric",
                                                        month: "2-digit",
                                                        day: "2-digit",
                                                    }
                                                ).format(
                                                    new Date(
                                                        data.expect?.start_at ??
                                                            ""
                                                    )
                                                )}
                                            </p>
                                            <p>
                                                إلى{" "}
                                                {new Intl.DateTimeFormat(
                                                    "ar-DZ",
                                                    {
                                                        year: "numeric",
                                                        month: "2-digit",
                                                        day: "2-digit",
                                                    }
                                                ).format(
                                                    new Date(
                                                        data.expect?.end_at ??
                                                            ""
                                                    )
                                                )}
                                            </p>
                                        </div>
                                    </div>
                                </div>
                                <Button
                                    className="w-fit px-8 flex gap-2"
                                    onClick={() => {
                                        post(`/students/${student.id}/payment`);
                                        console.log(data);
                                    }}
                                >
                                    <Banknote className="inline-block h-5 w-5" />
                                    دفع
                                </Button>
                                <span className="text-red-500">
                                    {errors.value}
                                </span>
                            </div>
                        </TabsContent>
                        <TabsContent value="ins">
                            <div className="flex flex-col gap-4">
                                <h2 className="flex gap-1 items-center">
                                    <span className="text-xl font-bold text-gray-900">
                                        التأمين السنوي
                                    </span>
                                </h2>
                                <div className="">
                                    <Input
                                        className="w-80"
                                        value={200}
                                        disabled
                                    />
                                    <div className="ps-3 mt-2">
                                        {/**
                                         * prevew how mutch sessions the student will have after the payment
                                         */}
                                        <div className="flex gap-2 text-sm text-gray-500">
                                            <p>
                                                إلى{" "}
                                                {new Intl.DateTimeFormat(
                                                    "ar-DZ",
                                                    {
                                                        year: "numeric",
                                                        month: "2-digit",
                                                        day: "2-digit",
                                                    }
                                                ).format(
                                                    new Date(
                                                        new Date().getFullYear(),
                                                        9,
                                                        31
                                                    )
                                                )}
                                            </p>
                                        </div>
                                    </div>
                                </div>
                                <Button
                                    className="w-fit px-8 flex gap-2"
                                    onClick={() => {
                                        post(`/students/${student.id}/payment`);
                                        console.log(data);
                                    }}
                                >
                                    <Banknote className="inline-block h-5 w-5" />
                                    دفع
                                </Button>
                                <span className="text-red-500">
                                    {errors.value}
                                </span>
                            </div>
                        </TabsContent>
                    </Tabs>
                    <div className="flex flex-col items-center w-[300px]">
                        {payments.length > 0 ? (
                            <div className="space-y-4 relative ">
                                {payments.map((payment, index) => (
                                    <div
                                        key={payment.id}
                                        className="flex items-center"
                                    >
                                        <div className="relative z-10 flex items-center justify-center">
                                            <div
                                                className={`w-4 h-4 rounded-full border-4 ${getStatusColor(
                                                    payment.status
                                                )}`}
                                            />
                                            <div className="absolute w-2 h-2 bg-white rounded-full" />
                                        </div>
                                        <div className="flex-grow ms-4 rtl:text-right ltr:text-left">
                                            <p className="text-sm font-medium">
                                                <span>
                                                    {payment.type === "sub"
                                                        ? "اشتراك"
                                                        : payment.type === "ins"
                                                        ? "تأمين"
                                                        : "مخيم / عطلة"}{" "}
                                                </span>
                                                {new Date(
                                                    payment.created_at
                                                ).toLocaleDateString()}
                                            </p>
                                            <div className="flex gap-2 text-xs">
                                                <p className=" text-gray-500">
                                                    {new Intl.NumberFormat(
                                                        "ar-DZ",
                                                        {
                                                            style: "currency",
                                                            currency: "DZD",
                                                        }
                                                    ).format(payment.value)}
                                                </p>
                                                <span className="font-bold">
                                                    |
                                                </span>
                                                <span>
                                                    الى{" "}
                                                    {new Date(
                                                        payment.end_at
                                                    ).toLocaleDateString()}
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                                {/*
                                <div className="absolute h-[90%] w-0.5 bg-gray-200 start-[7px] top-0 z-[1]" />
                                */}
                                <Button
                                    variant="outline"
                                    className="w-fit mt-4"
                                    onClick={() => console.log("Show more")}
                                >
                                    عرض المزيد{" "}
                                    <ChevronDownIcon className="ms-2 h-4 w-4" />
                                </Button>
                            </div>
                        ) : (
                            <p className="text-gray-500">لا توجد مدفوعات</p>
                        )}
                    </div>
                </div>
            </div>
        </DashboardLayout>
    );
}
function getStatusColor(type: Payment["type"]) {
    switch (type) {
        case "in_time":
            return "border-green-500";
        case "late":
            return "border-red-500";
        case "early":
            return "border-gray-500";
    }
}
