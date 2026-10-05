"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useMode } from "@/lib/store";

const TABS = [
  { href: "/", label: "Checkout demo" },
  { href: "/rules", label: "Rules" },
  { href: "/settings", label: "Settings" },
];

export function Logo() {
  return (
    <svg viewBox="0 0 24 24" className="h-7 w-7" aria-hidden>
      <path d="M12 2 3.5 5.5v6c0 5.2 3.6 9.4 8.5 10.5 4.9-1.1 8.5-5.3 8.5-10.5v-6L12 2Z" fill="#312e81" />
      <path d="m8 12.2 2.8 2.8L16.5 9.3" stroke="#a5b4fc" strokeWidth="2.2" fill="none" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export default function Nav() {
  const path = usePathname();
  const [mode] = useMode();
  return (
    <header className="sticky top-0 z-30 border-b border-stone-200 bg-white/90 backdrop-blur">
      <div className="mx-auto flex max-w-7xl items-center gap-6 px-4 py-3 sm:px-6">
        <Link href="/" className="flex items-center gap-2">
          <Logo />
          <span className="text-lg font-semibold tracking-tight">Briterion</span>
          <span className="hidden text-sm text-stone-400 sm:inline">Fraud decisioning</span>
        </Link>
        <nav className="flex gap-1 text-sm">
          {TABS.map((t) => (
            <Link
              key={t.href}
              href={t.href}
              className={`rounded-md px-3 py-1.5 ${
                path === t.href ? "bg-stone-900 text-white" : "text-stone-600 hover:bg-stone-100"
              }`}
            >
              {t.label}
            </Link>
          ))}
        </nav>
        <Link
          href="/settings"
          className={`ml-auto rounded-full px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wider ${
            mode === "live" ? "bg-emerald-100 text-emerald-800" : "bg-stone-100 text-stone-600"
          }`}
        >
          {mode === "live" ? "Live endpoint" : "Mock mode"}
        </Link>
      </div>
    </header>
  );
}
