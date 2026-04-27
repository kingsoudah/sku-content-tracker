import { ProductData, UploadMetrics, CategoryMetric, Anomaly, DataQualityReport, SLABreach, StockRange } from "../types";

export function calculateOverviewStats(data: ProductData[]) {
  const totalSKUs = data.length;
  
  const totalStock = data.reduce((sum, item) => {
    const stock = Number(item.Stock) || 0;
    return sum + stock;
  }, 0);
  
  const avgStock = totalSKUs > 0 ? (totalStock / totalSKUs).toFixed(1) : "0";
  
  const uniqueMainCategories = new Set(data.map(item => item["Main Category"]).filter(Boolean));
  const uniqueSubcategories = new Set(data.map(item => item.Subcategory).filter(Boolean));
  
  const statusCounts: Record<string, number> = {};
  data.forEach(item => {
    const status = item.Status || "Unknown";
    statusCounts[status] = (statusCounts[status] || 0) + 1;
  });

  const categoryCounts: Record<string, number> = {};
  data.forEach(item => {
    const category = item["Main Category"] || "Uncategorized";
    categoryCounts[category] = (categoryCounts[category] || 0) + 1;
  });

  return {
    totalSKUs,
    totalStock,
    avgStock,
    uniqueCategories: uniqueMainCategories.size,
    uniqueSubcategories: uniqueSubcategories.size,
    statusCounts,
    categoryCounts,
  };
}

export function parseCategories(item: ProductData): string[] {
  const categories: string[] = [];
  if (item["Main Category"]) categories.push(item["Main Category"]);
  if (item.Subcategory) categories.push(item.Subcategory);
  if (item["Sub-sub-category"]) categories.push(item["Sub-sub-category"]);
  if (item["sub-sub-sub-category"]) categories.push(item["sub-sub-sub-category"]);
  return categories;
}

export function getCategoryDistribution(data: ProductData[]) {
  const distribution: Record<string, number> = {};
  data.forEach(item => {
    const category = item["Main Category"] || "Uncategorized";
    distribution[category] = (distribution[category] || 0) + 1;
  });
  return Object.entries(distribution)
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count);
}

export function getCategoryHierarchy(data: ProductData[]): Record<string, Record<string, number>> {
  const hierarchy: Record<string, Record<string, number>> = {};
  
  data.forEach(item => {
    if (item["Main Category"]) {
      if (!hierarchy["Level 1"]) hierarchy["Level 1"] = {};
      hierarchy["Level 1"][item["Main Category"]] = (hierarchy["Level 1"][item["Main Category"]] || 0) + 1;
    }
    
    if (item.Subcategory) {
      if (!hierarchy["Level 2"]) hierarchy["Level 2"] = {};
      hierarchy["Level 2"][item.Subcategory] = (hierarchy["Level 2"][item.Subcategory] || 0) + 1;
    }
    
    if (item["Sub-sub-category"]) {
      if (!hierarchy["Level 3"]) hierarchy["Level 3"] = {};
      hierarchy["Level 3"][item["Sub-sub-category"]] = (hierarchy["Level 3"][item["Sub-sub-category"]] || 0) + 1;
    }
    
    if (item["sub-sub-sub-category"]) {
      if (!hierarchy["Level 4"]) hierarchy["Level 4"] = {};
      hierarchy["Level 4"][item["sub-sub-sub-category"]] = (hierarchy["Level 4"][item["sub-sub-sub-category"]] || 0) + 1;
    }
  });
  
  return hierarchy;
}

export function getSubcategoryDistribution(data: ProductData[], mainCategory?: string) {
  const distribution: Record<string, number> = {};
  const filteredData = mainCategory 
    ? data.filter(item => item["Main Category"] === mainCategory)
    : data;
    
  filteredData.forEach(item => {
    const subcategory = item.Subcategory || "Uncategorized";
    distribution[subcategory] = (distribution[subcategory] || 0) + 1;
  });
  return Object.entries(distribution)
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count);
}

