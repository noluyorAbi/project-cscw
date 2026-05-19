import Link from "next/link";

const mono = "font-[family-name:var(--font-geist-mono)]";

type Route = "chat" | "canvas" | "about";

const ITEMS: { key: Route; label: string; href: string }[] = [
  { key: "chat", label: "CHAT", href: "/" },
  { key: "canvas", label: "CANVAS", href: "/idea" },
  { key: "about", label: "ABOUT", href: "/about" },
];

/** Shared top nav. The current route renders as a static active pill. */
export function SiteNav({ active }: { active?: Route }) {
  return (
    <nav className={`flex gap-2 text-[12px] ${mono}`}>
      {ITEMS.map((it) =>
        it.key === active ? (
          <span
            key={it.key}
            aria-current="page"
            className="rounded-lg border border-zinc-900 bg-zinc-900 px-3 py-2 font-medium text-white"
          >
            {it.label}
          </span>
        ) : (
          <Link
            key={it.key}
            href={it.href}
            className="rounded-lg border border-zinc-200 px-3 py-2 text-zinc-600 hover:border-zinc-900 hover:text-zinc-900"
          >
            {it.label}
          </Link>
        ),
      )}
    </nav>
  );
}
