"use client";

import { useState } from "react";
import type { SiteSettings, PrescriptionConfig, PrescriptionTemplate } from "@/lib/types";
import { saveSettingsAction } from "@/app/admin/actions";
import { Section, TextField, AddButton } from "@/components/admin/fields";
import InvestigationList from "@/components/admin/InvestigationList";
import PrescriptionTemplateEditor from "@/components/admin/PrescriptionTemplateEditor";

const TABS = [
  { id: "header", label: "Header" },
  { id: "footer", label: "Footer" },
  { id: "advices", label: "Advices" },
  { id: "diagnoses", label: "Diagnoses" },
  { id: "investigations", label: "Investigations" },
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
  const [openTemplateId, setOpenTemplateId] = useState<string | null>(null);

  function newTemplateId() {
    const g = globalThis as { crypto?: { randomUUID?: () => string } };
    return g.crypto?.randomUUID?.() ?? `tpl-${Math.random().toString(36).slice(2)}`;
  }
  function addTemplate() {
    const id = newTemplateId();
    setTemplates([
      ...templates,
      { id, name: "", diagnosis: "", ageGroup: "", medicines: [], advices: [] },
    ]);
    setOpenTemplateId(id);
  }
  function updateTemplate(id: string, t: PrescriptionTemplate) {
    setTemplates(templates.map((x) => (x.id === id ? t : x)));
  }
  function removeTemplate(id: string) {
    setTemplates(templates.filter((x) => x.id !== id));
    if (openTemplateId === id) setOpenTemplateId(null);
  }

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

      {/* INVESTIGATIONS */}
      {tab === "investigations" && (
        <div className="space-y-6">
          <Section title="Investigations" description="Common tests/investigations available for autocomplete when writing prescriptions. New ones added during consultations are auto-saved here.">
            <InvestigationList />
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
          <Section
            title="Prescription Templates"
            description="Create disease-based templates of medicines + advices. When writing a consultation, entering a matching diagnosis (for the patient's age group) auto-fills these. Templates are also auto-learned from saved consultations."
          >
            <div className="mb-2">
              <AddButton label="New template" onClick={addTemplate} />
            </div>

            {templates.length === 0 && (
              <p className="text-sm text-muted">
                No templates yet. Click &ldquo;New template&rdquo; to create one.
              </p>
            )}

            {templates.map((tpl) => {
              const isOpen = openTemplateId === tpl.id;
              return (
                <div
                  key={tpl.id}
                  className="overflow-hidden rounded-lg border border-slate-200 bg-white"
                >
                  <div className="flex items-center gap-3 px-4 py-3">
                    <button
                      type="button"
                      onClick={() => setOpenTemplateId(isOpen ? null : tpl.id)}
                      className="flex min-w-0 flex-1 items-center gap-2 text-left"
                    >
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        className={`h-4 w-4 shrink-0 text-slate-400 transition-transform ${isOpen ? "rotate-180" : ""}`}
                        aria-hidden="true"
                      >
                        <path d="m6 9 6 6 6-6" />
                      </svg>
                      <div className="min-w-0">
                        <p className="truncate text-sm font-semibold text-ink">
                          {tpl.name || tpl.diagnosis || "Untitled template"}
                        </p>
                        <p className="mt-0.5 truncate text-xs text-muted">
                          {tpl.diagnosis || "no diagnosis"} · {tpl.ageGroup || "Any age"} ·{" "}
                          {tpl.medicines.length} medicine{tpl.medicines.length !== 1 ? "s" : ""}
                          {" · "}
                          {tpl.advices.length} advice{tpl.advices.length !== 1 ? "s" : ""}
                        </p>
                      </div>
                    </button>
                    <button
                      type="button"
                      onClick={() => removeTemplate(tpl.id)}
                      className="shrink-0 text-xs font-medium text-red-600 hover:underline"
                    >
                      Delete
                    </button>
                  </div>
                  {isOpen && (
                    <div className="border-t border-slate-100 p-4">
                      <PrescriptionTemplateEditor
                        value={tpl}
                        onChange={(t) => updateTemplate(tpl.id, t)}
                        diagnosisSuggestions={p.predefinedDiagnoses}
                        adviceSuggestions={p.predefinedAdvices}
                      />
                    </div>
                  )}
                </div>
              );
            })}
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
