/**
 * Type definitions for Web Worker communication
 *
 * These types define the message protocol between the main thread
 * and worker threads for data processing operations.
 */

import type { TableauDataRow, TableauColumn } from '../types';

// ============================================================================
// Request Types (Main Thread -> Worker)
// ============================================================================

export interface ProcessDataChunkRequest {
    type: 'PROCESS_DATA_CHUNK';
    payload: {
        data: TableauDataRow[];
        columns: TableauColumn[];
        chunkId: number;
    };
}

export interface BuildPivotRequest {
    type: 'BUILD_PIVOT';
    payload: {
        data: TableauDataRow[];
        columns: TableauColumn[];
        pivotConfig: any; // Will be typed more specifically later
    };
}

export interface CalculateAggregatesRequest {
    type: 'CALCULATE_AGGREGATES';
    payload: {
        data: TableauDataRow[];
        columns: TableauColumn[];
        aggregations: Array<{
            field: string;
            operation: 'SUM' | 'AVG' | 'MIN' | 'MAX' | 'COUNT' | 'COUNTD';
        }>;
    };
}

export interface TerminateRequest {
    type: 'TERMINATE';
}

export type WorkerRequest =
    | ProcessDataChunkRequest
    | BuildPivotRequest
    | CalculateAggregatesRequest
    | TerminateRequest;

// ============================================================================
// Response Types (Worker -> Main Thread)
// ============================================================================

export interface ChunkProcessedResponse {
    type: 'CHUNK_PROCESSED';
    payload: {
        data: TableauDataRow[];
        chunkId: number;
    };
}

export interface PivotCompleteResponse {
    type: 'PIVOT_COMPLETE';
    payload: {
        pivotData: any; // Will be typed more specifically later
    };
}

export interface AggregatesCompleteResponse {
    type: 'AGGREGATES_COMPLETE';
    payload: {
        results: Record<string, number>;
    };
}

export interface ErrorResponse {
    type: 'ERROR';
    payload: {
        message: string;
        stack?: string;
    };
}

export interface ProgressResponse {
    type: 'PROGRESS';
    payload: {
        current: number;
        total: number;
        message?: string;
    };
}

export type WorkerResponse =
    | ChunkProcessedResponse
    | PivotCompleteResponse
    | AggregatesCompleteResponse
    | ErrorResponse
    | ProgressResponse;

// ============================================================================
// Utility Types
// ============================================================================

export interface WorkerTask {
    id: string;
    request: WorkerRequest;
    resolve: (value: any) => void;
    reject: (error: Error) => void;
}
