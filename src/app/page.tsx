"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { Camera, CameraOff, Eye, EyeOff, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Pulse } from "@/components/pulse";
import { cn } from "@/lib/utils";
import {
  type ChatMessage,
  MARA_REPLIES,
  stressToBpm,
  stressToExpression,
  uid,
} from "@/lib/emotion";

const seed = (): ChatMessage[] => {
  const now = Date.now();
  return [
    {
      id: uid(),
      author: "mara",
      text: "hey! how did the exam go??",
      expression: stressToExpression(30),
      bpm: stressToBpm(30),
      ts: now - 60000,
    },
  ];
};

export default function ChatPoc() {
  const [messages, setMessages] = useState<ChatMessage[]>(seed);
  const [draft, setDraft] = useState("");
  const [stress, setStress] = useState(45);
  const [faceSharing, setFaceSharing] = useState(true);
  const [cameraOn, setCameraOn] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  const myBpm = stressToBpm(stress);
  const maraLast = [...messages].reverse().find((m) => m.author === "mara");

  // optional real webcam — present only to make the canvas's
  // "2 cameras on -> no control" point tangible. Frames are never used.
  useEffect(() => {
    if (!cameraOn) {
      streamRef.current?.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
      return;
    }
    let cancelled = false;
    navigator.mediaDevices
      ?.getUserMedia({ video: { facingMode: "user" }, audio: false })
      .then((s) => {
        if (cancelled) {
          s.getTracks().forEach((t) => t.stop());
          return;
        }
        streamRef.current = s;
        if (videoRef.current) videoRef.current.srcObject = s;
      })
      .catch(() => setCameraOn(false));
    return () => {
      cancelled = true;
    };
  }, [cameraOn]);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages]);

  function send() {
    const text = draft.trim();
    if (!text) return;
    const mine: ChatMessage = {
      id: uid(),
      author: "me",
      text,
      expression: faceSharing ? stressToExpression(stress) : undefined,
      bpm: faceSharing ? myBpm : undefined,
      ts: Date.now(),
    };
    setMessages((m) => [...m, mine]);
    setDraft("");

    // simulated other person reacts to your emotional signal
    const reactStress = Math.max(8, Math.min(95, stress + (Math.random() - 0.4) * 40));
    window.setTimeout(() => {
      setMessages((m) => [
        ...m,
        {
          id: uid(),
          author: "mara",
          text: MARA_REPLIES[Math.floor(Math.random() * MARA_REPLIES.length)],
          expression: stressToExpression(reactStress),
          bpm: stressToBpm(reactStress),
          ts: Date.now(),
        },
      ]);
    }, 1100 + Math.random() * 900);
  }

  return (
    <main className="flex flex-1 flex-col items-center bg-muted/40 px-4 py-6">
      <div className="flex w-full max-w-md flex-col overflow-hidden rounded-3xl border bg-card shadow-xl">
        {/* header */}
        <header className="flex items-center gap-3 border-b bg-card px-4 py-3">
          <div className="grid size-10 place-items-center rounded-full bg-primary/10 text-lg">🧑‍🦰</div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-semibold leading-tight">Mara</p>
            <p className="flex items-center gap-2 text-xs text-muted-foreground">
              {maraLast?.expression ? (
                <>
                  <span>
                    {maraLast.expression.emoji} {maraLast.expression.label}
                  </span>
                  {typeof maraLast.bpm === "number" && (
                    <Pulse bpm={maraLast.bpm} size={12} className="text-rose-600" />
                  )}
                </>
              ) : (
                "online"
              )}
            </p>
          </div>
          <Link
            href="/idea"
            className="rounded-md border px-2 py-1 text-xs text-muted-foreground hover:bg-accent"
          >
            idea canvas
          </Link>
        </header>

        {/* messages */}
        <div
          ref={scrollRef}
          className="flex h-[26rem] flex-col gap-3 overflow-y-auto bg-muted/30 p-4"
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
                    "max-w-[80%] rounded-2xl px-3 py-2 text-sm shadow-sm",
                    mine
                      ? "rounded-br-sm bg-primary text-primary-foreground"
                      : "rounded-bl-sm bg-card",
                  )}
                >
                  {m.text}
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
        </div>

        {/* live emotional state / privacy controls */}
        <div className="space-y-3 border-t bg-card px-4 py-3">
          <div className="flex items-center justify-between text-xs">
            <span className="font-medium">
              your state:{" "}
              <span className="text-base">{stressToExpression(stress).emoji}</span>{" "}
              {stressToExpression(stress).label}
            </span>
            <Pulse bpm={myBpm} size={14} />
          </div>
          <div className="flex items-center gap-2">
            <span className="text-[10px] text-muted-foreground">calm</span>
            <input
              type="range"
              min={0}
              max={100}
              value={stress}
              onChange={(e) => setStress(Number(e.target.value))}
              aria-label="simulated stress level"
              className="h-1.5 flex-1 cursor-pointer accent-rose-500"
            />
            <span className="text-[10px] text-muted-foreground">stressed</span>
          </div>

          <div className="flex gap-2">
            <Button
              type="button"
              variant={faceSharing ? "secondary" : "outline"}
              size="sm"
              className="flex-1 text-xs"
              onClick={() => setFaceSharing((v) => !v)}
            >
              {faceSharing ? <Eye size={14} /> : <EyeOff size={14} />}
              {faceSharing ? "sharing face + pulse" : "sharing nothing"}
            </Button>
            <Button
              type="button"
              variant={cameraOn ? "secondary" : "outline"}
              size="sm"
              className="flex-1 text-xs"
              onClick={() => setCameraOn((v) => !v)}
            >
              {cameraOn ? <Camera size={14} /> : <CameraOff size={14} />}
              {cameraOn ? "camera on" : "camera off"}
            </Button>
          </div>

          {cameraOn && (
            <video
              ref={videoRef}
              autoPlay
              muted
              playsInline
              className="aspect-video w-full -scale-x-100 rounded-lg border bg-black object-cover"
            />
          )}

          {/* composer */}
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

      <p className="mt-4 max-w-md text-center text-xs text-muted-foreground">
        PoC — MMI2 SS26 idea canvas. Every message ships the sender&apos;s detected
        expression and heart rate; the slider stands in for camera + biosensor.
        Toggling <strong>sharing nothing</strong> is the responsible-design lever the
        original canvas lacked (&ldquo;2 cameras on → no control&rdquo;).
      </p>
    </main>
  );
}
