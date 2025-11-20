import type { TableauDataRow, TableauColumn } from '../types';

export interface CalculatedField {
    id: string;
    name: string;
    formula: string;
    isAggregation?: boolean;
}

/**
 * Check if a formula contains aggregation functions
 */
export function isAggregationFormula(formula: string): boolean {
    return /\b(SUM|AVG|MIN|MAX|COUNT|COUNTD)\s*\(/.test(formula);
}

/**
 * Parse aggregation function calls from a formula
 * Example: "SUM([Sales]) * 1.1" → [{ func: 'SUM', field: 'Sales', fullMatch: 'SUM([Sales])' }]
 */
export function parseAggregations(formula: string) {
    const regex = /\b(SUM|AVG|MIN|MAX|COUNT|COUNTD)\s*\(\s*\[([^\]]+)\]\s*\)/g;
    const aggregations = [];
    let match;
    while ((match = regex.exec(formula)) !== null) {
        aggregations.push({
            func: match[1] as 'SUM' | 'AVG' | 'MIN' | 'MAX' | 'COUNT' | 'COUNTD',
            field: match[2],
            fullMatch: match[0]
        });
    }
    return aggregations;
}

/**
 * Evaluate an aggregation formula using pre-computed node values
 * Used at pivot node level after aggregations have been computed
 */
export function evaluateAggregationFormula(
    formula: string,
    nodeValues: Record<string, number>
): number {
    try {
        let modifiedFormula = formula;
        const aggregations = parseAggregations(formula);

        aggregations.forEach(agg => {
            // Get the aggregated value for this field from the node
            const value = nodeValues[agg.field] || 0;
            // Replace the aggregation call with the value
            modifiedFormula = modifiedFormula.replace(agg.fullMatch, String(value));
        });

        // Evaluate the final arithmetic expression
        const result = new Function('return ' + modifiedFormula)();
        return typeof result === 'number' && !isNaN(result) ? result : 0;
    } catch (error) {
        console.error('Aggregation formula evaluation error:', error, 'Formula:', formula);
        return 0;
    }
}

/**
 * Simple formula evaluator for basic arithmetic expressions with field references
 * Supports: +, -, *, / and field references like [Field Name]
 * This is for ROW-LEVEL evaluation only (before pivot)
 */
export function evaluateFormula(
    formula: string,
    row: TableauDataRow,
    columns: TableauColumn[]
): number {
    try {
        // Replace field references [FieldName] with actual values
        let processedFormula = formula;

        // Find all field references in the format [Something]
        const fieldMatches = formula.match(/\[([^\]]+)\]/g);

        if (fieldMatches) {
            fieldMatches.forEach(match => {
                // Extract field name (remove brackets)
                const fieldName = match.slice(1, -1);

                // Find the column index for this field
                const colIndex = columns.findIndex(c => c.fieldName === fieldName);

                if (colIndex !== -1) {
                    // Get the value from the row
                    const cellValue = row[colIndex];
                    const numValue = typeof cellValue?.value === 'number' ? cellValue.value : 0;

                    // Replace [FieldName] with the actual number
                    processedFormula = processedFormula.replace(match, String(numValue));
                } else {
                    // Field not found, use 0
                    processedFormula = processedFormula.replace(match, '0');
                }
            });
        }

        // Evaluate the arithmetic expression
        // Using Function constructor instead of eval for slightly better safety
        const result = new Function('return ' + processedFormula)();

        return typeof result === 'number' && !isNaN(result) ? result : 0;
    } catch (error) {
        console.error('Formula evaluation error:', error, 'Formula:', formula);
        return 0;
    }
}
