import { SalesRecord, VisualWidget } from '../types';

export interface AggregatedPoint {
  name: string;
  value: number;
  count: number;
  distinctCount: number;
  color?: string;
  raw?: any;
}

/**
 * Check if a value is consider "blank" / empty
 */
export function isBlankValue(val: any): boolean {
  if (val === null || val === undefined) return true;
  if (typeof val === 'number') return Number.isNaN(val);
  const str = String(val).trim();
  return str === '' || str.toLowerCase() === 'null' || str.toLowerCase() === 'undefined' || str === '-';
}

/**
 * Filter records based on widget rules and global skipBlanks
 */
export function applyRecordFilters(
  records: SalesRecord[],
  widget?: VisualWidget,
  skipBlanks: boolean = false
): SalesRecord[] {
  let filtered = records;

  if (skipBlanks || widget?.skipBlanks) {
    const key = widget?.metric || widget?.dimension || 'revenue';
    filtered = filtered.filter((r) => !isBlankValue(r[key]));
  }

  if (widget?.filterRules && widget.filterRules.length > 0) {
    filtered = filtered.filter((r) => {
      return widget.filterRules!.every((rule) => {
        if (!rule.value && rule.operator !== 'is_blank' && rule.operator !== 'not_blank') {
          return true;
        }
        const val = r[rule.column];
        switch (rule.operator) {
          case 'equals':
            return String(val).toLowerCase() === String(rule.value).toLowerCase();
          case 'not_equals':
            return String(val).toLowerCase() !== String(rule.value).toLowerCase();
          case 'contains':
            return String(val).toLowerCase().includes(String(rule.value).toLowerCase());
          case 'starts_with':
            return String(val).toLowerCase().startsWith(String(rule.value).toLowerCase());
          case 'greater':
            return Number(val) > Number(rule.value);
          case 'less':
            return Number(val) < Number(rule.value);
          case 'is_blank':
            return isBlankValue(val);
          case 'not_blank':
            return !isBlankValue(val);
          default:
            return true;
        }
      });
    });
  }

  return filtered;
}

/**
 * Calculate single metric aggregation:
 * - sum
 * - avg
 * - count
 * - count_distinct (นับค่าไม่ซ้ำ)
 * - min
 * - max
 * - median
 */
export function calculateMetricValue(
  records: SalesRecord[],
  metricKey: string = 'revenue',
  aggregation: string = 'sum',
  skipBlanks: boolean = false
): number {
  if (!records || records.length === 0) return 0;

  let values = records.map((r) => r[metricKey]);

  if (skipBlanks) {
    values = values.filter((v) => !isBlankValue(v));
  }

  if (values.length === 0) return 0;

  switch (aggregation) {
    case 'count_distinct': {
      // นับเฉพาะค่าที่ไม่ซ้ำกัน
      const uniqueSet = new Set(
        values.map((v) => (typeof v === 'string' ? v.trim() : v))
      );
      return uniqueSet.size;
    }

    case 'count': {
      return values.length;
    }

    case 'avg': {
      const numVals = values.map((v) => Number(v) || 0);
      const sum = numVals.reduce((acc, curr) => acc + curr, 0);
      return Math.round((sum / (numVals.length || 1)) * 100) / 100;
    }

    case 'min': {
      const numVals = values.map((v) => Number(v) || 0);
      return Math.min(...numVals);
    }

    case 'max': {
      const numVals = values.map((v) => Number(v) || 0);
      return Math.max(...numVals);
    }

    case 'median': {
      const numVals = values.map((v) => Number(v) || 0).sort((a, b) => a - b);
      const mid = Math.floor(numVals.length / 2);
      if (numVals.length % 2 !== 0) {
        return numVals[mid];
      }
      return (numVals[mid - 1] + numVals[mid]) / 2;
    }

    case 'sum':
    default: {
      const numVals = values.map((v) => Number(v) || 0);
      return numVals.reduce((acc, curr) => acc + curr, 0);
    }
  }
}

/**
 * Apply global filterState to records (regions, categories, inline rules, crossFilter, skipBlanks)
 */
