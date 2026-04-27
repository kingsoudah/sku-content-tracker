import { useState, useEffect } from "react";
import { FileUploader } from "./components/FileUploader";
import { ProductData, UploadMetrics } from "./types";
import { calculateUploadMetrics } from "./utils/dataUtils";
import { saveUploadMetadata, getUploadsMetadata } from "./utils/storageUtils";
import { OverviewTab } from "./components/tabs/OverviewTab";
import { ChartsTab } from "./components/tabs/ChartsTab";
import { CategoriesTab } from "./components/tabs/CategoriesTab";
import { SellableTab } from "./components/tabs/SellableTab";
import { SLATab } from "./components/tabs/SLATab";
import { AdvancedTab } from "./components/tabs/AdvancedTab";
import { SKUChangesTab } from "./components/tabs/SKUChangesTab";
import { FileSpreadsheet, Home, BarChart3, FolderTree, ShoppingCart, CheckCircle, TrendingUp, GitCompare, Upload } from "lucide-react";

type TabType = "overview" | "charts" | "categories" | "sellable" | "sla" | "advanced" | "changes";

interface UploadHistoryItem {
  id: string;
  timestamp: Date;
  fileName: string;
  skuCount: number;
  metrics: UploadMetrics;
}

export default function App() {
  const [data, setData] = useState<ProductData[]>([]);
  const [skuCount, setSkuCount] = useState<number>(0);
  const [activeTab, setActiveTab] = useState<TabType>("overview");
  const [uploadHistory, setUploadHistory] = useState<UploadHistoryItem[]>([]);
  const [currentMetrics, setCurrentMetrics] = useState<UploadMetrics | null>(null);

  const tabs = [
    { id: "changes" as TabType, label: "SKU Changes", icon: GitCompare },
    { id: "overview" as TabType, label: "Overview", icon: Home },
    { id: "charts" as TabType, label: "Charts", icon: BarChart3 },
    { id: "categories" as TabType, label: "Categories", icon: FolderTree },
    { id: "sellable" as TabType, label: "Sellable %", icon: ShoppingCart },
    { id: "sla" as TabType, label: "SLA Adherence", icon: CheckCircle },
    { id: "advanced" as TabType, label: "Advanced Analytics", icon: TrendingUp },
  ];

  useEffect(() => {
    const metadata = getUploadsMetadata();
    setUploadHistory(metadata.map(m => ({
      ...m,
      timestamp: new Date(m.timestamp),
    })));
  }, []);

  const handleDataLoaded = (loadedData: ProductData[], count: number) => {
    const metrics = calculateUploadMetrics(loadedData);
    
    const upload: UploadHistoryItem = {
      id: Date.now().toString(),
      timestamp: new Date(),
      fileName: 'uploaded_file.csv',
      skuCount: count,
      metrics,
    };
    
    saveUploadMetadata(upload);
    
    const metadata = getUploadsMetadata();
    setUploadHistory(metadata.map(m => ({
      ...m,
      timestamp: new Date(m.timestamp),
    })));
    
    setData(loadedData);
    setSkuCount(count);
    setCurrentMetrics(metrics);
  };

  const handleNewUpload = () => {
    setData([]);
    setSkuCount(0);
    setCurrentMetrics(null);
  };

  if (data.length === 0) {
    return <FileUploader onDataLoaded={handleDataLoaded} />;
  }

  const previousMetrics = uploadHistory[1]?.metrics || null;

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-indigo-600 flex items-center justify-center">
                <FileSpreadsheet className="w-5 h-5 text-white" />
              </div>
              <div>
                <h1 className="text-lg font-bold text-slate-900">Product Analytics</h1>
                <p className="text-xs text-slate-500">
                  {skuCount.toLocaleString()} SKUs loaded
                  {uploadHistory.length > 1 && (
                    <span className="ml-2 text-emerald-600">
                      • {uploadHistory.length} uploads tracked
                    </span>
                  )}
                </p>
              </div>
            </div>
            <button
              onClick={handleNewUpload}
              className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
            >
              <Upload className="w-4 h-4" />
              <span className="hidden sm:inline">New Upload</span>
            </button>
          </div>
        </div>
      </header>

      {/* Tab Navigation */}
      <nav className="bg-white border-b border-slate-200 sticky top-16 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex gap-1 overflow-x-auto py-2 scrollbar-hide">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`
                    flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-all
                    ${isActive 
                      ? "bg-indigo-600 text-white" 
                      : "text-slate-600 hover:bg-slate-100"
                    }
                  `}
                >
                  <Icon className="w-4 h-4" />
                  {tab.label}
                </button>
              );
            })}
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {activeTab === "changes" && (
          <SKUChangesTab 
            data={data} 
            skuCount={skuCount} 
            uploadHistory={uploadHistory}
            currentMetrics={currentMetrics}
            previousMetrics={previousMetrics}
          />
        )}
        {activeTab === "overview" && (
          <OverviewTab data={data} skuCount={skuCount} />
        )}
        {activeTab === "charts" && (
          <ChartsTab data={data} skuCount={skuCount} />
        )}
        {activeTab === "categories" && (
          <CategoriesTab data={data} skuCount={skuCount} />
        )}
        {activeTab === "sellable" && (
          <SellableTab data={data} skuCount={skuCount} />
        )}
        {activeTab === "sla" && (
          <SLATab data={data} skuCount={skuCount} />
        )}
        {activeTab === "advanced" && (
          <AdvancedTab data={data} skuCount={skuCount} />
        )}
      </main>
    </div>
  );
}