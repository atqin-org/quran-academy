import DashboardLayout from "@/Layouts/DashboardLayout";
import { PageProps } from "@/types";
import { Head, Link, useForm } from "@inertiajs/react";
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/Components/ui/card";
import { Button } from "@/Components/ui/button";
import { Input } from "@/Components/ui/input";
import { Label } from "@/Components/ui/label";
import { Badge } from "@/Components/ui/badge";
import { ArrowRight, Calendar, Loader2, Save } from "lucide-react";

interface CategoryConfig {
    category_id: number;
    category_name: string;
    category_gender: string | null;
    sessions_per_month: number;
    has_config: boolean;
}

interface Club {
    id: number;
    name: string;
    location: string;
}

interface SessionConfigProps extends PageProps {
    club: Club;
    categoryConfigs: CategoryConfig[];
}

export default function SessionConfig({ auth, club, categoryConfigs }: SessionConfigProps) {
    const { data, setData, put, processing } = useForm({
        configs: categoryConfigs.map(c => ({
            category_id: c.category_id,
            sessions_per_month: c.sessions_per_month,
        })),
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        put(`/clubs/${club.id}/sessions-config`);
    };

    const updateConfig = (categoryId: number, value: number) => {
        setData('configs', data.configs.map(c =>
            c.category_id === categoryId
                ? { ...c, sessions_per_month: value }
                : c
        ));
    };

    return (
        <DashboardLayout user={auth.user}>
            <Head title={`إعدادات الحصص - ${club.name}`} />
            <div className="flex flex-col gap-6">
                {/* Header */}
                <div className="flex items-center gap-4">
                    <Link href="/clubs">
                        <Button variant="outline" size="icon">
                            <ArrowRight className="h-4 w-4" />
                        </Button>
                    </Link>
                    <h1 className="text-3xl font-bold text-gray-900">
                        إعدادات الحصص - {club.name}
                    </h1>
                </div>

                {/* Config Card */}
                <Card className="max-w-2xl">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Calendar className="h-5 w-5" />
                            عدد الحصص الشهرية لكل فئة
                        </CardTitle>
                        <CardDescription>
                            حدد عدد الحصص التي يحصل عليها الطالب شهرياً لكل فئة
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <form onSubmit={handleSubmit} className="space-y-6">
                            {categoryConfigs.map((config, index) => (
                                <div key={config.category_id} className="flex items-center gap-4">
                                    <div className="flex-1">
                                        <Label>{config.category_name}</Label>
                                        {config.category_gender && (
                                            <Badge variant="outline" className="mr-2">
                                                {config.category_gender === 'male' ? 'ذكور' : 'إناث'}
                                            </Badge>
                                        )}
                                    </div>
                                    <Input
                                        type="number"
                                        min="1"
                                        max="31"
                                        className="w-24"
                                        value={data.configs[index].sessions_per_month}
                                        onChange={(e) => updateConfig(
                                            config.category_id,
                                            parseInt(e.target.value) || 12
                                        )}
                                    />
                                    <span className="text-sm text-gray-500">حصة/شهر</span>
                                </div>
                            ))}

                            <div className="flex gap-3 pt-4">
                                <Button type="submit" disabled={processing} className="gap-2">
                                    {processing ? (
                                        <Loader2 className="h-4 w-4 animate-spin" />
                                    ) : (
                                        <Save className="h-4 w-4" />
                                    )}
                                    {processing ? "جاري الحفظ..." : "حفظ الإعدادات"}
                                </Button>
                                <Link href="/clubs">
                                    <Button type="button" variant="outline">
                                        إلغاء
                                    </Button>
                                </Link>
                            </div>
                        </form>
                    </CardContent>
                </Card>
            </div>
        </DashboardLayout>
    );
}
