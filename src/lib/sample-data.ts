import type { Business, Workspace } from "./types";
import { atTime } from "./utils";

/**
 * Realistic demo workspace so the product can be explored before any
 * WhatsApp or Supabase keys exist. Timestamps are relative to "now", so the
 * dashboard always looks alive when the app is opened.
 *
 * Business: Malaika Hair Studio, a salon in Kilimani, Nairobi.
 */

const BUSINESS_ID = "biz_malaika";

function dayOffset(days: number) {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return d;
}

/** ISO timestamp `days` away from today at a given hour. */
function stamp(days: number, hour: number, minute = 0) {
  return atTime(dayOffset(days), hour, minute);
}

const business: Business = {
  id: BUSINESS_ID,
  name: "Malaika Hair Studio",
  type: "salon",
  location: "Kilimani, Nairobi",
  whatsapp_number: "+254 712 345 678",
  whatsapp_connected: true,
  tone: "friendly",
  language: "mixed",
  plan: "starter",
  notify_new_booking: true,
  notify_escalation: true,
  notify_daily_summary: false,
  hours: {
    mon: { open: "08:00", close: "19:00", closed: false },
    tue: { open: "08:00", close: "19:00", closed: false },
    wed: { open: "08:00", close: "19:00", closed: false },
    thu: { open: "08:00", close: "19:00", closed: false },
    fri: { open: "08:00", close: "20:00", closed: false },
    sat: { open: "08:00", close: "18:00", closed: false },
    sun: { open: "09:00", close: "13:00", closed: true },
  },
  created_at: stamp(-14, 9),
};

const services = [
  { id: "svc_braids", business_id: BUSINESS_ID, name: "Braiding (knotless)", price: 2500, duration_min: 180 },
  { id: "svc_wash", business_id: BUSINESS_ID, name: "Wash and blow dry", price: 1200, duration_min: 60 },
  { id: "svc_deep", business_id: BUSINESS_ID, name: "Deep conditioning treatment", price: 1500, duration_min: 45 },
  { id: "svc_kids", business_id: BUSINESS_ID, name: "Children's haircut", price: 500, duration_min: 30 },
  { id: "svc_nails", business_id: BUSINESS_ID, name: "Gel manicure", price: 1000, duration_min: 45 },
];

const faqs = [
  {
    id: "faq_braids",
    business_id: BUSINESS_ID,
    question: "How much is braiding?",
    answer:
      "Knotless braiding is KSh 2,500 and takes about 3 hours. The price includes washing and a light trim.",
    enabled: true,
  },
  {
    id: "faq_hours",
    business_id: BUSINESS_ID,
    question: "What time do you open?",
    answer:
      "We are open Monday to Friday 8am to 7pm, Saturday 8am to 6pm. We are closed on Sunday.",
    enabled: true,
  },
  {
    id: "faq_location",
    business_id: BUSINESS_ID,
    question: "Where are you located? Is there parking?",
    answer:
      "We are in Kilimani, on the second floor of Wood Avenue Plaza, opposite Yaya Centre. Free parking is available behind the building.",
    enabled: true,
  },
  {
    id: "faq_kids",
    business_id: BUSINESS_ID,
    question: "Do you cut children's hair?",
    answer: "Yes, children's haircuts are KSh 500 and take about 30 minutes.",
    enabled: true,
  },
  {
    id: "faq_payment",
    business_id: BUSINESS_ID,
    question: "Do you accept M-Pesa?",
    answer: "Yes, we accept M-Pesa, cash and card.",
    enabled: true,
  },
  {
    id: "faq_walkin",
    business_id: BUSINESS_ID,
    question: "Do you take walk-ins?",
    answer:
      "Walk-ins are welcome when we have space, but booking ahead is safer, especially on Saturdays.",
    enabled: true,
  },
];

const conversations = [
  {
    id: "conv_wanjiku",
    business_id: BUSINESS_ID,
    customer_name: "Wanjiku Mwangi",
    customer_phone: "+254 722 118 340",
    last_message_at: stamp(0, 9, 42),
    ai_paused: false,
    needs_attention: false,
    unread: 1,
  },
  {
    id: "conv_faith",
    business_id: BUSINESS_ID,
    customer_name: "Faith Chebet",
    customer_phone: "+254 733 402 991",
    last_message_at: stamp(0, 9, 18),
    ai_paused: false,
    needs_attention: true,
    unread: 2,
  },
  {
    id: "conv_brian",
    business_id: BUSINESS_ID,
    customer_name: "Brian Otieno",
    customer_phone: "+254 701 556 202",
    last_message_at: stamp(0, 8, 51),
    ai_paused: false,
    needs_attention: false,
    unread: 0,
  },
  {
    id: "conv_amina",
    business_id: BUSINESS_ID,
    customer_name: "Amina Hassan",
    customer_phone: "+254 715 903 447",
    last_message_at: stamp(-1, 17, 26),
    ai_paused: true,
    needs_attention: false,
    unread: 0,
  },
  {
    id: "conv_kelvin",
    business_id: BUSINESS_ID,
    customer_name: "Kelvin Kariuki",
    customer_phone: "+254 726 774 019",
    last_message_at: stamp(-1, 14, 8),
    ai_paused: false,
    needs_attention: false,
    unread: 0,
  },
];

