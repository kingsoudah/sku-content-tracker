import { ProductData } from "../../types";
import { getAdvancedMetrics, getStatusDistribution, getStockDistribution } from "../../utils/dataUtils";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar } from "recharts";

interface AdvancedTabProps {
  data: ProductData[];
}

export function AdvancedTab({ data }: AdvancedTabProps) {
  const metrics = getAdvancedMetrics(data);
  const statusDist = getStatusDistribution(data);
  const stockDist = getStockDistribution(data);

  const radarData = [
    { subject: "Content Quality", A: Math.min(100, metrics.avgContentLength / 5), fullMark: 100 },
    { subject: "Title Quality", A: Math.min(100, metrics.avgTitleLength * 3), fullMark: 100 },
    { subject: "Image Coverage", A: Math.min(100, Number(metrics.avgImageCount) * 30), fullMark: 100 },
    { subject: "Category Depth", A: Math.min(100, Number(metrics.avgCategoryDepth) * 25), fullMark: 100 },
    { subject: "Data Completeness", A: 100 - ((metrics.productsWithNoImages + metrics.productsWithNoContent) / data.length) * 100, fullMark: 100 },
  ];

  const qualityScore = Math.round(
    (radarData.reduce((sum, item) => sum + item.A, 0) / radarData.length)
  );

  return (
    <div className="space-y-8">
      {/* Quality Score */}
      <div className="bg-white rounded-xl border border-slate-200 p-8">
        <div className="text-center mb-6">
          <h3 className="text-lg font-semibold text-slate-800 mb-2">Data Quality Score</h3>
          <div className="flex items-center justify-center gap-4">
            <div className="relative w-32 h-32">
              <svg className="w-32 h-32 transform -rotate-90">
                <circle cx="64" cy="64" r="56" stroke="#e2e8f0" strokeWidth="12" fill="none" />
                <circle 
                  cx="64" 
                  cy="64" 
                  r="56" 
                  stroke={qualityScore >= 80 ? "#10b981" : qualityScore >= 60 ? "#f59e0b" : "#ef4444"}
                  strokeWidth="12" 
                  fill="none"
                  strokeDasharray={`${qualityScore * 3.52} 352`}
                />
              </svg>
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="text-3xl font-bold text-slate-800">{qualityScore}</span>
              </div>
            </div>
          </div>
          <p className="text-slate-500 mt-2">
            {qualityScore >= 80 ? "Excellent data quality" : qualityScore >= 60 ? "Good data quality" : "Needs improvement"}
          </p>
        </div>
      </div>

      {/* Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white rounded-xl border border-slate-200 p-6">
          <p className="text-sm text-slate-500 mb-1">Avg Content Length</p>
          <p className="text-2xl font-bold text-slate-800">{metrics.avgContentLength}</p>
          <p className="text-xs text-slate-400">characters</p>
        </div>
        <div className="bg-white rounded-xl border border-slate-200 p-6">
          <p className="text-sm text-slate-500 mb-1">Avg Title Length</p>
          <p className="text-2xl font-bold text-slate-800">{metrics.avgTitleLength}</p>
          <p className="text-xs text-slate-400">characters</p>
        </div>
        <div className="bg-white rounded-xl border border-slate-200 p-6">
          <p className="text-sm text-slate-500 mb-1">Avg Images/SKU</p>
          <p className="text-2xl font-bold text-slate-800">{metrics.avgImageCount}</p>
          <p className="text-xs text-slate-400">images</p>
        </div>
        <div className="bg-white rounded-xl border border-slate-200 p-6">
          <p className="text-sm text-slate-500 mb-1">Avg Category Depth</p>
          <p className="text-2xl font-bold text-slate-800">{metrics.avgCategoryDepth}</p>
          <p className="text-xs text-slate-400">levels</p>
        </div>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl border border-slate-200 p-6">
          <h3 className="text-lg font-semibold text-slate-800 mb-4">Quality Radar</h3>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <RadarChart data={radarData}>
                <PolarGrid stroke="#e2e8f0" />
                <PolarAngleAxis dataKey="subject" tick={{ fill: "#64748b", fontSize: 11 }} />
                <PolarRadiusAxis angle={30} domain={[0, 100]} tick={{ fill: "#64748b", fontSize: 10 }} />
                <Radar name="Quality" dataKey="A" stroke="#6366f1" fill="#6366f1" fillOpacity={0.5} />
              </RadarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 p-6">
          <h3 className="text-lg font-semibold text-slate-800 mb-4">Category Depth Distribution</h3>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={metrics.categoryDepthDistribution}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="name" tick={{ fill: "#64748b", fontSize: 12 }} />
                <YAxis tick={{ fill: "#64748b", fontSize: 12 }} />
                <Tooltip />
                <Bar dataKey="count" fill="#10b981" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Issues Summary */}
      <div className="bg-white rounded-xl border border-slate-200 p-6">
        <h3 className="text-lg font-semibold text-slate-800 mb-4">Data Issues Summary</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-red-50 rounded-lg p-4 border border-red-200">
            <p className="text-sm text-red-700 font-medium">Missing Images</p>
            <p className="text-2xl font-bold text-red-800">{metrics.productsWithNoImages}</p>
            <p className="text-xs text-red-600">SKUs with no image URLs</p>
          </div>
          <div className="bg-amber-50 rounded-lg p-4 border border-amber-200">
            <p className="text-sm text-amber-700 font-medium">Missing Content</p>
            <p className="text-2xl font-bold text-amber-800">{metrics.productsWithNoContent}</p>
            <p className="text-xs text-amber-600">SKUs with empty content</p>
          </div>
          <div className="bg-sky-50 rounded-lg p-4 border border-sky-200">
            <p className="text-sm text-sky-700 font-medium">Total Issues</p>
            <p className="text-2xl font-bold text-sky-800">{metrics.productsWithNoImages + metrics.productsWithNoContent}</p>
            <p className="text-xs text-sky-600">Combined data issues</p>
          </div>
        </div>
      </div>
    </div>
  );
}