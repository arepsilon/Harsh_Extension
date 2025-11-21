import { useState, useEffect } from 'react';
import type { TableauWorksheet, TableauDataTable } from '../types';

export const useTableau = () => {
    const [isInitialized, setIsInitialized] = useState(false);
    const [worksheets, setWorksheets] = useState<TableauWorksheet[]>([]);
    const [selectedWorksheet, setSelectedWorksheet] = useState<TableauWorksheet | null>(null);
    const [summaryData, setSummaryData] = useState<TableauDataTable | null>(null);
    const [isLoading, setIsLoading] = useState(false);

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
                10000 // page size
            );

            console.log('Data reader created:', {
                pageCount: dataReader.pageCount,
                columnCount: dataReader.columns?.length,
                totalRowCount: dataReader.totalRowCount
            });

            // Read all pages of data
            let allData: any[] = [];
            let columns: any[] = [];

            // Try to get columns from dataReader if available
            if (dataReader.columns) {
                columns = dataReader.columns;
            }

            for (let i = 0; i < dataReader.pageCount; i++) {
                const page = await dataReader.getPageAsync(i);
                console.log(`Page ${i} fetched:`, page.data?.length, 'rows');

                // If columns not found yet, get from first page
                if (columns.length === 0 && page.columns) {
                    columns = page.columns;
                }

                allData = allData.concat(page.data);
            }

            console.log('Total rows fetched:', allData.length);

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
    };
};
