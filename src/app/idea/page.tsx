import Link from "next/link";

const cyan = "rounded-sm bg-cyan-300/80 px-3 py-2 text-xs leading-snug text-zinc-900 shadow";
const lime = "rounded-sm bg-lime-300/80 px-3 py-2 text-xs leading-snug text-zinc-900 shadow";

function Col({ title, subtitle, children }: { title: string; subtitle: string; children: React.ReactNode }) {
  return (
    <section className="flex min-w-[15rem] flex-1 flex-col">
      <header className="rounded-t-sm bg-zinc-900 py-2 text-center font-mono text-sm tracking-wide text-white">
        {title}
      </header>
      <div className="flex flex-1 flex-col gap-5 bg-zinc-200/70 p-4">
        <p className="text-center font-mono text-[11px] text-zinc-600">{subtitle}</p>
        {children}
      </div>
    </section>
  );
}

function Block({ heading, sub, children }: { heading: string; sub?: string; children: React.ReactNode }) {
  return (
    <div className="rounded-sm bg-zinc-300/60 p-3">
      <p className="font-mono text-sm font-bold">
        {heading} {sub && <span className="font-normal text-zinc-600">{sub}</span>}
      </p>
      <div className="mt-2 flex flex-wrap gap-2">{children}</div>
    </div>
  );
}

const Arrow = () => (
  <div className="hidden self-center text-cyan-500 lg:block" aria-hidden>
    ▶
  </div>
);

export default function IdeaCanvas() {
  return (
    <main className="flex-1 bg-white">
      <div className="bg-[#11385f] py-6 text-center font-mono text-3xl font-bold text-white">
        Your Final Idea
      </div>

      <div className="mx-auto max-w-6xl px-6 py-8">
        <div className="mb-6 flex items-end justify-between">
          <h1 className="font-mono text-2xl font-bold">Emotion-Aware Chat</h1>
          <Link href="/" className="font-mono text-sm text-zinc-400 hover:text-zinc-700">
            ← open the PoC
          </Link>
        </div>

        <div className="mb-6 flex flex-col gap-4 lg:flex-row">
          <div className="flex-1 bg-cyan-100 p-4">
            <p className="font-mono text-[11px] text-zinc-600">Elevator Pitch</p>
            <p className="mt-1 text-lg">
              sends a picture with each message (to detect facial expression of sender)
            </p>
          </div>
          <div className="bg-cyan-100 p-4 text-center lg:w-56">
            <p className="font-mono text-[11px] text-zinc-600">Target group</p>
            <p className="mt-3 rounded bg-white px-3 py-4 text-sm">anyone with a phone</p>
          </div>
        </div>

        <div className="flex flex-col gap-3 lg:flex-row">
          <Col title="Problem" subtitle="Which major (user) pains are being adressed?">
            <div className={cyan}>Uncertainty about emotional state of other person</div>
            <div className={cyan}>lacking communication over text, no emotions expressed</div>
            <p className="mt-2 text-center font-mono text-[11px] text-zinc-600">Why do we care?</p>
            <div className={cyan}>
              stress level → heartrate sent to other person
            </div>
          </Col>

          <Arrow />

          <Col title="Solution" subtitle="What / How / Where">
            <Block heading="What?" sub="What is your solution / concept?">
              <div className={cyan}>send face with each text message (both cameras)</div>
              <div className={cyan}>bpm next to message</div>
            </Block>
            <Block heading="How?" sub="Tools, technologies, functionalities…">
              <div className={cyan}>phone camera</div>
              <div className={cyan}>messaging app — chat (whatsapp)</div>
              <div className={cyan}>other person wears an armband that pulses your heartrate</div>
            </Block>
            <Block heading="Where and when?" sub="What is the context?">
              <div className={cyan}>when sending a message</div>
            </Block>
          </Col>

          <Arrow />

          <Col title="Solution" subtitle="Implications">
            <Block heading="Privacy Implications">
              <div className={cyan}>2 cameras on → no control</div>
            </Block>
            <Block heading="Accessibility Implications">
              <div className={cyan}>ability to use phone</div>
              <div className={cyan}>limited by visual cues</div>
            </Block>
            <Block heading="Ethical Implications">
              <div className={cyan}>privacy</div>
            </Block>
          </Col>

          <Arrow />

          <Col title="Benefits" subtitle="How will users benefit from your solution?">
            <div className={lime}>more information on emotional state</div>
            <div className={lime}>interhuman connections</div>
          </Col>
        </div>

        <p className="mt-6 text-right font-mono text-[11px] text-zinc-400">
          Developed by ORBIT Ventures · reconstructed for MMI2 SS26
        </p>
      </div>
    </main>
  );
}
