import { Button } from "@/Components/ui/button";
import { Calendar } from "@/Components/ui/calendar";
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/Components/ui/popover";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/Components/ui/select";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { ar } from "date-fns/locale";
import { CalendarIcon } from "lucide-react";

export type DatePreset = "all" | "today" | "last_7" | "last_30" | "custom";

const presetOptions: { value: DatePreset; label: string }[] = [
    { value: "all", label: "كل الوقت" },
    { value: "today", label: "اليوم" },
    { value: "last_7", label: "آخر 7 أيام" },
    { value: "last_30", label: "آخر 30 يوم" },
    { value: "custom", label: "مخصص" },
];

interface Props {
    preset: DatePreset;
    from: string | null;
    to: string | null;
    onChange: (next: { preset: DatePreset; from: string | null; to: string | null }) => void;
}

export default function DateRangePicker({ preset, from, to, onChange }: Props) {
    const fromDate = from ? new Date(from) : undefined;
    const toDate = to ? new Date(to) : undefined;

    const handlePresetChange = (value: string) => {
        const next = value as DatePreset;
        if (next === "custom") {
            onChange({ preset: next, from, to });
        } else {
            onChange({ preset: next, from: null, to: null });
        }
    };

    const handleDateChange = (which: "from" | "to", date: Date | undefined) => {
        const formatted = date ? format(date, "yyyy-MM-dd") : null;
        onChange({
            preset: "custom",
            from: which === "from" ? formatted : from,
            to: which === "to" ? formatted : to,
        });
    };

    return (
        <div className="flex flex-col gap-2">
            <Select dir="rtl" value={preset} onValueChange={handlePresetChange}>
                <SelectTrigger>
                    <SelectValue placeholder="الفترة الزمنية" />
                </SelectTrigger>
                <SelectContent>
                    {presetOptions.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                            {option.label}
                        </SelectItem>
                    ))}
                </SelectContent>
            </Select>

            {preset === "custom" && (
                <div className="flex gap-2">
                    <Popover>
                        <PopoverTrigger asChild>
                            <Button
                                variant="outline"
                                className={cn(
                                    "flex-1 justify-start text-start font-normal",
                                    !fromDate && "text-muted-foreground"
                                )}
                            >
                                <CalendarIcon className="me-2 h-4 w-4" />
                                {fromDate ? (
                                    format(fromDate, "dd/MM/yyyy")
                                ) : (
                                    <span>من تاريخ</span>
                                )}
                            </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start" dir="rtl">
                            <Calendar
                                mode="single"
                                selected={fromDate}
                                onSelect={(date) => handleDateChange("from", date)}
                                locale={ar}
                                autoFocus
                            />
                        </PopoverContent>
                    </Popover>

                    <Popover>
                        <PopoverTrigger asChild>
                            <Button
                                variant="outline"
                                className={cn(
                                    "flex-1 justify-start text-start font-normal",
                                    !toDate && "text-muted-foreground"
                                )}
                            >
                                <CalendarIcon className="me-2 h-4 w-4" />
                                {toDate ? (
                                    format(toDate, "dd/MM/yyyy")
                                ) : (
                                    <span>إلى تاريخ</span>
                                )}
                            </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start" dir="rtl">
                            <Calendar
                                mode="single"
                                selected={toDate}
                                onSelect={(date) => handleDateChange("to", date)}
                                locale={ar}
                                autoFocus
                            />
                        </PopoverContent>
                    </Popover>
                </div>
            )}
        </div>
    );
}
