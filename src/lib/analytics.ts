import type { Booking, Workspace } from "./types";
import { isSameDay } from "./utils";

/**
 * Small derived numbers for the dashboard. Kept separate from the store so the
 * maths is easy to find, review and change later.
 */

export function todayStats(ws: Workspace) {
  const today = new Date();
  const todaysMessages = ws.messages.filter((m) => isSameDay(m.created_at, today));
  const todaysBookings = ws.bookings.filter(
    (b) => isSameDay(b.starts_at, today) && b.status !== "cancelled",
  );

  return {
    messagesToday: todaysMessages.length,
    bookingsToday: todaysBookings.length,
    aiAnswersToday: todaysMessages.filter((m) => m.author === "ai").length,
    needsAttention: ws.conversations.filter((c) => c.needs_attention).length,
  };
}

export interface DayPoint {
  label: string;
  date: Date;
  messages: number;
  bookings: number;
}

/** Messages and bookings for each of the last 7 days (oldest first). */
export function weeklySeries(ws: Workspace): DayPoint[] {
  const days: DayPoint[] = [];
  for (let i = 6; i >= 0; i--) {
    const date = new Date();
    date.setDate(date.getDate() - i);
    date.setHours(0, 0, 0, 0);
    days.push({
      label: date.toLocaleDateString("en-GB", { weekday: "short" }),
      date,
      messages: ws.messages.filter((m) => isSameDay(m.created_at, date)).length,
      bookings: ws.bookings.filter(
        (b) => isSameDay(b.starts_at, date) && b.status !== "cancelled",
      ).length,
    });
  }
  return days;
}

/** Upcoming, not-cancelled bookings, soonest first. */
export function upcomingBookings(ws: Workspace): Booking[] {
  return ws.bookings
    .filter((b) => b.status !== "cancelled" && new Date(b.starts_at) >= new Date(Date.now() - 3600_000))
    .sort((a, b) => a.starts_at.localeCompare(b.starts_at));
}

export function bookingsByDay(bookings: Booking[]): Map<string, Booking[]> {
  const map = new Map<string, Booking[]>();
  for (const booking of bookings) {
    const key = new Date(booking.starts_at).toDateString();
    map.set(key, [...(map.get(key) ?? []), booking]);
  }
  return map;
}

/** Unread count for the Conversations tab in the nav. */
export function unreadCount(ws: Workspace) {
  return ws.conversations.reduce((sum, c) => sum + (c.unread > 0 ? 1 : 0), 0);
}
