"use client";

/**
 * EmailSettingsForm — manages SMTP / email configuration only.
 * Receives the full SiteSettings to merge changes on save.
 */

import { useState } from "react";
import type { SiteSettings, EmailConfig } from "@/lib/types";
import { saveSettingsAction } from "@/app/admin/actions";
import { Section, TextField } from "@/components/admin/fields";
import ButtonSpinner from "@/components/admin/ButtonSpinner";

export default function EmailSettingsForm({ initial }: { initial: SiteSettings }) {
  const [email, setEmail] = useState<EmailConfig>(initial.email);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const patch = (updates: Partial<EmailConfig>) =>
    setEmail((prev) => ({ ...prev, ...updates }));

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setMessage(null);

    const payload: SiteSettings = { ...initial, email };
    const res = await saveSettingsAction(payload);
    setSaving(false);
    if (res.ok) {
      setMessage({ type: "success", text: "Email settings saved." });
      window.scrollTo({ top: 0, behavior: "smooth" });
    } else {
      setMessage({ type: "error", text: res.error ?? "Failed to save." });
    }
  }

  return (
    <form onSubmit={handleSave} className="space-y-6 pb-24">
      <Section
        title="Email (SMTP)"
        description="Configure outgoing email for sending prescriptions. Use your email provider's SMTP credentials."
      >
        {/* Enable toggle */}
        <label className="flex items-center gap-3 rounded-lg border border-slate-200 bg-slate-50 p-3">
          <input
            type="checkbox"
            checked={email.enabled}
            onChange={(e) => patch({ enabled: e.target.checked })}
            className="h-4 w-4 rounded border-slate-300 text-brand focus:ring-brand"
          />
          <span className="text-sm font-medium text-ink">Email sending enabled</span>
        </label>

        {email.enabled && (
          <>
            <div className="grid gap-4 sm:grid-cols-2">
              <TextField
                label="SMTP Host"
                value={email.host}
                onChange={(v) => patch({ host: v })}
                placeholder="smtp.gmail.com"
              />
              <TextField
                label="Port"
                value={String(email.port)}
                onChange={(v) => patch({ port: Number(v) || 587 })}
                placeholder="587"
              />
              <TextField
                label="Username / Email"
                value={email.user}
                onChange={(v) => patch({ user: v })}
                placeholder="your@gmail.com"
              />
              <TextField
                label="Password / App Password"
                value={email.pass}
                onChange={(v) => patch({ pass: v })}
                placeholder="••••••••"
                type="password"
              />
            </div>

            {/* Secure toggle */}
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={email.secure}
                onChange={(e) => patch({ secure: e.target.checked })}
                className="h-4 w-4 rounded border-slate-300 text-brand focus:ring-brand"
              />
              <span className="text-sm text-ink">Use SSL/TLS (port 465)</span>
            </label>

            <TextField
              label="From (display name + address)"
              value={email.from}
              onChange={(v) => patch({ from: v })}
              placeholder={'"Dr. Mahmud" <noreply@drmahmud.com>'}
            />
          </>
        )}
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
          <div className="text-sm text-muted">Email / SMTP configuration.</div>
          <button
            type="submit"
            disabled={saving}
            className="inline-flex items-center gap-2 rounded-full bg-brand px-6 py-2.5 text-sm font-semibold text-white transition hover:bg-brand-dark disabled:cursor-not-allowed disabled:opacity-50"
          >
            {saving && <ButtonSpinner />}
            {saving ? "Saving…" : "Save Email Settings"}
          </button>
        </div>
      </div>
    </form>
  );
}
