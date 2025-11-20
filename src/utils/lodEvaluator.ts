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
 * Aggregate values using the specified aggregation function
 */
function computeAggregation(
  values: number[],
  func: string
): number {
  if (values.length === 0) return 0;

  switch (func.toUpperCase()) {
    case 'SUM':
      return values.reduce((sum, val) => sum + val, 0);
    case 'AVG':
      return values.reduce((sum, val) => sum + val, 0) / values.length;
    case 'MIN':
      return Math.min(...values);
    case 'MAX':
      return Math.max(...values);
    case 'COUNT':
      return values.length;
    case 'COUNTD':
      return new Set(values).size;
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

  // Group data by the FIXED dimensions
  const groups = new Map<string, number[]>();

  data.forEach(row => {
    const groupKey = createGroupKey(row, lodCalc.dimensions, columns);
    const value = getFieldValue(row, aggregationInfo.field, columns);

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
  const newColumns = [...columns];
  let enrichedData = data;

  lodCalculations.forEach((lodCalc, index) => {
    let lodResults: Map<string, number>;

    // Compute LOD calculation based on type
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
    const newColIndex = newColumns.length;
    newColumns.push({
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
    enrichedColumns: newColumns,
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
