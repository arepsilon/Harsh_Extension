/**
 * Worker Pool Manager
 *
 * Manages a pool of Web Workers for parallel data processing.
 * Distributes tasks across multiple workers to utilize all CPU cores.
 *
 * Features:
 * - Automatic worker creation and reuse
 * - Task queue management
 * - Load balancing across workers
 * - Error handling and recovery
 * - Worker lifecycle management
 */

import type { WorkerRequest, WorkerResponse, WorkerTask } from './workerTypes';
import type { TableauDataRow, TableauColumn } from '../types';

export class WorkerPool {
    private workers: Worker[] = [];
    private workerStatus: boolean[] = []; // true = busy, false = idle
    private taskQueue: WorkerTask[] = [];
    private maxWorkers: number;
    private nextTaskId = 0;

    constructor(maxWorkers?: number) {
        // Default to number of CPU cores, but cap at 8 to avoid excessive overhead
        this.maxWorkers = Math.min(
            maxWorkers || navigator.hardwareConcurrency || 4,
            8
        );

        console.log(`WorkerPool initialized with ${this.maxWorkers} max workers`);
    }

    /**
     * Process multiple data chunks in parallel across workers
     */
    async processDataBatches(
        batches: Array<{ data: TableauDataRow[]; columns: TableauColumn[] }>
    ): Promise<TableauDataRow[]> {
        console.log(`Processing ${batches.length} batches across ${this.maxWorkers} workers`);

        const promises = batches.map((batch, index) => {
            return this.executeTask<{ data: TableauDataRow[]; chunkId: number }>({
                type: 'PROCESS_DATA_CHUNK',
                payload: {
                    data: batch.data,
                    columns: batch.columns,
                    chunkId: index
                }
            });
        });

        const results = await Promise.all(promises);

        // Sort by chunkId to maintain order
        results.sort((a, b) => a.chunkId - b.chunkId);

        // Flatten all data
        return results.flatMap(result => result.data);
    }

    /**
     * Calculate aggregations using a worker
     */
    async calculateAggregates(
        data: TableauDataRow[],
        columns: TableauColumn[],
        aggregations: Array<{
            field: string;
            operation: 'SUM' | 'AVG' | 'MIN' | 'MAX' | 'COUNT' | 'COUNTD';
        }>
    ): Promise<Record<string, number>> {
        const result = await this.executeTask<{ results: Record<string, number> }>({
            type: 'CALCULATE_AGGREGATES',
            payload: {
                data,
                columns,
                aggregations
            }
        });

        return result.results;
    }

    /**
     * Execute a task on an available worker
     */
    private executeTask<T>(request: WorkerRequest): Promise<T> {
        return new Promise((resolve, reject) => {
            const taskId = `task-${this.nextTaskId++}`;

            const task: WorkerTask = {
                id: taskId,
                request,
                resolve,
                reject
            };

            // Try to assign to an idle worker
            const idleWorkerIndex = this.workerStatus.findIndex(status => !status);

            if (idleWorkerIndex !== -1) {
                // Worker is available
                this.assignTaskToWorker(task, idleWorkerIndex);
            } else if (this.workers.length < this.maxWorkers) {
                // Create a new worker
                const newWorkerIndex = this.workers.length;
                this.createWorker(newWorkerIndex);
                this.assignTaskToWorker(task, newWorkerIndex);
            } else {
                // All workers busy, queue the task
                this.taskQueue.push(task);
            }
        });
    }

    /**
     * Create a new worker
     */
    private createWorker(index: number) {
        try {
            // Use Vite's worker import syntax
            const worker = new Worker(
                new URL('./dataProcessor.worker.ts', import.meta.url),
                { type: 'module' }
            );

            worker.addEventListener('message', (event: MessageEvent<WorkerResponse>) => {
                this.handleWorkerMessage(index, event.data);
            });

            worker.addEventListener('error', (error) => {
                console.error(`Worker ${index} error:`, error);
                this.handleWorkerError(index, error);
            });

            this.workers[index] = worker;
            this.workerStatus[index] = false; // idle

            console.log(`Worker ${index} created`);
        } catch (error) {
            console.error(`Failed to create worker ${index}:`, error);
            throw error;
        }
    }

    /**
     * Assign a task to a specific worker
     */
    private assignTaskToWorker(task: WorkerTask, workerIndex: number) {
        this.workerStatus[workerIndex] = true; // mark as busy

        const worker = this.workers[workerIndex];

        // Store task info for response handling
        (worker as any).__currentTask = task;

        worker.postMessage(task.request);
    }

    /**
     * Handle response from a worker
     */
    private handleWorkerMessage(workerIndex: number, response: WorkerResponse) {
        const worker = this.workers[workerIndex];
        const task = (worker as any).__currentTask as WorkerTask | undefined;

        if (!task) {
            console.warn(`Received message from worker ${workerIndex} with no current task`);
            return;
        }

        switch (response.type) {
            case 'CHUNK_PROCESSED':
            case 'PIVOT_COMPLETE':
            case 'AGGREGATES_COMPLETE':
                // Task completed successfully
                task.resolve(response.payload);
                this.onTaskComplete(workerIndex);
                break;

            case 'ERROR':
                // Task failed
                task.reject(new Error(response.payload.message));
                this.onTaskComplete(workerIndex);
                break;

            case 'PROGRESS':
                // Progress update - don't complete task yet
                // Could emit event for progress tracking
                console.log(`Worker ${workerIndex} progress:`, response.payload);
                break;
        }
    }

    /**
     * Handle worker error
     */
    private handleWorkerError(workerIndex: number, error: ErrorEvent) {
        const worker = this.workers[workerIndex];
        const task = (worker as any).__currentTask as WorkerTask | undefined;

        if (task) {
            task.reject(new Error(`Worker error: ${error.message}`));
        }

        // Recreate the worker
        worker.terminate();
        this.createWorker(workerIndex);

        this.onTaskComplete(workerIndex);
    }

    /**
     * Called when a task completes (success or failure)
     */
    private onTaskComplete(workerIndex: number) {
        const worker = this.workers[workerIndex];

        // Clear current task
        delete (worker as any).__currentTask;

        // Mark worker as idle
        this.workerStatus[workerIndex] = false;

        // Process next queued task if any
        if (this.taskQueue.length > 0) {
            const nextTask = this.taskQueue.shift()!;
            this.assignTaskToWorker(nextTask, workerIndex);
        }
    }

    /**
     * Terminate all workers and clean up
     */
    terminate() {
        console.log('Terminating worker pool');

        for (const worker of this.workers) {
            worker.terminate();
        }

        this.workers = [];
        this.workerStatus = [];
        this.taskQueue = [];
    }

    /**
     * Get pool status
     */
    getStatus() {
        return {
            totalWorkers: this.workers.length,
            maxWorkers: this.maxWorkers,
            busyWorkers: this.workerStatus.filter(busy => busy).length,
            idleWorkers: this.workerStatus.filter(busy => !busy).length,
            queuedTasks: this.taskQueue.length
        };
    }
}

// Singleton instance
let poolInstance: WorkerPool | null = null;

/**
 * Get the global worker pool instance
 */
export function getWorkerPool(): WorkerPool {
    if (!poolInstance) {
        poolInstance = new WorkerPool();
    }
    return poolInstance;
}

/**
 * Terminate the global worker pool
 */
export function terminateWorkerPool() {
    if (poolInstance) {
        poolInstance.terminate();
        poolInstance = null;
    }
}
