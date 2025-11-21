import { useState, useEffect } from 'react';
import type { TableauWorksheet, TableauDataTable } from '../types';

// Performance configuration
const MAX_ROWS_DEFAULT = 500000; // 500K rows default limit
const MAX_ROWS_WARNING = 100000; // Show warning above 100K
const PAGE_SIZE = 10000; // Process in 10K chunks

export const useTableau = () => {
    const [isInitialized, setIsInitialized] = useState(false);
    const [worksheets, setWorksheets] = useState<TableauWorksheet[]>([]);
    const [selectedWorksheet, setSelectedWorksheet] = useState<TableauWorksheet | null>(null);
    const [summaryData, setSummaryData] = useState<TableauDataTable | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [loadingProgress, setLoadingProgress] = useState({ current: 0, total: 0 });
    const [maxRows, setMaxRows] = useState(MAX_ROWS_DEFAULT);

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

    const fetchSummaryData = async (worksheet: TableauWorksheet, useSampling: boolean = false) => {
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
                PAGE_SIZE // page size
            );

            const totalRowCount = dataReader.totalRowCount;
            console.log('Data reader created:', {
                pageCount: dataReader.pageCount,
                columnCount: dataReader.columns?.length,
                totalRowCount: totalRowCount
            });

            // Check if dataset is too large and warn user
            if (totalRowCount > MAX_ROWS_WARNING && !useSampling) {
                const proceed = confirm(
                    `⚠️ Large Dataset Warning\n\n` +
                    `This dataset contains ${totalRowCount.toLocaleString()} rows.\n\n` +
                    `Loading more than ${MAX_ROWS_WARNING.toLocaleString()} rows may cause performance issues.\n\n` +
                    `Options:\n` +
                    `• Click OK to load first ${maxRows.toLocaleString()} rows\n` +
                    `• Click Cancel to abort\n\n` +
                    `Tip: Consider using Tableau's summary data or filters to reduce row count.`
                );

                if (!proceed) {
                    await dataReader.releaseAsync();
                    setIsLoading(false);
                    return;
                }
            }

            // Calculate how many rows to actually load
            const rowsToLoad = useSampling
                ? Math.min(50000, totalRowCount) // Sample mode: max 50K
                : Math.min(maxRows, totalRowCount); // Normal mode: respect limit

            const pagesToLoad = Math.ceil(rowsToLoad / PAGE_SIZE);

            console.log(`Loading ${rowsToLoad.toLocaleString()} of ${totalRowCount.toLocaleString()} rows (${pagesToLoad} pages)...`);

            // Read pages of data with progress tracking
            let allData: any[] = [];
            let columns: any[] = [];

            // Try to get columns from dataReader if available
            if (dataReader.columns) {
                columns = dataReader.columns;
            }

            // Process pages in chunks to avoid blocking UI
            for (let i = 0; i < Math.min(pagesToLoad, dataReader.pageCount); i++) {
                const page = await dataReader.getPageAsync(i);
                console.log(`Page ${i + 1}/${pagesToLoad} fetched:`, page.data?.length, 'rows');

                // If columns not found yet, get from first page
                if (columns.length === 0 && page.columns) {
                    columns = page.columns;
                }

                // Add data, respecting row limit
                const rowsNeeded = rowsToLoad - allData.length;
                const rowsToAdd = page.data.slice(0, rowsNeeded);
                allData = allData.concat(rowsToAdd);

                // Update progress
                setLoadingProgress({
                    current: allData.length,
                    total: rowsToLoad
                });

                // Stop if we've reached the limit
                if (allData.length >= rowsToLoad) {
                    break;
                }

                // Small delay to allow UI updates (every 5 pages)
                if (i % 5 === 0 && i > 0) {
                    await new Promise(resolve => setTimeout(resolve, 0));
                }
            }

            console.log(`Total rows loaded: ${allData.length.toLocaleString()} of ${totalRowCount.toLocaleString()}`);

            // Show info if data was limited
            if (allData.length < totalRowCount) {
                console.warn(`⚠️ Data limited: Loaded ${allData.length.toLocaleString()} of ${totalRowCount.toLocaleString()} rows for performance.`);
            }

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
                totalRowCount: allData.length,
                // Add metadata about data limiting
                isLimited: allData.length < totalRowCount,
                actualTotalRowCount: totalRowCount
            };

            console.log('Formatted data successfully:', {
                columnCount: formattedData.columns.length,
                rowCount: formattedData.totalRowCount,
                actualTotal: totalRowCount,
                limited: formattedData.isLimited,
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
        maxRows,
        setMaxRows,
    };
};
