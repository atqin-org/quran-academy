import { Card, CardContent, CardHeader, CardTitle } from "@/Components/ui/card";
import { Progress } from "@/Components/ui/progress";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/Components/ui/select";
import { Button } from "@/Components/ui/button";
import { Calendar } from "@/Components/ui/calendar";
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/Components/ui/popover";
import {
    ChartConfig,
    ChartContainer,
    ChartTooltip,
    ChartTooltipContent,
    ChartLegend,
    ChartLegendContent,
} from "@/Components/ui/chart";
import DashboardLayout from "@/Layouts/DashboardLayout";
import { Head, router } from "@inertiajs/react";
import {
    LineChart,
    Line,
    CartesianGrid,
    XAxis,
    YAxis,
    PieChart,
    Pie,
    Cell,
} from "recharts";
import {
    CalendarIcon,
    User,
    Users,
    BookOpen,
    CheckCircle,
    XCircle,
    AlertCircle,
    TrendingUp,
    Clock,
} from "lucide-react";
import { useState } from "react";
import { format } from "date-fns";
import { ar } from "date-fns/locale";
import { cn } from "@/lib/utils";

interface AttendanceStats {
    present: number;
    absent: number;
    excused: number;
    total: number;
    rate: number;
}

interface Props {
    auth: { user: any };
    student: {
        id: number;
        name: string;
        first_name: string;
        last_name: string;
        birthdate: string;
        gender: string;
        ahzab: number;
        ahzab_up: number;
        ahzab_down: number;
        subscription: number;
        club: { id: number; name: string } | null;
        category: { id: number; name: string } | null;
        father: { name: string; phone: string } | null;
        mother: { name: string; phone: string } | null;
    };
    progress: number;
    attendanceStats: AttendanceStats;
    progressTimeline: { date: string; progress: number }[];
    monthlyAttendance: any[];
    filters: {
        range: string;
        start_date: string | null;
        end_date: string | null;
    };
}

const attendanceChartConfig = {
    present: {
        label: "حاضر",
        color: "#22c55e",
    },
    absent: {
        label: "غائب",
        color: "#ef4444",
    },
    excused: {
        label: "معذور",
        color: "#f59e0b",
    },
} satisfies ChartConfig;

const progressChartConfig = {
    progress: {
        label: "التقدم",
        color: "#4f46e5",
    },
} satisfies ChartConfig;

