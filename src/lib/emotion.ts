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

/** stress 0..100 -> resting-ish bpm 62..122, with light jitter. */
export function stressToBpm(stress: number): number {
  const base = 62 + (Math.max(0, Math.min(100, stress)) / 100) * 58;
  const jitter = (Math.random() - 0.5) * 6;
  return Math.round(base + jitter);
}

/** stress 0..100 -> a plausible facial expression (the "detected face"). */
export function stressToExpression(stress: number): Expression {
  const s = Math.max(0, Math.min(100, stress));
  // a little randomness so the "detector" isn't a pure step function
  const noisy = s + (Math.random() - 0.5) * 12;
  if (noisy < 18) return EXPRESSIONS.calm;
  if (noisy < 38) return EXPRESSIONS.happy;
  if (noisy < 58) return EXPRESSIONS.neutral;
  if (noisy < 78) return EXPRESSIONS.tense;
  return EXPRESSIONS.sad;
}

export type Author = "me" | "mara";

export type ChatMessage = {
  id: string;
  author: Author;
  text: string;
  /** undefined when the sender turned face-sharing off (privacy control) */
  expression?: Expression;
  bpm?: number;
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
