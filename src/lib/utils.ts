import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/** Short, collision-safe id (good enough for the demo store). */
export function uid(prefix = "id") {
  return `${prefix}_${Math.random().toString(36).slice(2, 10)}`;
}

/** 2500 -> "KSh 2,500" */
export function formatKes(amount: number) {
  return `KSh ${amount.toLocaleString("en-KE")}`;
}

export function formatTime(iso: string) {
  return new Date(iso).toLocaleTimeString("en-GB", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function formatDayShort(iso: string) {
  return new Date(iso).toLocaleDateString("en-GB", {
    weekday: "short",
    day: "numeric",
    month: "short",
  });
}

export function formatDateLong(iso: string) {
  return new Date(iso).toLocaleDateString("en-GB", {
    weekday: "long",
    day: "numeric",
    month: "long",
  });
}

export function isSameDay(a: Date | string, b: Date | string) {
  const d1 = new Date(a);
  const d2 = new Date(b);
  return (
    d1.getFullYear() === d2.getFullYear() &&
    d1.getMonth() === d2.getMonth() &&
    d1.getDate() === d2.getDate()
  );
}

/** ISO string for "today at 09:30" — used by sample data and quick actions. */
export function atTime(base: Date, hours: number, minutes = 0) {
  const d = new Date(base);
  d.setHours(hours, minutes, 0, 0);
  return d.toISOString();
}

export function addDays(base: Date | string, days: number) {
  const d = new Date(base);
  d.setDate(d.getDate() + days);
  return d;
}

export function initials(name: string) {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase() ?? "")
    .join("");
}

/** Deterministic pastel avatar colour from a name. */
export function avatarColor(name: string) {
  const palette = [
    "bg-[#E4F3ED] text-[#0D7A63]",
    "bg-[#FDF0DD] text-[#8A4B08]",
    "bg-[#E8EEF9] text-[#2B4A7D]",
    "bg-[#F6E9F4] text-[#7A3168]",
    "bg-[#EAF1E4] text-[#3F6B2A]",
  ];
  let sum = 0;
  for (const char of name) sum += char.charCodeAt(0);
  return palette[sum % palette.length];
}

/** "2 min ago", "Yesterday", "Mon 18 Nov" */
export function relativeTime(iso: string) {
  const then = new Date(iso).getTime();
  const diffMin = Math.round((Date.now() - then) / 60000);
  if (diffMin < 1) return "Just now";
  if (diffMin < 60) return `${diffMin} min ago`;
  if (diffMin < 60 * 24 && isSameDay(new Date(), iso)) {
    return formatTime(iso);
  }
  const diffDays = Math.floor(diffMin / (60 * 24));
  if (diffDays < 2) return "Yesterday";
  return formatDayShort(iso);
}
