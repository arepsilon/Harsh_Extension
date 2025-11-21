/**
 * XML Parser Service
 * Parses Tableau workbook XML to extract worksheet configuration
 */

import { XMLParser } from 'fast-xml-parser';
import { WorksheetInfo, WorkbookMetadata, ValueFieldInfo, CalculatedFieldInfo } from '../types/vizql.types';

export class XMLParserService {
    private static instance: XMLParserService;
    private parser: XMLParser;

    private constructor() {
        this.parser = new XMLParser({
            ignoreAttributes: false,
            attributeNamePrefix: '@_',
            allowBooleanAttributes: true,
            parseAttributeValue: true
        });
    }

    public static getInstance(): XMLParserService {
        if (!XMLParserService.instance) {
            XMLParserService.instance = new XMLParserService();
        }
        return XMLParserService.instance;
    }

    /**
     * Parse workbook XML and extract all worksheet configurations
     */
    public parseWorkbook(xmlContent: string): WorkbookMetadata {
        try {
            console.log('Parsing workbook XML...');

            const parsed = this.parser.parse(xmlContent);

            // Extract datasource LUID
            const datasources = this.extractArray(parsed.workbook?.datasources?.datasource);
            const datasourceLuid = datasources[0]?.['@_name'] || datasources[0]?.['@_caption'] || 'unknown';

            // Extract all worksheets
            const worksheets: Record<string, WorksheetInfo> = {};
            const worksheetNodes = this.extractArray(parsed.workbook?.worksheets?.worksheet);

            for (const ws of worksheetNodes) {
                const worksheetName = ws['@_name'];
                if (!worksheetName) continue;

                const worksheetInfo = this.parseWorksheet(ws, parsed.workbook);
                worksheets[worksheetName] = worksheetInfo;
            }

            // Extract all datasource fields/columns
            const datasourceFields = this.extractDatasourceFields(datasources[0]);

            console.log(`✓ Parsed ${Object.keys(worksheets).length} worksheets`);
            console.log(`✓ Extracted ${datasourceFields.length} datasource fields`);

            return {
                datasourceLuid,
                worksheets,
                datasourceFields
            };
        } catch (error: any) {
            console.error('XML parsing failed:', error.message);
            throw new Error(`Failed to parse workbook XML: ${error.message}`);
        }
    }

    /**
     * Parse individual worksheet configuration
     */
    private parseWorksheet(worksheetNode: any, workbookNode: any): WorksheetInfo {
        const name = worksheetNode['@_name'];

        // Extract table configuration
        const table = worksheetNode.table || {};
        const view = table.view || {};
        const datasourceView = view.datasource || {};
        const cols = this.extractArray(datasourceView.column);

        // Categorize columns
        const rows: string[] = [];
        const columns: string[] = [];
        const values: ValueFieldInfo[] = [];

        for (const col of cols) {
            const fieldName = this.extractFieldName(col);
            const pivotType = col['@_pivot'];

            if (pivotType === 'rows') {
                rows.push(fieldName);
            } else if (pivotType === 'cols') {
                columns.push(fieldName);
            } else if (col['@_role'] === 'measure') {
                // This is a value field
                const aggregation = this.extractAggregation(col);
                values.push({
                    field: fieldName,
                    aggregation
                });
            }
        }

        // Extract calculated fields
        const calculatedFields = this.extractCalculatedFields(workbookNode);

        // Extract filters
        const filters = this.extractFilters(datasourceView);

        return {
            name,
            rows,
            columns,
            values,
            calculatedFields,
            filters
        };
    }

    /**
     * Extract field name from column definition
     */
    private extractFieldName(column: any): string {
        const name = column['@_name'] || column['@_caption'];

        // Remove Tableau field markers like [Measure Names] or [Sum(Sales)]
        if (typeof name === 'string') {
            // Remove brackets
            let fieldName = name.replace(/^\[|\]$/g, '');

            // Remove aggregation prefix if present
            fieldName = fieldName.replace(/^(SUM|AVG|MIN|MAX|COUNT|COUNTD)\(/i, '').replace(/\)$/, '');

            return fieldName;
        }

        return name;
    }

    /**
     * Extract aggregation function from column
     */
    private extractAggregation(column: any): any {
        const name = column['@_name'] || '';

        // Check for aggregation in name
        if (name.match(/^SUM\(/i)) return 'SUM';
        if (name.match(/^AVG\(/i)) return 'AVG';
        if (name.match(/^MIN\(/i)) return 'MIN';
        if (name.match(/^MAX\(/i)) return 'MAX';
        if (name.match(/^COUNT\(/i)) return 'COUNT';
        if (name.match(/^COUNTD\(/i)) return 'COUNTD';

        // Default aggregation
        return column['@_aggregation'] || 'SUM';
    }

    /**
     * Extract calculated fields from workbook
     */
    private extractCalculatedFields(workbookNode: any): CalculatedFieldInfo[] {
        const calculatedFields: CalculatedFieldInfo[] = [];

        try {
            const datasources = this.extractArray(workbookNode.datasources?.datasource);

            for (const ds of datasources) {
                const columns = this.extractArray(ds.column);

                for (const col of columns) {
                    // Check if this is a calculated field
                    if (col.calculation) {
                        const calc = col.calculation;
                        calculatedFields.push({
                            name: col['@_name'] || col['@_caption'],
                            formula: calc['@_formula'] || calc,
                            dataType: col['@_datatype'] || 'string'
                        });
                    }
                }
            }
        } catch (error) {
            console.warn('Could not extract calculated fields:', error);
        }

        return calculatedFields;
    }

    /**
     * Extract filters from datasource view
     */
    private extractFilters(datasourceView: any): any[] {
        const filters: any[] = [];

        try {
            const filterNodes = this.extractArray(datasourceView.filter);

            for (const filter of filterNodes) {
                filters.push({
                    field: filter['@_column'],
                    type: filter['@_class'],
                    values: this.extractArray(filter.groupfilter?.groupfilter || [])
                });
            }
        } catch (error) {
            console.warn('Could not extract filters:', error);
        }

        return filters;
    }

    /**
     * Extract all fields from datasource
     */
    private extractDatasourceFields(datasourceNode: any): any[] {
        const fields: any[] = [];

        try {
            const columns = this.extractArray(datasourceNode?.column);

            for (const col of columns) {
                const fieldName = col['@_caption'] || col['@_name'];
                if (!fieldName) continue;

                fields.push({
                    fieldName,
                    dataType: col['@_datatype'] || 'string',
                    role: col['@_role'] || 'dimension',
                    type: col['@_type'] || 'nominal',
                    isCalculated: !!col.calculation
                });
            }
        } catch (error) {
            console.warn('Could not extract datasource fields:', error);
        }

        return fields;
    }

    /**
     * Utility: Ensure value is an array
     */
    private extractArray(value: any): any[] {
        if (!value) return [];
        return Array.isArray(value) ? value : [value];
    }
}

export default XMLParserService.getInstance();
