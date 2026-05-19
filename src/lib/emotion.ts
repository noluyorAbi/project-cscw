// Emotion-aware chat — shared model.
// PoC stand-in for the canvas idea: each message carries the sender's facial
// expression + heart rate (bpm). Real CV/biosensing is mocked here; the
// "stress level -> heartrate" mapping is deterministic so the demo is stable.

export type ExpressionKey = "happy" | "calm" | "neutral" | "tense" | "sad";

export type Expression = {
  key: ExpressionKey;
  emoji: string;
  label: string;
  /** tailwind classes for the expression badge */
  tone: string;
};

export const EXPRESSIONS: Record<ExpressionKey, Expression> = {
  happy: { key: "happy", emoji: "😀", label: "happy", tone: "bg-emerald-100 text-emerald-800 border-emerald-200" },
  calm: { key: "calm", emoji: "🙂", label: "calm", tone: "bg-sky-100 text-sky-800 border-sky-200" },
  neutral: { key: "neutral", emoji: "😐", label: "neutral", tone: "bg-zinc-100 text-zinc-700 border-zinc-200" },
  tense: { key: "tense", emoji: "😟", label: "tense", tone: "bg-amber-100 text-amber-900 border-amber-200" },
  sad: { key: "sad", emoji: "😢", label: "sad", tone: "bg-rose-100 text-rose-800 border-rose-200" },
};

const clamp = (n: number) => Math.max(0, Math.min(100, n));

/**
 * stress 0..100 -> resting-ish bpm 62..120.
 * Deterministic on purpose: used during render, so it must match between
 * server and client (no Math.random -> no hydration mismatch).
 */
export function stressToBpm(stress: number): number {
  return Math.round(62 + (clamp(stress) / 100) * 58);
}

/** stress 0..100 -> a plausible facial expression. Deterministic (render-safe). */
export function stressToExpression(stress: number): Expression {
  const s = clamp(stress);
  if (s < 18) return EXPRESSIONS.calm;
  if (s < 38) return EXPRESSIONS.happy;
  if (s < 58) return EXPRESSIONS.neutral;
  if (s < 78) return EXPRESSIONS.tense;
  return EXPRESSIONS.sad;
}

/**
 * Noisy variants — call ONLY from client event handlers / timeouts
 * (never during render), so the "detector" isn't a pure step function.
 */
export function sensedBpm(stress: number): number {
  return stressToBpm(stress) + Math.round((Math.random() - 0.5) * 6);
}

export function sensedExpression(stress: number): Expression {
  return stressToExpression(clamp(stress) + (Math.random() - 0.5) * 12);
}

export type Author = "me" | "mara";

export type ChatMessage = {
  id: string;
  author: Author;
  text: string;
  /** undefined when the sender turned face-sharing off (privacy control) */
  expression?: Expression;
  bpm?: number;
  /** captured webcam still (jpeg data URL) attached to this message */
  photo?: string;
  /** model confidence 0..1 when the expression came from real detection */
  confidence?: number;
  ts: number;
};

/** canned replies for the simulated other person ("Mara"). */
export const MARA_REPLIES: string[] = [
  "wait, are you okay?",
  "your heart is racing 😳",
  "haha I can literally see you smiling",
  "ok now I feel calmer too",
  "that face says everything tbh",
  "hold on, breathe — I'm here",
  "you seem stressed, want to call?",
  "I felt that one. for real.",
];

export function uid(): string {
  return Math.random().toString(36).slice(2, 10);
}
