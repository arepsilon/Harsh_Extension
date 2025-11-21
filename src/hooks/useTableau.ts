import { useState, useEffect } from 'react';
import type { TableauWorksheet, TableauDataTable } from '../types';

// Performance configuration
const PAGE_SIZE = 10000; // Process in 10K chunks
const PARALLEL_FETCHES = 5; // Number of pages to fetch concurrently

export const useTableau = () => {
    const [isInitialized, setIsInitialized] = useState(false);
    const [worksheets, setWorksheets] = useState<TableauWorksheet[]>([]);
    const [selectedWorksheet, setSelectedWorksheet] = useState<TableauWorksheet | null>(null);
    const [summaryData, setSummaryData] = useState<TableauDataTable | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [loadingProgress, setLoadingProgress] = useState({ current: 0, total: 0 });

    useEffect(() => {
        const initTableau = async () => {
            try {
                // @ts-ignore
                if (window.tableau) {
                    // @ts-ignore
                    await window.tableau.extensions.initializeAsync();
                    setIsInitialized(true);

                    // @ts-ignore
                    const dashboard = window.tableau.extensions.dashboardContent.dashboard;
                    setWorksheets(dashboard.worksheets);
                }
            } catch (error) {
                console.error('Error initializing Tableau Extension:', error);
            }
        };

        initTableau();
    }, []);

    const fetchSummaryData = async (worksheet: TableauWorksheet) => {
        setIsLoading(true);
        setLoadingProgress({ current: 0, total: 0 });

        try {
            console.log('Fetching data sources...');
            const dataSources = await worksheet.getDataSourcesAsync();
            const dataSource = dataSources[0];

            if (!dataSource) {
                throw new Error("No data source found for this worksheet.");
            }

            console.log('Fetching logical tables for data source:', dataSource.name);
            const logicalTables = await dataSource.getLogicalTablesAsync();
            const logicalTable = logicalTables[0];

            if (!logicalTable) {
                throw new Error("No logical table found in data source.");
            }

            console.log('Fetching data reader for logical table:', logicalTable.caption);

            // Use the reader for complete data access
            const dataReader = await dataSource.getLogicalTableDataReaderAsync(
                logicalTable.id,
                PAGE_SIZE
            );

            const totalRowCount = dataReader.totalRowCount;
            console.log('Data reader created:', {
                pageCount: dataReader.pageCount,
                columnCount: dataReader.columns?.length,
                totalRowCount: totalRowCount
            });

            // Read all pages of data with PARALLEL fetching for better performance
            let allData: any[] = [];
            let columns: any[] = [];

            // Try to get columns from dataReader if available
            if (dataReader.columns) {
                columns = dataReader.columns;
            }

            const startTime = performance.now();

            // Fetch pages in parallel batches
            for (let batch = 0; batch < dataReader.pageCount; batch += PARALLEL_FETCHES) {
                const batchEnd = Math.min(batch + PARALLEL_FETCHES, dataReader.pageCount);
                const pagePromises: Promise<any>[] = [];

                // Create promises for all pages in this batch
                for (let i = batch; i < batchEnd; i++) {
                    pagePromises.push(dataReader.getPageAsync(i));
                }

                // Fetch all pages in batch concurrently
                const pages = await Promise.all(pagePromises);

                console.log(
                    `Batch ${Math.floor(batch / PARALLEL_FETCHES) + 1} fetched: ` +
                    `pages ${batch + 1}-${batchEnd} (${pages.length} pages, ` +
                    `${pages.reduce((sum, p) => sum + (p.data?.length || 0), 0)} rows)`
                );

                // Process pages in batch
                for (const page of pages) {
                    // If columns not found yet, get from first page
                    if (columns.length === 0 && page.columns) {
                        columns = page.columns;
                    }

                    allData = allData.concat(page.data);
                }

                // Update progress
                setLoadingProgress({
                    current: allData.length,
                    total: totalRowCount
                });

                // Small delay to allow UI updates
                await new Promise(resolve => setTimeout(resolve, 0));
            }

            const fetchTime = ((performance.now() - startTime) / 1000).toFixed(2);
            console.log(
                `Total rows fetched: ${allData.length.toLocaleString()} in ${fetchTime}s ` +
                `(${(allData.length / parseFloat(fetchTime)).toFixed(0)} rows/sec)`
            );

            // Release the data reader
            await dataReader.releaseAsync();

            if (columns.length === 0) {
                throw new Error("Could not determine columns from data source.");
            }

            // Format data to match TableauDataTable interface
            const formattedData: TableauDataTable = {
                columns: columns.map((col: any, idx: number) => ({
                    fieldName: col.fieldName,
                    dataType: col.dataType,
                    index: idx
                })),
                data: allData,
                totalRowCount: allData.length
            };

            console.log('Formatted data successfully:', {
                columnCount: formattedData.columns.length,
                rowCount: formattedData.totalRowCount,
                columns: formattedData.columns.map(c => c.fieldName)
            });

            setSummaryData(formattedData);
        } catch (error) {
            console.error('Error fetching data from logical table:', error);
            // @ts-ignore
            alert(`Failed to fetch data: ${error.message || String(error)}`);
        } finally {
            setIsLoading(false);
            setLoadingProgress({ current: 0, total: 0 });
        }
    };

    return {
        isInitialized,
        worksheets,
        selectedWorksheet,
        setSelectedWorksheet,
        summaryData,
        fetchSummaryData,
        isLoading,
        loadingProgress,
    };
};
