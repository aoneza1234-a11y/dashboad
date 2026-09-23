export type VisualType =
  | 'kpi'
  | 'bar'
  | 'column'
  | 'bar_horizontal'
  | 'line'
  | 'area'
  | 'pie'
  | 'donut'
  | 'combo'
  | 'radar'
  | 'gauge'
  | 'scatter'
  | 'funnel'
  | 'waterfall'
  | 'heatmap'
  | 'treemap'
  | 'table'
  | 'pivot'
  | 'list'
  | 'timeline'
  | 'map'
  | 'calendar'
  | 'progressbar'
  | 'ai_summary'
  | 'textbox'
  | 'richtext'
  | 'floating_text'
  | 'image'
  | 'shape_rect'
  | 'shape_rounded'
  | 'shape_circle'
  | 'shape_triangle'
  | 'shape_star'
  | 'shape_diamond'
  | 'shape_pill'
  | 'shape_banner';

export interface VisualFilterRule {
  id: string;
  column: string;
  operator:
    | 'equals'
    | 'not_equals'
    | 'greater'
    | 'less'
    | 'contains'
    | 'not_blank'
    | 'is_blank'
    | 'starts_with'
    | 'count_distinct';
  value: string;
}

export interface VisualWidget {
  id: string;
  title: string;
  type: VisualType;
  x: number;
  y: number;
  w: number;
  h: number;
  customWidth?: number;
  customHeight?: number;
  zIndex?: number;
  metric?: string;
  dimension?: string;
  aggregation?: 'sum' | 'avg' | 'count' | 'count_distinct' | 'min' | 'max' | 'median';
  prefix?: string;
  suffix?: string;
  subtitle?: string;
  hidden?: boolean;
  locked?: boolean;
  color?: string;
  paletteIndex?: number;
  showTitle?: boolean;
  showLegend?: boolean;
  showDataLabels?: boolean;
  showGrid?: boolean;
  showXAxis?: boolean;
  showYAxis?: boolean;
  showTooltip?: boolean;
  showRowCount?: boolean;
  skipBlanks?: boolean;
  transparentBg?: boolean;
  cardBgColor?: string;
  cardBorderColor?: string;
  cardBorderWidth?: number;
  cardBorderStyle?: 'solid' | 'dashed' | 'dotted' | 'none';
  cardBorderRadius?: number;
  cardOpacity?: number;
  shapeFillColor?: string;
  shapeBorderColor?: string;
  shapeBorderWidth?: number;
  shapeBorderStyle?: 'solid' | 'dashed' | 'dotted' | 'none';
  shapeText?: string;
  shapeTextColor?: string;
  shapeTextSize?: number;
  legendPosition?: 'bottom' | 'top' | 'left' | 'right';
  chartAlign?: 'center' | 'left' | 'right';
  chartScale?: number;
  offsetX?: number;
  offsetY?: number;
  numberFormat?: 'number' | 'currency' | 'percent';
  decimals?: number;
  filterRules?: VisualFilterRule[];
  showTrend?: boolean;
  trendCompareColumn?: string;
  trendLabel?: string;
  trendShowPercent?: boolean;
  trendShowDiff?: boolean;
  conditionalRules?: ConditionalColorRule[];
  drillDownEnabled?: boolean;
  drillLevels?: string[];
  currentDrillLevel?: number;
  drillFilters?: { dimension: string; value: string }[];
  config?: Record<string, any>;
}

export interface ConditionalColorRule {
  id: string;
  operator: 'greater' | 'greater_equal' | 'less' | 'less_equal' | 'equals';
  value: number;
  color: string;
  label?: string;
}

export interface CalculatedField {
  id: string;
  name: string;
  expression: string;
  format?: 'number' | 'currency' | 'percent';
  decimals?: number;
  description?: string;
}

// ========================
// Developer Console Types
// ========================
export type DevRole =
  | 'SUPER_ADMIN'
  | 'ADMIN'
  | 'DEVELOPER'
  | 'EDITOR'
  | 'VIEWER';

export type DevPermission =
  | 'create_dashboard'
  | 'edit_dashboard'
  | 'delete_dashboard'
  | 'manage_datasources'
  | 'manage_users'
  | 'export_data'
  | 'manage_themes'
  | 'view_audit_logs';

export interface DevUser {
  id: string;
  name: string;
  email: string;
  role: DevRole;
  permissions: DevPermission[];
  status: 'active' | 'inactive';
  lastActive: string;
  avatarUrl?: string;
}

export type DataSourceType =
  | 'google_sheets'
  | 'excel'
  | 'csv'
  | 'sql_server'
  | 'mysql'
  | 'postgres'
  | 'rest_api';

export interface DevDataSource {
  id: string;
  name: string;
  type: DataSourceType;
  status: 'connected' | 'degraded' | 'offline';
  lastSync: string;
  recordCount: number;
  syncTimeMs: number;
  connectionString?: string;
}

