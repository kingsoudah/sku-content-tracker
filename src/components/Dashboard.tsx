import { useState } from "react";
import { 
  Home, BarChart3, PieChart, FolderTree, 
  TrendingUp, CheckCircle, Settings, LogOut 
} from "lucide-react";
import { ProductData } from "../types";
import { OverviewTab } from "./tabs/OverviewTab";
import { ChartsTab } from "./tabs/ChartsTab";
import { CategoriesTab } from "./tabs/CategoriesTab";
import { SellableTab } from "./tabs/SellableTab";
import { SLATab } from "./tabs/SLATab";
import { AdvancedTab } from "./tabs/AdvancedTab";
import { SKUChangesTab } from "./tabs/SKUChangesTab";
import { Button } from "./ui/button";

interface DashboardProps {
  data: ProductData[];
  onReset: () => void;
}

const tabs = [
  { id: "changes", label: "SKU Changes", icon: <TrendingUp className="w-4 h-4" /> },
  { id: "overview", label: "Overview", icon: <Home className="w-4 h-4" /> },
  { id: "charts", label: "Charts", icon: <BarChart3 className="w-4 h-4" /> },
  { id: "categories", label: "Categories", icon: <FolderTree className="w-4 h-4" /> },
  { id: "sellable", label: "Sellable %", icon: <PieChart className="w-4 h-4" /> },
  { id: "sla", label: "SLA Adherence", icon: <CheckCircle className="w-4 h-4" /> },
  { id: "advanced", label: "Advanced Analytics", icon: <Settings className="w-4 h-4" /> },
];

export function Dashboard({ data, onReset }: DashboardProps) {
  const [activeTab, setActiveTab] = useState("overview");

  const renderTabContent = () => {
    switch (activeTab) {
      case "changes":
        return <SKUChangesTab data={data} />;
      case "overview":
        return <OverviewTab data={data} />;
      case "charts":
        return <ChartsTab data={data} />;
      case "categories":
        return <CategoriesTab data={data} />;
      case "sellable":
        return <SellableTab data={data} />;
      case "sla":
        return <SLATab data={data} />;
      case "advanced":
        return <AdvancedTab data={data} />;
      default:
        return <OverviewTab data={data} />;
    }
  };

  return (
    <div className="flex min-h-screen">
      {/* Sidebar */}
      <aside className="w-64 bg-slate-900 text-white flex flex-col">
        <div className="p-6 border-b border-slate-700">
          <h1 className="text-xl font-bold">Analytics</h1>
          <p className="text-sm text-slate-400 mt-1">{data.length} SKUs loaded</p>
        </div>
        
        <nav className="flex-1 p-4">
          <ul className="space-y-1">
            {tabs.map((tab) => (
              <li key={tab.id}>
                <button
                  onClick={() => setActiveTab(tab.id)}
                  className={`
                    w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200
                    ${activeTab === tab.id 
                      ? "bg-indigo-600 text-white" 
                      : "text-slate-300 hover:bg-slate-800 hover:text-white"
                    }
                  `}
                >
                  {tab.icon}
                  <span className="font-medium">{tab.label}</span>
                </button>
              </li>
            ))}
          </ul>
        </nav>

        <div className="p-4 border-t border-slate-700">
          <Button 
            onClick={onReset}
            variant="outline"
            className="w-full bg-transparent border-slate-600 text-slate-300 hover:bg-slate-800 hover:text-white"
          >
            <LogOut className="w-4 h-4 mr-2" />
            Upload New File
          </Button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-auto">
        <header className="bg-white border-b border-slate-200 px-8 py-4 sticky top-0 z-10">
          <h2 className="text-2xl font-bold text-slate-900">
            {tabs.find(t => t.id === activeTab)?.label}
          </h2>
        </header>

        <div className="p-8">
          {renderTabContent()}
        </div>
      </main>
    </div>
  );
}