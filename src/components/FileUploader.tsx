import { useState, useRef } from "react";
import { FileSpreadsheet, Upload, AlertCircle, CheckCircle } from "lucide-react";
import { ProductData } from "../types";
import * as XLSX from "xlsx";

interface FileUploaderProps {
  onDataLoaded: (data: ProductData[], count: number) => void;
}

export function FileUploader({ onDataLoaded }: FileUploaderProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fileName, setFileName] = useState<string | null>(null);
  const [previewData, setPreviewData] = useState<ProductData[] | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const expectedColumns = [
    "Sku",
    "Title", 
    "Content",
    "Image URL",
    "Product categories",
    "Status",
    "Stock",
    "Main Category",
    "Subcategory",
    "Sub-sub-category",
    "sub-sub-sub-category"
  ];

  const normalizeColumnName = (name: string): string => {
    return name
      .toLowerCase()
      .replace(/[_\s]+/g, " ")
      .trim()
      .replace(/\b\w/g, (c, i) => i === 0 ? c.toUpperCase() : c);
  };

  const mapRowToProductData = (row: Record<string, unknown>, headers: string[]): ProductData => {
    const findColumnValue = (possibleNames: string[]): string => {
      for (const name of possibleNames) {
        // Try exact match first
        if (row[name] !== undefined) {
          return String(row[name] ?? "");
        }
        // Try case-insensitive match
        const lowerName = name.toLowerCase();
        for (const header of headers) {
          if (header.toLowerCase() === lowerName && row[header] !== undefined) {
            return String(row[header] ?? "");
          }
        }
        // Try normalized match
        const normalizedName = normalizeColumnName(name);
        for (const header of headers) {
          if (normalizeColumnName(header) === normalizedName && row[header] !== undefined) {
            return String(row[header] ?? "");
          }
        }
      }
      return "";
    };

    return {
      Sku: findColumnValue(["Sku", "SKU", "sku", "Sku No", "Item No", "Product ID"]),
      Title: findColumnValue(["Title", "title", "Name", "Product Name", "Product Title"]),
      Content: findColumnValue(["Content", "content", "Description", "Product Description", "Details"]),
      "Image URL": findColumnValue(["Image URL", "image url", "ImageUrl", "image_url", "Images", "Image", "ImageURL"]),
      "Product categories": findColumnValue(["Product categories", "Product Categories", "Categories", "Category"]),
      Status: findColumnValue(["Status", "status", "Product Status", "State"]),
      Stock: findColumnValue(["Stock", "stock", "Quantity", "Qty", "Stock Quantity", "Inventory"]),
      "Main Category": findColumnValue(["Main Category", "MainCategory", "main category", "Category Level 1", "L1 Category"]),
      Subcategory: findColumnValue(["Subcategory", "Sub Category", "subcategory", "Category Level 2", "L2 Category"]),
      "Sub-sub-category": findColumnValue(["Sub-sub-category", "Sub Sub Category", "Sub-Sub-Category", "Category Level 3", "L3 Category"]),
      "sub-sub-sub-category": findColumnValue(["sub-sub-sub-category", "Sub Sub Sub Category", "Sub-Sub-Sub-Category", "Category Level 4", "L4 Category"]),
    };
  };

  const parseExcelFile = async (file: File): Promise<ProductData[]> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      
      reader.onload = (e) => {
        try {
          const data = e.target?.result;
          const workbook = XLSX.read(data, { type: "array", cellDates: true });
          
          // Get first sheet
          const sheetName = workbook.SheetNames[0];
          const worksheet = workbook.Sheets[sheetName];
          
          // Convert to JSON with headers
          const jsonData = XLSX.utils.sheet_to_json<Record<string, unknown>>(worksheet, {
            raw: false,
            defval: "",
          });
          
          if (jsonData.length === 0) {
            reject(new Error("The Excel file appears to be empty"));
            return;
          }
          
          // Get headers from the first row
          const headers = Object.keys(jsonData[0]);
          
          // Map each row to ProductData
          const productData: ProductData[] = jsonData.map((row) => 
            mapRowToProductData(row, headers)
          );
          
          resolve(productData);
        } catch {
          reject(new Error("Failed to parse the Excel file. Please ensure it's a valid .xlsx or .xls file."));
        }
      };
      
      reader.onerror = () => {
        reject(new Error("Failed to read the file"));
      };
      
      reader.readAsArrayBuffer(file);
    });
  };

  const handleFile = async (file: File) => {
    setError(null);
    setFileName(file.name);
    setIsLoading(true);
    setPreviewData(null);

    try {
      // Check file type
      const validTypes = [
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "application/vnd.ms-excel",
        "application/excel",
        ".xlsx",
        ".xls"
      ];
      
      const fileExtension = file.name.split('.').pop()?.toLowerCase();
      
      if (!validTypes.includes(file.type) && !['xlsx', 'xls'].includes(fileExtension || '')) {
        throw new Error("Please upload a valid Excel file (.xlsx or .xls)");
      }

      const productData = await parseExcelFile(file);
      
      // Check if we have meaningful data
      const validRows = productData.filter(row => row.Sku || row.Title);
      
      if (validRows.length === 0) {
        throw new Error("No valid product data found. Please ensure your file has 'Sku' and 'Title' columns.");
      }

      // Show preview
      setPreviewData(validRows.slice(0, 5));
      
      // Pass data to parent
      onDataLoaded(validRows, validRows.length);
      
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to process file";
      setError(message);
      setFileName(null);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    
    const file = e.dataTransfer.files[0];
    if (file) {
      handleFile(file);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleFile(file);
    }
  };

  const handleClick = () => {
    fileInputRef.current?.click();
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <div className="max-w-2xl w-full">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 rounded-2xl bg-indigo-600 flex items-center justify-center mx-auto mb-4">
            <FileSpreadsheet className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-slate-900 mb-2">Product Analytics Dashboard</h1>
          <p className="text-slate-500">Upload your Excel file to analyze product data</p>
        </div>

        {/* Expected Columns Info */}
        <div className="bg-white rounded-xl border border-slate-200 p-4 mb-6">
          <p className="text-sm text-slate-600 mb-2 font-medium">Expected Columns:</p>
          <div className="flex flex-wrap gap-2">
            {expectedColumns.map((col) => (
              <span key={col} className="text-xs bg-slate-100 text-slate-600 px-2 py-1 rounded">
                {col}
              </span>
            ))}
          </div>
        </div>

        {/* Upload Area */}
        <div
          onClick={handleClick}
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          className={`
            relative border-2 border-dashed rounded-2xl p-12 text-center cursor-pointer transition-all
            ${isDragging 
              ? "border-indigo-500 bg-indigo-50" 
              : "border-slate-300 bg-white hover:border-indigo-400 hover:bg-slate-50"
            }
            ${isLoading ? "pointer-events-none" : ""}
          `}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept=".xlsx,.xls"
            onChange={handleFileInput}
            className="hidden"
          />

          {isLoading ? (
            <div className="flex flex-col items-center">
              <div className="w-12 h-12 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin mb-4" />
              <p className="text-slate-600">Processing {fileName}...</p>
            </div>
          ) : (
            <>
              <Upload className="w-12 h-12 text-slate-400 mx-auto mb-4" />
              <p className="text-lg font-medium text-slate-700 mb-2">
                Drop your Excel file here
              </p>
              <p className="text-sm text-slate-500 mb-4">
                or click to browse
              </p>
              <p className="text-xs text-slate-400">
                Supports .xlsx and .xls files
              </p>
            </>
          )}
        </div>

        {/* Error Message */}
        {error && (
          <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-xl flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-red-800">Error</p>
              <p className="text-sm text-red-600">{error}</p>
            </div>
          </div>
        )}

        {/* Preview */}
        {previewData && previewData.length > 0 && (
          <div className="mt-6 bg-white rounded-xl border border-slate-200 overflow-hidden">
            <div className="px-4 py-3 border-b border-slate-200 flex items-center gap-2">
              <CheckCircle className="w-5 h-5 text-emerald-500" />
              <p className="text-sm font-medium text-slate-700">
                Successfully loaded {fileName}
              </p>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-slate-50">
                  <tr>
                    <th className="px-4 py-2 text-left text-xs font-medium text-slate-500">Sku</th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-slate-500">Title</th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-slate-500">Stock</th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-slate-500">Main Category</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {previewData.slice(0, 5).map((row, index) => (
                    <tr key={index}>
                      <td className="px-4 py-2 text-slate-900">{row.Sku || "-"}</td>
                      <td className="px-4 py-2 text-slate-900">{row.Title?.substring(0, 30) || "-"}{row.Title && row.Title.length > 30 && "..."}</td>
                      <td className="px-4 py-2 text-slate-900">{row.Stock || "0"}</td>
                      <td className="px-4 py-2 text-slate-900">{row["Main Category"] || "-"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}