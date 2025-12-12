import { Card, CardContent, CardHeader, CardTitle } from "@/Components/ui/card";
import { Button } from "@/Components/ui/button";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/Components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import { Widget } from "@/types";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { EyeOff, GripVertical, MoreVertical } from "lucide-react";
import { ReactNode } from "react";

interface Props {
    widget: Widget;
    title: string;
    icon?: ReactNode;
    children: ReactNode;
    onToggleVisibility?: (id: string) => void;
    isLoading?: boolean;
}

export default function WidgetWrapper({
    widget,
    title,
    icon,
    children,
    onToggleVisibility,
    isLoading,
}: Props) {
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
        isDragging,
    } = useSortable({ id: widget.id });

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
    };

    if (!widget.visible) {
        return null;
    }

    return (
        <Card
            ref={setNodeRef}
            style={style}
            className={cn(
                "relative overflow-hidden transition-all h-[280px]",
                isDragging && "opacity-50 shadow-lg ring-2 ring-primary z-50",
                isLoading && "animate-pulse"
            )}
        >
            <CardHeader className="flex flex-row items-center justify-between space-y-0 py-3 px-4">
                <div className="flex items-center gap-2">
                    <button
                        {...attributes}
                        {...listeners}
                        className="cursor-grab touch-none hover:text-primary active:cursor-grabbing"
                    >
                        <GripVertical className="h-4 w-4 text-muted-foreground" />
                    </button>
                    {icon}
                    <CardTitle className="text-sm font-medium">{title}</CardTitle>
                </div>

                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-7 w-7">
                            <MoreVertical className="h-4 w-4" />
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                        <DropdownMenuItem
                            onClick={() => onToggleVisibility?.(widget.id)}
                        >
                            <EyeOff className="ml-2 h-4 w-4" />
                            إخفاء
                        </DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>
            </CardHeader>
            <CardContent className="h-[calc(100%-52px)] px-4 pb-4 overflow-auto">
                {children}
            </CardContent>
        </Card>
    );
}
