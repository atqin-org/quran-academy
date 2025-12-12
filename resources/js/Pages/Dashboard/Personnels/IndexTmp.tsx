import DashboardLayout from "@/Layouts/DashboardLayout";
import { PageProps } from "@/types";
import { Head, Link, usePage } from "@inertiajs/react";
import { TPersonnelFormDB } from "./Types/Personnel";
import {
    Card,
    CardContent,
    CardHeader,
} from "@/Components/ui/card";
import { Badge } from "@/Components/ui/badge";
import { Button } from "@/Components/ui/button";
import { Input } from "@/Components/ui/input";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/Components/ui/table";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/Components/ui/dropdown-menu";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogClose,
} from "@/Components/ui/dialog";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/Components/ui/select";
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from "@/Components/ui/tooltip";
import {
    MoreHorizontal,
    UserPen,
    Trash2,
    RotateCcw,
    Plus,
    Users,
    UserCheck,
    UserX,
    Search,
    X,
    Clock,
    Filter,
} from "lucide-react";
import { useState, useMemo, useEffect } from "react";
import { toast } from "sonner";

interface DashboardProps extends PageProps {
    personnels: TPersonnelFormDB[];
    clubs: { id: number; name: string }[];
    flash?: {
        success?: string;
        error?: string;
    };
}

const roleLabels: Record<string, string> = {
    admin: "مدير",
    teacher: "أستاذ",
    supervisor: "مشرف",
    staff: "مساعد",
    moderator: "مشرف",
};

function formatRelativeTime(dateString: string | null): string {
    if (!dateString) return "لا يوجد نشاط";

    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffMins < 1) return "الآن";
    if (diffMins < 60) return `منذ ${diffMins} دقيقة`;
    if (diffHours < 24) return `منذ ${diffHours} ساعة`;
    if (diffDays < 7) return `منذ ${diffDays} يوم`;

    return new Intl.DateTimeFormat("ar-DZ", {
        year: "numeric",
        month: "short",
        day: "numeric",
    }).format(date);
}

