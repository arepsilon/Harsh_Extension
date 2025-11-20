import { useState, useEffect } from 'react';
import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors } from '@dnd-kit/core';
import type { DragEndEvent } from '@dnd-kit/core';
import { SortableContext, sortableKeyboardCoordinates, verticalListSortingStrategy, arrayMove } from '@dnd-kit/sortable';
import { SortableItem } from './SortableItem';

interface ManualSortModalProps {
    isOpen: boolean;
    onClose: () => void;
    field: string;
    initialItems: string[]; // All unique values for this field
    currentOrder: string[]; // Existing manual order if any
    onSave: (field: string, newOrder: string[]) => void;
}

export const ManualSortModal = ({
    isOpen,
    onClose,
    field,
    initialItems,
    currentOrder,
    onSave
}: ManualSortModalProps) => {
    const [items, setItems] = useState<string[]>([]);

    const sensors = useSensors(
        useSensor(PointerSensor),
        useSensor(KeyboardSensor, {
            coordinateGetter: sortableKeyboardCoordinates,
        })
    );

    useEffect(() => {
        if (isOpen) {
            // Initialize items based on currentOrder + any new items in initialItems
            const orderedSet = new Set(currentOrder);
            const remainingItems = initialItems.filter(item => !orderedSet.has(item));

            // Filter out any items in currentOrder that are no longer in initialItems (data changed?)
            const validCurrentOrder = currentOrder.filter(item => initialItems.includes(item));

            setItems([...validCurrentOrder, ...remainingItems]);
        }
    }, [isOpen, initialItems, currentOrder]);

    const handleDragEnd = (event: DragEndEvent) => {
        const { active, over } = event;
        if (active.id !== over?.id) {
            setItems((items) => {
                const oldIndex = items.indexOf(active.id as string);
                const newIndex = items.indexOf(over!.id as string);
                return arrayMove(items, oldIndex, newIndex);
            });
        }
    };

    const handleSave = () => {
        onSave(field, items);
        onClose();
    };

    if (!isOpen) return null;

    return (
        <div className="absolute inset-0 z-50 bg-black/50 flex items-center justify-center p-8">
            <div className="bg-white rounded-lg shadow-xl w-[500px] max-h-[80vh] flex flex-col overflow-hidden">
                <div className="flex justify-between items-center p-4 border-b">
                    <h3 className="text-lg font-semibold">Manual Sort: {field}</h3>
                    <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>

                <div className="p-2 bg-blue-50 text-xs text-blue-800 border-b">
                    Drag items to reorder. New items will appear at the bottom.
                </div>

                <div className="flex-1 overflow-auto p-4 bg-gray-50">
                    <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
                        <SortableContext items={items} strategy={verticalListSortingStrategy}>
                            {items.map(item => (
                                <SortableItem
                                    key={item}
                                    id={item}
                                    label={item}
                                // No remove button in this context
                                />
                            ))}
                        </SortableContext>
                    </DndContext>
                </div>

                <div className="p-4 border-t flex justify-end gap-2">
                    <button onClick={onClose} className="px-4 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded">
                        Cancel
                    </button>
                    <button onClick={handleSave} className="px-4 py-2 text-sm bg-blue-600 text-white rounded hover:bg-blue-700">
                        Apply Order
                    </button>
                </div>
            </div>
        </div>
    );
};
