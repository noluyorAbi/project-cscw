"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import {
  Camera,
  CameraOff,
  Eye,
  EyeOff,
  Loader2,
  ScanFace,
  Send,
  Trash2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
import { type Detection, detectExpression, loadFaceModels } from "@/lib/face";

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

export default function ChatPoc() {
  const [messages, setMessages] = useState<ChatMessage[]>(seed);
  const [draft, setDraft] = useState("");
  const [stress, setStress] = useState(45);
  const [faceSharing, setFaceSharing] = useState(true);
  const [cameraOn, setCameraOn] = useState(false);
  const [faceStatus, setFaceStatus] = useState<FaceStatus>("off");
  const [detected, setDetected] = useState<Detection | null>(null);
  const [typing, setTyping] = useState(false);

  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  const live =
    cameraOn && detected
      ? { expr: detected.expression, bpm: stressToBpm(detected.arousal) }
      : { expr: stressToExpression(stress), bpm: stressToBpm(stress) };
  const maraLast = [...messages].reverse().find((m) => m.author === "mara");

  // state transitions live in the toggle (an event), not in the effect
  const toggleCamera = useCallback(() => {
    setCameraOn((prev) => {
      const next = !prev;
      if (next) {
        setFaceStatus("loading");
      } else {
        setDetected(null);
        setFaceStatus("off");
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

  // detection loop — analyze the live frame ~1.4x/s
  useEffect(() => {
    if (faceStatus !== "ready" && faceStatus !== "searching") return;
    let alive = true;
    const tick = async () => {
      if (!alive || !videoRef.current) return;
      try {
        const d = await detectExpression(videoRef.current);
        if (!alive) return;
        setDetected(d);
        setFaceStatus(d ? "ready" : "searching");
      } catch {
        if (alive) setFaceStatus("error");
      }
    };
    const iv = window.setInterval(tick, 700);
    void tick();
    return () => {
      alive = false;
      window.clearInterval(iv);
    };
  }, [faceStatus]);

  // persistence — load once on mount. Deferred to a microtask so the first
  // paint still matches the SSR markup (no hydration mismatch) and the state
  // update is not synchronous inside the effect.
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

  // grab a mirrored, downscaled still from the video
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
    ctx.scale(-1, 1); // mirror to match the selfie preview
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
      // real detection from the captured image
      mine = {
        id: uid(),
        author: "me",
        text,
        photo: capturePhoto(),
        expression: detected?.expression ?? sensedExpression(stress),
        bpm: detected ? stressToBpm(detected.arousal) : sensedBpm(stress),
        confidence: detected?.confidence,
        ts: Date.now(),
      };
    } else {
      // camera off -> slider stands in for the sensor
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

  const statusPill: Record<FaceStatus, { label: string; cls: string; spin?: boolean }> = {
    off: { label: "camera off", cls: "bg-zinc-100 text-zinc-500" },
    loading: { label: "loading model…", cls: "bg-amber-100 text-amber-800", spin: true },
    ready: { label: "face detected", cls: "bg-emerald-100 text-emerald-800" },
    searching: { label: "no face in frame", cls: "bg-amber-100 text-amber-800" },
    error: { label: "detection failed", cls: "bg-rose-100 text-rose-800" },
  };
  const pill = statusPill[faceStatus];

  return (
    <main className="flex flex-1 flex-col items-center bg-gradient-to-b from-indigo-50 via-background to-background px-4 py-8">
      <div className="flex w-full max-w-sm flex-col overflow-hidden rounded-[2rem] border bg-card shadow-2xl ring-1 ring-black/5">
        {/* header */}
        <header className="flex items-center gap-3 border-b bg-gradient-to-r from-indigo-500 to-violet-500 px-4 py-3 text-white">
          <div className="grid size-10 place-items-center rounded-full bg-white/20 text-lg">
            🧑‍🦰
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-semibold leading-tight">Mara</p>
            <p className="flex items-center gap-2 text-xs text-white/80">
              {maraLast?.expression ? (
                <>
                  <span>
                    {maraLast.expression.emoji} {maraLast.expression.label}
                  </span>
                  {typeof maraLast.bpm === "number" && (
                    <Pulse bpm={maraLast.bpm} size={12} />
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
            className="rounded-md bg-white/15 p-1.5 hover:bg-white/25"
          >
            <Trash2 size={14} />
          </button>
          <Link
            href="/idea"
            className="rounded-md bg-white/15 px-2 py-1 text-xs hover:bg-white/25"
          >
            canvas
          </Link>
        </header>

        {/* messages */}
        <div
          ref={scrollRef}
          className="flex h-[28rem] flex-col gap-3 overflow-y-auto bg-muted/30 p-4"
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
                    "max-w-[82%] overflow-hidden rounded-2xl text-sm shadow-sm",
                    mine
                      ? "rounded-br-sm bg-primary text-primary-foreground"
                      : "rounded-bl-sm bg-card",
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
                <div className="flex items-center gap-1.5 px-1 text-[11px] text-muted-foreground">
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
                      {typeof m.bpm === "number" && <Pulse bpm={m.bpm} size={12} />}
                    </>
                  ) : (
                    <span className="italic opacity-70">face &amp; pulse not shared</span>
                  )}
                </div>
              </div>
            );
          })}
          {typing && (
            <div className="flex items-center gap-1 self-start rounded-2xl rounded-bl-sm bg-card px-3 py-2.5 shadow-sm">
              <span className="size-1.5 animate-bounce rounded-full bg-muted-foreground/60 [animation-delay:-0.3s]" />
              <span className="size-1.5 animate-bounce rounded-full bg-muted-foreground/60 [animation-delay:-0.15s]" />
              <span className="size-1.5 animate-bounce rounded-full bg-muted-foreground/60" />
            </div>
          )}
        </div>

        {/* controls */}
        <div className="space-y-3 border-t bg-card px-4 py-3">
          <div className="flex items-center justify-between">
            <span
              className={cn(
                "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-medium",
                pill.cls,
              )}
            >
              {pill.spin ? (
                <Loader2 size={12} className="animate-spin" />
              ) : (
                <ScanFace size={12} />
              )}
              {pill.label}
            </span>
            <span className="flex items-center gap-2 text-xs">
              <span className="text-base">{live.expr.emoji}</span>
              <span className="font-medium">{live.expr.label}</span>
              <Pulse bpm={live.bpm} size={14} />
            </span>
          </div>

          {cameraOn ? (
            <div className="relative overflow-hidden rounded-xl border bg-black">
              <video
                ref={videoRef}
                autoPlay
                muted
                playsInline
                className="aspect-[4/3] w-full -scale-x-100 object-cover"
              />
              {detected && (
                <div className="absolute bottom-2 left-2 rounded-md bg-black/55 px-2 py-1 text-xs text-white">
                  {detected.expression.emoji} {detected.expression.label} ·{" "}
                  {Math.round(detected.confidence * 100)}%
                </div>
              )}
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <span className="text-[10px] text-muted-foreground">calm</span>
              <input
                type="range"
                min={0}
                max={100}
                value={stress}
                onChange={(e) => setStress(Number(e.target.value))}
                aria-label="simulated emotion (camera off)"
                className="h-1.5 flex-1 cursor-pointer accent-rose-500"
              />
              <span className="text-[10px] text-muted-foreground">stressed</span>
            </div>
          )}

          <div className="flex gap-2">
            <Button
              type="button"
              variant={faceSharing ? "secondary" : "outline"}
              size="sm"
              className="flex-1 text-xs"
              onClick={() => setFaceSharing((v) => !v)}
            >
              {faceSharing ? <Eye size={14} /> : <EyeOff size={14} />}
              {faceSharing ? "sharing" : "private"}
            </Button>
            <Button
              type="button"
              variant={cameraOn ? "secondary" : "outline"}
              size="sm"
              className="flex-1 text-xs"
              onClick={toggleCamera}
            >
              {cameraOn ? <Camera size={14} /> : <CameraOff size={14} />}
              {cameraOn ? "camera on" : "camera off"}
            </Button>
          </div>

          <div className="flex gap-2">
            <Input
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && send()}
              placeholder="Message"
              className="flex-1"
            />
            <Button type="button" size="icon" onClick={send} aria-label="send">
              <Send size={16} />
            </Button>
          </div>
        </div>
      </div>

      <canvas ref={canvasRef} className="hidden" />

      <p className="mt-4 max-w-sm text-center text-xs text-muted-foreground">
        With the camera on, each message ships a real still + the expression a
        face-detection model reads from it (face-api, on-device). Camera off, the
        slider simulates the sensor. <strong>private</strong> sends text only — the
        control the original canvas (&ldquo;2 cameras on → no control&rdquo;) lacked.
      </p>
    </main>
  );
}
