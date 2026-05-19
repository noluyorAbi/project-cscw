"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import {
  BatteryFull,
  Camera,
  CameraOff,
  Eye,
  EyeOff,
  Send,
  Signal,
  Trash2,
  Wifi,
} from "lucide-react";
import { Pulse } from "@/components/pulse";
import { cn } from "@/lib/utils";
import {
  type ChatMessage,
  MARA_REPLIES,
  sensedBpm,
  sensedExpression,
  stressToBpm,
  stressToExpression,
  uid,
} from "@/lib/emotion";
import {
  type Detection,
  type FaceBox,
  detectExpression,
  loadFaceModels,
} from "@/lib/face";
import { PpgEstimator } from "@/lib/ppg";

const mono = "font-[family-name:var(--font-geist-mono)]";

const seed = (): ChatMessage[] => [
  {
    id: uid(),
    author: "mara",
    text: "hey! how did the exam go??",
    expression: stressToExpression(30),
    bpm: stressToBpm(30),
    ts: Date.now() - 60000,
  },
];

type FaceStatus = "off" | "loading" | "ready" | "searching" | "error";

/** Realistic iPhone-15-Pro-ish shell: titanium rail, Dynamic Island, status bar, home indicator. */
function IphoneShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative h-[812px] w-[390px] rounded-[3.4rem] bg-zinc-950 p-[3px] shadow-[0_0_0_2px_#3f3f46,0_30px_70px_-12px_rgba(0,0,0,0.7)]">
      <div className="relative flex h-full w-full flex-col overflow-hidden rounded-[3.2rem] border border-zinc-800 bg-white">
        {/* dynamic island */}
        <div className="pointer-events-none absolute left-1/2 top-2 z-30 h-[34px] w-[120px] -translate-x-1/2 rounded-full bg-black" />
        {/* status bar */}
        <div className={cn("flex items-center justify-between px-7 pb-1 pt-3.5 text-[13px] font-semibold text-zinc-900", mono)}>
          <span>9:41</span>
          <span className="flex items-center gap-1.5">
            <Signal size={14} strokeWidth={2.5} />
            <Wifi size={14} strokeWidth={2.5} />
            <BatteryFull size={18} strokeWidth={2} />
          </span>
        </div>
        {children}
        {/* home indicator */}
        <div className="pointer-events-none absolute bottom-2 left-1/2 z-30 h-[5px] w-[134px] -translate-x-1/2 rounded-full bg-zinc-900/80" />
      </div>
    </div>
  );
}

