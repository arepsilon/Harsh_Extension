import type { TableauDataTable, TableauDataRow, CalculatedField, ValueField, PivotConfig, PivotNode } from '../types';
import { evaluateFormula, evaluateAggregationFormula, clearFormulaCache } from '../utils/simpleEvaluator';
import { applyTableCalculations } from '../utils/tableCalcEvaluator';
import { enrichWithLODCalculations } from '../utils/lodEvaluator';

export class PivotEngine {
    static pivot(data: TableauDataTable, config: PivotConfig): PivotNode {
        // Performance optimization: Clear formula cache when starting new pivot
        // This ensures we don't keep old cached formulas in memory
        clearFormulaCache();

        console.log(`Starting pivot with ${data.totalRowCount.toLocaleString()} rows...`);
        // Enrich data with ROW-LEVEL calculated fields first
        let enrichedData = config.calculatedFields && config.calculatedFields.length > 0
            ? this.enrichWithCalculatedFields(data, config.calculatedFields)
            : data;

        // Enrich data with LOD calculations
        if (config.lodCalculations && config.lodCalculations.length > 0) {
            // View dimensions = rows + columns from the pivot configuration
            const viewDimensions = [...config.rows, ...config.columns];

            const lodResult = enrichWithLODCalculations(
                enrichedData.data,
                enrichedData.columns,
                config.lodCalculations,
                viewDimensions
            );
            enrichedData = {
                columns: lodResult.enrichedColumns,
                data: lodResult.enrichedData,
                totalRowCount: enrichedData.totalRowCount
            };
        }

        const root: PivotNode = {
            key: 'root',
            children: new Map(),
            values: {},
            counts: {},
            isLeaf: false,
            lodSeenKeys: new Map()
        };

        // Map column names to indices
        const colIndices = new Map<string, number>();
        enrichedData.columns.forEach(col => colIndices.set(col.fieldName, col.index));

        enrichedData.data.forEach(row => {
            this.processRow(row, root, config, 0, colIndices);
        });

        // Post-processing for AVG (Value / Count)
        this.finalizeAggregations(root, config.values);

        // NEW: Evaluate aggregation calculated fields at each node
        if (config.calculatedFields) {
            this.evaluateAggregationFields(root, config.calculatedFields);
        }

        // NEW: Apply table calculations
        if (config.tableCalculations && config.tableCalculations.length > 0) {
            applyTableCalculations(root, config.tableCalculations, config);
        }

        return root;
    }

    private static enrichWithCalculatedFields(
        data: TableauDataTable,
        calculatedFields: CalculatedField[]
    ): TableauDataTable {
        // Only enrich with ROW-LEVEL calculated fields (no aggregations)
        // Aggregation fields will be evaluated later at pivot node level
        const rowLevelFields = calculatedFields.filter(f => !f.isAggregation);

        if (rowLevelFields.length === 0) {
            return data;
        }

        // Create new columns for row-level calculated fields
        const newColumns = [
            ...data.columns,
            ...rowLevelFields.map((calc, idx) => ({
                fieldName: calc.name,
                dataType: 'calculated',
                index: data.columns.length + idx
            }))
        ];

        // Evaluate calculated fields for each row
        const newData = data.data.map(row => {
            const enrichedRow = { ...row };

            rowLevelFields.forEach((calc, idx) => {
                const newIndex = data.columns.length + idx;
                const result = evaluateFormula(calc.formula, row, data.columns);

                // Add the calculated value to the row
                enrichedRow[newIndex] = {
                    value: result,
                    formattedValue: result.toFixed(2)
                };
            });

            return enrichedRow;
        });

        return {
            columns: newColumns,
            data: newData,
            totalRowCount: data.totalRowCount
        };
    }

    private static evaluateAggregationFields(node: PivotNode, calculatedFields: CalculatedField[]) {
        // Filter to only aggregation fields
        const aggFields = calculatedFields.filter(f => f.isAggregation);

        if (aggFields.length === 0) return;

        // Identify all unique column keys in this node
        const columnKeys = new Set<string>();
        Object.keys(node.values).forEach(key => {
            if (key.includes('::') && !key.startsWith('__grand_total__')) {
                const colKey = key.split('::')[0];
                columnKeys.add(colKey);
            }
        });

        const hasColumns = columnKeys.size > 0;

        if (hasColumns) {
            // Process each column combination separately
            columnKeys.forEach(colKey => {
                // Build field values specific to THIS column
                const fieldValues: Record<string, number> = {};

                Object.keys(node.values).forEach(key => {
                    if (key.startsWith(`${colKey}::`)) {
                        const fieldName = key.split('::')[1];
                        fieldValues[fieldName] = node.values[key];
                    }
                });

                // Evaluate each aggregation field for THIS column
                aggFields.forEach(calc => {
                    const result = evaluateAggregationFormula(calc.formula, fieldValues);
                    node.values[`${colKey}::${calc.name}`] = result;
                });
            });

            // Also calculate for grand total (row grand total)
            const grandTotalFieldValues: Record<string, number> = {};
            Object.keys(node.values).forEach(key => {
                if (key.startsWith('__grand_total__::')) {
                    const fieldName = key.split('::')[1];
                    grandTotalFieldValues[fieldName] = node.values[key];
                }
            });

            aggFields.forEach(calc => {
                const result = evaluateAggregationFormula(calc.formula, grandTotalFieldValues);
                node.values[`__grand_total__::${calc.name}`] = result;
            });

        } else {
            // No columns - simple case, evaluate once
            const fieldValues: Record<string, number> = {};
            Object.keys(node.values).forEach(key => {
                if (!key.includes('::')) {
                    fieldValues[key] = node.values[key];
                }
            });

            aggFields.forEach(calc => {
                const result = evaluateAggregationFormula(calc.formula, fieldValues);
                node.values[calc.name] = result;
            });
        }

        // Recursively process children
        node.children.forEach(child => this.evaluateAggregationFields(child, calculatedFields));
    }

