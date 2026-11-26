"use client";

import * as React from "react";
import { toast } from "sonner";
import {
  CalendarDays,
  Check,
  ChevronLeft,
  ChevronRight,
  Clock,
  Sparkles,
  X,
} from "lucide-react";
import { useOcto } from "@/lib/store";
import type { Booking } from "@/lib/types";
import { bookingsByDay, upcomingBookings } from "@/lib/analytics";
import { PageHeader } from "@/components/page-header";
import { EmptyState } from "@/components/empty-state";
import { ConfirmDialog } from "@/components/confirm-dialog";
import { TestAssistantButton } from "@/components/assistant-tester";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Field, Input } from "@/components/ui/field";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { cn, formatDateLong, formatKes, formatTime } from "@/lib/utils";

/**
 * Bookings: a small calendar for orientation, and a plain list of appointments
 * with the three things an owner actually does — confirm, reschedule, cancel.
 * Every change sends the customer a WhatsApp message.
 */

export default function BookingsPage() {
  const { workspace, updateBooking } = useOcto();
  const [selectedDay, setSelectedDay] = React.useState<Date | null>(null);
  const [rescheduling, setRescheduling] = React.useState<Booking | null>(null);
  const [cancelling, setCancelling] = React.useState<Booking | null>(null);

  const upcoming = upcomingBookings(workspace);
  const visible = selectedDay
    ? workspace.bookings
        .filter(
          (b) =>
            new Date(b.starts_at).toDateString() === selectedDay.toDateString() &&
            b.status !== "cancelled",
        )
        .sort((a, b) => a.starts_at.localeCompare(b.starts_at))
    : upcoming;

  const grouped = bookingsByDay(visible);

  /**
   * Tell the customer what changed, on WhatsApp.
   * Returns true only when the message really went out, so the toast we show
   * afterwards never promises a message that was never sent.
   */
  async function notifyCustomer(phone: string, body: string) {
    try {
      const response = await fetch("/api/whatsapp/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ to: phone, body }),
      });
      const data = (await response.json().catch(() => ({}))) as { sent?: boolean };
      return Boolean(data.sent);
    } catch {
      // Non-blocking: the booking change is already saved.
      return false;
    }
  }

  /** One friendly line after a change: what happened, and whether we told them. */
  function notifyLine(firstName: string, sent: boolean) {
    return sent
      ? `We sent ${firstName} a WhatsApp message.`
      : `Connect WhatsApp to message ${firstName} automatically.`;
  }

  async function confirmBooking(booking: Booking) {
    const firstName = booking.customer_name.split(" ")[0];
    updateBooking(booking.id, { status: "confirmed" });
    const sent = await notifyCustomer(
      booking.customer_phone,
      `Hi ${firstName}, your ${booking.service_name} at ${workspace.business.name} on ${formatDateLong(booking.starts_at)} at ${formatTime(booking.starts_at)} is confirmed. See you then!`,
    );
    toast.success("Booking confirmed", { description: notifyLine(firstName, sent) });
  }

  return (
    <>
      <PageHeader
        title="Bookings"
        description="Appointments your assistant booked, all in one place."
      />

      <div className="grid gap-4 lg:grid-cols-[340px_1fr] lg:items-start">
        <Calendar
          bookings={workspace.bookings}
          selectedDay={selectedDay}
          onSelect={(day) => setSelectedDay(day)}
        />

        <section className="min-w-0">
          <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
            <h2 className="text-lg font-semibold">
              {selectedDay ? formatDateLong(selectedDay.toISOString()) : "Coming up"}
            </h2>
            {selectedDay ? (
              <Button variant="ghost" size="sm" onClick={() => setSelectedDay(null)}>
                Show all upcoming
              </Button>
            ) : null}
          </div>

          {visible.length === 0 ? (
            <EmptyState
              icon={CalendarDays}
              title={selectedDay ? "Nothing booked that day" : "No bookings yet"}
              description={
                selectedDay
                  ? "Try another day, or check coming up. Your assistant adds bookings here automatically."
                  : "Your assistant will add appointments here as customers book on WhatsApp."
              }
              action={
                selectedDay ? (
                  <Button variant="secondary" onClick={() => setSelectedDay(null)}>
                    See upcoming bookings
                  </Button>
                ) : (
                  <TestAssistantButton />
                )
              }
            />
          ) : (
            <div className="flex flex-col gap-5">
              {[...grouped.entries()].map(([dayKey, dayBookings]) => (
                <div key={dayKey}>
                  <p className="mb-2 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
                    {formatDateLong(dayBookings[0].starts_at)}
                  </p>
                  <div className="flex flex-col gap-2">
                    {dayBookings.map((booking) => (
                      <BookingRow
                        key={booking.id}
                        booking={booking}
                        onConfirm={() => confirmBooking(booking)}
                        onReschedule={() => setRescheduling(booking)}
                        onCancel={() => setCancelling(booking)}
                      />
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>

      {/* Reschedule */}
      <RescheduleDialog
        booking={rescheduling}
        onClose={() => setRescheduling(null)}
        onSave={async (startsAt) => {
          if (!rescheduling) return;
          const firstName = rescheduling.customer_name.split(" ")[0];
          updateBooking(rescheduling.id, { starts_at: startsAt, status: "confirmed" });
          setRescheduling(null);
          const sent = await notifyCustomer(
            rescheduling.customer_phone,
            `Hi ${firstName}, your ${rescheduling.service_name} has moved to ${formatDateLong(startsAt)} at ${formatTime(startsAt)}. Reply here if that doesn't work.`,
          );
          toast.success("Booking moved", { description: notifyLine(firstName, sent) });
        }}
      />

      {/* Cancel */}
      <ConfirmDialog
        open={Boolean(cancelling)}
        onOpenChange={(open) => !open && setCancelling(null)}
        title="Cancel this booking?"
        description={
          cancelling
            ? `${cancelling.customer_name} will be told the ${formatTime(cancelling.starts_at)} appointment is cancelled.`
            : ""
        }
        confirmLabel="Yes, cancel it"
        cancelLabel="Keep booking"
        onConfirm={async () => {
          if (!cancelling) return;
          const firstName = cancelling.customer_name.split(" ")[0];
          updateBooking(cancelling.id, { status: "cancelled" });
          setCancelling(null);
          const sent = await notifyCustomer(
            cancelling.customer_phone,
            `Hi ${firstName}, your ${cancelling.service_name} on ${formatDateLong(cancelling.starts_at)} at ${formatTime(cancelling.starts_at)} has been cancelled. Reply here anytime to rebook.`,
          );
          toast.success("Booking cancelled", { description: notifyLine(firstName, sent) });
        }}
      />
    </>
  );
}

/* ------------------------------- pieces ------------------------------- */

function BookingRow({
  booking,
  onConfirm,
  onReschedule,
  onCancel,
}: {
  booking: Booking;
  onConfirm: () => void;
  onReschedule: () => void;
  onCancel: () => void;
}) {
  return (
    <Card className="p-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <p className="text-base font-semibold">{booking.customer_name}</p>
            {booking.created_by === "ai" ? (
              <Badge tone="brand">
                <Sparkles className="size-3" /> Booked by AI
              </Badge>
            ) : null}
            <StatusBadge status={booking.status} />
          </div>
          <p className="mt-1 text-sm text-muted-foreground">
            {booking.service_name} · {formatKes(booking.price)} ·{" "}
            {booking.duration_min} min
          </p>
          <p className="mt-1 flex items-center gap-1.5 text-sm font-medium">
            <Clock className="size-4 text-muted-foreground" />
            {formatTime(booking.starts_at)}
            <span className="text-muted-foreground">· {booking.customer_phone}</span>
          </p>
        </div>

        <div className="flex w-full flex-wrap gap-2 sm:w-auto">
          {booking.status === "pending" ? (
            <Button size="sm" onClick={onConfirm} className="flex-1 sm:flex-none">
              <Check /> Confirm
            </Button>
          ) : (
            <Button
              variant="secondary"
              size="sm"
              onClick={onReschedule}
              className="flex-1 sm:flex-none"
            >
              Reschedule
            </Button>
          )}
          <Button
            variant="ghost"
            size="sm"
            onClick={onCancel}
            className="flex-1 text-muted-foreground hover:text-accent sm:flex-none"
          >
            <X /> Cancel
          </Button>
        </div>
      </div>
    </Card>
  );
}

function StatusBadge({ status }: { status: Booking["status"] }) {
  if (status === "confirmed") return <Badge tone="brand">Confirmed</Badge>;
  if (status === "pending") return <Badge tone="alert">Needs confirming</Badge>;
  if (status === "cancelled") return <Badge tone="neutral">Cancelled</Badge>;
  return <Badge tone="neutral">Done</Badge>;
}

function RescheduleDialog({
  booking,
  onClose,
  onSave,
}: {
  booking: Booking | null;
  onClose: () => void;
  onSave: (startsAt: string) => void;
}) {
  return (
    <Dialog open={Boolean(booking)} onOpenChange={(open) => !open && onClose()}>
      <DialogContent>
        {/* Keyed by booking id so the form starts fresh each time it opens. */}
        {booking ? (
          <RescheduleForm key={booking.id} booking={booking} onClose={onClose} onSave={onSave} />
        ) : null}
      </DialogContent>
    </Dialog>
  );
}

function RescheduleForm({
  booking,
  onClose,
  onSave,
}: {
  booking: Booking;
  onClose: () => void;
  onSave: (startsAt: string) => void;
}) {
  const start = new Date(booking.starts_at);
  const [date, setDate] = React.useState(
    `${start.getFullYear()}-${String(start.getMonth() + 1).padStart(2, "0")}-${String(start.getDate()).padStart(2, "0")}`,
  );
  const [time, setTime] = React.useState(
    `${String(start.getHours()).padStart(2, "0")}:${String(start.getMinutes()).padStart(2, "0")}`,
  );
  const [error, setError] = React.useState<string | null>(null);

  return (
    <>
      <DialogHeader>
        <DialogTitle>Move this booking</DialogTitle>
        <DialogDescription>
          Pick a new date and time for {booking.customer_name}.
        </DialogDescription>
      </DialogHeader>

      <div className="grid gap-4 sm:grid-cols-2">
          <Field label="New date" htmlFor="booking-date" error={error ?? undefined}>
            <Input
              id="booking-date"
              type="date"
              value={date}
              onChange={(event) => setDate(event.target.value)}
            />
          </Field>
          <Field label="New time" htmlFor="booking-time">
            <Input
              id="booking-time"
              type="time"
              value={time}
              onChange={(event) => setTime(event.target.value)}
            />
          </Field>
        </div>

        <DialogFooter>
          <Button variant="secondary" onClick={onClose}>
            Keep current time
          </Button>
          <Button
            onClick={() => {
              if (!date || !time) {
                setError("Please choose both a date and a time.");
                return;
              }
              const next = new Date(`${date}T${time}`);
              if (Number.isNaN(next.getTime())) {
                setError("That date doesn't look right. Please try again.");
                return;
              }
              onSave(next.toISOString());
            }}
          >
            Save new time
          </Button>
        </DialogFooter>
    </>
  );
}

function Calendar({
  bookings,
  selectedDay,
  onSelect,
}: {
  bookings: Booking[];
  selectedDay: Date | null;
  onSelect: (day: Date | null) => void;
}) {
  const [cursor, setCursor] = React.useState(() => {
    const d = new Date();
    return new Date(d.getFullYear(), d.getMonth(), 1);
  });

  const year = cursor.getFullYear();
  const month = cursor.getMonth();
  const firstWeekday = (new Date(year, month, 1).getDay() + 6) % 7; // Monday first
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const today = new Date();

  const countFor = (day: number) =>
    bookings.filter(
      (b) =>
        b.status !== "cancelled" &&
        new Date(b.starts_at).getFullYear() === year &&
        new Date(b.starts_at).getMonth() === month &&
        new Date(b.starts_at).getDate() === day,
    ).length;

  const cells: (number | null)[] = [
    ...Array.from({ length: firstWeekday }, () => null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ];

  return (
    <Card className="p-4">
      <div className="mb-3 flex items-center justify-between">
        <button
          type="button"
          aria-label="Previous month"
          onClick={() => setCursor(new Date(year, month - 1, 1))}
          className="grid size-11 place-items-center rounded-full text-muted-foreground hover:bg-muted hover:text-foreground"
        >
          <ChevronLeft className="size-5" />
        </button>
        <p className="text-base font-semibold">
          {cursor.toLocaleDateString("en-GB", { month: "long", year: "numeric" })}
        </p>
        <button
          type="button"
          aria-label="Next month"
          onClick={() => setCursor(new Date(year, month + 1, 1))}
          className="grid size-11 place-items-center rounded-full text-muted-foreground hover:bg-muted hover:text-foreground"
        >
          <ChevronRight className="size-5" />
        </button>
      </div>

      <div className="grid grid-cols-7 gap-1 text-center">
        {["M", "T", "W", "T", "F", "S", "S"].map((day, index) => (
          <span key={`${day}-${index}`} className="py-1 text-xs font-semibold text-muted-foreground">
            {day}
          </span>
        ))}
        {cells.map((day, index) => {
          if (day === null) return <span key={`empty-${index}`} />;
          const cellDate = new Date(year, month, day);
          const isToday = cellDate.toDateString() === today.toDateString();
          const isSelected = selectedDay?.toDateString() === cellDate.toDateString();
          const count = countFor(day);
          return (
            <button
              key={day}
              type="button"
              onClick={() => onSelect(isSelected ? null : cellDate)}
              aria-label={`${cellDate.toDateString()}${count ? `, ${count} bookings` : ""}`}
              aria-pressed={isSelected}
              className={cn(
                "relative mx-auto flex min-h-11 w-full max-w-11 flex-col items-center justify-center rounded-md text-sm font-medium transition-colors",
                isSelected
                  ? "bg-primary text-primary-foreground"
                  : isToday
                    ? "bg-primary-soft text-primary"
                    : "hover:bg-muted",
              )}
            >
              {day}
              {count > 0 ? (
                <span
                  className={cn(
                    "absolute bottom-1 size-1 rounded-full",
                    isSelected ? "bg-primary-foreground" : "bg-primary",
                  )}
                />
              ) : null}
            </button>
          );
        })}
      </div>

      <p className="mt-3 flex items-center gap-1.5 text-xs text-muted-foreground">
        <span className="size-1.5 rounded-full bg-primary" />
        A dot means there&apos;s a booking that day
      </p>
    </Card>
  );
}
