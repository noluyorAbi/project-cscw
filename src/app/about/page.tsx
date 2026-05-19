import { SiteNav } from "@/components/site-nav";

const mono = "font-[family-name:var(--font-geist-mono)]";

export const metadata = {
  title: "About — Methodology & Ethics",
};

function Section({
  tag,
  title,
  children,
}: {
  tag: string;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="border-t border-zinc-200 py-8">
      <p className={`text-[10px] uppercase tracking-[0.25em] text-zinc-400 ${mono}`}>
        {tag}
      </p>
      <h2 className="mt-2 text-xl font-bold tracking-tight text-zinc-900">
        {title}
      </h2>
      <div className="mt-3 space-y-3 text-[15px] leading-relaxed text-zinc-700">
        {children}
      </div>
    </section>
  );
}

export default function About() {
  return (
    <main className="min-h-full flex-1 bg-white">
      <header className="border-b border-zinc-200">
        <div className="mx-auto flex max-w-3xl items-center justify-between px-6 py-5">
          <div>
            <p className={`text-[10px] uppercase tracking-[0.25em] text-zinc-400 ${mono}`}>
              MMI2 · CSCW · LMU Munich
            </p>
            <h1 className="mt-1 text-2xl font-bold tracking-tight text-zinc-900">
              Emotion-Aware Chat — About
            </h1>
          </div>
          <SiteNav active="about" />
        </div>
      </header>

      <article className="mx-auto max-w-3xl px-6 pb-16">
        <Section tag="Problem" title="Emotion is missing from text">
          <p>
            Text messaging strips the affective channel: the receiver cannot
            tell whether a terse reply is calm, stressed, or hurt. The ORBIT
            &ldquo;Your Final Idea&rdquo; canvas framed this as{" "}
            <em>uncertainty about the emotional state of the other person</em>.
            This project is a working proof of concept of that idea — and of
            the responsible-design controls the canvas itself lacked.
          </p>
        </Section>

        <Section tag="Foundations" title="Course readings it builds on">
          <p>
            <strong>Bush (1945), As We May Think</strong> — the{" "}
            <em>memex</em> as an intimate, user-owned record; reflected here in
            local-first persistence and one-tap conversation export (your data,
            your machine).
          </p>
          <p>
            <strong>Weiser (1991), The Computer for the 21st Century</strong> —
            calm, embedded sensing; also Weiser&apos;s own warning about
            ubiquitous capture, which motivates the explicit on/off controls.
          </p>
          <p>
            <strong>ÖAW, Narratives of Digital Ethics</strong> — situated,
            non-universal ethics; the privacy/consent levers are design
            choices, not a disclaimer bolted on afterwards.
          </p>
        </Section>

        <Section tag="Method" title="How the signal is produced">
          <p>
            <strong>Facial expression</strong> is read on-device with
            face-api.js (TinyFaceDetector + FaceExpressionNet); a 5-read
            majority vote stabilises the label. No frames leave the browser.
          </p>
          <p>
            <strong>Heart rate</strong> is estimated by remote
            photoplethysmography (rPPG): the green channel of a forehead ROI is
            sampled per animation frame and the dominant beat frequency found
            by autocorrelation. It is opt-in and off by default.
          </p>
          <p>
            With the camera off, a slider simulates the sensor so the
            interaction can be demonstrated without a webcam.
          </p>
        </Section>

        <Section tag="Ethics" title="Responsible-design levers">
          <p>
            First camera use is gated by an on-device consent dialog. PRIVATE
            mode sends text only. Heart-rate sharing is off until explicitly
            enabled and, once off, is suppressed everywhere — logic and
            rendering, including already-sent messages. Reduced-motion and
            screen-reader summaries address the canvas&apos;s own
            &ldquo;limited by visual cues&rdquo; accessibility note.
          </p>
        </Section>

        <Section tag="Limitations" title="What this PoC does not claim">
          <p>
            rPPG from a laptop webcam is noisy and light-sensitive — a
            plausibility demo, not a medical measurement. Expression models
            carry known demographic bias. The peer (&ldquo;Mara&rdquo;) is
            simulated. These limits are the point: the artefact exists to make
            the trade-offs discussable, in the spirit of the digital-ethics
            reading.
          </p>
        </Section>

        <p className={`mt-10 text-[11px] text-zinc-400 ${mono}`}>
          Alperen Adatepe ·{" "}
          <a
            href="https://github.com/noluyorAbi/project-cscw"
            className="underline hover:text-zinc-700"
          >
            github.com/noluyorAbi/project-cscw
          </a>
        </p>
      </article>
    </main>
  );
}
