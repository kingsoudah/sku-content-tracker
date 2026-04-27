import { ProductData } from "../../types";
import { calculateSellableSKUs } from "../../utils/dataUtils";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, BarChart, Bar, XAxis, YAxis, CartesianGrid } from "recharts";

interface SellableTabProps {
  data: ProductData[];
  skuCount: number;
}

export function SellableTab({ data, skuCount }: SellableTabProps) {
  // Calculate sellable SKUs using the correct logic: Stock > 4
  const sellableResult = calculateSellableSKUs(data);
  
  const { sellableCount, lowStockCount, outOfStockCount, percentage } = sellableResult;

  const pieData = [
    { name: "Sellable (>4 stock)", value: sellableCount, color: "#10b981" },
    { name: "Low Stock (1-4)", value: lowStockCount, color: "#f59e0b" },
    { name: "Out of Stock", value: outOfStockCount, color: "#ef4444" },
  ];

  // Category-wise sellable rate
  const categorySellable: Record<string, { total: number; sellable: number }> = {};
  data.forEach(item => {
    const category = item["Main Category"] || "Uncategorized";
    if (!categorySellable[category]) {
      categorySellable[category] = { total: 0, sellable: 0 };
    }
    categorySellable[category].total++;
    // Sellable = Stock > 4
    if ((Number(item.Stock) || 0) > 4) {
      categorySellable[category].sellable++;
    }
  });

  const categoryChartData = Object.entries(categorySellable)
    .map(([name, { total, sellable }]) => ({
      name: name.length > 20 ? name.substring(0, 20) + "..." : name,
      sellable,
      nonSellable: total - sellable,
      rate: total > 0 ? ((sellable / total) * 100).toFixed(0) : 0,
    }))
    .sort((a, b) => b.sellable - a.sellable)
    .slice(0, 10);

  return (
    <div className="space-y-8">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-6">
          <p className="text-sm text-emerald-700 font-medium mb-1">Sellable SKUs</p>
          <p className="text-3xl font-bold text-emerald-800">{sellableCount.toLocaleString()}</p>
          <p className="text-xs text-emerald-600 mt-1">Stock &gt; 4 units</p>
        </div>

        <div className="bg-amber-50 border border-amber-200 rounded-xl p-6">
          <p className="text-sm text-amber-700 font-medium mb-1">Low Stock</p>
          <p className="text-3xl font-bold text-amber-800">{lowStockCount.toLocaleString()}</p>
          <p className="text-xs text-amber-600 mt-1">1-4 units in stock</p>
        </div>

        <div className="bg-red-50 border border-red-200 rounded-xl p-6">
          <p className="text-sm text-red-700 font-medium mb-1">Out of Stock</p>
          <p className="text-3xl font-bold text-red-800">{outOfStockCount.toLocaleString()}</p>
          <p className="text-xs text-red-600 mt-1">0 units in stock</p>
        </div>

        <div className="bg-indigo-50 border border-indigo-200 rounded-xl p-6">
          <p className="text-sm text-indigo-700 font-medium mb-1">Sellable Rate</p>
          <p className="text-3xl font-bold text-indigo-800">{percentage.toFixed(1)}%</p>
          <p className="text-xs text-indigo-600 mt-1">Of total SKUs</p>
        </div>
      </div>

      {/* Definition Box */}
      <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
        <p className="text-sm text-blue-800">
          <strong>Sellable Definition:</strong> A SKU is considered sellable if it has <strong>Stock &gt; 4 units</strong>.
          SKUs with 0-4 units in stock are considered non-sellable.
        </p>
      </div>

      {/* Main Metric Display */}
      <div className="bg-white rounded-xl border border-slate-200 p-8">
        <div className="text-center mb-8">
          <h3 className="text-lg font-semibold text-slate-800 mb-2">Overall Sellable Percentage</h3>
          <p className="text-6xl font-bold text-emerald-600">{percentage.toFixed(1)}%</p>
          <p className="text-slate-500 mt-2">
            {sellableCount.toLocaleString()} out of {skuCount.toLocaleString()} SKUs have sufficient stock (&gt;4 units)
          </p>
        </div>

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
                label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
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

      {/* Category-wise Sellable Rate */}
      <div className="bg-white rounded-xl border border-slate-200 p-6">
        <h3 className="text-lg font-semibold text-slate-800 mb-6">Sellable Rate by Category</h3>
        <div className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={categoryChartData} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis type="number" tick={{ fill: "#64748b", fontSize: 12 }} />
              <YAxis dataKey="name" type="category" tick={{ fill: "#64748b", fontSize: 10 }} width={120} />
              <Tooltip />
              <Bar dataKey="sellable" stackId="a" fill="#10b981" name="Sellable" />
              <Bar dataKey="nonSellable" stackId="a" fill="#f59e0b" name="Non-Sellable" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Category Table */}
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-200">
          <h3 className="text-lg font-semibold text-slate-800">Category Breakdown</h3>
        </div>
        <div className="overflow-x-auto max-h-96">
          <table className="w-full">
            <thead className="bg-slate-50 sticky top-0">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">Category</th>
                <th className="px-6 py-3 text-center text-xs font-medium text-slate-500 uppercase">Total</th>
                <th className="px-6 py-3 text-center text-xs font-medium text-slate-500 uppercase">Sellable</th>
                <th className="px-6 py-3 text-center text-xs font-medium text-slate-500 uppercase">Rate</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {Object.entries(categorySellable)
                .sort((a, b) => b[1].total - a[1].total)
                .map(([category, { total, sellable }]) => (
                  <tr key={category} className="hover:bg-slate-50">
                    <td className="px-6 py-4 text-sm font-medium text-slate-900">{category}</td>
                    <td className="px-6 py-4 text-sm text-center text-slate-600">{total.toLocaleString()}</td>
                    <td className="px-6 py-4 text-sm text-center text-emerald-600">{sellable.toLocaleString()}</td>
                    <td className="px-6 py-4 text-sm text-center">
                      <div className="flex items-center justify-center gap-2">
                        <div className="w-20 h-2 bg-slate-200 rounded-full overflow-hidden">
                          <div 
                            className="h-full bg-emerald-500"
                            style={{ width: `${(sellable / total) * 100}%` }}
                          />
                        </div>
                        <span className="text-slate-600">{((sellable / total) * 100).toFixed(0)}%</span>
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