type Seed = [conv: string, author: "customer" | "ai" | "owner", body: string, days: number, hour: number, min: number];

const seeds: Seed[] = [
  // Today — Wanjiku books braiding
  ["conv_wanjiku", "customer", "Hi! How much do you charge for knotless braids?", 0, 9, 30],
  ["conv_wanjiku", "ai", "Hi Wanjiku! Knotless braiding is KSh 2,500 and takes about 3 hours, including a wash and light trim. Would you like me to book you in?", 0, 9, 31],
  ["conv_wanjiku", "customer", "Yes please, Saturday morning if possible", 0, 9, 34],
  ["conv_wanjiku", "ai", "Done! I've booked you for Saturday 28th at 9:00am with Malaika. You'll get a reminder the day before. See you then 💚", 0, 9, 35],
  ["conv_wanjiku", "customer", "Perfect, thank you!", 0, 9, 42],

  // Today — Faith asks something the AI can't answer (escalated)
  ["conv_faith", "customer", "Do you do bridal makeup? I need it for 4 people on 12 December", 0, 9, 5],
  ["conv_faith", "ai", "That's a great question! I don't have the details on bridal makeup packages, so I've asked the team to confirm for you. Someone will reply shortly.", 0, 9, 5],
  ["conv_faith", "customer", "Also can you hold a Saturday morning slot for a trial?", 0, 9, 18],

  // Today — Brian asks about opening hours
  ["conv_brian", "customer", "Hello, are you open on Sunday?", 0, 8, 47],
  ["conv_brian", "ai", "Hi Brian! We are closed on Sunday. We're open Monday to Friday 8am–7pm and Saturday 8am–6pm. Would you like to book for Saturday?", 0, 8, 47],
  ["conv_brian", "customer", "No that's fine, I'll come Saturday. Asante", 0, 8, 51],

  // Yesterday — Amina, owner took over
  ["conv_amina", "customer", "Hi, I'm coming for a wedding on 30th. Can you do 3 people at the same time?", -1, 16, 40],
  ["conv_amina", "ai", "Hi Amina! I can book appointments, but for a group of 3 on the same day I'd like the team to confirm timing. Someone will follow up shortly.", -1, 16, 40],
  ["conv_amina", "owner", "Hi Amina, it's Carol. We can do 3 stations at 10am on the 30th. Shall I book that for you?", -1, 17, 20],
  ["conv_amina", "customer", "Yes please that works", -1, 17, 26],

  // Yesterday — Kelvin books a kids' cut
  ["conv_kelvin", "customer", "How much for a haircut for my son? He's 6", -1, 13, 55],
  ["conv_kelvin", "ai", "Children's haircuts are KSh 500 and take about 30 minutes. I've booked him for tomorrow at 3:00pm — reply here if you need a different time.", -1, 13, 56],
  ["conv_kelvin", "owner", "Confirmed, see you tomorrow 🙂", -1, 14, 8],
];

/**
 * A few extra days of history so the weekly chart and the "Messages today"
 * counters look believable. Two AI answers per conversation per day.
 */
