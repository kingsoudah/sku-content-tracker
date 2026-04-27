import { useState } from "react";
import { ProductData } from "../../types";
import { getCategoryDistribution, getCategoryHierarchy } from "../../utils/dataUtils";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, BarChart, Bar, XAxis, YAxis, CartesianGrid } from "recharts";

interface CategoriesTabProps {
  data: ProductData[];
  skuCount: number;
}

export function CategoriesTab({ data, skuCount }: CategoriesTabProps) {
  const [selectedLevel, setSelectedLevel] = useState<number>(1);
  const categoryDist = getCategoryDistribution(data);
  const hierarchy = getCategoryHierarchy(data);

  const COLORS = ["#6366f1", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6", "#06b6d4", "#ec4899", "#84cc16"];

  const levelNames = ["Level 1", "Level 2", "Level 3", "Level 4"];
  const levelLabels = ["Main Category", "Subcategory", "Sub-sub-category", "sub-sub-sub-category"];

  const currentLevelData = hierarchy[levelNames[selectedLevel - 1]] || {};
  const levelChartData = Object.entries(currentLevelData)
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 15);

  return (
    <div className="space-y-8">
      {/* Level Selector */}
      <div className="bg-white rounded-xl border border-slate-200 p-6">
        <h3 className="text-lg font-semibold text-slate-800 mb-4">Category Level</h3>
        <div className="flex gap-2">
          {levelNames.map((level, index) => (
            <button
              key={level}
              onClick={() => setSelectedLevel(index + 1)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                selectedLevel === index + 1
                  ? "bg-indigo-600 text-white"
                  : "bg-slate-100 text-slate-600 hover:bg-slate-200"
              }`}
            >
              {levelLabels[index]}
            </button>
          ))}
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white rounded-xl border border-slate-200 p-6">
          <p className="text-sm text-slate-500 mb-1">Main Categories</p>
          <p className="text-3xl font-bold text-slate-900">
            {Object.keys(hierarchy["Level 1"] || {}).length}
          </p>
        </div>
        <div className="bg-white rounded-xl border border-slate-200 p-6">
          <p className="text-sm text-slate-500 mb-1">Subcategories</p>
          <p className="text-3xl font-bold text-slate-900">
            {Object.keys(hierarchy["Level 2"] || {}).length}
          </p>
        </div>
        <div className="bg-white rounded-xl border border-slate-200 p-6">
          <p className="text-sm text-slate-500 mb-1">Total Categories</p>
          <p className="text-3xl font-bold text-slate-900">
            {Object.values(hierarchy).reduce((sum, level) => sum + Object.keys(level).length, 0)}
          </p>
        </div>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl border border-slate-200 p-6">
          <h3 className="text-lg font-semibold text-slate-800 mb-4">
            {levelLabels[selectedLevel - 1]} Distribution
          </h3>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={levelChartData}
                  cx="50%"
                  cy="50%"
                  outerRadius={80}
                  dataKey="count"
                  label={({ name, percent }) => `${name.substring(0, 10)}...: ${(percent * 100).toFixed(0)}%`}
                >
                  {levelChartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 p-6">
          <h3 className="text-lg font-semibold text-slate-800 mb-4">Top Categories by Count</h3>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={levelChartData.slice(0, 8)} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis type="number" tick={{ fill: "#64748b", fontSize: 12 }} />
                <YAxis 
                  dataKey="name" 
                  type="category" 
                  tick={{ fill: "#64748b", fontSize: 10 }} 
                  width={100}
                  formatter={(value) => value.length > 15 ? value.substring(0, 15) + "..." : value}
                />
                <Tooltip />
                <Bar dataKey="count" fill="#6366f1" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Category Table */}
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-200">
          <h3 className="text-lg font-semibold text-slate-800">
            {levelLabels[selectedLevel - 1]} Breakdown
          </h3>
        </div>
        <div className="overflow-x-auto max-h-96">
          <table className="w-full">
            <thead className="bg-slate-50 sticky top-0">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">Category</th>
                <th className="px-6 py-3 text-center text-xs font-medium text-slate-500 uppercase">Count</th>
                <th className="px-6 py-3 text-center text-xs font-medium text-slate-500 uppercase">Percentage</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {Object.entries(currentLevelData)
                .sort((a, b) => b[1] - a[1])
                .map(([category, count]) => (
                  <tr key={category} className="hover:bg-slate-50">
                    <td className="px-6 py-4 text-sm font-medium text-slate-900">{category}</td>
                    <td className="px-6 py-4 text-sm text-center text-slate-600">{(count as number).toLocaleString()}</td>
                    <td className="px-6 py-4 text-sm text-center">
                      <div className="flex items-center justify-center gap-2">
                        <div className="w-24 h-2 bg-slate-200 rounded-full overflow-hidden">
                          <div 
                            className="h-full bg-indigo-600"
                            style={{ width: `${((count as number) / skuCount) * 100}%` }}
                          />
                        </div>
                        <span className="text-slate-600">{(((count as number) / skuCount) * 100).toFixed(1)}%</span>
                      </div>
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