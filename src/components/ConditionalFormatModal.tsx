import { useState, useEffect } from 'react';
import type { ConditionalFormatRule, ValueField } from '../types';

interface ConditionalFormatModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (rules: ConditionalFormatRule[]) => void;
    fieldName: string;
    fieldType: 'row' | 'column' | 'value';
    initialRules?: ConditionalFormatRule[];
    availableFields?: string[];  // For field comparison in values
    valueFields?: ValueField[];  // For value field comparisons
}

export const ConditionalFormatModal = ({
    isOpen,
    onClose,
    onSave,
    fieldName,
    fieldType,
    initialRules = [],
    valueFields = []
}: ConditionalFormatModalProps) => {
    const [rules, setRules] = useState<ConditionalFormatRule[]>(initialRules);

    useEffect(() => {
        if (isOpen) {
            setRules(initialRules.length > 0 ? initialRules : []);
        }
    }, [isOpen, initialRules]);

    const addRule = () => {
        const newRule: ConditionalFormatRule = {
            id: `rule-${Date.now()}`,
            condition: fieldType === 'value' ? 'gt' : 'eq',
            value: '',
            fontColor: '#000000',
            backgroundColor: ''
        };
        setRules([...rules, newRule]);
    };

    const updateRule = (id: string, updates: Partial<ConditionalFormatRule>) => {
        setRules(rules.map(rule => rule.id === id ? { ...rule, ...updates } : rule));
    };

    const removeRule = (id: string) => {
        setRules(rules.filter(rule => rule.id !== id));
    };

    const handleSave = () => {
        onSave(rules);
        onClose();
    };

    if (!isOpen) return null;

    const getConditionOptions = () => {
        if (fieldType === 'value') {
            return [
                { value: 'gt', label: 'Greater than (>)' },
                { value: 'gte', label: 'Greater than or equal (>=)' },
                { value: 'lt', label: 'Less than (<)' },
                { value: 'lte', label: 'Less than or equal (<=)' },
                { value: 'eq', label: 'Equal to (=)' },
                { value: 'neq', label: 'Not equal to (!=)' },
                { value: 'compare_field', label: 'Compare with field' }
            ];
        } else {
            return [
                { value: 'eq', label: 'Equal to (=)' },
                { value: 'neq', label: 'Not equal to (!=)' },
                { value: 'contains', label: 'Contains' },
                { value: 'not_contains', label: 'Does not contain' }
            ];
        }
    };

    return (
        <div className="fixed inset-0 z-[70] bg-black/50 flex items-center justify-center p-4">
            <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[80vh] overflow-hidden flex flex-col">
                <div className="flex justify-between items-center p-4 border-b">
                    <h3 className="text-lg font-semibold">Conditional Formatting - {fieldName}</h3>
                    <button
                        onClick={onClose}
                        className="text-gray-500 hover:text-gray-700"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>

                <div className="flex-1 overflow-auto p-4">
                    {rules.length === 0 ? (
                        <div className="text-center text-gray-500 py-8">
                            <p>No rules defined yet. Click "Add Rule" to create one.</p>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {rules.map((rule, index) => (
                                <div key={rule.id} className="border rounded-lg p-4 bg-gray-50">
                                    <div className="flex justify-between items-start mb-3">
                                        <h4 className="font-medium text-sm">Rule {index + 1}</h4>
                                        <button
                                            onClick={() => removeRule(rule.id)}
                                            className="text-red-500 hover:text-red-700 text-sm"
                                        >
                                            Remove
                                        </button>
                                    </div>

                                    <div className="grid grid-cols-2 gap-3">
                                        <div className="col-span-2">
                                            <label className="block text-xs font-medium text-gray-700 mb-1">
                                                Condition
                                            </label>
                                            <select
                                                value={rule.condition}
                                                onChange={(e) => updateRule(rule.id, {
                                                    condition: e.target.value as any,
                                                    compareField: e.target.value === 'compare_field' ? valueFields[0]?.field : undefined
                                                })}
                                                className="w-full border rounded p-2 text-sm"
                                            >
                                                {getConditionOptions().map(opt => (
                                                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                                                ))}
                                            </select>
                                        </div>

                                        {rule.condition === 'compare_field' && fieldType === 'value' ? (
                                            <div className="col-span-2">
                                                <label className="block text-xs font-medium text-gray-700 mb-1">
                                                    Compare with Field
                                                </label>
                                                <select
                                                    value={rule.compareField || ''}
                                                    onChange={(e) => updateRule(rule.id, { compareField: e.target.value })}
                                                    className="w-full border rounded p-2 text-sm"
                                                >
                                                    {valueFields.map(vf => (
                                                        <option key={vf.id} value={vf.field}>{vf.field}</option>
                                                    ))}
                                                </select>
                                            </div>
                                        ) : (
                                            <div className="col-span-2">
                                                <label className="block text-xs font-medium text-gray-700 mb-1">
                                                    Value
                                                </label>
                                                <input
                                                    type="text"
                                                    value={rule.value ?? ''}
                                                    onChange={(e) => updateRule(rule.id, {
                                                        value: fieldType === 'value' && !isNaN(Number(e.target.value))
                                                            ? Number(e.target.value)
                                                            : e.target.value
                                                    })}
                                                    className="w-full border rounded p-2 text-sm"
                                                    placeholder={fieldType === 'value' ? 'Enter number' : 'Enter text'}
                                                />
                                            </div>
                                        )}

                                        <div>
                                            <label className="block text-xs font-medium text-gray-700 mb-1">
                                                Font Color
                                            </label>
                                            <div className="flex gap-2">
                                                <input
                                                    type="color"
                                                    value={rule.fontColor || '#000000'}
                                                    onChange={(e) => updateRule(rule.id, { fontColor: e.target.value })}
                                                    className="w-12 h-9 border rounded cursor-pointer"
                                                />
                                                <input
                                                    type="text"
                                                    value={rule.fontColor || '#000000'}
                                                    onChange={(e) => updateRule(rule.id, { fontColor: e.target.value })}
                                                    className="flex-1 border rounded p-2 text-sm font-mono"
                                                    placeholder="#000000"
                                                />
                                            </div>
                                        </div>

                                        <div>
                                            <label className="block text-xs font-medium text-gray-700 mb-1">
                                                Background Color
                                            </label>
                                            <div className="flex gap-2">
                                                <input
                                                    type="color"
                                                    value={rule.backgroundColor || '#ffffff'}
                                                    onChange={(e) => updateRule(rule.id, { backgroundColor: e.target.value })}
                                                    className="w-12 h-9 border rounded cursor-pointer"
                                                />
                                                <input
                                                    type="text"
                                                    value={rule.backgroundColor || ''}
                                                    onChange={(e) => updateRule(rule.id, { backgroundColor: e.target.value })}
                                                    className="flex-1 border rounded p-2 text-sm font-mono"
                                                    placeholder="(none)"
                                                />
                                            </div>
                                        </div>
                                    </div>

                                    {/* Preview */}
                                    <div className="mt-3 pt-3 border-t">
                                        <p className="text-xs text-gray-600 mb-1">Preview:</p>
                                        <div
                                            className="inline-block px-3 py-1 rounded text-sm"
                                            style={{
                                                color: rule.fontColor || '#000000',
                                                backgroundColor: rule.backgroundColor || 'transparent'
                                            }}
                                        >
                                            Sample Text
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                <div className="flex justify-between items-center p-4 border-t bg-gray-50">
                    <button
                        onClick={addRule}
                        className="px-4 py-2 text-sm bg-blue-600 text-white rounded hover:bg-blue-700"
                    >
                        + Add Rule
                    </button>
                    <div className="flex gap-2">
                        <button
                            onClick={onClose}
                            className="px-4 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded"
                        >
                            Cancel
                        </button>
                        <button
                            onClick={handleSave}
                            className="px-4 py-2 text-sm bg-green-600 text-white rounded hover:bg-green-700"
                        >
                            Save Rules
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};
