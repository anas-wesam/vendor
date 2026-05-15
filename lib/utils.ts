import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatNumber(num: number) {
  return new Intl.NumberFormat("en-US").format(num);
}

export function getStockStatus(qty: number, minAlert: number) {
  if (qty === 0) return "out";
  if (qty <= minAlert) return "low";
  return "ok";
}
