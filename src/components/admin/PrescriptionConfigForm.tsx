"use client";

import { useState } from "react";
import type { SiteSettings, PrescriptionConfig, PrescriptionTemplate } from "@/lib/types";
import { saveSettingsAction } from "@/app/admin/actions";
import { Section, TextField, AddButton } from "@/components/admin/fields";

const TABS = [
  { id: "header", label: "Header" },
  { id: "footer", label: "Footer" },
  { id: "advices", label: "Advices" },
  { id: "diagnoses", label: "Diagnoses" },
  { id: "timing", label: "Timing" },
  { id: "followup", label: "Follow-up" },
  { id: "templates", label: "Templates" },
] as const;
type TabId = (typeof TABS)[number]["id"];

const inputClass =
  "w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-ink outline-none transition focus:border-brand focus:ring-2 focus:ring-brand/20";

export default function PrescriptionConfigForm({
  initial,
}: {
  initial: SiteSettings;
}) {
  const [p, setP] = useState<PrescriptionConfig>(initial.prescription);
  const [templates, setTemplates] = useState<PrescriptionTemplate[]>(initial.prescriptionTemplates ?? []);
  const [tab, setTab] = useState<TabId>("header");
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState<{ type: "ok" | "err"; text: string } | null>(null);

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true); setMsg(null);
    const res = await saveSettingsAction({ ...initial, prescription: p, prescriptionTemplates: templates });
    setSaving(false);
    setMsg(res.ok ? { type: "ok", text: "Prescription configuration saved." } : { type: "err", text: res.error ?? "Failed." });
    if (res.ok) window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function editList(key: "predefinedAdvices" | "predefinedDiagnoses" | "timingOptions" | "followUpOptions", i: number, v: string) {
    setP({ ...p, [key]: p[key].map((x, idx) => (idx === i ? v : x)) });
  }
  function removeFromList(key: "predefinedAdvices" | "predefinedDiagnoses" | "timingOptions" | "followUpOptions", i: number) {
    setP({ ...p, [key]: p[key].filter((_, idx) => idx !== i) });
  }
  function addToList(key: "predefinedAdvices" | "predefinedDiagnoses" | "timingOptions" | "followUpOptions") {
    setP({ ...p, [key]: [...p[key], ""] });
  }
  function editHeaderLine(side: "leftLines" | "rightLines" | "contactLines", i: number, v: string) {
    setP({ ...p, header: { ...p.header, [side]: p.header[side].map((x, idx) => (idx === i ? v : x)) } });
  }
  function removeHeaderLine(side: "leftLines" | "rightLines" | "contactLines", i: number) {
    setP({ ...p, header: { ...p.header, [side]: p.header[side].filter((_, idx) => idx !== i) } });
  }
  function addHeaderLine(side: "leftLines" | "rightLines" | "contactLines") {
    setP({ ...p, header: { ...p.header, [side]: [...p.header[side], ""] } });
  }

  return (
    <form onSubmit={handleSave} className="pb-24">
      {/* Tabs */}
      <div className="sticky top-16 z-20 mb-6 flex gap-1 overflow-x-auto rounded-xl border border-slate-200 bg-white/95 p-1 shadow-sm backdrop-blur">
        {TABS.map((t) => (
          <button key={t.id} type="button" onClick={() => setTab(t.id)}
            className={`whitespace-nowrap rounded-lg px-4 py-2 text-sm font-medium transition ${
              tab === t.id ? "bg-brand text-white shadow-sm" : "text-muted hover:bg-slate-50 hover:text-ink"
            }`}>
            {t.label}
          </button>
        ))}
      </div>

      {/* HEADER */}
      {tab === "header" && (
        <div className="space-y-6">
          <Section title="Prescription Header — Left (Bengali)" description="Bengali lines shown on the left side of the printed prescription header.">
            {p.header.leftLines.map((line, i) => (
              <div key={i} className="flex items-center gap-2">
                <input value={line} onChange={(e) => editHeaderLine("leftLines", i, e.target.value)} className={inputClass} dir="auto" />
                <button type="button" onClick={() => removeHeaderLine("leftLines", i)} className="text-xs text-red-600 hover:underline">✕</button>
              </div>
            ))}
            <AddButton label="Add line" onClick={() => addHeaderLine("leftLines")} />
          </Section>

          <Section title="Prescription Header — Right (English)" description="English lines shown on the right side.">
            {p.header.rightLines.map((line, i) => (
              <div key={i} className="flex items-center gap-2">
                <input value={line} onChange={(e) => editHeaderLine("rightLines", i, e.target.value)} className={inputClass} />
                <button type="button" onClick={() => removeHeaderLine("rightLines", i)} className="text-xs text-red-600 hover:underline">✕</button>
              </div>
            ))}
            <AddButton label="Add line" onClick={() => addHeaderLine("rightLines")} />
          </Section>

          <Section title="Contact Info" description="Phone, email, reg. number etc. (shown below the header).">
            {p.header.contactLines.map((line, i) => (
              <div key={i} className="flex items-center gap-2">
                <input value={line} onChange={(e) => editHeaderLine("contactLines", i, e.target.value)} className={inputClass} />
                <button type="button" onClick={() => removeHeaderLine("contactLines", i)} className="text-xs text-red-600 hover:underline">✕</button>
              </div>
            ))}
            <AddButton label="Add line" onClick={() => addHeaderLine("contactLines")} />
          </Section>
        </div>
      )}

      {/* FOOTER */}
      {tab === "footer" && (
        <div className="space-y-6">
          <Section title="Prescription Footer" description="Text shown at the bottom of the printed prescription.">
            <TextField label="Left" value={p.footer.leftText} onChange={(v) => setP({ ...p, footer: { ...p.footer, leftText: v } })} placeholder="e.g. Patient ID shown automatically" />
            <TextField label="Center" value={p.footer.centerText} onChange={(v) => setP({ ...p, footer: { ...p.footer, centerText: v } })} placeholder="e.g. Generated digitally" />
            <TextField label="Right" value={p.footer.rightText} onChange={(v) => setP({ ...p, footer: { ...p.footer, rightText: v } })} placeholder="e.g. Doctor signature" />
          </Section>
        </div>
      )}

      {/* ADVICES */}
      {tab === "advices" && (
        <div className="space-y-6">
          <Section title="Pre-defined Advices" description="Common advices (Bengali/English) the doctor can quickly pick when writing a prescription. These grow automatically as the doctor adds new ones.">
            {p.predefinedAdvices.map((adv, i) => (
              <div key={i} className="flex items-center gap-2">
                <span className="text-xs text-muted w-6">{i + 1}.</span>
                <input value={adv} onChange={(e) => editList("predefinedAdvices", i, e.target.value)} className={inputClass} dir="auto" />
                <button type="button" onClick={() => removeFromList("predefinedAdvices", i)} className="text-xs text-red-600 hover:underline">✕</button>
              </div>
            ))}
            <AddButton label="Add advice" onClick={() => addToList("predefinedAdvices")} />
          </Section>
        </div>
      )}

      {/* DIAGNOSES */}
      {tab === "diagnoses" && (
        <div className="space-y-6">
          <Section title="Pre-defined Diagnoses" description="Common diagnoses that auto-suggest when the doctor types. These grow automatically as new diagnoses are entered.">
            {p.predefinedDiagnoses.map((dx, i) => (
              <div key={i} className="flex items-center gap-2">
                <span className="text-xs text-muted w-6">{i + 1}.</span>
                <input value={dx} onChange={(e) => editList("predefinedDiagnoses", i, e.target.value)} className={inputClass} />
                <button type="button" onClick={() => removeFromList("predefinedDiagnoses", i)} className="text-xs text-red-600 hover:underline">✕</button>
              </div>
            ))}
            <AddButton label="Add diagnosis" onClick={() => addToList("predefinedDiagnoses")} />
          </Section>
        </div>
      )}

      {/* TIMING */}
      {tab === "timing" && (
        <div className="space-y-6">
          <Section title="Timing Options" description="Options shown when entering medicine timing (e.g. খাওয়ার আগে, After meal).">
            {p.timingOptions.map((opt, i) => (
              <div key={i} className="flex items-center gap-2">
                <input value={opt} onChange={(e) => editList("timingOptions", i, e.target.value)} className={inputClass} dir="auto" />
                <button type="button" onClick={() => removeFromList("timingOptions", i)} className="text-xs text-red-600 hover:underline">✕</button>
              </div>
            ))}
            <AddButton label="Add timing option" onClick={() => addToList("timingOptions")} />
          </Section>
        </div>
      )}

      {/* FOLLOW-UP */}
      {tab === "followup" && (
        <div className="space-y-6">
          <Section title="Follow-up Options" description="Pre-defined follow-up options the doctor can pick (e.g. ৭ দিন পর, After 1 month).">
            {p.followUpOptions.map((opt, i) => (
              <div key={i} className="flex items-center gap-2">
                <input value={opt} onChange={(e) => editList("followUpOptions", i, e.target.value)} className={inputClass} dir="auto" />
                <button type="button" onClick={() => removeFromList("followUpOptions", i)} className="text-xs text-red-600 hover:underline">✕</button>
              </div>
            ))}
            <AddButton label="Add follow-up option" onClick={() => addToList("followUpOptions")} />
          </Section>
        </div>
      )}

      {/* TEMPLATES */}
      {tab === "templates" && (
        <div className="space-y-6">
          <Section title="Prescription Templates" description="Pre-saved combinations of medicines and advices. Templates can be loaded quickly when writing a consultation.">
            {templates.length === 0 && (
              <p className="text-sm text-muted">No templates saved yet. Save a template from a patient consultation to see it here.</p>
            )}
            {templates.map((tpl, i) => (
              <div key={tpl.id} className="rounded-lg border border-slate-200 bg-slate-50 p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-semibold text-ink">{tpl.name}</p>
                    <p className="mt-0.5 text-xs text-muted">
                      {tpl.medicines.length} medicine{tpl.medicines.length !== 1 ? "s" : ""} · {tpl.advices.length} advice{tpl.advices.length !== 1 ? "s" : ""}
                    </p>
                  </div>
                  <button type="button" onClick={() => setTemplates(templates.filter((_, idx) => idx !== i))}
                    className="text-xs font-medium text-red-600 hover:underline">Delete</button>
                </div>
                {tpl.medicines.length > 0 && (
                  <ul className="mt-2 space-y-0.5 text-xs text-muted">
                    {tpl.medicines.map((m, mi) => (
                      <li key={mi}>{m.form} {m.name} {m.dosage} — {m.frequency} {m.duration}</li>
                    ))}
                  </ul>
                )}
              </div>
            ))}
          </Section>
        </div>
      )}

      {/* Sticky save */}
      <div className="fixed inset-x-0 bottom-0 z-40 border-t border-slate-200 bg-white/95 backdrop-blur md:left-64">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-3 sm:px-6">
          <div className="text-sm">
            {msg ? (<span className={msg.type === "ok" ? "text-green-600" : "text-red-600"}>{msg.text}</span>) : (
              <span className="text-muted">Configure prescription layout and presets.</span>
            )}
          </div>
          <button type="submit" disabled={saving}
            className="rounded-full bg-brand px-6 py-2.5 text-sm font-semibold text-white transition hover:bg-brand-dark disabled:opacity-60">
            {saving ? "Saving..." : "Save Configuration"}
          </button>
        </div>
      </div>
    </form>
  );
}
