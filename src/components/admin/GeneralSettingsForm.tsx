"use client";

/**
 * GeneralSettingsForm — manages general/site, doctor profile, contact, and social fields.
 * Only shows fields relevant to the "General" settings section.
 */

import { useState } from "react";
import type { SiteSettings } from "@/lib/types";
import { LOCALES, LOCALE_LABELS } from "@/lib/i18n";
import { saveSettingsAction } from "@/app/admin/actions";
import {
  Section,
  TextField,
  SelectField,
} from "@/components/admin/fields";
import { APPEARANCE_PRESETS, DEFAULT_APPEARANCE, FONT_OPTIONS, RADIUS_OPTIONS } from "@/lib/appearance-presets";
import type { SiteAppearance } from "@/lib/types";
import { LocalizedField, LocalizedArea } from "@/components/admin/LocalizedField";
import ImageUpload from "@/components/admin/ImageUpload";
import ButtonSpinner from "@/components/admin/ButtonSpinner";

export default function GeneralSettingsForm({ initial }: { initial: SiteSettings }) {
  const [s, setS] = useState<SiteSettings>(initial);
  const [keywordsText, setKeywordsText] = useState(initial.metaKeywords.join(", "));
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // Updaters scoped to each nested section
  const setTop = <K extends keyof SiteSettings>(k: K, v: SiteSettings[K]) =>
    setS((p) => ({ ...p, [k]: v }));
  const setDoctor = (patch: Partial<SiteSettings["doctor"]>) =>
    setS((p) => ({ ...p, doctor: { ...p.doctor, ...patch } }));
  const setContact = (patch: Partial<SiteSettings["contact"]>) =>
    setS((p) => ({ ...p, contact: { ...p.contact, ...patch } }));
  const setSocials = (patch: Partial<SiteSettings["socials"]>) =>
    setS((p) => ({ ...p, socials: { ...p.socials, ...patch } }));

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setMessage(null);

    const payload: SiteSettings = {
      ...s,
      metaKeywords: keywordsText
        .split(",")
        .map((k) => k.trim())
        .filter(Boolean),
    };

    const res = await saveSettingsAction(payload);
    setSaving(false);
    if (res.ok) {
      setMessage({ type: "success", text: "General settings saved." });
      window.scrollTo({ top: 0, behavior: "smooth" });
    } else {
      setMessage({ type: "error", text: res.error ?? "Failed to save." });
    }
  }

  return (
    <form onSubmit={handleSave} className="space-y-6 pb-24">
      {/* Language */}
      <Section title="Language" description="Default language shown to new visitors.">
        <SelectField
          label="Default Language"
          value={s.defaultLanguage}
          onChange={(v) => setTop("defaultLanguage", v as SiteSettings["defaultLanguage"])}
          options={LOCALES.map((l) => ({ value: l, label: LOCALE_LABELS[l] }))}
        />
      </Section>

      {/* SEO / Metadata */}
      <Section title="Site Metadata (SEO)" description="Browser title, search description, and keywords.">
        <LocalizedField label="Site Title" value={s.siteTitle} onChange={(v) => setTop("siteTitle", v)} />
        <LocalizedArea label="Meta Description" value={s.metaDescription} onChange={(v) => setTop("metaDescription", v)} rows={2} />
        <TextField label="Meta Keywords (comma-separated)" value={keywordsText} onChange={setKeywordsText} />
      </Section>

      {/* Branding */}
      <Section title="Branding">
        <LocalizedField label="Logo Text" value={s.logoText} onChange={(v) => setTop("logoText", v)} />
        <LocalizedField label="Logo Subtitle" value={s.logoSubtitle} onChange={(v) => setTop("logoSubtitle", v)} />
      </Section>

      {/* Doctor Profile */}
      <Section title="Doctor Profile">
        <ImageUpload
          label="Profile Photo"
          hint="Shown on the home hero and about page."
          value={s.doctor.photo ?? ""}
          onChange={(url) => setDoctor({ photo: url })}
          rounded
        />
        <LocalizedField label="Name" value={s.doctor.name} onChange={(v) => setDoctor({ name: v })} />
        <div className="grid gap-4 sm:grid-cols-2">
          <LocalizedField label="Title" value={s.doctor.title} onChange={(v) => setDoctor({ title: v })} />
          <LocalizedField label="Department" value={s.doctor.department} onChange={(v) => setDoctor({ department: v })} />
          <LocalizedField label="Hospital" value={s.doctor.hospital} onChange={(v) => setDoctor({ hospital: v })} />
          <LocalizedField label="Location" value={s.doctor.location} onChange={(v) => setDoctor({ location: v })} />
        </div>
        <TextField label="Hero Initials (fallback when no photo)" value={s.doctor.initials ?? ""} onChange={(v) => setDoctor({ initials: v })} />
        <LocalizedField label="Tagline" value={s.doctor.tagline} onChange={(v) => setDoctor({ tagline: v })} />
        <LocalizedArea label="Intro (home hero)" value={s.doctor.intro} onChange={(v) => setDoctor({ intro: v })} rows={3} />
        <LocalizedArea label="Biography" value={s.doctor.bio} onChange={(v) => setDoctor({ bio: v })} rows={6} hint="Separate paragraphs with a blank line." />
      </Section>

      {/* Contact */}
      <Section title="Contact">
        <div className="grid gap-4 sm:grid-cols-2">
          <TextField label="Email" value={s.contact.email} onChange={(v) => setContact({ email: v })} />
          <TextField label="Phone" value={s.contact.phone} onChange={(v) => setContact({ phone: v })} />
        </div>
        <LocalizedField label="Address" value={s.contact.address} onChange={(v) => setContact({ address: v })} />
        <LocalizedField label="Chamber Hours" value={s.contact.chamberHours} onChange={(v) => setContact({ chamberHours: v })} />
      </Section>

      {/* Social Links */}
      <Section title="Social Links">
        <div className="grid gap-4 sm:grid-cols-3">
          <TextField label="Facebook URL" value={s.socials.facebook} onChange={(v) => setSocials({ facebook: v })} />
          <TextField label="LinkedIn URL" value={s.socials.linkedin} onChange={(v) => setSocials({ linkedin: v })} />
          <TextField label="Twitter/X URL" value={s.socials.twitter} onChange={(v) => setSocials({ twitter: v })} />
        </div>
      </Section>

      {/* Site Appearance */}
      <Section title="Site Appearance" description="Theme colors, fonts, and style. Select a preset or customize.">
        {/* Presets grid */}
        <div className="mb-4">
          <label className="block text-xs font-medium text-muted mb-2">Theme Presets</label>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {APPEARANCE_PRESETS.map((preset) => (
              <button
                key={preset.id}
                type="button"
                onClick={() => setS((p) => ({ ...p, appearance: { ...preset.appearance } }))}
                className={`rounded-lg border p-3 text-left transition hover:shadow-sm ${
                  (s.appearance?.preset || DEFAULT_APPEARANCE.preset) === preset.id
                    ? "border-brand ring-2 ring-brand/20"
                    : "border-slate-200 hover:border-slate-300"
                }`}
              >
                <div className="flex items-center gap-2 mb-1.5">
                  <div className="h-4 w-4 rounded-full" style={{ backgroundColor: preset.colors.brand }} />
                  <div className="h-4 w-4 rounded-full" style={{ backgroundColor: preset.colors.accent }} />
                </div>
                <p className="text-xs font-medium text-ink">{preset.name}</p>
                <p className="text-[10px] text-muted mt-0.5">{preset.description}</p>
              </button>
            ))}
          </div>
        </div>

        {/* Custom controls */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <div>
            <label className="block text-xs font-medium text-muted mb-1">Brand Color</label>
            <div className="flex items-center gap-2">
              <input
                type="color"
                value={s.appearance?.brandColor || DEFAULT_APPEARANCE.brandColor}
                onChange={(e) => setS((p) => ({ ...p, appearance: { ...(p.appearance || DEFAULT_APPEARANCE), preset: "custom", brandColor: e.target.value } }))}
                className="h-9 w-9 rounded border border-slate-200 cursor-pointer"
              />
              <input
                type="text"
                value={s.appearance?.brandColor || DEFAULT_APPEARANCE.brandColor}
                onChange={(e) => setS((p) => ({ ...p, appearance: { ...(p.appearance || DEFAULT_APPEARANCE), preset: "custom", brandColor: e.target.value } }))}
                className="flex-1 rounded-lg border border-slate-300 px-3 py-2 text-sm text-ink"
                placeholder="#0d9488"
              />
            </div>
          </div>
          <div>
            <label className="block text-xs font-medium text-muted mb-1">Accent Color</label>
            <div className="flex items-center gap-2">
              <input
                type="color"
                value={s.appearance?.accentColor || DEFAULT_APPEARANCE.accentColor}
                onChange={(e) => setS((p) => ({ ...p, appearance: { ...(p.appearance || DEFAULT_APPEARANCE), preset: "custom", accentColor: e.target.value } }))}
                className="h-9 w-9 rounded border border-slate-200 cursor-pointer"
              />
              <input
                type="text"
                value={s.appearance?.accentColor || DEFAULT_APPEARANCE.accentColor}
                onChange={(e) => setS((p) => ({ ...p, appearance: { ...(p.appearance || DEFAULT_APPEARANCE), preset: "custom", accentColor: e.target.value } }))}
                className="flex-1 rounded-lg border border-slate-300 px-3 py-2 text-sm text-ink"
                placeholder="#0ea5e9"
              />
            </div>
          </div>
          <SelectField
            label="Body Font"
            value={s.appearance?.fontFamily || DEFAULT_APPEARANCE.fontFamily}
            onChange={(v) => setS((p) => ({ ...p, appearance: { ...(p.appearance || DEFAULT_APPEARANCE), preset: "custom", fontFamily: v } }))}
            options={FONT_OPTIONS}
          />
          <SelectField
            label="Heading Font"
            value={s.appearance?.headingFont || DEFAULT_APPEARANCE.headingFont}
            onChange={(v) => setS((p) => ({ ...p, appearance: { ...(p.appearance || DEFAULT_APPEARANCE), preset: "custom", headingFont: v } }))}
            options={FONT_OPTIONS}
          />
          <SelectField
            label="Border Radius"
            value={s.appearance?.borderRadius || DEFAULT_APPEARANCE.borderRadius}
            onChange={(v) => setS((p) => ({ ...p, appearance: { ...(p.appearance || DEFAULT_APPEARANCE), preset: "custom", borderRadius: v as SiteAppearance["borderRadius"] } }))}
            options={RADIUS_OPTIONS}
          />
        </div>

        {/* Live Preview */}
        <div className="mt-6 rounded-xl border border-slate-200 bg-slate-50 p-4">
          <p className="text-xs font-medium text-muted mb-3">Live Preview</p>
          <div className="rounded-xl border border-slate-200 bg-white p-5 space-y-4" style={{ fontFamily: (s.appearance?.fontFamily || DEFAULT_APPEARANCE.fontFamily) + ", system-ui, sans-serif" }}>
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg flex items-center justify-center text-white text-sm font-bold" style={{ backgroundColor: s.appearance?.brandColor || DEFAULT_APPEARANCE.brandColor, borderRadius: s.appearance?.borderRadius === "none" ? "0" : s.appearance?.borderRadius === "sm" ? "4px" : s.appearance?.borderRadius === "xl" ? "16px" : s.appearance?.borderRadius === "md" ? "8px" : "12px" }}>M</div>
              <div>
                <h4 className="text-sm font-bold" style={{ fontFamily: (s.appearance?.headingFont || DEFAULT_APPEARANCE.headingFont) + ", system-ui, sans-serif", color: s.appearance?.brandColor || DEFAULT_APPEARANCE.brandColor }}>MediSite Clinic</h4>
                <p className="text-xs text-muted">Your clinic management system</p>
              </div>
            </div>
            <div className="flex gap-2">
              <button type="button" className="px-4 py-1.5 text-xs font-semibold text-white" style={{ backgroundColor: s.appearance?.brandColor || DEFAULT_APPEARANCE.brandColor, borderRadius: s.appearance?.borderRadius === "none" ? "0" : s.appearance?.borderRadius === "sm" ? "4px" : s.appearance?.borderRadius === "xl" ? "16px" : s.appearance?.borderRadius === "md" ? "8px" : "12px" }}>Primary Button</button>
              <button type="button" className="px-4 py-1.5 text-xs font-semibold border" style={{ color: s.appearance?.brandColor || DEFAULT_APPEARANCE.brandColor, borderColor: s.appearance?.brandColor || DEFAULT_APPEARANCE.brandColor, borderRadius: s.appearance?.borderRadius === "none" ? "0" : s.appearance?.borderRadius === "sm" ? "4px" : s.appearance?.borderRadius === "xl" ? "16px" : s.appearance?.borderRadius === "md" ? "8px" : "12px" }}>Secondary</button>
              <button type="button" className="px-4 py-1.5 text-xs font-semibold text-white" style={{ backgroundColor: s.appearance?.accentColor || DEFAULT_APPEARANCE.accentColor, borderRadius: s.appearance?.borderRadius === "none" ? "0" : s.appearance?.borderRadius === "sm" ? "4px" : s.appearance?.borderRadius === "xl" ? "16px" : s.appearance?.borderRadius === "md" ? "8px" : "12px" }}>Accent</button>
            </div>
            <div className="grid grid-cols-3 gap-2 text-xs">
              <div className="rounded p-2 text-center text-white font-medium" style={{ backgroundColor: s.appearance?.brandColor || DEFAULT_APPEARANCE.brandColor }}>Brand</div>
              <div className="rounded p-2 text-center text-white font-medium" style={{ backgroundColor: s.appearance?.accentColor || DEFAULT_APPEARANCE.accentColor }}>Accent</div>
              <div className="rounded p-2 text-center font-medium" style={{ backgroundColor: (s.appearance?.brandColor || DEFAULT_APPEARANCE.brandColor) + "15", color: s.appearance?.brandColor || DEFAULT_APPEARANCE.brandColor }}>Light</div>
            </div>
            <p className="text-xs text-muted" style={{ fontFamily: (s.appearance?.fontFamily || DEFAULT_APPEARANCE.fontFamily) + ", system-ui, sans-serif" }}>
              Body text preview — The quick brown fox jumps over the lazy dog. আমার সোনার বাংলা আমি তোমায় ভালোবাসি।
            </p>
          </div>
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
          <div className="text-sm text-muted">General settings — site, profile, contact, socials.</div>
          <button
            type="submit"
            disabled={saving}
            className="inline-flex items-center gap-2 rounded-full bg-brand px-6 py-2.5 text-sm font-semibold text-white transition hover:bg-brand-dark disabled:cursor-not-allowed disabled:opacity-50"
          >
            {saving && <ButtonSpinner />}
            {saving ? "Saving…" : "Save Settings"}
          </button>
        </div>
      </div>
    </form>
  );
}
