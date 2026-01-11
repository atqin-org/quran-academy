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
    FolderOpen,
    AlertTriangle,
} from "lucide-react";
import { useState, useMemo } from "react";
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
import { cn } from "@/lib/utils";

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
    students_count: number;
    groups_count: number;
}

interface GroupIndexProps extends PageProps {
    club: Club;
    categories: Category[];
    selectedCategory: Category | null;
    groups: Group[];
    ungroupedStudents: Student[];
    canCreateGroup: boolean;
    totalStudents: number;
}

export default function Index({
    auth,
    club,
    categories,
    selectedCategory,
    groups,
    ungroupedStudents,
    canCreateGroup,
    totalStudents,
}: GroupIndexProps) {
    const [selectedStudents, setSelectedStudents] = useState<number[]>([]);
    const [transferDialogOpen, setTransferDialogOpen] = useState(false);
    const [mergeDialogOpen, setMergeDialogOpen] = useState(false);
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
    const [createDialogOpen, setCreateDialogOpen] = useState(false);
    const [groupToDelete, setGroupToDelete] = useState<Group | null>(null);
    const [sourceGroupForMerge, setSourceGroupForMerge] = useState<string>("");
    const [targetGroupForMerge, setTargetGroupForMerge] = useState<string>("");
    const [targetGroupForTransfer, setTargetGroupForTransfer] = useState<string>("");
    const [studentsForNewGroup, setStudentsForNewGroup] = useState<number[]>([]);
    const [isCreating, setIsCreating] = useState(false);

    // Check if transferring selected students would empty any source group
    const transferValidation = useMemo(() => {
        if (selectedStudents.length === 0) {
            return { valid: true, error: null };
        }

        // Group selected students by their current group
        const studentsByGroup: Record<number, number[]> = {};

        groups.forEach((group) => {
            const selectedInGroup = group.students
                .filter((s) => selectedStudents.includes(s.id))
                .map((s) => s.id);
            if (selectedInGroup.length > 0) {
                studentsByGroup[group.id] = selectedInGroup;
            }
        });

        // Check if any group would be emptied
        for (const groupId in studentsByGroup) {
            const group = groups.find((g) => g.id === parseInt(groupId));
            if (group) {
                const selectedCount = studentsByGroup[groupId].length;
                if (selectedCount === group.students_count) {
                    return {
                        valid: false,
                        error: `لا يمكن نقل جميع طلاب فوج ${group.name} - يجب أن يبقى طالب واحد على الأقل`,
                        emptyingGroup: group,
                    };
                }
            }
        }

        return { valid: true, error: null };
    }, [selectedStudents, groups]);

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

    const toggleStudentSelection = (studentId: number, groupId: number | null) => {
        // Check if selecting this student would empty their group
        if (groupId && !selectedStudents.includes(studentId)) {
            const group = groups.find((g) => g.id === groupId);
            if (group) {
                const currentlySelectedInGroup = group.students.filter((s) =>
                    selectedStudents.includes(s.id)
                ).length;
                // If all other students are already selected, prevent selecting this one
                if (currentlySelectedInGroup === group.students_count - 1) {
                    // Don't allow - would empty the group
                    return;
                }
            }
        }

        setSelectedStudents((prev) =>
            prev.includes(studentId)
                ? prev.filter((id) => id !== studentId)
                : [...prev, studentId]
        );
    };

    const selectAllInGroup = (students: Student[], groupId: number | null) => {
        const studentIds = students.map((s) => s.id);
        const allSelected = studentIds.every((id) =>
            selectedStudents.includes(id)
        );

        if (allSelected) {
            // Deselect all
            setSelectedStudents((prev) =>
                prev.filter((id) => !studentIds.includes(id))
            );
        } else {
            // For groups with students, leave at least one unselected
            if (groupId && students.length > 0) {
                // Select all except the last one to prevent emptying the group
                const toSelect = studentIds.slice(0, -1);
                setSelectedStudents((prev) => [
                    ...new Set([...prev, ...toSelect]),
                ]);
            } else {
                // Ungrouped students can all be selected
                setSelectedStudents((prev) => [
                    ...new Set([...prev, ...studentIds]),
                ]);
            }
        }
    };

    const openTransferDialog = () => {
        if (selectedStudents.length === 0) return;
        setTargetGroupForTransfer("");
        setTransferDialogOpen(true);
    };

    const handleTransfer = () => {
        // Only send null if "none" is selected AND no groups exist
        const groupId = targetGroupForTransfer === "none"
            ? null
            : (targetGroupForTransfer ? parseInt(targetGroupForTransfer) : null);

        router.post(
            route("groups.bulkTransfer"),
            {
                student_ids: selectedStudents,
                group_id: groupId,
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

    // Create group with selected students
    const openCreateDialog = () => {
        setStudentsForNewGroup([]);
        setCreateDialogOpen(true);
    };

    const toggleStudentForNewGroup = (studentId: number, currentGroupId: number | null) => {
        // Check if selecting would empty the source group
        if (currentGroupId && !studentsForNewGroup.includes(studentId)) {
            const group = groups.find((g) => g.id === currentGroupId);
            if (group) {
                const alreadySelectedFromGroup = group.students.filter((s) =>
                    studentsForNewGroup.includes(s.id)
                ).length;
                // If selecting this student would empty the group, prevent it
                if (alreadySelectedFromGroup === group.students_count - 1) {
                    return;
                }
            }
        }

        setStudentsForNewGroup((prev) =>
            prev.includes(studentId)
                ? prev.filter((id) => id !== studentId)
                : [...prev, studentId]
        );
    };

    const handleCreateGroup = () => {
        if (!selectedCategory) return;

        // If no groups exist yet, just create the groups (backend will create 2 and split)
        if (groups.length === 0) {
            setIsCreating(true);
            router.post(
                route("groups.store"),
                {
                    club_id: club.id,
                    category_id: selectedCategory.id,
                },
                {
                    preserveScroll: true,
                    onFinish: () => setIsCreating(false),
                }
            );
            return;
        }

        // If groups exist, need to show modal to select students
        openCreateDialog();
    };

    const confirmCreateGroup = () => {
        if (!selectedCategory || studentsForNewGroup.length === 0) return;

        setIsCreating(true);

        // Create the group and transfer students in one request
        router.post(
            route("groups.store"),
            {
                club_id: club.id,
                category_id: selectedCategory.id,
                student_ids: studentsForNewGroup,
            },
            {
                preserveScroll: true,
                onSuccess: () => {
                    setCreateDialogOpen(false);
                    setStudentsForNewGroup([]);
                    setIsCreating(false);
                },
                onError: () => {
                    setIsCreating(false);
                },
            }
        );
    };

    // Get all students available for new group (from existing groups with >1 student)
    const studentsAvailableForNewGroup = useMemo(() => {
        const available: { student: Student; groupName: string; groupId: number }[] = [];

        groups.forEach((group) => {
            if (group.students_count > 1) {
                // Can take students from this group, but leave at least 1
                group.students.forEach((student) => {
                    available.push({
                        student,
                        groupName: group.name,
                        groupId: group.id,
                    });
                });
            }
        });

        return available;
    }, [groups]);

    // Check if selection for new group would empty any group
    const newGroupValidation = useMemo(() => {
        const studentsByGroup: Record<number, number> = {};

        studentsForNewGroup.forEach((studentId) => {
            const item = studentsAvailableForNewGroup.find(
                (a) => a.student.id === studentId
            );
            if (item) {
                studentsByGroup[item.groupId] = (studentsByGroup[item.groupId] || 0) + 1;
            }
        });

        for (const groupId in studentsByGroup) {
            const group = groups.find((g) => g.id === parseInt(groupId));
            if (group && studentsByGroup[groupId] === group.students_count) {
                return {
                    valid: false,
                    error: `لا يمكن نقل جميع طلاب فوج ${group.name}`,
                };
            }
        }

        return { valid: true, error: null };
    }, [studentsForNewGroup, studentsAvailableForNewGroup, groups]);

    const displayTotalStudents = totalStudents ||
        groups.reduce((acc, g) => acc + g.students_count, 0) + ungroupedStudents.length;

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
                            <p className="text-gray-500">{club.name}</p>
                        </div>
                    </div>
                </div>

                {/* Main Content - Sidebar Layout */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Categories Sidebar (1/3) */}
                    <div className="lg:col-span-1">
                        <Card>
                            <CardHeader>
                                <CardTitle className="text-lg">الفئات</CardTitle>
                                <CardDescription>
                                    اختر فئة لإدارة أفواجها
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="p-2">
                                {categories.length > 0 ? (
                                    <div className="space-y-1">
                                        {categories.map((category) => (
                                            <Link
                                                key={category.id}
                                                href={route("groups.clubGroups", {
                                                    club: club.id,
                                                    category: category.id,
                                                })}
                                                preserveScroll
                                            >
                                                <div
                                                    className={cn(
                                                        "flex items-center justify-between p-3 rounded-lg cursor-pointer transition-colors",
                                                        selectedCategory?.id === category.id
                                                            ? "bg-primary text-primary-foreground"
                                                            : "hover:bg-muted"
                                                    )}
                                                >
                                                    <span className="font-medium">
                                                        {category.display_name}
                                                    </span>
                                                    <div className="flex items-center gap-1.5">
                                                        <span className={cn(
                                                            "text-xs px-1.5 py-0.5 rounded",
                                                            selectedCategory?.id === category.id
                                                                ? "bg-primary-foreground/20 text-primary-foreground"
                                                                : "bg-muted text-muted-foreground"
                                                        )}>
                                                            {category.students_count} طالب
                                                        </span>
                                                        {category.groups_count > 0 && (
                                                            <span className={cn(
                                                                "text-xs px-1.5 py-0.5 rounded",
                                                                selectedCategory?.id === category.id
                                                                    ? "bg-primary-foreground/20 text-primary-foreground"
                                                                    : "bg-muted text-muted-foreground"
                                                            )}>
                                                                {category.groups_count} فوج
                                                            </span>
                                                        )}
                                                    </div>
                                                </div>
                                            </Link>
                                        ))}
                                    </div>
                                ) : (
                                    <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
                                        <FolderOpen className="h-12 w-12 mb-2" />
                                        <p className="text-center">
                                            لا توجد فئات بها طلاب في هذا النادي
                                        </p>
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    </div>

                    {/* Groups Management (2/3) */}
                    <div className="lg:col-span-2 space-y-4">
                        {selectedCategory ? (
                            <>
                                {/* Actions Bar */}
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                        <Badge variant="outline" className="text-base py-1 px-3">
                                            {selectedCategory.display_name}
                                        </Badge>
                                        <Badge variant="secondary">
                                            {displayTotalStudents} طالب
                                        </Badge>
                                        <Badge variant="secondary">
                                            {groups.length} فوج
                                        </Badge>
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
                                            disabled={isCreating || !canCreateGroup}
                                            className="gap-2"
                                            title={!canCreateGroup ? "يجب أن يكون هناك طلاب يمكن نقلهم" : ""}
                                        >
                                            {isCreating ? (
                                                <Loader2 className="h-4 w-4 animate-spin" />
                                            ) : (
                                                <Plus className="h-4 w-4" />
                                            )}
                                            إنشاء فوج جديد
                                        </Button>
                                    </div>
                                </div>

                                {/* Transfer Button */}
                                {selectedStudents.length > 0 && (
                                    <div className={cn(
                                        "border rounded-lg p-4 flex items-center justify-between",
                                        transferValidation.valid
                                            ? "bg-blue-50 border-blue-200"
                                            : "bg-yellow-50 border-yellow-200"
                                    )}>
                                        <div>
                                            <span className={transferValidation.valid ? "text-blue-700" : "text-yellow-700"}>
                                                تم تحديد {selectedStudents.length} طالب
                                            </span>
                                            {!transferValidation.valid && (
                                                <p className="text-sm text-yellow-600 mt-1">
                                                    {transferValidation.error}
                                                </p>
                                            )}
                                        </div>
                                        <div className="flex gap-2">
                                            <Button
                                                variant="outline"
                                                onClick={() => setSelectedStudents([])}
                                            >
                                                إلغاء التحديد
                                            </Button>
                                            <Button
                                                onClick={openTransferDialog}
                                                className="gap-2"
                                                disabled={!transferValidation.valid}
                                            >
                                                <ArrowLeftRight className="h-4 w-4" />
                                                نقل الطلاب
                                            </Button>
                                        </div>
                                    </div>
                                )}

                                {/* Groups Grid */}
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    {/* Ungrouped Students Card - only show if no groups exist */}
                                    {ungroupedStudents.length > 0 && groups.length === 0 && (
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
                                                <div className="space-y-2">
                                                    <div className="flex items-center gap-2 pb-2 border-b">
                                                        <Checkbox
                                                            checked={ungroupedStudents.every(
                                                                (s) =>
                                                                    selectedStudents.includes(s.id)
                                                            )}
                                                            onCheckedChange={() =>
                                                                selectAllInGroup(ungroupedStudents, null)
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
                                                                        toggleStudentSelection(student.id, null)
                                                                    }
                                                                />
                                                                <span className="text-sm">
                                                                    {student.first_name} {student.last_name}
                                                                </span>
                                                            </div>
                                                        ))}
                                                    </div>
                                                </div>
                                            </CardContent>
                                        </Card>
                                    )}

                                    {/* Group Cards */}
                                    {groups.map((group) => {
                                        // Calculate how many students are selected from this group
                                        const selectedFromGroup = group.students.filter((s) =>
                                            selectedStudents.includes(s.id)
                                        ).length;
                                        const canSelectMore = selectedFromGroup < group.students_count - 1;

                                        return (
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
                                                                onClick={() => handleDeleteGroup(group)}
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
                                                                    checked={
                                                                        selectedFromGroup === group.students_count - 1 &&
                                                                        group.students_count > 1
                                                                    }
                                                                    onCheckedChange={() =>
                                                                        selectAllInGroup(group.students, group.id)
                                                                    }
                                                                    disabled={group.students_count === 1}
                                                                />
                                                                <Label className="text-sm text-gray-500">
                                                                    تحديد الكل (ما عدا 1)
                                                                </Label>
                                                            </div>
                                                            <div className="max-h-48 overflow-y-auto space-y-1">
                                                                {group.students.map((student, index) => {
                                                                    const isSelected = selectedStudents.includes(student.id);
                                                                    const isLastUnselected =
                                                                        !isSelected &&
                                                                        selectedFromGroup === group.students_count - 1;

                                                                    return (
                                                                        <div
                                                                            key={student.id}
                                                                            className={cn(
                                                                                "flex items-center gap-2 p-2 rounded",
                                                                                isLastUnselected
                                                                                    ? "bg-yellow-50"
                                                                                    : "hover:bg-gray-50"
                                                                            )}
                                                                        >
                                                                            <Checkbox
                                                                                checked={isSelected}
                                                                                onCheckedChange={() =>
                                                                                    toggleStudentSelection(student.id, group.id)
                                                                                }
                                                                                disabled={isLastUnselected}
                                                                            />
                                                                            <span className="text-sm">
                                                                                {student.first_name} {student.last_name}
                                                                            </span>
                                                                            {isLastUnselected && (
                                                                                <span className="text-xs text-yellow-600 mr-auto">
                                                                                    (يجب بقاء طالب)
                                                                                </span>
                                                                            )}
                                                                        </div>
                                                                    );
                                                                })}
                                                            </div>
                                                        </div>
                                                    ) : (
                                                        <p className="text-sm text-gray-400 text-center py-4">
                                                            لا يوجد طلاب في هذا الفوج
                                                        </p>
                                                    )}
                                                </CardContent>
                                            </Card>
                                        );
                                    })}

                                    {/* Empty state when no groups */}
                                    {groups.length === 0 && ungroupedStudents.length === 0 && (
                                        <div className="col-span-full flex flex-col items-center justify-center py-12 text-muted-foreground">
                                            <Users className="h-16 w-16 mb-4" />
                                            <p className="text-lg mb-2">لا توجد أفواج بعد</p>
                                            <p className="text-sm mb-4">
                                                أنشئ فوجًا جديدًا لبدء تنظيم الطلاب
                                            </p>
                                            <Button
                                                onClick={handleCreateGroup}
                                                disabled={isCreating || !canCreateGroup}
                                                className="gap-2"
                                            >
                                                {isCreating ? (
                                                    <Loader2 className="h-4 w-4 animate-spin" />
                                                ) : (
                                                    <Plus className="h-4 w-4" />
                                                )}
                                                إنشاء فوج جديد
                                            </Button>
                                        </div>
                                    )}
                                </div>
                            </>
                        ) : (
                            <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
                                <FolderOpen className="h-16 w-16 mb-4" />
                                <p className="text-lg">اختر فئة من القائمة</p>
                                <p className="text-sm">لإدارة أفواج تلك الفئة</p>
                            </div>
                        )}
                    </div>
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
                                اختر الفوج الذي تريد نقل {selectedStudents.length} طالب إليه
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
                                    {/* Only show "بدون فوج" if no groups exist */}
                                    {groups.length === 0 && (
                                        <SelectItem value="none">بدون فوج</SelectItem>
                                    )}
                                    {groups.map((g) => (
                                        <SelectItem key={g.id} value={g.id.toString()}>
                                            فوج {g.name} ({g.students_count} طالب)
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
                            <Button
                                onClick={handleTransfer}
                                disabled={!targetGroupForTransfer}
                            >
                                نقل
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>

                {/* Create Group Dialog */}
                <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
                    <DialogContent className="max-w-lg">
                        <DialogHeader>
                            <DialogTitle>إنشاء فوج جديد</DialogTitle>
                            <DialogDescription>
                                اختر الطلاب الذين تريد نقلهم إلى الفوج الجديد
                            </DialogDescription>
                        </DialogHeader>
                        <div className="py-4">
                            {studentsAvailableForNewGroup.length > 0 ? (
                                <div className="space-y-4">
                                    {!newGroupValidation.valid && (
                                        <div className="flex items-center gap-2 p-3 rounded-lg bg-red-50 border border-red-200 text-red-700">
                                            <AlertTriangle className="h-4 w-4" />
                                            <span className="text-sm">{newGroupValidation.error}</span>
                                        </div>
                                    )}
                                    <div className="max-h-64 overflow-y-auto space-y-1 border rounded-lg p-2">
                                        {groups.filter((g) => g.students_count > 1).map((group) => (
                                            <div key={group.id} className="space-y-1">
                                                <div className="text-sm font-medium text-gray-500 px-2 py-1 bg-gray-50 rounded">
                                                    فوج {group.name}
                                                </div>
                                                {group.students.map((student) => {
                                                    const isSelected = studentsForNewGroup.includes(student.id);
                                                    const selectedFromThisGroup = group.students.filter(
                                                        (s) => studentsForNewGroup.includes(s.id)
                                                    ).length;
                                                    const wouldEmptyGroup =
                                                        !isSelected &&
                                                        selectedFromThisGroup === group.students_count - 1;

                                                    return (
                                                        <div
                                                            key={student.id}
                                                            onClick={() => {
                                                                if (!wouldEmptyGroup) {
                                                                    toggleStudentForNewGroup(student.id, group.id);
                                                                }
                                                            }}
                                                            className={cn(
                                                                "flex items-center gap-2 p-2 rounded mr-4 select-none",
                                                                wouldEmptyGroup
                                                                    ? "bg-yellow-50 cursor-not-allowed"
                                                                    : "hover:bg-gray-100 cursor-pointer"
                                                            )}
                                                        >
                                                            <Checkbox
                                                                checked={isSelected}
                                                                onCheckedChange={() =>
                                                                    toggleStudentForNewGroup(student.id, group.id)
                                                                }
                                                                disabled={wouldEmptyGroup}
                                                            />
                                                            <span className="text-sm">
                                                                {student.first_name} {student.last_name}
                                                            </span>
                                                            {wouldEmptyGroup && (
                                                                <span className="text-xs text-yellow-600 mr-auto">
                                                                    (يجب بقاء طالب)
                                                                </span>
                                                            )}
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        ))}
                                    </div>
                                    <p className="text-sm text-gray-500">
                                        تم تحديد {studentsForNewGroup.length} طالب للفوج الجديد
                                    </p>
                                </div>
                            ) : (
                                <div className="text-center py-8 text-muted-foreground">
                                    <AlertTriangle className="h-12 w-12 mx-auto mb-2" />
                                    <p>لا يوجد طلاب يمكن نقلهم</p>
                                    <p className="text-sm">يجب أن يكون في كل فوج أكثر من طالب واحد</p>
                                </div>
                            )}
                        </div>
                        <DialogFooter>
                            <Button
                                variant="outline"
                                onClick={() => setCreateDialogOpen(false)}
                            >
                                إلغاء
                            </Button>
                            <Button
                                onClick={confirmCreateGroup}
                                disabled={
                                    studentsForNewGroup.length === 0 ||
                                    isCreating ||
                                    !newGroupValidation.valid
                                }
                            >
                                {isCreating ? (
                                    <Loader2 className="h-4 w-4 animate-spin ml-2" />
                                ) : null}
                                إنشاء الفوج
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>

                {/* Merge Dialog */}
                <Dialog open={mergeDialogOpen} onOpenChange={setMergeDialogOpen}>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>دمج الأفواج</DialogTitle>
                            <DialogDescription>
                                {groups.length === 2
                                    ? "سيتم حذف كلا الفوجين وإلغاء تصنيف جميع الطلاب (لا يمكن وجود فوج واحد)"
                                    : "سيتم نقل جميع طلاب الفوج المصدر إلى الفوج الهدف وحذف الفوج المصدر"
                                }
                            </DialogDescription>
                        </DialogHeader>
                        {groups.length === 2 && (
                            <div className="flex items-center gap-2 p-3 rounded-lg bg-yellow-50 border border-yellow-200 text-yellow-700">
                                <AlertTriangle className="h-4 w-4 flex-shrink-0" />
                                <span className="text-sm">
                                    لديك فوجين فقط. دمجهما سيؤدي إلى حذف كليهما لأنه لا يمكن وجود فوج واحد.
                                </span>
                            </div>
                        )}
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
                                                (g) => g.id.toString() !== targetGroupForMerge
                                            )
                                            .map((g) => (
                                                <SelectItem key={g.id} value={g.id.toString()}>
                                                    فوج {g.name} ({g.students_count} طالب)
                                                </SelectItem>
                                            ))}
                                    </SelectContent>
                                </Select>
                            </div>
                            <div>
                                <Label>الفوج الهدف {groups.length === 2 ? "(سيتم حذفه أيضًا)" : ""}</Label>
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
                                                (g) => g.id.toString() !== sourceGroupForMerge
                                            )
                                            .map((g) => (
                                                <SelectItem key={g.id} value={g.id.toString()}>
                                                    فوج {g.name} ({g.students_count} طالب)
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
                                disabled={!sourceGroupForMerge || !targetGroupForMerge}
                                variant={groups.length === 2 ? "destructive" : "default"}
                            >
                                {groups.length === 2 ? "حذف الأفواج" : "دمج"}
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
                                {groups.length === 2
                                    ? `سيتم حذف جميع الأفواج وإلغاء تصنيف الطلاب (لا يمكن وجود فوج واحد)`
                                    : `هل أنت متأكد من حذف فوج ${groupToDelete?.name}؟`
                                }
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