export default function Dashboard({
    auth,
    personnels,
    clubs,
}: DashboardProps) {
    const { props } = usePage<DashboardProps>();
    const flash = props.flash;

    // Show toast notifications for flash messages
    useEffect(() => {
        if (flash?.success) {
            toast.success(flash.success);
        }
        if (flash?.error) {
            toast.error(flash.error);
        }
    }, [flash]);

    const [statusFilter, setStatusFilter] = useState<"all" | "active" | "deactivated">("all");
    const [searchQuery, setSearchQuery] = useState("");
    const [roleFilter, setRoleFilter] = useState<string>("all");
    const [clubFilter, setClubFilter] = useState<string>("all");

    const filteredPersonnels = useMemo(() => {
        return personnels.filter((p) => {
            // Status filter
            if (statusFilter === "active" && p.deleted_at) return false;
            if (statusFilter === "deactivated" && !p.deleted_at) return false;

            // Search filter
            if (searchQuery) {
                const query = searchQuery.toLowerCase();
                const fullName = `${p.name} ${p.last_name}`.toLowerCase();
                const matchesName = fullName.includes(query);
                const matchesEmail = p.email.toLowerCase().includes(query);
                const matchesPhone = p.phone?.toLowerCase().includes(query);
                if (!matchesName && !matchesEmail && !matchesPhone) return false;
            }

            // Role filter
            if (roleFilter !== "all" && p.role !== roleFilter) return false;

            // Club filter
            if (clubFilter !== "all") {
                const hasClub = p.clubs.some((c) => c.id === parseInt(clubFilter));
                if (!hasClub) return false;
            }

            return true;
        });
    }, [personnels, statusFilter, searchQuery, roleFilter, clubFilter]);

    const uniqueRoles = [...new Set(personnels.map((p) => p.role))];

    const clearFilters = () => {
        setSearchQuery("");
        setRoleFilter("all");
        setClubFilter("all");
        setStatusFilter("all");
    };

    const hasActiveFilters = searchQuery || roleFilter !== "all" || clubFilter !== "all" || statusFilter !== "all";

    return (
        <DashboardLayout user={auth.user}>
            <Head title="الموارد البشرية" />
            <div className="flex flex-col gap-6">
                {/* Header */}
                <div className="flex items-center justify-between">
                    <h1 className="text-3xl font-bold text-gray-900">
                        الموارد البشرية
                    </h1>
                    <Link href="/personnels/create">
                        <Button className="gap-2">
                            <Plus className="h-4 w-4" />
                            سجل جديد
                        </Button>
                    </Link>
                </div>

                {/* Table */}
                <Card>
                    <CardHeader className="pb-4">
                        <div className="flex flex-col gap-2">
                            <div className="flex flex-col sm:flex-row gap-3">
                                <div className="relative flex-1">
                                    <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                    <Input
                                        placeholder="البحث بالاسم، البريد، أو الهاتف..."
                                        value={searchQuery}
                                        onChange={(e) => setSearchQuery(e.target.value)}
                                        className="pr-9"
                                        dir="rtl"
                                    />
                                </div>
                                <Select
                                    value={roleFilter}
                                    onValueChange={setRoleFilter}
                                    dir="rtl"
                                >
                                    <SelectTrigger className="w-full sm:w-[180px]">
                                        <Filter className="h-4 w-4 ml-2" />
                                        <SelectValue placeholder="الدور" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="all">جميع الأدوار</SelectItem>
                                        {uniqueRoles.map((role) => (
                                            <SelectItem key={role} value={role}>
                                                {roleLabels[role] || role}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                                <Select
                                    value={clubFilter}
                                    onValueChange={setClubFilter}
                                    dir="rtl"
                                >
                                    <SelectTrigger className="w-full sm:w-[180px]">
                                        <Filter className="h-4 w-4 ml-2" />
                                        <SelectValue placeholder="النادي" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="all">جميع النوادي</SelectItem>
                                        {clubs.map((club) => (
                                            <SelectItem key={club.id} value={String(club.id)}>
                                                {club.name}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                                {hasActiveFilters && (
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={clearFilters}
                                        className="gap-1 text-muted-foreground"
                                    >
                                        <X className="h-4 w-4" />
                                        مسح الفلاتر
                                    </Button>
                                )}
                            </div>
                            <span className="text-xs text-muted-foreground">
                                {filteredPersonnels.length} من {personnels.length} موظف
                            </span>
                        </div>
                    </CardHeader>
                    <CardContent>
                        <div className="rounded-md border">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead className="text-right">
                                            الاسم الكامل
                                        </TableHead>
                                        <TableHead className="text-right">
                                            البريد الإلكتروني
                                        </TableHead>
                                        <TableHead className="text-right">
                                            الهاتف
                                        </TableHead>
                                        <TableHead className="text-right">
                                            الدور
                                        </TableHead>
                                        <TableHead className="text-right">
                                            النوادي
                                        </TableHead>
                                        <TableHead className="text-right">
                                            آخر نشاط
                                        </TableHead>
                                        <TableHead className="text-right">
                                            الحالة
                                        </TableHead>
                                        <TableHead className="text-right w-[70px]">
                                            الإجراءات
                                        </TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {filteredPersonnels.length === 0 ? (
                                        <TableRow>
                                            <TableCell
                                                colSpan={8}
                                                className="h-24 text-center"
                                            >
                                                لا توجد نتائج
                                            </TableCell>
                                        </TableRow>
                                    ) : (
                                        filteredPersonnels.map((personnel) => (
                                            <TableRow
                                                key={personnel.id}
                                                className={
                                                    personnel.deleted_at
                                                        ? "bg-gray-50 opacity-75"
                                                        : ""
                                                }
                                            >
                                                <TableCell className="font-medium">
                                                    {personnel.name}{" "}
                                                    {personnel.last_name}
                                                </TableCell>
                                                <TableCell>
                                                    {personnel.email}
                                                </TableCell>
                                                <TableCell dir="ltr" className="text-right">
                                                    {personnel.phone || "-"}
                                                </TableCell>
                                                <TableCell>
                                                    <Badge variant="outline">
                                                        {roleLabels[
                                                            personnel.role
                                                        ] || personnel.role}
                                                    </Badge>
                                                </TableCell>
                                                <TableCell>
                                                    <div className="flex gap-1 flex-wrap items-center">
                                                        {personnel.clubs.slice(0, 3).map(
                                                            (club) => (
                                                                <Badge
                                                                    key={club.id}
                                                                    variant="secondary"
                                                                    className="text-xs"
                                                                >
                                                                    {club.name}
                                                                </Badge>
                                                            )
                                                        )}
                                                        {personnel.clubs.length > 3 && (
                                                            <TooltipProvider>
                                                                <Tooltip>
                                                                    <TooltipTrigger asChild>
                                                                        <span>
                                                                            <Badge
                                                                                variant="outline"
                                                                                className="text-xs cursor-pointer"
                                                                            >
                                                                                +{personnel.clubs.length - 3}
                                                                            </Badge>
                                                                        </span>
                                                                    </TooltipTrigger>
                                                                    <TooltipContent dir="rtl">
                                                                        <div className="flex flex-col gap-1">
                                                                            {personnel.clubs.slice(3).map((club) => (
                                                                                <span key={club.id}>{club.name}</span>
                                                                            ))}
                                                                        </div>
                                                                    </TooltipContent>
                                                                </Tooltip>
                                                            </TooltipProvider>
                                                        )}
                                                    </div>
                                                </TableCell>
                                                <TableCell>
                                                    <div className="flex items-center gap-1 text-muted-foreground text-sm">
                                                        <Clock className="h-3 w-3" />
                                                        {formatRelativeTime(personnel.last_activity_at)}
                                                    </div>
                                                </TableCell>
                                                <TableCell>
                                                    {personnel.deleted_at ? (
                                                        <Badge
                                                            variant="destructive"
                                                            className="gap-1"
                                                        >
                                                            <UserX className="h-3 w-3" />
                                                            معطل
                                                        </Badge>
                                                    ) : (
                                                        <Badge
                                                            variant="default"
                                                            className="gap-1 bg-emerald-500 hover:bg-emerald-600"
                                                        >
                                                            <UserCheck className="h-3 w-3" />
                                                            نشط
                                                        </Badge>
                                                    )}
                                                </TableCell>
                                                <TableCell>
                                                    <PersonnelActions
                                                        personnel={personnel}
                                                        currentUserId={auth.user.id}
                                                    />
                                                </TableCell>
                                            </TableRow>
                                        ))
                                    )}
                                </TableBody>
                            </Table>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </DashboardLayout>
    );
}

function PersonnelActions({ personnel, currentUserId }: { personnel: TPersonnelFormDB; currentUserId: number }) {
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
    const [restoreDialogOpen, setRestoreDialogOpen] = useState(false);

    const isSelf = personnel.id === currentUserId;

    return (
        <>
            <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
                <Dialog open={restoreDialogOpen} onOpenChange={setRestoreDialogOpen}>
                    <DropdownMenu dir="rtl">
                        <DropdownMenuTrigger asChild>
                            <Button
                                variant="ghost"
                                className="h-8 w-8 p-0"
                            >
                                <span className="sr-only">فتح القائمة</span>
                                <MoreHorizontal className="h-4 w-4" />
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                            <DropdownMenuItem asChild>
                                <Link
                                    href={`/personnels/${personnel.id}/edit`}
                                    className="flex items-center gap-2 cursor-pointer"
                                >
                                    <UserPen className="h-4 w-4" />
                                    تعديل
                                </Link>
                            </DropdownMenuItem>

                            {personnel.deleted_at ? (
                                <DropdownMenuItem
                                    onClick={() => setRestoreDialogOpen(true)}
                                    className="flex items-center gap-2 cursor-pointer text-emerald-600 focus:text-emerald-600"
                                >
                                    <RotateCcw className="h-4 w-4" />
                                    تفعيل الحساب
                                </DropdownMenuItem>
                            ) : (
                                <DropdownMenuItem
                                    onClick={() => {
                                        if (isSelf) {
                                            toast.error("لا يمكنك تعطيل حسابك الخاص");
                                            return;
                                        }
                                        setDeleteDialogOpen(true);
                                    }}
                                    className={`flex items-center gap-2 cursor-pointer ${
                                        isSelf
                                            ? "text-muted-foreground opacity-50"
                                            : "text-red-600 focus:text-red-600"
                                    }`}
                                >
                                    <Trash2 className="h-4 w-4" />
                                    تعطيل الحساب
                                    {isSelf && <span className="text-xs">(حسابك)</span>}
                                </DropdownMenuItem>
                            )}
                        </DropdownMenuContent>
                    </DropdownMenu>

                    {/* Restore Dialog */}
                    <DialogContent dir="rtl">
                        <DialogHeader>
                            <DialogTitle>تفعيل الحساب</DialogTitle>
                            <DialogDescription>
                                هل أنت متأكد من تفعيل حساب{" "}
                                <span className="font-semibold">
                                    {personnel.name} {personnel.last_name}
                                </span>
                                ؟ سيتمكن الموظف من الوصول إلى النظام مرة أخرى.
                            </DialogDescription>
                        </DialogHeader>
                        <DialogFooter className="gap-2 sm:gap-0">
                            <DialogClose asChild>
                                <Button variant="outline">إلغاء</Button>
                            </DialogClose>
                            <Link
                                href={`/personnels/${personnel.id}/restore`}
                                method="post"
                                as="button"
                                preserveState={false}
                                className="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 bg-emerald-500 text-white hover:bg-emerald-600 h-9 px-4 py-2"
                            >
                                <RotateCcw className="h-4 w-4" />
                                تفعيل
                            </Link>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>

                {/* Delete Dialog */}
                <DialogContent dir="rtl">
                    <DialogHeader>
                        <DialogTitle>تعطيل الحساب</DialogTitle>
                        <DialogDescription>
                            هل أنت متأكد من تعطيل حساب{" "}
                            <span className="font-semibold">
                                {personnel.name} {personnel.last_name}
                            </span>
                            ؟ لن يتمكن الموظف من الوصول إلى النظام، لكن يمكنك
                            إعادة تفعيله لاحقاً.
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter className="gap-2 sm:gap-0">
                        <DialogClose asChild>
                            <Button variant="outline">إلغاء</Button>
                        </DialogClose>
                        <Link
                            href={`/personnels/${personnel.id}`}
                            method="delete"
                            as="button"
                            preserveState={false}
                            className="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 bg-destructive text-destructive-foreground hover:bg-destructive/90 h-9 px-4 py-2"
                        >
                            <Trash2 className="h-4 w-4" />
                            تعطيل
                        </Link>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </>
    );
}
