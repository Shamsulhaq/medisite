"use client";

import { useSearchParams, useRouter, usePathname } from "next/navigation";
import { useCallback } from "react";

const TABS = [
  { key: "consultations", label: "Consultations" },
  { key: "test-reports", label: "Test Reports" },
  { key: "vitals", label: "Vitals" },
  { key: "details", label: "Details" },
] as const;

type TabKey = (typeof TABS)[number]["key"];

export default function PatientPageTabs({
  consultationsContent,
  testReportsContent,
  vitalsContent,
  detailsContent,
}: {
  consultationsContent: React.ReactNode;
  testReportsContent: React.ReactNode;
  vitalsContent: React.ReactNode;
  detailsContent: React.ReactNode;
}) {
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();

  const activeTab = (searchParams.get("tab") as TabKey) || "consultations";

  const setTab = useCallback(
    (tab: TabKey) => {
      const params = new URLSearchParams(searchParams.toString());
      params.set("tab", tab);
      router.push(`${pathname}?${params.toString()}`, { scroll: false });
    },
    [searchParams, router, pathname]
  );

  return (
    <div>
      {/* Tab bar */}
      <div className="flex border-b border-slate-200 mb-6">
        {TABS.map((tab) => (
          <button
            key={tab.key}
            type="button"
            onClick={() => setTab(tab.key)}
            className={`px-4 py-2.5 text-sm font-medium transition border-b-2 -mb-px ${
              activeTab === tab.key
                ? "border-brand text-brand"
                : "border-transparent text-muted hover:text-ink hover:border-slate-300"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab content */}
      {activeTab === "consultations" && consultationsContent}
      {activeTab === "test-reports" && testReportsContent}
      {activeTab === "vitals" && vitalsContent}
      {activeTab === "details" && detailsContent}
    </div>
  );
}
