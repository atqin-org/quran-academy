import { Button } from "@/Components/ui/button";
import { Input } from "@/Components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/Components/ui/tabs";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/Components/ui/table";
import { Badge } from "@/Components/ui/badge";
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from "@/Components/ui/tooltip";
import DashboardLayout from "@/Layouts/DashboardLayout";
import { PageProps } from "@/types";
import { Head, useForm } from "@inertiajs/react";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/Components/ui/select";
import { Banknote, Calendar, ChevronLeft, ChevronRight, CreditCard, ArrowUpDown, Shield, User } from "lucide-react";
import { useMemo, useState } from "react";

interface DashboardProps extends PageProps {
    student: any & {
        sessions_credit: number;
        subscription: number;
        insurance_expire_at: string | null;
    };
    payments: Payment[];
    sessionsPerMonth: number;
}

interface Payment {
    id: number;
    type: string;
    value: number;
    status: string;
    start_at: string;
    end_at: string;
    user_id: number;
    user?: {
        id: number;
        name: string;
        last_name?: string;
        phone?: string;
        role?: string;
    };
    student_id: number;
    created_at: string;
}

export default function Dashboard({ auth, student, payments, sessionsPerMonth }: DashboardProps) {
    // Pagination and filter state
    const [currentPage, setCurrentPage] = useState(1);
    const [typeFilter, setTypeFilter] = useState<string>("all");
    const [userFilter, setUserFilter] = useState<string>("all");
    const [sortOrder, setSortOrder] = useState<string>("date_desc");
    const itemsPerPage = 5;

    // Get unique users who have handled payments for this student
    const uniqueUsers = useMemo(() => {
        const userMap = new Map<number, { id: number; name: string }>();
        payments.forEach(payment => {
            if (payment.user && !userMap.has(payment.user.id)) {
                userMap.set(payment.user.id, {
                    id: payment.user.id,
                    name: payment.user.name,
                });
            }
        });
        return Array.from(userMap.values());
    }, [payments]);

    const formatDate = (date: Date) => {
        const pad = (num: number) => (num < 10 ? "0" + num : num);
        return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(
            date.getDate()
        )} ${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(
            date.getSeconds()
        )}`;
    };

    // Check if student can pay insurance
    const canPayInsurance = useMemo(() => {
        if (!student.insurance_expire_at) return true;

        const insuranceExpiry = new Date(student.insurance_expire_at);
        const now = new Date();

        // Get the month and year of expiry
        const expiryMonth = insuranceExpiry.getMonth();
        const expiryYear = insuranceExpiry.getFullYear();
        const currentMonth = now.getMonth();
        const currentYear = now.getFullYear();

        // Allow payment if in the last month of insurance or after expiry
        if (currentYear > expiryYear) return true;
        if (currentYear === expiryYear && currentMonth >= expiryMonth) return true;

        return false;
    }, [student.insurance_expire_at]);

    // Calculate next insurance end date (from current expiry if in last month, otherwise next October 31)
    const calculateInsuranceEndDate = useMemo(() => {
        const now = new Date();
        let baseDate: Date;

        // If student has active insurance and we're in the last month, extend from current expiry
        if (student.insurance_expire_at && canPayInsurance) {
            const insuranceExpiry = new Date(student.insurance_expire_at);
            const expiryMonth = insuranceExpiry.getMonth();
            const expiryYear = insuranceExpiry.getFullYear();
            const currentMonth = now.getMonth();
            const currentYear = now.getFullYear();

            // If we're in the last month before expiry (not after), extend from expiry date
            if (currentYear === expiryYear && currentMonth === expiryMonth && now <= insuranceExpiry) {
                baseDate = insuranceExpiry;
            } else {
                baseDate = now;
            }
        } else {
            baseDate = now;
        }

        // Calculate next October 31 from base date
        let nextOctober31 = new Date(baseDate.getFullYear(), 9, 31); // Month 9 = October
        if (baseDate > nextOctober31) {
            nextOctober31 = new Date(baseDate.getFullYear() + 1, 9, 31);
        }

        return nextOctober31;
    }, [student.insurance_expire_at, canPayInsurance]);

    const calculateExpect = (value: number, startAt: string) => {
        if (isNaN(value) || value < 0 || !student.subscription) return null;

        const duration = Math.floor(value / student.subscription);
        const sessions = duration * sessionsPerMonth;
        const endDate = new Date(startAt);
        endDate.setMonth(endDate.getMonth() + duration);

        return {
            duration,
            sessions,
            change: 0,
            start_at: startAt,
            end_at: formatDate(endDate),
        };
    };

    const { data, setData, post, errors } = useForm({
        student_id: student.id,
        user_id: auth.user?.id || 1,
        value: 0,
        type: student.subscription === 0 ? "ins" : "sub",
        status: "in_time",
        expect: calculateExpect(
            0,
            payments[0]?.end_at ?? new Date().toISOString()
        ),
    });

    // Filter and sort payments
    const filteredPayments = useMemo(() => {
        let result = [...payments];

        // Apply type filter
        if (typeFilter !== "all") {
            result = result.filter(payment => payment.type === typeFilter);
        }

        // Apply user filter
        if (userFilter !== "all") {
            result = result.filter(payment => payment.user_id === parseInt(userFilter));
        }

        // Apply sorting
        result.sort((a, b) => {
            switch (sortOrder) {
                case "date_asc":
                    return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
                case "date_desc":
                    return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
                default:
                    return 0;
            }
        });

        return result;
    }, [payments, typeFilter, userFilter, sortOrder]);

    // Pagination calculations
    const totalPages = Math.ceil(filteredPayments.length / itemsPerPage);
    const startIndex = (currentPage - 1) * itemsPerPage;
    const paginatedPayments = filteredPayments.slice(startIndex, startIndex + itemsPerPage);

    // Reset to first page when filter changes
    const handleFilterChange = (filterType: 'type' | 'user' | 'sort', value: string) => {
        if (filterType === 'type') setTypeFilter(value);
        else if (filterType === 'user') setUserFilter(value);
        else if (filterType === 'sort') setSortOrder(value);
        setCurrentPage(1);
    };

    const handleValueChange = (newValue: number) => {
        const validValue = isNaN(newValue) || newValue < 0 ? 0 : newValue;
        const newExpect = calculateExpect(
            validValue,
            data.expect?.start_at ?? new Date().toISOString()
        );
        setData({
            ...data,
            value: validValue,
            expect: newExpect,
        });
    };

    const handleTypeChange = (newType: string) => {
        setData("type", newType);
    };

    const getRoleLabel = (role?: string) => {
        switch (role) {
            case "admin":
                return "مدير";
            case "manager":
                return "مسير";
            case "teacher":
                return "معلم";
            default:
                return role || "-";
        }
    };

    const formatCurrency = (value: number) => {
        return new Intl.NumberFormat("ar-DZ", {
            style: "currency",
            currency: "DZD",
        }).format(value);
    };

    const formatDateShort = (dateStr: string) => {
        if (!dateStr || isNaN(new Date(dateStr).getTime())) return "-";
        return new Intl.DateTimeFormat("ar-DZ", {
            year: "numeric",
            month: "2-digit",
            day: "2-digit",
        }).format(new Date(dateStr));
    };

    const getTypeLabel = (type: string) => {
        switch (type) {
            case "sub":
                return "اشتراك";
            case "ins":
                return "تأمين";
            default:
                return "مخيم / عطلة";
        }
    };

    const getTypeBadgeVariant = (type: string) => {
        switch (type) {
            case "sub":
                return "default";
            case "ins":
                return "secondary";
            default:
                return "outline";
        }
    };

    const getStatusBadge = (status: string) => {
        switch (status) {
            case "in_time":
                return <Badge variant="default" className="bg-green-500">في الوقت</Badge>;
            case "late":
                return <Badge variant="destructive">متأخر</Badge>;
            case "early":
                return <Badge variant="secondary">مبكر</Badge>;
            default:
                return <Badge variant="outline">{status}</Badge>;
        }
    };

    return (
        <DashboardLayout user={auth.user}>
            <Head title={`دفع الطالب - ${student.first_name} ${student.last_name}`} />

            <div className="flex flex-col gap-8">
                {/* Header */}
                <div>
                    <h1 className="text-3xl font-bold text-gray-900">دفع الطالب</h1>
                    <p className="text-gray-600 mt-1">
                        {student.first_name} {student.last_name}
                    </p>
                </div>

                {/* Stats Cards */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {/* Credit Balance */}
                    <div className={`bg-white shadow rounded-lg p-4 border-r-4 ${
                        student.subscription === 0
                            ? 'border-blue-500'
                            : student.sessions_credit < 0
                                ? 'border-red-500'
                                : student.sessions_credit < 4
                                    ? 'border-yellow-500'
                                    : 'border-green-500'
                    }`}>
                        <div className="flex items-center gap-2 text-sm text-gray-500">
                            <CreditCard className="h-4 w-4" />
                            رصيد الحصص
                        </div>
                        <div className="flex items-baseline gap-2 mt-1">
                            <span className={`text-3xl font-bold ${
                                student.subscription === 0
                                    ? 'text-blue-600'
                                    : student.sessions_credit < 0
                                        ? 'text-red-600'
                                        : student.sessions_credit < 4
                                            ? 'text-yellow-600'
                                            : 'text-green-600'
                            }`}>
                                {student.subscription === 0 ? '∞' : student.sessions_credit}
                            </span>
                            {student.subscription !== 0 && (
                                <span className="text-sm text-gray-500">حصة</span>
                            )}
                        </div>
                        {student.subscription === 0 && (
                            <p className="text-xs text-blue-500 mt-1">اشتراك مجاني</p>
                        )}
                        {student.subscription !== 0 && data.expect?.sessions ? (
                            <p className="text-xs text-gray-500 mt-1">
                                بعد الدفع: <span className="font-semibold text-green-600">{student.sessions_credit + data.expect.sessions}</span> حصة
                            </p>
                        ) : null}
                    </div>

                    {/* Subscription Amount */}
                    <div className="bg-white shadow rounded-lg p-4 border-r-4 border-gray-300">
                        <div className="flex items-center gap-2 text-sm text-gray-500">
                            <Banknote className="h-4 w-4" />
                            الاشتراك الشهري
                        </div>
                        <div className="text-2xl font-bold mt-1">
                            {student.subscription === 0 ? (
                                <span className="text-blue-600">معفى</span>
                            ) : (
                                formatCurrency(student.subscription)
                            )}
                        </div>
                    </div>

                    {/* Total Payments */}
                    <div className="bg-white shadow rounded-lg p-4 border-r-4 border-purple-500">
                        <div className="flex items-center gap-2 text-sm text-gray-500">
                            <Calendar className="h-4 w-4" />
                            إجمالي المدفوعات
                        </div>
                        <div className="text-2xl font-bold text-purple-600 mt-1">
                            {payments.length}
                        </div>
                        <p className="text-xs text-gray-500 mt-1">
                            {formatCurrency(payments.reduce((sum, p) => sum + p.value, 0))}
                        </p>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    {/* Payment Form */}
                    <div className="bg-white shadow rounded-lg p-6">
                        <h2 className="text-lg font-semibold mb-4">دفعة جديدة</h2>
                        <Tabs
                            defaultValue={student.subscription == 0 ? "ins" : "sub"}
                            dir="rtl"
                        >
                            <TabsList className="w-full mb-4">
                                <TabsTrigger
                                    disabled={student.subscription == 0}
                                    onClick={() => handleTypeChange("sub")}
                                    value="sub"
                                    className="flex-1"
                                >
                                    <Banknote className="h-4 w-4 ml-2" />
                                    الاشتراك
                                </TabsTrigger>
                                <TabsTrigger
                                    onClick={() => handleTypeChange("ins")}
                                    value="ins"
                                    className="flex-1"
                                >
                                    <Shield className="h-4 w-4 ml-2" />
                                    التأمين
                                </TabsTrigger>
                            </TabsList>

                            <TabsContent value="sub">
                                <div className="flex flex-col gap-4">
                                    <div>
                                        <label className="text-sm font-medium text-gray-700 mb-1 block">
                                            المبلغ
                                        </label>
                                        <Input
                                            type="number"
                                            placeholder="أدخل المبلغ..."
                                            value={data.value}
                                            onChange={(e) => handleValueChange(+e.target.value)}
                                        />
                                    </div>

                                    {data.expect && (
                                        <div className="bg-gray-50 rounded-lg p-4 space-y-2">
                                            <div className="flex justify-between text-sm">
                                                <span className="text-gray-500">المدة:</span>
                                                <span className="font-medium">{data.expect.duration} شهر</span>
                                            </div>
                                            <div className="flex justify-between text-sm">
                                                <span className="text-gray-500">الحصص:</span>
                                                <span className="font-medium">{data.expect.sessions} حصة</span>
                                            </div>
                                            <div className="flex justify-between text-sm">
                                                <span className="text-gray-500">من:</span>
                                                <span className="font-medium">{formatDateShort(data.expect.start_at)}</span>
                                            </div>
                                            <div className="flex justify-between text-sm">
                                                <span className="text-gray-500">إلى:</span>
                                                <span className="font-medium">{formatDateShort(data.expect.end_at)}</span>
                                            </div>
                                        </div>
                                    )}

                                    <Button
                                        className="w-full"
                                        onClick={() => post(`/students/${student.id}/payment`)}
                                        disabled={!data.value || data.value <= 0}
                                    >
                                        <Banknote className="h-4 w-4 ml-2" />
                                        تأكيد الدفع
                                    </Button>
                                    {errors.value && (
                                        <span className="text-red-500 text-sm">{errors.value}</span>
                                    )}
                                </div>
                            </TabsContent>

                            <TabsContent value="ins">
                                <div className="flex flex-col gap-4">
                                    {!canPayInsurance && (
                                        <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
                                            <p className="text-sm text-amber-700">
                                                الطالب مؤمّن حتى {formatDateShort(student.insurance_expire_at || "")}
                                            </p>
                                            <p className="text-xs text-amber-600 mt-1">
                                                يمكن تجديد التأمين في الشهر الأخير فقط
                                            </p>
                                        </div>
                                    )}

                                    <div>
                                        <label className="text-sm font-medium text-gray-700 mb-1 block">
                                            المبلغ
                                        </label>
                                        <Input value={200} disabled />
                                        <p className="text-xs text-gray-500 mt-1">مبلغ التأمين ثابت</p>
                                    </div>

                                    <div className="bg-gray-50 rounded-lg p-4 space-y-2">
                                        {student.insurance_expire_at && (
                                            <div className="flex justify-between text-sm">
                                                <span className="text-gray-500">التأمين الحالي:</span>
                                                <span className="font-medium">
                                                    {formatDateShort(student.insurance_expire_at)}
                                                </span>
                                            </div>
                                        )}
                                        <div className="flex justify-between text-sm">
                                            <span className="text-gray-500">ساري حتى:</span>
                                            <span className="font-medium">
                                                {formatDateShort(calculateInsuranceEndDate.toISOString())}
                                            </span>
                                        </div>
                                    </div>

                                    <Button
                                        className="w-full"
                                        onClick={() => post(`/students/${student.id}/payment`)}
                                        disabled={!canPayInsurance}
                                    >
                                        <Shield className="h-4 w-4 ml-2" />
                                        تأكيد دفع التأمين
                                    </Button>
                                    {errors.value && (
                                        <span className="text-red-500 text-sm">{errors.value}</span>
                                    )}
                                </div>
                            </TabsContent>
                        </Tabs>
                    </div>

                    {/* Payment History */}
                    <div className="bg-white shadow rounded-lg p-6">
                        <h2 className="text-lg font-semibold mb-4">سجل المدفوعات</h2>

                        {/* Filters */}
                        <div className="flex flex-wrap gap-4 mb-4">
                            {/* Type Filter */}
                            <div className="flex flex-col gap-1">
                                <label className="text-xs text-gray-500">النوع</label>
                                <Select value={typeFilter} onValueChange={(v) => handleFilterChange('type', v)}>
                                    <SelectTrigger className="w-28">
                                        <SelectValue placeholder="الكل" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="all">الكل</SelectItem>
                                        <SelectItem value="sub">اشتراك</SelectItem>
                                        <SelectItem value="ins">تأمين</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>

                            {/* User Filter */}
                            <div className="flex flex-col gap-1">
                                <label className="text-xs text-gray-500">بواسطة</label>
                                <Select value={userFilter} onValueChange={(v) => handleFilterChange('user', v)}>
                                    <SelectTrigger className="w-32">
                                        <SelectValue placeholder="الكل" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="all">الكل</SelectItem>
                                        {uniqueUsers.map(user => (
                                            <SelectItem key={user.id} value={user.id.toString()}>
                                                {user.name}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>

                            {/* Sort Order */}
                            <div className="flex flex-col gap-1">
                                <label className="text-xs text-gray-500">الترتيب</label>
                                <Select value={sortOrder} onValueChange={(v) => handleFilterChange('sort', v)}>
                                    <SelectTrigger className="w-32">
                                        <SelectValue placeholder="الأحدث" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="date_desc">الأحدث أولاً</SelectItem>
                                        <SelectItem value="date_asc">الأقدم أولاً</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>
                        {payments.length > 0 ? (
                            <TooltipProvider>
                                <div className="overflow-x-auto">
                                    <Table>
                                        <TableHeader>
                                            <TableRow>
                                                <TableHead className="text-right">النوع</TableHead>
                                                <TableHead className="text-right">المبلغ</TableHead>
                                                <TableHead className="text-right">الفترة</TableHead>
                                                <TableHead className="text-right">بواسطة</TableHead>
                                                <TableHead className="text-right">التاريخ</TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {paginatedPayments.map((payment) => (
                                                <TableRow key={payment.id}>
                                                    <TableCell>
                                                        <Badge variant={getTypeBadgeVariant(payment.type) as any}>
                                                            {getTypeLabel(payment.type)}
                                                        </Badge>
                                                    </TableCell>
                                                    <TableCell className="font-medium">
                                                        {formatCurrency(payment.value)}
                                                    </TableCell>
                                                    <TableCell className="text-sm text-gray-500">
                                                        <div className="flex flex-col">
                                                            <span>{formatDateShort(payment.start_at)}</span>
                                                            <span className="text-xs">إلى {formatDateShort(payment.end_at)}</span>
                                                        </div>
                                                    </TableCell>
                                                    <TableCell>
                                                        <Tooltip>
                                                            <TooltipTrigger asChild>
                                                                <div className="flex items-center gap-1 text-sm text-gray-600 cursor-pointer hover:text-gray-900 transition-colors">
                                                                    <User className="h-3 w-3" />
                                                                    {payment.user?.name || "غير معروف"}
                                                                </div>
                                                            </TooltipTrigger>
                                                            <TooltipContent side="top" className="text-right">
                                                                {payment.user ? (
                                                                    <div className="space-y-1">
                                                                        <p className="font-medium">
                                                                            {payment.user.name} {payment.user.last_name || ""}
                                                                        </p>
                                                                        {payment.user.role && (
                                                                            <p className="text-xs text-gray-400">
                                                                                {getRoleLabel(payment.user.role)}
                                                                            </p>
                                                                        )}
                                                                        {payment.user.phone && (
                                                                            <p className="text-xs text-gray-400" dir="ltr">
                                                                                {payment.user.phone}
                                                                            </p>
                                                                        )}
                                                                    </div>
                                                                ) : (
                                                                    <p>غير معروف</p>
                                                                )}
                                                            </TooltipContent>
                                                        </Tooltip>
                                                    </TableCell>
                                                    <TableCell className="text-sm text-gray-500">
                                                        {formatDateShort(payment.created_at)}
                                                    </TableCell>
                                                </TableRow>
                                            ))}
                                        </TableBody>
                                    </Table>
                                </div>

                                {/* Pagination */}
                                {totalPages > 1 && (
                                    <div className="flex items-center justify-between mt-4 pt-4 border-t">
                                        <p className="text-sm text-gray-500">
                                            عرض {startIndex + 1} - {Math.min(startIndex + itemsPerPage, filteredPayments.length)} من {filteredPayments.length}
                                        </p>
                                        <div className="flex items-center gap-2">
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                                                disabled={currentPage === 1}
                                            >
                                                <ChevronRight className="h-4 w-4" />
                                            </Button>
                                            <span className="text-sm text-gray-600">
                                                {currentPage} / {totalPages}
                                            </span>
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                                                disabled={currentPage === totalPages}
                                            >
                                                <ChevronLeft className="h-4 w-4" />
                                            </Button>
                                        </div>
                                    </div>
                                )}
                            </TooltipProvider>
                        ) : (
                            <div className="text-center py-8 text-gray-500">
                                <Banknote className="h-12 w-12 mx-auto mb-2 opacity-50" />
                                <p>لا توجد مدفوعات سابقة</p>
                            </div>
                        )}

                        {/* No results message */}
                        {payments.length > 0 && filteredPayments.length === 0 && (
                            <div className="text-center py-8 text-gray-500">
                                <Banknote className="h-12 w-12 mx-auto mb-2 opacity-50" />
                                <p>لا توجد مدفوعات مطابقة للفلاتر المحددة</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </DashboardLayout>
    );
}
