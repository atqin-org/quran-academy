import { useForm } from "@inertiajs/react";
import { Card, CardContent } from "@/Components/ui/card";
import { Switch } from "@/Components/ui/switch";
import { Badge } from "@/Components/ui/badge";
import { Bell, Loader2, Mail, Save, Smartphone } from "lucide-react";
import { Button } from "@/Components/ui/button";
import { NotificationPreferenceRow } from "@/types";

interface Props {
    preferences: NotificationPreferenceRow[];
    className?: string;
}

export default function UpdateNotificationPreferencesForm({
    preferences,
    className = "",
}: Props) {
    const { data, setData, put, processing } = useForm({
        preferences: preferences.map((p) => ({
            type: p.type,
            in_app: p.in_app,
            email: p.email,
        })),
    });

    const updateRow = (
        index: number,
        field: "in_app" | "email",
        value: boolean
    ) => {
        setData(
            "preferences",
            data.preferences.map((row, i) => {
                if (i !== index) return row;
                if (field === "in_app" && !value) {
                    return { ...row, in_app: false, email: false };
                }
                return { ...row, [field]: value };
            })
        );
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        put(route("profile.notifications.update"));
    };

    return (
        <section className={className}>
            <header className="flex items-center gap-2 mb-6">
                <Bell className="h-5 w-5 text-gray-700" />
                <div>
                    <h2 className="text-lg font-medium text-gray-900">
                        إعدادات التنبيهات
                    </h2>
                    <p className="text-sm text-gray-500">
                        تحكّم في طريقة استلامك لكل نوع من التنبيهات
                    </p>
                </div>
            </header>
            <form onSubmit={handleSubmit} className="space-y-4">
                {preferences.map((pref, index) => {
                    const row = data.preferences[index];
                    const masterOn = row.in_app;

                    return (
                        <Card key={pref.type}>
                            <CardContent className="space-y-4 pt-6">
                                <div>
                                    <h3 className="text-sm font-semibold text-gray-900">
                                        {pref.label}
                                    </h3>
                                    <p className="text-xs text-gray-500 mt-0.5">
                                        {pref.description}
                                    </p>
                                </div>

                                <div className="flex items-center justify-between gap-4 pb-4 border-b">
                                    <div className="flex items-center gap-2">
                                        <Bell className="h-4 w-4 text-gray-500" />
                                        <span className="text-sm font-medium">
                                            داخل التطبيق
                                        </span>
                                    </div>
                                    <Switch
                                        checked={row.in_app}
                                        onCheckedChange={(v) =>
                                            updateRow(index, "in_app", v)
                                        }
                                    />
                                </div>

                                <div className="flex items-center justify-between gap-4">
                                    <div className="flex items-center gap-2">
                                        <Mail
                                            className={`h-4 w-4 ${
                                                masterOn
                                                    ? "text-gray-500"
                                                    : "text-gray-300"
                                            }`}
                                        />
                                        <span
                                            className={`text-sm ${
                                                masterOn
                                                    ? "text-gray-700"
                                                    : "text-gray-400"
                                            }`}
                                        >
                                            البريد الإلكتروني
                                        </span>
                                    </div>
                                    <Switch
                                        checked={masterOn && row.email}
                                        disabled={!masterOn || !pref.allow_email}
                                        onCheckedChange={(v) =>
                                            updateRow(index, "email", v)
                                        }
                                    />
                                </div>

                                <div className="flex items-center justify-between gap-4">
                                    <div className="flex items-center gap-2">
                                        <Smartphone className="h-4 w-4 text-gray-300" />
                                        <span className="text-sm text-gray-400">
                                            إشعار فوري على الجوال
                                        </span>
                                        <Badge variant="outline" className="ms-1">
                                            قريباً
                                        </Badge>
                                    </div>
                                    <Switch checked={false} disabled />
                                </div>
                            </CardContent>
                        </Card>
                    );
                })}

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
        </section>
    );
}
