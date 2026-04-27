import { UploadMetrics } from "../types";

interface UploadMetadata {
  id: string;
  timestamp: string;
  fileName: string;
  skuCount: number;
  metrics: UploadMetrics;
}

const STORAGE_KEY = 'product_analytics_uploads_metadata';

export function saveUploadMetadata(upload: { 
  id: string; 
  timestamp: Date; 
  fileName: string; 
  skuCount: number; 
  metrics: UploadMetrics;
}): void {
  const uploads = getUploadsMetadata();
  
  const metadata: UploadMetadata = {
    id: upload.id,
    timestamp: upload.timestamp.toISOString(),
    fileName: upload.fileName,
    skuCount: upload.skuCount,
    metrics: upload.metrics,
  };
  
  uploads.unshift(metadata);
  // Keep only last 10 uploads
  const trimmedUploads = uploads.slice(0, 10);
  
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(trimmedUploads));
  } catch {
    // If still too large, keep only last 3
    const minimalUploads = trimmedUploads.slice(0, 3).map(u => ({
      id: u.id,
      timestamp: u.timestamp,
      fileName: u.fileName,
      skuCount: u.skuCount,
      metrics: {
        totalSKUs: u.metrics.totalSKUs,
        totalStock: u.metrics.totalStock,
        avgStock: u.metrics.avgStock,
        sellableCount: u.metrics.sellableCount,
        slaCompliantCount: u.metrics.slaCompliantCount,
        categoryCount: u.metrics.categoryCount,
        dataQualityScore: u.metrics.dataQualityScore,
        categoryDistribution: {},
        statusDistribution: u.metrics.statusDistribution,
        stockDistribution: [],
      },
    }));
    localStorage.setItem(STORAGE_KEY, JSON.stringify(minimalUploads));
  }
}

export function getUploadsMetadata(): UploadMetadata[] {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) return [];
    return JSON.parse(stored);
  } catch {
    return [];
  }
}

export function clearUploads(): void {
  localStorage.removeItem(STORAGE_KEY);
}