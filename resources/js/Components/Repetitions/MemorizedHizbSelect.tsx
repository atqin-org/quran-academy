import { useMemo } from "react";
import {
    Select,
    SelectContent,
    SelectGroup,
    SelectItem,
    SelectLabel,
    SelectTrigger,
    SelectValue,
} from "@/Components/ui/select";
import type { HizbOption } from "./types";

interface Props {
    value: number | null;
    onChange: (id: number | null) => void;
    ahzab: HizbOption[];
    lastHizbAscending: number | null;
    lastHizbDescending: number | null;
    disabled?: boolean;
    placeholder?: string;
}

export default function MemorizedHizbSelect({
    value,
    onChange,
    ahzab,
    lastHizbAscending,
    lastHizbDescending,
    disabled,
    placeholder = "إختر...",
}: Props) {
    const grouped = useMemo(() => {
        const ascending: HizbOption[] = [];
        const descending: HizbOption[] = [];
        const outside: HizbOption[] = [];

        for (const h of ahzab) {
            if (lastHizbAscending !== null && h.number <= lastHizbAscending) {
                ascending.push(h);
            } else if (lastHizbDescending !== null && h.number >= lastHizbDescending) {
                descending.push(h);
            } else {
                outside.push(h);
            }
        }

        ascending.sort((a, b) => a.number - b.number);
        descending.sort((a, b) => b.number - a.number);

        return { ascending, descending, outside };
    }, [ahzab, lastHizbAscending, lastHizbDescending]);

    const hasMemorized = grouped.ascending.length + grouped.descending.length > 0;

    return (
        <Select
            value={value !== null ? String(value) : ""}
            onValueChange={(v) => onChange(v === "" ? null : Number(v))}
            disabled={disabled}
            dir="rtl"
        >
            <SelectTrigger className="h-9">
                <SelectValue placeholder={placeholder} />
            </SelectTrigger>
            <SelectContent>
                {!hasMemorized && (
                    <SelectGroup>
                        <SelectLabel className="text-muted-foreground">لا توجد أحزاب محفوظة بعد</SelectLabel>
                    </SelectGroup>
                )}
                {grouped.ascending.length > 0 && (
                    <SelectGroup>
                        <SelectLabel>تصاعدي</SelectLabel>
                        {grouped.ascending.map((h) => (
                            <SelectItem key={h.id} value={String(h.id)}>
                                <span className="flex flex-col items-start">
                                    <span>الحزب {h.number}</span>
                                    <span className="text-xs text-muted-foreground">{h.start}</span>
                                </span>
                            </SelectItem>
                        ))}
                    </SelectGroup>
                )}
                {grouped.descending.length > 0 && (
                    <SelectGroup>
                        <SelectLabel>تنازلي</SelectLabel>
                        {grouped.descending.map((h) => (
                            <SelectItem key={h.id} value={String(h.id)}>
                                <span className="flex flex-col items-start">
                                    <span>الحزب {h.number}</span>
                                    <span className="text-xs text-muted-foreground">{h.start}</span>
                                </span>
                            </SelectItem>
                        ))}
                    </SelectGroup>
                )}
            </SelectContent>
        </Select>
    );
}
