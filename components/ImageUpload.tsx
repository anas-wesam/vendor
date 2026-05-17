"use client";

import { useRef, useState } from "react";
import Image from "next/image";

export default function ImageUpload({
  value,
  onChange,
}: {
  value: string;
  onChange: (url: string) => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");

  const handleFile = async (file: File) => {
    setError("");
    setUploading(true);
    const fd = new FormData();
    fd.append("file", file);
    const res = await fetch("/api/upload", { method: "POST", body: fd });
    setUploading(false);
    if (res.ok) {
      const data = await res.json();
      onChange(data.url);
    } else {
      const data = await res.json().catch(() => ({}));
      setError(data.error ?? "فشل رفع الصورة");
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  };

  const handleRemove = () => {
    onChange("");
    if (inputRef.current) inputRef.current.value = "";
  };

  return (
    <div>
      {value ? (
        <div className="relative w-full h-40 rounded-lg overflow-hidden border border-gray-200 group">
          <Image src={value} alt="Product image" fill className="object-contain" unoptimized />
          <button
            type="button"
            onClick={handleRemove}
            className="absolute top-2 right-2 bg-red-500 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity"
          >
            حذف
          </button>
        </div>
      ) : (
        <div
          onDrop={handleDrop}
          onDragOver={(e) => e.preventDefault()}
          onClick={() => inputRef.current?.click()}
          className="w-full h-40 border-2 border-dashed border-gray-300 rounded-lg flex flex-col items-center justify-center cursor-pointer hover:border-orange-400 hover:bg-orange-50 transition-colors"
        >
          {uploading ? (
            <div className="text-sm text-gray-400">جاري الرفع...</div>
          ) : (
            <>
              <span className="text-3xl mb-2">🖼️</span>
              <p className="text-sm text-gray-500 font-medium">اضغط لرفع صورة</p>
              <p className="text-xs text-gray-400 mt-1">JPG, PNG, WebP</p>
            </>
          )}
        </div>
      )}
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFile(f); }}
        className="hidden"
      />
      {error && <p className="text-xs text-red-600 mt-1">{error}</p>}
    </div>
  );
}
