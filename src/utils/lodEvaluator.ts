import type { TableauDataRow, TableauColumn, LODCalculation } from '../types';
import { parseAggregations } from './simpleEvaluator';

/**
 * LOD (Level of Detail) Calculation Engine
 *
 * LOD calculations compute aggregations at a different granularity than the visualization.
 * They allow you to answer questions like "What is the total sales per region?" even when
 * your view is showing data at the product level.
 *
 * How it works:
 * 1. Determine effective dimensions based on LOD type (FIXED/INCLUDE/EXCLUDE)
 * 2. Group the data by those effective dimensions
 * 3. Apply the aggregation function to each group (inner aggregation)
 * 4. Join the results back to each row (broadcast the value to matching rows)
 * 5. The LOD field can then be used in further calculations or aggregations
 *
 * Three LOD Types:
 * - FIXED: Use exactly the specified dimensions, ignoring view dimensions
 *          Example: {FIXED [Region]: SUM([Sales])} always groups by Region
 *
 * - INCLUDE: Use view dimensions PLUS the specified dimensions
 *           Example: {INCLUDE [Product]: AVG([Sales])} with view=[Region]
 *           calculates at [Region, Product] level
 *
 * - EXCLUDE: Use view dimensions MINUS the specified dimensions
 *           Example: {EXCLUDE [Quarter]: SUM([Sales])} with view=[Region, Quarter]
 *           calculates at just [Region] level
 *
 * Key Principles:
 * - LODs execute first, before table-level filters and view aggregations
 * - The result is row-level: every row gets the aggregated value for its group
 * - Nulls are treated as a distinct group in dimension grouping
 * - Outer aggregation is applied when displaying (e.g., AVG of the LOD values)
 */

interface GroupKey {
  [dimension: string]: any;
}

/**
 * Parse an LOD aggregation formula and extract the field and function
 * Example: "SUM([Sales])" → { func: 'SUM', field: 'Sales' }
 */
function parseLODAggregation(aggregation: string): { func: string; field: string } | null {
  const parsed = parseAggregations(aggregation);
  if (parsed.length > 0) {
    return { func: parsed[0].func, field: parsed[0].field };
  }
  return null;
}

/**
 * Create a string key from dimension values for grouping
 */
function createGroupKey(row: TableauDataRow, dimensions: string[], columns: TableauColumn[]): string {
  const keyParts = dimensions.map(dim => {
    const colIndex = columns.findIndex(c => c.fieldName === dim);
    if (colIndex !== -1) {
      return String(row[colIndex]?.value ?? 'null');
    }
    return 'null';
  });
  return keyParts.join('||');
}

/**
 * Get value from a row for a specific field
 */
function getFieldValue(row: TableauDataRow, fieldName: string, columns: TableauColumn[]): number {
  const colIndex = columns.findIndex(c => c.fieldName === fieldName);
  if (colIndex !== -1) {
    const value = row[colIndex]?.value;
    return typeof value === 'number' ? value : 0;
  }
  return 0;
}

/**
 * Get any value from a row for a specific field (for COUNT/COUNTD)
 */
function getFieldValueAny(row: TableauDataRow, fieldName: string, columns: TableauColumn[]): any {
  const colIndex = columns.findIndex(c => c.fieldName === fieldName);
  if (colIndex !== -1) {
    return row[colIndex]?.value;
  }
  return null;
}

/**
 * Aggregate values using the specified aggregation function
 */
function computeAggregation(
  values: number[] | any[],
  func: string
): number {
  if (values.length === 0) return 0;

  const funcUpper = func.toUpperCase();

  switch (funcUpper) {
    case 'SUM':
      return (values as number[]).reduce((sum, val) => sum + val, 0);
    case 'AVG': {
      const numericValues = (values as number[]).filter(v => typeof v === 'number' && !isNaN(v));
      if (numericValues.length === 0) return 0;
      return numericValues.reduce((sum, val) => sum + val, 0) / numericValues.length;
    }
    case 'MIN': {
      const numericValues = (values as number[]).filter(v => typeof v === 'number' && !isNaN(v));
      return numericValues.length > 0 ? Math.min(...numericValues) : 0;
    }
    case 'MAX': {
      const numericValues = (values as number[]).filter(v => typeof v === 'number' && !isNaN(v));
      return numericValues.length > 0 ? Math.max(...numericValues) : 0;
    }
    case 'COUNT':
      // Count non-null values
      return values.filter(v => v != null).length;
    case 'COUNTD':
      // Filter out null/undefined and count distinct values
      const distinctValues = new Set(values.filter(v => v != null));
      return distinctValues.size;
    default:
      return 0;
  }
}

/**
 * Evaluate a FIXED LOD calculation
 * FIXED calculations compute at a specific level regardless of view dimensions
 * Example: {FIXED [Region]: SUM([Sales])} computes total sales per region
 */
