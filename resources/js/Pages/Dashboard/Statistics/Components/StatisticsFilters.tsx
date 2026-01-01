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
import {
    Category,
    Club,
    StatisticsFilters as TStatisticsFilters,
} from "@/types";
import { format } from "date-fns";
import { ar } from "date-fns/locale";
import { CalendarIcon, Loader2 } from "lucide-react";
import { useState } from "react";

interface Props {
    filters: TStatisticsFilters;
    clubs: Club[];
    categories: Category[];
    onFilterChange: (filters: TStatisticsFilters) => void;
    isLoading: boolean;
}

const rangeOptions = [
    { value: "all", label: "كل الوقت" },
    { value: "week", label: "آخر أسبوع" },
    { value: "month", label: "آخر شهر" },
    { value: "3months", label: "آخر 3 أشهر" },
    { value: "6months", label: "آخر 6 أشهر" },
    { value: "year", label: "آخر سنة" },
    { value: "custom", label: "مخصص" },
];

export default function StatisticsFilters({
    filters,
    clubs,
    categories,
    onFilterChange,
    isLoading,
}: Props) {
    const [startDate, setStartDate] = useState<Date | undefined>(
        filters.start_date ? new Date(filters.start_date) : undefined
    );
    const [endDate, setEndDate] = useState<Date | undefined>(
        filters.end_date ? new Date(filters.end_date) : undefined
    );

    const handleRangeChange = (value: string) => {
        if (value === "custom") {
            onFilterChange({
                ...filters,
                range: value,
            });
        } else {
            onFilterChange({
                ...filters,
                range: value,
                start_date: null,
                end_date: null,
            });
        }
    };

    const handleClubChange = (value: string) => {
        onFilterChange({
            ...filters,
            club_id: value === "all" ? null : Number(value),
        });
    };

    const handleCategoryChange = (value: string) => {
        onFilterChange({
            ...filters,
            category_id: value === "all" ? null : Number(value),
        });
    };

    const handleDateChange = (
        type: "start" | "end",
        date: Date | undefined
    ) => {
        if (type === "start") {
            setStartDate(date);
            if (date && endDate) {
                onFilterChange({
                    ...filters,
                    range: "custom",
                    start_date: format(date, "yyyy-MM-dd"),
                    end_date: format(endDate, "yyyy-MM-dd"),
                });
            }
        } else {
            setEndDate(date);
            if (startDate && date) {
                onFilterChange({
                    ...filters,
                    range: "custom",
                    start_date: format(startDate, "yyyy-MM-dd"),
                    end_date: format(date, "yyyy-MM-dd"),
                });
            }
        }
    };

    return (
        <div className="flex flex-wrap items-center gap-3">
            {isLoading && (
                <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
            )}

            {/* Time Range Filter */}
            <Select
                dir="rtl"
                value={filters.range}
                onValueChange={handleRangeChange}
            >
                <SelectTrigger className="w-[150px]">
                    <SelectValue placeholder="الفترة الزمنية" />
                </SelectTrigger>
                <SelectContent>
                    {rangeOptions.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                            {option.label}
                        </SelectItem>
                    ))}
                </SelectContent>
            </Select>

            {/* Custom Date Range */}
            {filters.range === "custom" && (
                <>
                    <Popover>
                        <PopoverTrigger asChild>
                            <Button
                                variant="outline"
                                className={cn(
                                    "w-[140px] justify-start text-right font-normal",
                                    !startDate && "text-muted-foreground"
                                )}
                            >
                                <CalendarIcon className="ml-2 h-4 w-4" />
                                {startDate ? (
                                    format(startDate, "dd/MM/yyyy")
                                ) : (
                                    <span>من تاريخ</span>
                                )}
                            </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                            <Calendar
                                mode="single"
                                selected={startDate}
                                onSelect={(date) =>
                                    handleDateChange("start", date)
                                }
                                locale={ar}
                                initialFocus
                            />
                        </PopoverContent>
                    </Popover>

                    <Popover>
                        <PopoverTrigger asChild>
                            <Button
                                variant="outline"
                                className={cn(
                                    "w-[140px] justify-start text-right font-normal",
                                    !endDate && "text-muted-foreground"
                                )}
                            >
                                <CalendarIcon className="ml-2 h-4 w-4" />
                                {endDate ? (
                                    format(endDate, "dd/MM/yyyy")
                                ) : (
                                    <span>إلى تاريخ</span>
                                )}
                            </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                            <Calendar
                                mode="single"
                                selected={endDate}
                                onSelect={(date) =>
                                    handleDateChange("end", date)
                                }
                                locale={ar}
                                initialFocus
                            />
                        </PopoverContent>
                    </Popover>
                </>
            )}

            {/* Club Filter */}
            <Select
                dir="rtl"
                value={filters.club_id ? String(filters.club_id) : "all"}
                onValueChange={handleClubChange}
            >
                <SelectTrigger className="w-[150px]">
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

            {/* Category Filter */}
            <Select
                dir="rtl"
                value={
                    filters.category_id ? String(filters.category_id) : "all"
                }
                onValueChange={handleCategoryChange}
            >
                <SelectTrigger className="w-[150px]">
                    <SelectValue placeholder="الفئة" />
                </SelectTrigger>
                <SelectContent>
                    <SelectItem value="all">جميع الفئات</SelectItem>
                    {categories.map((category) => (
                        <SelectItem
                            key={category.id}
                            value={String(category.id)}
                        >
                            {category.display_name}
                        </SelectItem>
                    ))}
                </SelectContent>
            </Select>
        </div>
    );
}
