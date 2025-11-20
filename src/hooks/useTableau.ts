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
            // Try using getUnderlyingTableDataReaderAsync first
            console.log('Attempting to fetch data with getUnderlyingTableDataReaderAsync...');

            // @ts-ignore
            if (typeof worksheet.getUnderlyingTableDataReaderAsync === 'function') {
                // @ts-ignore
                const dataReader = await worksheet.getUnderlyingTableDataReaderAsync(10000);

                console.log('Data reader created:', {
                    pageCount: dataReader.pageCount,
                    columnCount: dataReader.columns?.length
                });

                // Read all pages of data
                let allData: any[] = [];

                for (let i = 0; i < dataReader.pageCount; i++) {
                    const page = await dataReader.getPageAsync(i);
                    console.log(`Page ${i} fetched:`, page.data?.length, 'rows');
                    allData = allData.concat(page.data);
                }

                console.log('Total rows fetched:', allData.length);

                // Release the data reader
                await dataReader.releaseAsync();

                // Format data to match TableauDataTable interface
                // Columns from dataReader don't have an index property, so we assign them
                const formattedData: TableauDataTable = {
                    columns: dataReader.columns.map((col: any, idx: number) => ({
                        fieldName: col.fieldName,
                        dataType: col.dataType,
                        index: idx  // Use array index since dataReader doesn't provide it
                    })),
                    data: allData,
                    totalRowCount: allData.length
                };

                console.log('Formatted data successfully:', {
                    columnCount: formattedData.columns.length,
                    rowCount: formattedData.totalRowCount
                });

                setSummaryData(formattedData);
            } else {
                // Fallback to getUnderlyingDataAsync
                console.log('getUnderlyingTableDataReaderAsync not available, using fallback...');
                const data = await worksheet.getUnderlyingDataAsync({
                    maxRows: 10000,
                    ignoreSelection: true,
                    includeAllColumns: true
                });

                console.log('Fallback data fetched:', {
                    columnCount: data.columns?.length,
                    rowCount: data.data?.length
                });

                setSummaryData(data);
            }
        } catch (error) {
            console.error('Error fetching underlying data:', error);
            console.error('Error stack:', (error as Error).stack);

            // Try fallback method on error
            try {
                console.log('Attempting fallback method...');
                const data = await worksheet.getUnderlyingDataAsync({
                    maxRows: 10000,
                    ignoreSelection: true,
                    includeAllColumns: true
                });
                console.log('Fallback successful:', data.data?.length, 'rows');
                setSummaryData(data);
            } catch (fallbackError) {
                console.error('Fallback also failed:', fallbackError);
            }
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
