"use client";

import { useState } from "react";

const AMAZON_CUT = 0.15;
const MIN_AMAZON_MARGIN = 0.20;
const TARGET_MARGIN = 0.15;

export default function CalculatorPage() {
  const [cost, setCost] = useState("");
  const [invoice, setInvoice] = useState("");
  const [selling, setSelling] = useState("");

  const C = parseFloat(cost);
  const P = parseFloat(invoice);
  const S = parseFloat(selling);

  const hasCost    = !isNaN(C) && C > 0;
  const hasInvoice = hasCost && !isNaN(P) && P > 0;
  const hasSelling = hasInvoice && !isNaN(S) && S > 0;

  // ما يرجع للمورد بعد خصم أمازون 15%
  const netReceived    = hasInvoice ? P * (1 - AMAZON_CUT) : 0;
  const amazonDeduct   = hasInvoice ? P * AMAZON_CUT : 0;

  // هامش أمازون = (سعر الكاستومر - هيرجعلي) ÷ سعر الكاستومر
  const amazonMargin   = hasSelling ? (S - netReceived) / S : null;
  const accepted       = amazonMargin != null && amazonMargin >= MIN_AMAZON_MARGIN;

  // ربح المورد
  const vendorProfit   = hasInvoice ? netReceived - C : 0;
  const vendorMarginPct = hasCost && hasInvoice ? (vendorProfit / C) * 100 : 0;

  // أقصى فاتورة تقدر تبعتها وأمازون يكسب 20%
  // (S - P×0.85) / S = 0.20  →  P = S × 0.80 / 0.85
  const maxInvoice = hasSelling ? (S * (1 - MIN_AMAZON_MARGIN)) / (1 - AMAZON_CUT) : 0;

  // السعر المقترح للفاتورة بناءً على التكلفة فقط (15% هامش مورد)
  const suggestedInvoice = hasCost ? (C * (1 + TARGET_MARGIN)) / (1 - AMAZON_CUT) : 0;

  return (
    <div className="p-8 max-w-xl">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">حاسبة تسعير أمازون فيندور</h1>
        <p className="text-sm text-gray-500 mt-1">القبول بناءً على هامش أمازون ≥ 20% من سعر الكاستومر</p>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 divide-y divide-gray-100">

        {/* Input 1: Cost */}
        <div className="p-5">
          <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">سعر التكلفة</label>
          <div className="flex items-center gap-3">
            <input
              type="number" step="0.01" min="0"
              value={cost} onChange={(e) => setCost(e.target.value)}
              placeholder="0.00" autoComplete="off"
              className="flex-1 border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400"
            />
            <span className="text-sm text-gray-400 w-8">ج.م</span>
          </div>
          {hasCost && (
            <p className="text-xs text-blue-600 mt-2">
              السعر المقترح للفاتورة (15% ربحك): <strong>{suggestedInvoice.toFixed(2)} ج.م</strong>
            </p>
          )}
        </div>

        {/* Input 2: Invoice to Amazon */}
        <div className="p-5">
          <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">هسلّم أمازون بكام؟</label>
          <div className="flex items-center gap-3">
            <input
              type="number" step="0.01" min="0"
              value={invoice} onChange={(e) => setInvoice(e.target.value)}
              placeholder="0.00" autoComplete="off"
              className="flex-1 border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400"
            />
            <span className="text-sm text-gray-400 w-8">ج.م</span>
          </div>

          {hasInvoice && (
            <div className="mt-3 bg-gray-50 rounded-lg p-3 space-y-1.5 text-sm">
              <div className="flex justify-between text-gray-600">
                <span>خصم أمازون 15%</span>
                <span className="text-red-500">− {amazonDeduct.toFixed(2)} ج.م</span>
              </div>
              <div className="flex justify-between font-bold text-gray-900 border-t border-gray-200 pt-1.5">
                <span>هيرجعلي</span>
                <span className="text-blue-700">{netReceived.toFixed(2)} ج.م</span>
              </div>
              <div className="flex justify-between text-gray-600 border-t border-gray-200 pt-1.5">
                <span>ربح المورد (بعد التكلفة)</span>
                <span className={vendorProfit >= 0 ? "text-green-600 font-medium" : "text-red-500 font-medium"}>
                  {vendorProfit >= 0 ? "+" : ""}{vendorProfit.toFixed(2)} ج.م ({vendorMarginPct.toFixed(1)}%)
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Input 3: Customer selling price */}
        <div className="p-5">
          <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
            سعر البيع على أمازون للكاستومر
          </label>
          <div className="flex items-center gap-3">
            <input
              type="number" step="0.01" min="0"
              value={selling} onChange={(e) => setSelling(e.target.value)}
              placeholder="0.00" autoComplete="off"
              className="flex-1 border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400"
            />
            <span className="text-sm text-gray-400 w-8">ج.م</span>
          </div>

          {hasSelling && (
            <div className={`mt-3 rounded-lg border-2 p-4 ${accepted ? "bg-green-50 border-green-300" : "bg-red-50 border-red-300"}`}>
              {/* Verdict */}
              <div className="flex items-center gap-3 mb-3">
                <span className="text-3xl">{accepted ? "✅" : "❌"}</span>
                <div>
                  <p className="font-bold text-gray-900">{accepted ? "مقبول" : "مرفوض"}</p>
                  <p className="text-xs text-gray-500">
                    هامش أمازون: <span className={`font-semibold ${accepted ? "text-green-700" : "text-red-700"}`}>
                      {(amazonMargin! * 100).toFixed(1)}%
                    </span>
                    {" "}(الحد الأدنى 20%)
                  </p>
                </div>
              </div>

              {/* Breakdown */}
              <div className="space-y-1.5 text-sm border-t border-gray-200 pt-3">
                <div className="flex justify-between text-gray-600">
                  <span>سعر الكاستومر</span>
                  <span className="font-medium">{S.toFixed(2)} ج.م</span>
                </div>
                <div className="flex justify-between text-gray-600">
                  <span>− هيرجعلي للمورد</span>
                  <span className="font-medium">− {netReceived.toFixed(2)} ج.م</span>
                </div>
                <div className="flex justify-between font-bold border-t border-gray-200 pt-1.5">
                  <span>ربح أمازون</span>
                  <span>{(S - netReceived).toFixed(2)} ج.م</span>
                </div>
              </div>

              {!accepted && hasSelling && (
                <div className="mt-3 pt-3 border-t border-gray-200 text-xs text-orange-700">
                  <p>لتحقيق 20% لأمازون، أقصى فاتورة تقدر ترفعها:</p>
                  <p className="text-lg font-bold text-orange-700 mt-0.5">{maxInvoice.toFixed(2)} ج.م</p>
                </div>
              )}
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
