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
import { useState } from "react";

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

    const [errors, setErrors] = useState<Record<number, string>>({});

    const validateValue = (value: string, categoryId: number): number | null => {
        const parsed = parseInt(value);

        if (value === '' || isNaN(parsed)) {
            setErrors(prev => ({ ...prev, [categoryId]: 'الرجاء إدخال رقم صحيح' }));
            return null;
        }

        if (parsed < 1) {
            setErrors(prev => ({ ...prev, [categoryId]: 'الحد الأدنى هو 1' }));
            return null;
        }

        if (parsed > 31) {
            setErrors(prev => ({ ...prev, [categoryId]: 'الحد الأقصى هو 31' }));
            return null;
        }

        // Clear error if valid
        setErrors(prev => {
            const newErrors = { ...prev };
            delete newErrors[categoryId];
            return newErrors;
        });

        return parsed;
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (Object.keys(errors).length > 0) {
            return;
        }
        put(route('clubs.sessions-config.update', club.id));
    };

    const updateConfig = (categoryId: number, value: string) => {
        const validated = validateValue(value, categoryId);
        if (validated !== null) {
            setData('configs', data.configs.map(c =>
                c.category_id === categoryId
                    ? { ...c, sessions_per_month: validated }
                    : c
            ));
        }
    };

    const hasErrors = Object.keys(errors).length > 0;

    return (
        <DashboardLayout user={auth.user}>
            <Head title={`إعدادات الحصص - ${club.name}`} />
            <div className="flex flex-col gap-6">
                {/* Header */}
                <div className="flex items-center gap-4">
                    <Link href={route('clubs.index')}>
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
                                <div key={config.category_id} className="space-y-1">
                                    <div className="flex items-center gap-4">
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
                                            className={`w-24 ${errors[config.category_id] ? 'border-red-500' : ''}`}
                                            value={data.configs[index].sessions_per_month}
                                            onChange={(e) => updateConfig(
                                                config.category_id,
                                                e.target.value
                                            )}
                                        />
                                        <span className="text-sm text-gray-500">حصة/شهر</span>
                                    </div>
                                    {errors[config.category_id] && (
                                        <p className="text-sm text-red-500 text-left">
                                            {errors[config.category_id]}
                                        </p>
                                    )}
                                </div>
                            ))}

                            <div className="flex gap-3 pt-4">
                                <Button type="submit" disabled={processing || hasErrors} className="gap-2">
                                    {processing ? (
                                        <Loader2 className="h-4 w-4 animate-spin" />
                                    ) : (
                                        <Save className="h-4 w-4" />
                                    )}
                                    {processing ? "جاري الحفظ..." : "حفظ الإعدادات"}
                                </Button>
                                <Link href={route('clubs.index')}>
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
