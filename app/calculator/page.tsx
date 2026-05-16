"use client";

import { useState } from "react";

const AMAZON_CUT = 0.15;
const MIN_AMAZON_MARGIN = 0.20;
const TARGET_MARGIN = 0.15;

function ManualTab() {
  const [cost, setCost] = useState("");
  const [invoice, setInvoice] = useState("");
  const [selling, setSelling] = useState("");

  const C = parseFloat(cost);
  const P = parseFloat(invoice);
  const S = parseFloat(selling);

  const hasCost    = !isNaN(C) && C > 0;
  const hasInvoice = hasCost && !isNaN(P) && P > 0;
  const hasSelling = hasInvoice && !isNaN(S) && S > 0;

  const netReceived     = hasInvoice ? P * (1 - AMAZON_CUT) : 0;
  const amazonDeduct    = hasInvoice ? P * AMAZON_CUT : 0;
  const amazonMargin    = hasSelling ? (S - netReceived) / S : null;
  const accepted        = amazonMargin != null && amazonMargin >= MIN_AMAZON_MARGIN;
  const vendorProfit    = hasInvoice ? netReceived - C : 0;
  const vendorMarginPct = hasCost && hasInvoice ? (vendorProfit / C) * 100 : 0;
  const maxInvoice      = hasSelling ? (S * (1 - MIN_AMAZON_MARGIN)) / (1 - AMAZON_CUT) : 0;
  const suggestedInvoice = hasCost ? (C * (1 + TARGET_MARGIN)) / (1 - AMAZON_CUT) : 0;

  return (
    <div className="bg-white rounded-xl border border-gray-200 divide-y divide-gray-100">

      <div className="p-5">
        <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">سعر التكلفة</label>
        <div className="flex items-center gap-3">
          <input type="number" step="0.01" min="0" value={cost} onChange={(e) => setCost(e.target.value)}
            placeholder="0.00" autoComplete="off"
            className="flex-1 border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400" />
          <span className="text-sm text-gray-400 w-8">ج.م</span>
        </div>
        {hasCost && (
          <p className="text-xs text-blue-600 mt-2">
            السعر المقترح للفاتورة (15% ربحك): <strong>{suggestedInvoice.toFixed(2)} ج.م</strong>
          </p>
        )}
      </div>

      <div className="p-5">
        <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">هسلّم أمازون بكام؟</label>
        <div className="flex items-center gap-3">
          <input type="number" step="0.01" min="0" value={invoice} onChange={(e) => setInvoice(e.target.value)}
            placeholder="0.00" autoComplete="off"
            className="flex-1 border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400" />
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

      <div className="p-5">
        <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
          سعر البيع على أمازون للكاستومر
        </label>
        <div className="flex items-center gap-3">
          <input type="number" step="0.01" min="0" value={selling} onChange={(e) => setSelling(e.target.value)}
            placeholder="0.00" autoComplete="off"
            className="flex-1 border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400" />
          <span className="text-sm text-gray-400 w-8">ج.م</span>
        </div>

        {hasSelling && (
          <div className={`mt-3 rounded-lg border-2 p-4 ${accepted ? "bg-green-50 border-green-300" : "bg-red-50 border-red-300"}`}>
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
            {!accepted && (
              <div className="mt-3 pt-3 border-t border-gray-200 text-xs text-orange-700">
                <p>لتحقيق 20% لأمازون، أقصى فاتورة تقدر ترفعها:</p>
                <p className="text-lg font-bold text-orange-700 mt-0.5">{maxInvoice.toFixed(2)} ج.م</p>
              </div>
            )}
          </div>
        )}
      </div>

    </div>
  );
}

