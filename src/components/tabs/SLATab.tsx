import { useState } from "react";
import { ProductData } from "../../types";
import { calculateSLAAdherence, getSLADetails } from "../../utils/dataUtils";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, BarChart, Bar, XAxis, YAxis, CartesianGrid } from "recharts";

interface SLATabProps {
  data: ProductData[];
  skuCount: number;
}

export function SLATab({ data, skuCount }: SLATabProps) {
  const [filter, setFilter] = useState<"all" | "compliant" | "non-compliant">("all");
  
  // Calculate SLA adherence using: SLA Compliant / Sellable SKUs
  const slaResult = calculateSLAAdherence(data);
  const { 
    compliantAndSellableCount,
    sellableCount, 
    percentage, 
    missingImages, 
    missingContent, 
    missingBoth 
  } = slaResult;
  
  const slaDetails = getSLADetails(data);
  
  const filteredDetails = slaDetails.filter(item => {
    if (filter === "all") return true;
    if (filter === "compliant") return item.isSLACompliant;
    if (filter === "non-compliant") return !item.isSLACompliant;
    return true;
  });

  // Pie chart showing SLA Compliant vs Non-Compliant among Sellable SKUs
  const pieData = [
    { name: "SLA Compliant", value: compliantAndSellableCount, color: "#10b981" },
    { name: "Non-Compliant", value: sellableCount - compliantAndSellableCount, color: "#ef4444" },
  ];

  // Category-wise SLA rate (SLA Compliant / Sellable SKUs per category)
  const categorySLA: Record<string, { 
    total: number; 
    sellable: number; 
    compliantAndSellable: number;
    nonCompliantSellable: number;
  }> = {};
  
  data.forEach(item => {
    const category = item["Main Category"] || "Uncategorized";
    if (!categorySLA[category]) {
      categorySLA[category] = { total: 0, sellable: 0, compliantAndSellable: 0, nonCompliantSellable: 0 };
    }
    categorySLA[category].total++;
    
    const imageUrl = String(item["Image URL"] || "");
    const imageCount = imageUrl.split(/[;,|\n]/).filter(url => url.trim().length > 0).length;
    const hasContent = Boolean(item.Content && String(item.Content).trim().length > 0);
    const stock = Number(item.Stock) || 0;
    const isSellable = stock > 4;
    const isSLACompliant = imageCount >= 2 && hasContent;
    
    if (isSellable) {
      categorySLA[category].sellable++;
      if (isSLACompliant) {
        categorySLA[category].compliantAndSellable++;
      } else {
        categorySLA[category].nonCompliantSellable++;
      }
    }
  });

  const categoryChartData = Object.entries(categorySLA)
    .filter(([, { sellable }]) => sellable > 0)
    .map(([name, { sellable, compliantAndSellable, nonCompliantSellable }]) => ({
      name: name.length > 20 ? name.substring(0, 20) + "..." : name,
      compliantAndSellable,
      nonCompliantSellable,
      rate: sellable > 0 ? ((compliantAndSellable / sellable) * 100).toFixed(1) : "0",
      sellable,
    }))
    .sort((a, b) => b.sellable - a.sellable)
    .slice(0, 10);

  return (
    <div className="space-y-8">
      {/* Definition Box - Prominent */}
      <div className="bg-indigo-50 border-2 border-indigo-200 rounded-xl p-6">
        <h3 className="text-lg font-bold text-indigo-800 mb-2">SLA Adherence Rate Formula</h3>
        <div className="flex items-center gap-3 text-xl">
          <span className="bg-white px-4 py-2 rounded-lg border border-indigo-200 font-mono font-bold text-emerald-600">
            {compliantAndSellableCount.toLocaleString()}
          </span>
          <span className="text-indigo-600 font-bold">÷</span>
          <span className="bg-white px-4 py-2 rounded-lg border border-indigo-200 font-mono font-bold text-cyan-600">
            {sellableCount.toLocaleString()}
          </span>
          <span className="text-indigo-600 font-bold">=</span>
          <span className="bg-indigo-600 text-white px-4 py-2 rounded-lg font-mono font-bold">
            {percentage.toFixed(1)}%
          </span>
        </div>
        <div className="mt-3 text-sm text-indigo-700">
          <strong>SLA Compliant:</strong> Has 2+ image URLs AND non-empty Content | 
          <strong className="ml-2">Sellable:</strong> Stock &gt; 4 units
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-6">
          <p className="text-sm text-emerald-700 font-medium mb-1">SLA Compliant (Sellable)</p>
          <p className="text-3xl font-bold text-emerald-800">{compliantAndSellableCount.toLocaleString()}</p>
          <p className="text-xs text-emerald-600 mt-1">Sellable SKUs meeting SLA</p>
        </div>

        <div className="bg-cyan-50 border border-cyan-200 rounded-xl p-6">
          <p className="text-sm text-cyan-700 font-medium mb-1">Total Sellable SKUs</p>
          <p className="text-3xl font-bold text-cyan-800">{sellableCount.toLocaleString()}</p>
          <p className="text-xs text-cyan-600 mt-1">Stock &gt; 4 units</p>
        </div>

        <div className="bg-red-50 border border-red-200 rounded-xl p-6">
          <p className="text-sm text-red-700 font-medium mb-1">Non-Compliant (Sellable)</p>
          <p className="text-3xl font-bold text-red-800">{(sellableCount - compliantAndSellableCount).toLocaleString()}</p>
          <p className="text-xs text-red-600 mt-1">Sellable but missing SLA</p>
        </div>

        <div className="bg-indigo-50 border-2 border-indigo-300 rounded-xl p-6">
          <p className="text-sm text-indigo-700 font-medium mb-1">SLA Adherence Rate</p>
          <p className="text-3xl font-bold text-indigo-800">{percentage.toFixed(1)}%</p>
          <p className="text-xs text-indigo-600 mt-1">Compliant ÷ Sellable</p>
        </div>
      </div>

      {/* Breakdown Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white rounded-xl border border-slate-200 p-6">
          <p className="text-sm text-slate-500 mb-2">Missing Images Only</p>
          <p className="text-2xl font-bold text-amber-600">{missingImages.toLocaleString()}</p>
          <p className="text-xs text-slate-500 mt-1">Has content but &lt;2 images</p>
        </div>
        <div className="bg-white rounded-xl border border-slate-200 p-6">
          <p className="text-sm text-slate-500 mb-2">Missing Content Only</p>
          <p className="text-2xl font-bold text-orange-600">{missingContent.toLocaleString()}</p>
          <p className="text-xs text-slate-500 mt-1">Has 2+ images but no content</p>
        </div>
        <div className="bg-white rounded-xl border border-slate-200 p-6">
          <p className="text-sm text-slate-500 mb-2">Missing Both</p>
          <p className="text-2xl font-bold text-red-600">{missingBoth.toLocaleString()}</p>
          <p className="text-xs text-slate-500 mt-1">No images and no content</p>
        </div>
      </div>

      {/* Main Chart */}
      <div className="bg-white rounded-xl border border-slate-200 p-6">
        <h3 className="text-lg font-semibold text-slate-800 mb-2">SLA Adherence Distribution</h3>
        <p className="text-sm text-slate-500 mb-4">Among {sellableCount.toLocaleString()} Sellable SKUs (Stock &gt; 4)</p>
        <div className="h-72">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={pieData}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={100}
                dataKey="value"
                label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(1)}%`}
              >
                {pieData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Category-wise SLA Rate */}
      <div className="bg-white rounded-xl border border-slate-200 p-6">
        <h3 className="text-lg font-semibold text-slate-800 mb-2">SLA Rate by Category</h3>
        <p className="text-sm text-slate-500 mb-6">SLA Compliant ÷ Sellable SKUs per category</p>
        <div className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={categoryChartData} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis type="number" tick={{ fill: "#64748b", fontSize: 12 }} />
              <YAxis dataKey="name" type="category" tick={{ fill: "#64748b", fontSize: 10 }} width={120} />
              <Tooltip 
                formatter={(value, name) => {
                  if (name === "compliantAndSellable") return [value, "SLA Compliant"];
                  if (name === "nonCompliantSellable") return [value, "Non-Compliant"];
                  return [value, name];
                }}
              />
              <Bar dataKey="compliantAndSellable" stackId="a" fill="#10b981" name="SLA Compliant" />
              <Bar dataKey="nonCompliantSellable" stackId="a" fill="#ef4444" name="Non-Compliant" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Category Table */}
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-200">
          <h3 className="text-lg font-semibold text-slate-800">Category Breakdown</h3>
          <p className="text-sm text-slate-500">SLA Adherence Rate = SLA Compliant ÷ Sellable SKUs</p>
        </div>
        <div className="overflow-x-auto max-h-96">
          <table className="w-full">
            <thead className="bg-slate-50 sticky top-0">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">Category</th>
                <th className="px-6 py-3 text-center text-xs font-medium text-slate-500 uppercase">Total SKUs</th>
                <th className="px-6 py-3 text-center text-xs font-medium text-slate-500 uppercase">Sellable</th>
                <th className="px-6 py-3 text-center text-xs font-medium text-slate-500 uppercase">SLA Compliant</th>
                <th className="px-6 py-3 text-center text-xs font-medium text-slate-500 uppercase">Non-Compliant</th>
                <th className="px-6 py-3 text-center text-xs font-medium text-slate-500 uppercase">SLA Rate</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {Object.entries(categorySLA)
                .filter(([, { sellable }]) => sellable > 0)
                .sort((a, b) => b[1].sellable - a[1].sellable)
                .map(([category, { total, sellable, compliantAndSellable, nonCompliantSellable }]) => (
                  <tr key={category} className="hover:bg-slate-50">
                    <td className="px-6 py-4 text-sm font-medium text-slate-900">{category}</td>
                    <td className="px-6 py-4 text-sm text-center text-slate-600">{total.toLocaleString()}</td>
                    <td className="px-6 py-4 text-sm text-center text-cyan-600 font-medium">{sellable.toLocaleString()}</td>
                    <td className="px-6 py-4 text-sm text-center text-emerald-600 font-medium">{compliantAndSellable.toLocaleString()}</td>
                    <td className="px-6 py-4 text-sm text-center text-red-600">{nonCompliantSellable.toLocaleString()}</td>
                    <td className="px-6 py-4 text-sm text-center">
                      <div className="flex items-center justify-center gap-2">
                        <div className="w-20 h-2 bg-slate-200 rounded-full overflow-hidden">
                          <div 
                            className="h-full bg-emerald-500"
                            style={{ width: `${sellable > 0 ? (compliantAndSellable / sellable) * 100 : 0}%` }}
                          />
                        </div>
                        <span className="text-slate-700 font-medium min-w-[50px]">
                          {sellable > 0 ? ((compliantAndSellable / sellable) * 100).toFixed(1) : 0}%
                        </span>
                      </div>
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Filter Buttons */}
      <div className="flex gap-2 flex-wrap">
        <button
          onClick={() => setFilter("all")}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
            filter === "all" 
              ? "bg-indigo-600 text-white" 
              : "bg-white border border-slate-300 text-slate-600 hover:bg-slate-50"
          }`}
        >
          All ({slaDetails.length})
        </button>
        <button
          onClick={() => setFilter("compliant")}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
            filter === "compliant" 
              ? "bg-emerald-600 text-white" 
              : "bg-white border border-slate-300 text-slate-600 hover:bg-slate-50"
          }`}
        >
          SLA Compliant ({slaDetails.filter(d => d.isSLACompliant).length})
        </button>
        <button
          onClick={() => setFilter("non-compliant")}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
            filter === "non-compliant" 
              ? "bg-red-600 text-white" 
              : "bg-white border border-slate-300 text-slate-600 hover:bg-slate-50"
          }`}
        >
          Non-Compliant ({slaDetails.filter(d => !d.isSLACompliant).length})
        </button>
      </div>

      {/* SKU List */}
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-200">
          <h3 className="text-lg font-semibold text-slate-800">SKU Details</h3>
          <p className="text-sm text-slate-500">Showing {Math.min(filteredDetails.length, 100)} of {filteredDetails.length}</p>
        </div>
        <div className="overflow-x-auto max-h-96">
          <table className="w-full">
            <thead className="bg-slate-50 sticky top-0">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">SKU</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">Title</th>
                <th className="px-6 py-3 text-center text-xs font-medium text-slate-500 uppercase">Stock</th>
                <th className="px-6 py-3 text-center text-xs font-medium text-slate-500 uppercase">Images</th>
                <th className="px-6 py-3 text-center text-xs font-medium text-slate-500 uppercase">Content</th>
                <th className="px-6 py-3 text-center text-xs font-medium text-slate-500 uppercase">Sellable</th>
                <th className="px-6 py-3 text-center text-xs font-medium text-slate-500 uppercase">SLA Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {filteredDetails.slice(0, 100).map((item, index) => (
                <tr key={index} className="hover:bg-slate-50">
                  <td className="px-6 py-4 text-sm font-medium text-slate-900">{item.sku || "-"}</td>
                  <td className="px-6 py-4 text-sm text-slate-700 max-w-xs truncate">{item.title || "-"}</td>
                  <td className="px-6 py-4 text-sm text-center">
                    <span className={`px-2 py-1 rounded text-xs font-medium ${
                      item.stock > 4 ? "bg-emerald-100 text-emerald-700" :
                      item.stock > 0 ? "bg-amber-100 text-amber-700" :
                      "bg-red-100 text-red-700"
                    }`}>
                      {item.stock}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm text-center">
                    <span className={`px-2 py-1 rounded text-xs font-medium ${
                      item.imageCount >= 2 ? "bg-emerald-100 text-emerald-700" : "bg-red-100 text-red-700"
                    }`}>
                      {item.imageCount}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm text-center">
                    {item.hasContent ? (
                      <span className="text-emerald-600">✓</span>
                    ) : (
                      <span className="text-red-600">✗</span>
                    )}
                  </td>
                  <td className="px-6 py-4 text-sm text-center">
                    {item.isSellable ? (
                      <span className="px-2 py-1 rounded text-xs font-medium bg-cyan-100 text-cyan-700">Yes</span>
                    ) : (
                      <span className="px-2 py-1 rounded text-xs font-medium bg-slate-100 text-slate-600">No</span>
                    )}
                  </td>
                  <td className="px-6 py-4 text-sm text-center">
                    {item.isSLACompliant ? (
                      <span className="px-2 py-1 rounded text-xs font-medium bg-emerald-100 text-emerald-700">Compliant</span>
                    ) : (
                      <span className="px-2 py-1 rounded text-xs font-medium bg-red-100 text-red-700">Non-Compliant</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}