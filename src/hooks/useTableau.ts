import { useState, useEffect } from 'react';
import type { TableauWorksheet, TableauDataTable } from '../types';

// Backend API configuration
const BACKEND_API_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:3001/api';

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

    /**
     * Fetch data from backend instead of directly from Tableau
     * Backend handles: workbook download, XML parsing, VizQL query execution
     */
    const fetchSummaryData = async (worksheet: TableauWorksheet, pivotConfig?: any) => {
        setIsLoading(true);
        setLoadingProgress({ current: 0, total: 0 });

        try {
            console.log('Fetching data from backend API...');

            // Get datasource information (still needed for backend query)
            const dataSources = await worksheet.getDataSourcesAsync();
            const dataSource = dataSources[0];

            if (!dataSource) {
                throw new Error("No data source found for this worksheet.");
            }

            // Get workbook ID from current context
            // For now, use worksheet name as identifier
            // In production, this should be the actual workbook ID
            const workbookName = worksheet.name || 'unknown';

            // If pivot config is provided, use backend query endpoint
            if (pivotConfig) {
                return await fetchPivotDataFromBackend(
                    workbookName,
                    worksheet.name,
                    dataSource.name,
                    pivotConfig
                );
            }

            // Otherwise, fetch simple summary data
            console.log(`Fetching summary data for worksheet: ${worksheet.name}`);
            console.log('Note: Using backend VizQL Data Service for data fetching');

            // For now, return empty data structure
            // The actual pivot data will be fetched when user configures the pivot
            setSummaryData({
                columns: [],
                data: [],
                totalRowCount: 0
            });

        } catch (error) {
            console.error('Error fetching data:', error);
            // @ts-ignore
            alert(`Failed to fetch data: ${error.message || String(error)}`);
        } finally {
            setIsLoading(false);
            setLoadingProgress({ current: 0, total: 0 });
        }
    };

    /**
     * Fetch pivot data from backend API
     */
    const fetchPivotDataFromBackend = async (
        workbookId: string,
        worksheetName: string,
        datasourceLuid: string,
        config: any
    ) => {
        try {
            console.log('Calling backend API: /query/pivot');

            const response = await fetch(`${BACKEND_API_URL}/query/pivot`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    workbookId,
                    worksheetName,
                    datasourceLuid,
                    rows: config.rows || [],
                    columns: config.columns || [],
                    values: config.values || [],
                    filters: config.filters || [],
                    calculatedFields: config.calculatedFields || [],
                    showRowGrandTotals: config.showRowGrandTotals || false,
                    showColumnGrandTotals: config.showColumnGrandTotals || false,
                    showSubtotals: config.showSubtotals || false
                })
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || 'Backend query failed');
            }

            const result = await response.json();

            if (!result.success) {
                throw new Error(result.error || 'Query failed');
            }

            console.log(`✓ Received ${result.data.data.length} rows from backend`);

            // Convert backend response to TableauDataTable format
            const formattedData: TableauDataTable = {
                columns: result.data.metadata.fields.map((field: any, idx: number) => ({
                    fieldName: field.fieldCaption || field.fieldName,
                    dataType: field.dataType,
                    index: idx
                })),
                data: result.data.data,
                totalRowCount: result.data.metadata.rowCount
            };

            setSummaryData(formattedData);

            return {
                data: formattedData,
                totals: result.data.totals
            };

        } catch (error: any) {
            console.error('Backend query error:', error);
            throw error;
        }
    };

    /**
     * Get workbook metadata from backend
     */
    const getWorkbookMetadata = async (workbookId: string) => {
        try {
            console.log('Fetching workbook metadata from backend...');

            const response = await fetch(`${BACKEND_API_URL}/workbook/metadata`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ workbookId })
            });

            if (!response.ok) {
                throw new Error('Failed to fetch workbook metadata');
            }

            const result = await response.json();
            console.log('✓ Workbook metadata retrieved');

            return result.data;
        } catch (error: any) {
            console.error('Error fetching workbook metadata:', error);
            throw error;
        }
    };

    /**
     * Get datasource metadata from backend
     */
    const getDatasourceMetadata = async (datasourceLuid: string) => {
        try {
            console.log('Fetching datasource metadata from backend...');

            const response = await fetch(`${BACKEND_API_URL}/datasource/metadata`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ datasourceLuid })
            });

            if (!response.ok) {
                throw new Error('Failed to fetch datasource metadata');
            }

            const result = await response.json();
            console.log(`✓ Retrieved metadata for ${result.data.data.length} fields`);

            return result.data;
        } catch (error: any) {
            console.error('Error fetching datasource metadata:', error);
            throw error;
        }
    };

    return {
        isInitialized,
        worksheets,
        selectedWorksheet,
        setSelectedWorksheet,
        summaryData,
        fetchSummaryData,
        fetchPivotDataFromBackend,
        getWorkbookMetadata,
        getDatasourceMetadata,
        isLoading,
        loadingProgress,
    };
};
