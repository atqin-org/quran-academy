import DashboardLayout from "@/Layouts/DashboardLayout";
import { PageProps } from "@/types";
import { Head, Link, useForm } from "@inertiajs/react";
import {
    Card,
    CardContent,
    CardHeader,
    CardTitle,
} from "@/Components/ui/card";
import { Button } from "@/Components/ui/button";
import { Input } from "@/Components/ui/input";
import { Label } from "@/Components/ui/label";
import { Badge } from "@/Components/ui/badge";
import { ArrowRight, Calendar, Info, Loader2, Save, Users } from "lucide-react";
import { useState } from "react";

interface CategoryConfig {
    category_id: number;
    category_name: string;
    category_gender: string | null;
    sessions_per_month: number;
    capacity: number | null;
    has_groups: boolean;
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
            capacity: c.capacity,
        })),
    });

    const [errors, setErrors] = useState<Record<number, string>>({});
    const [capacityErrors, setCapacityErrors] = useState<Record<number, string>>({});

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

    const validateCapacity = (value: string, categoryId: number): number | null => {
        if (value === '') {
            setCapacityErrors(prev => {
                const next = { ...prev };
                delete next[categoryId];
                return next;
            });
            return null;
        }

        const parsed = parseInt(value);

        if (isNaN(parsed) || parsed < 1) {
            setCapacityErrors(prev => ({ ...prev, [categoryId]: 'الحد الأدنى هو 1' }));
            return null;
        }

        setCapacityErrors(prev => {
            const next = { ...prev };
            delete next[categoryId];
            return next;
        });

        return parsed;
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (Object.keys(errors).length > 0 || Object.keys(capacityErrors).length > 0) {
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

    const updateCapacity = (categoryId: number, value: string) => {
        if (value === '') {
            validateCapacity(value, categoryId);
            setData('configs', data.configs.map(c =>
                c.category_id === categoryId ? { ...c, capacity: null } : c
            ));
            return;
        }

        const validated = validateCapacity(value, categoryId);
        if (validated !== null) {
            setData('configs', data.configs.map(c =>
                c.category_id === categoryId ? { ...c, capacity: validated } : c
            ));
        }
    };

    const hasErrors = Object.keys(errors).length > 0 || Object.keys(capacityErrors).length > 0;

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

                {/* Intro */}
                <div className="flex items-start gap-2 text-gray-600">
                    <Calendar className="h-5 w-5 mt-0.5 flex-shrink-0" />
                    <div>
                        <h2 className="text-lg font-semibold text-gray-900">
                            عدد الحصص الشهرية والسعة الاستيعابية لكل فئة
                        </h2>
                        <p className="text-sm">
                            حدد عدد الحصص التي يحصل عليها الطالب شهرياً والسعة الاستيعابية القصوى لكل فئة
                        </p>
                    </div>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {categoryConfigs.map((config, index) => (
                            <Card key={config.category_id}>
                                <CardHeader className="pb-3">
                                    <CardTitle className="text-base flex items-center justify-between gap-2">
                                        <span>{config.category_name}</span>
                                        {config.category_gender && (
                                            <Badge variant="outline">
                                                {config.category_gender === 'male' ? 'ذكور' : 'إناث'}
                                            </Badge>
                                        )}
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    <div>
                                        <Label className="flex items-center gap-2 text-sm text-gray-600 mb-1.5">
                                            <Calendar className="h-4 w-4" />
                                            <span>عدد الحصص الشهرية</span>
                                        </Label>
                                        <div className="flex items-center gap-2">
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
                                            <p className="mt-1 text-sm text-red-500 text-left">
                                                {errors[config.category_id]}
                                            </p>
                                        )}
                                    </div>

                                    <div>
                                        <Label className="flex items-center gap-2 text-sm text-gray-600 mb-1.5">
                                            <Users className="h-4 w-4" />
                                            <span>السعة الاستيعابية</span>
                                        </Label>
                                        {config.has_groups ? (
                                            <Link
                                                href={route('groups.manage', {
                                                    club: club.id,
                                                    category: config.category_id,
                                                })}
                                                className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-primary"
                                            >
                                                <Info className="h-4 w-4" />
                                                <span>تُدار على مستوى الأفواج</span>
                                            </Link>
                                        ) : (
                                            <>
                                                <div className="flex items-center gap-2">
                                                    <Input
                                                        type="number"
                                                        min="1"
                                                        placeholder="غير محددة"
                                                        className={`w-24 ${capacityErrors[config.category_id] ? 'border-red-500' : ''}`}
                                                        value={data.configs[index].capacity ?? ''}
                                                        onChange={(e) => updateCapacity(
                                                            config.category_id,
                                                            e.target.value
                                                        )}
                                                    />
                                                    <span className="text-sm text-gray-500">طالب</span>
                                                </div>
                                                {capacityErrors[config.category_id] && (
                                                    <p className="mt-1 text-sm text-red-500 text-left">
                                                        {capacityErrors[config.category_id]}
                                                    </p>
                                                )}
                                            </>
                                        )}
                                    </div>
                                </CardContent>
                            </Card>
                        ))}
                    </div>

                    <div className="flex gap-3 pt-2">
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
            </div>
        </DashboardLayout>
    );
}
