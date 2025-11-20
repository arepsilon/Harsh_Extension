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
            console.log('Fetching data with getUnderlyingTableDataReaderAsync...');

            // @ts-ignore - Always use getUnderlyingTableDataReaderAsync for complete data
            const dataReader = await worksheet.getUnderlyingTableDataReaderAsync(
                10000,  // pageRowCount - number of rows per page
                {
                    ignoreSelection: true,
                    includeAllColumns: true
                }
            );

            console.log('Data reader created:', {
                pageCount: dataReader.pageCount,
                columnCount: dataReader.columns?.length,
                totalRowCount: dataReader.totalRowCount
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
            const formattedData: TableauDataTable = {
                columns: dataReader.columns.map((col: any, idx: number) => ({
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
            console.error('Error fetching underlying data with getUnderlyingTableDataReaderAsync:', error);
            console.error('Error stack:', (error as Error).stack);
            // Don't use fallback - let the error surface so we can fix the real issue
            alert('Failed to fetch data. Please check console for details.');
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
