/**
 * VizQL Data Service
 * Handles building and executing VizQL queries
 */

import { AxiosInstance } from 'axios';
import authService from './auth.service';
import {
    VizQLQuery,
    VizQLQueryRequest,
    VizQLQueryResponse,
    VizQLField,
    VizQLFilter,
    VizQLMetadataRequest,
    VizQLMetadataResponse,
    PivotConfigRequest,
    DataQueryResult,
    AggregationFunction
} from '../types/vizql.types';

export class VizQLService {
    private static instance: VizQLService;

    private constructor() {}

    public static getInstance(): VizQLService {
        if (!VizQLService.instance) {
            VizQLService.instance = new VizQLService();
        }
        return VizQLService.instance;
    }

    /**
     * Get metadata for a datasource
     */
    public async getMetadata(datasourceLuid: string): Promise<VizQLMetadataResponse> {
        try {
            const client = await authService.getAuthenticatedClient();

            const request: VizQLMetadataRequest = {
                datasource: {
                    datasourceLuid
                },
                options: {
                    bypassMetadataCache: false
                }
            };

            console.log(`Fetching metadata for datasource: ${datasourceLuid}`);

            const response = await client.post('/read-metadata', request);

            console.log(`✓ Retrieved metadata for ${response.data.data.length} fields`);

            return response.data;
        } catch (error: any) {
            this.handleVizQLError(error, 'Failed to fetch metadata');
            throw error;
        }
    }

    /**
     * Execute a VizQL query
     */
    public async executeQuery(
        datasourceLuid: string,
        query: VizQLQuery,
        options?: { returnFormat?: 'OBJECTS' | 'ARRAYS' }
    ): Promise<VizQLQueryResponse> {
        try {
            const client = await authService.getAuthenticatedClient();

            const request: VizQLQueryRequest = {
                datasource: {
                    datasourceLuid
                },
                query,
                options: {
                    returnFormat: options?.returnFormat || 'OBJECTS'
                }
            };

            console.log(`Executing query with ${query.fields.length} fields, ${query.filters?.length || 0} filters`);

            const response = await client.post('/query-datasource', request);

            console.log(`✓ Query returned ${response.data.data.length} rows`);

            return response.data;
        } catch (error: any) {
            this.handleVizQLError(error, 'Query execution failed');
            throw error;
        }
    }

    /**
     * Build and execute queries for pivot table with totals
     */
    public async queryPivotData(config: PivotConfigRequest): Promise<DataQueryResult> {
        console.log(`\n=== Querying Pivot Data for ${config.worksheetName} ===`);

        const { datasourceLuid, rows, columns, values, filters } = config;

        // 1. Get metadata first
        const metadata = await this.getMetadata(datasourceLuid);

        // 2. Build main data query
        const mainQuery = this.buildMainDataQuery(rows, columns, values, filters);
        const mainData = await this.executeQuery(datasourceLuid, mainQuery);

        // 3. Build and execute total queries if requested
        let rowGrandTotals, columnGrandTotals, subtotals;

        if (config.showRowGrandTotals) {
            const rowTotalsQuery = this.buildRowGrandTotalsQuery(columns, values, filters);
            const rowTotalsResult = await this.executeQuery(datasourceLuid, rowTotalsQuery);
            rowGrandTotals = rowTotalsResult.data;
        }

        if (config.showColumnGrandTotals) {
            const colTotalsQuery = this.buildColumnGrandTotalsQuery(rows, values, filters);
            const colTotalsResult = await this.executeQuery(datasourceLuid, colTotalsQuery);
            columnGrandTotals = colTotalsResult.data;
        }

        if (config.showSubtotals && rows.length > 1) {
            const subtotalsQuery = this.buildSubtotalsQuery(rows, columns, values, filters);
            const subtotalsResult = await this.executeQuery(datasourceLuid, subtotalsQuery);
            subtotals = subtotalsResult.data;
        }

        console.log(`✓ Pivot data queries complete\n`);

        return {
            mainData: mainData.data,
            rowGrandTotals,
            columnGrandTotals,
            subtotals,
            metadata: {
                rowCount: mainData.data.length,
                columnCount: (rows.length + columns.length + values.length),
                fields: metadata.data
            }
        };
    }

    /**
     * Build main data query (all dimensions + measures)
     */
    private buildMainDataQuery(
        rows: string[],
        columns: string[],
        values: any[],
        filters?: any[]
    ): VizQLQuery {
        const fields: VizQLField[] = [];

        // Add row dimensions
        for (const row of rows) {
            fields.push({
                fieldCaption: row
            });
        }

        // Add column dimensions
        for (const col of columns) {
            fields.push({
                fieldCaption: col
            });
        }

        // Add measures
        for (const value of values) {
            fields.push({
                fieldCaption: value.field,
                function: value.aggregation as AggregationFunction
            });
        }

        return {
            fields,
            filters: filters as VizQLFilter[] || []
        };
    }

    /**
     * Build row grand totals query (columns + measures, no rows)
     */
    private buildRowGrandTotalsQuery(
        columns: string[],
        values: any[],
        filters?: any[]
    ): VizQLQuery {
        const fields: VizQLField[] = [];

        // Add column dimensions
        for (const col of columns) {
            fields.push({
                fieldCaption: col
            });
        }

        // Add measures
        for (const value of values) {
            fields.push({
                fieldCaption: value.field,
                function: value.aggregation as AggregationFunction
            });
        }

        return {
            fields,
            filters: filters as VizQLFilter[] || []
        };
    }

    /**
     * Build column grand totals query (rows + measures, no columns)
     */
    private buildColumnGrandTotalsQuery(
        rows: string[],
        values: any[],
        filters?: any[]
    ): VizQLQuery {
        const fields: VizQLField[] = [];

        // Add row dimensions
        for (const row of rows) {
            fields.push({
                fieldCaption: row
            });
        }

        // Add measures
        for (const value of values) {
            fields.push({
                fieldCaption: value.field,
                function: value.aggregation as AggregationFunction
            });
        }

        return {
            fields,
            filters: filters as VizQLFilter[] || []
        };
    }

    /**
     * Build subtotals query (partial row hierarchy + columns + measures)
     */
    private buildSubtotalsQuery(
        rows: string[],
        columns: string[],
        values: any[],
        filters?: any[]
    ): VizQLQuery {
        const fields: VizQLField[] = [];

        // Add only top-level row dimensions (for subtotals)
        // For example, if rows = ['Region', 'State', 'City'], subtotals would be at 'Region' and 'State' levels
        for (let i = 0; i < rows.length - 1; i++) {
            fields.push({
                fieldCaption: rows[i]
            });
        }

        // Add column dimensions
        for (const col of columns) {
            fields.push({
                fieldCaption: col
            });
        }

        // Add measures
        for (const value of values) {
            fields.push({
                fieldCaption: value.field,
                function: value.aggregation as AggregationFunction
            });
        }

        return {
            fields,
            filters: filters as VizQLFilter[] || []
        };
    }

    /**
     * Handle VizQL errors
     */
    private handleVizQLError(error: any, context: string): void {
        if (error.response?.data) {
            const vizqlError = error.response.data;
            console.error(`${context}:`, {
                errorCode: vizqlError.errorCode,
                message: vizqlError.message,
                tabErrorCode: vizqlError['tab-error-code']
            });
        } else {
            console.error(`${context}:`, error.message);
        }
    }
}

export default VizQLService.getInstance();