export interface DevQueryStat {
  id: string;
  widgetId: string;
  widgetTitle: string;
  dashboardName: string;
  rowsProcessed: number;
  executionTimeMs: number;
  status: 'fast' | 'moderate' | 'slow';
}

export interface DevErrorLog {
  id: string;
  category: 'Formula Error' | 'API Error' | 'Sheet not found' | 'Connection failed';
  detail: string;
  stackTrace: string;
  datetime: string;
  user: string;
  resolved: boolean;
}

export interface DevAuditLog {
  id: string;
  user: string;
  role: string;
  action: string;
  target: string;
  timestamp: string;
  status: 'success' | 'warning' | 'danger';
}

export interface DevVersionCommit {
  version: string;
  timestamp: string;
  author: string;
  message: string;
  widgetsCount: number;
  isActive?: boolean;
}

export interface DevWhiteLabelConfig {
  companyName: string;
  systemName: string;
  domain: string;
  logoUrl?: string;
  primaryColor: string;
  secondaryColor: string;
  loginTheme: 'modern' | 'dark' | 'corporate';
}

export interface SalesRecord {
  id: number;
  date: string;
  orderId: string;
  product: string;
  category: string;
  region: string;
  quantity: number;
  revenue: number;
  cost: number;
  profit: number;
  [key: string]: any; // Allows custom columns from dynamic Google Sheets!
}

export interface ActiveFilterRule {
  id: string;
  column: string;
  operator?: 'equals' | 'not_equals' | 'contains' | 'greater' | 'less' | 'not_blank' | 'is_blank' | 'in';
  value?: string;
  selectedValues?: string[]; // Array of unique values selected from column dropdown
}

export interface FilterState {
  regions: string[];
  categories: string[];
  dateRange?: { start: string; end: string };
  searchQuery?: string;
  skipBlanks?: boolean;
  rules?: ActiveFilterRule[];
  crossFilter?: { column: string; value: any } | null;
}

export interface SheetConnectionConfig {
  spreadsheetId: string;
  spreadsheetTitle: string;
  sheetName: string;
  availableSheets: string[];
  headerRow: number; // e.g. row 1, 3
  dataStartRow: number; // e.g. row 2, 4
  dataEndRow?: number | null;
  status: 'connected' | 'disconnected' | 'syncing' | 'error';
  lastSyncedAt: string | null;
  mode: 'sample' | 'sheets_api' | 'public_url';
  detectedHeaders: string[];
}

export interface VisualTypeOption {
  id: VisualType;
  label: string;
  iconName: string;
  category?: string;
}

export type ThemePreset = 'violet' | 'midnight' | 'light' | 'ocean' | 'forest' | 'sunset';

export interface ThemeConfig {
  preset: ThemePreset;
  primaryColor: string;
  fontFamily: 'Prompt' | 'Sarabun' | 'Kanit' | 'Inter' | 'system';
  borderRadius: 'rounded-none' | 'rounded-lg' | 'rounded-2xl';
  shadowStyle: 'shadow-none' | 'shadow-sm' | 'shadow-xl';
}

export interface DashboardVersion {
  id: string;
  title: string;
  timestamp: string;
  widgets: VisualWidget[];
  salesData?: SalesRecord[];
  recordCount?: number;
}

export interface SavedDashboard {
  id: string;
  title: string;
  updatedAt: string;
  widgets: VisualWidget[];
  salesData?: SalesRecord[];
  themePreset?: ThemePreset;
  description?: string;
  recordCount?: number;
}

export type TeamUserRole = 'admin' | 'editor' | 'viewer';
export type TeamUserStatus = 'active' | 'blocked';

export interface TeamUser {
  id: string;
  email: string;
  displayName: string;
  name?: string; // alias for displayName
  avatarUrl?: string;
  role: TeamUserRole; // 'admin' = เข้าหลังบ้านได้, 'editor' = ผู้ใช้ในทีม ทำงานเหมือน Power BI ไม่เห็นหลังบ้าน, 'viewer' = ดูอย่างเดียว
  status: TeamUserStatus; // 'active' = ใช้งานได้, 'blocked' = ถูกบล็อก เข้าใช้งานไม่ได้
  department?: string;
  createdAt: string;
  lastLoginAt?: string;
  assignedTemplateIds?: string[];
  password?: string;
}

export interface DashboardTemplate {
  id: string;
  title: string;
  name?: string; // alias for title
  description: string;
  category: string;
  thumbnailIcon?: string;
  widgets: VisualWidget[];
  sampleDataCount: number;
  salesData?: SalesRecord[];
  themePreset?: ThemePreset;
  createdBy: string;
  createdAt: string;
  assignedToUserIds: string[]; // ['all'] หรือรายการ User ID ที่แอดมินเลือกส่งให้
}


