/**
 * Data Processor Web Worker
 *
 * This worker handles CPU-intensive data processing tasks off the main thread:
 * - Data chunk processing and transformation
 * - Pivot table calculations
 * - Aggregate computations
 *
 * By moving these operations to a worker, the UI remains responsive during
 * heavy data processing operations.
 */

import type { WorkerRequest, WorkerResponse } from './workerTypes';
import type { TableauDataRow, TableauColumn } from '../types';

// Listen for messages from the main thread
self.addEventListener('message', (event: MessageEvent<WorkerRequest>) => {
    const request = event.data;

    try {
        switch (request.type) {
            case 'PROCESS_DATA_CHUNK':
                handleProcessDataChunk(request.payload);
                break;

            case 'BUILD_PIVOT':
                handleBuildPivot(request.payload);
                break;

            case 'CALCULATE_AGGREGATES':
                handleCalculateAggregates(request.payload);
                break;

            case 'TERMINATE':
                self.close();
                break;
        }
    } catch (error) {
        sendError(
            error instanceof Error ? error.message : String(error),
            error instanceof Error ? error.stack : undefined
        );
    }
});

// ============================================================================
// Request Handlers
// ============================================================================

/**
 * Process a chunk of data - perform transformations, type conversions, etc.
 */
function handleProcessDataChunk(payload: any) {
    const { data, chunkId } = payload;

    // For now, we'll just pass through the data
    // In the future, we can add:
    // - Type conversions (string to number, date parsing)
    // - Data validation
    // - Initial filtering
    // - Memory optimization (deduplication, compression)

    const processedData = data.map((row: TableauDataRow) => {
        // Could add transformations here
        return row;
    });

    const response: WorkerResponse = {
        type: 'CHUNK_PROCESSED',
        payload: {
            data: processedData,
            chunkId
        }
    };

    self.postMessage(response);
}

/**
 * Build a pivot table structure from raw data
 */
function handleBuildPivot(_payload: any) {
    // This is a placeholder - actual pivot logic would go here
    // For now, we'll send back empty result
    // Real implementation would build the pivot tree structure
    // const { data, columns, pivotConfig } = payload;

    const response: WorkerResponse = {
        type: 'PIVOT_COMPLETE',
        payload: {
            pivotData: {}
        }
    };

    self.postMessage(response);
}

/**
 * Calculate aggregations over the dataset
 */
function handleCalculateAggregates(payload: any) {
    const { data, columns, aggregations } = payload;

    const results: Record<string, number> = {};

    // Calculate each requested aggregation
    for (const agg of aggregations) {
        const columnIndex = columns.findIndex((col: TableauColumn) => col.fieldName === agg.field);

        if (columnIndex === -1) {
            continue;
        }

        let result = 0;
        const values: number[] = [];

        // Collect values
        for (const row of data) {
            const cellValue = row[columnIndex];
            const value = cellValue?.value;

            if (value != null && typeof value === 'number') {
                values.push(value);
            }
        }

        // Calculate based on operation
        switch (agg.operation) {
            case 'SUM':
                result = values.reduce((sum, val) => sum + val, 0);
                break;

            case 'AVG':
                result = values.length > 0
                    ? values.reduce((sum, val) => sum + val, 0) / values.length
                    : 0;
                break;

            case 'MIN':
                result = values.length > 0 ? Math.min(...values) : 0;
                break;

            case 'MAX':
                result = values.length > 0 ? Math.max(...values) : 0;
                break;

            case 'COUNT':
                result = values.length;
                break;

            case 'COUNTD':
                result = new Set(values).size;
                break;
        }

        results[agg.field] = result;
    }

    const response: WorkerResponse = {
        type: 'AGGREGATES_COMPLETE',
        payload: { results }
    };

    self.postMessage(response);
}

// ============================================================================
// Utility Functions
// ============================================================================

function sendError(message: string, stack?: string) {
    const response: WorkerResponse = {
        type: 'ERROR',
        payload: { message, stack }
    };
    self.postMessage(response);
}

// Utility function for progress updates (available for future use)
// @ts-ignore - Unused but part of public API
// eslint-disable-next-line @typescript-eslint/no-unused-vars
const sendProgress = (current: number, total: number, message?: string) => {
    const response: WorkerResponse = {
        type: 'PROGRESS',
        payload: { current, total, message }
    };
    self.postMessage(response);
};

// Export empty object to make TypeScript treat this as a module
export {};
