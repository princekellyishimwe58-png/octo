import type { BusinessType } from "./types";

/**
 * Starter content shown during onboarding. Everything here is editable by the
 * owner — it exists so nobody has to face an empty screen.
 */

export const BUSINESS_TYPES: {
  value: BusinessType;
  label: string;
  hint: string;
  emoji: string;
}[] = [
  { value: "salon", label: "Salon or barbershop", hint: "Hair, nails, beauty", emoji: "💇🏾‍♀️" },
  { value: "clinic", label: "Clinic or pharmacy", hint: "Health services", emoji: "🩺" },
  { value: "school", label: "School or tuition", hint: "Lessons and admissions", emoji: "🎓" },
  { value: "shop", label: "Shop or boutique", hint: "Stock and deliveries", emoji: "🛍️" },
  { value: "restaurant", label: "Restaurant or cafe", hint: "Food and orders", emoji: "🍲" },
  { value: "other", label: "Something else", hint: "Any other business", emoji: "✨" },
];

export function businessTypeLabel(type: BusinessType) {
  return BUSINESS_TYPES.find((t) => t.value === type)?.label ?? "Business";
}

export interface StarterFaq {
  question: string;
  answer: string;
}

export interface StarterService {
  name: string;
  price: number;
  duration_min: number;
}

interface StarterPack {
  services: StarterService[];
  faqs: StarterFaq[];
}

const packs: Record<BusinessType, StarterPack> = {
  salon: {
    services: [
      { name: "Braiding (knotless)", price: 2500, duration_min: 180 },
      { name: "Wash and blow dry", price: 1200, duration_min: 60 },
      { name: "Children's haircut", price: 500, duration_min: 30 },
      { name: "Gel manicure", price: 1000, duration_min: 45 },
    ],
    faqs: [
      {
        question: "How much is a haircut?",
        answer: "Please add your real prices in the Services step — customers ask for prices most often.",
      },
      {
        question: "What time do you open?",
        answer: "We are open Monday to Saturday, 8am to 6pm. We are closed on Sunday.",
      },
      {
        question: "Where are you located?",
        answer: "Tell customers your building, street and nearest landmark. Mention parking if you have it.",
      },
      {
        question: "Do you accept M-Pesa?",
        answer: "Yes, we accept M-Pesa, cash and card.",
      },
      {
        question: "Do you take walk-ins?",
        answer: "Walk-ins are welcome when we have space. Booking ahead is safer on weekends.",
      },
    ],
  },
  clinic: {
    services: [
      { name: "Consultation", price: 1000, duration_min: 20 },
      { name: "Full check-up", price: 2500, duration_min: 45 },
      { name: "Blood test", price: 1500, duration_min: 15 },
    ],
    faqs: [
      {
        question: "What time do you open?",
        answer: "We are open Monday to Friday 8am to 5pm, Saturday 8am to 1pm.",
      },
      {
        question: "Do I need an appointment?",
        answer: "Walk-ins are welcome, but booking ahead means less waiting.",
      },
      {
        question: "Do you accept NHIF or insurance?",
        answer: "Tell customers which insurance cards you accept and what they should bring.",
      },
      {
        question: "Where are you located?",
        answer: "Add your building, street and nearest landmark.",
      },
      {
        question: "What does a consultation cost?",
        answer: "A consultation is KSh 1,000 and takes about 20 minutes.",
      },
    ],
  },
  school: {
    services: [
      { name: "School tour", price: 0, duration_min: 30 },
      { name: "Term 1 fees (per term)", price: 35000, duration_min: 15 },
      { name: "Holiday tuition (2 weeks)", price: 8000, duration_min: 15 },
    ],
    faqs: [
      {
        question: "When does the next term start?",
        answer: "Opening day is Monday 5 January. Gates open at 7am.",
      },
      {
        question: "How much are the school fees?",
        answer: "Fees are KSh 35,000 per term. This covers tuition, lunch and activities.",
      },
      {
        question: "What age groups do you take?",
        answer: "We take children from 3 to 14 years old.",
      },
      {
        question: "Can I book a school tour?",
        answer: "Yes, tours run every weekday at 10am. Book a time and we will confirm.",
      },
      {
        question: "Where is the school?",
        answer: "Add your location and the nearest landmark.",
      },
    ],
  },
  shop: {
    services: [
      { name: "Delivery within Nairobi", price: 300, duration_min: 60 },
      { name: "Same-day pickup", price: 0, duration_min: 15 },
    ],
    faqs: [
      {
        question: "Do you deliver?",
        answer: "Yes, delivery within Nairobi is KSh 300 and usually arrives the same day.",
      },
      {
        question: "What time do you open?",
        answer: "We are open Monday to Saturday 8am to 7pm.",
      },
      {
        question: "Can I pay on delivery?",
        answer: "Yes, you can pay with M-Pesa on delivery.",
      },
      {
        question: "Where is the shop?",
        answer: "Add your building, street and nearest landmark.",
      },
      {
        question: "Do you have this in another size or colour?",
        answer: "Send us a photo and we will check the stock for you.",
      },
    ],
  },
  restaurant: {
    services: [
      { name: "Table for 2", price: 0, duration_min: 60 },
      { name: "Table for 4", price: 0, duration_min: 90 },
      { name: "Office lunch delivery", price: 500, duration_min: 30 },
    ],
    faqs: [
      {
        question: "What time do you open?",
        answer: "We open 7am to 10pm, Monday to Sunday.",
      },
      {
        question: "Do you deliver?",
        answer: "Yes, we deliver lunch and dinner within 5km for KSh 200.",
      },
      {
        question: "Can I book a table?",
        answer: "Yes, tell us the day, time and number of people and we'll confirm.",
      },
      {
        question: "Do you have vegetarian food?",
        answer: "Yes, we have vegetarian options. Ask us for the full list.",
      },
      {
        question: "Where are you located?",
        answer: "Add your street, building and nearest landmark.",
      },
    ],
  },
  other: {
    services: [
      { name: "Standard service", price: 1000, duration_min: 60 },
      { name: "Consultation", price: 0, duration_min: 30 },
    ],
    faqs: [
      {
        question: "What time do you open?",
        answer: "We are open Monday to Saturday, 8am to 6pm.",
      },
      {
        question: "How much do you charge?",
        answer: "Add your real prices in the Services step so the assistant never guesses.",
      },
      {
        question: "Where are you located?",
        answer: "Add your building, street and nearest landmark.",
      },
      {
        question: "How do I book?",
        answer: "Just tell us the day and time that suits you and we will confirm here.",
      },
    ],
  },
};

export function starterPack(type: BusinessType): StarterPack {
  return packs[type] ?? packs.other;
}

/** Sample customer messages used by "Preview reply" when the box is empty. */
export function previewExamples(type: BusinessType): string[] {
  switch (type) {
    case "salon":
      return ["How much is braiding?", "Are you open on Sunday?", "Do you have space today at 4pm?"];
    case "clinic":
      return ["How much is a consultation?", "Are you open on Saturday?", "Do I need an appointment?"];
    case "school":
      return ["When does the next term start?", "How much are the school fees?", "Can I book a tour?"];
    case "shop":
      return ["Do you deliver to Westlands?", "Can I pay on delivery?", "What time do you close?"];
    case "restaurant":
      return ["Do you deliver?", "Can I book a table for 4 tonight?", "Do you have vegetarian food?"];
    default:
      return ["What time do you open?", "How much do you charge?", "Where are you located?"];
  }
}
