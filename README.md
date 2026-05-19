# project-cscw — Emotion-Aware Chat

Course project for **Human-Computer Interaction 2 (MMI2), SoSe 2026** — LMU
Munich, Media Informatics Group (Prof. Dr. Albrecht Schmidt).

A working app realising the ORBIT "Your Final Idea" canvas: a phone messenger
that ships the **sender's facial expression** and an optional **heart rate**
with every message — plus the responsible-design controls the canvas lacked.

## Run

```bash
pnpm install
pnpm dev        # http://localhost:3000
```

## Routes

| Route   | What                                                                  |
|---------|-----------------------------------------------------------------------|
| `/`     | Landing hero + 3-step explainer + the chat, inside an iPhone shell.    |
| `/idea` | Reconstructed ORBIT canvas; items tagged BUILT / ADDRESSED IN POC.     |
| `/about`| Methodology, course readings, ethics levers, honest limitations.      |
| `*`     | Branded 404.                                                          |

Shared `SiteNav` (CHAT / CANVAS / ABOUT) on every route.

## How it works

1. **Type a message.**
2. With **SHARE FACE** on, the camera opens automatically on send: a 1 s
   "look at the camera" countdown → flash → still captured. **TEXT ONLY**
   sends plain text and releases the webcam.
3. The receiver sees the sender's detected expression (+ photo, + bpm if
   PULSE is on).

- **Expression** — `@vladmandic/face-api` (TinyFaceDetector +
  FaceExpressionNet), on-device, 5-read majority vote. Camera off → a slider
  simulates the sensor.
- **Heart rate** — opt-in (off by default) rPPG: forehead-ROI green channel
  sampled per frame, autocorrelation → bpm. Drives the pulse, the partner
  "armband" beat, and haptic vibration. Off ⇒ suppressed everywhere.
- **Privacy** — first camera use gated by an on-device consent dialog;
  preferences + chat + consent persist to `localStorage` (photos stripped,
  last 60 messages, to stay under quota).
- **Extras** — emotion-trend sparkline, per-message timestamps, tap-to-zoom
  photos, conversation export (JSON), emotion-reactive replies, screen-reader
  summaries, `prefers-reduced-motion`.

## Stack

Next.js 16 (App Router, Turbopack) · React · TypeScript · Tailwind v4 ·
Helvetica + JetBrains Mono · lucide-react · `@vladmandic/face-api`.

## Structure

```
src/
├── app/
│   ├── page.tsx              chat (state, capture, rPPG/detection loops)
│   ├── idea/page.tsx         ORBIT canvas
│   ├── about/page.tsx        methodology
│   ├── not-found.tsx         404
│   ├── opengraph-image.tsx   dynamic OG
│   └── icon.svg              favicon
├── components/
│   ├── phone.tsx             IphoneShell, Armband, EmotionTimeline
│   ├── pulse.tsx             beating-heart bpm indicator
│   └── site-nav.tsx          shared nav
└── lib/
    ├── emotion.ts            model, expressions, replies
    ├── face.ts               face-api wrapper
    └── ppg.ts                rPPG estimator
```

ruflo (`ruvnet/ruflo`) is wired as repo dev tooling only (`.mcp.json`,
`.claude/`), not a runtime dependency of the app.

## Author

Alperen Adatepe ·
[github.com/noluyorAbi/project-cscw](https://github.com/noluyorAbi/project-cscw)

## License

TBD
