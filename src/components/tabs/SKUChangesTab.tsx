import { ProductData, UploadMetrics } from "../../types";
import { TrendingUp, TrendingDown, Minus, Clock, ArrowRight } from "lucide-react";

interface SKUChangesTabProps {
  data: ProductData[];
  skuCount: number;
  uploadHistory: Array<{
    id: string;
    timestamp: Date;
    fileName: string;
    skuCount: number;
    metrics: UploadMetrics;
  }>;
  currentMetrics: UploadMetrics | null;
  previousMetrics: UploadMetrics | null;
}

export function SKUChangesTab({ 
  skuCount, 
  uploadHistory, 
  currentMetrics, 
  previousMetrics 
}: SKUChangesTabProps) {
  if (!currentMetrics) {
    return (
      <div className="bg-white rounded-xl border border-slate-200 p-8 text-center">
        <p className="text-slate-500">No data available</p>
      </div>
    );
  }

  const skuChange = previousMetrics 
    ? currentMetrics.totalSKUs - previousMetrics.totalSKUs 
    : 0;
  const stockChange = previousMetrics 
    ? currentMetrics.totalStock - previousMetrics.totalStock 
    : 0;
  const sellableChange = previousMetrics 
    ? currentMetrics.sellableCount - previousMetrics.sellableCount 
    : 0;
  const slaChange = previousMetrics 
    ? currentMetrics.slaCompliantCount - previousMetrics.slaCompliantCount 
    : 0;

  return (
    <div className="space-y-8">
      {/* Upload History */}
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-200">
          <h3 className="text-lg font-semibold text-slate-800">Upload History</h3>
        </div>
        <div className="divide-y divide-slate-200">
          {uploadHistory.slice(0, 5).map((upload, index) => (
            <div key={upload.id} className="px-6 py-4 flex items-center justify-between hover:bg-slate-50">
              <div className="flex items-center gap-4">
                <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                  index === 0 ? "bg-emerald-100" : "bg-slate-100"
                }`}>
                  <Clock className={`w-5 h-5 ${index === 0 ? "text-emerald-600" : "text-slate-500"}`} />
                </div>
                <div>
                  <p className="font-medium text-slate-800">
                    {upload.skuCount.toLocaleString()} SKUs
                    {index === 0 && <span className="ml-2 text-xs bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-full">Current</span>}
                  </p>
                  <p className="text-sm text-slate-500">
                    {new Date(upload.timestamp).toLocaleString()}
                  </p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-sm text-slate-600">
                  Quality: <span className="font-medium">{upload.metrics.dataQualityScore}%</span>
                </p>
                <p className="text-sm text-slate-600">
                  Sellable: <span className="font-medium">{upload.metrics.sellableCount.toLocaleString()}</span>
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Comparison Cards */}
      {previousMetrics && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="bg-white rounded-xl border border-slate-200 p-6">
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm text-slate-500">Total SKUs</p>
              {skuChange !== 0 && (
                <div className={`flex items-center gap-1 text-sm ${
                  skuChange > 0 ? "text-emerald-600" : "text-red-600"
                }`}>
                  {skuChange > 0 ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
                  {skuChange > 0 ? "+" : ""}{skuChange.toLocaleString()}
                </div>
              )}
            </div>
            <div className="flex items-center gap-2">
              <p className="text-2xl font-bold text-slate-900">{currentMetrics.totalSKUs.toLocaleString()}</p>
              <ArrowRight className="w-4 h-4 text-slate-400" />
              <p className="text-lg text-slate-500">{previousMetrics.totalSKUs.toLocaleString()}</p>
            </div>
          </div>

          <div className="bg-white rounded-xl border border-slate-200 p-6">
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm text-slate-500">Total Stock</p>
              {stockChange !== 0 && (
                <div className={`flex items-center gap-1 text-sm ${
                  stockChange > 0 ? "text-emerald-600" : "text-red-600"
                }`}>
                  {stockChange > 0 ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
                  {stockChange > 0 ? "+" : ""}{stockChange.toLocaleString()}
                </div>
              )}
            </div>
            <div className="flex items-center gap-2">
              <p className="text-2xl font-bold text-slate-900">{currentMetrics.totalStock.toLocaleString()}</p>
              <ArrowRight className="w-4 h-4 text-slate-400" />
              <p className="text-lg text-slate-500">{previousMetrics.totalStock.toLocaleString()}</p>
            </div>
          </div>

          <div className="bg-white rounded-xl border border-slate-200 p-6">
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm text-slate-500">Sellable SKUs</p>
              {sellableChange !== 0 && (
                <div className={`flex items-center gap-1 text-sm ${
                  sellableChange > 0 ? "text-emerald-600" : "text-red-600"
                }`}>
                  {sellableChange > 0 ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
                  {sellableChange > 0 ? "+" : ""}{sellableChange.toLocaleString()}
                </div>
              )}
            </div>
            <div className="flex items-center gap-2">
              <p className="text-2xl font-bold text-slate-900">{currentMetrics.sellableCount.toLocaleString()}</p>
              <ArrowRight className="w-4 h-4 text-slate-400" />
              <p className="text-lg text-slate-500">{previousMetrics.sellableCount.toLocaleString()}</p>
            </div>
          </div>

          <div className="bg-white rounded-xl border border-slate-200 p-6">
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm text-slate-500">SLA Compliant</p>
              {slaChange !== 0 && (
                <div className={`flex items-center gap-1 text-sm ${
                  slaChange > 0 ? "text-emerald-600" : "text-red-600"
                }`}>
                  {slaChange > 0 ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
                  {slaChange > 0 ? "+" : ""}{slaChange.toLocaleString()}
                </div>
              )}
            </div>
            <div className="flex items-center gap-2">
              <p className="text-2xl font-bold text-slate-900">{currentMetrics.slaCompliantCount.toLocaleString()}</p>
              <ArrowRight className="w-4 h-4 text-slate-400" />
              <p className="text-lg text-slate-500">{previousMetrics.slaCompliantCount.toLocaleString()}</p>
            </div>
          </div>
        </div>
      )}

      {/* No Previous Upload Message */}
      {!previousMetrics && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-6 text-center">
          <p className="text-amber-800">
            This is your first upload. Upload another file to see SKU changes and comparisons.
          </p>
        </div>
      )}

      {/* Metrics Summary */}
      <div className="bg-white rounded-xl border border-slate-200 p-6">
        <h3 className="text-lg font-semibold text-slate-800 mb-4">Current Upload Summary</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="text-center p-4 bg-slate-50 rounded-lg">
            <p className="text-2xl font-bold text-indigo-600">{skuCount.toLocaleString()}</p>
            <p className="text-sm text-slate-500">Total SKUs</p>
          </div>
          <div className="text-center p-4 bg-slate-50 rounded-lg">
            <p className="text-2xl font-bold text-emerald-600">{currentMetrics.categoryCount}</p>
            <p className="text-sm text-slate-500">Categories</p>
          </div>
          <div className="text-center p-4 bg-slate-50 rounded-lg">
            <p className="text-2xl font-bold text-amber-600">{currentMetrics.dataQualityScore}%</p>
            <p className="text-sm text-slate-500">Quality Score</p>
          </div>
          <div className="text-center p-4 bg-slate-50 rounded-lg">
            <p className="text-2xl font-bold text-slate-600">{currentMetrics.avgStock.toFixed(1)}</p>
            <p className="text-sm text-slate-500">Avg Stock</p>
          </div>
        </div>
      </div>
    </div>
  );
}