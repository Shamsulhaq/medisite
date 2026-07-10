"use client";

import { useState } from "react";
import type { SiteSettings, AppointmentConfig } from "@/lib/types";
import { saveSettingsAction } from "@/app/admin/actions";
import { Section } from "@/components/admin/fields";
import AppointmentConfigEditor from "@/components/admin/AppointmentConfigEditor";

export default function AppointmentSettingsForm({
  initial,
}: {
  initial: SiteSettings;
}) {
  const [enabled, setEnabled] = useState(initial.appointmentsEnabled);
  const [appointment, setAppointment] = useState<AppointmentConfig>(
    initial.appointment
  );
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setMessage(null);
    const res = await saveSettingsAction({
      ...initial,
      appointmentsEnabled: enabled,
      appointment,
    });
    setSaving(false);
    if (res.ok) {
      setMessage({ type: "success", text: "Appointment settings saved." });
      window.scrollTo({ top: 0, behavior: "smooth" });
    } else {
      setMessage({ type: "error", text: res.error ?? "Failed to save." });
    }
  }

  return (
    <form onSubmit={handleSave} className="space-y-6 pb-24">
      <Section
        title="Appointment Booking"
        description="Turn the public booking form on or off."
      >
        <label className="flex items-center gap-3 rounded-lg border border-slate-200 bg-slate-50 p-3">
          <input
            type="checkbox"
            checked={enabled}
            onChange={(e) => setEnabled(e.target.checked)}
            className="h-4 w-4 rounded border-slate-300 text-brand focus:ring-brand"
          />
          <span className="text-sm font-medium text-ink">
            Appointment booking enabled
            <span className="block text-xs font-normal text-muted">
              When off, the public booking form is replaced with a notice.
            </span>
          </span>
        </label>
      </Section>

      <AppointmentConfigEditor value={appointment} onChange={setAppointment} />

      {/* Sticky save bar */}
      <div className="fixed inset-x-0 bottom-0 z-40 border-t border-slate-200 bg-white/95 backdrop-blur md:left-64">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-3 sm:px-6">
          <div className="text-sm">
            {message ? (
              <span
                className={
                  message.type === "success"
                    ? "text-green-600"
                    : "text-red-600"
                }
              >
                {message.text}
              </span>
            ) : (
              <span className="text-muted">
                Manage chambers, online consultation, and schedules.
              </span>
            )}
          </div>
          <button
            type="submit"
            disabled={saving}
            className="rounded-full bg-brand px-6 py-2.5 text-sm font-semibold text-white transition hover:bg-brand-dark disabled:cursor-not-allowed disabled:opacity-60"
          >
            {saving ? "Saving..." : "Save Appointment Settings"}
          </button>
        </div>
      </div>
    </form>
  );
}
