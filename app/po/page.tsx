"use client";

import { useRef, useState } from "react";
import * as XLSX from "xlsx";

interface PoLine { asin: string; title: string; qty: number; }
interface PoRow extends PoLine { units: number; }

function downloadSummarySheet(rows: PoRow[]) {
  const grouped = new Map<string, number>();
  for (const r of rows) {
    const total = r.qty * r.units;
    grouped.set(r.title, (grouped.get(r.title) ?? 0) + total);
  }
  const data = [["الصنف", "الكمية المطلوبة (قطع)"]];
  for (const [title, qty] of grouped) data.push([title, String(qty)]);
  const ws = XLSX.utils.aoa_to_sheet(data);
  ws["!cols"] = [{ wch: 50 }, { wch: 22 }];
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "ملخص الأصناف");
  XLSX.writeFile(wb, "po-summary.xlsx");
}

function downloadAsinSheet(rows: PoRow[]) {
  const data = [["ASIN", "الصنف", "كمية الـ ASIN", "قطع/ASIN", "إجمالي القطع"]];
  for (const r of rows)
    data.push([r.asin, r.title, String(r.qty), String(r.units), String(r.qty * r.units)]);
  const ws = XLSX.utils.aoa_to_sheet(data);
  ws["!cols"] = [{ wch: 14 }, { wch: 45 }, { wch: 14 }, { wch: 12 }, { wch: 16 }];
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "كمية لكل ASIN");
  XLSX.writeFile(wb, "po-asins.xlsx");
}

export default function PoPage() {
  const inputRef = useRef<HTMLInputElement>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [rows, setRows] = useState<PoRow[] | null>(null);
  const [fileName, setFileName] = useState("");

  const handleFile = async (file: File) => {
    setError("");
    setRows(null);
    setFileName(file.name);
    setLoading(true);
    const fd = new FormData();
    fd.append("file", file);
    const res = await fetch("/api/parse-po", { method: "POST", body: fd });
    setLoading(false);
    if (res.ok) {
      const data = await res.json();
      setRows((data.lines as PoLine[]).map((l) => ({ ...l, units: 1 })));
    } else {
      const data = await res.json().catch(() => ({}));
      setError(data.error ?? "فشل قراءة الملف");
    }
  };

  const setUnits = (i: number, val: string) => {
    const n = Math.max(1, parseInt(val) || 1);
    setRows((prev) => prev ? prev.map((r, idx) => idx === i ? { ...r, units: n } : r) : prev);
  };

  const totalAsins = rows?.length ?? 0;
  const totalUnits = rows?.reduce((s, r) => s + r.qty * r.units, 0) ?? 0;

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

      {rows && rows.length > 0 && (
        <>
          {/* Stats */}
          <div className="grid grid-cols-2 gap-3 mb-6">
            <div className="bg-white border border-gray-200 rounded-xl p-4 text-center">
              <p className="text-2xl font-bold text-orange-600">{totalAsins}</p>
              <p className="text-xs text-gray-500 mt-0.5">ASIN مختلف</p>
            </div>
            <div className="bg-white border border-gray-200 rounded-xl p-4 text-center">
              <p className="text-2xl font-bold text-orange-600">{totalUnits.toLocaleString()}</p>
              <p className="text-xs text-gray-500 mt-0.5">إجمالي القطع الفعلية</p>
            </div>
          </div>

          {/* Download options */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            <button
              onClick={() => downloadSummarySheet(rows)}
              className="bg-white border-2 border-orange-400 rounded-xl p-5 text-right hover:bg-orange-50 transition-colors group"
            >
              <div className="text-2xl mb-2">📊</div>
              <p className="font-bold text-gray-900 text-sm">ملخص الأصناف</p>
              <p className="text-xs text-gray-500 mt-1">الصنف + إجمالي القطع مجمّعة</p>
              <p className="text-xs text-orange-600 font-medium mt-3 group-hover:underline">⬇ تحميل Excel</p>
            </button>
            <button
              onClick={() => downloadAsinSheet(rows)}
              className="bg-white border-2 border-blue-400 rounded-xl p-5 text-right hover:bg-blue-50 transition-colors group"
            >
              <div className="text-2xl mb-2">🔢</div>
              <p className="font-bold text-gray-900 text-sm">كمية لكل ASIN</p>
              <p className="text-xs text-gray-500 mt-1">ASIN + كمية + قطع/ASIN + الإجمالي</p>
              <p className="text-xs text-blue-600 font-medium mt-3 group-hover:underline">⬇ تحميل Excel</p>
            </button>
          </div>

          {/* Table with editable units */}
          <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
            <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold text-gray-700">البيانات</p>
                <p className="text-xs text-gray-400 mt-0.5">عدّل "قطع/ASIN" لو الـ ASIN فيه أكتر من قطعة</p>
              </div>
              <p className="text-xs text-gray-400">{rows.length} صف</p>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 text-xs text-gray-500 uppercase tracking-wide">
                  <tr>
                    <th className="px-3 py-2 text-right">ASIN</th>
                    <th className="px-3 py-2 text-right">الصنف</th>
                    <th className="px-3 py-2 text-center">كمية الـ PO</th>
                    <th className="px-3 py-2 text-center">قطع/ASIN</th>
                    <th className="px-3 py-2 text-center font-bold text-orange-600">إجمالي القطع</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {rows.map((r, i) => (
                    <tr key={i} className="hover:bg-gray-50">
                      <td className="px-3 py-2.5 font-mono text-xs text-blue-700 whitespace-nowrap">{r.asin}</td>
                      <td className="px-3 py-2.5 text-xs text-gray-700 max-w-[180px] truncate">{r.title}</td>
                      <td className="px-3 py-2.5 text-center text-gray-700 font-medium">{r.qty}</td>
                      <td className="px-3 py-2.5 text-center">
                        <input
                          type="number"
                          min="1"
                          value={r.units}
                          onChange={(e) => setUnits(i, e.target.value)}
                          className="w-16 border border-gray-300 rounded-lg px-2 py-1 text-xs text-center focus:outline-none focus:ring-2 focus:ring-orange-400 font-medium"
                        />
                      </td>
                      <td className="px-3 py-2.5 text-center font-bold text-orange-700">
                        {r.qty * r.units}
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot className="bg-gray-50 border-t-2 border-gray-200">
                  <tr>
                    <td colSpan={4} className="px-3 py-2.5 text-xs font-semibold text-gray-600 text-right">الإجمالي</td>
                    <td className="px-3 py-2.5 text-center font-bold text-orange-700 text-base">{totalUnits.toLocaleString()}</td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
