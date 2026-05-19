import { SiteNav } from "@/components/site-nav";

const mono = "font-[family-name:var(--font-geist-mono)]";

export const metadata = { title: "Not found" };

export default function NotFound() {
  return (
    <main className="flex flex-1 flex-col items-center justify-center gap-6 bg-white px-6 py-20 text-center [background-image:radial-gradient(ellipse_at_50%_0,#f4f4f5,#fff_60%)]">
      <p className={`text-[10px] uppercase tracking-[0.25em] text-zinc-400 ${mono}`}>
        MMI2 · CSCW · 404
      </p>
      <h1 className="text-4xl font-bold tracking-tight text-zinc-900">
        Page not found
      </h1>
      <p className="max-w-sm text-[15px] text-zinc-500">
        That route doesn&apos;t exist. Head back to the emotion-aware chat.
      </p>
      <SiteNav />
    </main>
  );
}
