import { Button } from "@/Components/ui/button";
import { Label } from "@/Components/ui/label";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/Components/ui/select";
import {
    Sheet,
    SheetContent,
    SheetDescription,
    SheetFooter,
    SheetHeader,
    SheetTitle,
} from "@/Components/ui/sheet";
import { useEffect, useState } from "react";
import DateRangePicker, { DatePreset } from "./DateRangePicker";

export interface AdvancedFilters {
    causer_id: number | null;
    event: string | null;
    date_preset: DatePreset;
    date_from: string | null;
    date_to: string | null;
}

export interface CauserOption {
    id: number;
    name: string;
    last_name?: string | null;
}

const eventOptions: { value: string; label: string }[] = [
    { value: "created", label: "إنشاء" },
    { value: "updated", label: "تحديث" },
    { value: "deleted", label: "حذف" },
    { value: "archived", label: "أرشفة" },
    { value: "restored", label: "استعادة" },
    { value: "force_deleted", label: "حذف نهائي" },
    { value: "merged_and_force_deleted", label: "دمج وحذف" },
];

interface Props {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    filters: AdvancedFilters;
    causerOptions: CauserOption[];
    onApply: (filters: AdvancedFilters) => void;
}

const emptyFilters: AdvancedFilters = {
    causer_id: null,
    event: null,
    date_preset: "all",
    date_from: null,
    date_to: null,
};

export default function LogFilters({
    open,
    onOpenChange,
    filters,
    causerOptions,
    onApply,
}: Props) {
    const [draft, setDraft] = useState<AdvancedFilters>(filters);

    useEffect(() => {
        if (open) {
            setDraft(filters);
        }
    }, [open, filters]);

    const handleCauserChange = (value: string) => {
        setDraft({ ...draft, causer_id: value === "all" ? null : Number(value) });
    };

    const handleEventChange = (value: string) => {
        setDraft({ ...draft, event: value === "all" ? null : value });
    };

    const handleDateChange = (next: {
        preset: DatePreset;
        from: string | null;
        to: string | null;
    }) => {
        setDraft({
            ...draft,
            date_preset: next.preset,
            date_from: next.from,
            date_to: next.to,
        });
    };

    const handleApply = () => {
        onApply(draft);
        onOpenChange(false);
    };

    const handleReset = () => {
        setDraft(emptyFilters);
        onApply(emptyFilters);
        onOpenChange(false);
    };

    return (
        <Sheet open={open} onOpenChange={onOpenChange}>
            <SheetContent side="left" className="flex flex-col gap-6">
                <SheetHeader>
                    <SheetTitle>فلاتر متقدمة</SheetTitle>
                    <SheetDescription>
                        قم بتصفية السجلات حسب المستخدم، نوع الحدث، أو الفترة
                        الزمنية.
                    </SheetDescription>
                </SheetHeader>

                <div className="flex flex-col gap-5">
                    <div className="flex flex-col gap-2">
                        <Label>المستخدم</Label>
                        <Select
                            dir="rtl"
                            value={draft.causer_id ? String(draft.causer_id) : "all"}
                            onValueChange={handleCauserChange}
                        >
                            <SelectTrigger>
                                <SelectValue placeholder="جميع المستخدمين" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">
                                    جميع المستخدمين
                                </SelectItem>
                                {causerOptions.map((c) => (
                                    <SelectItem key={c.id} value={String(c.id)}>
                                        {[c.name, c.last_name]
                                            .filter(Boolean)
                                            .join(" ")}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="flex flex-col gap-2">
                        <Label>نوع الحدث</Label>
                        <Select
                            dir="rtl"
                            value={draft.event ?? "all"}
                            onValueChange={handleEventChange}
                        >
                            <SelectTrigger>
                                <SelectValue placeholder="جميع الأحداث" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">جميع الأحداث</SelectItem>
                                {eventOptions.map((e) => (
                                    <SelectItem key={e.value} value={e.value}>
                                        {e.label}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="flex flex-col gap-2">
                        <Label>الفترة الزمنية</Label>
                        <DateRangePicker
                            preset={draft.date_preset}
                            from={draft.date_from}
                            to={draft.date_to}
                            onChange={handleDateChange}
                        />
                    </div>
                </div>

                <SheetFooter className="mt-auto flex-row gap-2">
                    <Button onClick={handleApply} className="flex-1">
                        تطبيق
                    </Button>
                    <Button
                        variant="outline"
                        onClick={handleReset}
                        className="flex-1"
                    >
                        إعادة تعيين
                    </Button>
                </SheetFooter>
            </SheetContent>
        </Sheet>
    );
}

export { eventOptions };
