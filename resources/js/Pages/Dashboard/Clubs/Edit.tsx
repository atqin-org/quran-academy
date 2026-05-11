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
import {
    ArrowRight,
    Crosshair,
    House,
    Loader2,
    MapPin,
    Save,
} from "lucide-react";
import LocationMap from "@/Components/LocationMap";
import { useState } from "react";

interface Club {
    id: number;
    name: string;
    location: string;
    latitude: number | null;
    longitude: number | null;
    deleted_at: string | null;
}

interface EditProps extends PageProps {
    club: Club;
}

export default function Edit({ auth, club }: EditProps) {
    const { data, setData, post, processing, errors } = useForm({
        name: club.name,
        location: club.location,
        latitude: club.latitude,
        longitude: club.longitude,
    });
    const [locating, setLocating] = useState(false);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        post(`/clubs/${club.id}`);
    };

    const setLatLng = (lat: number | null, lng: number | null) => {
        setData("latitude", lat);
        setData("longitude", lng);
    };

    const useDeviceLocation = () => {
        if (!navigator.geolocation) return;
        setLocating(true);
        navigator.geolocation.getCurrentPosition(
            (pos) => {
                setLatLng(round(pos.coords.latitude), round(pos.coords.longitude));
                setLocating(false);
            },
            () => setLocating(false),
            { enableHighAccuracy: true, timeout: 8000 },
        );
    };

    const coordinateError = errors.latitude || errors.longitude;
    const hasPoint = data.latitude !== null && data.longitude !== null;

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
                    <h1 className="text-3xl font-bold text-gray-900">
                        تعديل النادي
                    </h1>
                </div>

                {/* Form Card */}
                <Card>
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
                        <form
                            onSubmit={handleSubmit}
                            className="grid grid-cols-1 lg:grid-cols-2 gap-6"
                        >
                            <div className="space-y-5">
                                <div className="space-y-2">
                                    <Label htmlFor="name">اسم النادي</Label>
                                    <div className="relative">
                                        <House className="absolute end-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
                                        <Input
                                            id="name"
                                            value={data.name}
                                            onChange={(e) =>
                                                setData("name", e.target.value)
                                            }
                                            placeholder="مثال: نادي الفردوس"
                                            className="pe-9"
                                            dir="rtl"
                                        />
                                    </div>
                                    {errors.name && (
                                        <p className="text-sm text-destructive">
                                            {errors.name}
                                        </p>
                                    )}
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="location">الموقع</Label>
                                    <div className="relative">
                                        <MapPin className="absolute end-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
                                        <Input
                                            id="location"
                                            value={data.location}
                                            onChange={(e) =>
                                                setData("location", e.target.value)
                                            }
                                            placeholder="مثال: حي السلام، الجزائر"
                                            className="pe-9"
                                            dir="rtl"
                                        />
                                    </div>
                                    {errors.location && (
                                        <p className="text-sm text-destructive">
                                            {errors.location}
                                        </p>
                                    )}
                                </div>

                                <div className="space-y-2">
                                    <div className="flex items-center justify-between gap-2">
                                        <Label className="flex items-center gap-1.5">
                                            <MapPin className="h-4 w-4" />
                                            الإحداثيات
                                            <span className="text-xs font-normal text-muted-foreground">
                                                (اختياري)
                                            </span>
                                        </Label>
                                        <div className="flex items-center gap-1">
                                            <Button
                                                type="button"
                                                variant="outline"
                                                size="sm"
                                                onClick={useDeviceLocation}
                                                disabled={locating}
                                                className="gap-1 h-8"
                                            >
                                                <Crosshair className="h-3.5 w-3.5" />
                                                {locating ? "..." : "موقعي"}
                                            </Button>
                                            {hasPoint && (
                                                <Button
                                                    type="button"
                                                    variant="ghost"
                                                    size="sm"
                                                    className="h-8"
                                                    onClick={() => setLatLng(null, null)}
                                                >
                                                    مسح
                                                </Button>
                                            )}
                                        </div>
                                    </div>
                                    <div className="grid grid-cols-2 gap-2">
                                        <Input
                                            type="number"
                                            step="any"
                                            inputMode="decimal"
                                            placeholder="خط العرض"
                                            value={data.latitude ?? ""}
                                            onChange={(e) => {
                                                const v = e.target.value;
                                                if (v === "") {
                                                    setLatLng(null, data.longitude);
                                                    return;
                                                }
                                                const n = parseFloat(v);
                                                if (Number.isFinite(n))
                                                    setLatLng(n, data.longitude);
                                            }}
                                        />
                                        <Input
                                            type="number"
                                            step="any"
                                            inputMode="decimal"
                                            placeholder="خط الطول"
                                            value={data.longitude ?? ""}
                                            onChange={(e) => {
                                                const v = e.target.value;
                                                if (v === "") {
                                                    setLatLng(data.latitude, null);
                                                    return;
                                                }
                                                const n = parseFloat(v);
                                                if (Number.isFinite(n))
                                                    setLatLng(data.latitude, n);
                                            }}
                                        />
                                    </div>
                                    {coordinateError && (
                                        <p className="text-sm text-destructive">
                                            {coordinateError}
                                        </p>
                                    )}
                                </div>

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
                                        {processing
                                            ? "جاري الحفظ..."
                                            : "حفظ التغييرات"}
                                    </Button>
                                    <Link href="/clubs">
                                        <Button type="button" variant="outline">
                                            إلغاء
                                        </Button>
                                    </Link>
                                </div>
                            </div>

                            <div className="lg:sticky lg:top-4 h-fit">
                                <p className="text-xs text-muted-foreground mb-2">
                                    انقر على الخريطة لتحديد الموقع، أو اسحب المؤشر بعد وضعه
                                </p>
                                <LocationMap
                                    latitude={data.latitude}
                                    longitude={data.longitude}
                                    onChange={setLatLng}
                                    className="h-[420px]"
                                />
                            </div>
                        </form>
                    </CardContent>
                </Card>
            </div>
        </DashboardLayout>
    );
}

function round(n: number): number {
    return Math.round(n * 10_000_000) / 10_000_000;
}
