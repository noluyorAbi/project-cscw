<div align="center">

<img src="https://raw.githubusercontent.com/noluyorAbi/project-cscw/main/src/app/icon.svg" width="84" height="84" alt="project-cscw mark" />

<h1>project-cscw</h1>

<p>
  <strong>An emotion-aware messenger.</strong><br/>
  Every message ships the sender&apos;s facial expression and an optional, opt-in heart-rate signal &mdash; computed entirely on-device.
</p>

<p>
  Course project for <em>Mensch&ndash;Maschine&ndash;Interaktion 2</em> (Human&ndash;Computer Interaction 2)<br/>
  Media Informatics Group &middot; LMU Munich &middot; SoSe 2026
</p>

<p>
  <a href="https://project-cscw.vercel.app"><b>Live demo</b></a>
  &nbsp;&middot;&nbsp;
  <a href="https://project-cscw.vercel.app/idea">ORBIT canvas</a>
  &nbsp;&middot;&nbsp;
  <a href="https://project-cscw.vercel.app/about">Methodology</a>
  &nbsp;&middot;&nbsp;
  <a href="#quick-start">Run locally</a>
</p>

<p>
  <img alt="Next.js 16" src="https://img.shields.io/badge/Next.js-16-111111?style=for-the-badge&logo=nextdotjs&logoColor=white" />
  <img alt="React 19" src="https://img.shields.io/badge/React-19-149eca?style=for-the-badge&logo=react&logoColor=white" />
  <img alt="TypeScript" src="https://img.shields.io/badge/TypeScript-5-3178c6?style=for-the-badge&logo=typescript&logoColor=white" />
  <img alt="Tailwind v4" src="https://img.shields.io/badge/Tailwind-v4-38bdf8?style=for-the-badge&logo=tailwindcss&logoColor=white" />
  <img alt="pnpm 10" src="https://img.shields.io/badge/pnpm-10-f69220?style=for-the-badge&logo=pnpm&logoColor=white" />
</p>

<p>
  <img alt="Vercel deployment" src="https://img.shields.io/github/deployments/noluyorAbi/project-cscw/Production?style=flat-square&label=vercel&logo=vercel&logoColor=white" />
  <img alt="CI" src="https://img.shields.io/github/actions/workflow/status/noluyorAbi/project-cscw/ci.yml?branch=main&style=flat-square&label=CI&logo=githubactions&logoColor=white" />
  <img alt="Last commit" src="https://img.shields.io/github/last-commit/noluyorAbi/project-cscw?style=flat-square&label=updated" />
  <img alt="License" src="https://img.shields.io/badge/license-academic-lightgrey?style=flat-square" />
</p>

</div>

<hr/>

## What it is

A working proof-of-concept that realises the <em>ORBIT</em> &mdash; "Your Final Idea" &mdash; canvas: a phone messenger that transmits the sender&apos;s detected facial expression with every message, plus an opt-in heart-rate signal estimated from the camera feed.

It exists to make three lecture themes <em>tangible</em>, not just discussable:

<table>
<tr>
<td width="33%" valign="top">

### Ambient computing
<sub>Weiser, 1991</sub>

The interface fades. The signal &mdash; a face, a pulse &mdash; arrives without ceremony, in the corner of the screen.

</td>
<td width="33%" valign="top">

### Affective channel
<sub>Bush, 1945</sub>

Pure text strips emotional bandwidth. A thin, legible cue restores some of it, without pretending to read minds.

</td>
<td width="33%" valign="top">

### Responsible design
<sub>&Ouml;AW Digital Ethics, 2024</sub>

Consent is the default, not an afterthought. Every channel is switchable, every reading is local, no data leaves the device.

</td>
</tr>
</table>

> "The human mind operates by association. With one item in its grasp, it snaps instantly to the next." &mdash; <em>Vannevar Bush, As We May Think, 1945</em>

<hr/>

## Quick start

```bash
pnpm install
pnpm dev        # http://localhost:3000
pnpm test       # vitest
pnpm build
```

Requires <strong>Node 24</strong> and <strong>pnpm 10</strong>. Camera permission is needed for the live expression and pulse channels; with the camera off, the slider inside the iPhone shell simulates the sensor for offline demos.

<hr/>

## Routes

<table>
  <thead>
    <tr>
      <th align="left">Path</th>
      <th align="left">What it shows</th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <td><code>/</code></td>
      <td>Landing hero, three-step explainer, and the chat inside an iPhone shell.</td>
    </tr>
    <tr>
      <td><code>/idea</code></td>
      <td>Reconstructed ORBIT canvas; items tagged <code>BUILT</code> or <code>ADDRESSED IN POC</code>.</td>
    </tr>
    <tr>
      <td><code>/about</code></td>
      <td>Methodology, course readings, ethics levers, and honest limitations.</td>
    </tr>
    <tr>
      <td><code>*</code></td>
      <td>Branded 404 with the shared navigation.</td>
    </tr>
  </tbody>
</table>

A shared <code>SiteNav</code> (<kbd>CHAT</kbd> &middot; <kbd>CANVAS</kbd> &middot; <kbd>ABOUT</kbd>) is mounted on every route.

<hr/>

## How it works

<details>
<summary><b>Expression detection</b> &mdash; on-device, no server round-trip</summary>

<br/>

- <a href="https://github.com/vladmandic/face-api">@vladmandic/face-api</a> with <code>TinyFaceDetector</code> + <code>FaceExpressionNet</code>.
- Weights are served from <code>public/models/</code> (~520 KB total).
- A short rolling buffer is collapsed into a majority vote so a single bad frame never flips the label.
- Output set: <code>happy</code> &middot; <code>calm</code> &middot; <code>neutral</code> &middot; <code>tense</code> &middot; <code>sad</code>.

