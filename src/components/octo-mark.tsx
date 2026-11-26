import { cn } from "@/lib/utils";

/**
 * The Octo mark.
 *
 * A friendly little octopus whose round head doubles as a speech bubble and
 * whose four arms reach out in every direction — one for each conversation
 * Octo is handling at the same time. The head is one filled path with the eyes
 * punched out (`fillRule="evenodd"`), so the eyes take the tile colour and the
 * whole thing stays legible down to a 16px favicon.
 *
 * The glyph inherits `currentColor`, so it works on the brand tile, in the
 * sidebar, on the login screen and in print.
 */
export function OctoGlyph({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden
      focusable="false"
      className={cn("block", className)}
    >
      {/* Head + eyes (the eyes are holes, so they take the tile colour) */}
      <path
        fill="currentColor"
        fillRule="evenodd"
        clipRule="evenodd"
        d="M12 3.4a6.6 6.6 0 0 1 6.6 6.6v2.7c0 1.2-1 2.2-2.2 2.2H7.6c-1.2 0-2.2-1-2.2-2.2v-2.7A6.6 6.6 0 0 1 12 3.4Zm-2.4 6.4a1.2 1.2 0 1 0 0 2.4 1.2 1.2 0 0 0 0-2.4Zm4.8 0a1.2 1.2 0 1 0 0 2.4 1.2 1.2 0 0 0 0-2.4Z"
      />
      {/* Arms: four calm curls, two reaching out, two reaching down */}
      <g
        stroke="currentColor"
        strokeWidth="1.9"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M7.4 15.6c.5 1.9-.2 3.5-1.5 4.6" />
        <path d="M10.4 16.2c.2 2 0 3.6-.6 5" />
        <path d="M13.6 16.2c-.2 2 0 3.6.6 5" />
        <path d="M16.6 15.6c-.5 1.9.2 3.5 1.5 4.6" />
      </g>
    </svg>
  );
}

/**
 * The tile version used everywhere in the product. The glyph is positioned
 * absolutely so a percentage inset never affects the tile's own width.
 */
export function OctoMark({ className }: { className?: string }) {
  return (
    <span
      aria-hidden
      className={cn(
        "relative grid size-9 shrink-0 place-items-center rounded-xl bg-primary text-primary-foreground shadow-soft",
        className,
      )}
    >
      <OctoGlyph className="absolute inset-[19%]" />
    </span>
  );
}

export function OctoWordmark({ className }: { className?: string }) {
  return (
    <span className={cn("flex items-center gap-2.5", className)}>
      <OctoMark />
      <span className="text-xl font-semibold tracking-tight">Octo</span>
    </span>
  );
}
