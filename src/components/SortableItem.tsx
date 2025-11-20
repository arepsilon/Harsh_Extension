import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { GripVertical, X } from 'lucide-react';

interface SortableItemProps {
    id: string;
    label: string;
    onRemove?: () => void;
    extraControls?: React.ReactNode;
}

export const SortableItem = ({ id, label, onRemove, extraControls }: SortableItemProps) => {
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
    } = useSortable({ id });

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
    };

    return (
        <div
            ref={setNodeRef}
            style={style}
            className="flex items-center justify-between p-2 mb-2 bg-white border rounded shadow-sm group"
        >
            <div className="flex items-center flex-1">
                <div {...attributes} {...listeners} className="cursor-grab mr-2 text-gray-400 hover:text-gray-600">
                    <GripVertical size={16} />
                </div>
                <span className="text-sm font-medium text-gray-700 truncate" title={label}>
                    {label}
                </span>
            </div>

            <div className="flex items-center">
                {extraControls}
                {onRemove && (
                    <button
                        onClick={onRemove}
                        className="ml-2 text-gray-400 hover:text-red-500 transition-colors"
                    >
                        <X size={16} />
                    </button>
                )}
            </div>
        </div>
    );
};
