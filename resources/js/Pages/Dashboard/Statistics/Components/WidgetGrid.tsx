import { Statistics, Widget } from "@/types";
import {
    DndContext,
    closestCenter,
    KeyboardSensor,
    PointerSensor,
    useSensor,
    useSensors,
    DragEndEvent,
} from "@dnd-kit/core";
import {
    arrayMove,
    SortableContext,
    sortableKeyboardCoordinates,
    rectSortingStrategy,
} from "@dnd-kit/sortable";
import { useCallback } from "react";
import WidgetWrapper from "./WidgetWrapper";
import { getWidgetDefinition } from "./WidgetRegistry";

interface Props {
    widgets: Widget[];
    statistics: Statistics;
    onLayoutChange: (widgets: Widget[]) => void;
    isLoading: boolean;
}

export default function WidgetGrid({
    widgets,
    statistics,
    onLayoutChange,
    isLoading,
}: Props) {
    const sensors = useSensors(
        useSensor(PointerSensor, {
            activationConstraint: {
                distance: 8,
            },
        }),
        useSensor(KeyboardSensor, {
            coordinateGetter: sortableKeyboardCoordinates,
        })
    );

    const handleDragEnd = useCallback(
        (event: DragEndEvent) => {
            const { active, over } = event;

            if (over && active.id !== over.id) {
                const oldIndex = widgets.findIndex((w) => w.id === active.id);
                const newIndex = widgets.findIndex((w) => w.id === over.id);

                const newWidgets = arrayMove(widgets, oldIndex, newIndex);
                onLayoutChange(newWidgets);
            }
        },
        [widgets, onLayoutChange]
    );

    const handleToggleVisibility = useCallback(
        (id: string) => {
            const newWidgets = widgets.map((w) =>
                w.id === id ? { ...w, visible: !w.visible } : w
            );
            onLayoutChange(newWidgets);
        },
        [widgets, onLayoutChange]
    );

    const visibleWidgets = widgets.filter((w) => w.visible);

    return (
        <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={handleDragEnd}
        >
            <SortableContext
                items={visibleWidgets.map((w) => w.id)}
                strategy={rectSortingStrategy}
            >
                <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
                    {visibleWidgets.map((widget) => {
                        const definition = getWidgetDefinition(widget.type);

                        if (!definition) {
                            return null;
                        }

                        const WidgetComponent = definition.component;
                        const menuItems = definition.getMenuItems?.(statistics);

                        return (
                            <WidgetWrapper
                                key={widget.id}
                                widget={widget}
                                title={definition.title}
                                icon={definition.icon}
                                onToggleVisibility={handleToggleVisibility}
                                isLoading={isLoading}
                                menuItems={menuItems}
                            >
                                <WidgetComponent statistics={statistics} />
                            </WidgetWrapper>
                        );
                    })}
                </div>
            </SortableContext>
        </DndContext>
    );
}
