/**
 * VizQL Data Service Type Definitions
 * Based on Tableau VizQL Data Service API Documentation
 */

// ============================================================================
// Authentication & Configuration
// ============================================================================

export interface TableauPATConfig {
    serverUrl: string;
    tokenName: string;
    tokenValue: string;
    siteId?: string;
}

export interface AuthToken {
    token: string;
    siteId: string;
    userId: string;
}

// ============================================================================
// VizQL Data Service API Types
// ============================================================================

export interface VizQLDatasource {
    datasourceLuid: string;
    connections?: VizQLConnection[];
}

export interface VizQLConnection {
    connectionLuid?: string;
    connectionUsername?: string;
    connectionPassword?: string;
}

export interface VizQLOptions {
    returnFormat?: 'OBJECTS' | 'ARRAYS';
    disaggregate?: boolean;
    debug?: boolean;
    bypassMetadataCache?: boolean;
    interpretFieldCaptionsAsFieldNames?: boolean;
}

// ============================================================================
// Field Types
// ============================================================================

export type AggregationFunction =
    | 'SUM' | 'AVG' | 'MEDIAN' | 'COUNT' | 'COUNTD'
    | 'MIN' | 'MAX' | 'STDEV' | 'VAR' | 'COLLECT'
    | 'AGG' | 'NONE' | 'UNSPECIFIED';

export type DateFunction =
    | 'YEAR' | 'QUARTER' | 'MONTH' | 'WEEK' | 'DAY'
    | 'TRUNC_YEAR' | 'TRUNC_QUARTER' | 'TRUNC_MONTH' | 'TRUNC_WEEK' | 'TRUNC_DAY';

export type SortDirection = 'ASC' | 'DESC';

export interface VizQLField {
    fieldCaption: string;
    fieldAlias?: string;
    function?: AggregationFunction | DateFunction;
    maxDecimalPlaces?: number;
    sortPriority?: number;
    sortDirection?: SortDirection;
    calculation?: string;
    binSize?: number;
    tableCalculation?: VizQLTableCalculation;
}

export interface VizQLTableCalculation {
    tableCalcType: 'RUNNING_TOTAL' | 'MOVING_CALCULATION' | 'DIFFERENCE_FROM'
        | 'PERCENT_DIFFERENCE_FROM' | 'PERCENT_FROM' | 'PERCENT_OF_TOTAL'
        | 'RANK' | 'PERCENTILE';
    dimensions: VizQLField[];
    aggregation: AggregationFunction;
}

// ============================================================================
// Filter Types
// ============================================================================

export type FilterType =
    | 'SET' | 'MATCH' | 'QUANTITATIVE_NUMERICAL'
    | 'QUANTITATIVE_DATE' | 'DATE' | 'TOP';

export interface VizQLBaseFilter {
    field: VizQLField;
    filterType: FilterType;
}

export interface VizQLSetFilter extends VizQLBaseFilter {
    filterType: 'SET';
    values: any[];
    exclude?: boolean;
}

export interface VizQLMatchFilter extends VizQLBaseFilter {
    filterType: 'MATCH';
    contains?: string;
    startsWith?: string;
    endsWith?: string;
    exclude?: boolean;
}

export interface VizQLQuantitativeNumericalFilter extends VizQLBaseFilter {
    filterType: 'QUANTITATIVE_NUMERICAL';
    quantitativeFilterType: 'RANGE' | 'MIN' | 'MAX' | 'ONLY_NULL' | 'ONLY_NON_NULL';
    min?: number;
    max?: number;
    includeNulls?: boolean;
}

export interface VizQLQuantitativeDateFilter extends VizQLBaseFilter {
    filterType: 'QUANTITATIVE_DATE';
    quantitativeFilterType: 'RANGE' | 'MIN' | 'MAX' | 'ONLY_NULL' | 'ONLY_NON_NULL';
    minDate?: string; // RFC 3339 format (YYYY-MM-DD)
    maxDate?: string;
    includeNulls?: boolean;
}

