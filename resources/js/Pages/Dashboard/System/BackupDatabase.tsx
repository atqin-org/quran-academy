import { Head } from "@inertiajs/react";
import { BackupSettings, DatabaseBackup, PageProps } from "@/types";
import DashboardLayout from "@/Layouts/DashboardLayout";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/Components/ui/table";
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
import { Switch } from "@/Components/ui/switch";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/Components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/Components/ui/tabs";
import axios from "axios";
import { useEffect, useState } from "react";
import {
    CloudDownload,
    Database,
    FileArchive,
    Loader2,
    RefreshCw,
    Save,
    Settings,
    Trash2,
} from "lucide-react";
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from "@/Components/ui/tooltip";
import { formatDistanceToNow } from "date-fns";
import { ar } from "date-fns/locale";
import { toast } from "sonner";

export default function BackupDatabase({ auth }: PageProps) {
    const [backups, setBackups] = useState<DatabaseBackup[]>([]);
    const [isBackingUp, setIsBackingUp] = useState(false);
    const [isLoading, setIsLoading] = useState(true);

    // Settings state
    const [settings, setSettings] = useState<BackupSettings>({
        schedule_enabled: false,
        schedule_frequency: "daily",
        schedule_minute: 0,
        schedule_hour: 2,
        schedule_day_of_week: 0,
        schedule_day_of_month: 1,
        max_backups: 10,
        retention_days: 14,
    });
    const [isSavingSettings, setIsSavingSettings] = useState(false);

    // Load backups
    const loadBackups = () => {
        setIsLoading(true);
        axios
            .get("/backup")
            .then((response) => {
                setBackups(response.data);
            })
            .catch((error) => {
                toast.error(
                    error.response?.data?.message ||
                        "فشل في تحميل النسخ الاحتياطية"
                );
            })
            .finally(() => {
                setIsLoading(false);
            });
    };

    // Load settings
    const loadSettings = () => {
        axios
            .get("/backup/settings")
            .then((response) => {
                setSettings(response.data);
            })
            .catch((error) => {
                toast.error(
                    error.response?.data?.message ||
                        "فشل في تحميل إعدادات النسخ الاحتياطي"
                );
            });
    };

    useEffect(() => {
        loadBackups();
        loadSettings();
    }, []);

    // Create backup
    const backup = () => {
        setIsBackingUp(true);
        axios
            .post("/backup")
            .then((response) => {
                toast.success(
                    response.data?.message || "تم بدء عملية النسخ الاحتياطي"
                );
                // Reload backups after a delay to allow the job to complete
                setTimeout(loadBackups, 3000);
            })
            .catch((error) => {
                toast.error(
                    error.response?.data?.message ||
                        "فشل في إنشاء النسخة الاحتياطية"
                );
            })
            .finally(() => {
                setIsBackingUp(false);
            });
    };

    // Download backup
    const download = (path: string) => {
        window.location.href = `/backup/download/${encodeURIComponent(path)}`;
    };

    // Delete backup
    const deleteBackup = (id: number) => {
        axios
            .delete("/backup", { data: { id } })
            .then((response) => {
                toast.success(
                    response.data?.message || "تم حذف النسخة الاحتياطية"
                );
                setBackups((prev) => prev.filter((b) => b.id !== id));
            })
            .catch((error) => {
                toast.error(
                    error.response?.data?.message ||
                        "فشل في حذف النسخة الاحتياطية"
                );
            });
    };

    // Save settings
    const saveSettings = () => {
        setIsSavingSettings(true);
        axios
            .put("/backup/settings", settings)
            .then((response) => {
                toast.success(response.data?.message || "تم حفظ الإعدادات");
            })
            .catch((error) => {
                toast.error(
                    error.response?.data?.message || "فشل في حفظ الإعدادات"
                );
            })
            .finally(() => {
                setIsSavingSettings(false);
            });
    };

    const frequencyLabels: Record<string, string> = {
        hourly: "كل ساعة",
        daily: "يومياً",
        weekly: "أسبوعياً",
        monthly: "شهرياً",
    };

    return (
        <DashboardLayout user={auth.user}>
            <Head title="النسخ الاحتياطي" />

            <div className="flex flex-col gap-4 w-full overflow-y-scroll scroll-smooth py-4">
                <Card className="relative h-fit w-full overflow-hidden">
                    <CardHeader>
                        <CardTitle className="flex items-center justify-between text-2xl font-bold">
                            <span>النسخ الاحتياطية لقاعدة البيانات</span>
                            <Database className="size-7" />
                        </CardTitle>
                        <CardDescription>
                            يمكنك هنا إنشاء نسخ احتياطية لقاعدة البيانات الخاصة
                            بالنظام وتحميلها وإدارة إعدادات النسخ الاحتياطي التلقائي.
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <Tabs defaultValue="backups" className="w-full">
                            <TabsList className="grid w-full grid-cols-2 mb-4">
                                <TabsTrigger
                                    value="backups"
                                    className="flex items-center gap-2"
                                >
                                    <FileArchive className="size-4" />
                                    النسخ الاحتياطية
                                </TabsTrigger>
                                <TabsTrigger
                                    value="settings"
                                    className="flex items-center gap-2"
                                >
                                    <Settings className="size-4" />
                                    الإعدادات
                                </TabsTrigger>
                            </TabsList>

                            {/* Backups Tab */}
                            <TabsContent value="backups" className="space-y-4">
                                <div className="flex items-center gap-2">
                                    <Button
                                        onClick={backup}
                                        disabled={isBackingUp}
                                        className="flex items-center gap-2"
                                    >
                                        {isBackingUp ? (
                                            <Loader2 className="size-4 animate-spin" />
                                        ) : (
                                            <Save className="size-4" />
                                        )}
                                        {isBackingUp
                                            ? "جاري النسخ..."
                                            : "إنشاء نسخة احتياطية"}
                                    </Button>
                                    <Button
                                        variant="outline"
                                        onClick={loadBackups}
                                        disabled={isLoading}
                                    >
                                        <RefreshCw
                                            className={`size-4 ${isLoading ? "animate-spin" : ""}`}
                                        />
                                    </Button>
                                </div>

                                {isLoading ? (
                                    <div className="flex items-center justify-center py-8">
                                        <Loader2 className="size-8 animate-spin text-muted-foreground" />
                                    </div>
                                ) : backups.length > 0 ? (
                                    <Table>
                                        <TableHeader>
                                            <TableRow>
                                                <TableHead className="text-center">
                                                    الملف
                                                </TableHead>
                                                <TableHead className="text-center hidden sm:table-cell">
                                                    الحجم
                                                </TableHead>
                                                <TableHead className="text-center hidden sm:table-cell">
                                                    النوع
                                                </TableHead>
                                                <TableHead className="text-center hidden sm:table-cell">
                                                    تاريخ الإنشاء
                                                </TableHead>
                                                <TableHead className="text-center">
                                                    الإجراءات
                                                </TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {backups.map((backup) => (
                                                <TableRow key={backup.id}>
                                                    <TableCell>
                                                        <div className="flex items-center gap-2 font-mono text-sm">
                                                            <FileArchive className="size-4 text-muted-foreground" />
                                                            <span className="truncate max-w-[150px]">
                                                                {backup.path}
                                                            </span>
                                                        </div>
                                                    </TableCell>
                                                    <TableCell className="text-center hidden sm:table-cell">
                                                        <span className="text-sm text-muted-foreground">
                                                            {backup.formatted_size}
                                                        </span>
                                                    </TableCell>
                                                    <TableCell className="text-center hidden sm:table-cell">
                                                        <span
                                                            className={`text-xs px-2 py-1 rounded-full ${
                                                                backup.is_scheduled
                                                                    ? "bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300"
                                                                    : "bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300"
                                                            }`}
                                                        >
                                                            {backup.is_scheduled
                                                                ? "تلقائي"
                                                                : "يدوي"}
                                                        </span>
                                                    </TableCell>
                                                    <TableCell className="text-center hidden sm:table-cell">
                                                        <TooltipProvider>
                                                            <Tooltip>
                                                                <TooltipTrigger
                                                                    asChild
                                                                >
                                                                    <span className="text-sm">
                                                                        {formatDistanceToNow(
                                                                            new Date(
                                                                                backup.created_at
                                                                            ),
                                                                            {
                                                                                locale: ar,
                                                                                addSuffix:
                                                                                    true,
                                                                            }
                                                                        )}
                                                                    </span>
                                                                </TooltipTrigger>
                                                                <TooltipContent>
                                                                    {
                                                                        backup.created_at
                                                                    }
                                                                </TooltipContent>
                                                            </Tooltip>
                                                        </TooltipProvider>
                                                    </TableCell>
                                                    <TableCell>
                                                        <div className="flex justify-end gap-1">
                                                            <TooltipProvider>
                                                                <Tooltip>
                                                                    <TooltipTrigger
                                                                        asChild
                                                                    >
                                                                        <Button
                                                                            variant="outline"
                                                                            size="icon"
                                                                            onClick={() =>
                                                                                download(
                                                                                    backup.path
                                                                                )
                                                                            }
                                                                        >
                                                                            <CloudDownload className="size-4" />
                                                                        </Button>
                                                                    </TooltipTrigger>
                                                                    <TooltipContent>
                                                                        تحميل
                                                                    </TooltipContent>
                                                                </Tooltip>
                                                            </TooltipProvider>

                                                            <TooltipProvider>
                                                                <Tooltip>
                                                                    <TooltipTrigger
                                                                        asChild
                                                                    >
                                                                        <Button
                                                                            variant="destructive"
                                                                            size="icon"
                                                                            onClick={() =>
                                                                                deleteBackup(
                                                                                    backup.id
                                                                                )
                                                                            }
                                                                        >
                                                                            <Trash2 className="size-4" />
                                                                        </Button>
                                                                    </TooltipTrigger>
                                                                    <TooltipContent>
                                                                        حذف
                                                                    </TooltipContent>
                                                                </Tooltip>
                                                            </TooltipProvider>
                                                        </div>
                                                    </TableCell>
                                                </TableRow>
                                            ))}
                                        </TableBody>
                                    </Table>
                                ) : (
                                    <div className="rounded-lg border border-dashed p-8 text-center">
                                        <FileArchive className="mx-auto size-12 text-muted-foreground" />
                                        <p className="mt-2 text-sm text-muted-foreground">
                                            لم يتم إنشاء أي نسخ احتياطية حتى
                                            الآن.
                                        </p>
                                    </div>
                                )}
                            </TabsContent>

                            {/* Settings Tab */}
                            <TabsContent value="settings" className="space-y-4">
                                {/* Enable Scheduled Backups */}
                                <div className="flex items-center justify-between rounded-lg border p-3">
                                    <div className="space-y-0.5">
                                        <Label className="text-base">النسخ الاحتياطي التلقائي</Label>
                                        <p className="text-sm text-muted-foreground">
                                            تفعيل النسخ الاحتياطي التلقائي حسب الجدول المحدد
                                        </p>
                                    </div>
                                    <Switch
                                        checked={settings.schedule_enabled}
                                        onCheckedChange={(checked) =>
                                            setSettings((prev) => ({
                                                ...prev,
                                                schedule_enabled: checked,
                                            }))
                                        }
                                    />
                                </div>

                                {/* Schedule Settings Grid */}
                                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                                    {/* Frequency */}
                                    <div className="grid gap-1">
                                        <Label htmlFor="frequency" className="text-sm">التكرار</Label>
                                        <Select
                                            value={settings.schedule_frequency}
                                            onValueChange={(value) =>
                                                setSettings((prev) => ({
                                                    ...prev,
                                                    schedule_frequency: value as BackupSettings["schedule_frequency"],
                                                }))
                                            }
                                            disabled={!settings.schedule_enabled}
                                        >
                                            <SelectTrigger>
                                                <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {Object.entries(frequencyLabels).map(([value, label]) => (
                                                    <SelectItem key={value} value={value}>{label}</SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>

                                    {/* Monthly: Day of Month */}
                                    {settings.schedule_frequency === "monthly" && (
                                        <div className="grid gap-1">
                                            <Label htmlFor="day_of_month" className="text-sm">يوم الشهر</Label>
                                            <Select
                                                value={String(settings.schedule_day_of_month)}
                                                onValueChange={(value) =>
                                                    setSettings((prev) => ({
                                                        ...prev,
                                                        schedule_day_of_month: parseInt(value),
                                                    }))
                                                }
                                                disabled={!settings.schedule_enabled}
                                            >
                                                <SelectTrigger>
                                                    <SelectValue />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    {Array.from({ length: 28 }, (_, i) => i + 1).map((day) => (
                                                        <SelectItem key={day} value={String(day)}>{day}</SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                        </div>
                                    )}

                                    {/* Weekly: Day of Week */}
                                    {settings.schedule_frequency === "weekly" && (
                                        <div className="grid gap-1">
                                            <Label htmlFor="day_of_week" className="text-sm">يوم الأسبوع</Label>
                                            <Select
                                                value={String(settings.schedule_day_of_week)}
                                                onValueChange={(value) =>
                                                    setSettings((prev) => ({
                                                        ...prev,
                                                        schedule_day_of_week: parseInt(value),
                                                    }))
                                                }
                                                disabled={!settings.schedule_enabled}
                                            >
                                                <SelectTrigger>
                                                    <SelectValue />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="0">الأحد</SelectItem>
                                                    <SelectItem value="1">الإثنين</SelectItem>
                                                    <SelectItem value="2">الثلاثاء</SelectItem>
                                                    <SelectItem value="3">الأربعاء</SelectItem>
                                                    <SelectItem value="4">الخميس</SelectItem>
                                                    <SelectItem value="5">الجمعة</SelectItem>
                                                    <SelectItem value="6">السبت</SelectItem>
                                                </SelectContent>
                                            </Select>
                                        </div>
                                    )}

                                    {/* Daily, Weekly, Monthly: Hour */}
                                    {settings.schedule_frequency !== "hourly" && (
                                        <div className="grid gap-1">
                                            <Label htmlFor="hour" className="text-sm">الساعة</Label>
                                            <Select
                                                value={String(settings.schedule_hour)}
                                                onValueChange={(value) =>
                                                    setSettings((prev) => ({
                                                        ...prev,
                                                        schedule_hour: parseInt(value),
                                                    }))
                                                }
                                                disabled={!settings.schedule_enabled}
                                            >
                                                <SelectTrigger>
                                                    <SelectValue />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    {Array.from({ length: 24 }, (_, i) => i).map((hour) => (
                                                        <SelectItem key={hour} value={String(hour)}>
                                                            {hour.toString().padStart(2, "0")}:00
                                                        </SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                        </div>
                                    )}

                                    {/* Minute */}
                                    <div className="grid gap-1">
                                        <Label htmlFor="minute" className="text-sm">الدقيقة</Label>
                                        <Select
                                            value={String(settings.schedule_minute)}
                                            onValueChange={(value) =>
                                                setSettings((prev) => ({
                                                    ...prev,
                                                    schedule_minute: parseInt(value),
                                                }))
                                            }
                                            disabled={!settings.schedule_enabled}
                                        >
                                            <SelectTrigger>
                                                <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {Array.from({ length: 60 }, (_, i) => i).map((minute) => (
                                                    <SelectItem key={minute} value={String(minute)}>
                                                        :{minute.toString().padStart(2, "0")}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>
                                </div>

                                {/* Schedule Description */}
                                <p className="text-xs text-muted-foreground">
                                    {settings.schedule_frequency === "hourly" && "سيتم النسخ عند هذه الدقيقة من كل ساعة"}
                                    {settings.schedule_frequency === "daily" && "سيتم النسخ يومياً في الوقت المحدد"}
                                    {settings.schedule_frequency === "weekly" && "سيتم النسخ أسبوعياً في اليوم والوقت المحددين"}
                                    {settings.schedule_frequency === "monthly" && "سيتم النسخ شهرياً في اليوم والوقت المحددين"}
                                </p>

                                {/* Retention Settings Grid */}
                                <div className="grid grid-cols-2 gap-3">
                                    {/* Max Backups */}
                                    <div className="grid gap-1">
                                        <Label htmlFor="max_backups" className="text-sm">الحد الأقصى للنسخ</Label>
                                        <Input
                                            id="max_backups"
                                            type="number"
                                            min={1}
                                            max={100}
                                            value={settings.max_backups}
                                            onChange={(e) =>
                                                setSettings((prev) => ({
                                                    ...prev,
                                                    max_backups: parseInt(e.target.value),
                                                }))
                                            }
                                        />
                                        <p className="text-xs text-muted-foreground">سيتم حذف النسخ القديمة عند تجاوز هذا العدد</p>
                                    </div>

                                    {/* Retention Days */}
                                    <div className="grid gap-1">
                                        <Label htmlFor="retention_days" className="text-sm">مدة الاحتفاظ (أيام)</Label>
                                        <Input
                                            id="retention_days"
                                            type="number"
                                            min={1}
                                            max={365}
                                            value={settings.retention_days}
                                            onChange={(e) =>
                                                setSettings((prev) => ({
                                                    ...prev,
                                                    retention_days: parseInt(e.target.value),
                                                }))
                                            }
                                        />
                                        <p className="text-xs text-muted-foreground">سيتم حذف النسخ الأقدم من هذه المدة</p>
                                    </div>
                                </div>

                                <Button
                                    onClick={saveSettings}
                                    disabled={isSavingSettings}
                                    className="mt-2"
                                >
                                    {isSavingSettings ? (
                                        <Loader2 className="size-4 animate-spin ml-2" />
                                    ) : (
                                        <Save className="size-4 ml-2" />
                                    )}
                                    حفظ الإعدادات
                                </Button>
                            </TabsContent>
                        </Tabs>
                    </CardContent>
                </Card>
            </div>
        </DashboardLayout>
    );
}
