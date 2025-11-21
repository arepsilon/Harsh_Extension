import { useState, useEffect } from 'react';
import type { HeaderRow } from '../types';

interface HeaderRowEditorProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (headerRow: HeaderRow) => void;
    initialHeaderRow?: HeaderRow;
    availableFields?: string[];
    availableFilters?: string[];
}

export const HeaderRowEditor = ({
    isOpen,
    onClose,
    onSave,
    initialHeaderRow,
    availableFields = [],
    availableFilters = []
}: HeaderRowEditorProps) => {
    const [type, setType] = useState<'title' | 'filters' | 'custom_field' | 'refresh_date'>(initialHeaderRow?.type || 'title');
    const [titleText, setTitleText] = useState(initialHeaderRow?.titleText || '');
    const [titleField, setTitleField] = useState(initialHeaderRow?.titleField || '');
    const [useTitleField, setUseTitleField] = useState(!!initialHeaderRow?.titleField);
    const [selectedFilters, setSelectedFilters] = useState<string[]>(initialHeaderRow?.selectedFilters || []);
    const [customField, setCustomField] = useState(initialHeaderRow?.customField || '');
    const [refreshDateFormat, setRefreshDateFormat] = useState(initialHeaderRow?.refreshDateFormat || 'MM/DD/YYYY HH:mm:ss');

    useEffect(() => {
        if (isOpen && initialHeaderRow) {
            setType(initialHeaderRow.type);
            setTitleText(initialHeaderRow.titleText || '');
            setTitleField(initialHeaderRow.titleField || '');
            setUseTitleField(!!initialHeaderRow.titleField);
            setSelectedFilters(initialHeaderRow.selectedFilters || []);
            setCustomField(initialHeaderRow.customField || '');
            setRefreshDateFormat(initialHeaderRow.refreshDateFormat || 'MM/DD/YYYY HH:mm:ss');
        } else if (isOpen && !initialHeaderRow) {
            // Reset for new header row
            setType('title');
            setTitleText('');
            setTitleField('');
            setUseTitleField(false);
            setSelectedFilters([]);
            setCustomField(availableFields[0] || '');
            setRefreshDateFormat('MM/DD/YYYY HH:mm:ss');
        }
    }, [isOpen, initialHeaderRow, availableFields]);

    const handleSave = () => {
        const headerRow: HeaderRow = {
            id: initialHeaderRow?.id || `header-${Date.now()}`,
            type
        };

        if (type === 'title') {
            if (useTitleField) {
                headerRow.titleField = titleField;
            } else {
                headerRow.titleText = titleText;
            }
        } else if (type === 'filters') {
            headerRow.selectedFilters = selectedFilters;
        } else if (type === 'custom_field') {
            headerRow.customField = customField;
        } else if (type === 'refresh_date') {
            headerRow.refreshDateFormat = refreshDateFormat;
        }

        onSave(headerRow);
        onClose();
    };

    const toggleFilter = (filter: string) => {
        if (selectedFilters.includes(filter)) {
            setSelectedFilters(selectedFilters.filter(f => f !== filter));
        } else {
            setSelectedFilters([...selectedFilters, filter]);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[70] bg-black/50 flex items-center justify-center p-4">
            <div className="bg-white rounded-lg shadow-xl w-full max-w-lg">
                <div className="flex justify-between items-center p-4 border-b">
                    <h3 className="text-lg font-semibold">
                        {initialHeaderRow ? 'Edit Header Row' : 'Add Header Row'}
                    </h3>
                    <button
                        onClick={onClose}
                        className="text-gray-500 hover:text-gray-700"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>

                <div className="p-4 space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Row Type
                        </label>
                        <select
                            value={type}
                            onChange={(e) => setType(e.target.value as any)}
                            className="w-full border rounded p-2 text-sm"
                        >
                            <option value="title">Title</option>
                            <option value="filters">Filters</option>
                            <option value="custom_field">Custom Field Value</option>
                            <option value="refresh_date">Refresh Date</option>
                        </select>
                    </div>

                    {type === 'title' && (
                        <div className="space-y-3">
                            <div className="flex items-center gap-2">
                                <input
                                    type="checkbox"
                                    id="useTitleField"
                                    checked={useTitleField}
                                    onChange={(e) => setUseTitleField(e.target.checked)}
                                    className="rounded"
                                />
                                <label htmlFor="useTitleField" className="text-sm">
                                    Use Field Value
                                </label>
                            </div>

                            {!useTitleField ? (
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Title Text
                                    </label>
                                    <input
                                        type="text"
                                        value={titleText}
                                        onChange={(e) => setTitleText(e.target.value)}
                                        className="w-full border rounded p-2 text-sm"
                                        placeholder="Enter custom title..."
                                    />
                                </div>
                            ) : (
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Select Field
                                    </label>
                                    <select
                                        value={titleField}
                                        onChange={(e) => setTitleField(e.target.value)}
                                        className="w-full border rounded p-2 text-sm"
                                    >
                                        <option value="">-- Select Field --</option>
                                        {availableFields.map(field => (
                                            <option key={field} value={field}>{field}</option>
                                        ))}
                                    </select>
                                    <p className="text-xs text-gray-500 mt-1">
                                        The field value will be displayed as the title
                                    </p>
                                </div>
                            )}
                        </div>
                    )}

                    {type === 'filters' && (
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Select Filters to Display
                            </label>
                            {availableFilters.length === 0 ? (
                                <p className="text-sm text-gray-500 italic">
                                    No filters available on the worksheet
                                </p>
                            ) : (
                                <div className="border rounded p-3 max-h-60 overflow-y-auto space-y-2">
                                    {availableFilters.map(filter => (
                                        <div key={filter} className="flex items-center gap-2">
                                            <input
                                                type="checkbox"
                                                id={`filter-${filter}`}
                                                checked={selectedFilters.includes(filter)}
                                                onChange={() => toggleFilter(filter)}
                                                className="rounded"
                                            />
                                            <label htmlFor={`filter-${filter}`} className="text-sm">
                                                {filter}
                                            </label>
                                        </div>
                                    ))}
                                </div>
                            )}
                            <p className="text-xs text-gray-500 mt-2">
                                Format: "Field Name: value1, value2" or "Field Name: All"
                            </p>
                        </div>
                    )}

                    {type === 'custom_field' && (
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Select Field
                            </label>
                            <select
                                value={customField}
                                onChange={(e) => setCustomField(e.target.value)}
                                className="w-full border rounded p-2 text-sm"
                            >
                                {availableFields.map(field => (
                                    <option key={field} value={field}>{field}</option>
                                ))}
                            </select>
                            <p className="text-xs text-gray-500 mt-1">
                                Displays the first unique value of this field (assumes single value)
                            </p>
                        </div>
                    )}

                    {type === 'refresh_date' && (
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Date Format
                            </label>
                            <input
                                type="text"
                                value={refreshDateFormat}
                                onChange={(e) => setRefreshDateFormat(e.target.value)}
                                className="w-full border rounded p-2 text-sm font-mono"
                                placeholder="MM/DD/YYYY HH:mm:ss"
                            />
                            <p className="text-xs text-gray-500 mt-1">
                                <strong>Tokens:</strong> YYYY, MM, DD, HH, mm, ss, A (AM/PM)
                            </p>
                            <p className="text-xs text-gray-400 mt-1 italic">
                                Shows current date/time when data was last refreshed
                            </p>
                        </div>
                    )}
                </div>

                <div className="flex justify-end gap-2 p-4 border-t bg-gray-50">
                    <button
                        onClick={onClose}
                        className="px-4 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleSave}
                        className="px-4 py-2 text-sm bg-blue-600 text-white rounded hover:bg-blue-700"
                    >
                        {initialHeaderRow ? 'Update' : 'Add'} Header Row
                    </button>
                </div>
            </div>
        </div>
    );
};
