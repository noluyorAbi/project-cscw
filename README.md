# project-cscw — Emotion-Aware Chat (PoC)

Course project for **Human-Computer Interaction 2 (MMI2), SoSe 2026** — LMU Munich, Media Informatics Group (Prof. Dr. Albrecht Schmidt).

Proof of concept for the ORBIT "Your Final Idea" canvas: a WhatsApp-style chat
that ships the **sender's detected facial expression** and **heart rate (bpm)**
with every message — so the receiver sees the emotional state behind the text.

## Run

```bash
pnpm install
pnpm dev        # http://localhost:3000
```

## Routes

| Route   | What                                                                         |
|---------|------------------------------------------------------------------------------|
| `/`     | The chat PoC. Stress slider stands in for camera + biosensor; each message carries an expression badge + a beating-heart bpm indicator; the simulated peer reacts to your signal. |
| `/idea` | The original ORBIT idea canvas, reconstructed (Problem / Solution / Implications / Benefits). |

## Idea → PoC mapping

- *"send face with each text message"* → expression badge on every bubble.
- *"stress level → heartrate sent to other person"* / *"bpm next to message"* → `Pulse` component, animation period = `60/bpm` s.
- *"armband that pulses your heartrate"* → peer's live pulse in the chat header.
- *"2 cameras on → no control"* (privacy/ethical note on the canvas) → added a **"sharing nothing"** toggle: the responsible-design lever the canvas itself lacked. Optional real webcam makes the always-on-camera concern tangible; frames are never used.

## Stack

Next.js 16 (App Router, Turbopack) · React · TypeScript · Tailwind v4 · shadcn/ui · lucide-react.

## Status

Boilerplate + PoC scaffolded. Concept, prototype hardening, and paper: TBD.

## Author

Alperen Adatepe

## License

TBD
