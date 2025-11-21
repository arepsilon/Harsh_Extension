import { useState, useMemo, useEffect } from 'react';
import type { ReactNode } from 'react';
import type { TableauWorksheet, TableauDataTable, ValueField, CalculatedField, TableCalculation, LODCalculation, FormatConfig, ConditionalFormat, HeaderRow } from '../types';
import { PivotEngine } from '../engine/PivotEngine';
import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors } from '@dnd-kit/core';
import type { DragEndEvent } from '@dnd-kit/core';
import { SortableContext, sortableKeyboardCoordinates, verticalListSortingStrategy, arrayMove } from '@dnd-kit/sortable';
import { SortableItem } from './SortableItem';
import { ManualSortModal } from './ManualSortModal';
import { SimpleCalcEditor } from './SimpleCalcEditor';
import { TableCalcEditor } from './TableCalcEditor';
import { LODCalcEditor } from './LODCalcEditor';
import { ConditionalFormatModal } from './ConditionalFormatModal';
import { HeaderRowEditor } from './HeaderRowEditor';
import { isAggregationFormula } from '../utils/simpleEvaluator';
import { exportToExcel } from '../utils/excelExporter';

interface ConfigPanelProps {
    onClose: () => void;
    worksheets: TableauWorksheet[];
    selectedWorksheet: TableauWorksheet | null;
    onSelectWorksheet: (worksheet: TableauWorksheet) => void;
    summaryData: TableauDataTable | null;
    isLoading: boolean;
}

interface SortConfig {
    direction: 'asc' | 'desc';
    type: 'alphabetic' | 'value' | 'manual';
    field?: string;
}

