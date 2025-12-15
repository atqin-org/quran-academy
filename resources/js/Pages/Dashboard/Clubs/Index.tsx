import DashboardLayout from "@/Layouts/DashboardLayout";
import { PageProps } from "@/types";
import { Head, Link, usePage } from "@inertiajs/react";
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
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from "@/Components/ui/tooltip";
import {
    MoreHorizontal,
    Pencil,
    Trash2,
    RotateCcw,
    Plus,
    House,
    MapPin,
    Users,
    Search,
    X,
    CheckCircle,
    XCircle,
    Calendar,
    GraduationCap,
} from "lucide-react";
import { useState, useMemo, useEffect } from "react";
import { toast } from "sonner";

interface Club {
    id: number;
    name: string;
    location: string;
    students_count: number;
    users_count: number;
    users_by_role?: Record<string, number>;
    students_by_category?: Record<string, number>;
    deleted_at: string | null;
    created_at: string;
    updated_at: string;
}

const roleLabels: Record<string, string> = {
    admin: "مسؤول",
    moderator: "مشرف",
    staff: "إداري",
    teacher: "معلم",
};

interface DashboardProps extends PageProps {
    clubs: Club[];
    flash?: {
        success?: string;
        error?: string;
    };
}

export default function Index({ auth, clubs }: DashboardProps) {
    const { props } = usePage<DashboardProps>();
    const flash = props.flash;

    useEffect(() => {
        if (flash?.success) {
            toast.success(flash.success);
        }
        if (flash?.error) {
            toast.error(flash.error);
        }
    }, [flash]);

    const [statusFilter, setStatusFilter] = useState<"all" | "active" | "deleted">("all");
    const [searchQuery, setSearchQuery] = useState("");

    const filteredClubs = useMemo(() => {
        return clubs.filter((club) => {
            if (statusFilter === "active" && club.deleted_at) return false;
            if (statusFilter === "deleted" && !club.deleted_at) return false;

            if (searchQuery) {
                const query = searchQuery.toLowerCase();
                const matchesName = club.name.toLowerCase().includes(query);
                const matchesLocation = club.location.toLowerCase().includes(query);
                if (!matchesName && !matchesLocation) return false;
            }

            return true;
        });
    }, [clubs, statusFilter, searchQuery]);

    const clearFilters = () => {
        setSearchQuery("");
        setStatusFilter("all");
    };

    const hasActiveFilters = searchQuery || statusFilter !== "all";

    return (
        <DashboardLayout user={auth.user}>
            <Head title="النوادي" />
            <div className="flex flex-col gap-6">
                {/* Header */}
                <div className="flex items-center justify-between">
                    <h1 className="text-3xl font-bold text-gray-900">النوادي</h1>
                    <Link href="/clubs/create">
                        <Button className="gap-2">
                            <Plus className="h-4 w-4" />
                            نادي جديد
                        </Button>
                    </Link>
                </div>

                {/* Table */}
                <Card>
                    <CardHeader className="pb-4">
                        <div className="flex flex-col gap-2">
                            <div className="flex items-center gap-3">
                                {/* Search */}
                                <div className="relative flex-1 max-w-sm">
                                    <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                    <Input
                                        placeholder="البحث بالاسم أو الموقع..."
                                        value={searchQuery}
                                        onChange={(e) => setSearchQuery(e.target.value)}
                                        className="pr-9"
                                        dir="rtl"
                                    />
                                </div>
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
                                {filteredClubs.length} من {clubs.length} نادي
                            </span>
                        </div>
                    </CardHeader>
                    <CardContent>
                        <div className="rounded-md border">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead className="text-right">الاسم</TableHead>
                                        <TableHead className="text-right">الموقع</TableHead>
                                        <TableHead className="text-center">عدد الطلاب</TableHead>
                                        <TableHead className="text-center">عدد الموظفين</TableHead>
                                        <TableHead className="text-center">الحالة</TableHead>
                                        <TableHead className="text-right w-[70px]">الإجراءات</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {filteredClubs.length === 0 ? (
                                        <TableRow>
                                            <TableCell colSpan={6} className="h-24 text-center">
                                                لا توجد نتائج
                                            </TableCell>
                                        </TableRow>
                                    ) : (
                                        filteredClubs.map((club) => (
                                            <TableRow
                                                key={club.id}
                                                className={club.deleted_at ? "bg-gray-50 opacity-75" : ""}
                                            >
                                                <TableCell className="font-medium">
                                                    <div className="flex items-center gap-2">
                                                        <House className="h-4 w-4 text-muted-foreground" />
                                                        {club.name}
                                                    </div>
                                                </TableCell>
                                                <TableCell>
                                                    <div className="flex items-center gap-2">
                                                        <MapPin className="h-4 w-4 text-muted-foreground" />
                                                        {club.location}
                                                    </div>
                                                </TableCell>
                                                <TableCell className="text-center">
                                                    <TooltipProvider>
                                                        <Tooltip>
                                                            <TooltipTrigger asChild>
                                                                <span className="inline-flex cursor-help">
                                                                    <Badge variant="secondary">
                                                                        <GraduationCap className="h-3 w-3 ml-1" />
                                                                        {club.students_count}
                                                                    </Badge>
                                                                </span>
                                                            </TooltipTrigger>
                                                            <TooltipContent dir="rtl" className="p-3">
                                                                <div className="space-y-2">
                                                                    <p className="font-semibold text-sm border-b pb-1">الطلاب حسب الفئة</p>
                                                                    {club.students_by_category && Object.keys(club.students_by_category).length > 0 ? (
                                                                        <div className="space-y-1">
                                                                            {Object.entries(club.students_by_category).map(([category, count]) => (
                                                                                <div key={category} className="flex justify-between gap-4 text-sm">
                                                                                    <span className="text-muted-foreground">{category}</span>
                                                                                    <span className="font-medium">{count}</span>
                                                                                </div>
                                                                            ))}
                                                                        </div>
                                                                    ) : (
                                                                        <p className="text-sm text-muted-foreground">لا يوجد طلاب</p>
                                                                    )}
                                                                </div>
                                                            </TooltipContent>
                                                        </Tooltip>
                                                    </TooltipProvider>
                                                </TableCell>
                                                <TableCell className="text-center">
                                                    <TooltipProvider>
                                                        <Tooltip>
                                                            <TooltipTrigger asChild>
                                                                <span className="inline-flex cursor-help">
                                                                    <Badge variant="outline">
                                                                        <Users className="h-3 w-3 ml-1" />
                                                                        {club.users_count}
                                                                    </Badge>
                                                                </span>
                                                            </TooltipTrigger>
                                                            <TooltipContent dir="rtl" className="p-3">
                                                                <div className="space-y-2">
                                                                    <p className="font-semibold text-sm border-b pb-1">الموظفين حسب الدور</p>
                                                                    {club.users_by_role && Object.keys(club.users_by_role).length > 0 ? (
                                                                        <div className="space-y-1">
                                                                            {Object.entries(club.users_by_role).map(([role, count]) => (
                                                                                <div key={role} className="flex justify-between gap-4 text-sm">
                                                                                    <span className="text-muted-foreground">{roleLabels[role] || role}</span>
                                                                                    <span className="font-medium">{count}</span>
                                                                                </div>
                                                                            ))}
                                                                        </div>
                                                                    ) : (
                                                                        <p className="text-sm text-muted-foreground">لا يوجد موظفين</p>
                                                                    )}
                                                                </div>
                                                            </TooltipContent>
                                                        </Tooltip>
                                                    </TooltipProvider>
                                                </TableCell>
                                                <TableCell className="text-center">
                                                    {club.deleted_at ? (
                                                        <Badge variant="destructive" className="gap-1">
                                                            <XCircle className="h-3 w-3" />
                                                            محذوف
                                                        </Badge>
                                                    ) : (
                                                        <Badge
                                                            variant="default"
                                                            className="gap-1 bg-emerald-500 hover:bg-emerald-600"
                                                        >
                                                            <CheckCircle className="h-3 w-3" />
                                                            نشط
                                                        </Badge>
                                                    )}
                                                </TableCell>
                                                <TableCell>
                                                    <ClubActions club={club} />
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

function ClubActions({ club }: { club: Club }) {
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
    const [restoreDialogOpen, setRestoreDialogOpen] = useState(false);

    const hasStudents = club.students_count > 0;

    return (
        <>
            <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
                <Dialog open={restoreDialogOpen} onOpenChange={setRestoreDialogOpen}>
                    <DropdownMenu dir="rtl">
                        <DropdownMenuTrigger asChild>
                            <Button variant="ghost" className="h-8 w-8 p-0">
                                <span className="sr-only">فتح القائمة</span>
                                <MoreHorizontal className="h-4 w-4" />
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                            <DropdownMenuItem asChild>
                                <Link
                                    href={`/clubs/${club.id}/edit`}
                                    className="flex items-center gap-2 cursor-pointer"
                                >
                                    <Pencil className="h-4 w-4" />
                                    تعديل
                                </Link>
                            </DropdownMenuItem>

                            <DropdownMenuItem asChild>
                                <Link
                                    href={`/clubs/${club.id}/sessions-config`}
                                    className="flex items-center gap-2 cursor-pointer"
                                >
                                    <Calendar className="h-4 w-4" />
                                    إعدادات الحصص
                                </Link>
                            </DropdownMenuItem>

                            {club.deleted_at ? (
                                <DropdownMenuItem
                                    onClick={() => setRestoreDialogOpen(true)}
                                    className="flex items-center gap-2 cursor-pointer text-emerald-600 focus:text-emerald-600"
                                >
                                    <RotateCcw className="h-4 w-4" />
                                    استعادة
                                </DropdownMenuItem>
                            ) : (
                                <DropdownMenuItem
                                    onClick={() => {
                                        if (hasStudents) {
                                            toast.error("لا يمكن حذف النادي لأنه يحتوي على طلاب");
                                            return;
                                        }
                                        setDeleteDialogOpen(true);
                                    }}
                                    className={`flex items-center gap-2 cursor-pointer ${
                                        hasStudents
                                            ? "text-muted-foreground opacity-50"
                                            : "text-red-600 focus:text-red-600"
                                    }`}
                                >
                                    <Trash2 className="h-4 w-4" />
                                    حذف
                                </DropdownMenuItem>
                            )}
                        </DropdownMenuContent>
                    </DropdownMenu>

                    {/* Restore Dialog */}
                    <DialogContent dir="rtl">
                        <DialogHeader>
                            <DialogTitle>استعادة النادي</DialogTitle>
                            <DialogDescription>
                                هل أنت متأكد من استعادة نادي{" "}
                                <span className="font-semibold">{club.name}</span>؟
                            </DialogDescription>
                        </DialogHeader>
                        <DialogFooter className="gap-2 sm:gap-0">
                            <DialogClose asChild>
                                <Button variant="outline">إلغاء</Button>
                            </DialogClose>
                            <Link
                                href={`/clubs/${club.id}/restore`}
                                method="post"
                                as="button"
                                preserveState={false}
                                className="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 bg-emerald-500 text-white hover:bg-emerald-600 h-9 px-4 py-2"
                            >
                                <RotateCcw className="h-4 w-4" />
                                استعادة
                            </Link>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>

                {/* Delete Dialog */}
                <DialogContent dir="rtl">
                    <DialogHeader>
                        <DialogTitle>حذف النادي</DialogTitle>
                        <DialogDescription>
                            هل أنت متأكد من حذف نادي{" "}
                            <span className="font-semibold">{club.name}</span>؟ يمكنك
                            استعادته لاحقاً.
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter className="gap-2 sm:gap-0">
                        <DialogClose asChild>
                            <Button variant="outline">إلغاء</Button>
                        </DialogClose>
                        <Link
                            href={`/clubs/${club.id}`}
                            method="delete"
                            as="button"
                            preserveState={false}
                            className="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 bg-destructive text-destructive-foreground hover:bg-destructive/90 h-9 px-4 py-2"
                        >
                            <Trash2 className="h-4 w-4" />
                            حذف
                        </Link>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </>
    );
}
