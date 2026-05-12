import * as React from "react";
import { ChevronDown, ChevronLeft, ChevronRight, ChevronUp } from "lucide-react";
import { DayPicker } from "react-day-picker";

import { cn } from "@/lib/utils";
import { buttonVariants } from "@/Components/ui/button";

export type CalendarProps = React.ComponentProps<typeof DayPicker>;

function Calendar({
    className,
    classNames,
    showOutsideDays = true,
    ...props
}: CalendarProps) {
    return (
        <DayPicker
            showOutsideDays={showOutsideDays}
            className={cn("p-3", className)}
            classNames={{
                months: "flex flex-col sm:flex-row gap-y-4 sm:gap-x-6 sm:gap-y-0",
                month: "flex flex-col gap-4 first:border-s first:ps-4",
                month_caption: "flex justify-center pt-1 relative items-center",
                caption_label: "inline-flex items-center gap-1 text-sm font-medium",
                nav: "flex items-center gap-1",
                button_previous: cn(
                    buttonVariants({ variant: "outline" }),
                    "absolute start-1 top-1 h-7 w-7 bg-transparent p-0 opacity-50 hover:opacity-100"
                ),
                button_next: cn(
                    buttonVariants({ variant: "outline" }),
                    "absolute end-1 top-1 h-7 w-7 bg-transparent p-0 opacity-50 hover:opacity-100"
                ),
                month_grid: "w-full border-collapse",
                weekdays: "flex",
                weekday:
                    "text-muted-foreground rounded-md w-9 font-normal text-[0.8rem]",
                week: "flex w-full mt-2",
                day: cn(
                    "h-9 w-9 text-center text-sm p-0 relative",
                    "[&:has([aria-selected].range_end)]:rounded-e-md",
                    "[&:has([aria-selected].outside)]:bg-accent/50",
                    "[&:has([aria-selected])]:bg-accent",
                    "first:[&:has([aria-selected])]:rounded-s-md",
                    "last:[&:has([aria-selected])]:rounded-e-md",
                    "focus-within:relative focus-within:z-20"
                ),
                day_button: cn(
                    buttonVariants({ variant: "ghost" }),
                    "h-9 w-9 p-0 font-normal aria-selected:opacity-100"
                ),
                range_end: "range_end",
                selected:
                    "bg-primary text-primary-foreground hover:bg-primary hover:text-primary-foreground focus:bg-primary focus:text-primary-foreground",
                today: "bg-accent text-accent-foreground",
                outside:
                    "outside text-muted-foreground opacity-50 aria-selected:bg-accent/50 aria-selected:text-muted-foreground aria-selected:opacity-30",
                disabled: "text-muted-foreground opacity-50",
                range_middle:
                    "aria-selected:bg-accent aria-selected:text-accent-foreground",
                hidden: "invisible",
                dropdowns: "flex items-center gap-2",
                dropdown_root:
                    "relative inline-flex items-center gap-1 rounded-md border border-input bg-background px-2 py-1 hover:bg-accent hover:text-accent-foreground cursor-pointer",
                dropdown:
                    "absolute inset-0 z-10 cursor-pointer opacity-0",
                ...classNames,
            }}
            components={{
                Chevron: ({ orientation, className: chevronClassName, ...chevronProps }) => {
                    const Icon = {
                        left: ChevronLeft,
                        right: ChevronRight,
                        up: ChevronUp,
                        down: ChevronDown,
                    }[orientation ?? "right"];
                    return <Icon className={cn("h-4 w-4", chevronClassName)} {...chevronProps} />;
                },
            }}
            {...props}
        />
    );
}
Calendar.displayName = "Calendar";

export { Calendar };
