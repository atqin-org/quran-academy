import DashboardLayout from "@/Layouts/DashboardLayout";
import { PageProps } from "@/types";
import { Head, Link, useForm, router } from "@inertiajs/react";
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/Components/ui/card";
import { Button } from "@/Components/ui/button";
import { Badge } from "@/Components/ui/badge";
import {
    ArrowRight,
    Loader2,
    Plus,
    Trash2,
    Users,
    ArrowLeftRight,
    Merge,
} from "lucide-react";
import { useState } from "react";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/Components/ui/dialog";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/Components/ui/select";
import { Checkbox } from "@/Components/ui/checkbox";
import { Label } from "@/Components/ui/label";

interface Student {
    id: number;
    first_name: string;
    last_name: string;
    group_id: number | null;
}

interface Group {
    id: number;
    name: string;
    order: number;
    students_count: number;
    students: Student[];
}

interface Club {
    id: number;
    name: string;
}

interface Category {
    id: number;
    name: string;
    display_name: string;
}

interface GroupManageProps extends PageProps {
    club: Club;
    category: Category;
    groups: Group[];
    ungroupedStudents: Student[];
}

export default function Manage({
    auth,
    club,
    category,
    groups,
    ungroupedStudents,
}: GroupManageProps) {
    const [selectedStudents, setSelectedStudents] = useState<number[]>([]);
    const [transferDialogOpen, setTransferDialogOpen] = useState(false);
    const [mergeDialogOpen, setMergeDialogOpen] = useState(false);
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
    const [groupToDelete, setGroupToDelete] = useState<Group | null>(null);
    const [sourceGroupForMerge, setSourceGroupForMerge] = useState<string>("");
    const [targetGroupForMerge, setTargetGroupForMerge] = useState<string>("");
    const [targetGroupForTransfer, setTargetGroupForTransfer] = useState<string>("");

    const createForm = useForm({
        club_id: club.id,
        category_id: category.id,
    });

    const transferForm = useForm({
        student_ids: [] as number[],
        group_id: null as number | null,
    });

    const mergeForm = useForm({
        source_group_id: null as number | null,
        target_group_id: null as number | null,
    });

    const handleCreateGroup = () => {
        createForm.post(route("groups.store"), {
            preserveScroll: true,
        });
    };

    const handleDeleteGroup = (group: Group) => {
        if (group.students_count > 0) {
            return;
        }
        setGroupToDelete(group);
        setDeleteDialogOpen(true);
    };

    const confirmDelete = () => {
        if (groupToDelete) {
            router.delete(route("groups.destroy", groupToDelete.id), {
                preserveScroll: true,
                onSuccess: () => {
                    setDeleteDialogOpen(false);
                    setGroupToDelete(null);
                },
            });
        }
    };

    const toggleStudentSelection = (studentId: number) => {
        setSelectedStudents((prev) =>
            prev.includes(studentId)
                ? prev.filter((id) => id !== studentId)
                : [...prev, studentId]
        );
    };

    const selectAllInGroup = (students: Student[]) => {
        const studentIds = students.map((s) => s.id);
        const allSelected = studentIds.every((id) =>
            selectedStudents.includes(id)
        );
        if (allSelected) {
            setSelectedStudents((prev) =>
                prev.filter((id) => !studentIds.includes(id))
            );
        } else {
            setSelectedStudents((prev) => [
                ...new Set([...prev, ...studentIds]),
            ]);
        }
    };

    const openTransferDialog = () => {
        if (selectedStudents.length === 0) return;
        setTargetGroupForTransfer("");
        setTransferDialogOpen(true);
    };

    const handleTransfer = () => {
        transferForm.setData({
            student_ids: selectedStudents,
            group_id: targetGroupForTransfer ? parseInt(targetGroupForTransfer) : null,
        });

        router.post(
            route("groups.bulkTransfer"),
            {
                student_ids: selectedStudents,
                group_id: targetGroupForTransfer ? parseInt(targetGroupForTransfer) : null,
            },
            {
                preserveScroll: true,
                onSuccess: () => {
                    setTransferDialogOpen(false);
                    setSelectedStudents([]);
                    setTargetGroupForTransfer("");
                },
            }
        );
    };

    const openMergeDialog = () => {
        setSourceGroupForMerge("");
        setTargetGroupForMerge("");
        setMergeDialogOpen(true);
    };

    const handleMerge = () => {
        if (!sourceGroupForMerge || !targetGroupForMerge) return;

        router.post(
            route("groups.merge"),
            {
                source_group_id: parseInt(sourceGroupForMerge),
                target_group_id: parseInt(targetGroupForMerge),
            },
            {
                preserveScroll: true,
                onSuccess: () => {
                    setMergeDialogOpen(false);
                    setSourceGroupForMerge("");
                    setTargetGroupForMerge("");
                },
            }
        );
    };

    const totalStudents =
        groups.reduce((acc, g) => acc + g.students_count, 0) +
        ungroupedStudents.length;

    return (
        <DashboardLayout user={auth.user}>
            <Head title={`إدارة الأفواج - ${club.name}`} />
            <div className="flex flex-col gap-6">
                {/* Header */}
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <Link href={route("clubs.index")}>
                            <Button variant="outline" size="icon">
                                <ArrowRight className="h-4 w-4" />
                            </Button>
                        </Link>
                        <div>
                            <h1 className="text-3xl font-bold text-gray-900">
                                إدارة الأفواج
                            </h1>
                            <p className="text-gray-500">
                                {club.name} - {category.display_name}
                            </p>
                        </div>
                    </div>
                    <div className="flex gap-2">
                        {groups.length >= 2 && (
                            <Button
                                variant="outline"
                                onClick={openMergeDialog}
                                className="gap-2"
                            >
                                <Merge className="h-4 w-4" />
                                دمج أفواج
                            </Button>
                        )}
                        <Button
                            onClick={handleCreateGroup}
                            disabled={createForm.processing}
                            className="gap-2"
                        >
                            {createForm.processing ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                                <Plus className="h-4 w-4" />
                            )}
                            إنشاء فوج جديد
                        </Button>
                    </div>
                </div>

                {/* Stats */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <Card>
                        <CardContent className="pt-6">
                            <div className="text-2xl font-bold">
                                {groups.length}
                            </div>
                            <p className="text-gray-500">عدد الأفواج</p>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardContent className="pt-6">
                            <div className="text-2xl font-bold">
                                {totalStudents}
                            </div>
                            <p className="text-gray-500">إجمالي الطلاب</p>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardContent className="pt-6">
                            <div className="text-2xl font-bold">
                                {ungroupedStudents.length}
                            </div>
                            <p className="text-gray-500">بدون فوج</p>
                        </CardContent>
                    </Card>
                </div>

                {/* Transfer Button */}
                {selectedStudents.length > 0 && (
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 flex items-center justify-between">
                        <span className="text-blue-700">
                            تم تحديد {selectedStudents.length} طالب
                        </span>
                        <div className="flex gap-2">
                            <Button
                                variant="outline"
                                onClick={() => setSelectedStudents([])}
                            >
                                إلغاء التحديد
                            </Button>
                            <Button onClick={openTransferDialog} className="gap-2">
                                <ArrowLeftRight className="h-4 w-4" />
                                نقل الطلاب
                            </Button>
                        </div>
                    </div>
                )}

                {/* Groups Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {/* Ungrouped Students Card */}
                    <Card className="border-dashed">
                        <CardHeader className="pb-3">
                            <div className="flex items-center justify-between">
                                <CardTitle className="text-lg flex items-center gap-2">
                                    <Users className="h-5 w-5 text-gray-400" />
                                    بدون فوج
                                </CardTitle>
                                <Badge variant="secondary">
                                    {ungroupedStudents.length} طالب
                                </Badge>
                            </div>
                        </CardHeader>
                        <CardContent>
                            {ungroupedStudents.length > 0 ? (
                                <div className="space-y-2">
                                    <div className="flex items-center gap-2 pb-2 border-b">
                                        <Checkbox
                                            checked={ungroupedStudents.every(
                                                (s) =>
                                                    selectedStudents.includes(
                                                        s.id
                                                    )
                                            )}
                                            onCheckedChange={() =>
                                                selectAllInGroup(
                                                    ungroupedStudents
                                                )
                                            }
                                        />
                                        <Label className="text-sm text-gray-500">
                                            تحديد الكل
                                        </Label>
                                    </div>
                                    <div className="max-h-48 overflow-y-auto space-y-1">
                                        {ungroupedStudents.map((student) => (
                                            <div
                                                key={student.id}
                                                className="flex items-center gap-2 p-2 hover:bg-gray-50 rounded"
                                            >
                                                <Checkbox
                                                    checked={selectedStudents.includes(
                                                        student.id
                                                    )}
                                                    onCheckedChange={() =>
                                                        toggleStudentSelection(
                                                            student.id
                                                        )
                                                    }
                                                />
                                                <span className="text-sm">
                                                    {student.first_name}{" "}
                                                    {student.last_name}
                                                </span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            ) : (
                                <p className="text-sm text-gray-400 text-center py-4">
                                    جميع الطلاب مصنفين في أفواج
                                </p>
                            )}
                        </CardContent>
                    </Card>

                    {/* Group Cards */}
                    {groups.map((group) => (
                        <Card key={group.id}>
                            <CardHeader className="pb-3">
                                <div className="flex items-center justify-between">
                                    <CardTitle className="text-lg flex items-center gap-2">
                                        <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold">
                                            {group.name}
                                        </div>
                                        فوج {group.name}
                                    </CardTitle>
                                    <div className="flex items-center gap-2">
                                        <Badge>{group.students_count} طالب</Badge>
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            className="h-8 w-8 text-red-500 hover:text-red-700 hover:bg-red-50"
                                            disabled={group.students_count > 0}
                                            onClick={() =>
                                                handleDeleteGroup(group)
                                            }
                                            title={
                                                group.students_count > 0
                                                    ? "لا يمكن حذف فوج يحتوي على طلاب"
                                                    : "حذف الفوج"
                                            }
                                        >
                                            <Trash2 className="h-4 w-4" />
                                        </Button>
                                    </div>
                                </div>
                            </CardHeader>
                            <CardContent>
                                {group.students.length > 0 ? (
                                    <div className="space-y-2">
                                        <div className="flex items-center gap-2 pb-2 border-b">
                                            <Checkbox
                                                checked={group.students.every(
                                                    (s) =>
                                                        selectedStudents.includes(
                                                            s.id
                                                        )
                                                )}
                                                onCheckedChange={() =>
                                                    selectAllInGroup(
                                                        group.students
                                                    )
                                                }
                                            />
                                            <Label className="text-sm text-gray-500">
                                                تحديد الكل
                                            </Label>
                                        </div>
                                        <div className="max-h-48 overflow-y-auto space-y-1">
                                            {group.students.map((student) => (
                                                <div
                                                    key={student.id}
                                                    className="flex items-center gap-2 p-2 hover:bg-gray-50 rounded"
                                                >
                                                    <Checkbox
                                                        checked={selectedStudents.includes(
                                                            student.id
                                                        )}
                                                        onCheckedChange={() =>
                                                            toggleStudentSelection(
                                                                student.id
                                                            )
                                                        }
                                                    />
                                                    <span className="text-sm">
                                                        {student.first_name}{" "}
                                                        {student.last_name}
                                                    </span>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                ) : (
                                    <p className="text-sm text-gray-400 text-center py-4">
                                        لا يوجد طلاب في هذا الفوج
                                    </p>
                                )}
                            </CardContent>
                        </Card>
                    ))}
                </div>

                {/* Transfer Dialog */}
                <Dialog
                    open={transferDialogOpen}
                    onOpenChange={setTransferDialogOpen}
                >
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>نقل الطلاب</DialogTitle>
                            <DialogDescription>
                                اختر الفوج الذي تريد نقل {selectedStudents.length}{" "}
                                طالب إليه
                            </DialogDescription>
                        </DialogHeader>
                        <div className="py-4">
                            <Select
                                value={targetGroupForTransfer}
                                onValueChange={setTargetGroupForTransfer}
                                dir="rtl"
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder="اختر الفوج" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="none">
                                        بدون فوج
                                    </SelectItem>
                                    {groups.map((g) => (
                                        <SelectItem
                                            key={g.id}
                                            value={g.id.toString()}
                                        >
                                            فوج {g.name} ({g.students_count}{" "}
                                            طالب)
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                        <DialogFooter>
                            <Button
                                variant="outline"
                                onClick={() => setTransferDialogOpen(false)}
                            >
                                إلغاء
                            </Button>
                            <Button onClick={handleTransfer}>نقل</Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>

                {/* Merge Dialog */}
                <Dialog open={mergeDialogOpen} onOpenChange={setMergeDialogOpen}>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>دمج الأفواج</DialogTitle>
                            <DialogDescription>
                                سيتم نقل جميع طلاب الفوج المصدر إلى الفوج الهدف وحذف
                                الفوج المصدر
                            </DialogDescription>
                        </DialogHeader>
                        <div className="space-y-4 py-4">
                            <div>
                                <Label>الفوج المصدر (سيتم حذفه)</Label>
                                <Select
                                    value={sourceGroupForMerge}
                                    onValueChange={setSourceGroupForMerge}
                                    dir="rtl"
                                >
                                    <SelectTrigger className="mt-1">
                                        <SelectValue placeholder="اختر الفوج المصدر" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {groups
                                            .filter(
                                                (g) =>
                                                    g.id.toString() !==
                                                    targetGroupForMerge
                                            )
                                            .map((g) => (
                                                <SelectItem
                                                    key={g.id}
                                                    value={g.id.toString()}
                                                >
                                                    فوج {g.name} (
                                                    {g.students_count} طالب)
                                                </SelectItem>
                                            ))}
                                    </SelectContent>
                                </Select>
                            </div>
                            <div>
                                <Label>الفوج الهدف</Label>
                                <Select
                                    value={targetGroupForMerge}
                                    onValueChange={setTargetGroupForMerge}
                                    dir="rtl"
                                >
                                    <SelectTrigger className="mt-1">
                                        <SelectValue placeholder="اختر الفوج الهدف" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {groups
                                            .filter(
                                                (g) =>
                                                    g.id.toString() !==
                                                    sourceGroupForMerge
                                            )
                                            .map((g) => (
                                                <SelectItem
                                                    key={g.id}
                                                    value={g.id.toString()}
                                                >
                                                    فوج {g.name} (
                                                    {g.students_count} طالب)
                                                </SelectItem>
                                            ))}
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>
                        <DialogFooter>
                            <Button
                                variant="outline"
                                onClick={() => setMergeDialogOpen(false)}
                            >
                                إلغاء
                            </Button>
                            <Button
                                onClick={handleMerge}
                                disabled={
                                    !sourceGroupForMerge || !targetGroupForMerge
                                }
                            >
                                دمج
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>

                {/* Delete Confirmation Dialog */}
                <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>تأكيد الحذف</DialogTitle>
                            <DialogDescription>
                                هل أنت متأكد من حذف فوج {groupToDelete?.name}؟
                            </DialogDescription>
                        </DialogHeader>
                        <DialogFooter>
                            <Button
                                variant="outline"
                                onClick={() => setDeleteDialogOpen(false)}
                            >
                                إلغاء
                            </Button>
                            <Button variant="destructive" onClick={confirmDelete}>
                                حذف
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
            </div>
        </DashboardLayout>
    );
}
