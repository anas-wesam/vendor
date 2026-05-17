import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
  const apiKey = process.env.CLOUDINARY_API_KEY;
  const apiSecret = process.env.CLOUDINARY_API_SECRET;

  if (!cloudName || !apiKey || !apiSecret) {
    return NextResponse.json({ error: "Image upload not configured" }, { status: 503 });
  }

  const formData = await req.formData();
  const file = formData.get("file") as File | null;
  if (!file) return NextResponse.json({ error: "No file provided" }, { status: 400 });

  const allowedTypes = ["image/jpeg", "image/png", "image/webp", "image/gif"];
  if (!allowedTypes.includes(file.type)) {
    return NextResponse.json({ error: "JPG, PNG, WebP, GIF فقط" }, { status: 400 });
  }

  const timestamp = Math.floor(Date.now() / 1000);
  const folder = "vendor-products";
  const toSign = `folder=${folder}&timestamp=${timestamp}${apiSecret}`;
  const { createHash } = await import("crypto");
  const signature = createHash("sha256").update(toSign).digest("hex");

  const upload = new FormData();
  upload.append("file", file);
  upload.append("api_key", apiKey);
  upload.append("timestamp", String(timestamp));
  upload.append("signature", signature);
  upload.append("folder", folder);

  const res = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/image/upload`, {
    method: "POST",
    body: upload,
  });

  if (!res.ok) {
    const err = await res.json();
    return NextResponse.json({ error: err.error?.message ?? "Upload failed" }, { status: 500 });
  }

  const data = await res.json();
  return NextResponse.json({ url: data.secure_url });
}
