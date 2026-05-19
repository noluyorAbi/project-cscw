import Link from "next/link";

const mono = "font-[family-name:var(--font-geist-mono)]";

function Note({ children, tag }: { children: React.ReactNode; tag?: "BUILT" | "ADDRESSED" }) {
  return (
    <div className="relative rounded-md border border-zinc-200 bg-zinc-50 px-3 py-2 text-[13px] leading-snug text-zinc-900">
      {children}
      {tag && (
        <span
          className={`mt-1.5 inline-block rounded-full border px-1.5 py-0.5 text-[9px] font-medium tracking-wide ${mono} ${
            tag === "BUILT"
              ? "border-emerald-300 bg-emerald-50 text-emerald-700"
              : "border-zinc-300 bg-white text-zinc-500"
          }`}
        >
          {tag} IN POC
        </span>
      )}
    </div>
  );
}

function Col({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle: string;
  children: React.ReactNode;
}) {
  return (
    <section className="flex min-w-[15rem] flex-1 flex-col overflow-hidden rounded-xl border border-zinc-200">
      <header className="border-b border-zinc-200 bg-zinc-900 px-4 py-2.5">
        <p className={`text-center text-[13px] uppercase tracking-[0.18em] text-white ${mono}`}>
          {title}
        </p>
      </header>
      <div className="flex flex-1 flex-col gap-4 bg-white p-4">
        <p className={`text-center text-[11px] text-zinc-400 ${mono}`}>{subtitle}</p>
        {children}
      </div>
    </section>
  );
}

function Block({
  heading,
  sub,
  children,
}: {
  heading: string;
  sub?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-lg bg-zinc-100/70 p-3">
      <p className={`text-[12px] font-semibold text-zinc-900 ${mono}`}>
        {heading}{" "}
        {sub && <span className="font-normal text-zinc-400">{sub}</span>}
      </p>
      <div className="mt-2 flex flex-col gap-2">{children}</div>
    </div>
  );
}

const Arrow = () => (
  <div className="hidden items-center self-center text-zinc-300 lg:flex" aria-hidden>
    →
  </div>
);

export default function IdeaCanvas() {
  return (
    <main className="min-h-full flex-1 bg-white">
      <header className="border-b border-zinc-200">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-5">
          <div>
            <p className={`text-[10px] uppercase tracking-[0.25em] text-zinc-400 ${mono}`}>
              MMI2 · CSCW · Your Final Idea
            </p>
            <h1 className="mt-1 text-2xl font-bold tracking-tight text-zinc-900">
              Emotion-Aware Chat
            </h1>
          </div>
          <nav className={`flex gap-2 text-[12px] ${mono}`}>
            <Link
              href="/about"
              className="rounded-lg border border-zinc-200 px-3 py-2 text-zinc-600 hover:border-zinc-900 hover:text-zinc-900"
            >
              ABOUT
            </Link>
            <Link
              href="/"
              className="rounded-lg border border-zinc-900 bg-zinc-900 px-3 py-2 font-medium text-white"
            >
              OPEN THE POC →
            </Link>
          </nav>
        </div>
      </header>

      <div className="mx-auto max-w-6xl px-6 py-8">
        <div className="mb-6 flex flex-col gap-4 lg:flex-row">
          <div className="flex-1 rounded-xl border border-zinc-200 p-4">
            <p className={`text-[10px] uppercase tracking-[0.18em] text-zinc-400 ${mono}`}>
              Elevator Pitch
            </p>
            <p className="mt-2 text-lg text-zinc-900">
              sends a picture with each message (to detect facial expression of
              sender)
            </p>
          </div>
          <div className="rounded-xl border border-zinc-200 p-4 text-center lg:w-60">
            <p className={`text-[10px] uppercase tracking-[0.18em] text-zinc-400 ${mono}`}>
              Target group
            </p>
            <p className="mt-3 rounded-lg bg-zinc-50 px-3 py-4 text-sm text-zinc-900">
              anyone with a phone
            </p>
          </div>
        </div>

        <div className="flex flex-col gap-3 lg:flex-row">
          <Col title="Problem" subtitle="Which major (user) pains are being adressed?">
            <Note>Uncertainty about emotional state of other person</Note>
            <Note>lacking communication over text, no emotions expressed</Note>
            <p className={`mt-1 text-center text-[11px] text-zinc-400 ${mono}`}>
              Why do we care?
            </p>
            <Note tag="BUILT">stress level → heartrate sent to other person</Note>
          </Col>

          <Arrow />

          <Col title="Solution" subtitle="What / How / Where">
            <Block heading="What?" sub="What is your solution / concept?">
              <Note tag="BUILT">send face with each text message (both cameras)</Note>
              <Note tag="BUILT">bpm next to message</Note>
            </Block>
            <Block heading="How?" sub="Tools, technologies, functionalities…">
              <Note tag="BUILT">phone camera</Note>
              <Note tag="BUILT">messaging app — chat (whatsapp)</Note>
              <Note tag="BUILT">
                other person wears an armband that pulses your heartrate
              </Note>
            </Block>
            <Block heading="Where and when?" sub="What is the context?">
              <Note tag="BUILT">when sending a message</Note>
            </Block>
          </Col>

          <Arrow />

          <Col title="Solution" subtitle="Implications">
            <Block heading="Privacy Implications">
              <Note tag="ADDRESSED">2 cameras on → no control</Note>
            </Block>
            <Block heading="Accessibility Implications">
              <Note>ability to use phone</Note>
              <Note tag="ADDRESSED">limited by visual cues</Note>
            </Block>
            <Block heading="Ethical Implications">
              <Note tag="ADDRESSED">privacy</Note>
            </Block>
          </Col>

          <Arrow />

          <Col title="Benefits" subtitle="How will users benefit from your solution?">
            <Note tag="BUILT">more information on emotional state</Note>
            <Note>interhuman connections</Note>
          </Col>
        </div>

        <p className={`mt-6 text-right text-[11px] text-zinc-400 ${mono}`}>
          Developed by ORBIT Ventures · reconstructed for MMI2 SS26 · tags map
          canvas items to the working PoC
        </p>
      </div>
    </main>
  );
}
