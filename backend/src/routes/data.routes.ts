/**
 * API Routes for Data Service
 */

import { Router, Request, Response } from 'express';
import workbookService from '../services/workbook.service';
import xmlParserService from '../services/xml.parser.service';
import vizqlService from '../services/vizql.service';
import dataAggregatorService from '../services/data.aggregator.service';
import { PivotConfigRequest } from '../types/vizql.types';

const router = Router();

/**
 * Health check endpoint
 */
router.get('/health', (req: Request, res: Response) => {
    res.json({ status: 'ok', service: 'tableau-extension-backend' });
});

/**
 * Get workbook metadata
 * Downloads workbook, extracts XML, and parses worksheet configurations
 */
router.post('/workbook/metadata', async (req: Request, res: Response) => {
    try {
        const { workbookId } = req.body;

        if (!workbookId) {
            return res.status(400).json({ error: 'workbookId is required' });
        }

        console.log(`\n=== Fetching Workbook Metadata: ${workbookId} ===`);

        // Download and extract workbook XML
        const xmlContent = await workbookService.downloadAndExtract(workbookId);

        // Parse XML to get worksheet configurations
        const workbookMetadata = xmlParserService.parseWorkbook(xmlContent);

        res.json({
            success: true,
            data: workbookMetadata
        });
    } catch (error: any) {
        console.error('Error fetching workbook metadata:', error.message);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

/**
 * Get datasource metadata (fields, types, etc.)
 */
router.post('/datasource/metadata', async (req: Request, res: Response) => {
    try {
        const { datasourceLuid } = req.body;

        if (!datasourceLuid) {
            return res.status(400).json({ error: 'datasourceLuid is required' });
        }

        console.log(`\n=== Fetching Datasource Metadata: ${datasourceLuid} ===`);

        const metadata = await vizqlService.getMetadata(datasourceLuid);

        res.json({
            success: true,
            data: metadata
        });
    } catch (error: any) {
        console.error('Error fetching datasource metadata:', error.message);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

/**
 * Query pivot data with totals
 * Main endpoint that executes all necessary queries and aggregates results
 */
router.post('/query/pivot', async (req: Request, res: Response) => {
    try {
        const config: PivotConfigRequest = req.body;

        // Validate required fields
        if (!config.datasourceLuid) {
            return res.status(400).json({ error: 'datasourceLuid is required' });
        }
        if (!config.rows || !Array.isArray(config.rows)) {
            return res.status(400).json({ error: 'rows array is required' });
        }
        if (!config.columns || !Array.isArray(config.columns)) {
            return res.status(400).json({ error: 'columns array is required' });
        }
        if (!config.values || !Array.isArray(config.values)) {
            return res.status(400).json({ error: 'values array is required' });
        }

        console.log(`\n=== Querying Pivot Data ===`);
        console.log(`Worksheet: ${config.worksheetName}`);
        console.log(`Datasource: ${config.datasourceLuid}`);
        console.log(`Rows: ${config.rows.join(', ')}`);
        console.log(`Columns: ${config.columns.join(', ')}`);
        console.log(`Values: ${config.values.map(v => `${v.aggregation}(${v.field})`).join(', ')}`);

        // Execute queries (main data + totals)
        const queryResult = await vizqlService.queryPivotData(config);

        // Aggregate results
        const aggregatedData = dataAggregatorService.aggregateResults(queryResult);

        res.json({
            success: true,
            data: aggregatedData
        });
    } catch (error: any) {
        console.error('Error querying pivot data:', error.message);
        res.status(500).json({
            success: false,
            error: error.message,
            stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
        });
    }
});

/**
 * Execute custom VizQL query
 */
router.post('/query/custom', async (req: Request, res: Response) => {
    try {
        const { datasourceLuid, query, options } = req.body;

        if (!datasourceLuid) {
            return res.status(400).json({ error: 'datasourceLuid is required' });
        }
        if (!query) {
            return res.status(400).json({ error: 'query is required' });
        }

        console.log(`\n=== Executing Custom Query ===`);

        const result = await vizqlService.executeQuery(datasourceLuid, query, options);

        res.json({
            success: true,
            data: result
        });
    } catch (error: any) {
        console.error('Error executing custom query:', error.message);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

export default router;
