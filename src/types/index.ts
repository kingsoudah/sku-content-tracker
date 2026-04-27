export interface ProductData {
  Sku: string;
  Title: string;
  Content: string;
  "Image URL": string;
  "Product categories": string;
  Status: string;
  Stock: string;
  "Main Category": string;
  Subcategory: string;
  "Sub-sub-category": string;
  "sub-sub-sub-category": string;
}

export interface UploadMetrics {
  totalSKUs: number;
  totalStock: number;
  avgStock: number;
  sellableCount: number;
  slaCompliantCount: number;
  categoryCount: number;
  dataQualityScore: number;
  categoryDistribution: Record<string, number>;
  statusDistribution: Record<string, number>;
  stockDistribution: StockRange[];
}

export interface StockRange {
  range: string;
  count: number;
}

export interface CategoryMetric {
  name: string;
  count: number;
  previousCount: number;
  change: number;
  changePercent: number;
  avgStock: number;
  sellableRate: number;
  slaRate: number;
  growth: 'up' | 'down' | 'stable';
}

export interface Anomaly {
  sku: string;
  type: 'stock_spike' | 'stock_drop' | 'price_change';
  severity: 'low' | 'medium' | 'high';
  value: number;
  expected: number;
  deviation: number;
  category: string;
}

export interface DataQualityReport {
  totalSKUs: number;
  completeRecords: number;
  incompleteRecords: number;
  missingTitle: number;
  missingContent: number;
  missingImages: number;
  missingCategory: number;
  missingStock: number;
  qualityScore: number;
  issues: Array<{
    sku: string;
    field: string;
    severity: 'low' | 'medium' | 'high';
    description: string;
  }>;
}

export interface SLABreach {
  sku: string;
  title: string;
  category: string;
  stock: number;
  imageCount: number;
  hasContent: boolean;
  breachType: string[];
  severity: 'low' | 'medium' | 'high';
}