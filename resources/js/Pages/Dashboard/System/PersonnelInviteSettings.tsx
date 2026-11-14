import DashboardLayout from "@/Layouts/DashboardLayout";
import { Head, useForm } from "@inertiajs/react";
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/Components/ui/card";
import { Button } from "@/Components/ui/button";
import { Loader2, Mail, Save, Send, Link2 } from "lucide-react";
import { PageProps } from "@/types";

type Channel = "email" | "link" | "both";

interface Props extends PageProps {
    deliveryChannel: Channel;
}

const options: { value: Channel; label: string; description: string; icon: typeof Mail }[] = [
    {
        value: "email",
        label: "البريد الإلكتروني فقط",
        description: "يُرسَل رابط الدعوة إلى البريد المسجَّل للموظف",
        icon: Mail,
    },
    {
        value: "link",
        label: "رابط قابل للنسخ فقط",
        description: "يظهر الرابط للمسؤول بعد إنشاء الحساب لمشاركته يدوياً",
        icon: Link2,
    },
    {
        value: "both",
        label: "البريد والرابط معاً",
        description: "نُرسِل البريد ونعرض الرابط أيضاً للمسؤول",
        icon: Send,
    },
];

export default function PersonnelInviteSettings({ auth, deliveryChannel }: Props) {
    const { data, setData, put, processing } = useForm<{ delivery_channel: Channel }>({
        delivery_channel: deliveryChannel,
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        put(route("settings.personnel-invite.update"));
    };

    return (
        <DashboardLayout user={auth.user}>
            <Head title="إعدادات دعوات الموظفين" />
            <div className="flex flex-col gap-6">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">
                        إعدادات دعوات الموظفين
                    </h1>
                    <p className="text-sm text-gray-600 mt-1">
                        اختر طريقة إرسال رابط تفعيل الحساب عند إضافة موظف جديد.
                        تنتهي صلاحية الروابط بعد 7 أيام.
                    </p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                    <Card>
                        <CardHeader className="pb-3">
                            <CardTitle className="text-base">طريقة التوصيل</CardTitle>
                            <CardDescription>
                                ينطبق على جميع الموظفين الجدد منذ لحظة الحفظ.
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-3" dir="rtl">
                                {options.map((opt) => {
                                    const Icon = opt.icon;
                                    const checked = data.delivery_channel === opt.value;
                                    return (
                                        <label
                                            key={opt.value}
                                            htmlFor={`channel-${opt.value}`}
                                            className={`flex items-start gap-3 rounded-md border p-3 cursor-pointer transition-colors ${
                                                checked
                                                    ? "border-gray-900 bg-gray-50"
                                                    : "border-gray-200 hover:bg-gray-50"
                                            }`}
                                        >
                                            <input
                                                id={`channel-${opt.value}`}
                                                type="radio"
                                                name="delivery_channel"
                                                value={opt.value}
                                                checked={checked}
                                                onChange={() => setData("delivery_channel", opt.value)}
                                                className="mt-1 h-4 w-4 text-gray-900 focus:ring-gray-900"
                                            />
                                            <div className="flex-1">
                                                <div className="flex items-center gap-2 font-medium text-gray-900">
                                                    <Icon className="h-4 w-4" />
                                                    {opt.label}
                                                </div>
                                                <p className="text-sm text-gray-600 mt-1">
                                                    {opt.description}
                                                </p>
                                            </div>
                                        </label>
                                    );
                                })}
                            </div>
                        </CardContent>
                    </Card>

                    <div className="flex gap-3 pt-2">
                        <Button type="submit" disabled={processing} className="gap-2">
                            {processing ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                                <Save className="h-4 w-4" />
                            )}
                            {processing ? "جاري الحفظ..." : "حفظ"}
                        </Button>
                    </div>
                </form>
            </div>
        </DashboardLayout>
    );
}