export function getStockDistribution(data: ProductData[]): StockRange[] {
  const ranges = [
    { range: "0 (Out of Stock)", min: 0, max: 0 },
    { range: "1-4", min: 1, max: 4 },
    { range: "5-10", min: 5, max: 10 },
    { range: "11-20", min: 11, max: 20 },
    { range: "21-50", min: 21, max: 50 },
    { range: "50+", min: 51, max: Infinity },
  ];

  return ranges.map(range => ({
    range: range.range,
    count: data.filter(item => {
      const stock = Number(item.Stock) || 0;
      return stock >= range.min && stock <= range.max;
    }).length,
  }));
}

export function getSLADetails(data: ProductData[]) {
  return data.map(item => {
    const imageUrl = String(item["Image URL"] || "");
    const imageUrls = imageUrl.split(/[;,|\n]/).filter(url => url.trim().length > 0);
    const imageCount = imageUrls.length;
    const hasImages = imageCount >= 2;
    const hasContent = Boolean(item.Content && String(item.Content).trim().length > 0);
    const isSLACompliant = hasImages && hasContent;
    const stock = Number(item.Stock) || 0;
    const isSellable = stock > 4;

    return {
      sku: item.Sku,
      title: item.Title,
      imageCount,
      hasImages,
      hasContent,
      stock,
      isSLACompliant,
      isSellable,
      category: item["Main Category"] || "Uncategorized",
    };
  });
}

/**
 * Calculate SLA Adherence Rate
 * SLA Adherence Rate = SLA Compliant SKUs / Sellable SKUs
 * 
 * Where:
 * - SLA Compliant = Has 2+ image URLs AND Content is not empty
 * - Sellable = Stock > 4
 */
export function calculateSLAAdherence(data: ProductData[]): {
  compliantCount: number;
  nonCompliantCount: number;
  sellableCount: number;
  compliantAndSellableCount: number;
  percentage: number;
  missingImages: number;
  missingContent: number;
  missingBoth: number;
} {
  let compliantCount = 0;
  let sellableCount = 0;
  let compliantAndSellableCount = 0;
  let missingImages = 0;
  let missingContent = 0;
  let missingBoth = 0;

  data.forEach(item => {
    const imageUrl = String(item["Image URL"] || "");
    const imageUrls = imageUrl.split(/[;,|\n]/).filter(url => url.trim().length > 0);
    const imageCount = imageUrls.length;
    const hasImages = imageCount >= 2;
    const hasContent = Boolean(item.Content && String(item.Content).trim().length > 0);
    const stock = Number(item.Stock) || 0;
    const isSellable = stock > 4;
    const isSLACompliant = hasImages && hasContent;

    // Count total SLA compliant (regardless of sellable status)
    if (isSLACompliant) {
      compliantCount++;
    }

    // Count sellable SKUs (Stock > 4)
    if (isSellable) {
      sellableCount++;
      
      // Count SLA compliant among sellable
      if (isSLACompliant) {
        compliantAndSellableCount++;
      }
    }

    // Track non-compliance reasons (for all SKUs)
    if (!isSLACompliant) {
      if (!hasImages && !hasContent) {
        missingBoth++;
      } else if (!hasImages) {
        missingImages++;
      } else {
        missingContent++;
      }
    }
  });

  // SLA Adherence Rate = SLA Compliant / Sellable SKUs
  const percentage = sellableCount > 0 ? (compliantAndSellableCount / sellableCount) * 100 : 0;
  const nonCompliantCount = sellableCount - compliantAndSellableCount;

  return {
    compliantCount,
    nonCompliantCount,
    sellableCount,
    compliantAndSellableCount,
    percentage,
    missingImages,
    missingContent,
    missingBoth,
  };
}

/**
 * Calculate Sellable SKUs
 * Sellable = Stock > 4
 */
export function calculateSellableSKUs(data: ProductData[]): {
  sellableCount: number;
  lowStockCount: number;
  outOfStockCount: number;
  percentage: number;
} {
  let sellableCount = 0;
  let lowStockCount = 0;
  let outOfStockCount = 0;

  data.forEach(item => {
    const stock = Number(item.Stock) || 0;
    if (stock > 4) {
      sellableCount++;
    } else if (stock > 0) {
      lowStockCount++;
    } else {
      outOfStockCount++;
    }
  });

  const total = data.length;
  const percentage = total > 0 ? (sellableCount / total) * 100 : 0;

  return {
    sellableCount,
    lowStockCount,
    outOfStockCount,
    percentage,
  };
}

