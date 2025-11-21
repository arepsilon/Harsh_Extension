import type { TableauDataRow, TableauColumn } from '../types';

export interface CalculatedField {
    id: string;
    name: string;
    formula: string;
    isAggregation?: boolean;
}

// Cache for compiled formulas to avoid re-parsing for every row
interface CompiledFormula {
    originalFormula: string;
    compiledFunction: Function;
    fieldReferences: string[];
    columnIndices: number[]; // Pre-computed column indices for fast lookup
}

const formulaCache = new Map<string, CompiledFormula>();

/**
 * Clear the formula cache (useful when formulas change)
 */
export function clearFormulaCache() {
    formulaCache.clear();
}

/**
 * Check if a formula contains aggregation functions
 */
export function isAggregationFormula(formula: string): boolean {
    return /\b(SUM|AVG|MIN|MAX|COUNT|COUNTD)\s*\(/.test(formula);
}

/**
 * Process conditional statements (IF and CASE) in a formula
 * Supports nested conditionals and field references
 */
function processConditionals(formula: string, getValue: (field: string) => any): string {
    let processed = formula;
    let maxIterations = 10; // Prevent infinite loops with nested conditionals
    let iteration = 0;

    // Process IF statements (innermost first for nested conditions)
    while (iteration < maxIterations && /\bIF\b/i.test(processed)) {
        // Match IF...THEN...ELSE...END (non-greedy to handle nested IFs)
        const ifRegex = /\bIF\s+(.+?)\s+THEN\s+(.+?)\s+(?:ELSE\s+(.+?)\s+)?END\b/is;
        const match = processed.match(ifRegex);

        if (!match) break;

        const condition = match[1].trim();
        const thenValue = match[2].trim();
        const elseValue = match[3]?.trim() || '0';

        // Evaluate the condition
        const conditionResult = evaluateCondition(condition, getValue);
        const result = conditionResult ? thenValue : elseValue;

        // Replace the IF statement with the result
        processed = processed.replace(match[0], result);
        iteration++;
    }

    // Process CASE statements
    iteration = 0;
    while (iteration < maxIterations && /\bCASE\b/i.test(processed)) {
        // Match CASE WHEN...THEN... [WHEN...THEN...] [ELSE...] END
        const caseRegex = /\bCASE\s+((?:WHEN\s+.+?\s+THEN\s+.+?\s*)+)(?:ELSE\s+(.+?)\s+)?END\b/is;
        const match = processed.match(caseRegex);

        if (!match) break;

        const whenClauses = match[1];
        const elseValue = match[2]?.trim() || '0';

        // Extract all WHEN...THEN pairs
        const whenRegex = /WHEN\s+(.+?)\s+THEN\s+(.+?)(?=\s+(?:WHEN|ELSE|$))/gis;
        let whenMatch;
        let result = elseValue;

        while ((whenMatch = whenRegex.exec(whenClauses)) !== null) {
            const condition = whenMatch[1].trim();
            const value = whenMatch[2].trim();

            if (evaluateCondition(condition, getValue)) {
                result = value;
                break; // First matching condition wins
            }
        }

        // Replace the CASE statement with the result
        processed = processed.replace(match[0], result);
        iteration++;
    }

    return processed;
}

/**
 * Evaluate a conditional expression
 * Supports: >, <, >=, <=, ==, !=, =, AND, OR, NOT
 */
function evaluateCondition(condition: string, getValue: (field: string) => any): boolean {
    try {
        let processed = condition;

        // Replace field references with actual values
        const fieldMatches = processed.match(/\[([^\]]+)\]/g);
        if (fieldMatches) {
            fieldMatches.forEach(match => {
                const fieldName = match.slice(1, -1);
                const value = getValue(fieldName);
                // Quote strings, keep numbers as-is
                const quotedValue = typeof value === 'string' ? `"${value}"` : String(value);
                processed = processed.replace(match, quotedValue);
            });
        }

        // Convert SQL-style operators to JavaScript
        processed = processed
            .replace(/\bAND\b/gi, '&&')
            .replace(/\bOR\b/gi, '||')
            .replace(/\bNOT\b/gi, '!')
            .replace(/\s*=\s*(?!=)/g, ' == '); // Convert single = to ==, but not ==

        // Evaluate the condition
        const result = new Function('return ' + processed)();
        return Boolean(result);
    } catch (error) {
        console.error('Condition evaluation error:', error, 'Condition:', condition);
        return false;
    }
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

        // Process conditionals first (IF/CASE statements)
        modifiedFormula = processConditionals(modifiedFormula, (field: string) => {
            // For aggregation formulas, check if it's an aggregation function
            const aggMatch = field.match(/^(SUM|AVG|MIN|MAX|COUNT|COUNTD)\s*\(\s*\[([^\]]+)\]\s*\)$/i);
            if (aggMatch) {
                // This is an aggregation reference like SUM([Sales])
                return nodeValues[aggMatch[2]] || 0;
            }
            // Otherwise, it's a direct field reference
            return nodeValues[field] || 0;
        });

        const aggregations = parseAggregations(modifiedFormula);

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
 * Compile a formula into an optimized function (with caching)
 * This dramatically improves performance for large datasets
 */
