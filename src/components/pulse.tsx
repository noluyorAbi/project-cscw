"use client";

import { Heart } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * Beating-heart indicator. animationDuration = one beat = 60/bpm seconds.
 * This is the "armband that pulses your heartrate" from the canvas: the
 * other person literally sees/feels your bpm next to the message.
 */
export function Pulse({
  bpm,
  className,
  size = 16,
  showValue = true,
}: {
  bpm: number;
  className?: string;
  size?: number;
  showValue?: boolean;
}) {
  const beat = 60 / Math.max(1, bpm);
  return (
    <span className={cn("inline-flex items-center gap-1 tabular-nums", className)}>
      <Heart
        className="heart-pulse fill-rose-500 text-rose-500"
        style={{ animationDuration: `${beat}s` }}
        size={size}
        aria-hidden
      />
      {showValue && <span className="font-medium">{bpm}</span>}
      {showValue && <span className="text-[10px] opacity-70">bpm</span>}
    </span>
  );
}
