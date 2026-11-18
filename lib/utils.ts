import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Normalizes Indonesian phone numbers into international WhatsApp format (e.g. 628123456789).
 * Handles formats like: 0812-3456-7890, +62 812 3456 7890, 6281234567890.
 */
export function normalizeWhatsAppNumber(phone?: string | null): string | null {
  if (!phone) return null;

  // Remove all non-numeric characters except leading plus if any
  const cleaned = phone.replace(/[^\d+]/g, "").trim();
  if (!cleaned) return null;

  let digits = cleaned.replace(/^\+/, "");

  // If starts with '08', replace '0' with '62'
  if (digits.startsWith("08")) {
    digits = "62" + digits.substring(1);
  } else if (digits.startsWith("8")) {
    digits = "62" + digits;
  }

  // Indonesian mobile numbers usually have between 10 to 14 digits after normalization
  if (digits.length < 10 || digits.length > 15) {
    return null;
  }

  return digits;
}

/**
 * Generates direct WhatsApp click-to-chat URL with optional prefilled message
 */
export function getWhatsAppUrl(phone?: string | null, message?: string): string | null {
  const normalized = normalizeWhatsAppNumber(phone);
  if (!normalized) return null;

  const base = `https://wa.me/${normalized}`;
  if (message) {
    return `${base}?text=${encodeURIComponent(message)}`;
  }
  return base;
}

/**
 * Formats standard Indonesian Rupiah currency with tabular spacing
 */
export function formatRupiah(amount: number | string): string {
  const num = typeof amount === "string" ? parseFloat(amount) : amount;
  if (isNaN(num)) return "Rp 0";
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(num);
}

/**
 * Formats date into standard Indonesian format (e.g., 17 Nov 2026)
 */
export function formatIndonesianDate(dateInput: Date | string | number): string {
  const d = new Date(dateInput);
  if (isNaN(d.getTime())) return "-";

  return new Intl.DateTimeFormat("id-ID", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(d);
}

export function formatIndonesianDateTime(dateInput: Date | string | number): string {
  const d = new Date(dateInput);
  if (isNaN(d.getTime())) return "-";

  return new Intl.DateTimeFormat("id-ID", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(d);
}
