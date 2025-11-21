/**
 * Data Aggregator Service
 * Combines main data with row totals, column totals, and subtotals
 */

import { DataQueryResult } from '../types/vizql.types';

export class DataAggregatorService {
    private static instance: DataAggregatorService;

    private constructor() { }

    public static getInstance(): DataAggregatorService {
        if (!DataAggregatorService.instance) {
            DataAggregatorService.instance = new DataAggregatorService();
        }
        return DataAggregatorService.instance;
    }

    /**
     * Aggregate all query results into a unified dataset
     */
    public aggregateResults(queryResult: DataQueryResult): any {
        console.log('Aggregating query results...');

        const {
            mainData,
            rowGrandTotals,
            columnGrandTotals,
            subtotals,
            metadata
        } = queryResult;

        // For now, return the raw results
        // The frontend will handle the actual pivot table construction
        // This service can be extended to merge totals into the main data if needed

        const result = {
            data: mainData,
            totals: {
                rowGrandTotals: rowGrandTotals || [],
                columnGrandTotals: columnGrandTotals || [],
                subtotals: subtotals || []
            },
            metadata
        };

        console.log(`✓ Aggregated ${mainData.length} main rows + totals`);

        return result;
    }

    /**
     * Merge totals into main dataset (optional advanced feature)
     * This can be used to inject total rows directly into the data
     */
    public mergeTotalsIntoData(
        mainData: any[],
        rowGrandTotals?: any[],
        columnGrandTotals?: any[]
    ): any[] {
        // Implementation for merging totals into main data
        // This would insert total rows at appropriate positions
        // For example, after each group when subtotals are enabled

        // TODO: Implement if needed
        return mainData;
    }

    /**
     * Calculate grand total (all measures aggregated)
     */
    public calculateGrandTotal(data: any[], measureFields: string[]): Record<string, number> {
        const grandTotal: Record<string, number> = {};

        for (const field of measureFields) {
            const sum = data.reduce((acc, row) => {
                const value = parseFloat(row[field]) || 0;
                return acc + value;
            }, 0);

            grandTotal[field] = sum;
        }

        return grandTotal;
    }
}

export default DataAggregatorService.getInstance();
