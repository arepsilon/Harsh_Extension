# Web Workers Performance Optimization Design

## Overview

This document outlines a strategy to use Web Workers to improve data fetching and processing performance for large Tableau datasets.

## Problem Analysis

### Current Bottlenecks

1. **Data Fetching**: Sequential page fetching blocks the main thread
2. **Data Processing**: Aggregation, pivot calculations, and transformations block UI
3. **Large Datasets**: 100K+ rows can freeze the browser for several seconds

### Web Workers Constraints

- **Cannot access DOM** or `window` object
- **Cannot use Tableau Extensions API** directly (it's attached to `window.tableau`)
- **Can** perform heavy computations in parallel
- **Can** handle data serialization and deserialization

## Proposed Architecture

### Hybrid Approach: Main Thread Fetching + Worker Processing

Since the Tableau API is only available in the main thread, we split the work:

```
Main Thread                          Web Worker
-----------                          ----------
1. Fetch data pages
   from Tableau API

2. Send raw data chunks  --------->  3. Receive raw data
   to worker
                                     4. Process data:
                                        - Aggregate values
                                        - Build pivot structure
                                        - Apply calculations
                                        - Format numbers

5. Receive processed     <---------  6. Send results back
   results

6. Update UI with
   processed data
```

## Implementation Plan

### Phase 1: Worker Infrastructure

#### File Structure
```
src/
  workers/
    dataProcessor.worker.ts     - Main worker file
    workerPool.ts               - Pool manager for multiple workers
    workerTypes.ts              - Message type definitions
```

#### Worker Message Protocol

```typescript
// Request types
type WorkerRequest =
  | { type: 'PROCESS_DATA_CHUNK', payload: DataChunk }
  | { type: 'BUILD_PIVOT', payload: PivotRequest }
  | { type: 'CALCULATE_AGGREGATES', payload: AggregateRequest }
  | { type: 'TERMINATE' };

// Response types
type WorkerResponse =
  | { type: 'CHUNK_PROCESSED', payload: ProcessedChunk }
  | { type: 'PIVOT_COMPLETE', payload: PivotResult }
  | { type: 'AGGREGATES_COMPLETE', payload: AggregateResult }
  | { type: 'ERROR', payload: ErrorInfo }
  | { type: 'PROGRESS', payload: ProgressInfo };
```

### Phase 2: Optimized Data Fetching

#### Parallel Page Fetching

Instead of sequential page fetching, fetch multiple pages concurrently:

```typescript
// Current (Sequential)
for (let i = 0; i < pageCount; i++) {
  const page = await dataReader.getPageAsync(i);
  allData = allData.concat(page.data);
}

// Optimized (Parallel batches)
const CONCURRENT_FETCHES = 5;

for (let batch = 0; batch < pageCount; batch += CONCURRENT_FETCHES) {
  const pagePromises = [];
  for (let i = batch; i < Math.min(batch + CONCURRENT_FETCHES, pageCount); i++) {
    pagePromises.push(dataReader.getPageAsync(i));
  }

  const pages = await Promise.all(pagePromises);

  // Send batch to worker for processing
  const processed = await workerPool.processDataBatch(pages);
  allData = allData.concat(processed);
}
```

**Expected improvement**: 3-5x faster for datasets with 10+ pages

### Phase 3: Worker-Based Data Processing

#### Data Transformation Worker

Move expensive operations to worker:

```typescript
// dataProcessor.worker.ts
self.addEventListener('message', (event: MessageEvent<WorkerRequest>) => {
  const { type, payload } = event.data;

  switch (type) {
    case 'PROCESS_DATA_CHUNK':
      const processed = processDataChunk(payload);
      self.postMessage({ type: 'CHUNK_PROCESSED', payload: processed });
      break;

    case 'BUILD_PIVOT':
      const pivot = buildPivotTable(payload);
      self.postMessage({ type: 'PIVOT_COMPLETE', payload: pivot });
      break;

    case 'CALCULATE_AGGREGATES':
      const aggregates = calculateAggregates(payload);
      self.postMessage({ type: 'AGGREGATES_COMPLETE', payload: aggregates });
      break;
  }
});

function processDataChunk(chunk: DataChunk): ProcessedChunk {
  // Perform computations:
  // - Type conversions
  // - Date parsing
  // - Number formatting
  // - Initial aggregations
  return processedData;
}
```

### Phase 4: Worker Pool Management

#### Multiple Workers for CPU-Intensive Tasks

```typescript
// workerPool.ts
export class WorkerPool {
  private workers: Worker[] = [];
  private taskQueue: Task[] = [];
  private maxWorkers: number;

  constructor(maxWorkers = navigator.hardwareConcurrency || 4) {
    this.maxWorkers = Math.min(maxWorkers, 8); // Cap at 8 workers
  }

  async processDataBatch(pages: any[]): Promise<any[]> {
    // Distribute pages across workers
    const chunks = this.chunkArray(pages, this.maxWorkers);

    const results = await Promise.all(
      chunks.map((chunk, idx) => this.processChunk(chunk, idx))
    );

    return results.flat();
  }

  private processChunk(chunk: any[], workerIdx: number): Promise<any[]> {
    return new Promise((resolve, reject) => {
      const worker = this.getOrCreateWorker(workerIdx);

      const handler = (event: MessageEvent<WorkerResponse>) => {
        if (event.data.type === 'CHUNK_PROCESSED') {
          worker.removeEventListener('message', handler);
          resolve(event.data.payload);
        } else if (event.data.type === 'ERROR') {
          worker.removeEventListener('message', handler);
          reject(new Error(event.data.payload.message));
        }
      };

      worker.addEventListener('message', handler);
      worker.postMessage({ type: 'PROCESS_DATA_CHUNK', payload: chunk });
    });
  }
}
```

## Performance Projections

### Baseline (Current Implementation)

| Dataset Size | Fetch Time | Process Time | Total Time |
|--------------|------------|--------------|------------|
| 10K rows     | 1s         | 0.5s         | 1.5s       |
| 100K rows    | 5s         | 3s           | 8s         |
| 500K rows    | 20s        | 15s          | 35s        |
| 1M rows      | 40s        | 35s          | 75s        |

### With Web Workers

| Dataset Size | Fetch Time (Parallel) | Worker Processing | Total Time | Improvement |
|--------------|-----------------------|-------------------|------------|-------------|
| 10K rows     | 0.5s                  | 0.2s              | 0.7s       | 2.1x faster |
| 100K rows    | 1.5s                  | 1s                | 2.5s       | 3.2x faster |
| 500K rows    | 6s                    | 4s                | 10s        | 3.5x faster |
| 1M rows      | 12s                   | 8s                | 20s        | 3.75x faster|

## Implementation Phases

### Phase 1: Basic Worker Setup (2-3 hours)
- [ ] Create worker file structure
- [ ] Define message types
- [ ] Implement basic worker communication
- [ ] Test with small dataset

### Phase 2: Parallel Fetching (1-2 hours)
- [ ] Implement concurrent page fetching
- [ ] Add batch processing
- [ ] Test with medium dataset (100K rows)

### Phase 3: Worker Processing (3-4 hours)
- [ ] Move data transformation to worker
- [ ] Implement pivot calculation in worker
- [ ] Add aggregate calculations in worker
- [ ] Test with large dataset (500K rows)

### Phase 4: Worker Pool (2-3 hours)
- [ ] Implement worker pool manager
- [ ] Add dynamic worker allocation
- [ ] Implement task queue
- [ ] Test with multiple large datasets

### Phase 5: Optimization (1-2 hours)
- [ ] Add progressive rendering (show results as they arrive)
- [ ] Implement cancellation support
- [ ] Add memory management
- [ ] Performance testing and tuning

**Total Estimated Time**: 9-14 hours

## Key Benefits

1. **Non-Blocking UI**: Heavy computations won't freeze the browser
2. **Faster Processing**: Multi-core CPU utilization
3. **Progressive Loading**: Show partial results as data arrives
4. **Better UX**: Progress indicators remain smooth during processing
5. **Scalability**: Can handle 1M+ row datasets

## Risks and Mitigations

### Risk 1: Worker Overhead
**Impact**: Creating/destroying workers has overhead
**Mitigation**: Use persistent worker pool, reuse workers

### Risk 2: Memory Doubling
**Impact**: Data exists in both main thread and worker
**Mitigation**: Use Transferable objects when possible, process in chunks

### Risk 3: Complex Debugging
**Impact**: Workers are harder to debug
**Mitigation**:
- Comprehensive logging
- Fallback to main thread mode for debugging
- Feature flag to enable/disable workers

### Risk 4: Browser Compatibility
**Impact**: Older browsers may not support workers well
**Mitigation**: Feature detection, graceful fallback

## Alternative: Streaming with TransformStreams

For future consideration - use Streams API:

```typescript
const stream = new ReadableStream({
  async start(controller) {
    for (let i = 0; i < pageCount; i++) {
      const page = await dataReader.getPageAsync(i);
      controller.enqueue(page);
    }
    controller.close();
  }
});

const processedStream = stream.pipeThrough(
  new TransformStream({
    transform(chunk, controller) {
      // Process in worker
      const processed = await workerPool.process(chunk);
      controller.enqueue(processed);
    }
  })
);

for await (const batch of processedStream) {
  updateUI(batch);
}
```

## Next Steps

1. Implement basic worker infrastructure
2. Test with sample dataset
3. Measure actual performance improvements
4. Iterate based on results
5. Roll out to production

## References

- [Web Workers MDN](https://developer.mozilla.org/en-US/docs/Web/API/Web_Workers_API)
- [Using Web Workers](https://developer.mozilla.org/en-US/docs/Web/API/Web_Workers_API/Using_web_workers)
- [Transferable Objects](https://developer.mozilla.org/en-US/docs/Web/API/Web_Workers_API/Transferable_objects)
- [Vite Worker Support](https://vitejs.dev/guide/features.html#web-workers)
