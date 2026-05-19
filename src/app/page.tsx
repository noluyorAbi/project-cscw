"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import {
  Activity,
  BatteryFull,
  Download,
  Eye,
  EyeOff,
  Heart,
  HeartOff,
  Send,
  Signal,
  Trash2,
  Wifi,
} from "lucide-react";
import { Pulse } from "@/components/pulse";
import { SiteNav } from "@/components/site-nav";
import { cn } from "@/lib/utils";
import {
  type ChatMessage,
  maraReply,
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

const fmtTime = (ts: number) =>
  new Date(ts).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });

/** thin bar that beats at `bpm` — the canvas's "armband that pulses your heartrate". */
function Armband({ bpm }: { bpm: number }) {
  return (
    <span
      className="armband-pulse inline-block h-2.5 w-6 rounded-full bg-rose-500"
      style={{ animationDuration: `${60 / Math.max(1, bpm)}s` }}
      aria-hidden
    />
  );
}

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

/** iPhone-15-Pro-ish shell: titanium rail, side buttons, Dynamic Island.
 *  Static; scales down to fit short viewports. */
function IphoneShell({ children }: { children: React.ReactNode }) {
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
function EmotionTimeline({
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
  const path = xy.map(([x, y], i) => `${i ? "L" : "M"}${x.toFixed(1)} ${y.toFixed(1)}`).join(" ");
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
        <path d={path} fill="none" stroke="#18181b" strokeWidth={1.2} vectorEffect="non-scaling-stroke" />
        <circle cx={xy[xy.length - 1][0]} cy={xy[xy.length - 1][1]} r={2} fill="#f43f5e" />
      </svg>
      <div className="flex justify-between">
        {pts.slice(-12).map((m) => (
          <span key={m.id} className="text-[11px] leading-none" title={m.expression?.label}>
            {m.expression?.emoji ?? "·"}
          </span>
        ))}
      </div>
    </div>
  );
}

export default function ChatPoc() {
  const [messages, setMessages] = useState<ChatMessage[]>(seed);
  const [draft, setDraft] = useState("");
  const [stress, setStress] = useState(45);
  const [faceSharing, setFaceSharing] = useState(true);
  // heartbeat (bpm / pulse / armband / haptics / rPPG) is opt-in
  const [shareHeartbeat, setShareHeartbeat] = useState(false);
  const [cameraOn, setCameraOn] = useState(false);
  const [faceStatus, setFaceStatus] = useState<FaceStatus>("off");
  const [detected, setDetected] = useState<Detection | null>(null);
  const [typing, setTyping] = useState(false);
  const [hr, setHr] = useState<{ bpm: number; quality: number } | null>(null);
  const [showTrend, setShowTrend] = useState(false);
  const [camDenied, setCamDenied] = useState(false);
  const [camConsent, setCamConsent] = useState(false);
  const [askConsent, setAskConsent] = useState(false);
  const [countdown, setCountdown] = useState<number | null>(null);
  const [flash, setFlash] = useState(false);
  const [zoomPhoto, setZoomPhoto] = useState<string | null>(null);

  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const sampleRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const boxRef = useRef<FaceBox | null>(null);
  const ppgRef = useRef<PpgEstimator | null>(null);
  const prefsLoaded = useRef(false);
  // text waiting to be sent once the auto-started camera is ready
  const pendingSendRef = useRef<string | null>(null);
  const postMessageRef = useRef<
    ((text: string, photo?: string) => void) | null
  >(null);

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

  const stopCamera = useCallback(() => {
    setCameraOn(false);
    setDetected(null);
    setHr(null);
    setFaceStatus("off");
    boxRef.current = null;
    ppgRef.current?.reset();
  }, []);

  const acceptConsent = useCallback(() => {
    setCamConsent(true);
    try {
      localStorage.setItem("cscw-cam-consent", "1");
    } catch {
      /* ignore */
    }
    setAskConsent(false);
    setFaceStatus("loading");
    setCameraOn(true);
  }, []);

  const declineConsent = useCallback(() => {
    setAskConsent(false);
    const pending = pendingSendRef.current;
    if (pending) {
      pendingSendRef.current = null;
      postMessageRef.current?.(pending); // send as text only
    }
  }, []);

  const retryDetection = useCallback(() => {
    if (!cameraOn) return;
    setFaceStatus("loading");
    loadFaceModels()
      .then(() => setFaceStatus("ready"))
      .catch(() => setFaceStatus("error"));
  }, [cameraOn]);

  const toggleHeartbeat = useCallback(() => {
    setShareHeartbeat((prev) => {
      if (prev) {
        setHr(null);
        ppgRef.current?.reset();
      }
      return !prev;
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
        setCamDenied(false);
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
          setCamDenied(true);
          // camera blocked — don't strand the queued message
          const pending = pendingSendRef.current;
          if (pending) {
            pendingSendRef.current = null;
            postMessageRef.current?.(pending);
          }
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
    if (!shareHeartbeat) return;
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
  }, [faceStatus, shareHeartbeat]);

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
        if (localStorage.getItem("cscw-cam-consent") === "1")
          setCamConsent(true);
        const p = localStorage.getItem("cscw-prefs");
        if (p) {
          const prefs = JSON.parse(p) as {
            faceSharing?: boolean;
            shareHeartbeat?: boolean;
            showTrend?: boolean;
          };
          if (typeof prefs.faceSharing === "boolean")
            setFaceSharing(prefs.faceSharing);
          if (typeof prefs.shareHeartbeat === "boolean")
            setShareHeartbeat(prefs.shareHeartbeat);
          if (typeof prefs.showTrend === "boolean")
            setShowTrend(prefs.showTrend);
        }
      } catch {
        /* ignore corrupt storage */
      } finally {
        prefsLoaded.current = true;
      }
    });
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    try {
      // photos are heavy base64 — keep them in memory for this session
      // but persist only the last 60 messages without photos so a long
      // conversation can't blow the localStorage quota
      const slim = messages.slice(-60).map((m) => ({ ...m, photo: undefined }));
      localStorage.setItem("cscw-chat", JSON.stringify(slim));
    } catch {
      /* quota / unavailable — non-fatal for a PoC */
    }
  }, [messages]);

  // persist preferences, but only after the initial load so defaults
  // don't clobber stored values on first commit
  useEffect(() => {
    if (!prefsLoaded.current) return;
    try {
      localStorage.setItem(
        "cscw-prefs",
        JSON.stringify({ faceSharing, shareHeartbeat, showTrend }),
      );
    } catch {
      /* ignore */
    }
  }, [faceSharing, shareHeartbeat, showTrend]);

  // only auto-scroll if the user is already near the bottom — don't yank
  // them down while they're reading older messages
  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    const nearBottom =
      el.scrollHeight - el.scrollTop - el.clientHeight < 120;
    if (nearBottom)
      el.scrollTo({ top: el.scrollHeight, behavior: "smooth" });
  }, [messages, typing]);

  const clearChat = useCallback(() => {
    setMessages(seed());
    try {
      localStorage.removeItem("cscw-chat");
    } catch {
      /* ignore */
    }
  }, []);

  // the conversation is the user's data — let them take it with them
  const exportChat = useCallback(() => {
    const payload = {
      exportedAt: new Date().toISOString(),
      app: "MMI2 SS26 Emotion-Aware Chat PoC",
      messages: messages.map((m) => ({
        author: m.author,
        text: m.text,
        expression: m.expression?.label,
        confidence: m.confidence,
        bpm: m.bpm,
        hasPhoto: Boolean(m.photo),
        ts: m.ts,
      })),
    };
    const blob = new Blob([JSON.stringify(payload, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `cscw-chat-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }, [messages]);

  // Escape dismisses the topmost overlay
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== "Escape") return;
      if (zoomPhoto) setZoomPhoto(null);
      else if (askConsent) declineConsent();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [zoomPhoto, askConsent, declineConsent]);

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

  const postMessage = useCallback(
    (text: string, photo?: string) => {
      let mine: ChatMessage;
      if (!faceSharing) {
        mine = { id: uid(), author: "me", text, ts: Date.now() };
      } else if (cameraOn) {
        mine = {
          id: uid(),
          author: "me",
          text,
          photo,
          expression: detected?.expression ?? sensedExpression(stress),
          bpm: !shareHeartbeat
            ? undefined
            : hr
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
          bpm: shareHeartbeat ? sensedBpm(stress) : undefined,
          ts: Date.now(),
        };
      }

      const myKey = mine.expression?.key;
      setMessages((m) => [...m, mine]);
      setTyping(true);

      const reactStress = Math.max(
        8,
        Math.min(95, stress + (Math.random() - 0.4) * 40),
      );
      window.setTimeout(
        () => {
          setTyping(false);
          const rbpm = sensedBpm(reactStress);
          setMessages((m) => [
            ...m,
            {
              id: uid(),
              author: "mara",
              text: maraReply(myKey),
              expression: sensedExpression(reactStress),
              bpm: shareHeartbeat ? rbpm : undefined,
              ts: Date.now(),
            },
          ]);
          if (shareHeartbeat) {
            const beat = Math.round(60000 / rbpm);
            navigator.vibrate?.([45, Math.max(60, beat - 45), 45]);
          }
        },
        1100 + Math.random() * 900,
      );
    },
    [faceSharing, cameraOn, detected, stress, shareHeartbeat, hr],
  );

  // keep a stable ref so the webcam effect can post a stranded message
  useEffect(() => {
    postMessageRef.current = postMessage;
  }, [postMessage]);

  // 1 s attention countdown -> flash -> capture -> post
  const runCapture = useCallback(
    (text: string) => {
      setCountdown(1);
      window.setTimeout(() => {
        setCountdown(null);
        setFlash(true);
        const photo = capturePhoto();
        window.setTimeout(() => setFlash(false), 160);
        postMessage(text, photo);
      }, 1000);
    },
    [capturePhoto, postMessage],
  );

  // once the auto-started camera is ready, capture the queued message
  useEffect(() => {
    if (faceStatus !== "ready" && faceStatus !== "searching") return;
    const pending = pendingSendRef.current;
    if (!pending) return;
    pendingSendRef.current = null;
    runCapture(pending);
  }, [faceStatus, runCapture]);

  function send() {
    const text = draft.trim();
    if (!text || countdown !== null || pendingSendRef.current) return;
    setDraft("");

    // private mode → text only, nothing sensed
    if (!faceSharing) {
      postMessage(text);
      return;
    }
    // camera already live → capture now
    if (cameraOn && (faceStatus === "ready" || faceStatus === "searching")) {
      runCapture(text);
      return;
    }
    // camera blocked earlier → fall back to the slider simulation
    if (camDenied) {
      postMessage(text);
      return;
    }
    // auto-start the camera; capture fires when it's ready
    pendingSendRef.current = text;
    if (!camConsent) {
      setAskConsent(true);
      return;
    }
    setFaceStatus("loading");
    setCameraOn(true);
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
    <main className="flex flex-1 flex-col items-center justify-center bg-white px-4 py-12 [background-image:radial-gradient(ellipse_at_50%_0,#f4f4f5,#fff_60%)]">
      <div className="mb-8 flex w-full max-w-[404px] flex-col items-center text-center">
        <p className={cn("text-[10px] uppercase tracking-[0.25em] text-zinc-400", mono)}>
          MMI2 · CSCW · LMU Munich
        </p>
        <h1 className="mt-2 text-3xl font-bold tracking-tight text-zinc-900">
          Emotion-Aware Chat
        </h1>
        <p className="mt-2 text-[14px] text-zinc-500">
          Every message carries the sender&apos;s expression and heart rate.
        </p>
        <div className="mt-4">
          <SiteNav active="chat" />
        </div>
        <ol className={cn("mt-6 flex w-full gap-2 text-left text-[10px] text-zinc-500", mono)}>
          {[
            ["01", "Type a message"],
            ["02", "Camera reads your expression + pulse"],
            ["03", "They see how you actually feel"],
          ].map(([n, t]) => (
            <li
              key={n}
              className="flex-1 rounded-lg border border-zinc-200 p-2.5"
            >
              <span className="block text-zinc-900">{n}</span>
              <span className="mt-1 block leading-snug">{t}</span>
            </li>
          ))}
        </ol>
      </div>
      <IphoneShell>
        {/* app header */}
        <header className="flex items-center gap-3 border-b border-zinc-200 bg-white px-5 py-2.5">
          <div
            className="grid size-9 place-items-center rounded-full bg-zinc-900 text-base text-white ring-2 ring-zinc-200"
            title={maraLast?.expression?.label ?? "Mara"}
          >
            {maraLast?.expression ? maraLast.expression.emoji : "M"}
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
                  {shareHeartbeat && typeof maraLast.bpm === "number" && (
                    <>
                      <Armband bpm={maraLast.bpm} />
                      <Pulse bpm={maraLast.bpm} size={11} />
                    </>
                  )}
                </>
              ) : (
                "online"
              )}
            </p>
          </div>
          <button
            type="button"
            onClick={() => setShowTrend((v) => !v)}
            aria-label="toggle emotion trend"
            aria-pressed={showTrend}
            className={cn(
              "rounded-md p-1.5 hover:bg-zinc-100",
              showTrend ? "text-zinc-900" : "text-zinc-400 hover:text-zinc-900",
            )}
          >
            <Activity size={15} />
          </button>
          <button
            type="button"
            onClick={exportChat}
            aria-label="export conversation"
            className="rounded-md p-1.5 text-zinc-400 hover:bg-zinc-100 hover:text-zinc-900"
          >
            <Download size={15} />
          </button>
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
          role="log"
          aria-live="polite"
          aria-relevant="additions"
          aria-label="conversation with Mara"
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
                    <button
                      type="button"
                      onClick={() => setZoomPhoto(m.photo!)}
                      aria-label="enlarge attached photo"
                      className="block w-44 cursor-zoom-in"
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={m.photo}
                        alt="sender's face at send time"
                        className="aspect-[4/3] w-44 object-cover"
                      />
                    </button>
                  )}
                  <p className="px-3 py-2">{m.text}</p>
                </div>
                <span className="sr-only" suppressHydrationWarning>
                  {mine ? "You" : "Mara"}
                  {m.expression
                    ? `, ${m.expression.label}${
                        typeof m.confidence === "number"
                          ? ` ${Math.round(m.confidence * 100)} percent`
                          : ""
                      }`
                    : ""}
                  {shareHeartbeat && typeof m.bpm === "number"
                    ? `, ${m.bpm} bpm`
                    : ""}{" "}
                  at{" "}
                  {fmtTime(m.ts)}
                </span>
                <div
                  aria-hidden
                  className={cn(
                    "flex items-center gap-1.5 px-1 text-[10px] text-zinc-500",
                    mono,
                  )}
                >
                  {m.expression ? (
                    <>
                      <span className="rounded-full border border-zinc-200 bg-white px-1.5 py-0.5 font-medium text-zinc-600">
                        {m.expression.emoji} {m.expression.label}
                        {typeof m.confidence === "number" &&
                          ` · ${Math.round(m.confidence * 100)}%`}
                      </span>
                      {shareHeartbeat && typeof m.bpm === "number" && (
                        <Pulse bpm={m.bpm} size={11} />
                      )}
                    </>
                  ) : (
                    <span className="italic opacity-70">no signal shared</span>
                  )}
                  <span className="opacity-50" suppressHydrationWarning>
                    {fmtTime(m.ts)}
                  </span>
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

        {showTrend && (
          <div className="border-t border-zinc-200 bg-white px-4">
            <EmotionTimeline data={messages} enabled={shareHeartbeat} />
          </div>
        )}

        {/* controls */}
        <div className="space-y-2.5 border-t border-zinc-200 bg-white px-4 pb-7 pt-3">
          <div className={cn("flex items-center justify-between text-[11px]", mono)}>
            {faceStatus === "error" ? (
              <button
                type="button"
                onClick={retryDetection}
                className="inline-flex items-center gap-1.5 text-red-600 hover:underline"
              >
                <span className={cn("size-1.5 rounded-full", pill.dot)} />
                {pill.label} · RETRY
              </button>
            ) : (
              <span className="inline-flex items-center gap-1.5 text-zinc-500">
                <span className={cn("size-1.5 rounded-full", pill.dot)} />
                {pill.label}
              </span>
            )}
            <span className="flex items-center gap-2 text-zinc-900">
              <span className="text-sm">{liveExpr.emoji}</span>
              <span>{liveExpr.label}</span>
              {shareHeartbeat && (
                <>
                  <Pulse bpm={liveBpm} size={13} />
                  {cameraOn && (
                    <span className="text-zinc-400">
                      {hr ? `rPPG·q${Math.round(hr.quality * 100)}` : "rPPG…"}
                    </span>
                  )}
                </>
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
              onClick={() =>
                setFaceSharing((prev) => {
                  const next = !prev;
                  if (!next) stopCamera(); // going private releases the webcam
                  return next;
                })
              }
              aria-pressed={faceSharing}
              className={cn(
                "inline-flex items-center justify-center gap-1.5 rounded-lg border px-2 py-2 text-[11px] font-medium transition-colors",
                mono,
                faceSharing
                  ? "border-zinc-900 bg-zinc-900 text-white"
                  : "border-zinc-300 bg-white text-zinc-600 hover:border-zinc-900",
              )}
            >
              {faceSharing ? <Eye size={13} /> : <EyeOff size={13} />}
              {faceSharing ? "SHARE FACE" : "TEXT ONLY"}
            </button>
            <button
              type="button"
              onClick={toggleHeartbeat}
              aria-pressed={shareHeartbeat}
              className={cn(
                "inline-flex items-center justify-center gap-1.5 rounded-lg border px-2 py-2 text-[11px] font-medium transition-colors",
                mono,
                shareHeartbeat
                  ? "border-rose-500 bg-rose-500 text-white"
                  : "border-zinc-300 bg-white text-zinc-600 hover:border-zinc-900",
              )}
            >
              {shareHeartbeat ? <Heart size={13} /> : <HeartOff size={13} />}
              {shareHeartbeat ? "PULSE ON" : "PULSE OFF"}
            </button>
          </div>
          <p className={cn("text-center text-[10px] text-zinc-400", mono)}>
            {faceSharing
              ? "camera opens automatically when you send"
              : "messages are text only"}
          </p>

          {camDenied && !cameraOn && (
            <p className={cn("text-center text-[10px] text-red-600", mono)}>
              camera blocked — allow it in your browser; sending uses text +
              the slider until then
            </p>
          )}

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
              disabled={countdown !== null}
              aria-label="send"
              className="grid size-10 shrink-0 place-items-center rounded-full bg-zinc-900 text-white transition-transform hover:scale-105 active:scale-95 disabled:opacity-50"
            >
              <Send size={16} />
            </button>
          </div>
        </div>
        {zoomPhoto && (
          <button
            type="button"
            onClick={() => setZoomPhoto(null)}
            aria-label="close photo"
            className="absolute inset-0 z-50 flex items-center justify-center bg-black/85 p-6"
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={zoomPhoto}
              alt="attached photo, enlarged"
              className="max-h-full max-w-full rounded-xl object-contain"
            />
            <span
              className={cn(
                "absolute bottom-8 left-1/2 -translate-x-1/2 text-[11px] uppercase tracking-[0.2em] text-white/70",
                mono,
              )}
            >
              tap to close
            </span>
          </button>
        )}

        {countdown !== null && (
          <div className="absolute inset-0 z-50 flex flex-col items-center justify-center gap-3 bg-black/70 backdrop-blur-sm">
            <span
              key={countdown}
              className="animate-ping text-7xl font-bold text-white"
              style={{ animationDuration: "1s", animationIterationCount: 1 }}
            >
              {countdown}
            </span>
            <span className={cn("text-[12px] uppercase tracking-[0.25em] text-white/90", mono)}>
              look at the camera
            </span>
          </div>
        )}
        {flash && (
          <div className="pointer-events-none absolute inset-0 z-50 bg-white" />
        )}

        {askConsent && (
          <div className="absolute inset-0 z-40 flex items-end justify-center bg-black/40 p-3 pb-9">
            <div className="w-full rounded-2xl border border-zinc-200 bg-white p-4 shadow-2xl">
              <p className={cn("text-[11px] uppercase tracking-[0.18em] text-zinc-500", mono)}>
                Camera consent
              </p>
              <p className="mt-2 text-[13px] leading-relaxed text-zinc-900">
                Frames are analysed <strong>on this device only</strong> — face
                expression (and, if you enable PULSE, a heart-rate estimate).
                Nothing is uploaded or recorded. A still is attached to a
                message only when you press send. You can stop the camera any
                time.
              </p>
              <div className="mt-4 grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={declineConsent}
                  className={cn(
                    "rounded-lg border border-zinc-300 bg-white px-3 py-2 text-[12px] font-medium text-zinc-600 hover:border-zinc-900",
                    mono,
                  )}
                >
                  NOT NOW
                </button>
                <button
                  type="button"
                  onClick={acceptConsent}
                  className={cn(
                    "rounded-lg border border-zinc-900 bg-zinc-900 px-3 py-2 text-[12px] font-medium text-white",
                    mono,
                  )}
                >
                  ALLOW CAMERA
                </button>
              </div>
            </div>
          </div>
        )}
      </IphoneShell>

      <canvas ref={canvasRef} className="hidden" />
      <canvas ref={sampleRef} className="hidden" />

      <div className="mt-8 w-full max-w-[404px] border-t border-zinc-200 pt-4">
        <p className={cn("text-center text-[10px] uppercase tracking-[0.2em] text-zinc-400", mono)}>
          MMI2 · CSCW · Emotion-Aware Chat PoC
        </p>
        <p className={cn("mt-2 text-center text-[11px] leading-relaxed text-zinc-500", mono)}>
          CAMERA ON → real still + on-device face-api expression + rPPG heart
          rate per message. CAMERA OFF → slider simulates the sensor. PRIVATE →
          text only, the control the canvas (&ldquo;2 cameras on → no
          control&rdquo;) never had.
        </p>
      </div>
    </main>
  );
}
