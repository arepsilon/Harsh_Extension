import type { PivotConfig, CalculatedField, LODCalculation } from '../types';

/**
 * Field Dependency Analyzer
 *
 * Analyzes pivot configurations to determine which fields need to be fetched from Tableau.
 * Handles dependencies from:
 * - Direct field references (rows, columns, values)
 * - Calculated fields (row-level and aggregation)
 * - LOD calculations (FIXED, INCLUDE, EXCLUDE)
 * - Nested dependencies (calculated fields referencing other calculated fields)
 */

export interface FieldDependencies {
    required: string[];              // All unique fields that must be fetched
    calculatedFieldOrder: string[];  // Order to evaluate calculated fields (topological sort)
    validationErrors: string[];      // Any validation errors found
}

/**
 * Extract field references from a formula
 * Example: "[Sales] * 1.1 + [Tax]" → ["Sales", "Tax"]
 * Example: "IF [Sales] > 1000 THEN [Profit] ELSE 0 END" → ["Sales", "Profit"]
 */
export function extractFieldReferences(formula: string): string[] {
    const fieldMatches = formula.match(/\[([^\]]+)\]/g);
    if (!fieldMatches) return [];

    // Remove brackets and deduplicate
    const fields = fieldMatches.map(match => match.slice(1, -1));
    return [...new Set(fields)];
}

/**
 * Resolve dependencies for a single calculated field
 * Returns list of base fields needed (not other calculated fields)
 */
function resolveCalculatedFieldDependencies(
    calcField: CalculatedField,
    allCalcFields: CalculatedField[],
    visited: Set<string> = new Set(),
    errors: string[] = []
): string[] {
    // Detect circular dependencies
    if (visited.has(calcField.name)) {
        errors.push(`Circular dependency detected: ${calcField.name}`);
        return [];
    }

    visited.add(calcField.name);

    // Extract all field references from formula
    const directRefs = extractFieldReferences(calcField.formula);
    const dependencies: string[] = [];

    for (const ref of directRefs) {
        // Check if this reference is another calculated field
        const referencedCalc = allCalcFields.find(c => c.name === ref);

        if (referencedCalc) {
            // Recursively resolve nested calculated field
            const nestedDeps = resolveCalculatedFieldDependencies(
                referencedCalc,
                allCalcFields,
                new Set(visited), // Clone visited set for this branch
                errors
            );
            dependencies.push(...nestedDeps);
        } else {
            // This is a base field reference
            dependencies.push(ref);
        }
    }

    return [...new Set(dependencies)]; // Deduplicate
}

/**
 * Resolve dependencies for LOD calculations
 * Handles FIXED, INCLUDE, and EXCLUDE types
 */
function resolveLODDependencies(
    lod: LODCalculation,
    viewDimensions: string[],
    allCalcFields: CalculatedField[],
    errors: string[] = []
): string[] {
    const dependencies: string[] = [];

    // Add dimensions based on LOD type
    switch (lod.type) {
        case 'FIXED':
            // Use exactly the specified dimensions
            dependencies.push(...lod.dimensions);
            break;

        case 'INCLUDE':
            // View dimensions + specified dimensions
            dependencies.push(...viewDimensions, ...lod.dimensions);
            break;

        case 'EXCLUDE':
            // View dimensions minus specified dimensions
            const excludeSet = new Set(lod.dimensions);
            const included = viewDimensions.filter(dim => !excludeSet.has(dim));
            dependencies.push(...included);
            break;
    }

    // Extract field references from aggregation formula
    // Example: "SUM([Sales])" → ["Sales"]
    // Example: "SUM(IF [Sales] > 1000 THEN [Sales] ELSE 0 END)" → ["Sales"]
    const aggRefs = extractFieldReferences(lod.aggregation);

    for (const ref of aggRefs) {
        // Check if this is a calculated field
        const referencedCalc = allCalcFields.find(c => c.name === ref);

        if (referencedCalc) {
            // Resolve calculated field dependencies
            const calcDeps = resolveCalculatedFieldDependencies(
                referencedCalc,
                allCalcFields,
                new Set(),
                errors
            );
            dependencies.push(...calcDeps);
        } else {
            dependencies.push(ref);
        }
    }

    return [...new Set(dependencies)]; // Deduplicate
}

/**
 * Perform topological sort on calculated fields to determine evaluation order
 * Ensures dependencies are calculated before fields that use them
 */
