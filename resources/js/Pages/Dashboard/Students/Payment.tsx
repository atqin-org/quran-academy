import { Button } from "@/Components/ui/button";
import { Input } from "@/Components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/Components/ui/tabs";
import DashboardLayout from "@/Layouts/DashboardLayout";
import { PageProps } from "@/types";
import { Head, Link, useForm } from "@inertiajs/react";
import { Banknote, ChevronDownIcon } from "lucide-react";
import { useEffect, useState } from "react";
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
    const { data, setData, errors } = useForm({
        student_id: student.id,
        user_id: auth.user?.id || 0,
        value: 0,
        type: student.subscription === 0 ? "ins" : "sub",
        expect: {
            duration: 0,
            sessions: 0,
            change: 0,
            start_at: payments[0].end_at || new Date().toISOString(),
            end_at: new Date().toISOString(),
        },
    });
    useEffect(() => {
        if (isNaN(data.value) || data.value < 0) setData("value", 0);
        if (data.value && student.subscription) {
            setData("expect", {
                ...data.expect,
                duration: Math.floor(data.value / student.subscription),
                sessions: Math.floor((data.value * 16) / student.subscription),
                end_at: formatDate(
                    new Date(
                        new Date(data.expect.start_at).getFullYear(),
                        new Date(data.expect.start_at).getMonth() +
                            Math.floor(data.value / student.subscription),
                        new Date(data.expect.start_at).getDate()
                    )
                ),
            });
        }
    }, [data]);
    const [isDisabled, setIsDisabled] = useState(false);

    const handleClick = () => {
        setIsDisabled(true);
    };
    return (
        <DashboardLayout user={auth.user}>
            <Head title="Dashboard" />

            <div className=" flex flex-col gap-10">
                <h1 className="text-4xl font-bold text-gray-900">دفع الطالب</h1>
                <div className="flex md:items-start items-center justify-center flex-col md:flex-row gap-24">
                    <Tabs
                        defaultValue={student.subscription == 0 ? "ins" : "sub"}
                        dir="rtl"
                        className="flex flex-col justify-center items-center"
                    >
                        <TabsList className="w-fit">
                            <TabsTrigger
                                disabled={student.subscription == 0}
                                onClick={() => setData("type", "sub")}
                                value="sub"
                            >
                                الاشتراك
                            </TabsTrigger>
                            <TabsTrigger
                                onClick={() => setData("type", "ins")}
                                value="ins"
                            >
                                التأمين
                            </TabsTrigger>
                        </TabsList>

                        <TabsContent
                            value="sub"
                            className="flex justify-center"
                        >
                            <div className="flex md:mt-10 mt-0 flex-col gap-4">
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
                                            setData("value", +e.target.value)
                                        }
                                    />
                                    <div className="ps-3 mt-2">
                                        {/**
                                         * prevew how mutch sessions the student will have after the payment
                                         */}
                                        <div className="flex gap-2 text-sm text-gray-500">
                                            <p>{data.expect?.sessions} حصة</p>
                                            <span>|</span>
                                            <p>{data.expect?.duration} شهر</p>
                                            <span>|</span>
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
                                                        data.expect?.start_at
                                                    )
                                                )}
                                            </p>
                                            <span>|</span>
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
                                                        data.expect?.end_at
                                                    )
                                                )}
                                            </p>
                                        </div>
                                    </div>
                                </div>
                                <Link
                                    href={`/students/${student.id}/payment`}
                                    className={
                                        `w-40 flex gap-2 items-center justify-center py-2 text-center text-white rounded-lg ` +
                                        (isDisabled
                                            ? "bg-primary/90"
                                            : "bg-primary hover:bg-primary/90")
                                    }
                                    as="button"
                                    onClick={handleClick}
                                    disabled={isDisabled}
                                    method="post"
                                    data={data}
                                >
                                    <Banknote className="inline-block h-5 w-5" />
                                    دفع
                                </Link>
                            </div>
                        </TabsContent>
                        <TabsContent value="ins">
                            <div className="flex md:mt-2 mt-0 flex-col gap-4">
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
                                <Link
                                    href={`/students/${student.id}/payment`}
                                    className={
                                        `w-40 flex gap-2 items-center justify-center py-2 text-center text-white rounded-lg ` +
                                        (isDisabled
                                            ? "bg-primary/90"
                                            : "bg-primary hover:bg-primary/90")
                                    }
                                    as="button"
                                    onClick={handleClick}
                                    disabled={isDisabled}
                                    method="post"
                                    data={{
                                        ...data,
                                        value: 200,
                                        expect: {
                                            ...data.expect,
                                            duration: 0,
                                            sessions: 0,
                                            end_at: formatDate(
                                                new Date(
                                                    new Date().getFullYear(),
                                                    9,
                                                    31
                                                )
                                            ),
                                        },
                                    }}
                                >
                                    <Banknote className="inline-block h-5 w-5" />
                                    دفع
                                </Link>
                            </div>
                        </TabsContent>
                    </Tabs>
                    <div className="flex flex-col items-center w-[300px]">
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
                            className="w-fit mt-4"
                            onClick={() => console.log("Show more")}
                        >
                            عرض المزيد{" "}
                            <ChevronDownIcon className="ms-2 h-4 w-4" />
                        </Button>
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