export default function ChatPoc() {
  const [messages, setMessages] = useState<ChatMessage[]>(seed);
  const [draft, setDraft] = useState("");
  const [stress, setStress] = useState(45);
  const [faceSharing, setFaceSharing] = useState(true);
  const [cameraOn, setCameraOn] = useState(false);
  const [faceStatus, setFaceStatus] = useState<FaceStatus>("off");
  const [detected, setDetected] = useState<Detection | null>(null);
  const [typing, setTyping] = useState(false);
  const [hr, setHr] = useState<{ bpm: number; quality: number } | null>(null);

  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const sampleRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const boxRef = useRef<FaceBox | null>(null);
  const ppgRef = useRef<PpgEstimator | null>(null);

  // bpm priority: real camera rPPG > expression-arousal proxy > slider
  const liveBpm =
    cameraOn && hr
      ? hr.bpm
      : cameraOn && detected
        ? stressToBpm(detected.arousal)
        : stressToBpm(stress);
  const liveExpr =
    cameraOn && detected ? detected.expression : stressToExpression(stress);
  const maraLast = [...messages].reverse().find((m) => m.author === "mara");

  // state transitions live in the toggle (an event), not in the effect
  const toggleCamera = useCallback(() => {
    setCameraOn((prev) => {
      const next = !prev;
      if (next) {
        setFaceStatus("loading");
      } else {
        setDetected(null);
        setHr(null);
        setFaceStatus("off");
        boxRef.current = null;
        ppgRef.current?.reset();
      }
      return next;
    });
  }, []);

  // webcam stream lifecycle — imperative side effects only
  useEffect(() => {
    if (!cameraOn) return;
    let cancelled = false;
    navigator.mediaDevices
      ?.getUserMedia({ video: { facingMode: "user" }, audio: false })
      .then(async (s) => {
        if (cancelled) {
          s.getTracks().forEach((t) => t.stop());
          return;
        }
        streamRef.current = s;
        if (videoRef.current) videoRef.current.srcObject = s;
        try {
          await loadFaceModels();
          if (!cancelled) setFaceStatus("ready");
        } catch {
          if (!cancelled) setFaceStatus("error");
        }
      })
      .catch(() => {
        if (!cancelled) {
          setCameraOn(false);
          setFaceStatus("off");
        }
      });
    return () => {
      cancelled = true;
      streamRef.current?.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    };
  }, [cameraOn]);

  // detection loop — analyze the live frame ~2x/s, majority-vote the
  // expression over the last few reads so the badge doesn't flicker
  useEffect(() => {
    if (faceStatus !== "ready" && faceStatus !== "searching") return;
    let alive = true;
    const history: Detection[] = [];
    const tick = async () => {
      if (!alive || !videoRef.current) return;
      try {
        const d = await detectExpression(videoRef.current);
        if (!alive) return;
        if (!d) {
          boxRef.current = null;
          setFaceStatus("searching");
          return;
        }
        boxRef.current = d.box;
        history.push(d);
        if (history.length > 5) history.shift();
        const counts = new Map<string, number>();
        for (const h of history)
          counts.set(h.expression.key, (counts.get(h.expression.key) ?? 0) + 1);
        let topKey: string = d.expression.key;
        let topN = 0;
        for (const [k, c] of counts) {
          if (c > topN) {
            topN = c;
            topKey = k;
          }
        }
        const stable =
          history.find((h) => h.expression.key === topKey)?.expression ??
          d.expression;
        const arousal = Math.round(
          history.reduce((a, h) => a + h.arousal, 0) / history.length,
        );
        const confidence =
          history
            .filter((h) => h.expression.key === topKey)
            .reduce((a, h) => a + h.confidence, 0) / topN;
        setDetected({ expression: stable, arousal, confidence, box: d.box });
        setFaceStatus("ready");
      } catch {
        if (alive) setFaceStatus("error");
      }
    };
    const iv = window.setInterval(tick, 500);
    void tick();
    return () => {
      alive = false;
      window.clearInterval(iv);
    };
  }, [faceStatus]);

  // rPPG sampling loop — fast green-channel average of the forehead ROI
  useEffect(() => {
    if (faceStatus !== "ready" && faceStatus !== "searching") return;
    if (!ppgRef.current) ppgRef.current = new PpgEstimator();
    let raf = 0;
    let lastEst = 0;
    const loop = () => {
      raf = requestAnimationFrame(loop);
      const v = videoRef.current;
      const c = sampleRef.current;
      const box = boxRef.current;
      if (!v || !c || !box || v.videoWidth === 0) return;
      const W = 120;
      const H = Math.round((v.videoHeight / v.videoWidth) * W) || 90;
      c.width = W;
      c.height = H;
      const ctx = c.getContext("2d", { willReadFrequently: true });
      if (!ctx) return;
      ctx.drawImage(v, 0, 0, W, H);
      const rx = Math.floor((box.x + box.w * 0.3) * W);
      const ry = Math.floor((box.y + box.h * 0.15) * H);
      const rw = Math.max(1, Math.floor(box.w * 0.4 * W));
      const rh = Math.max(1, Math.floor(box.h * 0.2 * H));
      try {
        const { data } = ctx.getImageData(rx, ry, rw, rh);
        let g = 0;
        for (let i = 1; i < data.length; i += 4) g += data[i];
        ppgRef.current?.push(g / (data.length / 4));
      } catch {
        return;
      }
      const now = performance.now();
      if (now - lastEst > 900) {
        lastEst = now;
        setHr(ppgRef.current?.estimate() ?? null);
      }
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, [faceStatus]);

  // persistence — deferred load keeps SSR markup stable + non-sync setState
  useEffect(() => {
    let cancelled = false;
    queueMicrotask(() => {
      if (cancelled) return;
      try {
        const raw = localStorage.getItem("cscw-chat");
        if (raw) {
          const parsed = JSON.parse(raw) as ChatMessage[];
          if (Array.isArray(parsed) && parsed.length) setMessages(parsed);
        }
      } catch {
        /* ignore corrupt storage */
      }
    });
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem("cscw-chat", JSON.stringify(messages));
    } catch {
      /* quota / unavailable — non-fatal for a PoC */
    }
  }, [messages]);

  useEffect(() => {
    scrollRef.current?.scrollTo({
      top: scrollRef.current.scrollHeight,
      behavior: "smooth",
    });
  }, [messages, typing]);

  const clearChat = useCallback(() => {
    setMessages(seed());
    try {
      localStorage.removeItem("cscw-chat");
    } catch {
      /* ignore */
    }
  }, []);

  const capturePhoto = useCallback((): string | undefined => {
    const v = videoRef.current;
    const c = canvasRef.current;
    if (!v || !c || v.videoWidth === 0) return undefined;
    const w = 240;
    const h = Math.round((v.videoHeight / v.videoWidth) * w) || 180;
    c.width = w;
    c.height = h;
    const ctx = c.getContext("2d");
    if (!ctx) return undefined;
    ctx.translate(w, 0);
    ctx.scale(-1, 1);
    ctx.drawImage(v, 0, 0, w, h);
    return c.toDataURL("image/jpeg", 0.55);
  }, []);

  function send() {
    const text = draft.trim();
    if (!text) return;

    let mine: ChatMessage;
    if (!faceSharing) {
      mine = { id: uid(), author: "me", text, ts: Date.now() };
    } else if (cameraOn) {
      mine = {
        id: uid(),
        author: "me",
        text,
        photo: capturePhoto(),
        expression: detected?.expression ?? sensedExpression(stress),
        bpm: hr
          ? hr.bpm
          : detected
            ? stressToBpm(detected.arousal)
            : sensedBpm(stress),
        confidence: detected?.confidence,
        ts: Date.now(),
      };
    } else {
      mine = {
        id: uid(),
        author: "me",
        text,
        expression: sensedExpression(stress),
        bpm: sensedBpm(stress),
        ts: Date.now(),
      };
    }

    setMessages((m) => [...m, mine]);
    setDraft("");
    setTyping(true);

    const reactStress = Math.max(8, Math.min(95, stress + (Math.random() - 0.4) * 40));
    window.setTimeout(
      () => {
        setTyping(false);
        setMessages((m) => [
          ...m,
          {
            id: uid(),
            author: "mara",
            text: MARA_REPLIES[Math.floor(Math.random() * MARA_REPLIES.length)],
            expression: sensedExpression(reactStress),
            bpm: sensedBpm(reactStress),
            ts: Date.now(),
          },
        ]);
      },
      1100 + Math.random() * 900,
    );
  }

  const statusPill: Record<FaceStatus, { label: string; dot: string }> = {
    off: { label: "CAMERA OFF", dot: "bg-zinc-400" },
    loading: { label: "LOADING MODEL", dot: "bg-amber-500 animate-pulse" },
    ready: { label: "FACE LOCKED", dot: "bg-emerald-500" },
    searching: { label: "NO FACE", dot: "bg-amber-500" },
    error: { label: "DETECTION FAILED", dot: "bg-red-500" },
  };
  const pill = statusPill[faceStatus];

  return (
    <main className="flex flex-1 flex-col items-center justify-center bg-black px-4 py-10 [background-image:radial-gradient(circle_at_50%_0,#1a1a1a,transparent_60%)]">
      <IphoneShell>
        {/* app header */}
        <header className="flex items-center gap-3 border-b border-zinc-200 bg-white px-5 py-2.5">
          <div className="grid size-9 place-items-center rounded-full bg-zinc-900 text-sm text-white">
            M
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-[15px] font-semibold leading-tight text-zinc-900">
              Mara
            </p>
            <p className={cn("flex items-center gap-2 text-[11px] text-zinc-500", mono)}>
              {maraLast?.expression ? (
                <>
                  <span>
                    {maraLast.expression.emoji} {maraLast.expression.label}
                  </span>
                  {typeof maraLast.bpm === "number" && (
                    <Pulse bpm={maraLast.bpm} size={11} />
                  )}
                </>
              ) : (
                "online"
              )}
            </p>
          </div>
          <button
            type="button"
            onClick={clearChat}
            aria-label="clear chat"
            className="rounded-md p-1.5 text-zinc-400 hover:bg-zinc-100 hover:text-zinc-900"
          >
            <Trash2 size={15} />
          </button>
          <Link
            href="/idea"
            className={cn(
              "rounded-md border border-zinc-200 px-2 py-1 text-[10px] uppercase tracking-wide text-zinc-500 hover:border-zinc-900 hover:text-zinc-900",
              mono,
            )}
          >
            Canvas
          </Link>
        </header>

        {/* messages */}
        <div
          ref={scrollRef}
          className="flex flex-1 flex-col gap-2.5 overflow-y-auto bg-zinc-50 px-4 py-4"
        >
          {messages.map((m) => {
            const mine = m.author === "me";
            return (
              <div
                key={m.id}
                className={cn("flex flex-col gap-1", mine ? "items-end" : "items-start")}
              >
                <div
                  className={cn(
                    "max-w-[80%] overflow-hidden rounded-2xl text-[14px] leading-snug",
                    mine
                      ? "rounded-br-md bg-zinc-900 text-white"
                      : "rounded-bl-md border border-zinc-200 bg-white text-zinc-900",
                  )}
                >
                  {m.photo && (
                    /* eslint-disable-next-line @next/next/no-img-element */
                    <img
                      src={m.photo}
                      alt="sender's face at send time"
                      className="aspect-[4/3] w-44 object-cover"
                    />
                  )}
                  <p className="px-3 py-2">{m.text}</p>
                </div>
                <div
                  className={cn(
                    "flex items-center gap-1.5 px-1 text-[10px] text-zinc-500",
                    mono,
                  )}
                >
                  {m.expression ? (
                    <>
                      <span
                        className={cn(
                          "rounded-full border px-1.5 py-0.5 font-medium",
                          m.expression.tone,
                        )}
                      >
                        {m.expression.emoji} {m.expression.label}
                        {typeof m.confidence === "number" &&
                          ` ${Math.round(m.confidence * 100)}%`}
                      </span>
                      {typeof m.bpm === "number" && <Pulse bpm={m.bpm} size={11} />}
                    </>
                  ) : (
                    <span className="italic opacity-70">no signal shared</span>
                  )}
                </div>
              </div>
            );
          })}
          {typing && (
            <div className="flex items-center gap-1 self-start rounded-2xl rounded-bl-md border border-zinc-200 bg-white px-3 py-2.5">
              <span className="size-1.5 animate-bounce rounded-full bg-zinc-400 [animation-delay:-0.3s]" />
              <span className="size-1.5 animate-bounce rounded-full bg-zinc-400 [animation-delay:-0.15s]" />
              <span className="size-1.5 animate-bounce rounded-full bg-zinc-400" />
            </div>
          )}
        </div>

        {/* controls */}
        <div className="space-y-2.5 border-t border-zinc-200 bg-white px-4 pb-7 pt-3">
          <div className={cn("flex items-center justify-between text-[11px]", mono)}>
            <span className="inline-flex items-center gap-1.5 text-zinc-500">
              <span className={cn("size-1.5 rounded-full", pill.dot)} />
              {pill.label}
            </span>
            <span className="flex items-center gap-2 text-zinc-900">
              <span className="text-sm">{liveExpr.emoji}</span>
              <span>{liveExpr.label}</span>
              <Pulse bpm={liveBpm} size={13} />
              {cameraOn && (
                <span className="text-zinc-400">
                  {hr ? `rPPG·q${Math.round(hr.quality * 100)}` : "rPPG…"}
                </span>
              )}
            </span>
          </div>

          {cameraOn ? (
            <div className="relative overflow-hidden rounded-xl border border-zinc-300 bg-black">
              <video
                ref={videoRef}
                autoPlay
                muted
                playsInline
                className="aspect-[4/3] w-full -scale-x-100 object-cover"
              />
              {detected && (
                <div
                  className={cn(
                    "absolute bottom-2 left-2 rounded bg-black/60 px-2 py-1 text-[11px] text-white",
                    mono,
                  )}
                >
                  {detected.expression.emoji} {detected.expression.label} ·{" "}
                  {Math.round(detected.confidence * 100)}%
                  {hr && ` · ${hr.bpm}bpm`}
                </div>
              )}
            </div>
          ) : (
            <div className={cn("flex items-center gap-2 text-[10px] text-zinc-400", mono)}>
              <span>CALM</span>
              <input
                type="range"
                min={0}
                max={100}
                value={stress}
                onChange={(e) => setStress(Number(e.target.value))}
                aria-label="simulated emotion (camera off)"
                className="h-1 flex-1 cursor-pointer accent-zinc-900"
              />
              <span>STRESSED</span>
            </div>
          )}

          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => setFaceSharing((v) => !v)}
              className={cn(
                "inline-flex items-center justify-center gap-1.5 rounded-lg border px-3 py-2 text-[12px] font-medium transition-colors",
                mono,
                faceSharing
                  ? "border-zinc-900 bg-zinc-900 text-white"
                  : "border-zinc-300 bg-white text-zinc-600 hover:border-zinc-900",
              )}
            >
              {faceSharing ? <Eye size={14} /> : <EyeOff size={14} />}
              {faceSharing ? "SHARING" : "PRIVATE"}
            </button>
            <button
              type="button"
              onClick={toggleCamera}
              className={cn(
                "inline-flex items-center justify-center gap-1.5 rounded-lg border px-3 py-2 text-[12px] font-medium transition-colors",
                mono,
                cameraOn
                  ? "border-zinc-900 bg-zinc-900 text-white"
                  : "border-zinc-300 bg-white text-zinc-600 hover:border-zinc-900",
              )}
            >
              {cameraOn ? <Camera size={14} /> : <CameraOff size={14} />}
              {cameraOn ? "CAMERA ON" : "CAMERA OFF"}
            </button>
          </div>

          <div className="flex items-center gap-2">
            <input
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && send()}
              placeholder="Message"
              className="h-10 flex-1 rounded-full border border-zinc-300 bg-white px-4 text-[14px] text-zinc-900 outline-none placeholder:text-zinc-400 focus:border-zinc-900"
            />
            <button
              type="button"
              onClick={send}
              aria-label="send"
              className="grid size-10 shrink-0 place-items-center rounded-full bg-zinc-900 text-white transition-transform hover:scale-105 active:scale-95"
            >
              <Send size={16} />
            </button>
          </div>
        </div>
      </IphoneShell>

      <canvas ref={canvasRef} className="hidden" />
      <canvas ref={sampleRef} className="hidden" />

      <p className={cn("mt-6 max-w-[390px] text-center text-[11px] leading-relaxed text-zinc-500", mono)}>
        CAMERA ON → each message ships a real still, the expression face-api reads
        on-device, and a heart rate estimated from skin colour (rPPG). CAMERA OFF →
        slider simulates the sensor. PRIVATE → text only — the control the original
        canvas (&ldquo;2 cameras on → no control&rdquo;) never had.
      </p>
    </main>
  );
}
