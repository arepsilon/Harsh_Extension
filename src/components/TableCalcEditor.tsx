import { useState, useEffect } from 'react';

interface TableCalcEditorProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (name: string, baseField: string, calculation: string, computeUsing: string, specificDimensions?: string[]) => void;
    valueFields: string[];
    rowDimensions: string[];
    initialName?: string;
    initialBaseField?: string;
    initialCalculation?: string;
    initialComputeUsing?: string;
    initialSpecificDimensions?: string[];
}

export const TableCalcEditor = ({
    isOpen,
    onClose,
    onSave,
    valueFields,
    rowDimensions,
    initialName,
    initialBaseField,
    initialCalculation,
    initialComputeUsing,
    initialSpecificDimensions
}: TableCalcEditorProps) => {
    const [name, setName] = useState('');
    const [baseField, setBaseField] = useState('');
    const [calculation, setCalculation] = useState('running_total');
    const [computeUsing, setComputeUsing] = useState('table_down');
    const [specificDimensions, setSpecificDimensions] = useState<string[]>([]);

    useEffect(() => {
        if (isOpen) {
            setName(initialName || '');
            setBaseField(initialBaseField || valueFields[0] || '');
            setCalculation(initialCalculation || 'running_total');
            setComputeUsing(initialComputeUsing || 'table_down');
            setSpecificDimensions(initialSpecificDimensions || []);
        }
    }, [isOpen, initialName, initialBaseField, initialCalculation, initialComputeUsing, initialSpecificDimensions, valueFields]);

    const handleSave = () => {
        if (!name.trim()) {
            alert('Please enter a table calculation name');
            return;
        }
        if (!baseField) {
            alert('Please select a field to calculate on');
            return;
        }
        if (computeUsing === 'specific' && specificDimensions.length === 0) {
            alert('Please select at least one dimension for specific compute direction');
            return;
        }

        onSave(name, baseField, calculation, computeUsing, computeUsing === 'specific' ? specificDimensions : undefined);
        onClose();
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg shadow-xl p-6 w-[500px] max-h-[90vh] overflow-y-auto">
                <h2 className="text-xl font-semibold mb-4">
                    {initialName ? 'Edit Table Calculation' : 'Create Table Calculation'}
                </h2>

                <div className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Calculation Name</label>
                        <input
                            type="text"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                            placeholder="e.g., Running Total of Sales"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Calculate On</label>
                        <select
                            value={baseField}
                            onChange={(e) => setBaseField(e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                            {valueFields.map(field => (
                                <option key={field} value={field}>{field}</option>
                            ))}
                        </select>
                        <p className="mt-1 text-xs text-gray-500">Select the aggregated field to perform the calculation on</p>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Calculation Type</label>
                        <select
                            value={calculation}
                            onChange={(e) => setCalculation(e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                            <option value="running_total">Running Total</option>
                            <option value="percent_of_total">Percent of Total</option>
                            <option value="rank">Rank (Standard)</option>
                            <option value="rank_dense">Rank (Dense)</option>
                            <option value="rank_unique">Rank (Unique)</option>
                            <option value="rank_modified">Rank (Modified)</option>
                        </select>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Compute Using</label>
                        <select
                            value={computeUsing}
                            onChange={(e) => setComputeUsing(e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                            <option value="table_down">Table (Down)</option>
                            <option value="table_across">Table (Across)</option>
                            {rowDimensions.length > 0 && <option value="specific">Specific Dimension</option>}
                        </select>
                        <p className="mt-1 text-xs text-gray-500">
                            {computeUsing === 'table_down' && 'Calculate down rows within each column'}
                            {computeUsing === 'table_across' && 'Calculate across columns within each row'}
                            {computeUsing === 'specific' && 'Calculate along a specific dimension'}
                        </p>
                    </div>

                    {computeUsing === 'specific' && rowDimensions.length > 0 && (
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Specific Dimensions</label>
                            <div className="border border-gray-300 rounded-md p-2 max-h-32 overflow-y-auto">
                                {rowDimensions.map(dim => (
                                    <div key={dim} className="flex items-center mb-1">
                                        <input
                                            type="checkbox"
                                            id={`dim-${dim}`}
                                            checked={specificDimensions.includes(dim)}
                                            onChange={(e) => {
                                                if (e.target.checked) {
                                                    setSpecificDimensions([...specificDimensions, dim]);
                                                } else {
                                                    setSpecificDimensions(specificDimensions.filter(d => d !== dim));
                                                }
                                            }}
                                            className="mr-2 rounded text-blue-600 focus:ring-blue-500"
                                        />
                                        <label htmlFor={`dim-${dim}`} className="text-sm text-gray-700">{dim}</label>
                                    </div>
                                ))}
                            </div>
                            <p className="mt-1 text-xs text-gray-500">Checked dimensions are addressed (calculation runs along them). Unchecked are partitioned.</p>
                        </div>
                    )}

                    <div className="mt-4 p-3 bg-blue-50 rounded text-xs text-blue-800">
                        <div className="font-semibold mb-2">Examples:</div>
                        <div className="space-y-2">
                            <div><span className="font-semibold">Running Total:</span> Cumulative sum across the table</div>
                            <div><span className="font-semibold">Percent of Total:</span> Each value as % of total</div>
                            <div><span className="font-semibold">Rank:</span> Ranking (1 = highest value)</div>
                        </div>
                    </div>
                </div>

                <div className="flex justify-end gap-2 mt-6">
                    <button
                        onClick={onClose}
                        className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleSave}
                        className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700"
                    >
                        {initialName ? 'Update' : 'Create'}
                    </button>
                </div>
            </div>
        </div>
    );
};
