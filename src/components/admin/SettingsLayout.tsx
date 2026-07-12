"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";

type SectionItem = {
  id: string;
  label: string;
  href: string;
};

export default function SettingsLayout({
  sections,
  active,
  children,
}: {
  sections: SectionItem[];
  active: string;
  children: React.ReactNode;
}) {
  const router = useRouter();

  return (
    <div className="flex min-h-[calc(100dvh-8rem)] gap-0">
      {/* Left sidebar — desktop */}
      <nav className="hidden w-[200px] shrink-0 border-r border-slate-200 pr-4 md:block">
        <ul className="sticky top-20 space-y-1">
          {sections.map((s) => (
            <li key={s.id}>
              <Link
                href={s.href}
                className={`block rounded-lg px-3 py-2 text-sm font-medium transition ${
                  active === s.id
                    ? "bg-brand text-white shadow-sm"
                    : "text-muted hover:bg-slate-100 hover:text-ink"
                }`}
              >
                {s.label}
              </Link>
            </li>
          ))}
        </ul>
      </nav>

      {/* Mobile dropdown selector */}
      <div className="mb-4 w-full md:hidden">
        <select
          value={active}
          onChange={(e) => {
            const section = sections.find((s) => s.id === e.target.value);
            if (section) router.push(section.href);
          }}
          className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm font-medium text-ink outline-none transition focus:border-brand focus:ring-2 focus:ring-brand/20"
        >
          {sections.map((s) => (
            <option key={s.id} value={s.id}>
              {s.label}
            </option>
          ))}
        </select>
      </div>

      {/* Right content area */}
      <div className="min-w-0 flex-1 md:pl-6">
        {children}
      </div>
    </div>
  );
}