export function getAdvancedMetrics(data: ProductData[]) {
  const avgContentLength = data.length > 0
    ? Math.round(data.reduce((sum, item) => sum + (String(item.Content || "").length), 0) / data.length)
    : 0;

  const avgTitleLength = data.length > 0
    ? Math.round(data.reduce((sum, item) => sum + (String(item.Title || "").length), 0) / data.length)
    : 0;

  const totalImages = data.reduce((sum, item) => {
    const imageUrl = String(item["Image URL"] || "");
    return sum + imageUrl.split(/[;,|\n]/).filter(url => url.trim().length > 0).length;
  }, 0);
  const avgImageCount = data.length > 0 ? (totalImages / data.length).toFixed(1) : "0";

  const categoryDepths = data.map(item => {
    let depth = 0;
    if (item["Main Category"]) depth++;
    if (item.Subcategory) depth++;
    if (item["Sub-sub-category"]) depth++;
    if (item["sub-sub-sub-category"]) depth++;
    return depth;
  });
  
  const avgCategoryDepth = data.length > 0
    ? (categoryDepths.reduce((a, b) => a + b, 0) / data.length).toFixed(1)
    : "0";

  const categoryDepthDistribution = [
    { name: "0 Levels", count: data.filter(item => !item["Main Category"]).length },
    { name: "1 Level", count: data.filter(item => item["Main Category"] && !item.Subcategory).length },
    { name: "2 Levels", count: data.filter(item => item.Subcategory && !item["Sub-sub-category"]).length },
    { name: "3 Levels", count: data.filter(item => item["Sub-sub-category"] && !item["sub-sub-sub-category"]).length },
    { name: "4 Levels", count: data.filter(item => item["sub-sub-sub-category"]).length },
  ].filter(item => item.count > 0);

  const productsWithNoImages = data.filter(item => {
    const imageUrl = String(item["Image URL"] || "");
    return imageUrl.split(/[;,|\n]/).filter(url => url.trim().length > 0).length === 0;
  }).length;

  const productsWithNoContent = data.filter(item => !item.Content || String(item.Content).trim().length === 0).length;

  return {
    avgContentLength,
    avgTitleLength,
    avgImageCount,
    avgCategoryDepth,
    categoryDepthDistribution,
    productsWithNoImages,
    productsWithNoContent,
  };
}

export function getStatusDistribution(data: ProductData[]) {
  const distribution: Record<string, number> = {};
  data.forEach(item => {
    const status = item.Status || "Unknown";
    distribution[status] = (distribution[status] || 0) + 1;
  });
  return Object.entries(distribution)
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count);
}

export function calculateUploadMetrics(data: ProductData[]): UploadMetrics {
  const totalSKUs = data.length;
  const totalStock = data.reduce((sum, item) => sum + (Number(item.Stock) || 0), 0);
  const avgStock = totalSKUs > 0 ? totalStock / totalSKUs : 0;
  
  const sellableResult = calculateSellableSKUs(data);
  const sellableCount = sellableResult.sellableCount;
  
  const slaResult = calculateSLAAdherence(data);
  const slaCompliantCount = slaResult.compliantAndSellableCount;
  
  const mainCategories = new Set(data.map(item => item["Main Category"]).filter(Boolean));
  const categoryCount = mainCategories.size;
  
  const qualityReport = calculateDataQuality(data);
  
  const categoryDistribution: Record<string, number> = {};
  data.forEach(item => {
    const cat = item["Main Category"] || "Uncategorized";
    categoryDistribution[cat] = (categoryDistribution[cat] || 0) + 1;
  });
  
  const statusDistribution: Record<string, number> = {};
  data.forEach(item => {
    const status = item.Status || "Unknown";
    statusDistribution[status] = (statusDistribution[status] || 0) + 1;
  });
  
  const stockDistribution = getStockDistribution(data);

  return {
    totalSKUs,
    totalStock,
    avgStock,
    sellableCount,
    slaCompliantCount,
    categoryCount,
    dataQualityScore: qualityReport.qualityScore,
    categoryDistribution,
    statusDistribution,
    stockDistribution,
  };
}

