import DashboardLayout from "@/Layouts/DashboardLayout";
import { Head, router } from "@inertiajs/react";
import {
    Widget,
    Statistics,
    StatisticsFilters as TStatisticsFilters,
    Club,
    Category,
    TUser,
} from "@/types";
import { useState, useCallback, useMemo } from "react";
import StatisticsFilters from "./Components/StatisticsFilters";
import WidgetGrid from "./Components/WidgetGrid";
import { debounce } from "lodash";
import axios from "axios";
import { Button } from "@/Components/ui/button";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/Components/ui/dropdown-menu";
import { Eye, RotateCcw, Settings2 } from "lucide-react";
import { getWidgetDefinition, widgetRegistry } from "./Components/WidgetRegistry";

interface Props {
    auth: { user: TUser };
    layout: Widget[];
    statistics: Statistics;
    clubs: Club[];
    categories: Category[];
    filters: TStatisticsFilters;
}

export default function StatisticsIndex({
    auth,
    layout: initialLayout,
    statistics: initialStatistics,
    clubs,
    categories,
    filters: initialFilters,
}: Props) {
    const [widgets, setWidgets] = useState<Widget[]>(initialLayout);
    const [statistics, setStatistics] = useState<Statistics>(initialStatistics);
    const [filters, setFilters] = useState<TStatisticsFilters>(initialFilters);
    const [isLoading, setIsLoading] = useState(false);

    // Debounced layout save
    const saveLayout = useMemo(
        () =>
            debounce(async (newWidgets: Widget[]) => {
                try {
                    await axios.put("/statistics/layout", { widgets: newWidgets });
                } catch (error) {
                    console.error("Failed to save layout:", error);
                }
            }, 1000),
        []
    );

    // Update widget layout
    const handleLayoutChange = useCallback(
        (newWidgets: Widget[]) => {
            setWidgets(newWidgets);
            saveLayout(newWidgets);
        },
        [saveLayout]
    );

    // Restore a hidden widget
    const handleRestoreWidget = useCallback(
        (id: string) => {
            const newWidgets = widgets.map((w) =>
                w.id === id ? { ...w, visible: true } : w
            );
            setWidgets(newWidgets);
            saveLayout(newWidgets);
        },
        [widgets, saveLayout]
    );

    // Reset to default layout
    const handleResetLayout = useCallback(() => {
        router.delete("/statistics/layout", {
            preserveScroll: true,
            preserveState: false,
        });
    }, []);

    // Get hidden widgets
    const hiddenWidgets = useMemo(() => {
        return widgets.filter((w) => !w.visible);
    }, [widgets]);

    // Fetch new statistics when filters change
    const fetchStatistics = useCallback(async (newFilters: TStatisticsFilters) => {
        setIsLoading(true);
        try {
            const params = new URLSearchParams();
            params.append("range", newFilters.range);
            if (newFilters.start_date) params.append("start_date", newFilters.start_date);
            if (newFilters.end_date) params.append("end_date", newFilters.end_date);
            if (newFilters.club_id) params.append("club_id", String(newFilters.club_id));
            if (newFilters.category_id) params.append("category_id", String(newFilters.category_id));

            const response = await axios.get(`/statistics/data?${params.toString()}`);
            setStatistics(response.data);
        } catch (error) {
            console.error("Failed to fetch statistics:", error);
        } finally {
            setIsLoading(false);
        }
    }, []);

    // Handle filter changes
    const handleFilterChange = useCallback(
        (newFilters: TStatisticsFilters) => {
            setFilters(newFilters);
            fetchStatistics(newFilters);
        },
        [fetchStatistics]
    );

    return (
        <DashboardLayout user={auth.user}>
            <Head title="الإحصائيات" />

            <div className="space-y-6">
                <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                    <div className="flex items-center gap-3">
                        <h1 className="text-2xl font-bold">الإحصائيات</h1>
                        <DropdownMenu dir="rtl">
                            <DropdownMenuTrigger asChild>
                                <Button variant="outline" size="icon" className="h-8 w-8">
                                    <Settings2 className="h-4 w-4" />
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="start" className="w-56">
                                {hiddenWidgets.length > 0 && (
                                    <>
                                        <div className="px-2 py-1.5 text-sm font-semibold text-muted-foreground">
                                            إظهار الإحصائيات المخفية
                                        </div>
                                        {hiddenWidgets.map((widget) => {
                                            const definition = getWidgetDefinition(widget.type);
                                            return (
                                                <DropdownMenuItem
                                                    key={widget.id}
                                                    onClick={() => handleRestoreWidget(widget.id)}
                                                    className="gap-2"
                                                >
                                                    <Eye className="h-4 w-4" />
                                                    {definition?.title || widget.type}
                                                </DropdownMenuItem>
                                            );
                                        })}
                                        <DropdownMenuSeparator />
                                    </>
                                )}
                                <DropdownMenuItem
                                    onClick={handleResetLayout}
                                    className="gap-2 text-amber-600 focus:text-amber-600"
                                >
                                    <RotateCcw className="h-4 w-4" />
                                    إعادة الترتيب الافتراضي
                                </DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>
                    </div>
                    <StatisticsFilters
                        filters={filters}
                        clubs={clubs}
                        categories={categories}
                        onFilterChange={handleFilterChange}
                        isLoading={isLoading}
                    />
                </div>

                <WidgetGrid
                    widgets={widgets}
                    statistics={statistics}
                    onLayoutChange={handleLayoutChange}
                    isLoading={isLoading}
                />
            </div>
        </DashboardLayout>
    );
}
