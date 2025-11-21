export interface TableauWorksheet {
    name: string;
    getSummaryDataAsync: (options?: any) => Promise<TableauDataTable>;
    getUnderlyingDataAsync: (options?: any) => Promise<TableauDataTable>;
    getUnderlyingTableDataReaderAsync: (pageRowCount: number, options?: any) => Promise<any>;
    getDataSourcesAsync: () => Promise<TableauDataSource[]>;
}

export interface TableauDataSource {
    name: string;
    getLogicalTablesAsync: () => Promise<TableauLogicalTable[]>;
    getLogicalTableDataAsync: (logicalTableId: string, options?: any) => Promise<TableauDataTable>;
    getLogicalTableDataReaderAsync: (logicalTableId: string, pageRowCount?: number) => Promise<any>;
}

export interface TableauLogicalTable {
    id: string;
    caption: string;
}

export interface TableauDataTable {
    columns: TableauColumn[];
    data: TableauDataRow[];
    totalRowCount: number;
}

export interface TableauColumn {
    fieldName: string;
    dataType: string;
    index: number;
}

export interface TableauDataRow {
    [index: number]: TableauDataValue;
}

export interface TableauDataValue {
    value: any;
    formattedValue: string;
}

export interface TableauDashboard {
    worksheets: TableauWorksheet[];
}

export interface TableauExtension {
    dashboardContent: {
        dashboard: TableauDashboard;
    };
    settings: {
        get: (key: string) => string | null;
        set: (key: string, value: string) => void;
        saveAsync: () => Promise<void>;
    };
}

declare global {
    interface Window {
        tableau: {
            extensions: {
                initializeAsync: () => Promise<void>;
                dashboardContent: {
                    dashboard: TableauDashboard;
                };
                settings: {
                    get: (key: string) => string | null;
                    set: (key: string, value: string) => void;
                    saveAsync: () => Promise<void>;
                };
            };
        };
    }
}

export interface CalculatedField {
    id: string;
    name: string;
    formula: string;
    isAggregation?: boolean;
}

export interface TableCalculation {
    id: string;
    name: string;
    baseField: string;  // The aggregated field to calculate on (e.g., "Sales")
    calculation: 'running_total' | 'percent_of_total' | 'rank' | 'rank_dense' | 'rank_unique' | 'rank_modified';
    computeUsing: 'table_down' | 'table_across' | 'specific';
    specificDimensions?: string[];  // If computeUsing is 'specific', which dimensions to address
}

export interface LODCalculation {
    id: string;
    name: string;
    type: 'FIXED' | 'INCLUDE' | 'EXCLUDE';
    dimensions: string[];
    aggregation: string;
}

export interface FormatConfig {
    type: 'number' | 'currency' | 'percent' | 'date' | 'datetime';
    decimals?: number;
    symbol?: string;
    dateFormat?: string;  // e.g., 'MM/DD/YYYY', 'DD-MM-YYYY', 'YYYY-MM-DD'
}

export interface ConditionalFormatRule {
    id: string;
    condition: 'gt' | 'lt' | 'eq' | 'neq' | 'gte' | 'lte' | 'contains' | 'not_contains' | 'compare_field';
    value?: string | number;
    compareField?: string;  // For field-to-field comparison
    fontColor?: string;
    backgroundColor?: string;
}

export interface ConditionalFormat {
    fieldName: string;
    rules: ConditionalFormatRule[];
}

export interface ValueField {
    id: string;
    field: string;
    agg: 'SUM' | 'AVG' | 'MIN' | 'MAX' | 'COUNT' | 'COUNTD';
    type: 'field' | 'calc' | 'table_calc';
    format?: FormatConfig;
}

export interface PivotConfig {
    rows: string[];
    columns: string[];
    values: ValueField[];
    calculatedFields?: CalculatedField[];
    tableCalculations?: TableCalculation[];
    lodCalculations?: LODCalculation[];
}

export interface PivotNode {
    key: string;
    children: Map<string, PivotNode>;
    values: Record<string, number>;
    counts: Record<string, number>;
    isLeaf: boolean;
    lodSeenKeys?: Map<string, Set<string>>; // Track seen LOD keys to avoid double counting
}