export interface VizQLDateFilter extends VizQLBaseFilter {
    filterType: 'DATE';
    periodType: 'MINUTES' | 'HOURS' | 'DAYS' | 'WEEKS' | 'MONTHS' | 'QUARTERS' | 'YEARS';
    dateRangeType: 'CURRENT' | 'LAST' | 'LASTN' | 'NEXT' | 'NEXTN' | 'TODATE';
    rangeN?: number;
    anchorDate?: string; // RFC 3339 format
}

export interface VizQLTopFilter extends VizQLBaseFilter {
    filterType: 'TOP';
    direction: 'TOP' | 'BOTTOM';
    howMany: number;
    fieldToMeasure: VizQLField;
}

export type VizQLFilter =
    | VizQLSetFilter
    | VizQLMatchFilter
    | VizQLQuantitativeNumericalFilter
    | VizQLQuantitativeDateFilter
    | VizQLDateFilter
    | VizQLTopFilter;

// ============================================================================
// Parameters
// ============================================================================

export interface VizQLParameter {
    parameterCaption: string;
    value: string | number | boolean;
}

// ============================================================================
// Query Structure
// ============================================================================

export interface VizQLQuery {
    fields: VizQLField[];
    filters?: VizQLFilter[];
    parameters?: VizQLParameter[];
}

export interface VizQLQueryRequest {
    datasource: VizQLDatasource;
    query: VizQLQuery;
    options?: VizQLOptions;
}

// ============================================================================
// Metadata
// ============================================================================

export interface VizQLFieldMetadata {
    fieldName: string;
    fieldCaption: string;
    dataType: 'INTEGER' | 'REAL' | 'STRING' | 'DATETIME' | 'BOOLEAN' | 'DATE' | 'SPATIAL' | 'UNKNOWN';
    defaultAggregation: AggregationFunction;
    columnClass: 'COLUMN' | 'BIN' | 'GROUP' | 'CALCULATION' | 'TABLE_CALCULATION';
    formula?: string;
    logicalTableId?: string;
}

export interface VizQLMetadataResponse {
    data: VizQLFieldMetadata[];
    extraData: {
        parameters: any[];
    };
}

export interface VizQLMetadataRequest {
    datasource: VizQLDatasource;
    options?: VizQLOptions;
}

// ============================================================================
// Query Response
// ============================================================================

export interface VizQLQueryResponse {
    data: any[] | Record<string, any>[];
}

export interface VizQLErrorResponse {
    errorCode: string;
    message: string;
    messages: string[];
    datetime: string;
    debug?: any;
    'tab-error-code'?: string;
}

// ============================================================================
// Workbook Parsing Types
// ============================================================================

export interface WorksheetInfo {
    name: string;
    rows: string[];
    columns: string[];
    values: ValueFieldInfo[];
    calculatedFields: CalculatedFieldInfo[];
    filters: any[];
}

export interface ValueFieldInfo {
    field: string;
    aggregation: AggregationFunction;
}

export interface CalculatedFieldInfo {
    name: string;
    formula: string;
    dataType: string;
}

export interface WorkbookMetadata {
    datasourceLuid: string;
    worksheets: Record<string, WorksheetInfo>;
}

// ============================================================================
// Frontend Configuration Types
// ============================================================================

export interface PivotConfigRequest {
    workbookId: string;
    worksheetName: string;
    datasourceLuid: string;
    rows: string[];
    columns: string[];
    values: ValueFieldInfo[];
    calculatedFields?: CalculatedFieldInfo[];
    filters?: any[];
    showRowGrandTotals?: boolean;
    showColumnGrandTotals?: boolean;
    showSubtotals?: boolean;
}

export interface DataQueryResult {
    mainData: any[];
    rowGrandTotals?: any[];
    columnGrandTotals?: any[];
    subtotals?: any[];
    metadata: {
        rowCount: number;
        columnCount: number;
        fields: VizQLFieldMetadata[];
    };
}