function historySeeds(): Seed[] {
  const out: Seed[] = [];
  // A few different exchanges per customer so no two days look copy-pasted.
  const scripts: Array<{ conv: string; turns: Array<["customer" | "ai", string]> }> = [
    {
      conv: "conv_wanjiku",
      turns: [
        ["customer", "Hi, do you have space this week?"],
        ["ai", "Yes, we have space on Thursday and Friday afternoon. Would you like me to book one of those?"],
      ],
    },
    {
      conv: "conv_wanjiku",
      turns: [
        ["customer", "Good morning, do you have gel manicure today?"],
        ["ai", "Good morning Wanjiku! Yes, we have space at 2pm today. Gel manicure is KSh 1,000 and takes 45 minutes. Shall I book it?"],
      ],
    },
    {
      conv: "conv_wanjiku",
      turns: [
        ["customer", "Asante for Saturday. Do you also do deep conditioning?"],
        ["ai", "Yes, deep conditioning is KSh 1,500 and takes about 45 minutes. Would you like to add it to your Saturday visit?"],
      ],
    },
    {
      conv: "conv_brian",
      turns: [
        ["customer", "What's the price for a wash and blow dry?"],
        ["ai", "A wash and blow dry is KSh 1,200 and takes about an hour. Shall I find you a slot?"],
      ],
    },
    {
      conv: "conv_brian",
      turns: [
        ["customer", "Can I come in at 6pm on Friday?"],
        ["ai", "We're open until 8pm on Friday, so 6pm is fine. Shall I put your name down?"],
      ],
    },
    {
      conv: "conv_kelvin",
      turns: [
        ["customer", "Are you open on Saturday?"],
        ["ai", "We're open Saturday 8am to 6pm. What time works best for you?"],
      ],
    },
    {
      conv: "conv_kelvin",
      turns: [
        ["customer", "Can you do cornrows for a 6 year old?"],
        ["ai", "Yes. Cornrows for children are KSh 700 and take about 40 minutes. Would you like Saturday morning?"],
      ],
    },
    {
      conv: "conv_brian",
      turns: [
        ["customer", "Do you have parking?"],
        ["ai", "There's free parking behind the building and on the street. Just tell the guard you're here for Malaika."],
      ],
    },
  ];
  // 6 days back to yesterday, 3-6 conversations per day
  for (let day = 6; day >= 1; day--) {
    const count = 3 + ((day * 7) % 4);
    for (let i = 0; i < count; i++) {
      const script = scripts[(day + i) % scripts.length];
      const hour = 9 + ((day + i * 2) % 8);
      script.turns.forEach(([author, body], turn) => {
        out.push([script.conv, author, body, -day, hour, 10 + turn]);
      });
    }
  }
  return out;
}

const bookings: Workspace["bookings"] = [
  {
    id: "bk_wanjiku",
    business_id: BUSINESS_ID,
    conversation_id: "conv_wanjiku",
    customer_name: "Wanjiku Mwangi",
    customer_phone: "+254 722 118 340",
    service_name: "Braiding (knotless)",
    price: 2500,
    starts_at: stamp(3, 9),
    duration_min: 180,
    status: "confirmed",
    created_by: "ai",
  },
  {
    id: "bk_kelvin",
    business_id: BUSINESS_ID,
    conversation_id: "conv_kelvin",
    customer_name: "Kelvin Kariuki",
    customer_phone: "+254 726 774 019",
    service_name: "Children's haircut",
    price: 500,
    starts_at: stamp(0, 15),
    duration_min: 30,
    status: "pending",
    created_by: "ai",
  },
  {
    id: "bk_grace",
    business_id: BUSINESS_ID,
    conversation_id: null,
    customer_name: "Grace Njeri",
    customer_phone: "+254 720 118 665",
    service_name: "Deep conditioning treatment",
    price: 1500,
    starts_at: stamp(0, 11, 30),
    duration_min: 45,
    status: "confirmed",
    created_by: "owner",
  },
  {
    id: "bk_amina",
    business_id: BUSINESS_ID,
    conversation_id: "conv_amina",
    customer_name: "Amina Hassan",
    customer_phone: "+254 715 903 447",
    service_name: "Braiding (knotless)",
    price: 2500,
    starts_at: stamp(2, 10),
    duration_min: 180,
    status: "confirmed",
    created_by: "owner",
  },
  {
    id: "bk_faith",
    business_id: BUSINESS_ID,
    conversation_id: "conv_faith",
    customer_name: "Faith Chebet",
    customer_phone: "+254 733 402 991",
    service_name: "Wash and blow dry",
    price: 1200,
    starts_at: stamp(1, 16),
    duration_min: 60,
    status: "pending",
    created_by: "ai",
  },
  {
    id: "bk_past",
    business_id: BUSINESS_ID,
    conversation_id: null,
    customer_name: "Mercy Wambui",
    customer_phone: "+254 799 220 118",
    service_name: "Gel manicure",
    price: 1000,
    starts_at: stamp(-2, 14),
    duration_min: 45,
    status: "completed",
    created_by: "ai",
  },
];

/** Build a fresh copy of the demo workspace (new timestamps each call). */
export function createSampleWorkspace(): Workspace {
  const allSeeds = [...seeds, ...historySeeds()];
  const messages = allSeeds
    .map(([conversation_id, author, body, days, hour, min], index) => ({
      id: `msg_${index}`,
      business_id: BUSINESS_ID,
      conversation_id,
      author,
      body,
      created_at: stamp(days, hour, min),
    }))
    .sort((a, b) => a.created_at.localeCompare(b.created_at));

  return {
    business,
    services,
    faqs,
    conversations,
    messages,
    bookings,
    onboarded_at: stamp(-14, 9),
  };
}

/** A blank workspace used by the onboarding wizard. */
export function createEmptyWorkspace(): Workspace {
  return {
    business: {
      ...business,
      id: "biz_new",
      name: "",
      location: "",
      whatsapp_number: null,
      whatsapp_connected: false,
      plan: "starter",
      created_at: new Date().toISOString(),
    },
    services: [],
    faqs: [],
    conversations: [],
    messages: [],
    bookings: [],
    onboarded_at: null,
  };
}
