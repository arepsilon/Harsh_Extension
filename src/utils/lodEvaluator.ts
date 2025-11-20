import type { TableauDataRow, TableauColumn, LODCalculation } from '../types';
import { parseAggregations } from './simpleEvaluator';

/**
 * Evaluate LOD (Level of Detail) calculations
 * LOD calculations compute aggregations at different levels of granularity than the view
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
 * Enrich data with LOD calculation results
 * For FIXED calculations: adds a new column with the computed value for each row
 */
export function enrichWithLODCalculations(
  data: TableauDataRow[],
  columns: TableauColumn[],
  lodCalculations: LODCalculation[]
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
    let lodResults: Map<string, number>;

    // Compute LOD calculation based on type
    // Always use the original columns for dimension lookup since LOD dims are always from original data
    switch (lodCalc.type) {
      case 'FIXED':
        lodResults = evaluateFIXED(enrichedData, columns, lodCalc);
        break;

      case 'INCLUDE':
      case 'EXCLUDE':
        // For INCLUDE/EXCLUDE, we need context from the pivot view
        // These will be handled differently - for now, treat as FIXED
        // In a full implementation, INCLUDE/EXCLUDE need the current view dimensions
        console.warn(`${lodCalc.type} LOD calculations require view context. Using FIXED behavior for now.`);
        lodResults = evaluateFIXED(enrichedData, columns, lodCalc);
        break;

      default:
        lodResults = new Map();
    }

    // Store the results for later use
    lodFieldMap.set(lodCalc.name, lodResults);

    // Add the LOD field as a new column
    const newColIndex = currentColumns.length;
    currentColumns.push({
      fieldName: lodCalc.name,
      dataType: 'float',
      index: newColIndex
    });

    // Add LOD values to each row
    enrichedData = enrichedData.map(row => {
      const groupKey = createGroupKey(row, lodCalc.dimensions, columns);
      const lodValue = lodResults.get(groupKey) ?? 0;

      return {
        ...row,
        [newColIndex]: {
          value: lodValue,
          formattedValue: String(lodValue)
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