export function calculateDataQuality(data: ProductData[]): DataQualityReport {
  const totalSKUs = data.length;
  const issues: { sku: string; field: string; severity: 'low' | 'medium' | 'high'; description: string }[] = [];
  
  const missingTitle = data.filter(item => !item.Title || String(item.Title).trim().length === 0).length;
  const missingContent = data.filter(item => !item.Content || String(item.Content).trim().length === 0).length;
  const missingImages = data.filter(item => {
    const imageUrl = String(item["Image URL"] || "");
    return imageUrl.split(/[;,|\n]/).filter(url => url.trim().length > 0).length === 0;
  }).length;
  const missingCategory = data.filter(item => !item["Main Category"]).length;
  const missingStock = data.filter(item => item.Stock === undefined || item.Stock === null).length;
  
  let issueCount = 0;
  for (const item of data) {
    if (issueCount >= 100) break;
    if (!item.Title || String(item.Title).trim().length === 0) {
      issues.push({ sku: item.Sku, field: 'Title', severity: 'high', description: 'Missing title' });
      issueCount++;
    }
    if (!item.Content || String(item.Content).trim().length === 0) {
      issues.push({ sku: item.Sku, field: 'Content', severity: 'medium', description: 'Missing content' });
      issueCount++;
    }
    const imageUrl = String(item["Image URL"] || "");
    if (imageUrl.split(/[;,|\n]/).filter(url => url.trim().length > 0).length === 0) {
      issues.push({ sku: item.Sku, field: 'Image URL', severity: 'high', description: 'Missing images' });
      issueCount++;
    }
    if (!item["Main Category"]) {
      issues.push({ sku: item.Sku, field: 'Main Category', severity: 'medium', description: 'Missing category' });
      issueCount++;
    }
  }
  
  const completeRecords = data.filter(item => {
    const hasTitle = item.Title && String(item.Title).trim().length > 0;
    const hasContent = item.Content && String(item.Content).trim().length > 0;
    const imageUrl = String(item["Image URL"] || "");
    const hasImages = imageUrl.split(/[;,|\n]/).filter(url => url.trim().length > 0).length > 0;
    const hasCategory = Boolean(item["Main Category"]);
    return hasTitle && hasContent && hasImages && hasCategory;
  }).length;
  
  const incompleteRecords = totalSKUs - completeRecords;
  
  const titleScore = totalSKUs > 0 ? ((totalSKUs - missingTitle) / totalSKUs) * 25 : 0;
  const contentScore = totalSKUs > 0 ? ((totalSKUs - missingContent) / totalSKUs) * 25 : 0;
  const imageScore = totalSKUs > 0 ? ((totalSKUs - missingImages) / totalSKUs) * 25 : 0;
  const categoryScore = totalSKUs > 0 ? ((totalSKUs - missingCategory) / totalSKUs) * 25 : 0;
  const qualityScore = Math.round(titleScore + contentScore + imageScore + categoryScore);

  return {
    totalSKUs,
    completeRecords,
    incompleteRecords,
    missingTitle,
    missingContent,
    missingImages,
    missingCategory,
    missingStock,
    qualityScore,
    issues,
  };
}

export function detectAnomalies(data: ProductData[]): Anomaly[] {
  const anomalies: Anomaly[] = [];
  
  const stockValues = data.map(item => Number(item.Stock) || 0);
  const avgStock = stockValues.reduce((a, b) => a + b, 0) / stockValues.length;
  const variance = stockValues.reduce((sum, val) => sum + Math.pow(val - avgStock, 2), 0) / stockValues.length;
  const stdDev = Math.sqrt(variance);
  
  const threshold = avgStock + 2 * stdDev;
  
  for (const item of data) {
    const stock = Number(item.Stock) || 0;
    const category = item["Main Category"] || "Uncategorized";
    
    if (stdDev > 0 && stock > threshold) {
      anomalies.push({
        sku: item.Sku,
        type: 'stock_spike',
        severity: stock > avgStock * 3 ? 'high' : 'medium',
        value: stock,
        expected: Math.round(avgStock),
        deviation: avgStock > 0 ? Math.round(((stock - avgStock) / avgStock) * 100) : 0,
        category,
      });
    }
    
    if (stock === 0 && avgStock > 10) {
      anomalies.push({
        sku: item.Sku,
        type: 'stock_drop',
        severity: 'high',
        value: 0,
        expected: Math.round(avgStock),
        deviation: -100,
        category,
      });
    }
    
    if (anomalies.length >= 50) break;
  }
  
  return anomalies;
}

