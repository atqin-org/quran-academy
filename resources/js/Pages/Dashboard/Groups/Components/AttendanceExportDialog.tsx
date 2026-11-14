import { Button } from "@/Components/ui/button";
import { Calendar } from "@/Components/ui/calendar";
import { Checkbox } from "@/Components/ui/checkbox";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/Components/ui/dialog";
import { Label } from "@/Components/ui/label";
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/Components/ui/popover";
import { cn } from "@/lib/utils";
import { endOfMonth, format, startOfMonth, subMonths } from "date-fns";
import { ar } from "date-fns/locale";
import { AlertTriangle, CalendarIcon, FileSpreadsheet } from "lucide-react";
import { useEffect, useState } from "react";

type SheetLayout = "per_group" | "single";

interface AttendanceExportDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    club: { id: number; name: string };
    category: { id: number; display_name: string };
    groups: { id: number; name: string }[];
    ungroupedCount: number;
}

const layoutOptions: { value: SheetLayout; label: string }[] = [
    { value: "per_group", label: "ورقة لكل فوج" },
    { value: "single", label: "ورقة واحدة" },
];

interface DateFieldProps {
    label: string;
    placeholder: string;
    value: Date | undefined;
    onChange: (date: Date | undefined) => void;
}

function DateField({ label, placeholder, value, onChange }: DateFieldProps) {
    const [open, setOpen] = useState(false);

    return (
        <div className="flex flex-col gap-2">
            <Label>{label}</Label>
            <Popover open={open} onOpenChange={setOpen}>
                <PopoverTrigger asChild>
                    <Button
                        variant="outline"
                        className={cn(
                            "w-full justify-start gap-2 font-normal",
                            !value && "text-muted-foreground"
                        )}
                    >
                        <CalendarIcon className="h-4 w-4" />
                        {value ? format(value, "dd/MM/yyyy") : placeholder}
                    </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                        mode="single"
                        selected={value}
                        defaultMonth={value}
                        onSelect={(date) => {
                            onChange(date);
                            setOpen(false);
                        }}
                        locale={ar}
                        dir="rtl"
                        autoFocus
                    />
                </PopoverContent>
            </Popover>
        </div>
    );
}

export default function AttendanceExportDialog({
    open,
    onOpenChange,
    club,
    category,
    groups,
    ungroupedCount,
}: AttendanceExportDialogProps) {
    const [from, setFrom] = useState<Date | undefined>(() =>
        startOfMonth(new Date())
    );
    const [to, setTo] = useState<Date | undefined>(() => new Date());
    const [layout, setLayout] = useState<SheetLayout>("per_group");
    const [selectedGroupIds, setSelectedGroupIds] = useState<number[]>(() =>
        groups.map((group) => group.id)
    );

    useEffect(() => {
        if (open) {
            setSelectedGroupIds(groups.map((group) => group.id));
        }
    }, [open, groups]);

    const hasGroups = groups.length > 0;
    const allGroupsSelected = selectedGroupIds.length === groups.length;
    const isRangeInverted = !!from && !!to && from > to;
    const canExport =
        !!from &&
        !!to &&
        !isRangeInverted &&
        (!hasGroups || selectedGroupIds.length > 0);

    const toggleGroup = (groupId: number) => {
        setSelectedGroupIds((current) =>
            current.includes(groupId)
                ? current.filter((id) => id !== groupId)
                : [...current, groupId]
        );
    };

    const applyMonth = (monthsAgo: number) => {
        const month = subMonths(new Date(), monthsAgo);
        setFrom(startOfMonth(month));
        setTo(monthsAgo === 0 ? new Date() : endOfMonth(month));
    };

    const handleExport = () => {
        if (!from || !to || !canExport) {
            return;
        }

        window.open(
            route("groups.attendanceExport", {
                club: club.id,
                category: category.id,
                from: format(from, "yyyy-MM-dd"),
                to: format(to, "yyyy-MM-dd"),
                layout,
                group_ids:
                    hasGroups && !allGroupsSelected
                        ? selectedGroupIds
                        : undefined,
            }),
            "_new"
        );
        onOpenChange(false);
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-lg">
                <DialogHeader>
                    <DialogTitle>تصدير سجل الحضور</DialogTitle>
                    <DialogDescription>
                        {club.name} - {category.display_name}
                    </DialogDescription>
                </DialogHeader>

                <div className="flex flex-col gap-5 py-2">
                    <div className="flex flex-col gap-2">
                        <div className="grid grid-cols-2 gap-3">
                            <DateField
                                label="من تاريخ"
                                placeholder="اختر التاريخ"
                                value={from}
                                onChange={setFrom}
                            />
                            <DateField
                                label="إلى تاريخ"
                                placeholder="اختر التاريخ"
                                value={to}
                                onChange={setTo}
                            />
                        </div>
                        <div className="flex gap-2">
                            <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                onClick={() => applyMonth(0)}
                            >
                                هذا الشهر
                            </Button>
                            <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                onClick={() => applyMonth(1)}
                            >
                                الشهر الماضي
                            </Button>
                        </div>
                        {isRangeInverted && (
                            <div className="flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 p-3 text-red-700">
                                <AlertTriangle className="h-4 w-4" />
                                <span className="text-sm">
                                    تاريخ النهاية يجب أن يكون بعد تاريخ البداية
                                </span>
                            </div>
                        )}
                    </div>

                    {hasGroups && (
                        <>
                            <div className="flex flex-col gap-2">
                                <Label>تقسيم الأوراق</Label>
                                <div className="flex w-fit gap-1 rounded-lg border p-1">
                                    {layoutOptions.map((option) => (
                                        <Button
                                            key={option.value}
                                            type="button"
                                            size="sm"
                                            variant={
                                                layout === option.value
                                                    ? "default"
                                                    : "ghost"
                                            }
                                            onClick={() =>
                                                setLayout(option.value)
                                            }
                                        >
                                            {option.label}
                                        </Button>
                                    ))}
                                </div>
                            </div>

                            <div className="flex flex-col gap-2">
                                <Label>الأفواج</Label>
                                <div className="flex max-h-48 flex-col gap-1 overflow-y-auto rounded-lg border p-2">
                                    {groups.map((group) => (
                                        <label
                                            key={group.id}
                                            className="flex cursor-pointer select-none items-center gap-2 rounded p-2 hover:bg-gray-100"
                                        >
                                            <Checkbox
                                                checked={selectedGroupIds.includes(
                                                    group.id
                                                )}
                                                onCheckedChange={() =>
                                                    toggleGroup(group.id)
                                                }
                                            />
                                            <span className="text-sm">
                                                فوج {group.name}
                                            </span>
                                        </label>
                                    ))}
                                </div>
                                {ungroupedCount > 0 && (
                                    <p className="text-sm text-gray-500">
                                        {allGroupsSelected
                                            ? `يشمل الملف ${ungroupedCount} طالب بدون فوج`
                                            : "الطلاب بدون فوج غير مشمولين عند تحديد أفواج معينة"}
                                    </p>
                                )}
                            </div>
                        </>
                    )}
                </div>

                <DialogFooter>
                    <Button
                        variant="outline"
                        onClick={() => onOpenChange(false)}
                    >
                        إلغاء
                    </Button>
                    <Button
                        onClick={handleExport}
                        disabled={!canExport}
                        className="gap-2"
                    >
                        <FileSpreadsheet className="h-4 w-4" />
                        تصدير
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