export const ConfigPanel = ({
    onClose,
    worksheets,
    selectedWorksheet,
    onSelectWorksheet,
    summaryData,
    isLoading
}: ConfigPanelProps) => {
    const [rows, setRows] = useState<string[]>([]);
    const [columns, setColumns] = useState<string[]>([]);
    const [values, setValues] = useState<ValueField[]>([]);

    const [showColumnGrandTotals, setShowColumnGrandTotals] = useState(true);
    const [columnGrandTotalsPosition, setColumnGrandTotalsPosition] = useState<'top' | 'bottom'>('top');

    const [showRowGrandTotals, setShowRowGrandTotals] = useState(false);
    const [rowGrandTotalsPosition, setRowGrandTotalsPosition] = useState<'left' | 'right'>('right');

    const [showSubtotals, setShowSubtotals] = useState(false);
    const [showPreviewModal, setShowPreviewModal] = useState(false);

    const [sortConfigs, setSortConfigs] = useState<Record<string, SortConfig>>({});
    const [manualSortOrders, setManualSortOrders] = useState<Record<string, string[]>>({});
    const [rowFormats, setRowFormats] = useState<Record<string, FormatConfig>>({});
    const [columnFormats, setColumnFormats] = useState<Record<string, FormatConfig>>({});
    const [conditionalFormats, setConditionalFormats] = useState<ConditionalFormat[]>([]);
    const [headerRows, setHeaderRows] = useState<HeaderRow[]>([]);

    const [manualSortModal, setManualSortModal] = useState<{ isOpen: boolean, field: string | null }>({
        isOpen: false,
        field: null
    });

    const [calculatedFields, setCalculatedFields] = useState<CalculatedField[]>([]);
    const [showCalcEditor, setShowCalcEditor] = useState(false);
    const [editingCalc, setEditingCalc] = useState<CalculatedField | null>(null);

    const [tableCalculations, setTableCalculations] = useState<TableCalculation[]>([]);
    const [showTableCalcEditor, setShowTableCalcEditor] = useState(false);
    const [editingTableCalc, setEditingTableCalc] = useState<TableCalculation | null>(null);

    const [lodCalculations, setLodCalculations] = useState<LODCalculation[]>([]);
    const [showLODEditor, setShowLODEditor] = useState(false);
    const [editingLOD, setEditingLOD] = useState<LODCalculation | null>(null);
    const [formatModal, setFormatModal] = useState<{
        isOpen: boolean;
        valueId: string | null;
        rowField: string | null;
        columnField: string | null;
        type: 'value' | 'row' | 'column';
    }>({ isOpen: false, valueId: null, rowField: null, columnField: null, type: 'value' });

    const [conditionalFormatModal, setConditionalFormatModal] = useState<{
        isOpen: boolean;
        fieldName: string | null;
        fieldType: 'row' | 'column' | 'value';
    }>({ isOpen: false, fieldName: null, fieldType: 'value' });

    const [headerRowModal, setHeaderRowModal] = useState<{
        isOpen: boolean;
        editingHeaderRow: HeaderRow | null;
    }>({ isOpen: false, editingHeaderRow: null });

    const [availableFilters, setAvailableFilters] = useState<string[]>([]);
    const [appliedFilters, setAppliedFilters] = useState<Record<string, { values: string[], isAll: boolean }>>({});

    const sensors = useSensors(
        useSensor(PointerSensor),
        useSensor(KeyboardSensor, {
            coordinateGetter: sortableKeyboardCoordinates,
        })
    );

    useEffect(() => {
        const loadSettings = async () => {
            try {
                // @ts-ignore
                if (window.tableau) {
                    // @ts-ignore
                    const savedConfigStr = window.tableau.extensions.settings.get('pivotConfig');
                    if (savedConfigStr) {
                        const savedConfig = JSON.parse(savedConfigStr);
                        if (savedConfig.rows) setRows(savedConfig.rows);
                        if (savedConfig.columns) setColumns(savedConfig.columns);
                        if (savedConfig.values) setValues(savedConfig.values);
                        if (savedConfig.showColumnGrandTotals !== undefined) setShowColumnGrandTotals(savedConfig.showColumnGrandTotals);
                        if (savedConfig.columnGrandTotalsPosition) setColumnGrandTotalsPosition(savedConfig.columnGrandTotalsPosition);
                        if (savedConfig.showRowGrandTotals !== undefined) setShowRowGrandTotals(savedConfig.showRowGrandTotals);
                        if (savedConfig.rowGrandTotalsPosition) setRowGrandTotalsPosition(savedConfig.rowGrandTotalsPosition);
                        if (savedConfig.showSubtotals !== undefined) setShowSubtotals(savedConfig.showSubtotals);
                        if (savedConfig.sortConfigs) setSortConfigs(savedConfig.sortConfigs);
                        if (savedConfig.manualSortOrders) setManualSortOrders(savedConfig.manualSortOrders);
                        if (savedConfig.calculatedFields) setCalculatedFields(savedConfig.calculatedFields);

                        if (savedConfig.manualSortOrders) setManualSortOrders(savedConfig.manualSortOrders);
                        if (savedConfig.calculatedFields) setCalculatedFields(savedConfig.calculatedFields);
                        if (savedConfig.tableCalculations) setTableCalculations(savedConfig.tableCalculations);
                        if (savedConfig.lodCalculations) setLodCalculations(savedConfig.lodCalculations);
                        if (savedConfig.rowFormats) setRowFormats(savedConfig.rowFormats);
                        if (savedConfig.columnFormats) setColumnFormats(savedConfig.columnFormats);
                        if (savedConfig.conditionalFormats) setConditionalFormats(savedConfig.conditionalFormats);
                        if (savedConfig.headerRows) setHeaderRows(savedConfig.headerRows);

                        if (savedConfig.showGrandTotals !== undefined) setShowColumnGrandTotals(savedConfig.showGrandTotals);
                    }
                }
            } catch (e) {
                console.error("Failed to load settings", e);
            }
        };
        loadSettings();
    }, []);

    useEffect(() => {
        const fetchFilters = async () => {
            if (!selectedWorksheet) {
                setAvailableFilters([]);
                setAppliedFilters({});
                return;
            }

            try {
                const filters = await selectedWorksheet.getFiltersAsync();
                const filterNames = filters.map(f => f.fieldName);
                setAvailableFilters(filterNames);

                const filtersMap: Record<string, { values: string[], isAll: boolean }> = {};
                filters.forEach(filter => {
                    filtersMap[filter.fieldName] = {
                        values: filter.appliedValues.map(v => String(v.value || v)),
                        isAll: filter.isAllSelected
                    };
                });
                setAppliedFilters(filtersMap);
            } catch (e) {
                console.error("Failed to fetch filters", e);
                setAvailableFilters([]);
                setAppliedFilters({});
            }
        };

        fetchFilters();
    }, [selectedWorksheet]);

    const availableColumns = useMemo(() => {
        const baseCols = summaryData?.columns.map(col => ({
            fieldName: col.fieldName,
            dataType: col.dataType,
            isCalculated: false
        })) || [];
        const calcCols = calculatedFields.map(f => ({
            fieldName: f.name,
            dataType: 'calculated',
            isCalculated: true
        }));
        const lodCols = lodCalculations.map(f => ({
            fieldName: f.name,
            dataType: 'lod',
            isCalculated: true
        }));
        return [...baseCols, ...calcCols, ...lodCols];
    }, [summaryData, calculatedFields, lodCalculations]);

    const pivotTree = useMemo(() => {
        if (!summaryData || (rows.length === 0 && columns.length === 0)) return null;

        return PivotEngine.pivot(summaryData, {
            rows,
            columns,
            values,
            calculatedFields,
            tableCalculations,
            lodCalculations
        });
    }, [summaryData, rows, columns, values, calculatedFields, tableCalculations, lodCalculations]);

    const getUniqueValuesForField = (field: string): string[] => {
        if (!summaryData) return [];
        const colIndex = summaryData.columns.findIndex(c => c.fieldName === field);
        if (colIndex === -1) return [];

        const unique = new Set<string>();
        summaryData.data.forEach(row => {
            const val = row[colIndex];
            unique.add(val?.formattedValue || String(val?.value || ''));
        });
        return Array.from(unique).sort();
    };

    const handleSave = async () => {
        try {
            const config = {
                rows,
                columns,
                values,
                showColumnGrandTotals,
                columnGrandTotalsPosition,
                showRowGrandTotals,
                rowGrandTotalsPosition,
                showSubtotals,
                sortConfigs,
                manualSortOrders,
                calculatedFields,
                tableCalculations,
                lodCalculations,
                rowFormats,
                columnFormats,
                conditionalFormats,
                headerRows
            };
            // @ts-ignore
            if (window.tableau) {
                // @ts-ignore
                window.tableau.extensions.settings.set('pivotConfig', JSON.stringify(config));
                // @ts-ignore
                await window.tableau.extensions.settings.saveAsync();
            } else {
                console.log("Saved config (local):", config);
            }
            onClose();
        } catch (e) {
            console.error("Failed to save settings", e);
            alert("Failed to save settings");
        }
    };

    const toggleField = (field: string, type: 'row' | 'col' | 'val') => {
        if (type === 'row') {
            if (rows.includes(field)) {
                setRows(rows.filter(r => r !== field));
            } else {
                setRows([...rows, field]);
                setColumns(columns.filter(c => c !== field));
                setValues(values.filter(v => v.field !== field));
            }
        } else if (type === 'col') {
            if (columns.includes(field)) {
                setColumns(columns.filter(c => c !== field));
            } else {
                setColumns([...columns, field]);
                setRows(rows.filter(r => r !== field));
                setValues(values.filter(v => v.field !== field));
            }
        } else if (type === 'val') {
            const isTableCalc = tableCalculations.find(tc => tc.name === field);
            const isCalc = calculatedFields.find(c => c.name === field) || lodCalculations.find(l => l.name === field);

            if (values.find(v => v.field === field)) {
                setValues(values.filter(v => v.field !== field));
            } else {
                const newVal: ValueField = {
                    id: `${field}-${Date.now()}`,
                    field,
                    agg: 'SUM',
                    type: isTableCalc ? 'table_calc' : (isCalc ? 'calc' : 'field')
                };
                setValues([...values, newVal]);
                if (!isTableCalc) {
                    setRows(rows.filter(r => r !== field));
                    setColumns(columns.filter(c => c !== field));
                }
            }
        }
    };

    const handleDragEnd = (event: DragEndEvent) => {
        const { active, over } = event;
        if (!over) return;

        if (active.id !== over.id) {
            if (rows.includes(active.id as string)) {
                setRows((items) => {
                    const oldIndex = items.indexOf(active.id as string);
                    const newIndex = items.indexOf(over.id as string);
                    return arrayMove(items, oldIndex, newIndex);
                });
            } else if (columns.includes(active.id as string)) {
                setColumns((items) => {
                    const oldIndex = items.indexOf(active.id as string);
                    const newIndex = items.indexOf(over.id as string);
                    return arrayMove(items, oldIndex, newIndex);
                });
            } else if (values.find(v => v.id === active.id)) {
                setValues((items) => {
                    const oldIndex = items.findIndex(v => v.id === active.id);
                    const newIndex = items.findIndex(v => v.id === over.id);
                    return arrayMove(items, oldIndex, newIndex);
                });
            }
        }
    };

    const updateSort = (field: string, type: 'alphabetic' | 'value' | 'manual', valueField?: string) => {
        if (type === 'manual') {
            setManualSortModal({ isOpen: true, field });
            return;
        }

        setSortConfigs(prev => {
            const current = prev[field] || { direction: 'asc', type: 'alphabetic' };
            let next: SortConfig;

            if (type === 'value' && valueField) {
                next = { direction: 'desc', type: 'value', field: valueField };
            } else {
                if (current.type === 'alphabetic') {
                    next = { ...current, direction: current.direction === 'asc' ? 'desc' : 'asc' };
                } else {
                    next = { direction: 'asc', type: 'alphabetic' };
                }
            }
            return { ...prev, [field]: next };
        });
    };

    const handleManualSortSave = (field: string, newOrder: string[]) => {
        setManualSortOrders(prev => ({
            ...prev,
            [field]: newOrder
        }));
        setSortConfigs(prev => ({
            ...prev,
            [field]: { direction: 'asc', type: 'manual' }
        }));
    };


    const handleSaveCalculation = (name: string, formula: string) => {
        const isAggregation = isAggregationFormula(formula);

        if (editingCalc) {
            setCalculatedFields(prev => prev.map(c => c.id === editingCalc.id ? { ...c, name, formula, isAggregation } : c));
        } else {
            setCalculatedFields(prev => [...prev, { id: `calc-${Date.now()}`, name, formula, isAggregation }]);
        }
        setEditingCalc(null);
    };

    const handleEditCalculation = (field: CalculatedField) => {
        setEditingCalc(field);
        setShowCalcEditor(true);
    };

    const handleSaveTableCalculation = (name: string, baseField: string, calculation: string, computeUsing: string, specificDimensions?: string[]) => {
        const calcType = calculation as 'running_total' | 'percent_of_total' | 'rank';
        const computeType = computeUsing as 'table_down' | 'table_across' | 'specific';

        if (editingTableCalc) {
            setTableCalculations(prev => prev.map(tc =>
                tc.id === editingTableCalc.id
                    ? { ...tc, name, baseField, calculation: calcType, computeUsing: computeType, specificDimensions }
                    : tc
            ));
        } else {
            setTableCalculations(prev => [...prev, {
                id: `tc-${Date.now()}`,
                name,
                baseField,
                calculation: calcType,
                computeUsing: computeType,
                specificDimensions
            }]);
        }
        setEditingTableCalc(null);
    };

    const handleEditTableCalculation = (tc: TableCalculation) => {
        setEditingTableCalc(tc);
        setShowTableCalcEditor(true);
    };

    const handleSaveLODCalculation = (lodCalc: Omit<LODCalculation, 'id'>) => {
        if (editingLOD) {
            setLodCalculations(prev => prev.map(lod =>
                lod.id === editingLOD.id
                    ? { ...lod, ...lodCalc }
                    : lod
            ));
        } else {
            setLodCalculations(prev => [...prev, {
                id: `lod-${Date.now()}`,
                ...lodCalc
            }]);
        }
        setEditingLOD(null);
    };
    const handleEditLODCalculation = (lod: LODCalculation) => {
        setEditingLOD(lod);
        setShowLODEditor(true);
    };

    const handleSaveHeaderRow = (headerRow: HeaderRow) => {
        if (headerRowModal.editingHeaderRow) {
            setHeaderRows(prev => prev.map(h => h.id === headerRow.id ? headerRow : h));
        } else {
            setHeaderRows(prev => [...prev, headerRow]);
        }
        setHeaderRowModal({ isOpen: false, editingHeaderRow: null });
    };

    const handleEditHeaderRow = (headerRow: HeaderRow) => {
        setHeaderRowModal({ isOpen: true, editingHeaderRow: headerRow });
    };

    const handleDeleteHeaderRow = (id: string) => {
        setHeaderRows(prev => prev.filter(h => h.id !== id));
    };

    const handleDragEndHeaderRows = (event: DragEndEvent) => {
        const { active, over } = event;
        if (!over || active.id === over.id) return;

        setHeaderRows((items) => {
            const oldIndex = items.findIndex(h => h.id === active.id);
            const newIndex = items.findIndex(h => h.id === over.id);
            return arrayMove(items, oldIndex, newIndex);
        });
    };

    const renderHeaderRows = () => {
        if (headerRows.length === 0) return null;

        return (
            <div className="mb-4 space-y-2">
                {headerRows.map(headerRow => {
                    let content: ReactNode = null;

                    if (headerRow.type === 'title') {
                        if (headerRow.titleField) {
                            // Get first unique value of the field
                            const colIndex = summaryData?.columns.findIndex(c => c.fieldName === headerRow.titleField);
                            if (colIndex !== undefined && colIndex !== -1 && summaryData) {
                                const firstValue = summaryData.data[0]?.[colIndex];
                                content = (
                                    <div className="text-2xl font-bold text-gray-800">
                                        {firstValue?.formattedValue || firstValue?.value || '(No Data)'}
                                    </div>
                                );
                            } else {
                                content = <div className="text-2xl font-bold text-gray-800">(Field Not Found)</div>;
                            }
                        } else {
                            content = <div className="text-2xl font-bold text-gray-800">{headerRow.titleText || ''}</div>;
                        }
                    } else if (headerRow.type === 'filters') {
                        const selectedFilters = headerRow.selectedFilters || [];
                        if (selectedFilters.length === 0) {
                            content = <div className="text-sm text-gray-500 italic">No filters selected</div>;
                        } else {
                            content = (
                                <div className="text-sm text-gray-700 space-y-1">
                                    {selectedFilters.map(filter => {
                                        const filterData = appliedFilters[filter];
                                        if (!filterData) {
                                            return (
                                                <div key={filter}>
                                                    <span className="font-semibold">{filter}:</span> (No filter applied)
                                                </div>
                                            );
                                        }
                                        const displayValue = filterData.isAll
                                            ? 'All'
                                            : filterData.values.join(', ');
                                        return (
                                            <div key={filter}>
                                                <span className="font-semibold">{filter}:</span> {displayValue}
                                            </div>
                                        );
                                    })}
                                </div>
                            );
                        }
                    } else if (headerRow.type === 'custom_field') {
                        // Get first unique value of the custom field
                        const colIndex = summaryData?.columns.findIndex(c => c.fieldName === headerRow.customField);
                        if (colIndex !== undefined && colIndex !== -1 && summaryData) {
                            const unique = new Set<string>();
                            summaryData.data.forEach(row => {
                                const val = row[colIndex];
                                unique.add(val?.formattedValue || String(val?.value || ''));
                            });
                            const firstValue = Array.from(unique)[0];
                            content = (
                                <div className="text-sm text-gray-700">
                                    <span className="font-semibold">{headerRow.customField}:</span> {firstValue || '(No Data)'}
                                </div>
                            );
                        } else {
                            content = <div className="text-sm text-gray-700">(Field Not Found)</div>;
                        }
                    } else if (headerRow.type === 'refresh_date') {
                        const now = new Date();
                        const formatted = formatDate(now, headerRow.refreshDateFormat || 'MM/DD/YYYY HH:mm:ss');
                        content = (
                            <div className="text-sm text-gray-600">
                                <span className="font-semibold">Data Refreshed:</span> {formatted}
                            </div>
                        );
                    }

                    return (
                        <div key={headerRow.id} className="p-3 bg-gray-50 border-b">
                            {content}
                        </div>
                    );
                })}
            </div>
        );
    };

    const renderPivotTable = () => {
        if (!pivotTree) return <p className="text-gray-500 text-sm italic">Configure rows/cols to see preview.</p>;

        // 1. Pre-calculate column totals for "Sort by Value"
        const columnTotals: Record<string, Record<string, Record<string, number>>> = {}; // level -> colValue -> valueField -> total

        const allKeys = Object.keys(pivotTree.values)
            .filter(k => !k.startsWith('__grand_total__'));

        if (columns.length > 0) {
            allKeys.forEach(key => {
                const [colPart, valPart] = key.split('::');
                const colValues = colPart ? colPart.split(' | ') : [];
                const val = pivotTree.values[key] || 0;

                colValues.forEach((colVal, level) => {
                    const levelKey = `${level}`;
                    if (!columnTotals[levelKey]) columnTotals[levelKey] = {};
                    if (!columnTotals[levelKey][colVal]) columnTotals[levelKey][colVal] = {};

                    if (!columnTotals[levelKey][colVal][valPart]) columnTotals[levelKey][colVal][valPart] = 0;
                    columnTotals[levelKey][colVal][valPart] += val;
                });
            });
        }

        // Helper function for data-type-aware comparison
        const compareByDataType = (valA: string, valB: string, fieldName: string): number => {
            const fieldInfo = availableColumns.find(col => col.fieldName === fieldName);
            const dataType = fieldInfo?.dataType;

            // Handle date/datetime types
            if (dataType === 'date' || dataType === 'date-time') {
                const dateA = new Date(valA);
                const dateB = new Date(valB);
                if (!isNaN(dateA.getTime()) && !isNaN(dateB.getTime())) {
                    return dateA.getTime() - dateB.getTime();
                }
            }

            // Handle numeric types
            if (dataType === 'int' || dataType === 'float') {
                const numA = parseFloat(valA);
                const numB = parseFloat(valB);
                if (!isNaN(numA) && !isNaN(numB)) {
                    return numA - numB;
                }
            }

            // Default to string comparison with numeric awareness
            return valA.localeCompare(valB, undefined, { numeric: true });
        };

        // 2. Sort Keys
        allKeys.sort((a, b) => {
            const [colPartA, valPartA] = a.split('::');
            const [colPartB, valPartB] = b.split('::');
            const colValuesA = colPartA ? colPartA.split(' | ') : [];
            const colValuesB = colPartB ? colPartB.split(' | ') : [];

            for (let i = 0; i < columns.length; i++) {
                const colField = columns[i];
                const valA = colValuesA[i] || '';
                const valB = colValuesB[i] || '';

                if (valA === valB) continue;

                const sortConfig = sortConfigs[colField];
                let comparison = 0;

                if (sortConfig?.type === 'manual') {
                    const manualOrder = manualSortOrders[colField] || [];
                    const indexA = manualOrder.indexOf(valA);
                    const indexB = manualOrder.indexOf(valB);

                    if (indexA !== -1 && indexB !== -1) comparison = indexA - indexB;
                    else if (indexA !== -1) comparison = -1;
                    else if (indexB !== -1) comparison = 1;
                    else comparison = compareByDataType(valA, valB, colField);
                } else if (sortConfig?.type === 'value' && sortConfig.field) {
                    const totalA = columnTotals[`${i}`]?.[valA]?.[sortConfig.field] || 0;
                    const totalB = columnTotals[`${i}`]?.[valB]?.[sortConfig.field] || 0;
                    comparison = totalA - totalB;
                } else {
                    comparison = compareByDataType(valA, valB, colField);
                }

                return sortConfig?.direction === 'desc' ? -comparison : comparison;
            }

            // If columns match (or no columns), sort by value field order
            const indexA = values.findIndex(v => v.field === valPartA);
            const indexB = values.findIndex(v => v.field === valPartB);
            return indexA - indexB;
        });

        const headerLevels: { label: string, span: number, formattedLabel?: string }[][] = [];
        const totalLevels = columns.length + 1;

        if (allKeys.length > 0) {
            for (let level = 0; level < totalLevels; level++) {
                const currentLevelHeaders: { label: string, span: number, formattedLabel?: string }[] = [];
                let lastLabel: string | null = null;
                let currentSpan = 0;

                allKeys.forEach((key, index) => {
                    const [colPart, valPart] = key.split('::');
                    const colValues = colPart ? colPart.split(' | ') : [];
                    const parts = [...colValues, valPart];

                    const label = parts[level] || '';

                    let sameAsPrevious = false;
                    if (lastLabel === label && index > 0) {
                        const prevKey = allKeys[index - 1];
                        const [prevColPart, prevValPart] = prevKey.split('::');
                        const prevColValues = prevColPart ? prevColPart.split(' | ') : [];
                        const prevParts = [...prevColValues, prevValPart];

                        let parentsMatch = true;
                        for (let p = 0; p < level; p++) {
                            if (parts[p] !== prevParts[p]) {
                                parentsMatch = false;
                                break;
                            }
                        }
                        if (parentsMatch) sameAsPrevious = true;
                    }

                    if (sameAsPrevious) {
                        currentSpan++;
                    } else {
                        if (lastLabel !== null) {
                            // Apply formatting if this is a column level (not the value level)
                            const columnField = level < columns.length ? columns[level] : null;
                            const formattedLabel = columnField && columnFormats[columnField]
                                ? formatValue(lastLabel, columnFormats[columnField])
                                : lastLabel;
                            currentLevelHeaders.push({ label: lastLabel, span: currentSpan, formattedLabel });
                        }
                        lastLabel = label;
                        currentSpan = 1;
                    }
                });
                if (lastLabel !== null) {
                    // Apply formatting if this is a column level (not the value level)
                    const columnField = level < columns.length ? columns[level] : null;
                    const formattedLabel = columnField && columnFormats[columnField]
                        ? formatValue(lastLabel, columnFormats[columnField])
                        : lastLabel;
                    currentLevelHeaders.push({ label: lastLabel, span: currentSpan, formattedLabel });
                }
                headerLevels.push(currentLevelHeaders);
            }
        }

        const renderRows = (node: any, depth = 0, path: string[] = []): ReactNode[] => {
            if (!node || !node.children) return [];
            const rowsNodes: ReactNode[] = [];

            const currentRowField = rows[depth];
            const sortConfig = sortConfigs[currentRowField];

            const sortedChildren = (Array.from(node.children.entries()) as any[]).sort((a: any, b: any) => {
                const keyA = a[0];
                const keyB = b[0];
                const nodeA = a[1];
                const nodeB = b[1];

                let comparison = 0;

                if (sortConfig?.type === 'manual') {
                    const manualOrder = manualSortOrders[currentRowField] || [];
                    const indexA = manualOrder.indexOf(keyA);
                    const indexB = manualOrder.indexOf(keyB);

                    if (indexA !== -1 && indexB !== -1) {
                        comparison = indexA - indexB;
                    }
                    else if (indexA !== -1) {
                        comparison = -1;
                    }
                    else if (indexB !== -1) {
                        comparison = 1;
                    }
                    else {
                        comparison = compareByDataType(keyA, keyB, currentRowField);
                    }
                } else if (sortConfig?.type === 'value' && sortConfig.field) {
                    const valKey = columns.length > 0 ? `__grand_total__::${sortConfig.field}` : sortConfig.field;
                    const valA = nodeA.values[valKey] || 0;
                    const valB = nodeB.values[valKey] || 0;
                    comparison = valA - valB;
                } else {
                    comparison = compareByDataType(keyA, keyB, currentRowField);
                }

                return sortConfig?.direction === 'desc' ? -comparison : comparison;
            });

            sortedChildren.forEach(([key, child]) => {
                const isLeaf = !child.children || child.children.size === 0;
                const showRow = isLeaf || showSubtotals;

                if (showRow) {
                    const rowCells = (
                        <>
                            {rows.map((rowField, index) => {
                                let content: string | number = '';
                                if (index < depth) content = path[index];
                                else if (index === depth) content = key;
                                else content = isLeaf ? '' : 'Total';

                                const formattedContent = content && rowFormats[rowField]
                                    ? formatValue(content, rowFormats[rowField])
                                    : content;

                                const conditionalStyle = evaluateConditionalFormat(content, rowField, conditionalFormats);

                                return (
                                    <td
                                        key={index}
                                        className="p-2 border-b border-r text-sm truncate"
                                        style={{
                                            color: conditionalStyle.fontColor,
                                            backgroundColor: conditionalStyle.backgroundColor
                                        }}
                                    >
                                        {formattedContent}
                                    </td>
                                );
                            })}

                            {showRowGrandTotals && rowGrandTotalsPosition === 'left' && (
                                values.map(v => {
                                    const gtKey = columns.length > 0 ? `__grand_total__::${v.field}` : v.field;
                                    return (
                                        <td key={`gt-left-${v.id}`} className="p-2 border-b border-r text-sm text-right font-bold bg-gray-50">
                                            {formatValue(child.values[gtKey], v.format)}
                                        </td>
                                    );
                                })
                            )}

                            {allKeys.map(colKey => {
                                const val = child.values[colKey];
                                const valPart = colKey.split('::').pop();
                                const valueField = values.find(v => v.field === valPart);

                                // Build compare values for field comparison
                                const compareValues: Record<string, number> = {};
                                values.forEach(v => {
                                    const vKey = colKey.split('::')[0] ? `${colKey.split('::')[0]}::${v.field}` : v.field;
                                    const vVal = child.values[vKey];
                                    if (vVal !== undefined) compareValues[v.field] = vVal;
                                });

                                const conditionalStyle = valueField
                                    ? evaluateConditionalFormat(val, valueField.field, conditionalFormats, compareValues)
                                    : {};

                                return (
                                    <td
                                        key={colKey}
                                        className="p-2 border-b text-sm text-right font-mono"
                                        style={{
                                            color: conditionalStyle.fontColor,
                                            backgroundColor: conditionalStyle.backgroundColor
                                        }}
                                    >
                                        {formatValue(val, valueField?.format)}
                                    </td>
                                );
                            })}

                            {showRowGrandTotals && rowGrandTotalsPosition === 'right' && (
                                values.map(v => {
                                    const gtKey = columns.length > 0 ? `__grand_total__::${v.field}` : v.field;
                                    return (
                                        <td key={`gt-right-${v.id}`} className="p-2 border-b border-l text-sm text-right font-bold bg-gray-50">
                                            {formatValue(child.values[gtKey], v.format)}
                                        </td>
                                    );
                                })
                            )}
                        </>
                    );

                    rowsNodes.push(
                        <tr key={[...path, key].join('::')} className={isLeaf ? "hover:bg-gray-50" : "bg-gray-50 font-semibold"}>
                            {rowCells}
                        </tr>
                    );
                }
                rowsNodes.push(...renderRows(child, depth + 1, [...path, key]));
            });
            return rowsNodes;
        };

        const renderColumnGrandTotals = () => (
            <tr className="bg-gray-50 font-bold border-b-2 border-t-2">
                <td
                    colSpan={Math.max(1, rows.length)}
                    className="p-2 border-r text-sm sticky left-0 bg-gray-50"
                >
                    Grand Total
                </td>
                {showRowGrandTotals && rowGrandTotalsPosition === 'left' && (
                    <td colSpan={values.length} className="p-2 border-r bg-gray-100"></td>
                )}

                {allKeys.map(colKey => (
                    <td key={colKey} className="p-2 border-r text-sm text-right">
                        {(() => {
                            const valPart = colKey.split('::').pop();
                            const valueField = values.find(v => v.field === valPart);
                            return formatValue(pivotTree.values[colKey], valueField?.format);
                        })()}
                    </td>
                ))}

                {showRowGrandTotals && rowGrandTotalsPosition === 'right' && (
                    values.map(v => {
                        const gtKey = columns.length > 0 ? `__grand_total__::${v.field}` : v.field;
                        return (
                            <td key={`gt-total-${v.id}`} className="p-2 border-l text-sm text-right bg-gray-100">
                                {formatValue(pivotTree.values[gtKey], v.format)}
                            </td>
                        );
                    })
                )}
            </tr>
        );

        return (
            <div className="min-w-full inline-block align-middle">
                <div className="border rounded-lg overflow-hidden">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                            {headerLevels.map((levelHeaders, levelIndex) => (
                                <tr key={levelIndex}>
                                    {levelIndex === 0 && (
                                        <th
                                            colSpan={Math.max(1, rows.length)}
                                            rowSpan={headerLevels.length}
                                            className="p-2 border-r text-left text-xs font-medium text-gray-500 uppercase tracking-wider sticky left-0 bg-gray-50 z-10"
                                        >
                                            {rows.join(' / ') || 'Rows'}
                                        </th>
                                    )}

                                    {levelIndex === 0 && showRowGrandTotals && rowGrandTotalsPosition === 'left' && (
                                        <th
                                            colSpan={values.length}
                                            rowSpan={headerLevels.length}
                                            className="p-2 border-r text-center text-xs font-bold text-gray-700 uppercase bg-gray-100"
                                        >
                                            Grand Total
                                        </th>
                                    )}

                                    {levelHeaders.map((header, hIndex) => {
                                        // Determine which column field this header belongs to
                                        const columnField = levelIndex < columns.length ? columns[levelIndex] : null;
                                        const conditionalStyle = columnField
                                            ? evaluateConditionalFormat(header.label, columnField, conditionalFormats)
                                            : {};

                                        return (
                                            <th
                                                key={hIndex}
                                                colSpan={header.span}
                                                className="p-2 border-r text-center text-xs font-medium text-gray-500 uppercase tracking-wider"
                                                style={{
                                                    color: conditionalStyle.fontColor,
                                                    backgroundColor: conditionalStyle.backgroundColor
                                                }}
                                            >
                                                {header.formattedLabel || header.label}
                                            </th>
                                        );
                                    })}

                                    {levelIndex === 0 && showRowGrandTotals && rowGrandTotalsPosition === 'right' && (
                                        <th
                                            colSpan={values.length}
                                            rowSpan={headerLevels.length}
                                            className="p-2 border-l text-center text-xs font-bold text-gray-700 uppercase bg-gray-100"
                                        >
                                            Grand Total
                                        </th>
                                    )}
                                </tr>
                            ))}
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {columnGrandTotalsPosition === 'top' && showColumnGrandTotals && renderColumnGrandTotals()}
                            {renderRows(pivotTree)}
                            {columnGrandTotalsPosition === 'bottom' && showColumnGrandTotals && renderColumnGrandTotals()}
                        </tbody>
                    </table>
                </div>
            </div>
        );
    };

    return (
        <div className="flex flex-col h-full bg-white relative" >
            <div className="flex items-center justify-between p-4 border-b">
                <h2 className="text-xl font-semibold">Configuration</h2>
                <div className="flex gap-2">
                    <button
                        onClick={() => setShowPreviewModal(true)}
                        className="px-4 py-2 bg-gray-100 text-gray-700 rounded hover:bg-gray-200 text-sm font-medium border"
                    >
                        Preview Table
                    </button>
                    <button
                        onClick={() => exportToExcel({
                            pivotTree,
                            config: { rows, columns, values, calculatedFields, tableCalculations, lodCalculations },
                            showColumnGrandTotals,
                            columnGrandTotalsPosition,
                            showRowGrandTotals,
                            rowGrandTotalsPosition,
                            worksheetName: selectedWorksheet?.name || 'Export',
                            headerRows,
                            conditionalFormats,
                            rowFormats,
                            columnFormats,
                            appliedFilters,
                            summaryData
                        })}
                        className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 text-sm font-medium"
                        disabled={!pivotTree}
                    >
                        Export to Excel
                    </button>
                    <button
                        onClick={handleSave}
                        className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 text-sm font-medium"
                    >
                        Save Configuration
                    </button>
                    <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
                        Close
                    </button>
                </div>
            </div>
            <div className="flex-1 p-4 flex flex-col overflow-hidden">
                <div className="mb-6 shrink-0">
                    <label className="block text-sm font-medium text-gray-700 mb-2">Select Worksheet</label>
                    <select
                        className="w-full p-2 border rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                        value={selectedWorksheet?.name || ''}
                        onChange={(e) => {
                            const ws = worksheets.find(w => w.name === e.target.value);
                            if (ws) onSelectWorksheet(ws);
                        }}
                    >
                        <option value="">-- Select a Worksheet --</option>
                        {worksheets.map(ws => (
                            <option key={ws.name} value={ws.name}>{ws.name}</option>
                        ))}
                    </select>
                </div>

                {isLoading && <div className="text-blue-600">Loading data...</div>}

                {summaryData && (
                    <div className="grid grid-cols-12 gap-4 flex-1 min-h-0">
                        <div className="col-span-4 border p-4 rounded-md overflow-auto bg-gray-50 flex flex-col">
                            <div className="flex justify-between items-center mb-2">
                                <h3 className="font-medium text-sm uppercase text-gray-500">Available Fields</h3>
                                <div className="flex gap-1">
                                    <button
                                        onClick={() => { setEditingCalc(null); setShowCalcEditor(true); }}
                                        className="text-xs bg-purple-100 text-purple-700 px-2 py-1 rounded hover:bg-purple-200"
                                    >
                                        + Calc
                                    </button>
                                    <button
                                        onClick={() => { setEditingLOD(null); setShowLODEditor(true); }}
                                        className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded hover:bg-green-200"
                                        title="Create LOD calculation"
                                    >
                                        + LOD
                                    </button>
                                    <button
                                        onClick={() => { setEditingTableCalc(null); setShowTableCalcEditor(true); }}
                                        className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded hover:bg-blue-200"
                                        disabled={values.length === 0}
                                        title={values.length === 0 ? "Add value fields first" : "Create table calculation"}
                                    >
                                        + Table Calc
                                    </button>
                                </div>
                            </div>
                            <div className="flex-1 overflow-y-auto">
                                {availableColumns.map(col => (
                                    <div key={col.fieldName} className={`mb-2 p-2 border rounded shadow-sm text-sm ${col.isCalculated ? (col.dataType === 'lod' ? 'bg-green-50 border-green-200' : 'bg-purple-50 border-purple-200') : 'bg-white'}`}>
                                        <div className="flex justify-between items-center mb-1">
                                            <div className="font-medium truncate flex items-center gap-1" title={col.fieldName}>
                                                {col.isCalculated && <span className={`font-bold ${col.dataType === 'lod' ? 'text-green-600' : 'text-purple-600'}`}>=</span>}
                                                {col.fieldName}
                                            </div>
                                            <div className="flex items-center gap-1">
                                                <span className="text-[10px] text-gray-400 bg-gray-100 px-1 rounded uppercase">{col.dataType}</span>
                                                {col.isCalculated && (
                                                    <>
                                                        <button
                                                            onClick={() => {
                                                                if (col.dataType === 'lod') {
                                                                    const lod = lodCalculations.find(l => l.name === col.fieldName);
                                                                    if (lod) handleEditLODCalculation(lod);
                                                                } else {
                                                                    const calc = calculatedFields.find(c => c.name === col.fieldName);
                                                                    if (calc) handleEditCalculation(calc);
                                                                }
                                                            }}
                                                            className="text-xs text-gray-400 hover:text-blue-600"
                                                            title="Edit Calculation"
                                                        >
                                                            ✎
                                                        </button>
                                                        <button
                                                            onClick={() => {
                                                                if (col.dataType === 'lod') {
                                                                    setLodCalculations(prev => prev.filter(l => l.name !== col.fieldName));
                                                                } else {
                                                                    setCalculatedFields(prev => prev.filter(c => c.name !== col.fieldName));
                                                                }
                                                                // Also remove from rows, columns, and values
                                                                setRows(rows.filter(r => r !== col.fieldName));
                                                                setColumns(columns.filter(c => c !== col.fieldName));
                                                                setValues(values.filter(v => v.field !== col.fieldName));
                                                            }}
                                                            className="text-xs text-gray-400 hover:text-red-600"
                                                            title="Delete Calculation"
                                                        >
                                                            ×
                                                        </button>
                                                    </>
                                                )}
                                            </div>
                                        </div>
                                        <div className="flex gap-1">
                                            <button
                                                onClick={() => toggleField(col.fieldName, 'row')}
                                                className={`px-2 py-0.5 text-xs rounded ${rows.includes(col.fieldName) ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 hover:bg-gray-200'}`}
                                            >
                                                Row
                                            </button>
                                            <button
                                                onClick={() => toggleField(col.fieldName, 'col')}
                                                className={`px-2 py-0.5 text-xs rounded ${columns.includes(col.fieldName) ? 'bg-green-100 text-green-700' : 'bg-gray-100 hover:bg-gray-200'}`}
                                            >
                                                Col
                                            </button>
                                            <button
                                                onClick={() => toggleField(col.fieldName, 'val')}
                                                className={`px-2 py-0.5 text-xs rounded ${values.find(v => v.field === col.fieldName) ? 'bg-orange-100 text-orange-700' : 'bg-gray-100 hover:bg-gray-200'}`}
                                            >
                                                Val
                                            </button>
                                        </div>
                                    </div>
                                ))}
                                {tableCalculations.map(tc => (
                                    <div key={tc.id} className="mb-2 p-2 border rounded shadow-sm text-sm bg-blue-50 border-blue-200">
                                        <div className="flex justify-between items-center mb-1">
                                            <div className="font-medium truncate flex items-center gap-1" title={tc.name}>
                                                <span className="text-blue-600 font-bold">📊</span>
                                                {tc.name}
                                            </div>
                                            <div className="flex items-center gap-1">
                                                <span className="text-[10px] text-gray-400 bg-gray-100 px-1 rounded uppercase">table calc</span>
                                                <button
                                                    onClick={() => handleEditTableCalculation(tc)}
                                                    className="text-xs text-gray-400 hover:text-blue-600"
                                                    title="Edit Table Calculation"
                                                >
                                                    ✎
                                                </button>
                                                <button
                                                    onClick={() => setTableCalculations(prev => prev.filter(t => t.id !== tc.id))}
                                                    className="text-xs text-gray-400 hover:text-red-600"
                                                    title="Delete Table Calculation"
                                                >
                                                    ×
                                                </button>
                                            </div>
                                        </div>
                                        <div className="text-[10px] text-gray-600 mb-1">
                                            {tc.calculation.replace('_', ' ')} of {tc.baseField}
                                        </div>
                                        <div className="flex gap-1">
                                            <button
                                                onClick={() => toggleField(tc.name, 'val')}
                                                className={`px-2 py-0.5 text-xs rounded ${values.find(v => v.field === tc.name) ? 'bg-orange-100 text-orange-700' : 'bg-gray-100 hover:bg-gray-200'}`}
                                            >
                                                Val
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        <div className="col-span-8 flex flex-col gap-4 overflow-auto">
                            <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
                                <div className="border p-3 rounded-md flex-1 bg-blue-50/30">
                                    <h3 className="font-medium mb-2 text-sm text-blue-800">Rows</h3>
                                    <SortableContext items={rows} strategy={verticalListSortingStrategy}>
                                        {rows.map(row => (
                                            <SortableItem
                                                key={row}
                                                id={row}
                                                label={row}
                                                onRemove={() => toggleField(row, 'row')}
                                                extraControls={
                                                    <div className="flex items-center gap-1 mr-2">
                                                        <button
                                                            onClick={() => setFormatModal({ isOpen: true, valueId: null, rowField: row, columnField: null, type: 'row' })}
                                                            className="p-1 hover:bg-gray-200 rounded text-gray-500"
                                                            title="Format Settings"
                                                        >
                                                            ⚙️
                                                        </button>
                                                        <button
                                                            onClick={() => setConditionalFormatModal({ isOpen: true, fieldName: row, fieldType: 'row' })}
                                                            className="p-1 hover:bg-gray-200 rounded text-gray-500"
                                                            title="Conditional Formatting"
                                                        >
                                                            🎨
                                                        </button>
                                                        <button
                                                            onClick={() => updateSort(row, 'alphabetic')}
                                                            className={`text-xs px-1 rounded border ${sortConfigs[row]?.type === 'alphabetic' ? 'bg-blue-200 border-blue-400' : 'bg-white'}`}
                                                            title="Sort A-Z"
                                                        >
                                                            {sortConfigs[row]?.type === 'alphabetic' && sortConfigs[row].direction === 'desc' ? 'Z-A' : 'A-Z'}
                                                        </button>
                                                        <button
                                                            onClick={() => updateSort(row, 'manual')}
                                                            className={`text-xs px-1 rounded border ${sortConfigs[row]?.type === 'manual' ? 'bg-blue-200 border-blue-400' : 'bg-white'}`}
                                                            title="Manual Sort"
                                                        >
                                                            Man
                                                        </button>
                                                        {values.length > 0 && (
                                                            <select
                                                                className={`text-xs border rounded max-w-[80px] ${sortConfigs[row]?.type === 'value' ? 'bg-blue-200 border-blue-400' : ''}`}
                                                                value={sortConfigs[row]?.type === 'value' ? sortConfigs[row].field : ''}
                                                                onChange={(e) => updateSort(row, 'value', e.target.value)}
                                                            >
                                                                <option value="">Sort By...</option>
                                                                {values.map(v => (
                                                                    <option key={v.id} value={v.field}>{v.field}</option>
                                                                ))}
                                                            </select>
                                                        )}
                                                    </div>
                                                }
                                            />
                                        ))}
                                    </SortableContext>
                                </div >

                                <div className="border p-3 rounded-md flex-1 bg-green-50/30">
                                    <h3 className="font-medium mb-2 text-sm text-green-800">Columns</h3>
                                    <SortableContext items={columns} strategy={verticalListSortingStrategy}>
                                        {columns.map(col => (
                                            <SortableItem
                                                key={col}
                                                id={col}
                                                label={col}
                                                onRemove={() => toggleField(col, 'col')}
                                                extraControls={
                                                    <div className="flex items-center gap-1 mr-2">
                                                        <button
                                                            onClick={() => setFormatModal({ isOpen: true, valueId: null, rowField: null, columnField: col, type: 'column' })}
                                                            className="p-1 hover:bg-gray-200 rounded text-gray-500"
                                                            title="Format Settings"
                                                        >
                                                            ⚙️
                                                        </button>
                                                        <button
                                                            onClick={() => setConditionalFormatModal({ isOpen: true, fieldName: col, fieldType: 'column' })}
                                                            className="p-1 hover:bg-gray-200 rounded text-gray-500"
                                                            title="Conditional Formatting"
                                                        >
                                                            🎨
                                                        </button>
                                                        <button
                                                            onClick={() => updateSort(col, 'alphabetic')}
                                                            className={`text-xs px-1 rounded border ${sortConfigs[col]?.type === 'alphabetic' ? 'bg-blue-200 border-blue-400' : 'bg-white'}`}
                                                            title="Sort A-Z"
                                                        >
                                                            {sortConfigs[col]?.type === 'alphabetic' && sortConfigs[col].direction === 'desc' ? 'Z-A' : 'A-Z'}
                                                        </button>
                                                        <button
                                                            onClick={() => updateSort(col, 'manual')}
                                                            className={`text-xs px-1 rounded border ${sortConfigs[col]?.type === 'manual' ? 'bg-blue-200 border-blue-400' : 'bg-white'}`}
                                                            title="Manual Sort"
                                                        >
                                                            Man
                                                        </button>
                                                        {values.length > 0 && (
                                                            <select
                                                                className={`text-xs border rounded max-w-[80px] ${sortConfigs[col]?.type === 'value' ? 'bg-blue-200 border-blue-400' : ''}`}
                                                                value={sortConfigs[col]?.type === 'value' ? sortConfigs[col].field : ''}
                                                                onChange={(e) => updateSort(col, 'value', e.target.value)}
                                                            >
                                                                <option value="">Sort By...</option>
                                                                {values.map(v => (
                                                                    <option key={v.id} value={v.field}>{v.field}</option>
                                                                ))}
                                                            </select>
                                                        )}
                                                    </div>
                                                }
                                            />
                                        ))}
                                    </SortableContext>
                                </div>

                                <div className="border p-3 rounded-md flex-1 bg-orange-50/30">
                                    <h3 className="font-medium mb-2 text-sm text-orange-800">Values</h3>
                                    <SortableContext items={values.map(v => v.id)} strategy={verticalListSortingStrategy}>
                                        {values.map(val => (
                                            <SortableItem
                                                key={val.id}
                                                id={val.id}
                                                label={val.field}
                                                onRemove={() => toggleField(val.field, 'val')}
                                                extraControls={
                                                    <div className="flex items-center gap-1 mr-2">
                                                        <button
                                                            onClick={() => setFormatModal({ isOpen: true, valueId: val.id, rowField: null, columnField: null, type: 'value' })}
                                                            className="p-1 hover:bg-gray-200 rounded text-gray-500"
                                                            title="Format Settings"
                                                        >
                                                            ⚙️
                                                        </button>
                                                        <button
                                                            onClick={() => setConditionalFormatModal({ isOpen: true, fieldName: val.field, fieldType: 'value' })}
                                                            className="p-1 hover:bg-gray-200 rounded text-gray-500"
                                                            title="Conditional Formatting"
                                                        >
                                                            🎨
                                                        </button>
                                                        <select
                                                            className="text-xs border rounded p-1"
                                                            value={val.agg}
                                                            onChange={(e) => {
                                                                const newValues = values.map(v => v.id === val.id ? { ...v, agg: e.target.value as any } : v);
                                                                setValues(newValues);
                                                            }}
                                                        >
                                                            <option value="SUM">SUM</option>
                                                            <option value="AVG">AVG</option>
                                                            <option value="MIN">MIN</option>
                                                            <option value="MAX">MAX</option>
                                                            <option value="COUNT">CNT</option>
                                                            <option value="COUNTD">CNTD</option>
                                                        </select>
                                                    </div>
                                                }
                                            />
                                        ))}
                                    </SortableContext>
                                </div>

                                <div className="border p-3 rounded-md flex-1 bg-purple-50/30">
                                    <div className="flex justify-between items-center mb-2">
                                        <h3 className="font-medium text-sm text-purple-800">Header Rows</h3>
                                        <button
                                            onClick={() => setHeaderRowModal({ isOpen: true, editingHeaderRow: null })}
                                            className="text-xs bg-purple-600 text-white px-2 py-1 rounded hover:bg-purple-700"
                                        >
                                            + Add Header Row
                                        </button>
                                    </div>
                                    <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEndHeaderRows}>
                                        <SortableContext items={headerRows.map(h => h.id)} strategy={verticalListSortingStrategy}>
                                            {headerRows.length === 0 ? (
                                                <p className="text-xs text-gray-500 italic">No header rows configured</p>
                                            ) : (
                                                headerRows.map(headerRow => (
                                                    <SortableItem
                                                        key={headerRow.id}
                                                        id={headerRow.id}
                                                        label={(() => {
                                                            if (headerRow.type === 'title') {
                                                                return headerRow.titleField
                                                                    ? `Title: ${headerRow.titleField}`
                                                                    : `Title: ${headerRow.titleText || '(empty)'}`;
                                                            } else if (headerRow.type === 'filters') {
                                                                return `Filters (${headerRow.selectedFilters?.length || 0})`;
                                                            } else if (headerRow.type === 'custom_field') {
                                                                return `Field: ${headerRow.customField}`;
                                                            } else {
                                                                return `Refresh Date (${headerRow.refreshDateFormat})`;
                                                            }
                                                        })()}
                                                        onRemove={() => handleDeleteHeaderRow(headerRow.id)}
                                                        extraControls={
                                                            <button
                                                                onClick={() => handleEditHeaderRow(headerRow)}
                                                                className="p-1 hover:bg-gray-200 rounded text-gray-500 mr-2"
                                                                title="Edit Header Row"
                                                            >
                                                                ✎
                                                            </button>
                                                        }
                                                    />
                                                ))
                                            )}
                                        </SortableContext>
                                    </DndContext>
                                </div>
                            </DndContext >
                        </div >
                    </div >
                )}
            </div >

            {
                showPreviewModal && (
                    <div className="absolute inset-0 z-50 bg-black/50 flex items-center justify-center p-8">
                        <div className="bg-white rounded-lg shadow-xl w-full h-full flex flex-col overflow-hidden">
                            <div className="flex justify-between items-center p-4 border-b">
                                <h3 className="text-lg font-semibold">Pivot Table Preview</h3>
                                <button
                                    onClick={() => setShowPreviewModal(false)}
                                    className="text-gray-500 hover:text-gray-700"
                                >
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                    </svg>
                                </button>
                            </div>

                            <div className="p-4 border-b bg-gray-50 space-y-3">
                                <div className="flex flex-wrap gap-4">
                                    <div className="flex items-center gap-2">
                                        <input
                                            type="checkbox"
                                            id="modal-col-gt"
                                            checked={showColumnGrandTotals}
                                            onChange={(e) => setShowColumnGrandTotals(e.target.checked)}
                                            className="rounded"
                                        />
                                        <label htmlFor="modal-col-gt" className="text-sm font-medium">Column Grand Totals</label>
                                        {showColumnGrandTotals && (
                                            <select
                                                value={columnGrandTotalsPosition}
                                                onChange={(e) => setColumnGrandTotalsPosition(e.target.value as 'top' | 'bottom')}
                                                className="text-xs border rounded px-2 py-1"
                                            >
                                                <option value="top">Top</option>
                                                <option value="bottom">Bottom</option>
                                            </select>
                                        )}
                                    </div>

                                    <div className="flex items-center gap-2">
                                        <input
                                            type="checkbox"
                                            id="modal-row-gt"
                                            checked={showRowGrandTotals}
                                            onChange={(e) => setShowRowGrandTotals(e.target.checked)}
                                            className="rounded"
                                        />
                                        <label htmlFor="modal-row-gt" className="text-sm font-medium">Row Grand Totals</label>
                                        {showRowGrandTotals && (
                                            <select
                                                value={rowGrandTotalsPosition}
                                                onChange={(e) => setRowGrandTotalsPosition(e.target.value as 'left' | 'right')}
                                                className="text-xs border rounded px-2 py-1"
                                            >
                                                <option value="left">Left</option>
                                                <option value="right">Right</option>
                                            </select>
                                        )}
                                    </div>

                                    <div className="flex items-center gap-2">
                                        <input
                                            type="checkbox"
                                            id="modal-subtotals"
                                            checked={showSubtotals}
                                            onChange={(e) => setShowSubtotals(e.target.checked)}
                                            className="rounded"
                                        />
                                        <label htmlFor="modal-subtotals" className="text-sm font-medium">Show Subtotals</label>
                                    </div>
                                </div>
                            </div>

                            <div className="flex-1 overflow-auto p-4">
                                {renderHeaderRows()}
                                {renderPivotTable()}
                            </div>
                        </div>
                    </div>
                )
            }

            <ManualSortModal
                isOpen={manualSortModal.isOpen}
                onClose={() => setManualSortModal({ isOpen: false, field: null })}
                field={manualSortModal.field || ''}
                initialItems={manualSortModal.field ? getUniqueValuesForField(manualSortModal.field) : []}
                currentOrder={manualSortModal.field ? (manualSortOrders[manualSortModal.field] || []) : []}
                onSave={handleManualSortSave}
            />

            <FormatSettingsModal
                isOpen={formatModal.isOpen}
                onClose={() => setFormatModal({ isOpen: false, valueId: null, rowField: null, columnField: null, type: 'value' })}
                initialFormat={
                    formatModal.type === 'value'
                        ? values.find(v => v.id === formatModal.valueId)?.format
                        : formatModal.type === 'row'
                            ? rowFormats[formatModal.rowField || '']
                            : columnFormats[formatModal.columnField || '']
                }
                onSave={(format) => {
                    if (formatModal.type === 'value') {
                        setValues(values.map(v => v.id === formatModal.valueId ? { ...v, format } : v));
                    } else if (formatModal.type === 'row' && formatModal.rowField) {
                        setRowFormats({ ...rowFormats, [formatModal.rowField]: format });
                    } else if (formatModal.type === 'column' && formatModal.columnField) {
                        setColumnFormats({ ...columnFormats, [formatModal.columnField]: format });
                    }
                    setFormatModal({ isOpen: false, valueId: null, rowField: null, columnField: null, type: 'value' });
                }}
            />

            <SimpleCalcEditor
                isOpen={showCalcEditor}
                onClose={() => { setShowCalcEditor(false); setEditingCalc(null); }}
                onSave={handleSaveCalculation}
                initialName={editingCalc?.name}
                initialFormula={editingCalc?.formula}
            />

            <TableCalcEditor
                isOpen={showTableCalcEditor}
                onClose={() => { setShowTableCalcEditor(false); setEditingTableCalc(null); }}
                onSave={handleSaveTableCalculation}
                valueFields={values.map(v => v.field)}
                rowDimensions={rows}
                initialName={editingTableCalc?.name}
                initialBaseField={editingTableCalc?.baseField}
                initialCalculation={editingTableCalc?.calculation}
                initialComputeUsing={editingTableCalc?.computeUsing}
                initialSpecificDimensions={editingTableCalc?.specificDimensions}
            />

            <LODCalcEditor
                isOpen={showLODEditor}
                onClose={() => { setShowLODEditor(false); setEditingLOD(null); }}
                onSave={handleSaveLODCalculation}
                availableFields={summaryData?.columns.map(c => c.fieldName) || []}
                initialLOD={editingLOD || undefined}
            />

            <ConditionalFormatModal
                isOpen={conditionalFormatModal.isOpen}
                onClose={() => setConditionalFormatModal({ isOpen: false, fieldName: null, fieldType: 'value' })}
                fieldName={conditionalFormatModal.fieldName || ''}
                fieldType={conditionalFormatModal.fieldType}
                initialRules={conditionalFormats.find(cf => cf.fieldName === conditionalFormatModal.fieldName)?.rules || []}
                availableFields={summaryData?.columns.map(c => c.fieldName) || []}
                valueFields={values}
                onSave={(rules) => {
                    if (conditionalFormatModal.fieldName) {
                        setConditionalFormats(prev => {
                            const existing = prev.filter(cf => cf.fieldName !== conditionalFormatModal.fieldName);
                            if (rules.length > 0) {
                                return [...existing, { fieldName: conditionalFormatModal.fieldName!, rules }];
                            }
                            return existing;
                        });
                    }
                }}
            />

            <HeaderRowEditor
                isOpen={headerRowModal.isOpen}
                onClose={() => setHeaderRowModal({ isOpen: false, editingHeaderRow: null })}
                onSave={handleSaveHeaderRow}
                initialHeaderRow={headerRowModal.editingHeaderRow || undefined}
                availableFields={summaryData?.columns.map(c => c.fieldName) || []}
                availableFilters={availableFilters}
            />
        </div >
    );
};

const evaluateConditionalFormat = (
    value: number | string | undefined,
    fieldName: string,
    conditionalFormats: ConditionalFormat[],
    compareValues?: Record<string, number>
): { fontColor?: string; backgroundColor?: string } => {
    if (value === undefined || value === null) return {};

    const fieldFormat = conditionalFormats.find(cf => cf.fieldName === fieldName);
    if (!fieldFormat || fieldFormat.rules.length === 0) return {};

    // Evaluate rules in order, first matching rule wins
    for (const rule of fieldFormat.rules) {
        let matches = false;

        if (rule.condition === 'compare_field' && rule.compareField && compareValues) {
            const compareValue = compareValues[rule.compareField];
            if (compareValue !== undefined) {
                const numValue = typeof value === 'number' ? value : parseFloat(String(value));
                if (!isNaN(numValue)) {
                    matches = numValue > compareValue;
                }
            }
        } else {
            const ruleValue = rule.value;
            if (ruleValue !== undefined) {
                if (typeof value === 'number' || !isNaN(Number(value))) {
                    const numValue = typeof value === 'number' ? value : parseFloat(String(value));
                    const numRuleValue = typeof ruleValue === 'number' ? ruleValue : parseFloat(String(ruleValue));

                    if (!isNaN(numValue) && !isNaN(numRuleValue)) {
                        switch (rule.condition) {
                            case 'gt': matches = numValue > numRuleValue; break;
                            case 'gte': matches = numValue >= numRuleValue; break;
                            case 'lt': matches = numValue < numRuleValue; break;
                            case 'lte': matches = numValue <= numRuleValue; break;
                            case 'eq': matches = numValue === numRuleValue; break;
                            case 'neq': matches = numValue !== numRuleValue; break;
                        }
                    }
                } else {
                    const strValue = String(value).toLowerCase();
                    const strRuleValue = String(ruleValue).toLowerCase();

                    switch (rule.condition) {
                        case 'eq': matches = strValue === strRuleValue; break;
                        case 'neq': matches = strValue !== strRuleValue; break;
                        case 'contains': matches = strValue.includes(strRuleValue); break;
                        case 'not_contains': matches = !strValue.includes(strRuleValue); break;
                    }
                }
            }
        }

        if (matches) {
            return {
                fontColor: rule.fontColor,
                backgroundColor: rule.backgroundColor
            };
        }
    }

    return {};
};

const formatValue = (value: number | string | undefined, format?: FormatConfig) => {
    if (value === undefined || value === null) return '-';

    if (!format) {
        if (typeof value === 'number') {
            return value.toLocaleString(undefined, { maximumFractionDigits: 2 });
        }
        return String(value);
    }

    if (format.type === 'date' || format.type === 'datetime') {
        const dateValue = typeof value === 'string' ? new Date(value) : new Date(value);
        if (isNaN(dateValue.getTime())) return String(value);

        const formatStr = format.dateFormat || (format.type === 'date' ? 'MM/DD/YYYY' : 'MM/DD/YYYY HH:mm:ss');
        return formatDate(dateValue, formatStr);
    }

    const numValue = typeof value === 'number' ? value : Number(value);
    if (isNaN(numValue)) return String(value);

    if (format.type === 'percent') {
        return numValue.toLocaleString(undefined, {
            style: 'percent',
            minimumFractionDigits: format.decimals ?? 2,
            maximumFractionDigits: format.decimals ?? 2
        });
    }

    let formatted = numValue.toLocaleString(undefined, {
        minimumFractionDigits: format.decimals ?? 2,
        maximumFractionDigits: format.decimals ?? 2
    });

    if (format.type === 'currency') {
        return `${format.symbol || '$'}${formatted}`;
    }

    return formatted;
};

const formatDate = (date: Date, format: string): string => {
    const pad = (num: number) => String(num).padStart(2, '0');

    const tokens: Record<string, string> = {
        'YYYY': String(date.getFullYear()),
        'YY': String(date.getFullYear()).slice(-2),
        'MM': pad(date.getMonth() + 1),
        'M': String(date.getMonth() + 1),
        'DD': pad(date.getDate()),
        'D': String(date.getDate()),
        'HH': pad(date.getHours()),
        'H': String(date.getHours()),
        'hh': pad(date.getHours() % 12 || 12),
        'h': String(date.getHours() % 12 || 12),
        'mm': pad(date.getMinutes()),
        'm': String(date.getMinutes()),
        'ss': pad(date.getSeconds()),
        's': String(date.getSeconds()),
        'A': date.getHours() >= 12 ? 'PM' : 'AM',
        'a': date.getHours() >= 12 ? 'pm' : 'am'
    };

    let result = format;
    // Sort by length descending to avoid replacing substrings first
    Object.keys(tokens).sort((a, b) => b.length - a.length).forEach(token => {
        result = result.replace(new RegExp(token, 'g'), tokens[token]);
    });

    return result;
};

const FormatSettingsModal = ({ isOpen, onClose, onSave, initialFormat }: { isOpen: boolean, onClose: () => void, onSave: (format: FormatConfig) => void, initialFormat?: FormatConfig }) => {
    const [type, setType] = useState<'number' | 'currency' | 'percent' | 'date' | 'datetime'>(initialFormat?.type || 'number');
    const [decimals, setDecimals] = useState(initialFormat?.decimals ?? 2);
    const [symbol, setSymbol] = useState(initialFormat?.symbol || '$');
    const [dateFormat, setDateFormat] = useState(initialFormat?.dateFormat || 'MM/DD/YYYY');
    const [useCustomDateFormat, setUseCustomDateFormat] = useState(false);

    const presetFormats = {
        date: ['MM/DD/YYYY', 'DD/MM/YYYY', 'YYYY-MM-DD', 'DD-MM-YYYY', 'MMM DD, YYYY'],
        datetime: ['MM/DD/YYYY HH:mm:ss', 'DD/MM/YYYY HH:mm:ss', 'YYYY-MM-DD HH:mm:ss', 'MM/DD/YYYY hh:mm:ss A']
    };

    useEffect(() => {
        if (isOpen) {
            setType(initialFormat?.type || 'number');
            setDecimals(initialFormat?.decimals ?? 2);
            setSymbol(initialFormat?.symbol || '$');
            const initFormat = initialFormat?.dateFormat || (initialFormat?.type === 'datetime' ? 'MM/DD/YYYY HH:mm:ss' : 'MM/DD/YYYY');
            setDateFormat(initFormat);

            // Check if the initial format is a custom format
            const allPresets = [...(presetFormats.date || []), ...(presetFormats.datetime || [])];
            setUseCustomDateFormat(!allPresets.includes(initFormat));
        }
    }, [isOpen, initialFormat]);

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[60] bg-black/50 flex items-center justify-center">
            <div className="bg-white p-4 rounded-lg shadow-xl w-80">
                <h3 className="font-semibold mb-4">Format Settings</h3>

                <div className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
                        <select
                            value={type}
                            onChange={(e) => setType(e.target.value as any)}
                            className="w-full border rounded p-2 text-sm"
                        >
                            <option value="number">Number</option>
                            <option value="currency">Currency</option>
                            <option value="percent">Percentage</option>
                            <option value="date">Date</option>
                            <option value="datetime">Date & Time</option>
                        </select>
                    </div>

                    {(type === 'number' || type === 'currency' || type === 'percent') && (
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Decimals</label>
                            <input
                                type="number"
                                min="0"
                                max="10"
                                value={decimals}
                                onChange={(e) => setDecimals(parseInt(e.target.value))}
                                className="w-full border rounded p-2 text-sm"
                            />
                        </div>
                    )}

                    {type === 'currency' && (
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Symbol</label>
                            <input
                                type="text"
                                value={symbol}
                                onChange={(e) => setSymbol(e.target.value)}
                                className="w-full border rounded p-2 text-sm"
                                placeholder="$"
                            />
                        </div>
                    )}

                    {(type === 'date' || type === 'datetime') && (
                        <div className="space-y-2">
                            <div className="flex items-center justify-between">
                                <label className="block text-sm font-medium text-gray-700">Date Format</label>
                                <button
                                    type="button"
                                    onClick={() => setUseCustomDateFormat(!useCustomDateFormat)}
                                    className="text-xs text-blue-600 hover:text-blue-800"
                                >
                                    {useCustomDateFormat ? 'Use Preset' : 'Custom Format'}
                                </button>
                            </div>

                            {!useCustomDateFormat ? (
                                <select
                                    value={dateFormat}
                                    onChange={(e) => setDateFormat(e.target.value)}
                                    className="w-full border rounded p-2 text-sm"
                                >
                                    {(type === 'date' ? presetFormats.date : presetFormats.datetime).map(fmt => (
                                        <option key={fmt} value={fmt}>{fmt}</option>
                                    ))}
                                </select>
                            ) : (
                                <input
                                    type="text"
                                    value={dateFormat}
                                    onChange={(e) => setDateFormat(e.target.value)}
                                    className="w-full border rounded p-2 text-sm font-mono"
                                    placeholder="e.g., YYYY/MM/DD"
                                />
                            )}

                            <p className="text-xs text-gray-500">
                                <strong>Tokens:</strong> YYYY (year), MM (month), DD (day), HH (24h), hh (12h), mm (min), ss (sec), A (AM/PM)
                            </p>
                            <p className="text-xs text-gray-400 italic">
                                Example: "YYYY/MM/DD - HH:mm" → "2024/12/25 - 14:30"
                            </p>
                        </div>
                    )}
                </div>

                <div className="flex justify-end gap-2 mt-6">
                    <button onClick={onClose} className="px-3 py-1 text-gray-600 hover:bg-gray-100 rounded">Cancel</button>
                    <button
                        onClick={() => onSave({ type, decimals, symbol, dateFormat })}
                        className="px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-700"
                    >
                        Apply
                    </button>
                </div>
            </div>
        </div>
    );
};