function topologicalSortCalculatedFields(
    calcFields: CalculatedField[]
): string[] {
    const calcMap = new Map(calcFields.map(c => [c.name, c]));
    const order: string[] = [];
    const visited = new Set<string>();
    const visiting = new Set<string>();

    function visit(name: string): boolean {
        if (visited.has(name)) return true;
        if (visiting.has(name)) {
            // Circular dependency detected
            return false;
        }

        visiting.add(name);
        const calc = calcMap.get(name);

        if (calc) {
            const refs = extractFieldReferences(calc.formula);

            // Visit dependencies first
            for (const ref of refs) {
                if (calcMap.has(ref)) {
                    if (!visit(ref)) return false; // Circular dependency
                }
            }
        }

        visiting.delete(name);
        visited.add(name);
        order.push(name);
        return true;
    }

    // Visit all calculated fields
    for (const calc of calcFields) {
        if (!visit(calc.name)) {
            // Circular dependency detected
            return calcFields.map(c => c.name); // Return original order
        }
    }

    return order;
}

/**
 * Validate that all field references exist in available fields
 */
function validateFieldReferences(
    fieldRefs: string[],
    availableFields: string[],
    calcFieldNames: string[]
): string[] {
    const errors: string[] = [];
    const availableSet = new Set([...availableFields, ...calcFieldNames]);

    for (const field of fieldRefs) {
        if (!availableSet.has(field)) {
            errors.push(`Field '${field}' not found in data source or calculated fields`);
        }
    }

    return errors;
}

/**
 * Main function: Analyze pivot configuration and determine all required fields
 *
 * This is the entry point for field dependency analysis.
 * Returns all fields needed + evaluation order + any validation errors.
 */
export function analyzeFieldDependencies(
    config: PivotConfig,
    availableFields: string[]
): FieldDependencies {
    const requiredSet = new Set<string>();
    const errors: string[] = [];

    // 1. Add explicit dimension fields (rows and columns)
    config.rows.forEach(field => requiredSet.add(field));
    config.columns.forEach(field => requiredSet.add(field));

    // View dimensions for LOD calculations
    const viewDimensions = [...config.rows, ...config.columns];

    // 2. Add value fields (unless they're calculated/LOD/table_calc)
    config.values.forEach(valueField => {
        if (valueField.type === 'field') {
            requiredSet.add(valueField.field);
        }
        // table_calc and calc types don't directly reference base fields
    });

    // 3. Resolve calculated field dependencies
    const calcFields = config.calculatedFields || [];
    const calcFieldNames = calcFields.map(c => c.name);

    for (const calcField of calcFields) {
        const deps = resolveCalculatedFieldDependencies(
            calcField,
            calcFields,
            new Set(),
            errors
        );
        deps.forEach(dep => requiredSet.add(dep));
    }

    // 4. Resolve LOD calculation dependencies
    const lodCalcs = config.lodCalculations || [];

    for (const lod of lodCalcs) {
        const deps = resolveLODDependencies(
            lod,
            viewDimensions,
            calcFields,
            errors
        );
        deps.forEach(dep => requiredSet.add(dep));
    }

    // 5. Convert set to array and remove calculated field names
    // (we only want base fields from Tableau)
    const calcFieldSet = new Set(calcFieldNames);
    const requiredFields = Array.from(requiredSet).filter(
        field => !calcFieldSet.has(field)
    );

    // 6. Validate all field references
    const validationErrors = validateFieldReferences(
        requiredFields,
        availableFields,
        calcFieldNames
    );
    errors.push(...validationErrors);

    // 7. Determine calculated field evaluation order
    const calculatedFieldOrder = topologicalSortCalculatedFields(calcFields);

    return {
        required: requiredFields,
        calculatedFieldOrder,
        validationErrors: [...new Set(errors)] // Deduplicate errors
    };
}

/**
 * Check if a pivot configuration has changed in a way that requires re-fetching data
 */
export function requiresDataRefetch(
    oldDeps: FieldDependencies,
    newDeps: FieldDependencies
): boolean {
    // Compare required field sets
    const oldSet = new Set(oldDeps.required);
    const newSet = new Set(newDeps.required);

    // Check if any new fields are needed
    for (const field of newSet) {
        if (!oldSet.has(field)) {
            return true; // New field needed
        }
    }

    // Check if we can drop some fields (optional optimization)
    // For now, we'll keep all previously fetched fields

    return false;
}