function compileFormula(formula: string, columns: TableauColumn[]): CompiledFormula | null {
    // Check cache first
    const cacheKey = formula + '::' + columns.map(c => c.fieldName).join(',');
    if (formulaCache.has(cacheKey)) {
        return formulaCache.get(cacheKey)!;
    }

    try {
        // Extract all field references and deduplicate
        const fieldMatches = formula.match(/\[([^\]]+)\]/g) || [];
        const fieldReferences = [...new Set(fieldMatches.map(match => match.slice(1, -1)))];

        // Pre-compute column indices for fast lookup
        const columnIndices = fieldReferences.map(fieldName => {
            const idx = columns.findIndex(c => c.fieldName === fieldName);
            return idx !== -1 ? idx : -1;
        });

        // Create parameter names for the function (v0, v1, v2, ...)
        const paramNames = fieldReferences.map((_, idx) => `v${idx}`);

        // Process formula - replace field references with parameter names
        let processedFormula = formula;

        // Replace field references with parameter names
        fieldReferences.forEach((fieldName, idx) => {
            const regex = new RegExp(`\\[${fieldName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\]`, 'g');
            processedFormula = processedFormula.replace(regex, `v${idx}`);
        });

        // Create the compiled function
        const funcBody = `return ${processedFormula}`;
        const compiledFunc = new Function(...paramNames, funcBody);

        const compiled: CompiledFormula = {
            originalFormula: formula,
            compiledFunction: compiledFunc,
            fieldReferences: fieldReferences,
            columnIndices: columnIndices
        };

        // Cache it
        formulaCache.set(cacheKey, compiled);
        return compiled;
    } catch (error) {
        console.error('Formula compilation error:', error, 'Formula:', formula);
        return null;
    }
}

/**
 * Simple formula evaluator for basic arithmetic expressions with field references
 * Supports: +, -, *, / and field references like [Field Name]
 * Also supports conditional statements: IF...THEN...ELSE...END and CASE...WHEN...THEN...END
 * This is for ROW-LEVEL evaluation only (before pivot)
 *
 * OPTIMIZED: Uses formula compilation and caching for better performance on large datasets
 */
export function evaluateFormula(
    formula: string,
    row: TableauDataRow,
    columns: TableauColumn[]
): number {
    try {
        // For formulas with conditionals, use the slower path (for now)
        // TODO: Optimize conditional compilation in the future
        if (/\b(IF|CASE)\b/i.test(formula)) {
            return evaluateFormulaLegacy(formula, row, columns);
        }

        // Try to use compiled/cached version for simple formulas
        const compiled = compileFormula(formula, columns);
        if (!compiled) {
            return evaluateFormulaLegacy(formula, row, columns);
        }

        // Gather field values in order using pre-computed indices (very fast!)
        const fieldValues = compiled.columnIndices.map(colIndex => {
            if (colIndex !== -1) {
                const value = row[colIndex]?.value;
                return typeof value === 'number' ? value : 0;
            }
            return 0;
        });

        // Execute compiled function
        const result = compiled.compiledFunction(...fieldValues);
        return typeof result === 'number' && !isNaN(result) ? result : 0;
    } catch (error) {
        console.error('Formula evaluation error:', error, 'Formula:', formula);
        return 0;
    }
}

/**
 * Legacy formula evaluator (slower but supports all features)
 * Used as fallback for complex formulas with conditionals
 */
function evaluateFormulaLegacy(
    formula: string,
    row: TableauDataRow,
    columns: TableauColumn[]
): number {
    try {
        // Process conditional statements first
        let processedFormula = processConditionals(formula, (fieldName: string) => {
            const colIndex = columns.findIndex(c => c.fieldName === fieldName);
            if (colIndex !== -1) {
                return row[colIndex]?.value;
            }
            return 0;
        });

        // Replace field references [FieldName] with actual values
        const fieldMatches = processedFormula.match(/\[([^\]]+)\]/g);

        if (fieldMatches) {
            fieldMatches.forEach(match => {
                const fieldName = match.slice(1, -1);
                const colIndex = columns.findIndex(c => c.fieldName === fieldName);

                if (colIndex !== -1) {
                    const cellValue = row[colIndex];
                    const numValue = typeof cellValue?.value === 'number' ? cellValue.value : 0;
                    processedFormula = processedFormula.replace(match, String(numValue));
                } else {
                    processedFormula = processedFormula.replace(match, '0');
                }
            });
        }

        const result = new Function('return ' + processedFormula)();
        return typeof result === 'number' && !isNaN(result) ? result : 0;
    } catch (error) {
        console.error('Formula evaluation error:', error, 'Formula:', formula);
        return 0;
    }
}