</details>

<details>
<summary><b>Heart rate</b> &mdash; remote photoplethysmography (rPPG)</summary>

<br/>

- A forehead region of interest is derived from the face-api bounding box and sampled per video frame.
- Green-channel mean &rarr; detrended &rarr; normalised &rarr; autocorrelation over the physiological lag range (45&ndash;170 bpm).
- An exponential moving average smooths the estimate; a quality gate suppresses unreliable readings.
- Drives the on-screen heart icon, the partner <em>armband</em> beat, and <code>navigator.vibrate</code> haptics.

</details>

<details>
<summary><b>Capture flow</b> &mdash; what happens when you hit send</summary>

<br/>

1. The user types a message and chooses <kbd>SHARE FACE</kbd> or <kbd>TEXT ONLY</kbd>.
2. With <em>SHARE FACE</em>, the camera opens automatically.
3. A one-second "look at the camera" countdown plays inside the iPhone preview.
4. A flash frame fires, the still is captured, and the message is sent.
5. The receiver sees the message, the detected expression, the still, and (if pulse is on) the bpm + armband beat.

</details>

<details>
<summary><b>Privacy &amp; persistence</b></summary>

<br/>

- First camera use is gated by an on-device consent dialog.
- Preferences, chat history, and consent decisions persist to <code>localStorage</code>.
- Photos are <em>stripped</em> before persisting; only the last 60 messages are kept, to stay safely under quota.
- The conversation can be exported as JSON from the chat header.

</details>

<details>
<summary><b>Accessibility</b></summary>

<br/>

- <code>prefers-reduced-motion</code> disables the heart and armband animations system-wide.
- The message log uses <code>role="log"</code> with <code>aria-live="polite"</code>.
- Screen-reader-only summaries describe each message&apos;s expression and pulse state.

</details>

<hr/>

## Stack

<table>
<tr>
<td valign="top">

<strong>Framework</strong><br/>
Next.js 16 (App Router &middot; Turbopack)<br/>
React 19 &middot; TypeScript 5

</td>
<td valign="top">

<strong>Styling</strong><br/>
Tailwind CSS v4<br/>
Helvetica + JetBrains Mono<br/>
lucide-react &middot; shadcn/ui

</td>
<td valign="top">

<strong>Sensing</strong><br/>
@vladmandic/face-api<br/>
Custom rPPG estimator<br/>
getUserMedia + canvas

</td>
<td valign="top">

<strong>Tooling</strong><br/>
Vitest &middot; ESLint<br/>
GitHub Actions CI<br/>
Vercel (production)

</td>
</tr>
</table>

<hr/>

## Project structure

```
src/
├── app/
│   ├── page.tsx              chat (state, capture, rPPG / detection loops)
│   ├── idea/page.tsx         ORBIT canvas
│   ├── about/page.tsx        methodology
│   ├── not-found.tsx         404
│   ├── opengraph-image.tsx   dynamic OG image
│   ├── layout.tsx            fonts, metadata, viewport
│   └── icon.svg              favicon
├── components/
│   ├── phone.tsx             IphoneShell · Armband · EmotionTimeline
│   ├── pulse.tsx             beating-heart bpm indicator
│   └── site-nav.tsx          shared nav
└── lib/
    ├── emotion.ts            model · expressions · replies
    ├── face.ts               face-api wrapper
    └── ppg.ts                rPPG estimator
```

<hr/>

## Academic context

<table>
  <tr>
    <td><strong>Bush, 1945</strong></td>
    <td><em>As We May Think</em> &mdash; the Memex framed as augmentation, not replacement.</td>
  </tr>
  <tr>
    <td><strong>Weiser, 1991</strong></td>
    <td><em>The computer for the 21st century</em> &mdash; calm, ambient technology.</td>
  </tr>
  <tr>
    <td><strong>&Ouml;AW, 2024</strong></td>
    <td>Digital Ethics report &mdash; consent, dignity, opt-in by default.</td>
  </tr>
</table>

<hr/>

## Honest limitations

- The expression label is a <em>cue</em>, not ground truth. A five-frame vote masks but does not eliminate model noise.
- rPPG accuracy degrades with low light, motion, dark skin tones, makeup, and webcam compression. The quality gate hides the most untrustworthy readings &mdash; it does not fix them.
- There is no multi-device transport. The "partner" is simulated locally; this is a UX demo, not a working chat backend.
- This is a course project. Not a product. Not medical-grade. Not a substitute for asking how someone feels.

<hr/>

## Tooling notes

<code>ruvnet/ruflo</code> is wired as <em>repo dev tooling only</em> (<code>.mcp.json</code>, <code>.claude/</code>) and is not a runtime dependency. The deployed bundle contains no ruflo code.

<hr/>

## Author

<table>
<tr>
<td valign="top">
<a href="https://github.com/noluyorAbi"><img src="https://github.com/noluyorAbi.png" width="64" height="64" alt="" /></a>
</td>
<td valign="top">

<strong>Alperen Adatepe</strong><br/>
<a href="https://github.com/noluyorAbi">github.com/noluyorAbi</a> &middot; <a href="https://github.com/noluyorAbi/project-cscw">project-cscw</a>

</td>
</tr>
</table>

## License

Academic coursework, LMU Munich SoSe 2026. License: TBD.

<div align="center">

<sub>Built for <em>Mensch&ndash;Maschine&ndash;Interaktion 2</em> &middot; Prof. Dr. Albrecht Schmidt &middot; Media Informatics Group &middot; LMU Munich</sub>

</div>
