import { NextRequest, NextResponse } from "next/server";
import * as XLSX from "xlsx";

export interface PoLine {
  asin: string;
  title: string;
  qty: number;
}

const ASIN_RE = /\b(B0[A-Z0-9]{8})\b/;

function extractFromText(text: string): PoLine[] {
  const lines = text.split("\n").map((l) => l.trim()).filter(Boolean);
  const result: PoLine[] = [];

  for (let i = 0; i < lines.length; i++) {
    const asinMatch = lines[i].match(ASIN_RE);
    if (!asinMatch) continue;
    const asin = asinMatch[1];

    let qty = 0;
    let title = "";
    const window = lines.slice(Math.max(0, i - 3), i + 6);
    for (const wl of window) {
      const qtyMatch = wl.match(/\b([1-9]\d{0,3})\b/);
      if (qtyMatch && qty === 0) qty = parseInt(qtyMatch[1]);
      if (!title && wl.length > 10 && !ASIN_RE.test(wl)) title = wl;
    }

    if (qty > 0) {
      const existing = result.find((r) => r.asin === asin);
      if (existing) existing.qty += qty;
      else result.push({ asin, title: title || asin, qty });
    }
  }
  return result;
}

function extractFromExcel(buffer: Buffer): PoLine[] {
  const wb = XLSX.read(buffer, { type: "buffer" });
  const result: PoLine[] = [];

  for (const sheetName of wb.SheetNames) {
    const rows: string[][] = XLSX.utils.sheet_to_json(wb.Sheets[sheetName], {
      header: 1,
      defval: "",
      raw: false,
    }) as string[][];

    // Find header row — look for a row that has ASIN-like header
    let asinCol = -1;
    let qtyCol = -1;
    let titleCol = -1;

    for (let r = 0; r < Math.min(rows.length, 15); r++) {
      const row = rows[r].map((c) => String(c).toLowerCase());
      const ai = row.findIndex((c) => c.includes("asin"));
      const qi = row.findIndex((c) =>
        c.includes("qty") || c.includes("quantity") || c.includes("كمية") || c.includes("ordered")
      );
      const ti = row.findIndex((c) =>
        c.includes("title") || c.includes("product") || c.includes("item") || c.includes("description") || c.includes("اسم")
      );
      if (ai !== -1 && qi !== -1) {
        asinCol = ai; qtyCol = qi; titleCol = ti;
        // parse data rows below
        for (let d = r + 1; d < rows.length; d++) {
          const asin = String(rows[d][asinCol] ?? "").trim().toUpperCase();
          if (!ASIN_RE.test(asin)) continue;
          const rawQty = String(rows[d][qtyCol] ?? "").replace(/[^0-9]/g, "");
          const qty = parseInt(rawQty) || 0;
          if (qty === 0) continue;
          const title = titleCol !== -1 ? String(rows[d][titleCol] ?? "").trim() : asin;
          const existing = result.find((r) => r.asin === asin);
          if (existing) existing.qty += qty;
          else result.push({ asin, title: title || asin, qty });
        }
        break;
      }
    }

    // Fallback: scan every cell for ASIN pattern
    if (asinCol === -1) {
      for (const row of rows) {
        let asin = "";
        let qty = 0;
        let title = "";
        for (const cell of row) {
          const s = String(cell).trim();
          if (ASIN_RE.test(s.toUpperCase())) asin = s.toUpperCase().match(ASIN_RE)![1];
          const n = parseInt(s.replace(/[^0-9]/g, ""));
          if (!isNaN(n) && n > 0 && n < 10000 && qty === 0) qty = n;
          if (s.length > 10 && !ASIN_RE.test(s) && !title) title = s;
        }
        if (asin && qty > 0) {
          const existing = result.find((r) => r.asin === asin);
          if (existing) existing.qty += qty;
          else result.push({ asin, title: title || asin, qty });
        }
      }
    }
  }

  return result;
}

export async function POST(req: NextRequest) {
  const formData = await req.formData();
  const file = formData.get("file") as File | null;
  if (!file) return NextResponse.json({ error: "No file" }, { status: 400 });

  const buffer = Buffer.from(await file.arrayBuffer());
  const name = file.name.toLowerCase();
  let lines: PoLine[] = [];

  if (name.endsWith(".xlsx") || name.endsWith(".xls") || name.endsWith(".csv")) {
    lines = extractFromExcel(buffer);
  } else {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const pdfParse = (await import("pdf-parse") as any).default ?? (await import("pdf-parse") as any);
    const parsed = await pdfParse(buffer);
    lines = extractFromText(parsed.text);
  }

  if (lines.length === 0) {
    return NextResponse.json({
      error: "مش قادر يلاقي ASINs في الملف — تأكد إن فيه عمود ASIN وعمود كمية",
    }, { status: 422 });
  }

  return NextResponse.json({ lines });
}