function ReverseTab() {
  const [cost, setCost] = useState("");
  const [selling, setSelling] = useState("");
  const [marginPct, setMarginPct] = useState("15");

  const C = parseFloat(cost);
  const S = parseFloat(selling);
  const M = parseFloat(marginPct) / 100;

  const hasCost    = !isNaN(C) && C > 0;
  const hasSelling = !isNaN(S) && S > 0;
  const hasMargin  = !isNaN(M) && M >= 0;
  const hasAll     = hasCost && hasSelling && hasMargin;

  // أقصى فاتورة لتحقيق 20% لأمازون
  const maxInvoiceForAmazon = hasSelling ? (S * (1 - MIN_AMAZON_MARGIN)) / (1 - AMAZON_CUT) : 0;

  // فاتورة مقترحة بناءً على هامش المورد المطلوب
  const suggestedByMargin = hasCost && hasMargin ? (C * (1 + M)) / (1 - AMAZON_CUT) : 0;

  // الفاتورة الفعلية = الأصغر من الاثنين (يضمن قبول أمازون ويحقق هامشك)
  const finalInvoice = hasAll ? Math.min(maxInvoiceForAmazon, suggestedByMargin) : 0;
  const isConstrained = hasAll && suggestedByMargin > maxInvoiceForAmazon;

  const netReceived   = finalInvoice > 0 ? finalInvoice * (1 - AMAZON_CUT) : 0;
  const vendorProfit  = hasAll ? netReceived - C : 0;
  const realMarginPct = hasCost && hasAll ? (vendorProfit / C) * 100 : 0;
  const amazonMargin  = hasSelling && finalInvoice > 0 ? (S - netReceived) / S : 0;
  const accepted      = amazonMargin >= MIN_AMAZON_MARGIN;

  return (
    <div className="bg-white rounded-xl border border-gray-200 divide-y divide-gray-100">

      <div className="p-5">
        <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">سعر التكلفة</label>
        <div className="flex items-center gap-3">
          <input type="number" step="0.01" min="0" value={cost} onChange={(e) => setCost(e.target.value)}
            placeholder="0.00" autoComplete="off"
            className="flex-1 border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400" />
          <span className="text-sm text-gray-400 w-8">ج.م</span>
        </div>
      </div>

      <div className="p-5">
        <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
          سعر البيع على أمازون للكاستومر
        </label>
        <div className="flex items-center gap-3">
          <input type="number" step="0.01" min="0" value={selling} onChange={(e) => setSelling(e.target.value)}
            placeholder="0.00" autoComplete="off"
            className="flex-1 border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400" />
          <span className="text-sm text-gray-400 w-8">ج.م</span>
        </div>
        {hasSelling && (
          <p className="text-xs text-gray-500 mt-2">
            أقصى فاتورة يقبلها أمازون (20% له): <strong className="text-orange-600">{maxInvoiceForAmazon.toFixed(2)} ج.م</strong>
          </p>
        )}
      </div>

      <div className="p-5">
        <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
          هامش ربحك المطلوب
        </label>
        <div className="flex items-center gap-2">
          {["10", "15", "20", "25"].map((v) => (
            <button key={v} onClick={() => setMarginPct(v)}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium border transition-colors ${
                marginPct === v ? "bg-orange-500 text-white border-orange-500" : "bg-white text-gray-600 border-gray-300 hover:border-orange-400"
              }`}>
              {v}%
            </button>
          ))}
          <input type="number" step="1" min="0" max="100" value={marginPct} onChange={(e) => setMarginPct(e.target.value)}
            className="w-16 border border-gray-300 rounded-lg px-2 py-1.5 text-sm text-center focus:outline-none focus:ring-2 focus:ring-orange-400" />
          <span className="text-sm text-gray-400">%</span>
        </div>
      </div>

      {hasAll && (
        <div className="p-5">
          <div className={`rounded-xl border-2 p-5 ${accepted ? "bg-green-50 border-green-300" : "bg-red-50 border-red-300"}`}>
            <div className="flex items-center gap-3 mb-4">
              <span className="text-3xl">{accepted ? "✅" : "❌"}</span>
              <div>
                <p className="font-bold text-gray-900 text-lg">
                  الفاتورة المقترحة: <span className="text-orange-600">{finalInvoice.toFixed(2)} ج.م</span>
                </p>
                {isConstrained && (
                  <p className="text-xs text-orange-600 mt-0.5">
                    مخفضة — هامشك الفعلي ({realMarginPct.toFixed(1)}%) أقل من {marginPct}% بسبب سقف أمازون
                  </p>
                )}
              </div>
            </div>

            <div className="space-y-2 text-sm">
              <div className="flex justify-between text-gray-600">
                <span>الفاتورة لأمازون</span>
                <span className="font-semibold">{finalInvoice.toFixed(2)} ج.م</span>
              </div>
              <div className="flex justify-between text-gray-600">
                <span>خصم أمازون 15%</span>
                <span className="text-red-500">− {(finalInvoice * AMAZON_CUT).toFixed(2)} ج.م</span>
              </div>
              <div className="flex justify-between font-bold border-t border-gray-200 pt-2">
                <span>هيرجعلي</span>
                <span className="text-blue-700">{netReceived.toFixed(2)} ج.م</span>
              </div>
              <div className="flex justify-between text-gray-600 border-t border-gray-200 pt-2">
                <span>ربح المورد</span>
                <span className={vendorProfit >= 0 ? "text-green-600 font-medium" : "text-red-500 font-medium"}>
                  {vendorProfit >= 0 ? "+" : ""}{vendorProfit.toFixed(2)} ج.م ({realMarginPct.toFixed(1)}%)
                </span>
              </div>
              <div className="flex justify-between text-gray-600">
                <span>هامش أمازون</span>
                <span className={`font-medium ${accepted ? "text-green-600" : "text-red-500"}`}>
                  {(amazonMargin * 100).toFixed(1)}%
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}

export default function CalculatorPage() {
  const [tab, setTab] = useState<"manual" | "reverse">("manual");

  return (
    <div className="p-4 md:p-8 max-w-xl">
      <div className="mb-5">
        <h1 className="text-xl md:text-2xl font-bold text-gray-900">حاسبة تسعير أمازون فيندور</h1>
        <p className="text-xs text-gray-500 mt-1">القبول بناءً على هامش أمازون ≥ 20%</p>
      </div>

      <div className="flex bg-gray-100 rounded-xl p-1 mb-5 gap-1">
        <button onClick={() => setTab("manual")}
          className={`flex-1 py-2 px-3 rounded-lg text-sm font-medium transition-colors ${
            tab === "manual" ? "bg-white text-gray-900 shadow-sm" : "text-gray-500 hover:text-gray-700"
          }`}>
          أدخل الفاتورة يدوي
        </button>
        <button onClick={() => setTab("reverse")}
          className={`flex-1 py-2 px-3 rounded-lg text-sm font-medium transition-colors ${
            tab === "reverse" ? "bg-white text-gray-900 shadow-sm" : "text-gray-500 hover:text-gray-700"
          }`}>
          احسبلي الفاتورة
        </button>
      </div>

      {tab === "manual" ? <ManualTab /> : <ReverseTab />}
    </div>
  );
}
