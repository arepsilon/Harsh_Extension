import { useState } from 'react';
import type { TableauDataTable } from '../types';
import axios from 'axios';

// Backend API configuration
const backendUrl = import.meta.env.VITE_BACKEND_URL || 'http://localhost:3001/api';

export interface WorksheetConfiguration {
    rows: string[];
    columns: string[];
    values: Array<{ field: string; aggregation: string }>;
    calculatedFields: Array<{ name: string; formula: string; dataType: string }>;
    filters: any[];
}

export const useTableau = () => {
    const [summaryData, setSummaryData] = useState<TableauDataTable | null>(null);
    const [worksheetConfig, setWorksheetConfig] = useState<WorksheetConfiguration | null>(null);
    const [datasourceLuid, setDatasourceLuid] = useState<string>('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    /**
     * Fetch worksheet configuration and data from backend
     */
    const fetchWorksheetData = async (workbookId: string, datasourceLuidInput: string, worksheetName: string) => {
        setIsLoading(true);
        setError(null);

        try {
            console.log('Fetching worksheet configuration from backend...');

            // Step 1: Get worksheet configuration
            const response = await axios.post(`${backendUrl}/workbook/metadata`, {
                workbookId,
                datasourceLuid: datasourceLuidInput || undefined,
                worksheetName
            });

            if (!response.data.success) {
                throw new Error(response.data.error || 'Failed to fetch worksheet configuration');
            }

            const {
                datasourceLuid: finalDatasourceLuid,
                worksheetConfig: config,
                datasourceFields = []
            } = response.data.data;

            console.log('✓ Worksheet configuration loaded:', config);
            console.log(`✓ Loaded ${datasourceFields.length} datasource fields`);
            setWorksheetConfig(config);
            setDatasourceLuid(finalDatasourceLuid);

            // Convert datasource fields to TableauDataTable format
            setSummaryData({
                columns: datasourceFields.map((field: any, idx: number) => ({
                    fieldName: field.fieldName,
                    dataType: field.dataType || 'string',
                    index: idx
                })),
                data: [],
                totalRowCount: 0
            });

            return {
                config,
                datasourceLuid: finalDatasourceLuid
            };

        } catch (error: any) {
            console.error('Error fetching worksheet data:', error);
            setError(error.message || 'Failed to fetch worksheet data');
            throw error;
        } finally {
            setIsLoading(false);
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

            const response = await axios.post(`${backendUrl}/query/pivot`, {
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
            });

            if (!response.data.success) {
                throw new Error(response.data.error || 'Query failed');
            }

            console.log(`✓ Received ${response.data.data.data.length} rows from backend`);

            // Convert backend response to TableauDataTable format
            const formattedData: TableauDataTable = {
                columns: response.data.data.metadata.fields.map((field: any, idx: number) => ({
                    fieldName: field.fieldCaption || field.fieldName,
                    dataType: field.dataType,
                    index: idx
                })),
                data: response.data.data.data,
                totalRowCount: response.data.data.metadata.rowCount
            };

            setSummaryData(formattedData);

            return {
                data: formattedData,
                totals: response.data.data.totals
            };

        } catch (error: any) {
            console.error('Backend query error:', error);
            throw error;
        }
    };

    return {
        summaryData,
        worksheetConfig,
        datasourceLuid,
        fetchWorksheetData,
        fetchPivotDataFromBackend,
        isLoading,
        error,
    };
};
