import { useState, useEffect } from 'react';
import type { LODCalculation } from '../types';

interface LODCalcEditorProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (lodCalc: Omit<LODCalculation, 'id'>) => void;
    availableFields: string[];
    initialLOD?: LODCalculation;
}

export const LODCalcEditor = ({
    isOpen,
    onClose,
    onSave,
    availableFields,
    initialLOD
}: LODCalcEditorProps) => {
    const [name, setName] = useState('');
    const [lodType, setLodType] = useState<'FIXED' | 'INCLUDE' | 'EXCLUDE'>('FIXED');
    const [selectedDimensions, setSelectedDimensions] = useState<string[]>([]);
    const [aggregation, setAggregation] = useState('');

    // Populate fields when editing an existing LOD calculation
    useEffect(() => {
        if (isOpen) {
            if (initialLOD) {
                setName(initialLOD.name);
                setLodType(initialLOD.type);
                setSelectedDimensions(initialLOD.dimensions);
                setAggregation(initialLOD.aggregation);
            } else {
                setName('');
                setLodType('FIXED');
                setSelectedDimensions([]);
                setAggregation('');
            }
        }
    }, [isOpen, initialLOD]);

    const handleDimensionToggle = (dimension: string) => {
        setSelectedDimensions(prev => {
            if (prev.includes(dimension)) {
                return prev.filter(d => d !== dimension);
            } else {
                return [...prev, dimension];
            }
        });
    };

    const handleSave = () => {
        if (!name.trim()) {
            alert('Please enter a calculation name');
            return;
        }
        if (selectedDimensions.length === 0) {
            alert('Please select at least one dimension');
            return;
        }
        if (!aggregation.trim()) {
            alert('Please enter an aggregation formula');
            return;
        }

        onSave({
            name: name.trim(),
            type: lodType,
            dimensions: selectedDimensions,
            aggregation: aggregation.trim()
        });

        // Reset form
        setName('');
        setLodType('FIXED');
        setSelectedDimensions([]);
        setAggregation('');
        onClose();
    };

    const handleClose = () => {
        setName('');
        setLodType('FIXED');
        setSelectedDimensions([]);
        setAggregation('');
        onClose();
    };

    if (!isOpen) return null;

    return (
        <div className="absolute inset-0 z-50 bg-black/50 flex items-center justify-center p-8">
            <div className="bg-white rounded-lg shadow-xl w-[700px] flex flex-col overflow-hidden max-h-[90vh]">
                <div className="flex justify-between items-center p-4 border-b">
                    <h3 className="text-lg font-semibold">Create LOD Calculation</h3>
                    <button onClick={handleClose} className="text-gray-500 hover:text-gray-700">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>

                <div className="p-6 space-y-4 overflow-y-auto">
                    {/* Calculation Name */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Calculation Name
                        </label>
                        <input
                            type="text"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            className="w-full p-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            placeholder="e.g., Regional Sales"
                        />
                    </div>

                    {/* LOD Type Selector */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            LOD Type
                        </label>
                        <div className="flex gap-4">
                            <label className="flex items-center gap-2">
                                <input
                                    type="radio"
                                    value="FIXED"
                                    checked={lodType === 'FIXED'}
                                    onChange={(e) => setLodType(e.target.value as 'FIXED')}
                                    className="w-4 h-4 text-blue-600"
                                />
                                <span className="text-sm">FIXED</span>
                            </label>
                            <label className="flex items-center gap-2">
                                <input
                                    type="radio"
                                    value="INCLUDE"
                                    checked={lodType === 'INCLUDE'}
                                    onChange={(e) => setLodType(e.target.value as 'INCLUDE')}
                                    className="w-4 h-4 text-blue-600"
                                />
                                <span className="text-sm">INCLUDE</span>
                            </label>
                            <label className="flex items-center gap-2">
                                <input
                                    type="radio"
                                    value="EXCLUDE"
                                    checked={lodType === 'EXCLUDE'}
                                    onChange={(e) => setLodType(e.target.value as 'EXCLUDE')}
                                    className="w-4 h-4 text-blue-600"
                                />
                                <span className="text-sm">EXCLUDE</span>
                            </label>
                        </div>
                        <p className="mt-2 text-xs text-gray-500">
                            {lodType === 'FIXED' && 'Calculate at exactly these dimensions, ignoring all view dimensions'}
                            {lodType === 'INCLUDE' && 'Calculate at view dimensions PLUS these additional dimensions'}
                            {lodType === 'EXCLUDE' && 'Calculate at view dimensions MINUS these dimensions'}
                        </p>
                    </div>

                    {/* Dimension Selector */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Select Dimensions
                        </label>
                        <div className="border rounded-md p-3 max-h-[200px] overflow-y-auto bg-gray-50">
                            {availableFields.length === 0 ? (
                                <p className="text-sm text-gray-500">No dimensions available</p>
                            ) : (
                                <div className="grid grid-cols-2 gap-2">
                                    {availableFields.map(field => (
                                        <label key={field} className="flex items-center gap-2 cursor-pointer hover:bg-gray-100 p-1 rounded">
                                            <input
                                                type="checkbox"
                                                checked={selectedDimensions.includes(field)}
                                                onChange={() => handleDimensionToggle(field)}
                                                className="w-4 h-4 text-blue-600 rounded"
                                            />
                                            <span className="text-sm">{field}</span>
                                        </label>
                                    ))}
                                </div>
                            )}
                        </div>
                        <p className="mt-2 text-xs text-gray-500">
                            Selected: {selectedDimensions.length > 0 ? selectedDimensions.join(', ') : 'None'}
                        </p>
                    </div>

                    {/* Aggregation Formula */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Aggregation Formula
                        </label>
                        <input
                            type="text"
                            value={aggregation}
                            onChange={(e) => setAggregation(e.target.value)}
                            className="w-full p-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 font-mono"
                            placeholder="e.g., SUM([Sales])"
                        />
                        <p className="mt-2 text-xs text-gray-500">
                            Use aggregation functions: SUM, AVG, MIN, MAX, COUNT, COUNTD. Supports conditional logic!
                        </p>

                        {/* Examples */}
                        <div className="mt-2 p-3 bg-blue-50 rounded text-xs text-blue-800 max-h-64 overflow-y-auto">
                            <div className="font-semibold mb-2">LOD Calculation Examples:</div>
                            <div className="space-y-2 text-gray-700">
                                <div>
                                    <div className="font-semibold text-purple-700">FIXED [Region]: SUM([Sales])</div>
                                    <div className="ml-4 text-[11px]">Total sales per region, regardless of other dimensions in view</div>
                                </div>
                                <div>
                                    <div className="font-semibold text-green-700">INCLUDE [Product]: AVG([Sales])</div>
                                    <div className="ml-4 text-[11px]">If view shows [Region], this calculates avg at Region+Product level</div>
                                </div>
                                <div>
                                    <div className="font-semibold text-orange-700">EXCLUDE [Quarter]: SUM([Sales])</div>
                                    <div className="ml-4 text-[11px]">If view shows [Region, Quarter], this calculates just at Region level</div>
                                </div>
                                <div className="mt-3 pt-2 border-t border-blue-200">
                                    <div className="font-semibold mb-1 text-purple-700">With Conditional Logic:</div>
                                    <div className="break-all font-mono text-[10px]">FIXED [Region]: SUM(IF [Sales] &gt; 1000 THEN [Sales] ELSE 0 END)</div>
                                    <div className="ml-4 text-[11px] mb-2">Sum only sales over 1000 per region</div>

                                    <div className="break-all font-mono text-[10px]">FIXED [Category]: COUNT(IF [Profit] &gt; 0 THEN [OrderID] ELSE 0 END)</div>
                                    <div className="ml-4 text-[11px] mb-2">Count profitable orders per category</div>

                                    <div className="break-all font-mono text-[10px]">INCLUDE [Product]: AVG(CASE WHEN [Discount] &gt; 0 THEN [Sales] * (1 - [Discount]) ELSE [Sales] END)</div>
                                    <div className="ml-4 text-[11px]">Average sales with discounts applied</div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="p-4 border-t flex justify-end gap-2 bg-gray-50">
                    <button
                        onClick={handleClose}
                        className="px-4 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleSave}
                        className="px-4 py-2 text-sm bg-blue-600 text-white rounded hover:bg-blue-700"
                    >
                        Create LOD Calculation
                    </button>
                </div>
            </div>
        </div>
    );
};