function evaluateFIXED(
  data: TableauDataRow[],
  columns: TableauColumn[],
  lodCalc: LODCalculation
): Map<string, number> {
  const aggregationInfo = parseLODAggregation(lodCalc.aggregation);
  if (!aggregationInfo) {
    console.error('Invalid LOD aggregation formula:', lodCalc.aggregation);
    return new Map();
  }

  const funcUpper = aggregationInfo.func.toUpperCase();
  const isCountAggregation = funcUpper === 'COUNT' || funcUpper === 'COUNTD';

  // Group data by the FIXED dimensions
  const groups = new Map<string, any[]>();

  data.forEach(row => {
    const groupKey = createGroupKey(row, lodCalc.dimensions, columns);

    // For COUNT/COUNTD, use any value type; for numeric aggregations, use numbers only
    const value = isCountAggregation
      ? getFieldValueAny(row, aggregationInfo.field, columns)
      : getFieldValue(row, aggregationInfo.field, columns);

    if (!groups.has(groupKey)) {
      groups.set(groupKey, []);
    }
    groups.get(groupKey)!.push(value);
  });

  // Compute aggregation for each group
  const results = new Map<string, number>();
  groups.forEach((values, key) => {
    results.set(key, computeAggregation(values, aggregationInfo.func));
  });

  return results;
}

/**
 * Determine effective dimensions for an LOD calculation based on its type
 */
function getEffectiveDimensions(
  lodCalc: LODCalculation,
  viewDimensions: string[]
): string[] {
  switch (lodCalc.type) {
    case 'FIXED':
      // Use exactly the specified dimensions
      return lodCalc.dimensions;

    case 'INCLUDE':
      // Union of view dimensions + specified dimensions
      const includeDims = new Set([...viewDimensions, ...lodCalc.dimensions]);
      return Array.from(includeDims);

    case 'EXCLUDE':
      // View dimensions minus specified dimensions
      const excludeSet = new Set(lodCalc.dimensions);
      return viewDimensions.filter(dim => !excludeSet.has(dim));

    default:
      return lodCalc.dimensions;
  }
}

/**
 * Enrich data with LOD calculation results
 * LOD calculations compute aggregations at a different granularity than the view
 */
export function enrichWithLODCalculations(
  data: TableauDataRow[],
  columns: TableauColumn[],
  lodCalculations: LODCalculation[],
  viewDimensions: string[]
): {
  enrichedData: TableauDataRow[];
  enrichedColumns: TableauColumn[];
  lodFieldMap: Map<string, Map<string, number>>;
} {
  if (!lodCalculations || lodCalculations.length === 0) {
    return {
      enrichedData: data,
      enrichedColumns: columns,
      lodFieldMap: new Map()
    };
  }

  // Store LOD results for each calculation
  const lodFieldMap = new Map<string, Map<string, number>>();
  let currentColumns = [...columns];
  let enrichedData = data;

  lodCalculations.forEach((lodCalc, index) => {
    // Determine the effective dimensions based on LOD type
    const effectiveDimensions = getEffectiveDimensions(lodCalc, viewDimensions);

    // Create a modified LOD calc with effective dimensions for evaluation
    const effectiveLodCalc: LODCalculation = {
      ...lodCalc,
      dimensions: effectiveDimensions
    };

    // Compute LOD calculation (always use FIXED logic with effective dimensions)
    // Use currentColumns so dimensions can reference previously calculated LOD fields
    const lodResults = evaluateFIXED(enrichedData, currentColumns, effectiveLodCalc);

    // Store the results for later use
    lodFieldMap.set(lodCalc.name, lodResults);

    // Add the LOD field as a new column
    // Find the maximum index in existing columns to avoid conflicts
    const maxIndex = currentColumns.length > 0
      ? Math.max(...currentColumns.map(c => c.index))
      : -1;
    const newColIndex = maxIndex + 1;

    // Save current columns for lookup (before adding new column)
    const columnsForLookup = [...currentColumns];

    currentColumns.push({
      fieldName: lodCalc.name,
      dataType: 'float',
      index: newColIndex
    });

    // Add LOD values to each row by joining on effective dimensions
    enrichedData = enrichedData.map(row => {
      // Use effective dimensions to look up the LOD value for this row
      const groupKey = createGroupKey(row, effectiveDimensions, columnsForLookup);
      const lodValue = lodResults.get(groupKey) ?? 0;

      return {
        ...row,
        [newColIndex]: {
          value: lodValue,
          formattedValue: typeof lodValue === 'number' && !Number.isInteger(lodValue)
            ? lodValue.toFixed(2)
            : String(lodValue)
        }
      };
    });
  });

  return {
    enrichedData,
    enrichedColumns: currentColumns,
    lodFieldMap
  };
}

/**
 * Get the LOD value for a specific row
 * Used when evaluating formulas that reference LOD calculations
 */
export function getLODValue(
  row: TableauDataRow,
  lodCalcName: string,
  lodFieldMap: Map<string, Map<string, number>>,
  groupKey: string
): number {
  const lodResults = lodFieldMap.get(lodCalcName);
  if (!lodResults) return 0;
  return lodResults.get(groupKey) ?? 0;
}
