import ExcelJS from 'exceljs';
import { saveAs } from 'file-saver';
import type { PivotNode, PivotConfig, HeaderRow, ConditionalFormat, FormatConfig, TableauDataTable } from '../types';

interface ExportOptions {
    pivotTree: PivotNode | null;
    config: PivotConfig;
    showColumnGrandTotals: boolean;
    columnGrandTotalsPosition: 'top' | 'bottom';
    showRowGrandTotals: boolean;
    rowGrandTotalsPosition: 'left' | 'right';
    worksheetName: string;
    headerRows?: HeaderRow[];
    conditionalFormats?: ConditionalFormat[];
    rowFormats?: Record<string, FormatConfig>;
    columnFormats?: Record<string, FormatConfig>;
    appliedFilters?: Record<string, { values: string[], isAll: boolean }>;
    summaryData?: TableauDataTable | null;
}

export const exportToExcel = async (options: ExportOptions) => {
    const {
        pivotTree,
        config,
        showColumnGrandTotals,
        columnGrandTotalsPosition,
        showRowGrandTotals,
        rowGrandTotalsPosition,
        worksheetName,
        headerRows = [],
        conditionalFormats = [],
        rowFormats = {},
        columnFormats = {},
        appliedFilters = {},
        summaryData = null
    } = options;

    if (!pivotTree) return;

    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Pivot Table');

    // Remove gridlines
    worksheet.views = [
        { showGridLines: false }
    ];

    // Helper function to format date
    const formatDate = (date: Date, format: string): string => {
        const pad = (num: number) => String(num).padStart(2, '0');

        const tokens: Record<string, string> = {
            'YYYY': String(date.getFullYear()),
            'YY': String(date.getFullYear()).slice(-2),
            'MM': pad(date.getMonth() + 1),
            'M': String(date.getMonth() + 1),
            'DD': pad(date.getDate()),
            'D': String(date.getDate()),
            'HH': pad(date.getHours()),
            'H': String(date.getHours()),
            'hh': pad(date.getHours() % 12 || 12),
            'h': String(date.getHours() % 12 || 12),
            'mm': pad(date.getMinutes()),
            'm': String(date.getMinutes()),
            'ss': pad(date.getSeconds()),
            's': String(date.getSeconds()),
            'A': date.getHours() >= 12 ? 'PM' : 'AM',
            'a': date.getHours() >= 12 ? 'pm' : 'am'
        };

        let result = format;
        Object.keys(tokens).sort((a, b) => b.length - a.length).forEach(token => {
            result = result.replace(new RegExp(token, 'g'), tokens[token]);
        });

        return result;
    };

    // Helper function to format value - returns the value and Excel number format
    const formatValue = (value: number | string | undefined, format?: FormatConfig): { value: any, numFmt?: string } => {
        if (value === undefined || value === null) return { value: '-' };

        if (!format) {
            if (typeof value === 'number') {
                return { value };
            }
            return { value: String(value) };
        }

        if (format.type === 'date' || format.type === 'datetime') {
            const dateValue = typeof value === 'string' ? new Date(value) : new Date(value);
            if (isNaN(dateValue.getTime())) return { value: String(value) };

            const formatStr = format.dateFormat || (format.type === 'date' ? 'MM/DD/YYYY' : 'MM/DD/YYYY HH:mm:ss');
            return { value: formatDate(dateValue, formatStr) };
        }

        const numValue = typeof value === 'number' ? value : Number(value);
        if (isNaN(numValue)) return { value: String(value) };

        if (format.type === 'percent') {
            const decimals = format.decimals ?? 2;
            const numFmt = `0.${'0'.repeat(decimals)}%`;
            return { value: numValue, numFmt };
        }

        if (format.type === 'currency') {
            const decimals = format.decimals ?? 2;
            const symbol = format.symbol || '$';
            const numFmt = `${symbol}#,##0.${'0'.repeat(decimals)}`;
            return { value: numValue, numFmt };
        }

        const decimals = format.decimals ?? 2;
        const numFmt = `#,##0.${'0'.repeat(decimals)}`;
        return { value: numValue, numFmt };
    };

    // Helper function to evaluate conditional format
    const evaluateConditionalFormat = (
        value: number | string | undefined,
        fieldName: string,
        compareValues?: Record<string, number>
    ): { fontColor?: string; backgroundColor?: string } => {
        if (value === undefined || value === null) return {};

        const fieldFormat = conditionalFormats.find(cf => cf.fieldName === fieldName);
        if (!fieldFormat || fieldFormat.rules.length === 0) return {};

        for (const rule of fieldFormat.rules) {
            let matches = false;

            if (rule.condition === 'compare_field' && rule.compareField && compareValues) {
                const compareValue = compareValues[rule.compareField];
                if (compareValue !== undefined) {
                    const numValue = typeof value === 'number' ? value : parseFloat(String(value));
                    if (!isNaN(numValue)) {
                        matches = numValue > compareValue;
                    }
                }
            } else {
                const ruleValue = rule.value;
                if (ruleValue !== undefined) {
                    if (typeof value === 'number' || !isNaN(Number(value))) {
                        const numValue = typeof value === 'number' ? value : parseFloat(String(value));
                        const numRuleValue = typeof ruleValue === 'number' ? ruleValue : parseFloat(String(ruleValue));

                        if (!isNaN(numValue) && !isNaN(numRuleValue)) {
                            switch (rule.condition) {
                                case 'gt': matches = numValue > numRuleValue; break;
                                case 'gte': matches = numValue >= numRuleValue; break;
                                case 'lt': matches = numValue < numRuleValue; break;
                                case 'lte': matches = numValue <= numRuleValue; break;
                                case 'eq': matches = numValue === numRuleValue; break;
                                case 'neq': matches = numValue !== numRuleValue; break;
                            }
                        }
                    } else {
                        const strValue = String(value).toLowerCase();
                        const strRuleValue = String(ruleValue).toLowerCase();

                        switch (rule.condition) {
                            case 'eq': matches = strValue === strRuleValue; break;
                            case 'neq': matches = strValue !== strRuleValue; break;
                            case 'contains': matches = strValue.includes(strRuleValue); break;
                            case 'not_contains': matches = !strValue.includes(strRuleValue); break;
                        }
                    }
                }
            }

            if (matches) {
                return {
                    fontColor: rule.fontColor,
                    backgroundColor: rule.backgroundColor
                };
            }
        }

        return {};
    };

    let currentRow = 1;

    // --- 0. Render Header Rows ---
    if (headerRows.length > 0) {
        headerRows.forEach(headerRow => {
            let content = '';
            let lineCount = 1;

            if (headerRow.type === 'title') {
                if (headerRow.titleField && summaryData) {
                    const colIndex = summaryData.columns.findIndex(c => c.fieldName === headerRow.titleField);
                    if (colIndex !== -1) {
                        const firstValue = summaryData.data[0]?.[colIndex];
                        content = firstValue?.formattedValue || firstValue?.value || '(No Data)';
                    } else {
                        content = '(Field Not Found)';
                    }
                } else {
                    content = headerRow.titleText || '';
                }
            } else if (headerRow.type === 'filters') {
                const selectedFilters = headerRow.selectedFilters || [];
                if (selectedFilters.length > 0) {
                    const filterLines = selectedFilters.map(filter => {
                        const filterData = appliedFilters[filter];
                        if (!filterData) {
                            return `${filter}: (No filter applied)`;
                        }
                        const displayValue = filterData.isAll ? 'All' : filterData.values.join(', ');
                        return `${filter}: ${displayValue}`;
                    });
                    content = filterLines.join('\n'); // Line separated
                    lineCount = filterLines.length;
                }
            } else if (headerRow.type === 'custom_field' && summaryData) {
                const colIndex = summaryData.columns.findIndex(c => c.fieldName === headerRow.customField);
                if (colIndex !== -1) {
                    const unique = new Set<string>();
                    summaryData.data.forEach(row => {
                        const val = row[colIndex];
                        unique.add(val?.formattedValue || String(val?.value || ''));
                    });
                    const firstValue = Array.from(unique)[0];
                    content = `${headerRow.customField}: ${firstValue || '(No Data)'}`;
                } else {
                    content = '(Field Not Found)';
                }
            } else if (headerRow.type === 'refresh_date') {
                const now = new Date();
                const formatted = formatDate(now, headerRow.refreshDateFormat || 'MM/DD/YYYY HH:mm:ss');
                content = `Data Refreshed: ${formatted}`;
            }

            if (content) {
                worksheet.addRow([content]);
                worksheet.mergeCells(currentRow, 1, currentRow, 10); // Merge across first 10 columns
                const cell = worksheet.getCell(currentRow, 1);

                if (headerRow.type === 'title') {
                    cell.font = { bold: true, size: 16 };
                } else {
                    cell.font = { size: 11 };
                }
                cell.fill = {
                    type: 'pattern',
                    pattern: 'solid',
                    fgColor: { argb: 'FFF3F4F6' }
                };
                cell.alignment = { wrapText: true, vertical: 'middle', horizontal: 'left' };
                cell.border = {
                    top: { style: 'thin', color: { argb: 'FFD1D5DB' } },
                    left: { style: 'thin', color: { argb: 'FFD1D5DB' } },
                    bottom: { style: 'thin', color: { argb: 'FFD1D5DB' } },
                    right: { style: 'thin', color: { argb: 'FFD1D5DB' } }
                };

                // Set dynamic row height based on number of lines
                const rowHeight = headerRow.type === 'title' ? 30 : (15 * lineCount);
                worksheet.getRow(currentRow).height = rowHeight;

                currentRow++;
            }
        });

        // Add a blank row after header rows
        if (headerRows.length > 0) {
            worksheet.addRow([]);
            currentRow++;
        }
    }

    // --- 1. Prepare Headers ---
    const allKeys = Object.keys(pivotTree.values)
        .filter(k => !k.startsWith('__grand_total__'))
        .sort();

    const totalLevels = config.columns.length + 1; // +1 for Value headers
    const pivotHeaderRows: (string | null)[][] = Array(totalLevels).fill(null).map(() => []);

    // Row Dimension Headers (Top Left)
    const rowDimCount = Math.max(1, config.rows.length);

    // Add Row Headers to the first row of headers
    for (let i = 0; i < rowDimCount; i++) {
        pivotHeaderRows[0].push(config.rows[i] || 'Rows');
        // Fill other levels with null/empty for now, will merge later
        for (let j = 1; j < totalLevels; j++) {
            pivotHeaderRows[j].push(null);
        }
    }

    // Grand Total Header (Left)
    if (showRowGrandTotals && rowGrandTotalsPosition === 'left') {
        config.values.forEach(() => {
            pivotHeaderRows[0].push('Grand Total');
            for (let j = 1; j < totalLevels; j++) {
                pivotHeaderRows[j].push(null);
            }
        });
    }

    // Column Headers
    if (allKeys.length > 0) {
        allKeys.forEach((key) => {
            const [colPart, valPart] = key.split('::');
            const colValues = colPart ? colPart.split(' | ') : [];
            const parts = [...colValues, valPart];

            for (let level = 0; level < totalLevels; level++) {
                pivotHeaderRows[level].push(parts[level] || '');
            }
        });
    }

    // Grand Total Header (Right)
    if (showRowGrandTotals && rowGrandTotalsPosition === 'right') {
        config.values.forEach(() => {
            pivotHeaderRows[0].push('Grand Total');
            for (let j = 1; j < totalLevels; j++) {
                pivotHeaderRows[j].push(null);
            }
        });
    }

    // Write Headers to Worksheet
    const headerStartRow = currentRow;
    pivotHeaderRows.forEach(row => {
        worksheet.addRow(row);
        currentRow++;
    });

    // --- 2. Merge Headers ---
    // Merge Row Dimension Headers vertically
    for (let c = 1; c <= rowDimCount; c++) {
        worksheet.mergeCells(headerStartRow, c, headerStartRow + totalLevels - 1, c);
    }

    // Merge Column Headers horizontally and apply formatting
    const startCol = rowDimCount + 1;
    const endCol = worksheet.columnCount;

    for (let r = headerStartRow; r < headerStartRow + totalLevels; r++) {
        let mergeStart = startCol;
        let currentVal = worksheet.getCell(r, startCol).value;

        for (let c = startCol + 1; c <= endCol; c++) {
            const val = worksheet.getCell(r, c).value;
            const prevRowVal = r > headerStartRow ? worksheet.getCell(r - 1, c).value : null;
            const prevRowMergeStartVal = r > headerStartRow ? worksheet.getCell(r - 1, mergeStart).value : null;

            const parentsMatch = r === headerStartRow || (prevRowVal === prevRowMergeStartVal);

            if (val === currentVal && parentsMatch) {
                // continue
            } else {
                if (c - 1 > mergeStart) {
                    worksheet.mergeCells(r, mergeStart, r, c - 1);
                }
                mergeStart = c;
                currentVal = val;
            }
        }
        if (endCol > mergeStart) {
            worksheet.mergeCells(r, mergeStart, r, endCol);
        }

        // Apply column formatting and conditional formatting to headers
        const levelIndex = r - headerStartRow;
        if (levelIndex < config.columns.length) {
            const columnField = config.columns[levelIndex];
            const columnFormat = columnFormats[columnField];

            for (let c = startCol; c <= endCol; c++) {
                const cell = worksheet.getCell(r, c);
                const cellValue = cell.value;

                // Apply formatting
                if (cellValue && columnFormat) {
                    const formatted = formatValue(cellValue as string, columnFormat);
                    cell.value = formatted.value;
                    if (formatted.numFmt) {
                        cell.numFmt = formatted.numFmt;
                    }
                }

                // Apply center alignment and borders to headers
                cell.alignment = { vertical: 'middle', horizontal: 'center' };
                cell.border = {
                    top: { style: 'thin', color: { argb: 'FFD1D5DB' } },
                    left: { style: 'thin', color: { argb: 'FFD1D5DB' } },
                    bottom: { style: 'thin', color: { argb: 'FFD1D5DB' } },
                    right: { style: 'thin', color: { argb: 'FFD1D5DB' } }
                };

                // Apply conditional formatting
                const conditionalStyle = evaluateConditionalFormat(cellValue as string, columnField);
                if (conditionalStyle.fontColor || conditionalStyle.backgroundColor) {
                    if (conditionalStyle.fontColor) {
                        cell.font = { ...cell.font, color: { argb: conditionalStyle.fontColor.replace('#', 'FF') } };
                    }
                    if (conditionalStyle.backgroundColor) {
                        cell.fill = {
                            type: 'pattern',
                            pattern: 'solid',
                            fgColor: { argb: conditionalStyle.backgroundColor.replace('#', 'FF') }
                        };
                    }
                }
            }
        } else {
            // Apply to value header row (last row)
            for (let c = startCol; c <= endCol; c++) {
                const cell = worksheet.getCell(r, c);
                cell.alignment = { vertical: 'middle', horizontal: 'center' };
                cell.border = {
                    top: { style: 'thin', color: { argb: 'FFD1D5DB' } },
                    left: { style: 'thin', color: { argb: 'FFD1D5DB' } },
                    bottom: { style: 'thin', color: { argb: 'FFD1D5DB' } },
                    right: { style: 'thin', color: { argb: 'FFD1D5DB' } }
                };
            }
        }
    }

    // Apply borders and center alignment to row dimension headers
    for (let c = 1; c <= rowDimCount; c++) {
        for (let r = headerStartRow; r < headerStartRow + totalLevels; r++) {
            const cell = worksheet.getCell(r, c);
            cell.alignment = { vertical: 'middle', horizontal: 'center' };
            cell.border = {
                top: { style: 'thin', color: { argb: 'FFD1D5DB' } },
                left: { style: 'thin', color: { argb: 'FFD1D5DB' } },
                bottom: { style: 'thin', color: { argb: 'FFD1D5DB' } },
                right: { style: 'thin', color: { argb: 'FFD1D5DB' } }
            };
        }
    }

    // --- 3. Render Data Rows ---
    const renderRows = (node: PivotNode, depth = 0, path: string[] = []) => {
        if (!node || !node.children) return;

        const sortedChildren = Array.from(node.children.entries()).sort((a, b) => a[0].localeCompare(b[0]));

        sortedChildren.forEach(([key, child]) => {
            const isLeaf = !child.children || child.children.size === 0;

            // For now, only render leaf rows (no subtotals in export yet to keep it simple)
            if (isLeaf) {
                const rowData: any[] = [];

                // Row Labels
                for (let i = 0; i < rowDimCount; i++) {
                    if (i < depth) rowData.push(path[i]);
                    else if (i === depth) rowData.push(key);
                    else rowData.push('');
                }

                // Row Grand Total (Left)
                if (showRowGrandTotals && rowGrandTotalsPosition === 'left') {
                    config.values.forEach(v => {
                        const gtKey = config.columns.length > 0 ? `__grand_total__::${v.field}` : v.field;
                        const value = child.values[gtKey] || 0;
                        const formatted = formatValue(value, v.format);
                        rowData.push(formatted.value);
                    });
                }

                // Data Cells
                allKeys.forEach(colKey => {
                    const val = child.values[colKey] || 0;
                    const valPart = colKey.split('::').pop();
                    const valueField = config.values.find(v => v.field === valPart);
                    const formatted = formatValue(val, valueField?.format);
                    rowData.push(formatted.value);
                });

                // Row Grand Total (Right)
                if (showRowGrandTotals && rowGrandTotalsPosition === 'right') {
                    config.values.forEach(v => {
                        const gtKey = config.columns.length > 0 ? `__grand_total__::${v.field}` : v.field;
                        const value = child.values[gtKey] || 0;
                        const formatted = formatValue(value, v.format);
                        rowData.push(formatted.value);
                    });
                }

                const excelRow = worksheet.addRow(rowData);
                const rowIndex = excelRow.number;

                // Apply row formatting and conditional formatting
                for (let i = 0; i < rowDimCount; i++) {
                    const cell = worksheet.getCell(rowIndex, i + 1);
                    const cellValue = cell.value;
                    const rowField = config.rows[i];

                    // Apply borders
                    cell.border = {
                        top: { style: 'thin', color: { argb: 'FFD1D5DB' } },
                        left: { style: 'thin', color: { argb: 'FFD1D5DB' } },
                        bottom: { style: 'thin', color: { argb: 'FFD1D5DB' } },
                        right: { style: 'thin', color: { argb: 'FFD1D5DB' } }
                    };

                    if (rowField) {
                        // Apply row formatting
                        const rowFormat = rowFormats[rowField];
                        if (cellValue && rowFormat) {
                            const formatted = formatValue(cellValue as string, rowFormat);
                            cell.value = formatted.value;
                            if (formatted.numFmt) {
                                cell.numFmt = formatted.numFmt;
                            }
                        }

                        // Apply conditional formatting
                        const conditionalStyle = evaluateConditionalFormat(cellValue as string, rowField);
                        if (conditionalStyle.fontColor || conditionalStyle.backgroundColor) {
                            if (conditionalStyle.fontColor) {
                                cell.font = { ...cell.font, color: { argb: conditionalStyle.fontColor.replace('#', 'FF') } };
                            }
                            if (conditionalStyle.backgroundColor) {
                                cell.fill = {
                                    type: 'pattern',
                                    pattern: 'solid',
                                    fgColor: { argb: conditionalStyle.backgroundColor.replace('#', 'FF') }
                                };
                            }
                        }
                    }
                }

                // Apply formatting to left grand total cells
                if (showRowGrandTotals && rowGrandTotalsPosition === 'left') {
                    let gtColIndex = rowDimCount + 1;
                    config.values.forEach(v => {
                        const cell = worksheet.getCell(rowIndex, gtColIndex);
                        const gtKey = config.columns.length > 0 ? `__grand_total__::${v.field}` : v.field;
                        const value = child.values[gtKey] || 0;
                        const formatted = formatValue(value, v.format);

                        if (formatted.numFmt) {
                            cell.numFmt = formatted.numFmt;
                        }
                        cell.alignment = { horizontal: 'right', vertical: 'middle' };
                        cell.border = {
                            top: { style: 'thin', color: { argb: 'FFD1D5DB' } },
                            left: { style: 'thin', color: { argb: 'FFD1D5DB' } },
                            bottom: { style: 'thin', color: { argb: 'FFD1D5DB' } },
                            right: { style: 'thin', color: { argb: 'FFD1D5DB' } }
                        };
                        gtColIndex++;
                    });
                }

                // Apply conditional formatting and number format to value cells
                let colIndex = rowDimCount + 1;

                if (showRowGrandTotals && rowGrandTotalsPosition === 'left') {
                    colIndex += config.values.length;
                }

                allKeys.forEach(colKey => {
                    const cell = worksheet.getCell(rowIndex, colIndex);
                    const val = child.values[colKey];
                    const valPart = colKey.split('::').pop();
                    const valueField = config.values.find(v => v.field === valPart);

                    // Apply borders and right alignment
                    cell.border = {
                        top: { style: 'thin', color: { argb: 'FFD1D5DB' } },
                        left: { style: 'thin', color: { argb: 'FFD1D5DB' } },
                        bottom: { style: 'thin', color: { argb: 'FFD1D5DB' } },
                        right: { style: 'thin', color: { argb: 'FFD1D5DB' } }
                    };
                    cell.alignment = { horizontal: 'right', vertical: 'middle' };

                    if (valueField) {
                        // Apply number format
                        const formatted = formatValue(val, valueField.format);
                        if (formatted.numFmt) {
                            cell.numFmt = formatted.numFmt;
                        }

                        // Build compare values for field comparison
                        const compareValues: Record<string, number> = {};
                        config.values.forEach(v => {
                            const vKey = colKey.split('::')[0] ? `${colKey.split('::')[0]}::${v.field}` : v.field;
                            const vVal = child.values[vKey];
                            if (vVal !== undefined) compareValues[v.field] = vVal;
                        });

                        const conditionalStyle = evaluateConditionalFormat(val, valueField.field, compareValues);
                        if (conditionalStyle.fontColor || conditionalStyle.backgroundColor) {
                            if (conditionalStyle.fontColor) {
                                cell.font = { ...cell.font, color: { argb: conditionalStyle.fontColor.replace('#', 'FF') } };
                            }
                            if (conditionalStyle.backgroundColor) {
                                cell.fill = {
                                    type: 'pattern',
                                    pattern: 'solid',
                                    fgColor: { argb: conditionalStyle.backgroundColor.replace('#', 'FF') }
                                };
                            }
                        }
                    }

                    colIndex++;
                });

                // Apply formatting to right grand total cells
                if (showRowGrandTotals && rowGrandTotalsPosition === 'right') {
                    config.values.forEach(v => {
                        const cell = worksheet.getCell(rowIndex, colIndex);
                        const gtKey = config.columns.length > 0 ? `__grand_total__::${v.field}` : v.field;
                        const value = child.values[gtKey] || 0;
                        const formatted = formatValue(value, v.format);

                        if (formatted.numFmt) {
                            cell.numFmt = formatted.numFmt;
                        }
                        cell.alignment = { horizontal: 'right', vertical: 'middle' };
                        cell.border = {
                            top: { style: 'thin', color: { argb: 'FFD1D5DB' } },
                            left: { style: 'thin', color: { argb: 'FFD1D5DB' } },
                            bottom: { style: 'thin', color: { argb: 'FFD1D5DB' } },
                            right: { style: 'thin', color: { argb: 'FFD1D5DB' } }
                        };
                        colIndex++;
                    });
                }
            } else {
                renderRows(child, depth + 1, [...path, key]);
            }
        });
    };

    // Column Grand Totals (Top)
    if (showColumnGrandTotals && columnGrandTotalsPosition === 'top') {
        const gtRow = Array(rowDimCount).fill('Grand Total');

        // Left GT
        if (showRowGrandTotals && rowGrandTotalsPosition === 'left') {
            config.values.forEach(v => {
                const gtKey = config.columns.length > 0 ? `__grand_total__::${v.field}` : v.field;
                const formatted = formatValue(pivotTree.values[gtKey] || 0, v.format);
                gtRow.push(formatted.value);
            });
        }

        allKeys.forEach(colKey => {
            const val = pivotTree.values[colKey] || 0;
            const valPart = colKey.split('::').pop();
            const valueField = config.values.find(v => v.field === valPart);
            const formatted = formatValue(val, valueField?.format);
            gtRow.push(formatted.value);
        });

        // Right GT
        if (showRowGrandTotals && rowGrandTotalsPosition === 'right') {
            config.values.forEach(v => {
                const gtKey = config.columns.length > 0 ? `__grand_total__::${v.field}` : v.field;
                const formatted = formatValue(pivotTree.values[gtKey] || 0, v.format);
                gtRow.push(formatted.value);
            });
        }
        const row = worksheet.addRow(gtRow);
        const rowIdx = row.number;
        row.font = { bold: true };

        // Apply borders and formatting to grand total row
        for (let c = 1; c <= rowDimCount; c++) {
            const cell = worksheet.getCell(rowIdx, c);
            cell.border = {
                top: { style: 'thin', color: { argb: 'FFD1D5DB' } },
                left: { style: 'thin', color: { argb: 'FFD1D5DB' } },
                bottom: { style: 'thin', color: { argb: 'FFD1D5DB' } },
                right: { style: 'thin', color: { argb: 'FFD1D5DB' } }
            };
        }

        // Apply to left GT cells
        let gtColIdx = rowDimCount + 1;
        if (showRowGrandTotals && rowGrandTotalsPosition === 'left') {
            config.values.forEach(v => {
                const cell = worksheet.getCell(rowIdx, gtColIdx);
                const gtKey = config.columns.length > 0 ? `__grand_total__::${v.field}` : v.field;
                const formatted = formatValue(pivotTree.values[gtKey] || 0, v.format);
                if (formatted.numFmt) {
                    cell.numFmt = formatted.numFmt;
                }
                cell.alignment = { horizontal: 'right', vertical: 'middle' };
                cell.border = {
                    top: { style: 'thin', color: { argb: 'FFD1D5DB' } },
                    left: { style: 'thin', color: { argb: 'FFD1D5DB' } },
                    bottom: { style: 'thin', color: { argb: 'FFD1D5DB' } },
                    right: { style: 'thin', color: { argb: 'FFD1D5DB' } }
                };
                gtColIdx++;
            });
        }

        // Apply to value cells
        allKeys.forEach(colKey => {
            const cell = worksheet.getCell(rowIdx, gtColIdx);
            const val = pivotTree.values[colKey] || 0;
            const valPart = colKey.split('::').pop();
            const valueField = config.values.find(v => v.field === valPart);
            const formatted = formatValue(val, valueField?.format);
            if (formatted.numFmt) {
                cell.numFmt = formatted.numFmt;
            }
            cell.alignment = { horizontal: 'right', vertical: 'middle' };
            cell.border = {
                top: { style: 'thin', color: { argb: 'FFD1D5DB' } },
                left: { style: 'thin', color: { argb: 'FFD1D5DB' } },
                bottom: { style: 'thin', color: { argb: 'FFD1D5DB' } },
                right: { style: 'thin', color: { argb: 'FFD1D5DB' } }
            };
            gtColIdx++;
        });

        // Apply to right GT cells
        if (showRowGrandTotals && rowGrandTotalsPosition === 'right') {
            config.values.forEach(v => {
                const cell = worksheet.getCell(rowIdx, gtColIdx);
                const gtKey = config.columns.length > 0 ? `__grand_total__::${v.field}` : v.field;
                const formatted = formatValue(pivotTree.values[gtKey] || 0, v.format);
                if (formatted.numFmt) {
                    cell.numFmt = formatted.numFmt;
                }
                cell.alignment = { horizontal: 'right', vertical: 'middle' };
                cell.border = {
                    top: { style: 'thin', color: { argb: 'FFD1D5DB' } },
                    left: { style: 'thin', color: { argb: 'FFD1D5DB' } },
                    bottom: { style: 'thin', color: { argb: 'FFD1D5DB' } },
                    right: { style: 'thin', color: { argb: 'FFD1D5DB' } }
                };
                gtColIdx++;
            });
        }
    }

    renderRows(pivotTree);

    // Column Grand Totals (Bottom)
    if (showColumnGrandTotals && columnGrandTotalsPosition === 'bottom') {
        const gtRow = Array(rowDimCount).fill('Grand Total');

        // Left GT
        if (showRowGrandTotals && rowGrandTotalsPosition === 'left') {
            config.values.forEach(v => {
                const gtKey = config.columns.length > 0 ? `__grand_total__::${v.field}` : v.field;
                const formatted = formatValue(pivotTree.values[gtKey] || 0, v.format);
                gtRow.push(formatted.value);
            });
        }

        allKeys.forEach(colKey => {
            const val = pivotTree.values[colKey] || 0;
            const valPart = colKey.split('::').pop();
            const valueField = config.values.find(v => v.field === valPart);
            const formatted = formatValue(val, valueField?.format);
            gtRow.push(formatted.value);
        });

        // Right GT
        if (showRowGrandTotals && rowGrandTotalsPosition === 'right') {
            config.values.forEach(v => {
                const gtKey = config.columns.length > 0 ? `__grand_total__::${v.field}` : v.field;
                const formatted = formatValue(pivotTree.values[gtKey] || 0, v.format);
                gtRow.push(formatted.value);
            });
        }
        const row = worksheet.addRow(gtRow);
        const rowIdx = row.number;
        row.font = { bold: true };

        // Apply borders and formatting to grand total row
        for (let c = 1; c <= rowDimCount; c++) {
            const cell = worksheet.getCell(rowIdx, c);
            cell.border = {
                top: { style: 'thin', color: { argb: 'FFD1D5DB' } },
                left: { style: 'thin', color: { argb: 'FFD1D5DB' } },
                bottom: { style: 'thin', color: { argb: 'FFD1D5DB' } },
                right: { style: 'thin', color: { argb: 'FFD1D5DB' } }
            };
        }

        // Apply to left GT cells
        let gtColIdx = rowDimCount + 1;
        if (showRowGrandTotals && rowGrandTotalsPosition === 'left') {
            config.values.forEach(v => {
                const cell = worksheet.getCell(rowIdx, gtColIdx);
                const gtKey = config.columns.length > 0 ? `__grand_total__::${v.field}` : v.field;
                const formatted = formatValue(pivotTree.values[gtKey] || 0, v.format);
                if (formatted.numFmt) {
                    cell.numFmt = formatted.numFmt;
                }
                cell.alignment = { horizontal: 'right', vertical: 'middle' };
                cell.border = {
                    top: { style: 'thin', color: { argb: 'FFD1D5DB' } },
                    left: { style: 'thin', color: { argb: 'FFD1D5DB' } },
                    bottom: { style: 'thin', color: { argb: 'FFD1D5DB' } },
                    right: { style: 'thin', color: { argb: 'FFD1D5DB' } }
                };
                gtColIdx++;
            });
        }

        // Apply to value cells
        allKeys.forEach(colKey => {
            const cell = worksheet.getCell(rowIdx, gtColIdx);
            const val = pivotTree.values[colKey] || 0;
            const valPart = colKey.split('::').pop();
            const valueField = config.values.find(v => v.field === valPart);
            const formatted = formatValue(val, valueField?.format);
            if (formatted.numFmt) {
                cell.numFmt = formatted.numFmt;
            }
            cell.alignment = { horizontal: 'right', vertical: 'middle' };
            cell.border = {
                top: { style: 'thin', color: { argb: 'FFD1D5DB' } },
                left: { style: 'thin', color: { argb: 'FFD1D5DB' } },
                bottom: { style: 'thin', color: { argb: 'FFD1D5DB' } },
                right: { style: 'thin', color: { argb: 'FFD1D5DB' } }
            };
            gtColIdx++;
        });

        // Apply to right GT cells
        if (showRowGrandTotals && rowGrandTotalsPosition === 'right') {
            config.values.forEach(v => {
                const cell = worksheet.getCell(rowIdx, gtColIdx);
                const gtKey = config.columns.length > 0 ? `__grand_total__::${v.field}` : v.field;
                const formatted = formatValue(pivotTree.values[gtKey] || 0, v.format);
                if (formatted.numFmt) {
                    cell.numFmt = formatted.numFmt;
                }
                cell.alignment = { horizontal: 'right', vertical: 'middle' };
                cell.border = {
                    top: { style: 'thin', color: { argb: 'FFD1D5DB' } },
                    left: { style: 'thin', color: { argb: 'FFD1D5DB' } },
                    bottom: { style: 'thin', color: { argb: 'FFD1D5DB' } },
                    right: { style: 'thin', color: { argb: 'FFD1D5DB' } }
                };
                gtColIdx++;
            });
        }
    }

    // --- 4. Styling ---
    // Style header row
    for (let r = headerStartRow; r < headerStartRow + totalLevels; r++) {
        worksheet.getRow(r).font = { bold: true };
    }
    worksheet.columns.forEach(column => {
        column.width = 15;
    });

    // Generate Buffer
    const buffer = await workbook.xlsx.writeBuffer();
    const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    saveAs(blob, `${worksheetName}_Pivot.xlsx`);
};
