import DashboardLayout from "@/Layouts/DashboardLayout";
import { Head, useForm } from "@inertiajs/react";
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/Components/ui/card";
import { Switch } from "@/Components/ui/switch";
import { Button } from "@/Components/ui/button";
import { Badge } from "@/Components/ui/badge";
import { Bell, Loader2, Save, ShieldOff } from "lucide-react";
import { PageProps } from "@/types";

interface NotificationTypeRow {
    type: string;
    label: string;
    description: string;
    default_dismissable: boolean;
    dismissable: boolean;
}

interface Props extends PageProps {
    types: NotificationTypeRow[];
}

export default function NotificationTypes({ auth, types }: Props) {
    const { data, setData, put, processing } = useForm({
        types: types.map((t) => ({
            type: t.type,
            dismissable: t.dismissable,
        })),
    });

    const toggle = (index: number, value: boolean) => {
        setData(
            "types",
            data.types.map((row, i) =>
                i === index ? { ...row, dismissable: value } : row
            )
        );
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        put(route("admin.notificationTypes.update"));
    };

    return (
        <DashboardLayout user={auth.user}>
            <Head title="إعدادات أنواع التنبيهات" />
            <div className="flex flex-col gap-6">
                <div className="flex items-start gap-2 text-gray-600">
                    <Bell className="h-5 w-5 mt-0.5 flex-shrink-0" />
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900">
                            إعدادات أنواع التنبيهات
                        </h1>
                        <p className="text-sm">
                            تحكّم في إمكانية تجاهل (تحديد كمقروء أو إخفاء) كل
                            نوع من التنبيهات. الأنواع غير القابلة للتجاهل تبقى
                            مرئيّة حتى تُحلّ تلقائياً.
                        </p>
                    </div>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                    {types.map((type, index) => {
                        const row = data.types[index];

                        return (
                            <Card key={type.type}>
                                <CardHeader className="pb-3">
                                    <div className="flex items-start justify-between gap-4">
                                        <div className="flex-1">
                                            <CardTitle className="text-base flex items-center gap-2">
                                                {type.label}
                                                {!row.dismissable && (
                                                    <Badge
                                                        variant="outline"
                                                        className="gap-1"
                                                    >
                                                        <ShieldOff className="h-3 w-3" />
                                                        لا يمكن تجاهله
                                                    </Badge>
                                                )}
                                            </CardTitle>
                                            <CardDescription className="mt-1">
                                                {type.description}
                                            </CardDescription>
                                        </div>
                                        <Switch
                                            checked={row.dismissable}
                                            onCheckedChange={(v) =>
                                                toggle(index, v)
                                            }
                                        />
                                    </div>
                                </CardHeader>
                                <CardContent>
                                    <p className="text-xs text-gray-500">
                                        {row.dismissable
                                            ? "يمكن للمستخدم تحديد التنبيه كمقروء أو إخفاؤه يدوياً."
                                            : "يبقى التنبيه ظاهراً حتى تُحلّ المشكلة (لا يمكن إخفاؤه يدوياً)."}
                                    </p>
                                </CardContent>
                            </Card>
                        );
                    })}

                    <div className="flex gap-3 pt-2">
                        <Button
                            type="submit"
                            disabled={processing}
                            className="gap-2"
                        >
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
