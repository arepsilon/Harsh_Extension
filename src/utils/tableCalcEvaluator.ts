// Table Calculation Evaluator
// This utility applies table calculations (running total, percent of total, rank variants) to the pivot tree.

import type { PivotNode, PivotConfig, TableCalculation } from '../types';

interface FlatNode {
    node: PivotNode;
    path: Map<string, string>; // Dimension Name -> Value
    colKey: string; // Column key part (e.g., "2023" or "2023|Q1")
}

/**
 * Main entry point to apply a list of table calculations to the pivot tree.
 */
export function applyTableCalculations(
    root: PivotNode,
    calculations: TableCalculation[],
    config: PivotConfig
): void {
    if (!calculations || calculations.length === 0) return;

    // 1. Flatten the tree to get leaf nodes with full context (row path + column key)
    const flatNodes = flattenTree(root, config);

    // 2. Evaluate each calculation independently
    calculations.forEach(calc => {
        evaluateCalculation(root, flatNodes, calc, config);
    });
}

/**
 * Convert the hierarchical PivotNode tree into a flat list of leaf nodes.
 * Each FlatNode contains a reference to the leaf, the full row dimension path,
 * and the column key (derived from the value keys stored on the leaf).
 */
function flattenTree(root: PivotNode, config: PivotConfig): FlatNode[] {
    const nodes: FlatNode[] = [];

    function traverse(node: PivotNode, currentPath: Map<string, string>) {
        if (node.isLeaf) {
            // Identify all distinct column keys present in this leaf's values.
            const colKeys = new Set<string>();
            Object.keys(node.values).forEach(key => {
                if (key.includes('::')) {
                    const parts = key.split('::');
                    const colKey = parts.slice(0, -1).join('::');
                    colKeys.add(colKey);
                } else {
                    colKeys.add(''); // No column dimensions
                }
            });
            colKeys.forEach(colKey => {
                nodes.push({
                    node,
                    path: new Map(currentPath),
                    colKey,
                });
            });
            return;
        }
        // Recurse into children, extending the path with the appropriate dimension value.
        node.children.forEach((child, key) => {
            const newPath = new Map(currentPath);
            const depth = currentPath.size; // depth corresponds to index in config.rows
            if (depth < config.rows.length) {
                newPath.set(config.rows[depth], key);
            }
            traverse(child, newPath);
        });
    }

    traverse(root, new Map());
    return nodes;
}

/**
 * Evaluate a single TableCalculation against the flattened nodes.
 * Handles partitioning (restart groups) and addressing (order within groups).
 */
function evaluateCalculation(
    root: PivotNode,
    flatNodes: FlatNode[],
    calc: TableCalculation,
    config: PivotConfig
) {
    // Determine which dimensions are used for addressing vs partitioning.
    let partitionDims: string[] = [];
    let addressingDims: string[] = [];

    if (calc.computeUsing === 'table_down') {
        // Address rows, partition by column.
        addressingDims = [...config.rows];
        partitionDims = ['_col_'];
    } else if (calc.computeUsing === 'table_across') {
        // Address columns, partition by rows.
        addressingDims = ['_col_'];
        partitionDims = [...config.rows];
    } else if (calc.computeUsing === 'specific') {
        const specific = calc.specificDimensions || [];
        const allDims = [...config.rows, '_col_'];
        addressingDims = specific;
        partitionDims = allDims.filter(d => !specific.includes(d));
    }

    // Group flat nodes by partition key.
    const groups = new Map<string, FlatNode[]>();
    flatNodes.forEach(item => {
        const keyParts: string[] = [];
        partitionDims.forEach(dim => {
            if (dim === '_col_') {
                keyParts.push(item.colKey);
            } else {
                keyParts.push(item.path.get(dim) || '');
            }
        });
        const groupKey = keyParts.join('|||');
        if (!groups.has(groupKey)) groups.set(groupKey, []);
        groups.get(groupKey)!.push(item);
    });

    // Process each group.
    groups.forEach(group => {
        // Sort within the group according to addressing dimensions.
        group.sort((a, b) => {
            for (const dim of addressingDims) {
                let valA: string, valB: string;
                if (dim === '_col_') {
                    valA = a.colKey;
                    valB = b.colKey;
                } else {
                    valA = a.path.get(dim) || '';
                    valB = b.path.get(dim) || '';
                }
                if (valA < valB) return -1;
                if (valA > valB) return 1;
            }
            return 0;
        });

        // Gather the base values for the calculation.
        const values = group.map(item => {
            const key = item.colKey ? `${item.colKey}::${calc.baseField}` : calc.baseField;
            return item.node.values[key] ?? 0;
        });

        // Compute results.
        const results = performCalculation(values, calc.calculation);

        // Store results back on the leaf nodes and ensure root visibility.
        results.forEach((val, idx) => {
            const item = group[idx];
            const storageKey = item.colKey ? `${item.colKey}::${calc.name}` : calc.name;
            item.node.values[storageKey] = val;
            if (root.values[storageKey] === undefined) {
                root.values[storageKey] = 0;
            }
        });
    });
}

/**
 * Perform the actual numeric calculation.
 * Supported types: running_total, percent_of_total, rank, rank_dense, rank_unique, rank_modified.
 */
function performCalculation(values: number[], type: string): number[] {
    const results: number[] = [];
    let runningSum = 0;
    const totalSum = values.reduce((a, b) => a + b, 0);

    // Prepare ranking arrays when needed.
    let rankStandard: number[] = [];
    let rankDense: number[] = [];
    let rankUnique: number[] = [];
    let rankModified: number[] = [];
    if (['rank', 'rank_dense', 'rank_unique', 'rank_modified'].includes(type)) {
        // Create an array of {value, index} for sorting.
        const indexed = values.map((v, i) => ({ v, i }));
        // Standard competition rank (gaps when ties).
        indexed.sort((a, b) => b.v - a.v);
        rankStandard = new Array(values.length).fill(0);
        let curRank = 1;
        for (let i = 0; i < indexed.length; i++) {
            if (i > 0 && indexed[i].v < indexed[i - 1].v) {
                curRank = i + 1;
            }
            rankStandard[indexed[i].i] = curRank;
        }
        // Dense rank (no gaps).
        rankDense = new Array(values.length).fill(0);
        let denseRank = 1;
        for (let i = 0; i < indexed.length; i++) {
            if (i > 0 && indexed[i].v < indexed[i - 1].v) {
                denseRank++;
            }
            rankDense[indexed[i].i] = denseRank;
        }
        // Unique rank (ordinal position regardless of ties).
        rankUnique = indexed.map((obj, i) => i + 1);
        // Modified rank – Tableau treats this like dense rank.
        rankModified = rankDense.slice();
    }

    for (let i = 0; i < values.length; i++) {
        const val = values[i];
        switch (type) {
            case 'running_total':
                runningSum += val;
                results.push(runningSum);
                break;
            case 'percent_of_total':
                results.push(totalSum === 0 ? 0 : (val / totalSum) * 100);
                break;
            case 'rank':
                results.push(rankStandard[i]);
                break;
            case 'rank_dense':
                results.push(rankDense[i]);
                break;
            case 'rank_unique':
                results.push(rankUnique[i]);
                break;
            case 'rank_modified':
                results.push(rankModified[i]);
                break;
            default:
                results.push(val);
        }
    }
    return results;
}