export function detectSLABreaches(data: ProductData[]): SLABreach[] {
  const breaches: SLABreach[] = [];
  
  for (const item of data) {
    const imageUrl = String(item["Image URL"] || "");
    const imageCount = imageUrl.split(/[;,|\n]/).filter(url => url.trim().length > 0).length;
    const hasContent = Boolean(item.Content && String(item.Content).trim().length > 0);
    const stock = Number(item.Stock) || 0;
    
    const breachType: string[] = [];
    
    if (imageCount < 2) breachType.push(`Only ${imageCount} image(s)`);
    if (!hasContent) breachType.push('Missing content');
    if (stock === 0) breachType.push('Out of stock');
    
    if (breachType.length > 0) {
      const severity = breachType.length >= 3 ? 'high' : breachType.length >= 2 ? 'medium' : 'low';
      breaches.push({
        sku: item.Sku,
        title: item.Title,
        category: item["Main Category"] || "Uncategorized",
        stock,
        imageCount,
        hasContent,
        breachType,
        severity,
      });
    }
  }
  
  return breaches.sort((a, b) => {
    const severityOrder = { high: 0, medium: 1, low: 2 };
    return severityOrder[a.severity] - severityOrder[b.severity];
  });
}

export function calculateCategoryMetrics(data: ProductData[]): CategoryMetric[] {
  const categoryData: Record<string, { items: ProductData[] }> = {};
  
  data.forEach(item => {
    const category = item["Main Category"] || "Uncategorized";
    if (!categoryData[category]) {
      categoryData[category] = { items: [] };
    }
    categoryData[category].items.push(item);
  });
  
  return Object.entries(categoryData).map(([name, { items }]) => {
    const count = items.length;
    const avgStock = items.reduce((sum, item) => sum + (Number(item.Stock) || 0), 0) / count;
    
    // Sellable = Stock > 4
    const sellableItems = items.filter(item => (Number(item.Stock) || 0) > 4);
    const sellableCount = sellableItems.length;
    
    // SLA Compliant = 2+ images AND has content (among sellable items)
    const slaCompliantAmongSellable = sellableItems.filter(item => {
      const imageUrl = String(item["Image URL"] || "");
      const imageCount = imageUrl.split(/[;,|\n]/).filter(url => url.trim().length > 0).length;
      const hasContent = Boolean(item.Content && String(item.Content).trim().length > 0);
      return imageCount >= 2 && hasContent;
    }).length;
    
    // SLA Rate = SLA Compliant / Sellable SKUs
    const slaRate = sellableCount > 0 ? Math.round((slaCompliantAmongSellable / sellableCount) * 100) : 0;
    
    return {
      name,
      count,
      previousCount: count,
      change: 0,
      changePercent: 0,
      avgStock: Math.round(avgStock * 10) / 10,
      sellableRate: Math.round((sellableCount / count) * 100),
      slaRate,
      growth: 'stable' as const,
    };
  }).sort((a, b) => b.count - a.count);
}

export function generateCategoryHeatmapData(data: ProductData[]): Record<string, Record<string, number>> {
  const heatmap: Record<string, Record<string, number>> = {};
  
  data.forEach(item => {
    const mainCat = item["Main Category"] || "Uncategorized";
    const subCat = item.Subcategory || "No Subcategory";
    
    if (!heatmap[mainCat]) {
      heatmap[mainCat] = {};
    }
    heatmap[mainCat][subCat] = (heatmap[mainCat][subCat] || 0) + 1;
  });
  
  return heatmap;
}