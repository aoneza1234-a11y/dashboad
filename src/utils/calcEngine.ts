import { SalesRecord, VisualWidget } from '../types';

export interface AggregatedPoint {
  name: string;
  value: number;
  count: number;
  distinctCount: number;
  color?: string;
  raw?: any;
}

const FIELD_ALIASES: Record<string, string[]> = {
  region: ['region', 'ภูมิภาค', 'ภาค', 'โซน', 'zone', 'area', 'จังหวัด', 'province'],
  category: ['category', 'หมวดหมู่', 'หมวด', 'กลุ่มสินค้า', 'ประเภท', 'type', 'group'],
  product: ['product', 'สินค้า', 'ชื่อสินค้า', 'รายการ', 'item', 'product_name'],
  revenue: ['revenue', 'ยอดขาย', 'ยอดขาย (บาท)', 'รายได้', 'sales', 'total_sales', 'amount', 'ยอดรวม'],
  cost: ['cost', 'ต้นทุน', 'ต้นทุน (บาท)', 'ค่าใช้จ่าย', 'expense'],
  profit: ['profit', 'กำไร', 'กำไรขั้นต้น', 'กำไร (บาท)', 'กำไรขั้นต้น (บาท)', 'net_profit', 'gross_profit'],
  quantity: ['quantity', 'จำนวน', 'จำนวนชิ้น', 'ปริมาณ', 'qty', 'count', 'ยอดสั่งซื้อ'],
  date: ['date', 'วันที่', 'เวลา', 'time', 'timestamp'],
  orderId: ['orderId', 'order_id', 'เลขที่คำสั่งซื้อ', 'รหัสคำสั่งซื้อ', 'id', 'order', 'ลำดับ', 'no'],
  channel: ['channel', 'ช่องทาง', 'ช่องทางจำหน่าย', 'ช่องทางการขาย', 'sales_channel'],
};

/**
 * Robustly extract a value from record regardless of Thai/English or case variations
 */
export function getRecordValue(record: any, columnKey: string): any {
  if (!record || typeof record !== 'object' || !columnKey) return undefined;

  // 1. Exact match
  if (record[columnKey] !== undefined) return record[columnKey];

  const colLower = String(columnKey).trim().toLowerCase();

  // 2. Case-insensitive key lookup
  for (const k of Object.keys(record)) {
    if (k.trim().toLowerCase() === colLower) {
      return record[k];
    }
  }

  // 3. Search via canonical aliases
  for (const [, aliases] of Object.entries(FIELD_ALIASES)) {
    if (aliases.some((a) => a.toLowerCase() === colLower)) {
      for (const alias of aliases) {
        if (record[alias] !== undefined) return record[alias];
        for (const k of Object.keys(record)) {
          if (k.trim().toLowerCase() === alias.toLowerCase()) {
            return record[k];
          }
        }
      }
    }
  }

  return undefined;
}

/**
 * Cleanly parse numbers, removing commas, currency signs, and trimming spaces
 */
