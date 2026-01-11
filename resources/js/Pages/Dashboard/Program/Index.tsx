import { Badge } from "@/Components/ui/badge";
import { Button } from "@/Components/ui/button";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/Components/ui/dialog";
import {
    DropdownMenu,
    DropdownMenuCheckboxItem,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/Components/ui/dropdown-menu";
import { Input } from "@/Components/ui/input";
import { Separator } from "@/Components/ui/separator";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/Components/ui/table";
import DashboardLayout from "@/Layouts/DashboardLayout";
import { Head, Link, router } from "@inertiajs/react";
import {
    BookOpen,
    Calendar,
    Eye,
    MoreHorizontal,
    Pencil,
    Plus,
    Search,
    Trash2,
    Users,
} from "lucide-react";
import { useMemo, useState } from "react";

interface Program {
    id: number;
    name: string;
    subject: { id: number; name: string };
    club: { id: number; name: string };
    category: { id: number; name: string };
    start_date: string;
    end_date: string;
    days_of_week: string[] | null;
}

interface ProgramsProps {
    auth: any;
    programs: {
        data: Program[];
        links: any[];
    };
}

export default function Programs({ auth, programs }: ProgramsProps) {
    const [searchQuery, setSearchQuery] = useState("");
    const [subjectFilter, setSubjectFilter] = useState<string[]>([]);
    const [clubFilter, setClubFilter] = useState<string[]>([]);
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
    const [programToDelete, setProgramToDelete] = useState<Program | null>(
        null
    );

    // Get unique subjects and clubs for filters
    const subjects = useMemo(() => {
        const uniqueSubjects = new Map<number, string>();
        programs.data.forEach((p) => {
            if (p.subject) uniqueSubjects.set(p.subject.id, p.subject.name);
        });
        return Array.from(uniqueSubjects, ([id, name]) => ({ id, name }));
    }, [programs.data]);

    const clubs = useMemo(() => {
        const uniqueClubs = new Map<number, string>();
        programs.data.forEach((p) => {
            if (p.club) uniqueClubs.set(p.club.id, p.club.name);
        });
        return Array.from(uniqueClubs, ([id, name]) => ({ id, name }));
    }, [programs.data]);

    // Filter programs
    const filteredPrograms = useMemo(() => {
        return programs.data.filter((program) => {
            const matchesSearch =
                searchQuery === "" ||
                program.name
                    ?.toLowerCase()
                    .includes(searchQuery.toLowerCase()) ||
                program.subject?.name
                    ?.toLowerCase()
                    .includes(searchQuery.toLowerCase()) ||
                program.club?.name
                    ?.toLowerCase()
                    .includes(searchQuery.toLowerCase());

            const matchesSubject =
                subjectFilter.length === 0 ||
                subjectFilter.includes(program.subject?.id?.toString());

            const matchesClub =
                clubFilter.length === 0 ||
                clubFilter.includes(program.club?.id?.toString());

            return matchesSearch && matchesSubject && matchesClub;
        });
    }, [programs.data, searchQuery, subjectFilter, clubFilter]);

    const toggleSubjectFilter = (subjectId: string) => {
        setSubjectFilter((prev) =>
            prev.includes(subjectId)
                ? prev.filter((id) => id !== subjectId)
                : [...prev, subjectId]
        );
    };

    const toggleClubFilter = (clubId: string) => {
        setClubFilter((prev) =>
            prev.includes(clubId)
                ? prev.filter((id) => id !== clubId)
                : [...prev, clubId]
        );
    };

    const handleDelete = () => {
        if (programToDelete) {
            router.delete(route("programs.destroy", programToDelete.id), {
                onSuccess: () => {
                    setDeleteDialogOpen(false);
                    setProgramToDelete(null);
                },
            });
        }
    };

    const translatedLinks = programs.links.map((link, index) => {
        if (index === 0) {
            link.label = "&laquo;السابق";
        } else if (index === programs.links.length - 1) {
            link.label = "التالي&raquo;";
        }
        return link;
    });

    return (
        <DashboardLayout user={auth.user}>
            <Head title="البرامج" />
            <div className="flex flex-col items-center justify-start h-full">
                {/* Header */}
                <div className="flex items-center justify-between w-full">
                    <h1 className="text-2xl font-bold text-gray-900">
                        البرامج
                    </h1>
                    <Link href={route("programs.create")}>
                        <Button className="gap-2">
                            <Plus className="h-4 w-4" />
                            برنامج جديد
                        </Button>
                    </Link>
                </div>

                {/* Search and Filters */}
                <div className="w-full">
                    <div className="flex items-center py-4 gap-2 w-full">
                        {/* Search */}
                        <div className="flex items-center gap-2 w-full">
                            <Input
                                placeholder="ابحث عن برنامج.."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                            />
                            <Button type="button" variant="outline">
                                <Search />
                            </Button>
                        </div>

                        {/* Filters - Desktop */}
                        <div className="hidden xl:flex items-center w-fit gap-2">
                            <Separator
                                orientation="vertical"
                                className="h-8 w-0.5 bg-neutral-300 rounded-3xl"
                            />
                            <div className="flex items-center gap-2 w-fit rounded-md">
                                <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                        <Button
                                            variant="outline"
                                            className="flex gap-1"
                                        >
                                            <BookOpen className="h-4 w-4" />
                                            <span>المادة</span>
                                            <Badge className="px-1.5">
                                                {subjectFilter.length}
                                            </Badge>
                                        </Button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent align="end">
                                        {subjects.map((subject) => (
                                            <DropdownMenuCheckboxItem
                                                dir="rtl"
                                                key={subject.id}
                                                className="capitalize"
                                                checked={subjectFilter.includes(
                                                    subject.id.toString()
                                                )}
                                                onClick={(e) => {
                                                    e.preventDefault();
                                                    e.stopPropagation();
                                                    toggleSubjectFilter(
                                                        subject.id.toString()
                                                    );
                                                }}
                                            >
                                                {subject.name}
                                            </DropdownMenuCheckboxItem>
                                        ))}
                                    </DropdownMenuContent>
                                </DropdownMenu>

                                <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                        <Button
                                            variant="outline"
                                            className="flex gap-1"
                                        >
                                            <Users className="h-4 w-4" />
                                            <span>النادي</span>
                                            <Badge className="px-1.5">
                                                {clubFilter.length}
                                            </Badge>
                                        </Button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent align="end">
                                        {clubs.map((club) => (
                                            <DropdownMenuCheckboxItem
                                                dir="rtl"
                                                key={club.id}
                                                className="capitalize"
                                                checked={clubFilter.includes(
                                                    club.id.toString()
                                                )}
                                                onClick={(e) => {
                                                    e.preventDefault();
                                                    e.stopPropagation();
                                                    toggleClubFilter(
                                                        club.id.toString()
                                                    );
                                                }}
                                            >
                                                {club.name}
                                            </DropdownMenuCheckboxItem>
                                        ))}
                                    </DropdownMenuContent>
                                </DropdownMenu>
                            </div>
                        </div>
                    </div>

                    {/* Filters - Mobile */}
                    <div className="flex lg:flex-row flex-col justify-between items-start lg:items-center gap-2 xl:hidden my-3">
                        <div className="flex items-center gap-2 w-fit rounded-md">
                            <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                    <Button
                                        variant="outline"
                                        className="flex gap-1"
                                    >
                                        <BookOpen className="h-4 w-4" />
                                        <span>المادة</span>
                                        <Badge className="px-1.5">
                                            {subjectFilter.length}
                                        </Badge>
                                    </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                    {subjects.map((subject) => (
                                        <DropdownMenuCheckboxItem
                                            dir="rtl"
                                            key={subject.id}
                                            className="capitalize"
                                            checked={subjectFilter.includes(
                                                subject.id.toString()
                                            )}
                                            onClick={(e) => {
                                                e.preventDefault();
                                                e.stopPropagation();
                                                toggleSubjectFilter(
                                                    subject.id.toString()
                                                );
                                            }}
                                        >
                                            {subject.name}
                                        </DropdownMenuCheckboxItem>
                                    ))}
                                </DropdownMenuContent>
                            </DropdownMenu>

                            <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                    <Button
                                        variant="outline"
                                        className="flex gap-1"
                                    >
                                        <Users className="h-4 w-4" />
                                        <span>النادي</span>
                                        <Badge className="px-1.5">
                                            {clubFilter.length}
                                        </Badge>
                                    </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                    {clubs.map((club) => (
                                        <DropdownMenuCheckboxItem
                                            dir="rtl"
                                            key={club.id}
                                            className="capitalize"
                                            checked={clubFilter.includes(
                                                club.id.toString()
                                            )}
                                            onClick={(e) => {
                                                e.preventDefault();
                                                e.stopPropagation();
                                                toggleClubFilter(
                                                    club.id.toString()
                                                );
                                            }}
                                        >
                                            {club.name}
                                        </DropdownMenuCheckboxItem>
                                    ))}
                                </DropdownMenuContent>
                            </DropdownMenu>
                        </div>
                    </div>

                    {/* Table */}
                    <div className="rounded-md border">
                        <Table className="mx-2">
                            <TableHeader>
                                <TableRow>
                                    <TableHead className="text-right">
                                        #
                                    </TableHead>
                                    <TableHead className="text-right">
                                        إسم البرنامج
                                    </TableHead>
                                    <TableHead className="text-right">
                                        المادة
                                    </TableHead>
                                    <TableHead className="text-right">
                                        النادي
                                    </TableHead>
                                    <TableHead className="text-right">
                                        الفئة
                                    </TableHead>
                                    <TableHead className="text-right">
                                        تاريخ البداية
                                    </TableHead>
                                    <TableHead className="text-right">
                                        تاريخ النهاية
                                    </TableHead>
                                    <TableHead className="text-right">
                                        المزيد
                                    </TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {filteredPrograms.length > 0 ? (
                                    filteredPrograms.map((program) => (
                                        <TableRow key={program.id}>
                                            <TableCell className="text-right font-medium">
                                                {program.id}
                                            </TableCell>
                                            <TableCell className="text-right">
                                                <Link
                                                    href={route(
                                                        "programs.show",
                                                        program.id
                                                    )}
                                                    className="font-medium hover:underline hover:underline-offset-2"
                                                >
                                                    {program.name}
                                                </Link>
                                            </TableCell>
                                            <TableCell className="text-right">
                                                {program.subject?.name}
                                            </TableCell>
                                            <TableCell className="text-right">
                                                {program.club?.name}
                                            </TableCell>
                                            <TableCell className="text-right">
                                                {program.category?.name}
                                            </TableCell>
                                            <TableCell className="text-right">
                                                <div className="flex items-center gap-1">
                                                    <Calendar className="h-3 w-3 text-muted-foreground" />
                                                    {program.start_date}
                                                </div>
                                            </TableCell>
                                            <TableCell className="text-right">
                                                <div className="flex items-center gap-1">
                                                    <Calendar className="h-3 w-3 text-muted-foreground" />
                                                    {program.end_date}
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                <DropdownMenu dir="rtl">
                                                    <DropdownMenuTrigger
                                                        asChild
                                                    >
                                                        <Button
                                                            variant="ghost"
                                                            className="h-8 w-8 p-0"
                                                        >
                                                            <span className="sr-only">
                                                                Open menu
                                                            </span>
                                                            <MoreHorizontal className="h-4 w-4" />
                                                        </Button>
                                                    </DropdownMenuTrigger>
                                                    <DropdownMenuContent align="end">
                                                        <DropdownMenuItem className="p-0 m-0">
                                                            <Link
                                                                className="w-full px-4 py-2 flex items-center gap-2 rounded-md"
                                                                href={route(
                                                                    "programs.show",
                                                                    program.id
                                                                )}
                                                            >
                                                                <Eye className="h-4 w-4" />
                                                                <span>
                                                                    عرض التفاصيل
                                                                </span>
                                                            </Link>
                                                        </DropdownMenuItem>
                                                        <DropdownMenuItem className="p-0 m-0">
                                                            <Link
                                                                className="w-full px-4 py-2 flex items-center gap-2 rounded-md"
                                                                href={route(
                                                                    "programs.edit",
                                                                    program.id
                                                                )}
                                                            >
                                                                <Pencil className="h-4 w-4" />
                                                                <span>
                                                                    تعديل
                                                                </span>
                                                            </Link>
                                                        </DropdownMenuItem>
                                                        <DropdownMenuItem
                                                            className="p-0 m-0"
                                                            onClick={() => {
                                                                setProgramToDelete(
                                                                    program
                                                                );
                                                                setDeleteDialogOpen(
                                                                    true
                                                                );
                                                            }}
                                                        >
                                                            <div className="w-full cursor-pointer px-4 py-2 flex items-center gap-2 hover:bg-red-100 rounded-md text-red-600">
                                                                <Trash2 className="h-4 w-4" />
                                                                <span>حذف</span>
                                                            </div>
                                                        </DropdownMenuItem>
                                                    </DropdownMenuContent>
                                                </DropdownMenu>
                                            </TableCell>
                                        </TableRow>
                                    ))
                                ) : (
                                    <TableRow>
                                        <TableCell
                                            colSpan={8}
                                            className="h-24 text-center text-muted-foreground"
                                        >
                                            لا توجد برامج
                                        </TableCell>
                                    </TableRow>
                                )}
                            </TableBody>
                        </Table>
                    </div>
                </div>

                {/* Pagination */}
                <div className="mt-4 mb-1 flex">
                    {translatedLinks.map((link) =>
                        link.url ? (
                            <Link
                                preserveState
                                key={link.label}
                                href={link.url}
                                dangerouslySetInnerHTML={{
                                    __html: link.label,
                                }}
                                className={`p-1.5 md:px-2.5 mx-1 rounded-lg select-none ${
                                    link.active
                                        ? "text-primary-foreground text-base font-bold bg-primary"
                                        : "text-neutral-600 hover:text-neutral-950 hover:ring-2 ring-primary"
                                } ${
                                    !isNaN(link.label) || link.label === "..."
                                        ? "lg:inline-block hidden"
                                        : ""
                                }`}
                            />
                        ) : (
                            <span
                                key={link.label}
                                dangerouslySetInnerHTML={{
                                    __html: link.label,
                                }}
                                className={`p-1.5 mx-1 rounded-lg select-none text-neutral-400 ${
                                    !isNaN(link.label) || link.label === "..."
                                        ? "lg:inline-block hidden"
                                        : ""
                                }`}
                            />
                        )
                    )}
                </div>
            </div>

            {/* Delete Confirmation Dialog */}
            <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
                <DialogContent dir="rtl">
                    <DialogHeader>
                        <DialogTitle>
                            هل أنت متأكد من حذف هذا البرنامج؟
                        </DialogTitle>
                        <DialogDescription>
                            سيتم حذف البرنامج "{programToDelete?.name}" وجميع
                            الحصص المرتبطة به. لا يمكن التراجع عن هذا الإجراء.
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter className="gap-2 sm:gap-0">
                        <Button
                            variant="outline"
                            onClick={() => setDeleteDialogOpen(false)}
                        >
                            إلغاء
                        </Button>
                        <Button
                            variant="destructive"
                            onClick={handleDelete}
                            className="gap-2"
                        >
                            <Trash2 className="h-4 w-4" />
                            حذف
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </DashboardLayout>
    );
}
