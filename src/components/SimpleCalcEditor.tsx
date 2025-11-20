import { useState, useEffect } from 'react';

interface SimpleCalcEditorProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (name: string, formula: string) => void;
    initialName?: string;
    initialFormula?: string;
}

export const SimpleCalcEditor = ({ isOpen, onClose, onSave, initialName, initialFormula }: SimpleCalcEditorProps) => {
    const [name, setName] = useState('');
    const [formula, setFormula] = useState('');

    // Populate fields when editing an existing calculation
    useEffect(() => {
        if (isOpen) {
            setName(initialName || '');
            setFormula(initialFormula || '');
        }
    }, [isOpen, initialName, initialFormula]);

    const handleSave = () => {
        if (!name.trim()) {
            alert('Please enter a calculation name');
            return;
        }
        if (!formula.trim()) {
            alert('Please enter a formula');
            return;
        }

        onSave(name.trim(), formula.trim());
        setName('');
        setFormula('');
        onClose();
    };

    const handleClose = () => {
        setName('');
        setFormula('');
        onClose();
    };

    if (!isOpen) return null;

    return (
        <div className="absolute inset-0 z-50 bg-black/50 flex items-center justify-center p-8">
            <div className="bg-white rounded-lg shadow-xl w-[600px] flex flex-col overflow-hidden">
                <div className="flex justify-between items-center p-4 border-b">
                    <h3 className="text-lg font-semibold">Create Calculated Field</h3>
                    <button onClick={handleClose} className="text-gray-500 hover:text-gray-700">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>

                <div className="p-6 space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Calculation Name
                        </label>
                        <input
                            type="text"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            className="w-full p-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            placeholder="e.g., Sales Tax"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Formula
                        </label>
                        <input
                            type="text"
                            value={formula}
                            onChange={(e) => setFormula(e.target.value)}
                            className="w-full p-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 font-mono"
                            placeholder="e.g., [Sales] * 0.08"
                        />
                        <p className="mt-2 text-xs text-gray-500">
                            Use [Field Name] to reference fields. Supports +, -, *, /
                        </p>
                        <div className="mt-2 p-2 bg-blue-50 rounded text-xs text-blue-800">
                            <div className="font-semibold mb-1">Examples:</div>
                            <div className="font-mono space-y-1">
                                <div className="font-semibold text-purple-700">Aggregations:</div>
                                <div>SUM([Sales]) <span className="text-gray-600">// Total sales</span></div>
                                <div>AVG([Profit]) <span className="text-gray-600">// Average profit</span></div>
                                <div>SUM([Sales]) * 1.08 <span className="text-gray-600">// Sales + 8% tax</span></div>
                                <div>SUM([Sales]) - SUM([Cost]) <span className="text-gray-600">// Total profit</span></div>

                                <div className="font-semibold text-purple-700 mt-2">Row-level:</div>
                                <div>[Sales] * 1.1 <span className="text-gray-600">// 10% markup per row</span></div>
                                <div>[Profit] / [Sales] <span className="text-gray-600">// Margin per row</span></div>
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
                        Create Field
                    </button>
                </div>
            </div>
        </div>
    );
};
