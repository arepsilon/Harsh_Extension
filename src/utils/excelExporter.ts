import ExcelJS from 'exceljs';
import { saveAs } from 'file-saver';
import type { PivotNode, PivotConfig } from '../types';

export const exportToExcel = async (
    pivotTree: PivotNode | null,
    config: PivotConfig,
    showColumnGrandTotals: boolean,
    columnGrandTotalsPosition: 'top' | 'bottom',
    showRowGrandTotals: boolean,
    rowGrandTotalsPosition: 'left' | 'right',
    worksheetName: string
) => {
    if (!pivotTree) return;

    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Pivot Table');

    // --- 1. Prepare Headers ---
    const allKeys = Object.keys(pivotTree.values)
        .filter(k => !k.startsWith('__grand_total__'))
        .sort();

    const totalLevels = config.columns.length + 1; // +1 for Value headers
    const headerRows: (string | null)[][] = Array(totalLevels).fill(null).map(() => []);

    // Row Dimension Headers (Top Left)
    const rowDimCount = Math.max(1, config.rows.length);

    // Add Row Headers to the first row of headers
    for (let i = 0; i < rowDimCount; i++) {
        headerRows[0].push(config.rows[i] || 'Rows');
        // Fill other levels with null/empty for now, will merge later
        for (let j = 1; j < totalLevels; j++) {
            headerRows[j].push(null);
        }
    }

    // Grand Total Header (Left)
    if (showRowGrandTotals && rowGrandTotalsPosition === 'left') {
        config.values.forEach(() => {
            headerRows[0].push('Grand Total');
            for (let j = 1; j < totalLevels; j++) {
                headerRows[j].push(null);
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
                headerRows[level].push(parts[level] || '');
            }
        });
    }

    // Grand Total Header (Right)
    if (showRowGrandTotals && rowGrandTotalsPosition === 'right') {
        config.values.forEach(() => {
            headerRows[0].push('Grand Total');
            for (let j = 1; j < totalLevels; j++) {
                headerRows[j].push(null);
            }
        });
    }

    // Write Headers to Worksheet
    headerRows.forEach(row => {
        worksheet.addRow(row);
    });

    // --- 2. Merge Headers ---
    // Merge Row Dimension Headers vertically
    for (let c = 1; c <= rowDimCount; c++) {
        worksheet.mergeCells(1, c, totalLevels, c);
    }

    // Merge Column Headers horizontally
    // This is complex, simplified approach:
    // Iterate through columns starting after row dims
    const startCol = rowDimCount + 1;
    const endCol = worksheet.columnCount;

    for (let r = 1; r <= totalLevels; r++) {
        let mergeStart = startCol;
        let currentVal = worksheet.getCell(r, startCol).value;

        for (let c = startCol + 1; c <= endCol; c++) {
            const val = worksheet.getCell(r, c).value;
            const prevRowVal = r > 1 ? worksheet.getCell(r - 1, c).value : null;
            const prevRowMergeStartVal = r > 1 ? worksheet.getCell(r - 1, mergeStart).value : null;

            // Merge if value is same AND parent is same (simplified check)
            const parentsMatch = r === 1 || (prevRowVal === prevRowMergeStartVal);

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
        // Merge last group
        if (endCol > mergeStart) {
            worksheet.mergeCells(r, mergeStart, r, endCol);
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
                        rowData.push(child.values[gtKey] || 0);
                    });
                }

                // Data Cells
                allKeys.forEach(colKey => {
                    rowData.push(child.values[colKey] || 0);
                });

                // Row Grand Total (Right)
                if (showRowGrandTotals && rowGrandTotalsPosition === 'right') {
                    config.values.forEach(v => {
                        const gtKey = config.columns.length > 0 ? `__grand_total__::${v.field}` : v.field;
                        rowData.push(child.values[gtKey] || 0);
                    });
                }

                worksheet.addRow(rowData);
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
            config.values.forEach(() => gtRow.push(''));
        }

        allKeys.forEach(colKey => {
            gtRow.push(pivotTree.values[colKey] || 0);
        });

        // Right GT
        if (showRowGrandTotals && rowGrandTotalsPosition === 'right') {
            config.values.forEach(v => {
                const gtKey = config.columns.length > 0 ? `__grand_total__::${v.field}` : v.field;
                gtRow.push(pivotTree.values[gtKey] || 0);
            });
        }
        const row = worksheet.addRow(gtRow);
        row.font = { bold: true };
    }

    renderRows(pivotTree);

    // Column Grand Totals (Bottom)
    if (showColumnGrandTotals && columnGrandTotalsPosition === 'bottom') {
        const gtRow = Array(rowDimCount).fill('Grand Total');

        // Left GT
        if (showRowGrandTotals && rowGrandTotalsPosition === 'left') {
            config.values.forEach(() => gtRow.push(''));
        }

        allKeys.forEach(colKey => {
            gtRow.push(pivotTree.values[colKey] || 0);
        });

        // Right GT
        if (showRowGrandTotals && rowGrandTotalsPosition === 'right') {
            config.values.forEach(v => {
                const gtKey = config.columns.length > 0 ? `__grand_total__::${v.field}` : v.field;
                gtRow.push(pivotTree.values[gtKey] || 0);
            });
        }
        const row = worksheet.addRow(gtRow);
        row.font = { bold: true };
    }

    // --- 4. Styling ---
    worksheet.getRow(1).font = { bold: true };
    worksheet.columns.forEach(column => {
        column.width = 15;
    });

    // Generate Buffer
    const buffer = await workbook.xlsx.writeBuffer();
    const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    saveAs(blob, `${worksheetName}_Pivot.xlsx`);
};
