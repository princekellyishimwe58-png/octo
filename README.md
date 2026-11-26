# Octo

A calm dashboard where a small business owner in Kenya sets up an AI assistant
that answers customers on WhatsApp — and stays in control of it.

Built with Next.js (App Router) + Tailwind CSS, with hand-rolled shadcn-style
primitives, Supabase for auth and data, and the WhatsApp Business Cloud API for
messaging. The LLM is swappable through n8n or any OpenAI-compatible endpoint.

---

## Run it in 2 minutes (demo mode, no keys needed)

```bash
npm install
npm run dev
```

Open <http://localhost:3000>. With no `.env.local` you are in **demo mode**:

- Everything is saved in the browser (`localStorage`), so you can click around freely.
- "Test my assistant" and "Preview reply" run the built-in grounded engine — no LLM key required.
- Nothing is sent to WhatsApp; the app tells you so instead of pretending.

Two ways in:

1. **"Skip for now"** on the setup screen, then **Settings → Reset sample data** —
   loads *Malaika Hair Studio*, a full demo salon with chats, bookings and a week of history.
2. **Build your own business** through the 4-step wizard (about 2 minutes).

The **light theme is the default**; the sun/moon toggle in the sidebar (desktop)
or top bar (mobile) switches to dark and remembers your choice.

---

## Folder structure

```
src/
  app/
    page.tsx                  landing → /home
    login/page.tsx            sign in (Supabase) + "Explore with sample data"
    onboarding/page.tsx       4-step wizard + "Your assistant is live"
    (app)/
      layout.tsx              sidebar shell, onboarding guard, skeletons
      home/page.tsx           4 big cards + weekly line chart
      conversations/page.tsx  WhatsApp-style inbox, take over / hand back
      bookings/page.tsx       calendar + list, confirm / reschedule / cancel
      replies/page.tsx        FAQ editor, tone + language, preview reply
      settings/page.tsx       profile, hours, notifications, plan, reset
    api/
      whatsapp/webhook/route.ts   Meta verification + inbound messages → AI reply
      whatsapp/send/route.ts      outbound messages (confirmations, reminders)
      whatsapp/test/route.ts      "Test it" button during onboarding
      assistant/reply/route.ts    one reply endpoint (LLM, then local fallback)
      cron/reminders/route.ts     daily reminder to tomorrow's customers
  components/                 app shell, cards, chart, dialogs, UI primitives
  lib/
    types.ts                  the 6 tables, 1:1 with supabase/schema.sql
    sample-data.ts            demo salon + empty workspace
    templates.ts              starter services & FAQs per business type
    assistant.ts              grounded reply engine + optional LLM call
    repo.ts / store.tsx       one data interface; local now, Supabase when configured
    analytics.ts              dashboard numbers
    whatsapp.ts               Cloud API helpers
    supabase/                 browser + server clients
supabase/schema.sql           tables + row-level security
```

### How data flows

Every screen talks to one hook: `useOcto()` from `src/lib/store.tsx`.
That store calls `src/lib/repo.ts`, which writes to Supabase when keys exist and to
the browser otherwise. Screens never know the difference.

---

## Going live

1. Copy the env file and fill in what you have:

   ```bash
   cp .env.example .env.local
   ```

2. **Supabase** — create a project, run `supabase/schema.sql` in the SQL editor,
   then add `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY` and
   `SUPABASE_SERVICE_ROLE_KEY`. Row-level security means each business can only
   read and write its own rows.

3. **WhatsApp** — in Meta's app dashboard, add the webhook
   `https://your-domain/api/whatsapp/webhook` with your `WHATSAPP_VERIFY_TOKEN`,
   subscribe to `messages`, and put the phone number id + access token in `.env.local`.

4. **LLM** — set `N8N_WEBHOOK_URL` (n8n must accept `{ message, context }` and return
   `{ reply, confident }`), or set `LLM_API_KEY` + `LLM_API_URL` for a direct
   OpenAI-compatible call. If neither answers, the grounded local engine replies.

5. **Vercel** — push the repo, add the same variables, and deploy. `vercel.json`
   already schedules the daily reminder job (protect it with `CRON_SECRET`).

---

## How to test it, stage by stage

**Setup (onboarding)** — Open the app on a phone-sized window (360px wide).
Tap through the four steps: name/type/location → hours/prices → questions →
WhatsApp number. Answers autosave as a draft, so a refresh mid-way keeps your place.
Finish on "Your assistant is live".

**Conversations** — Pick a chat on the left (stacked on mobile). Messages are
labelled **AI** or **You** and grouped by day. Tap **Take over** — the AI pauses,
a reply box appears, and your message shows as "You". **Hand back to AI** resumes it.

**Bookings** — Calendar dots mark days with bookings. Use **Confirm**,
**Reschedule** or **Cancel**; each change asks before doing anything destructive and
tells you whether the customer was messaged on WhatsApp.

**Replies** — Edit a question or answer: notice the small **Saved** pill.
Change tone or language, then type into "Preview reply" and press **Preview** to see
the exact answer. Ask something the business hasn't covered ("Do you do bridal
makeup?") and the assistant says a person will follow up instead of inventing an answer.

**Dashboard** — Four cards (messages, bookings, AI answers, needs your reply) and a
7-day line chart. **Test my assistant** opens a practice chat that never touches WhatsApp.

**Offline behaviour** — Turn off the network and keep editing: changes stay on the
device and the app says it could not save rather than losing them.

---

## Assumptions made

- **Demo mode first.** With no keys, the app is a fully clickable prototype saved on
  the device. This keeps the first-run experience under 10 minutes, with no setup.
- **One business per account.** Multi-user teams, multiple WhatsApp numbers, payments
  and voice notes are out of scope for v1, as agreed.
- **The AI answers only from the owner's own words.** Prices, hours and FAQs come from
  the database; anything unmatched escalates to the owner and flags the chat.
- **Swahili/mixed language** switches greetings and the escalation line; the FAQ text
  itself is whatever the owner wrote.
- **Reminders run once a day** (Vercel Cron at 05:00 UTC) rather than per-booking timers.

## Scripts

```bash
npm run dev        # local dev server
npm run build      # production build
npm run typecheck  # tsc --noEmit
npm run lint       # eslint
```
