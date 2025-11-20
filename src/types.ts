export interface TableauWorksheet {
    name: string;
    getSummaryDataAsync: (options?: any) => Promise<TableauDataTable>;
    getUnderlyingDataAsync: (options?: any) => Promise<TableauDataTable>;
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

export interface ValueField {
    id: string;
    field: string;
    agg: 'SUM' | 'AVG' | 'MIN' | 'MAX' | 'COUNT' | 'COUNTD';
    type?: 'field' | 'table_calc';
}

export interface PivotConfig {
    rows: string[];
    columns: string[];
    values: ValueField[];
    calculatedFields?: CalculatedField[];
    tableCalculations?: TableCalculation[];
}

export interface PivotNode {
    key: string;
    children: Map<string, PivotNode>;
    values: Record<string, number>;
    counts: Record<string, number>;
    isLeaf: boolean;
}
