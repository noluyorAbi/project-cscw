"use client";

import { useEffect, useState } from "react";
import { BatteryFull, Signal, Wifi } from "lucide-react";
import { cn } from "@/lib/utils";
import type { ChatMessage } from "@/lib/emotion";

export const mono = "font-[family-name:var(--font-geist-mono)]";

export const fmtTime = (ts: number) =>
  new Date(ts).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });

/** thin bar that beats at `bpm` — the canvas's "armband that pulses your heartrate". */
export function Armband({ bpm }: { bpm: number }) {
  return (
    <span
      className="armband-pulse inline-block h-2.5 w-6 rounded-full bg-rose-500"
      style={{ animationDuration: `${60 / Math.max(1, bpm)}s` }}
      aria-hidden
    />
  );
}

/** iPhone-15-Pro-ish shell: titanium rail, side buttons, Dynamic Island.
 *  Static; scales down to fit short viewports. */
export function IphoneShell({ children }: { children: React.ReactNode }) {
  const W = 404;
  const H = 838;
  const [fit, setFit] = useState(1);

  useEffect(() => {
    const recalc = () =>
      setFit(Math.min(1, Math.max(0.55, (window.innerHeight - 120) / H)));
    recalc();
    window.addEventListener("resize", recalc);
    return () => window.removeEventListener("resize", recalc);
  }, []);

  return (
    <div className="relative" style={{ width: W * fit, height: H * fit }}>
      <div
        className="absolute left-0 top-0 rounded-[3.6rem] bg-gradient-to-br from-zinc-200 via-zinc-500 to-zinc-800 p-[3px] shadow-[0_40px_80px_-20px_rgba(0,0,0,0.45)] ring-1 ring-white/20"
        style={{
          width: W,
          height: H,
          transform: `scale(${fit})`,
          transformOrigin: "top left",
        }}
      >
        {/* side buttons (titanium) */}
        <div className="absolute -left-[4px] top-[118px] h-9 w-[4px] rounded-l bg-gradient-to-b from-zinc-300 to-zinc-500" />
        <div className="absolute -left-[4px] top-[178px] h-14 w-[4px] rounded-l bg-gradient-to-b from-zinc-300 to-zinc-500" />
        <div className="absolute -left-[4px] top-[248px] h-14 w-[4px] rounded-l bg-gradient-to-b from-zinc-300 to-zinc-500" />
        <div className="absolute -right-[4px] top-[208px] h-20 w-[4px] rounded-r bg-gradient-to-b from-zinc-300 to-zinc-500" />

        {/* inner bezel (black) */}
        <div className="h-full w-full rounded-[3.45rem] bg-black p-[11px]">
          {/* screen */}
          <div className="relative flex h-full w-full flex-col overflow-hidden rounded-[2.8rem] bg-white">
            {/* dynamic island + front camera */}
            <div className="pointer-events-none absolute left-1/2 top-3 z-30 flex h-[34px] w-[122px] -translate-x-1/2 items-center justify-end rounded-full bg-black pr-3">
              <span className="grid size-[11px] place-items-center rounded-full bg-zinc-900 ring-1 ring-zinc-700">
                <span className="size-[5px] rounded-full bg-zinc-600" />
              </span>
            </div>
            {/* status bar */}
            <div
              className={cn(
                "flex items-center justify-between px-8 pb-1 pt-4 text-[14px] font-semibold text-zinc-900",
                mono,
              )}
            >
              <span>19:05</span>
              <span className="flex items-center gap-1.5">
                <Signal size={15} strokeWidth={2.5} />
                <Wifi size={15} strokeWidth={2.5} />
                <BatteryFull size={20} strokeWidth={2} />
              </span>
            </div>
            {children}
            {/* home indicator */}
            <div className="pointer-events-none absolute bottom-2 left-1/2 z-30 h-[5px] w-[136px] -translate-x-1/2 rounded-full bg-zinc-900/80" />
          </div>
        </div>
      </div>
    </div>
  );
}

/** Sparkline of the user's own heart rate across the conversation. */
export function EmotionTimeline({
  data,
  enabled,
}: {
  data: ChatMessage[];
  enabled: boolean;
}) {
  const pts = data
    .filter((m) => m.author === "me" && typeof m.bpm === "number")
    .slice(-24);
  if (!enabled) {
    return (
      <p className={cn("py-3 text-center text-[10px] text-zinc-400", mono)}>
        turn PULSE on to record your heart-rate trend
      </p>
    );
  }
  if (pts.length < 2) {
    return (
      <p className={cn("py-3 text-center text-[10px] text-zinc-400", mono)}>
        send a few messages to build your emotion trend
      </p>
    );
  }
  const bpms = pts.map((m) => m.bpm as number);
  const lo = Math.min(...bpms);
  const hi = Math.max(...bpms);
  const span = Math.max(1, hi - lo);
  const W = 100;
  const H = 30;
  const xy = bpms.map((b, i) => {
    const x = (i / (bpms.length - 1)) * W;
    const y = H - 3 - ((b - lo) / span) * (H - 6);
    return [x, y] as const;
  });
  const path = xy
    .map(([x, y], i) => `${i ? "L" : "M"}${x.toFixed(1)} ${y.toFixed(1)}`)
    .join(" ");
  const last = pts[pts.length - 1];
  return (
    <div className="space-y-1.5 px-1 py-2">
      <div className={cn("flex items-center justify-between text-[10px] text-zinc-500", mono)}>
        <span>YOUR HR · {pts.length} MSG</span>
        <span>
          {lo}–{hi} bpm · now {last.bpm}
        </span>
      </div>
      <svg viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none" className="h-10 w-full">
        <path
          d={path}
          fill="none"
          stroke="#18181b"
          strokeWidth={1.2}
          vectorEffect="non-scaling-stroke"
        />
        <circle cx={xy[xy.length - 1][0]} cy={xy[xy.length - 1][1]} r={2} fill="#f43f5e" />
      </svg>
      <div className="flex justify-between">
        {pts.slice(-12).map((m) => (
          <span
            key={m.id}
            className="text-[11px] leading-none"
            title={m.expression?.label}
          >
            {m.expression?.emoji ?? "·"}
          </span>
        ))}
      </div>
    </div>
  );
}
