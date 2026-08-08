import { NextRequest, NextResponse } from "next/server";

export interface PoLine {
  asin: string;
  title: string;
  qty: number;
}

function extractLines(text: string): PoLine[] {
  const lines = text.split("\n").map((l) => l.trim()).filter(Boolean);
  const result: PoLine[] = [];
  const asinRe = /\b(B0[A-Z0-9]{8})\b/;

  for (let i = 0; i < lines.length; i++) {
    const asinMatch = lines[i].match(asinRe);
    if (!asinMatch) continue;
    const asin = asinMatch[1];

    // Scan nearby lines for a quantity (an integer 1–9999 that looks like qty)
    let qty = 0;
    let title = "";
    const window = lines.slice(Math.max(0, i - 3), i + 6);
    for (const wl of window) {
      const qtyMatch = wl.match(/\b([1-9]\d{0,3})\b/);
      if (qtyMatch && qty === 0) qty = parseInt(qtyMatch[1]);
      if (!title && wl.length > 10 && !asinRe.test(wl)) title = wl;
    }

    if (qty > 0) {
      const existing = result.find((r) => r.asin === asin);
      if (existing) {
        existing.qty += qty;
      } else {
        result.push({ asin, title: title || asin, qty });
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
  // dynamic import avoids edge-runtime issues
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const pdfParse = (await import("pdf-parse") as any).default ?? (await import("pdf-parse") as any);
  const parsed = await pdfParse(buffer);
  const lines = extractLines(parsed.text);

  if (lines.length === 0) {
    return NextResponse.json({ error: "مش قادر يلاقي ASINs في الملف — تأكد إنه PO من أمازون" }, { status: 422 });
  }

  return NextResponse.json({ lines, text: parsed.text });
}