export function parseCleanNumber(val: any): number {
  if (val === null || val === undefined) return 0;
  if (typeof val === 'number') return isNaN(val) ? 0 : val;
  const str = String(val).replace(/,/g, '').replace(/฿/g, '').replace(/%/g, '').trim();
  const num = parseFloat(str);
  return isNaN(num) ? 0 : num;
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
  if (!records || records.length === 0) return [];
  let filtered = records;

  if (skipBlanks || widget?.skipBlanks) {
    const key = widget?.metric || widget?.dimension || 'revenue';
    filtered = filtered.filter((r) => !isBlankValue(getRecordValue(r, key)));
  }

  if (widget?.filterRules && widget.filterRules.length > 0) {
    // 1. First apply all standard condition filters (e.g. Condition C: equals, greater, not_blank, contains)
    const conditionRules = widget.filterRules.filter((r) => r.operator !== 'count_distinct');
    if (conditionRules.length > 0) {
      filtered = filtered.filter((r) => {
        return conditionRules.every((rule) => {
          if (!rule.column) return true;
          const val = getRecordValue(r, rule.column);

          if (rule.operator === 'is_blank') return isBlankValue(val);
          if (rule.operator === 'not_blank') return !isBlankValue(val);

          if (rule.value === undefined || rule.value === null || String(rule.value).trim() === '') {
            return true;
          }

          const strVal = String(val ?? '').trim().toLowerCase();
          const strTarget = String(rule.value).trim().toLowerCase();
          const isStrictNumber =
            (typeof val === 'number' || (typeof val === 'string' && val.trim() !== '' && !isNaN(Number(val.trim())))) &&
            !isNaN(Number(String(rule.value).trim()));
          const numVal = isStrictNumber ? parseCleanNumber(val) : NaN;
          const numTarget = isStrictNumber ? parseCleanNumber(rule.value) : NaN;
          const isNumericComparison = isStrictNumber && !isNaN(numVal) && !isNaN(numTarget);

          switch (rule.operator) {
            case 'equals':
              return strVal === strTarget || (isNumericComparison && numVal === numTarget);
            case 'not_equals':
              return strVal !== strTarget && (!isNumericComparison || numVal !== numTarget);
            case 'contains':
              return strVal.includes(strTarget);
            case 'starts_with':
              return strVal.startsWith(strTarget);
            case 'greater':
              return isNumericComparison ? numVal > numTarget : strVal > strTarget;
            case 'greater_equal':
              return isNumericComparison ? numVal >= numTarget : strVal >= strTarget;
            case 'less':
              return isNumericComparison ? numVal < numTarget : strVal < strTarget;
            case 'less_equal':
              return isNumericComparison ? numVal <= numTarget : strVal <= strTarget;
            default:
              return strVal === strTarget;
          }
        });
      });
    }

    // 2. Next apply count_distinct (deduplicate records by Column B so downstream counting is distinct)
    const countDistinctRules = widget.filterRules.filter((r) => r.operator === 'count_distinct');
    if (countDistinctRules.length > 0) {
      countDistinctRules.forEach((rule) => {
        if (!rule.column) return;
        const seen = new Set<string>();
        filtered = filtered.filter((r) => {
          const val = getRecordValue(r, rule.column);
          const key = String(val ?? '').trim().toLowerCase();
          if (seen.has(key)) return false;
          seen.add(key);
          return true;
        });
      });
    }
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

  let values = records.map((r) => getRecordValue(r, metricKey));

  if (skipBlanks) {
    values = values.filter((v) => !isBlankValue(v));
  }

  if (values.length === 0) return 0;

  switch (aggregation) {
    case 'count_distinct': {
      const uniqueSet = new Set(
        values.map((v) => (typeof v === 'string' ? v.trim() : v))
      );
      return uniqueSet.size;
    }

    case 'count': {
      return values.length;
    }

    case 'avg': {
      const numVals = values.map((v) => parseCleanNumber(v));
      const sum = numVals.reduce((acc, curr) => acc + curr, 0);
      return Math.round((sum / (numVals.length || 1)) * 100) / 100;
    }

    case 'min': {
      const numVals = values.map((v) => parseCleanNumber(v));
      return Math.min(...numVals);
    }

    case 'max': {
      const numVals = values.map((v) => parseCleanNumber(v));
      return Math.max(...numVals);
    }

    case 'median': {
      const numVals = values.map((v) => parseCleanNumber(v)).sort((a, b) => a - b);
      const mid = Math.floor(numVals.length / 2);
      if (numVals.length % 2 !== 0) {
        return numVals[mid];
      }
      return (numVals[mid - 1] + numVals[mid]) / 2;
    }

    case 'sum':
    default: {
      const numVals = values.map((v) => parseCleanNumber(v));
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
    const targetVal = String(filterState.crossFilter.value).trim().toLowerCase();
    result = result.filter((r) => {
      const val = getRecordValue(r, col);
      return String(val ?? '').trim().toLowerCase() === targetVal;
    });
  }

  // 2. Regions
  if (filterState.regions && filterState.regions.length > 0) {
    const targetRegions = filterState.regions.map((x: string) => String(x).trim().toLowerCase());
    result = result.filter((r) => {
      const reg = String(getRecordValue(r, 'region') ?? '').trim().toLowerCase();
      return targetRegions.includes(reg);
    });
  }

  // 3. Categories
  if (filterState.categories && filterState.categories.length > 0) {
    const targetCats = filterState.categories.map((x: string) => String(x).trim().toLowerCase());
    result = result.filter((r) => {
      const cat = String(getRecordValue(r, 'category') ?? '').trim().toLowerCase();
      return targetCats.includes(cat);
    });
  }

  // 4. Skip blanks (button toggle: "ปุ่มไม่นับข้อมูลช่องว่าง")
  if (filterState.skipBlanks) {
    result = result.filter((r) => {
      const rev = getRecordValue(r, 'revenue');
      const cat = getRecordValue(r, 'category');
      const reg = getRecordValue(r, 'region');
      return !isBlankValue(rev) && !isBlankValue(cat) && !isBlankValue(reg);
    });
  }

  // 5. Date range
  if (filterState.dateRange && filterState.dateRange.start && filterState.dateRange.end) {
    result = result.filter((r) => {
      const d = String(getRecordValue(r, 'date') ?? '');
      return d >= filterState.dateRange.start && d <= filterState.dateRange.end;
    });
  }

  // 6. Search query
  if (filterState.searchQuery && filterState.searchQuery.trim()) {
    const q = filterState.searchQuery.trim().toLowerCase();
    result = result.filter((r) => {
      return Object.values(r).some((val) => String(val ?? '').toLowerCase().includes(q));
    });
  }

  // 7. Dynamic rules from inline filter bar
  const activeRules = filterState.rules || filterState.customRules;
  if (activeRules && activeRules.length > 0) {
    result = result.filter((r) => {
      return activeRules.every((rule: any) => {
        if (!rule.column) return true;
        const val = getRecordValue(r, rule.column);

        if (rule.operator === 'not_blank') return !isBlankValue(val);
        if (rule.operator === 'is_blank') return isBlankValue(val);

        // Multiple distinct values selected from column dropdown
        if (rule.selectedValues && Array.isArray(rule.selectedValues) && rule.selectedValues.length > 0) {
          const strVal = String(val ?? '').trim().toLowerCase();
          return rule.selectedValues.some((sv: string) => String(sv).trim().toLowerCase() === strVal);
        }

        if (rule.operator === 'in') {
          if (rule.selectedValues && Array.isArray(rule.selectedValues) && rule.selectedValues.length > 0) {
            const strVal = String(val ?? '').trim().toLowerCase();
            return rule.selectedValues.some((sv: string) => String(sv).trim().toLowerCase() === strVal);
          }
          if (rule.value !== undefined && rule.value !== null && String(rule.value).trim() !== '') {
            const strVal = String(val ?? '').trim().toLowerCase();
            return strVal === String(rule.value).trim().toLowerCase();
          }
          return true;
        }

        if (rule.value === undefined || rule.value === null || String(rule.value).trim() === '') return true;

        const strVal = String(val ?? '').trim().toLowerCase();
        const strTarget = String(rule.value).trim().toLowerCase();
        const isStrictNumber =
          (typeof val === 'number' || (typeof val === 'string' && val.trim() !== '' && !isNaN(Number(val.trim())))) &&
          !isNaN(Number(String(rule.value).trim()));
        const numVal = isStrictNumber ? parseCleanNumber(val) : NaN;
        const numTarget = isStrictNumber ? parseCleanNumber(rule.value) : NaN;
        const isNumericComparison = isStrictNumber && !isNaN(numVal) && !isNaN(numTarget);

        switch (rule.operator) {
          case 'equals':
            return strVal === strTarget || (isNumericComparison && numVal === numTarget);
          case 'not_equals':
            return strVal !== strTarget && (!isNumericComparison || numVal !== numTarget);
          case 'contains':
            return strVal.includes(strTarget);
          case 'starts_with':
            return strVal.startsWith(strTarget);
          case 'greater':
            return isNumericComparison ? numVal > numTarget : strVal > strTarget;
          case 'greater_equal':
            return isNumericComparison ? numVal >= numTarget : strVal >= strTarget;
          case 'less':
            return isNumericComparison ? numVal < numTarget : strVal < strTarget;
          case 'less_equal':
            return isNumericComparison ? numVal <= numTarget : strVal <= strTarget;
          default:
            return strVal === strTarget;
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
      widget.drillFilters!.every((df) => String(getRecordValue(r, df.dimension)) === String(df.value))
    );
  }

  // Determine current active dimension based on drill level
  let dimKey = widget.dimension || 'category';
  if (widget.drillDownEnabled && widget.drillLevels && widget.drillLevels.length > 0) {
    const levelIdx = Math.min(widget.currentDrillLevel || 0, widget.drillLevels.length - 1);
    dimKey = widget.drillLevels[levelIdx] || dimKey;
  }

  const countDistinctRule = widget.filterRules?.find((r) => r.operator === 'count_distinct');
  const metricKey = countDistinctRule ? countDistinctRule.column : (widget.metric || 'revenue');
  const agg = countDistinctRule ? 'count_distinct' : (widget.aggregation || 'sum');
  const skipBlanks = widget.skipBlanks ?? false;

  // Group by dimension
  const groups: Record<string, SalesRecord[]> = {};

  filtered.forEach((r) => {
    const dimVal = getRecordValue(r, dimKey);
    if (skipBlanks && isBlankValue(dimVal)) {
      return;
    }
    const key = isBlankValue(dimVal) ? '(ไม่มีข้อมูล)' : String(dimVal).trim();
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

/**
 * Auto-Organize Widgets into a clean, beautiful executive dashboard grid
 */
export function autoOrganizeWidgets(
  widgets: VisualWidget[],
  containerWidth: number = 1200
): VisualWidget[] {
  if (!widgets || widgets.length === 0) return [];

  const PADDING = 20; // Maximum 20px padding boundary
  const GAP = 16;
  const usableWidth = Math.max(500, containerWidth - PADDING * 2);

  const kpis = widgets.filter((w) => w.type === 'kpi');
  const charts = widgets.filter(
    (w) =>
      !['kpi', 'table', 'pivot', 'list', 'textbox', 'richtext', 'floating_text'].includes(w.type) &&
      !w.type.startsWith('shape_')
  );
  const tables = widgets.filter((w) => ['table', 'pivot', 'list'].includes(w.type));
  const shapes = widgets.filter(
    (w) =>
      w.type.startsWith('shape_') ||
      ['textbox', 'richtext', 'floating_text'].includes(w.type)
  );

  let curY = PADDING;
  const result: VisualWidget[] = [];

  // 1. Arrange KPIs: 2 to 4 per row
  if (kpis.length > 0) {
    const kpisPerRow = kpis.length <= 2 ? 2 : kpis.length === 3 ? 3 : usableWidth > 1050 ? 4 : 3;
    const kpiWidth = Math.floor((usableWidth - GAP * (kpisPerRow - 1)) / kpisPerRow);
    const kpiHeight = 135;

    kpis.forEach((w, idx) => {
      const col = idx % kpisPerRow;
      const row = Math.floor(idx / kpisPerRow);
      const x = PADDING + col * (kpiWidth + GAP);
      const y = curY + row * (kpiHeight + GAP);

      result.push({
        ...w,
        x,
        y,
        customWidth: kpiWidth,
        customHeight: kpiHeight,
        w: Math.max(2, Math.round((kpiWidth / usableWidth) * 12)),
        h: 3,
      });
    });

    const numRows = Math.ceil(kpis.length / kpisPerRow);
    curY += numRows * (kpiHeight + GAP) + 8;
  }

  // 2. Arrange Charts: 2 per row
  if (charts.length > 0) {
    const chartsPerRow = usableWidth > 800 ? 2 : 1;
    const chartWidth = Math.floor((usableWidth - GAP * (chartsPerRow - 1)) / chartsPerRow);
    const chartHeight = 310;

    charts.forEach((w, idx) => {
      const col = idx % chartsPerRow;
      const row = Math.floor(idx / chartsPerRow);
      const x = PADDING + col * (chartWidth + GAP);
      const y = curY + row * (chartHeight + GAP);

      result.push({
        ...w,
        x,
        y,
        customWidth: chartWidth,
        customHeight: chartHeight,
        w: chartsPerRow === 2 ? 6 : 12,
        h: 6,
      });
    });

    const numRows = Math.ceil(charts.length / chartsPerRow);
    curY += numRows * (chartHeight + GAP) + 8;
  }

  // 3. Arrange Tables: full width
  if (tables.length > 0) {
    const tableWidth = usableWidth;
    const tableHeight = 350;

    tables.forEach((w) => {
      result.push({
        ...w,
        x: PADDING,
        y: curY,
        customWidth: tableWidth,
        customHeight: tableHeight,
        w: 12,
        h: 7,
      });
      curY += tableHeight + GAP;
    });
  }

  // 4. Arrange Shapes and annotations
  if (shapes.length > 0) {
    const shapeWidth = Math.min(usableWidth, 340);
    const shapeHeight = 120;
    shapes.forEach((w, idx) => {
      result.push({
        ...w,
        x: PADDING + (idx % 2) * (shapeWidth + GAP),
        y: curY + Math.floor(idx / 2) * (shapeHeight + GAP),
        customWidth: shapeWidth,
        customHeight: shapeHeight,
      });
    });
  }

  return result;
}
