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
            // Use getUnderlyingTableDataReaderAsync for better data access
            // @ts-ignore
            const dataReader = await worksheet.getUnderlyingTableDataReaderAsync(10000, {
                ignoreSelection: true,
                includeAllColumns: true
            });

            // Read all pages of data
            let allData: any[] = [];
            let currentPage = 0;

            for (let i = 0; i < dataReader.pageCount; i++) {
                const page = await dataReader.getPageAsync(i);
                allData = allData.concat(page.data);
            }

            // Release the data reader
            await dataReader.releaseAsync();

            // Format data to match TableauDataTable interface
            const formattedData: TableauDataTable = {
                columns: dataReader.columns.map((col: any) => ({
                    fieldName: col.fieldName,
                    dataType: col.dataType,
                    index: col.index
                })),
                data: allData,
                totalRowCount: allData.length
            };

            setSummaryData(formattedData);
        } catch (error) {
            console.error('Error fetching underlying data:', error);
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
