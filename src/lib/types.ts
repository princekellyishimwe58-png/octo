/**
 * Octo data model.
 *
 * Kept deliberately small: businesses, faqs, services, conversations,
 * messages, bookings. These shapes mirror `supabase/schema.sql` 1:1 so the
 * demo store and Supabase can be swapped without touching the screens.
 */

export type BusinessType =
  | "salon"
  | "clinic"
  | "school"
  | "shop"
  | "restaurant"
  | "other";

export type Tone = "friendly" | "professional" | "casual";
export type Language = "english" | "swahili" | "mixed";
export type Plan = "starter" | "growth" | "pro";
export type DayKey = "mon" | "tue" | "wed" | "thu" | "fri" | "sat" | "sun";

export type AiProvider = "openai" | "gemini" | "n8n";

export interface Business {
  id: string;
  name: string;
  type: BusinessType;
  location: string;
  /** Shown to customers on WhatsApp, e.g. +254 712 345 678 */
  whatsapp_number: string | null;
  whatsapp_connected: boolean;
  tone: Tone;
  language: Language;
  plan: Plan;
  /** Whether the owner wants a WhatsApp ping for new bookings / escalations. */
  notify_new_booking: boolean;
  notify_escalation: boolean;
  notify_daily_summary: boolean;
  hours: Record<DayKey, { open: string; close: string; closed: boolean }>;
  created_at: string;
}

export interface Service {
  id: string;
  business_id: string;
  name: string;
  /** Kenyan shillings, whole numbers. */
  price: number;
  duration_min: number;
}

export interface Faq {
  id: string;
  business_id: string;
  question: string;
  answer: string;
  enabled: boolean;
}

export type MessageAuthor = "customer" | "ai" | "owner";

export interface Message {
  id: string;
  business_id: string;
  conversation_id: string;
  author: MessageAuthor;
  body: string;
  created_at: string;
}

export interface Conversation {
  id: string;
  business_id: string;
  customer_name: string;
  customer_phone: string;
  last_message_at: string;
  /** Set when the owner takes over: the AI stays silent until handed back. */
  ai_paused: boolean;
  /** True when the AI was unsure and asked the owner to follow up. */
  needs_attention: boolean;
  unread: number;
}

export type BookingStatus = "pending" | "confirmed" | "cancelled" | "completed";

export interface Booking {
  id: string;
  business_id: string;
  conversation_id: string | null;
  customer_name: string;
  customer_phone: string;
  service_name: string;
  price: number;
  /** ISO timestamp of the appointment start. */
  starts_at: string;
  duration_min: number;
  status: BookingStatus;
  /** Who created it — bookings made by the AI show a small badge. */
  created_by: "ai" | "owner";
}

/** Everything the app needs for one business, loaded together. */
export interface Workspace {
  business: Business;
  services: Service[];
  faqs: Faq[];
  conversations: Conversation[];
  messages: Message[];
  bookings: Booking[];
  /** null until the owner finishes the 4-step wizard. */
  onboarded_at: string | null;
}