    private static processRow(
        row: TableauDataRow,
        node: PivotNode,
        config: PivotConfig,
        depth: number,
        colIndices: Map<string, number>
    ) {
        // 1. Calculate Column Key for this row
        const colKey = config.columns.map(col => {
            const idx = colIndices.get(col);
            return idx !== undefined ? (row[idx]?.formattedValue || '(Blank)') : '';
        }).join(' | ');

        // 2. Aggregate Values at this level
        config.values.forEach(valConfig => {
            // Skip table calculations during aggregation (they are computed later)
            if (valConfig.type === 'table_calc') return;

            const idx = colIndices.get(valConfig.field);
            if (idx === undefined) return;

            const rawVal = row[idx]?.value;
            const val = typeof rawVal === 'number' ? rawVal : 0;

            const compositeKey = colKey ? `${colKey}::${valConfig.field}` : valConfig.field;

            // Apply Aggregation Logic (running calculation)
            const applyAgg = (key: string) => {
                if (!node.values[key]) {
                    node.values[key] = 0;
                    node.counts[key] = 0;
                }

                // Special handling for LOD calculations to avoid double-counting
                const lodCalc = config.lodCalculations?.find(l => l.name === valConfig.field);
                if (lodCalc) {
                    // Initialize lodSeenKeys if missing (should be present from root)
                    if (!node.lodSeenKeys) {
                        node.lodSeenKeys = new Map();
                    }

                    // Get the hidden key column for this LOD
                    const keyColName = `__lod_key_${lodCalc.name}`;
                    const keyColIndex = colIndices.get(keyColName);

                    if (keyColIndex !== undefined) {
                        const lodKey = row[keyColIndex]?.value;

                        // Create a unique identifier for this LOD field in this node
                        const nodeLODId = `${key}::${lodCalc.name}`;

                        if (!node.lodSeenKeys.has(nodeLODId)) {
                            node.lodSeenKeys.set(nodeLODId, new Set());
                        }

                        const seenKeys = node.lodSeenKeys.get(nodeLODId)!;

                        // If we've already seen this group key for this LOD in this node, skip aggregation
                        if (seenKeys.has(lodKey)) {
                            return;
                        }

                        // Mark as seen
                        seenKeys.add(lodKey);
                    }
                }

                switch (valConfig.agg) {
                    case 'SUM':
                    case 'AVG': // Sum now, divide later
                        node.values[key] += val;
                        break;
                    case 'COUNT':
                        node.values[key] += 1;
                        break;
                    case 'COUNTD':
                        // For COUNTD, we'd need a Set, but for now treat as COUNT
                        node.values[key] += 1;
                        break;
                    case 'MIN':
                        node.values[key] = node.counts[key] === 0 ? val : Math.min(node.values[key], val);
                        break;
                    case 'MAX':
                        node.values[key] = node.counts[key] === 0 ? val : Math.max(node.values[key], val);
                        break;
                }
                node.counts[key] += 1;
            };

            // 1. Aggregate for specific column path
            applyAgg(compositeKey);

            // 2. Aggregate for Row Grand Total (ignore column path)
            if (config.columns.length > 0) {
                const grandTotalKey = `__grand_total__::${valConfig.field}`;
                applyAgg(grandTotalKey);
            }
        });

        // 3. Recurse for Rows
        if (depth >= config.rows.length) {
            node.isLeaf = true;
            return;
        }

        const dim = config.rows[depth];
        const colIndex = colIndices.get(dim);

        if (colIndex === undefined) return;

        const value = row[colIndex]?.formattedValue || '(Blank)';

        let child = node.children.get(value);
        if (!child) {
            child = {
                key: value,
                children: new Map(),
                values: {},
                counts: {},
                isLeaf: false,
                lodSeenKeys: new Map()
            };
            node.children.set(value, child);
        }

        this.processRow(row, child, config, depth + 1, colIndices);
    }

    private static finalizeAggregations(node: PivotNode, valueConfigs: ValueField[]) {
        // Calculate AVG
        Object.keys(node.values).forEach(key => {
            const fieldName = key.split('::').pop();
            const config = valueConfigs.find(v => v.field === fieldName);

            if (config && config.agg === 'AVG') {
                const count = node.counts[key] || 1;
                node.values[key] = node.values[key] / count;
            }
        });

        node.children.forEach(child => this.finalizeAggregations(child, valueConfigs));
    }
}
