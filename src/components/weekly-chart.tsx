"use client";

import { useOcto } from "@/lib/store";
import { weeklySeries } from "@/lib/analytics";

/**
 * A deliberately simple weekly line chart — no chart library, so the page
 * stays fast on a phone. One line (customer messages), one soft fill, today
 * marked with a filled dot.
 */
export function WeeklyChart() {
  const { workspace } = useOcto();
  const data = weeklySeries(workspace);
  const values = data.map((d) => d.messages);

  const W = 600;
  const H = 200;
  const PAD_X = 18;
  const PAD_Y = 24;
  const max = Math.max(...values, 4);
  const stepX = (W - PAD_X * 2) / (data.length - 1);

  const points = data.map((d, i) => ({
    x: PAD_X + i * stepX,
    y: H - PAD_Y - (d.messages / max) * (H - PAD_Y * 2),
    ...d,
  }));

  // Smooth curve through the points (Catmull-Rom → cubic Bézier).
  let line = `M ${points[0].x} ${points[0].y}`;
  for (let i = 0; i < points.length - 1; i++) {
    const p0 = points[i - 1] ?? points[i];
    const p1 = points[i];
    const p2 = points[i + 1];
    const p3 = points[i + 2] ?? p2;
    const c1x = p1.x + (p2.x - p0.x) / 6;
    const c1y = p1.y + (p2.y - p0.y) / 6;
    const c2x = p2.x - (p3.x - p1.x) / 6;
    const c2y = p2.y - (p3.y - p1.y) / 6;
    line += ` C ${c1x} ${c1y}, ${c2x} ${c2y}, ${p2.x} ${p2.y}`;
  }
  const area = `${line} L ${points[points.length - 1].x} ${H - PAD_Y + 6} L ${points[0].x} ${H - PAD_Y + 6} Z`;

  const total = values.reduce((a, b) => a + b, 0);
  const todayIndex = data.length - 1;

  return (
    <div>
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <div>
          <p className="text-base font-semibold">Messages this week</p>
          <p className="text-sm text-muted-foreground">
            {total} messages · your assistant handled{" "}
            {workspace.messages.filter((m) => m.author === "ai" && data.some((d) => new Date(m.created_at).toDateString() === d.date.toDateString())).length}
          </p>
        </div>
        <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-muted-foreground">
          <span className="size-2 rounded-full bg-primary" />
          Customer messages
        </span>
      </div>

      <svg
        viewBox={`0 0 ${W} ${H}`}
        role="img"
        aria-label="Line chart of customer messages over the last seven days"
        className="mt-4 h-44 w-full sm:h-52"
        preserveAspectRatio="none"
      >
        <defs>
          <linearGradient id="octo-area" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="var(--primary)" stopOpacity="0.18" />
            <stop offset="100%" stopColor="var(--primary)" stopOpacity="0" />
          </linearGradient>
        </defs>

        {/* Horizontal guides */}
        {[0, 0.5, 1].map((f) => (
          <line
            key={f}
            x1={PAD_X}
            x2={W - PAD_X}
            y1={PAD_Y + f * (H - PAD_Y * 2)}
            y2={PAD_Y + f * (H - PAD_Y * 2)}
            stroke="var(--border)"
            strokeDasharray="4 6"
            strokeWidth="1.5"
          />
        ))}

        <path d={area} fill="url(#octo-area)" />
        <path
          d={line}
          fill="none"
          stroke="var(--primary)"
          strokeWidth="3.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          vectorEffect="non-scaling-stroke"
        />

        {points.map((p, i) => (
          <g key={p.label + i}>
            <circle
              cx={p.x}
              cy={p.y}
              r={i === todayIndex ? 7 : 5}
              fill={i === todayIndex ? "var(--primary)" : "var(--card)"}
              stroke="var(--primary)"
              strokeWidth="3"
              vectorEffect="non-scaling-stroke"
            >
              <title>{`${p.label}: ${p.messages} messages`}</title>
            </circle>
          </g>
        ))}
      </svg>

      <div className="mt-1 flex justify-between px-1 text-xs font-medium text-muted-foreground">
        {data.map((d, i) => (
          <span key={d.label + i} className={i === data.length - 1 ? "font-semibold text-foreground" : ""}>
            {i === data.length - 1 ? "Today" : d.label}
          </span>
        ))}
      </div>
    </div>
  );
}
