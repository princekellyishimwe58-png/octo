# Octo brand

## The mark

A friendly little octopus. Its round head doubles as a speech bubble, its eyes
are punched out of the tile colour, and four calm arms reach out in every
direction — one for each conversation Octo is answering at the same time.

It is drawn on a grid of 24 units and stays readable at 16px (the favicon) up
to a shop sign.

| File | Use |
| --- | --- |
| `src/components/octo-mark.tsx` | `<OctoMark />` (tile) and `<OctoGlyph />` (bare glyph, inherits `currentColor`) — sidebar, login, onboarding |
| `src/app/icon.svg` | Browser favicon (Next.js picks this up automatically) |
| `src/app/apple-icon.png` | iOS home-screen icon, 180×180 |
| `public/octo-logo-512.png` / `-192.png` | Social avatars, app stores, WhatsApp Business profile |

### Do

- Keep clear space around the mark of at least a quarter of its width.
- Put it on the brand teal (`#0D7A63`) or on white/`#F6F8F7`.
- Use the wordmark `Octo` in Inter SemiBold, `tracking-tight`, next to the tile.

### Don't

- Don't rotate, stretch, outline or add gradients/shadows to the glyph.
- Don't put the teal tile on a busy photo — use a white tile with the teal glyph.

## Colour

| Token | Light | Meaning |
| --- | --- | --- |
| Brand teal | `#0D7A63` | Trust, calm, "your assistant is on" |
| Brand soft | `#E4F3ED` | Backgrounds for AI replies and highlights |
| Ink | `#10201B` | Body text |
| Alert amber | `#B45309` | Only for things that need the owner |

## Voice

Plain words, short sentences, no jargon. Say "Customer questions", not
"Intents". Say "Connect WhatsApp", not "Configure API credentials". Never
promise something the product did not do.

## Marketing angle: many arms, one assistant

The arms are the story — Octo answers many customers at once, so the owner
doesn't have to. Lines that write themselves:

- **Eight arms. Endless conversations.** Octo replies to every WhatsApp message
  while you do the work only you can do.
- **One arm for the price question. One for the booking. One for "are you open?"**
  Octo juggles them all — and hands you the ones that need a human.
- **It never guesses.** If Octo isn't sure, it says a person will follow up and
  flags the chat for you. No invented prices, ever.
- **Your voice, your words.** Octo only answers from what you tell it — in
  English, Swahili, or a mix of both.

Suggested image treatment for ads and the landing page: the teal tile, one arm
unfurling into a WhatsApp chat bubble, and a line of copy in Inter over a plain
`#F6F8F7` background. Keep it calm — no gradients, no stock photos of offices.
