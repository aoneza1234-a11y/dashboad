import { CalculatedField, SalesRecord } from '../types';

/**
 * Safely evaluates a formula expression for a single record row.
 * Example expressions:
 *   "[revenue] - [cost]"
 *   "([profit] / [revenue]) * 100"
 *   "[revenue] / [quantity]"
 */
export function evaluateFormula(expression: string, record: SalesRecord): number {
  if (!expression || typeof expression !== 'string') return 0;

  try {
    // 1. Replace bracketed column references [column_name]
    let sanitized = expression.replace(/\[([^\]]+)\]/g, (_, colName) => {
      const trimmed = colName.trim();
      const val = record[trimmed];
      const num = typeof val === 'number' ? val : parseFloat(val);
      return isNaN(num) ? '0' : `(${num})`;
    });

    // 2. Also replace standalone alphanumeric words that match record keys
    const words = sanitized.match(/[a-zA-Z_ก-๙][a-zA-Z0-9_ก-๙]*/g) || [];
    for (const word of words) {
      if (
        ['Math', 'min', 'max', 'round', 'floor', 'ceil', 'abs'].includes(word)
      ) {
        continue;
      }
      if (word in record) {
        const val = record[word];
        const num = typeof val === 'number' ? val : parseFloat(val);
        const replacement = isNaN(num) ? '0' : `(${num})`;
        const regex = new RegExp(`\\b${word}\\b`, 'g');
        sanitized = sanitized.replace(regex, replacement);
      }
    }

    // 3. Keep only safe math tokens: numbers, +, -, *, /, %, (, ), ., whitespace
    // Disallow letters (except Math functions) to prevent unsafe execution
    const safeCheck = sanitized.replace(/Math\.(min|max|round|floor|ceil|abs)/g, '');
    if (/[a-zA-Z_$]/.test(safeCheck)) {
      console.warn('Formula contained unsupported tokens:', expression, sanitized);
      return 0;
    }

    // 4. Safe mathematical evaluation
    const result = new Function(`"use strict"; return (${sanitized});`)();
    if (typeof result === 'number' && !isNaN(result) && isFinite(result)) {
      return result;
    }
    return 0;
  } catch (err) {
    return 0;
  }
}

/**
 * Injects all calculated fields into records array
 */
export function applyCalculatedFields(
  records: SalesRecord[],
  calculatedFields: CalculatedField[]
): SalesRecord[] {
  if (!calculatedFields || calculatedFields.length === 0 || !records.length) {
    return records;
  }

  return records.map((record) => {
    const updated = { ...record };
    for (const cf of calculatedFields) {
      if (!cf.name || !cf.expression) continue;
      const computed = evaluateFormula(cf.expression, record);
      updated[cf.name] = computed;
    }
    return updated;
  });
}
