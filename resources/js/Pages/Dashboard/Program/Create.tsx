import DashboardLayout from "@/Layouts/DashboardLayout";
import { PageProps } from "@/types";
import { Head, Link } from "@inertiajs/react";
import { useForm } from "@inertiajs/react";
import { Input } from "@/Components/ui/input";
import { Textarea } from "@/Components/ui/textarea";
import { Button } from "@/Components/ui/button";
import { Checkbox } from "@/Components/ui/checkbox";
import { Label } from "@/Components/ui/label";
import {
    Select,
    SelectTrigger,
    SelectValue,
    SelectContent,
    SelectItem,
} from "@/Components/ui/select";
import MultipleSelector from "@/Components/ui/MultipleSelector";

export default function ProgramCreate({
    auth,
    subjects,
    clubs,
    categories,
    days,
}: any) {
    const { data, setData, post, errors } = useForm({
        name: "",
        description: "",
        subject_id: "",
        club_id: "",
        category_id: "",
        days_of_week: [],
        is_active: true,
        start_date: "",
        end_date: "",
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        post(route("programs.store"));
    };

    return (
        <DashboardLayout user={auth.user}>
            <Head title="Programs" />
            <div className="w-full bg-white rounded-2xl shadow p-6" dir="rtl">
                <h2 className="text-2xl font-bold mb-6">إضافة برنامج جديد</h2>
                <form onSubmit={handleSubmit} className="flex flex-col gap-4">
                    {/* اسم البرنامج */}
                    <div className="flex flex-col gap-2">
                        <Label>اسم البرنامج</Label>
                        <Input
                            value={data.name}
                            onChange={(e) => setData("name", e.target.value)}
                            placeholder="أدخل اسم البرنامج"
                        />
                        {errors.name && (
                            <p className="text-red-500 text-sm">
                                {errors.name}
                            </p>
                        )}
                    </div>


                    {/* المادة */}
                    <div className="flex flex-col gap-2">
                        <Label>المادة</Label>
                        <Select
                            value={data.subject_id}
                            onValueChange={(val) => setData("subject_id", val)}
                        >
                            <SelectTrigger>
                                <SelectValue placeholder="اختر مادة" />
                            </SelectTrigger>
                            <SelectContent>
                                {subjects.map((s: any) => (
                                    <SelectItem key={s.id} value={String(s.id)}>
                                        {s.name}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                        {errors.subject_id && (
                            <p className="text-red-500 text-sm">
                                {errors.subject_id}
                            </p>
                        )}
                    </div>

                    {/* النادي */}
                    <div className="flex flex-col gap-2">
                        <Label>النادي</Label>
                        <Select
                            value={data.club_id}
                            onValueChange={(val) => setData("club_id", val)}
                        >
                            <SelectTrigger>
                                <SelectValue placeholder="اختر نادي" />
                            </SelectTrigger>
                            <SelectContent>
                                {clubs.map((c: any) => (
                                    <SelectItem key={c.id} value={String(c.id)}>
                                        {c.name}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                        {errors.club_id && (
                            <p className="text-red-500 text-sm">
                                {errors.club_id}
                            </p>
                        )}
                    </div>

                    {/* الفئة */}
                    <div className="flex flex-col gap-2">
                        <Label>الفئة</Label>
                        <Select
                            value={data.category_id}
                            onValueChange={(val) => setData("category_id", val)}
                        >
                            <SelectTrigger>
                                <SelectValue placeholder="اختر فئة" />
                            </SelectTrigger>
                            <SelectContent>
                                {categories.map((cat: any) => (
                                    <SelectItem
                                        key={cat.id}
                                        value={String(cat.id)}
                                    >
                                        {cat.name}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                        {errors.category_id && (
                            <p className="text-red-500 text-sm">
                                {errors.category_id}
                            </p>
                        )}
                    </div>

                    {/* أيام الأسبوع */}
                    <div className="flex flex-col gap-2">
                        <Label>أيام الأسبوع</Label>
                        <MultipleSelector
                            options={days}
                            value={data.days_of_week}
                            onChange={(vals) => setData("days_of_week", vals)}
                            placeholder="اختر الأيام"
                        />
                        {errors.days_of_week && (
                            <p className="text-red-500 text-sm">
                                {errors.days_of_week}
                            </p>
                        )}
                    </div>

           
                    {/* تاريخ البداية */}
                    <div className="flex flex-col gap-2">
                        <Label>تاريخ البداية</Label>
                        <Input
                            type="date"
                            value={data.start_date}
                            onChange={(e) =>
                                setData("start_date", e.target.value)
                            }
                        />
                    </div>

                    {/* تاريخ النهاية */}
                    <div className="flex flex-col gap-2">
                        <Label>تاريخ النهاية</Label>
                        <Input
                            type="date"
                            value={data.end_date}
                            onChange={(e) =>
                                setData("end_date", e.target.value)
                            }
                        />
                    </div>

                    <Button type="submit" className="mt-4 w-full">
                        حفظ
                    </Button>
                </form>
            </div>
        </DashboardLayout>
    );
}
