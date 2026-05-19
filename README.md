# project-cscw — Emotion-Aware Chat (PoC)

Course project for **Human-Computer Interaction 2 (MMI2), SoSe 2026** — LMU Munich, Media Informatics Group (Prof. Dr. Albrecht Schmidt).

Working proof of concept for the ORBIT "Your Final Idea" canvas: a phone
messenger that ships the **sender's facial expression** and an optional
**heart rate** with every message, so the receiver perceives the emotional
state behind the text — plus the responsible-design controls the original
canvas lacked.

## Run

```bash
pnpm install
pnpm dev        # http://localhost:3000
```

## Routes

| Route   | What                                                                                  |
|---------|---------------------------------------------------------------------------------------|
| `/`     | The chat PoC, inside a responsive iPhone shell.                                        |
| `/idea` | The reconstructed ORBIT canvas; each item tagged BUILT / ADDRESSED IN POC.             |

## What works

- **Real facial-expression detection** — `@vladmandic/face-api`
  (TinyFaceDetector + FaceExpressionNet), fully on-device, 5-read majority
  vote so the badge is stable. Camera off → a slider simulates the sensor.
- **Photo per message** — on send with camera + sharing on: a 1 s "look at
  the camera" countdown → flash → still captured and attached. Tap a photo
  to enlarge.
- **Heart rate (rPPG)** — opt-in, off by default. Forehead-ROI green-channel
  sampled per animation frame, autocorrelation → bpm. Used for the pulse,
  the partner "armband" beat, and haptic vibration. Off ⇒ suppressed
  everywhere (logic + render).
- **Emotion-reactive replies** — the simulated peer answers according to the
  expression she receives, not at random.
- **Session emotion timeline** — collapsible bpm sparkline + expression
  track of your own messages.
- **Privacy / consent** — first camera use gated by an on-device consent
  dialog; PRIVATE mode sends text only; preferences + chat + consent persist
  to `localStorage`.
- **Accessibility** — `role=log` + `aria-live` message list, `sr-only`
  per-message summaries, `prefers-reduced-motion` disables animations.

## Idea → PoC mapping

| Canvas note | Realised as |
|---|---|
| send face with each message | face-api expression badge + attached still |
| stress → heartrate / bpm next to message | rPPG `Pulse` (period = 60/bpm s) |
| armband that pulses your heartrate | header armband bar + `navigator.vibrate` |
| 2 cameras on → no control | consent gate + PRIVATE + camera toggle |
| limited by visual cues | screen-reader summaries, reduced-motion |
| more information on emotional state | emotion timeline |

## Stack

Next.js 16 (App Router, Turbopack) · React · TypeScript · Tailwind v4 ·
Inter + JetBrains Mono · lucide-react · `@vladmandic/face-api`.

Key code: `src/app/page.tsx` (chat + iPhone shell), `src/lib/face.ts`
(detection), `src/lib/ppg.ts` (rPPG), `src/lib/emotion.ts` (model + replies),
`src/app/idea/page.tsx` (canvas).

## Author

Alperen Adatepe

## License

TBD
