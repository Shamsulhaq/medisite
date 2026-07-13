"use client";

/**
 * PaymentSettingsForm — manages fee structure settings only.
 * Simple number fields for firstVisit, within7Days, within30Days, after30Days.
 */

import { useState } from "react";
import type { SiteSettings } from "@/lib/types";
import { saveSettingsAction } from "@/app/admin/actions";
import { Section, TextField } from "@/components/admin/fields";
import ButtonSpinner from "@/components/admin/ButtonSpinner";

export default function PaymentSettingsForm({ initial }: { initial: SiteSettings }) {
  const [fees, setFees] = useState(initial.feeStructure);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const patch = (updates: Partial<typeof fees>) =>
    setFees((prev) => ({ ...prev, ...updates }));

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setMessage(null);

    const payload: SiteSettings = { ...initial, feeStructure: fees };
    const res = await saveSettingsAction(payload);
    setSaving(false);
    if (res.ok) {
      setMessage({ type: "success", text: "Payment settings saved." });
      window.scrollTo({ top: 0, behavior: "smooth" });
    } else {
      setMessage({ type: "error", text: res.error ?? "Failed to save." });
    }
  }

  return (
    <form onSubmit={handleSave} className="space-y-6 pb-24">
      <Section
        title="Fee Structure"
        description="Configure consultation fees based on visit frequency. These will be auto-suggested when creating a consultation."
      >
        <div className="grid gap-4 sm:grid-cols-2">
          <TextField
            label="First Visit (৳)"
            value={String(fees.firstVisit)}
            onChange={(v) => patch({ firstVisit: Number(v) || 0 })}
            placeholder="500"
          />
          <TextField
            label="Within 7 Days (৳)"
            value={String(fees.within7Days)}
            onChange={(v) => patch({ within7Days: Number(v) || 0 })}
            placeholder="300"
          />
          <TextField
            label="Within 30 Days (৳)"
            value={String(fees.within30Days)}
            onChange={(v) => patch({ within30Days: Number(v) || 0 })}
            placeholder="200"
          />
          <TextField
            label="After 30 Days (৳)"
            value={String(fees.after30Days)}
            onChange={(v) => patch({ after30Days: Number(v) || 0 })}
            placeholder="500"
          />
        </div>
      </Section>

      {/* Status message */}
      {message && (
        <div className={`rounded-lg p-3 text-sm ${message.type === "success" ? "bg-green-50 text-green-700" : "bg-red-50 text-red-700"}`}>
          {message.text}
        </div>
      )}

      {/* Sticky save bar */}
      <div className="fixed inset-x-0 bottom-0 z-40 border-t border-slate-200 bg-white/95 backdrop-blur md:left-64">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-3 sm:px-6">
          <div className="text-sm text-muted">Consultation fee structure.</div>
          <button
            type="submit"
            disabled={saving}
            className="inline-flex items-center gap-2 rounded-full bg-brand px-6 py-2.5 text-sm font-semibold text-white transition hover:bg-brand-dark disabled:cursor-not-allowed disabled:opacity-50"
          >
            {saving && <ButtonSpinner />}
            {saving ? "Saving…" : "Save Payment Settings"}
          </button>
        </div>
      </div>
    </form>
  );
}