export function applyGlobalFilters(
  records: SalesRecord[],
  filterState: any
): SalesRecord[] {
  if (!records || records.length === 0) return [];
  if (!filterState) return records;

  let result = records;

  // 1. Cross-filter from interactive chart clicks!
  if (filterState.crossFilter && filterState.crossFilter.column && filterState.crossFilter.value !== undefined) {
    const col = filterState.crossFilter.column;
    const val = String(filterState.crossFilter.value).toLowerCase();
    result = result.filter((r) => String(r[col]).toLowerCase() === val);
  }

  // 2. Regions
  if (filterState.regions && filterState.regions.length > 0) {
    result = result.filter((r) => filterState.regions.includes(r.region));
  }

  // 3. Categories
  if (filterState.categories && filterState.categories.length > 0) {
    result = result.filter((r) => filterState.categories.includes(r.category));
  }

  // 4. Skip blanks (button toggle: "ปุ่มไม่นับข้อมูลช่องว่าง")
  if (filterState.skipBlanks) {
    result = result.filter((r) => {
      return !isBlankValue(r.revenue) && !isBlankValue(r.category) && !isBlankValue(r.region);
    });
  }

  // 5. Date range
  if (filterState.dateRange && filterState.dateRange.start && filterState.dateRange.end) {
    result = result.filter((r) => r.date >= filterState.dateRange.start && r.date <= filterState.dateRange.end);
  }

  // 6. Search query
  if (filterState.searchQuery && filterState.searchQuery.trim()) {
    const q = filterState.searchQuery.trim().toLowerCase();
    result = result.filter((r) => {
      return Object.values(r).some((val) => String(val).toLowerCase().includes(q));
    });
  }

  // 7. Dynamic rules from inline filter bar
  if (filterState.rules && filterState.rules.length > 0) {
    result = result.filter((r) => {
      return filterState.rules!.every((rule) => {
        const val = r[rule.column];
        if (rule.operator === 'not_blank') return !isBlankValue(val);
        if (rule.operator === 'is_blank') return isBlankValue(val);

        // Multiple distinct values selected from column dropdown
        if (rule.selectedValues && Array.isArray(rule.selectedValues)) {
          if (rule.selectedValues.length === 0) return true; // No selection means all
          const strVal = String(val ?? '').trim();
          return rule.selectedValues.includes(strVal);
        }

        if (rule.value === undefined || rule.value === null || rule.value === '') return true;

        switch (rule.operator) {
          case 'equals':
            return String(val).toLowerCase() === String(rule.value).toLowerCase();
          case 'not_equals':
            return String(val).toLowerCase() !== String(rule.value).toLowerCase();
          case 'contains':
            return String(val).toLowerCase().includes(String(rule.value).toLowerCase());
          case 'greater':
            return Number(val) > Number(rule.value);
          case 'less':
            return Number(val) < Number(rule.value);
          default:
            return String(val).toLowerCase() === String(rule.value).toLowerCase();
        }
      });
    });
  }

  return result;
}

export function aggregateForWidget(
  records: SalesRecord[],
  widget: VisualWidget,
  palette: string[] = ['#8b5cf6', '#3b82f6', '#14b8a6', '#f97316', '#ec4899']
): AggregatedPoint[] {
  let filtered = applyRecordFilters(records, widget, widget.skipBlanks ?? false);

  // Drill Down hierarchical filtering
  if (widget.drillDownEnabled && widget.drillFilters && widget.drillFilters.length > 0) {
    filtered = filtered.filter((r) =>
      widget.drillFilters!.every((df) => String(r[df.dimension]) === String(df.value))
    );
  }

  // Determine current active dimension based on drill level
  let dimKey = widget.dimension || 'category';
  if (widget.drillDownEnabled && widget.drillLevels && widget.drillLevels.length > 0) {
    const levelIdx = Math.min(widget.currentDrillLevel || 0, widget.drillLevels.length - 1);
    dimKey = widget.drillLevels[levelIdx] || dimKey;
  }

  const metricKey = widget.metric || 'revenue';
  const agg = widget.aggregation || 'sum';
  const skipBlanks = widget.skipBlanks ?? false;

  // Group by dimension
  const groups: Record<string, SalesRecord[]> = {};

  filtered.forEach((r) => {
    let dimVal = r[dimKey];
    if (skipBlanks && isBlankValue(dimVal)) {
      return; // Skip blank dimension values if configured
    }
    const key = isBlankValue(dimVal) ? '(ไม่มีข้อมูล)' : String(dimVal);
    if (!groups[key]) {
      groups[key] = [];
    }
    groups[key].push(r);
  });

  const keys = Object.keys(groups);

  return keys.map((key, index) => {
    const groupRecords = groups[key];
    const val = calculateMetricValue(groupRecords, metricKey, agg, skipBlanks);
    const distinct = calculateMetricValue(groupRecords, metricKey, 'count_distinct', skipBlanks);

    return {
      name: key,
      value: val,
      count: groupRecords.length,
      distinctCount: distinct,
      color: palette[index % palette.length],
      raw: groupRecords,
    };
  });
}
