"use client";

import { useRef, useState } from "react";
import * as XLSX from "xlsx";

interface PoLine { asin: string; title: string; qty: number; }

function downloadSummarySheet(lines: PoLine[]) {
  // Group by title (item name)
  const grouped = new Map<string, number>();
  for (const l of lines) {
    grouped.set(l.title, (grouped.get(l.title) ?? 0) + l.qty);
  }
  const rows = [["الصنف", "الكمية المطلوبة"]];
  for (const [title, qty] of grouped) rows.push([title, String(qty)]);
  const ws = XLSX.utils.aoa_to_sheet(rows);
  ws["!cols"] = [{ wch: 50 }, { wch: 18 }];
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "ملخص الأصناف");
  XLSX.writeFile(wb, "po-summary.xlsx");
}

function downloadAsinSheet(lines: PoLine[]) {
  const rows = [["ASIN", "الصنف", "الكمية"]];
  for (const l of lines) rows.push([l.asin, l.title, String(l.qty)]);
  const ws = XLSX.utils.aoa_to_sheet(rows);
  ws["!cols"] = [{ wch: 14 }, { wch: 50 }, { wch: 12 }];
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "كمية لكل ASIN");
  XLSX.writeFile(wb, "po-asins.xlsx");
}

export default function PoPage() {
  const inputRef = useRef<HTMLInputElement>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [lines, setLines] = useState<PoLine[] | null>(null);
  const [fileName, setFileName] = useState("");

  const handleFile = async (file: File) => {
    setError("");
    setLines(null);
    setFileName(file.name);
    setLoading(true);
    const fd = new FormData();
    fd.append("file", file);
    const res = await fetch("/api/parse-po", { method: "POST", body: fd });
    setLoading(false);
    if (res.ok) {
      const data = await res.json();
      setLines(data.lines);
    } else {
      const data = await res.json().catch(() => ({}));
      setError(data.error ?? "فشل قراءة الملف");
    }
  };

  const totalQty = lines?.reduce((s, l) => s + l.qty, 0) ?? 0;

  return (
    <div className="p-4 md:p-8 max-w-3xl mx-auto">
      <div className="mb-6">
        <h1 className="text-xl md:text-2xl font-bold text-gray-900">طلبيات PO</h1>
        <p className="text-xs text-gray-500 mt-0.5">ارفع الـ Purchase Order من أمازون واستخلص الكميات</p>
      </div>

      {/* Upload area */}
      <div
        onClick={() => inputRef.current?.click()}
        onDrop={(e) => { e.preventDefault(); const f = e.dataTransfer.files[0]; if (f) handleFile(f); }}
        onDragOver={(e) => e.preventDefault()}
        className="border-2 border-dashed border-gray-300 rounded-xl p-10 flex flex-col items-center justify-center cursor-pointer hover:border-orange-400 hover:bg-orange-50 transition-colors mb-6"
      >
        {loading ? (
          <div className="text-center">
            <div className="text-3xl mb-3 animate-pulse">📄</div>
            <p className="text-sm text-gray-500">جاري قراءة الـ PO...</p>
          </div>
        ) : (
          <div className="text-center">
            <div className="text-4xl mb-3">📋</div>
            <p className="text-sm font-medium text-gray-700">اضغط لرفع الـ PO</p>
            <p className="text-xs text-gray-400 mt-1">PDF أو Excel (.xlsx, .xls)</p>
            {fileName && <p className="text-xs text-orange-600 mt-2 font-medium">{fileName}</p>}
          </div>
        )}
      </div>
      <input ref={inputRef} type="file" accept=".pdf,.xlsx,.xls,.csv,application/pdf" className="hidden"
        onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFile(f); }} />

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg px-4 py-3 text-sm text-red-700 mb-6">
          {error}
        </div>
      )}

      {lines && lines.length > 0 && (
        <>
          {/* Stats */}
          <div className="grid grid-cols-2 gap-3 mb-6">
            <div className="bg-white border border-gray-200 rounded-xl p-4 text-center">
              <p className="text-2xl font-bold text-orange-600">{lines.length}</p>
              <p className="text-xs text-gray-500 mt-0.5">ASIN مختلف</p>
            </div>
            <div className="bg-white border border-gray-200 rounded-xl p-4 text-center">
              <p className="text-2xl font-bold text-orange-600">{totalQty.toLocaleString()}</p>
              <p className="text-xs text-gray-500 mt-0.5">إجمالي الكمية</p>
            </div>
          </div>

          {/* Two download options */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            <button
              onClick={() => downloadSummarySheet(lines)}
              className="bg-white border-2 border-orange-400 rounded-xl p-5 text-right hover:bg-orange-50 transition-colors group"
            >
              <div className="text-2xl mb-2">📊</div>
              <p className="font-bold text-gray-900 text-sm">ملخص الأصناف</p>
              <p className="text-xs text-gray-500 mt-1">الصنف + الكمية الإجمالية مجمّعة</p>
              <p className="text-xs text-orange-600 font-medium mt-3 group-hover:underline">⬇ تحميل Excel</p>
            </button>

            <button
              onClick={() => downloadAsinSheet(lines)}
              className="bg-white border-2 border-blue-400 rounded-xl p-5 text-right hover:bg-blue-50 transition-colors group"
            >
              <div className="text-2xl mb-2">🔢</div>
              <p className="font-bold text-gray-900 text-sm">كمية لكل ASIN</p>
              <p className="text-xs text-gray-500 mt-1">ASIN + اسم الصنف + الكمية</p>
              <p className="text-xs text-blue-600 font-medium mt-3 group-hover:underline">⬇ تحميل Excel</p>
            </button>
          </div>

          {/* Preview table */}
          <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
            <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between">
              <p className="text-sm font-semibold text-gray-700">معاينة البيانات</p>
              <p className="text-xs text-gray-400">{lines.length} صف</p>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 text-xs text-gray-500">
                  <tr>
                    <th className="px-4 py-2 text-right">ASIN</th>
                    <th className="px-4 py-2 text-right">الصنف</th>
                    <th className="px-4 py-2 text-center">الكمية</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {lines.map((l, i) => (
                    <tr key={i} className="hover:bg-gray-50">
                      <td className="px-4 py-2.5 font-mono text-xs text-blue-700 whitespace-nowrap">{l.asin}</td>
                      <td className="px-4 py-2.5 text-xs text-gray-700 max-w-xs truncate">{l.title}</td>
                      <td className="px-4 py-2.5 text-center font-bold text-gray-900">{l.qty}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