export default function Show({
    auth,
    student,
    progress,
    attendanceStats,
    progressTimeline,
    filters,
}: Props) {
    const [range, setRange] = useState(filters.range || "all");
    const [startDate, setStartDate] = useState<Date | undefined>(
        filters.start_date ? new Date(filters.start_date) : undefined
    );
    const [endDate, setEndDate] = useState<Date | undefined>(
        filters.end_date ? new Date(filters.end_date) : undefined
    );

    const handleFilterChange = (newRange: string) => {
        setRange(newRange);
        if (newRange !== "custom") {
            router.visit(route("students.show", student.id), {
                data: { range: newRange },
                preserveState: true,
                preserveScroll: true,
            });
        }
    };

    const applyCustomRange = () => {
        if (startDate && endDate) {
            router.visit(route("students.show", student.id), {
                data: {
                    range: "custom",
                    start_date: format(startDate, "yyyy-MM-dd"),
                    end_date: format(endDate, "yyyy-MM-dd"),
                },
                preserveState: true,
                preserveScroll: true,
            });
        }
    };

    // Prepare pie chart data
    const pieData = [
        { name: "present", value: attendanceStats.present, fill: "#22c55e" },
        { name: "absent", value: attendanceStats.absent, fill: "#ef4444" },
        { name: "excused", value: attendanceStats.excused, fill: "#f59e0b" },
    ].filter((item) => item.value > 0);

    return (
        <DashboardLayout user={auth.user}>
            <Head title={`الطالب ${student.name}`} />

            <div className="space-y-6">
                {/* Header with filters */}
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                    <div>
                        <h1 className="text-2xl font-bold">{student.name}</h1>
                        <p className="text-muted-foreground text-sm">
                            {student.club?.name} - {student.category?.name}
                        </p>
                    </div>

                    <div className="flex flex-wrap items-center gap-2">
                        <Select value={range} onValueChange={handleFilterChange}>
                            <SelectTrigger className="w-[140px]">
                                <SelectValue placeholder="الفترة الزمنية" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">الكل</SelectItem>
                                <SelectItem value="week">آخر أسبوع</SelectItem>
                                <SelectItem value="month">آخر شهر</SelectItem>
                                <SelectItem value="3months">آخر 3 أشهر</SelectItem>
                                <SelectItem value="6months">آخر 6 أشهر</SelectItem>
                                <SelectItem value="year">آخر سنة</SelectItem>
                                <SelectItem value="custom">تخصيص</SelectItem>
                            </SelectContent>
                        </Select>

                        {range === "custom" && (
                            <div className="flex items-center gap-2">
                                <Popover>
                                    <PopoverTrigger asChild>
                                        <Button
                                            variant="outline"
                                            className={cn(
                                                "w-[130px] justify-start text-right font-normal",
                                                !startDate && "text-muted-foreground"
                                            )}
                                        >
                                            <CalendarIcon className="ml-2 h-4 w-4" />
                                            {startDate
                                                ? format(startDate, "dd/MM/yyyy")
                                                : "من"}
                                        </Button>
                                    </PopoverTrigger>
                                    <PopoverContent className="w-auto p-0">
                                        <Calendar
                                            mode="single"
                                            selected={startDate}
                                            onSelect={setStartDate}
                                            locale={ar}
                                        />
                                    </PopoverContent>
                                </Popover>

                                <Popover>
                                    <PopoverTrigger asChild>
                                        <Button
                                            variant="outline"
                                            className={cn(
                                                "w-[130px] justify-start text-right font-normal",
                                                !endDate && "text-muted-foreground"
                                            )}
                                        >
                                            <CalendarIcon className="ml-2 h-4 w-4" />
                                            {endDate
                                                ? format(endDate, "dd/MM/yyyy")
                                                : "إلى"}
                                        </Button>
                                    </PopoverTrigger>
                                    <PopoverContent className="w-auto p-0">
                                        <Calendar
                                            mode="single"
                                            selected={endDate}
                                            onSelect={setEndDate}
                                            locale={ar}
                                        />
                                    </PopoverContent>
                                </Popover>

                                <Button onClick={applyCustomRange} size="sm">
                                    تطبيق
                                </Button>
                            </div>
                        )}
                    </div>
                </div>

                {/* Stats Cards */}
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                    <Card>
                        <CardContent className="p-4">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-green-100 rounded-lg">
                                    <CheckCircle className="h-5 w-5 text-green-600" />
                                </div>
                                <div>
                                    <p className="text-sm text-muted-foreground">حاضر</p>
                                    <p className="text-2xl font-bold">{attendanceStats.present}</p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardContent className="p-4">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-red-100 rounded-lg">
                                    <XCircle className="h-5 w-5 text-red-600" />
                                </div>
                                <div>
                                    <p className="text-sm text-muted-foreground">غائب</p>
                                    <p className="text-2xl font-bold">{attendanceStats.absent}</p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardContent className="p-4">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-amber-100 rounded-lg">
                                    <AlertCircle className="h-5 w-5 text-amber-600" />
                                </div>
                                <div>
                                    <p className="text-sm text-muted-foreground">معذور</p>
                                    <p className="text-2xl font-bold">{attendanceStats.excused}</p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardContent className="p-4">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-blue-100 rounded-lg">
                                    <TrendingUp className="h-5 w-5 text-blue-600" />
                                </div>
                                <div>
                                    <p className="text-sm text-muted-foreground">نسبة الحضور</p>
                                    <p className="text-2xl font-bold">{attendanceStats.rate}%</p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Main content grid */}
                <div className="grid gap-4 md:grid-cols-2">
                    {/* Student Info */}
                    <Card>
                        <CardHeader className="pb-2">
                            <CardTitle className="text-lg flex items-center gap-2">
                                <User className="h-5 w-5" />
                                معلومات الطالب
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-2 text-sm">
                            <div className="flex justify-between py-1 border-b">
                                <span className="text-muted-foreground">الاسم</span>
                                <span className="font-medium">{student.name}</span>
                            </div>
                            <div className="flex justify-between py-1 border-b">
                                <span className="text-muted-foreground">النادي</span>
                                <span className="font-medium">{student.club?.name || "-"}</span>
                            </div>
                            <div className="flex justify-between py-1 border-b">
                                <span className="text-muted-foreground">الفئة</span>
                                <span className="font-medium">{student.category?.name || "-"}</span>
                            </div>
                            <div className="flex justify-between py-1 border-b">
                                <span className="text-muted-foreground">الجنس</span>
                                <span className="font-medium">
                                    {student.gender === "male" ? "ذكر" : "أنثى"}
                                </span>
                            </div>
                            <div className="flex justify-between py-1 border-b">
                                <span className="text-muted-foreground">الأب</span>
                                <span className="font-medium">{student.father?.name || "-"}</span>
                            </div>
                            <div className="flex justify-between py-1">
                                <span className="text-muted-foreground">الأم</span>
                                <span className="font-medium">{student.mother?.name || "-"}</span>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Quran Progress */}
                    <Card>
                        <CardHeader className="pb-2">
                            <CardTitle className="text-lg flex items-center gap-2">
                                <BookOpen className="h-5 w-5" />
                                التقدّم في القرآن
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-4">
                                <div>
                                    <div className="flex justify-between mb-2">
                                        <span className="text-sm text-muted-foreground">التقدم الكلي</span>
                                        <span className="text-sm font-medium">{progress}%</span>
                                    </div>
                                    <Progress value={progress} className="h-3" />
                                </div>

                                <div className="grid grid-cols-2 gap-4 pt-2">
                                    <div className="text-center p-3 bg-muted rounded-lg">
                                        <p className="text-2xl font-bold">{student.ahzab_up || 0}</p>
                                        <p className="text-xs text-muted-foreground">أحزاب (حفظ)</p>
                                    </div>
                                    <div className="text-center p-3 bg-muted rounded-lg">
                                        <p className="text-2xl font-bold">{student.ahzab_down || 0}</p>
                                        <p className="text-xs text-muted-foreground">أحزاب (مراجعة)</p>
                                    </div>
                                </div>

                                <div className="text-center pt-2">
                                    <p className="text-3xl font-bold text-primary">
                                        {student.ahzab || 0}
                                    </p>
                                    <p className="text-sm text-muted-foreground">إجمالي الأحزاب</p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Attendance Pie Chart */}
                    <Card>
                        <CardHeader className="pb-2">
                            <CardTitle className="text-lg flex items-center gap-2">
                                <Clock className="h-5 w-5" />
                                توزيع الحضور
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            {pieData.length > 0 ? (
                                <ChartContainer
                                    config={attendanceChartConfig}
                                    className="mx-auto aspect-square h-[200px]"
                                >
                                    <PieChart>
                                        <ChartTooltip
                                            cursor={false}
                                            content={<ChartTooltipContent hideLabel />}
                                        />
                                        <Pie
                                            data={pieData}
                                            dataKey="value"
                                            nameKey="name"
                                            innerRadius={50}
                                            outerRadius={80}
                                            paddingAngle={2}
                                        >
                                            {pieData.map((entry, index) => (
                                                <Cell key={`cell-${index}`} fill={entry.fill} />
                                            ))}
                                        </Pie>
                                        <ChartLegend
                                            content={<ChartLegendContent nameKey="name" />}
                                        />
                                    </PieChart>
                                </ChartContainer>
                            ) : (
                                <div className="h-[200px] flex items-center justify-center text-muted-foreground">
                                    لا توجد بيانات
                                </div>
                            )}
                        </CardContent>
                    </Card>

                    {/* Guardian Info */}
                    <Card>
                        <CardHeader className="pb-2">
                            <CardTitle className="text-lg flex items-center gap-2">
                                <Users className="h-5 w-5" />
                                معلومات أولياء الأمور
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            {student.father && (
                                <div className="p-3 bg-muted rounded-lg">
                                    <p className="font-medium">{student.father.name || "الأب"}</p>
                                    <p className="text-sm text-muted-foreground" dir="ltr">
                                        {student.father.phone || "-"}
                                    </p>
                                </div>
                            )}
                            {student.mother && (
                                <div className="p-3 bg-muted rounded-lg">
                                    <p className="font-medium">{student.mother.name || "الأم"}</p>
                                    <p className="text-sm text-muted-foreground" dir="ltr">
                                        {student.mother.phone || "-"}
                                    </p>
                                </div>
                            )}
                            {!student.father && !student.mother && (
                                <div className="text-center text-muted-foreground py-4">
                                    لا توجد معلومات
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </div>

                {/* Progress Timeline Chart */}
                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-lg">التقدّم مع مرور الوقت</CardTitle>
                    </CardHeader>
                    <CardContent>
                        {progressTimeline.length > 0 ? (
                            <ChartContainer config={progressChartConfig} className="h-[300px] w-full">
                                <LineChart
                                    data={progressTimeline}
                                    margin={{ top: 5, right: 10, left: 10, bottom: 5 }}
                                >
                                    <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                                    <XAxis
                                        dataKey="date"
                                        tick={{ fontSize: 12 }}
                                        tickFormatter={(value) => {
                                            const date = new Date(value);
                                            return `${date.getDate()}/${date.getMonth() + 1}`;
                                        }}
                                        className="text-muted-foreground"
                                    />
                                    <YAxis
                                        domain={[0, 100]}
                                        tickFormatter={(value) => `${value}%`}
                                        tick={{ fontSize: 12 }}
                                        className="text-muted-foreground"
                                    />
                                    <ChartTooltip
                                        content={
                                            <ChartTooltipContent
                                                labelFormatter={(label) => {
                                                    const date = new Date(label);
                                                    return format(date, "dd MMMM yyyy", { locale: ar });
                                                }}
                                            />
                                        }
                                    />
                                    <Line
                                        type="monotone"
                                        dataKey="progress"
                                        stroke="var(--color-progress)"
                                        strokeWidth={2}
                                        dot={{ fill: "var(--color-progress)", strokeWidth: 2 }}
                                        activeDot={{ r: 6 }}
                                    />
                                </LineChart>
                            </ChartContainer>
                        ) : (
                            <div className="h-[300px] flex items-center justify-center text-muted-foreground">
                                لا توجد بيانات للتقدم في الفترة المحددة
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>
        </DashboardLayout>
    );
}
