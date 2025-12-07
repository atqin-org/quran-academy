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
import { ArrowRight, House, Loader2, MapPin, Save } from "lucide-react";

interface Club {
    id: number;
    name: string;
    location: string;
    deleted_at: string | null;
}

interface EditProps extends PageProps {
    club: Club;
}

export default function Edit({ auth, club }: EditProps) {
    const { data, setData, post, processing, errors } = useForm({
        name: club.name,
        location: club.location,
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        post(`/clubs/${club.id}`);
    };

    return (
        <DashboardLayout user={auth.user}>
            <Head title={`تعديل ${club.name}`} />
            <div className="flex flex-col gap-6">
                {/* Header */}
                <div className="flex items-center gap-4">
                    <Link href="/clubs">
                        <Button variant="outline" size="icon">
                            <ArrowRight className="h-4 w-4" />
                        </Button>
                    </Link>
                    <h1 className="text-3xl font-bold text-gray-900">تعديل النادي</h1>
                </div>

                {/* Form Card */}
                <Card className="max-w-2xl">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <House className="h-5 w-5" />
                            بيانات النادي
                        </CardTitle>
                        <CardDescription>
                            تعديل بيانات نادي {club.name}
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <form onSubmit={handleSubmit} className="space-y-6">
                            <div className="space-y-2">
                                <Label htmlFor="name">اسم النادي</Label>
                                <div className="relative">
                                    <House className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                    <Input
                                        id="name"
                                        value={data.name}
                                        onChange={(e) => setData("name", e.target.value)}
                                        placeholder="مثال: نادي الفردوس"
                                        className="pr-9"
                                        dir="rtl"
                                    />
                                </div>
                                {errors.name && (
                                    <p className="text-sm text-destructive">{errors.name}</p>
                                )}
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="location">الموقع</Label>
                                <div className="relative">
                                    <MapPin className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                    <Input
                                        id="location"
                                        value={data.location}
                                        onChange={(e) => setData("location", e.target.value)}
                                        placeholder="مثال: حي السلام، الجزائر"
                                        className="pr-9"
                                        dir="rtl"
                                    />
                                </div>
                                {errors.location && (
                                    <p className="text-sm text-destructive">{errors.location}</p>
                                )}
                            </div>

                            <div className="flex gap-3">
                                <Button type="submit" disabled={processing} className="gap-2">
                                    {processing ? (
                                        <Loader2 className="h-4 w-4 animate-spin" />
                                    ) : (
                                        <Save className="h-4 w-4" />
                                    )}
                                    {processing ? "جاري الحفظ..." : "حفظ التغييرات"}
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
