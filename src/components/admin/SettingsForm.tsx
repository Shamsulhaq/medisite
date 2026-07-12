"use client";

import { useState } from "react";
import type { SiteSettings } from "@/lib/types";
import { LOCALES, LOCALE_LABELS } from "@/lib/i18n";
import { saveSettingsAction } from "@/app/admin/actions";
import {
  Section,
  TextField,
  SelectField,
  RepeaterRow,
  AddButton,
} from "@/components/admin/fields";
import { LocalizedField, LocalizedArea } from "@/components/admin/LocalizedField";
import ImageUpload from "@/components/admin/ImageUpload";
import ButtonSpinner from "@/components/admin/ButtonSpinner";

const ICON_OPTIONS = [
  { value: "stethoscope", label: "Stethoscope" },
  { value: "bed", label: "Bed / Ward" },
  { value: "shield", label: "Shield / Prevention" },
  { value: "book", label: "Book / Education" },
  { value: "calendar", label: "Calendar" },
  { value: "clock", label: "Clock" },
  { value: "phone", label: "Phone" },
  { value: "location", label: "Location" },
];

const TABS = [
  { id: "general", label: "General" },
  { id: "profile", label: "Profile" },
  { id: "contact", label: "Contact" },
  { id: "home", label: "Home Page" },
  { id: "messages", label: "Messages" },
  { id: "navigation", label: "Navigation" },
  { id: "lists", label: "Lists" },
  { id: "email", label: "Email" },
  { id: "payment", label: "Payment" },
] as const;

type TabId = (typeof TABS)[number]["id"];

export default function SettingsForm({ initial }: { initial: SiteSettings }) {
  const [s, setS] = useState<SiteSettings>(initial);
  const [keywordsText, setKeywordsText] = useState(
    initial.metaKeywords.join(", ")
  );
  const [tab, setTab] = useState<TabId>("general");
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  const setTop = <K extends keyof SiteSettings>(k: K, v: SiteSettings[K]) =>
    setS((p) => ({ ...p, [k]: v }));
  const setDoctor = (patch: Partial<SiteSettings["doctor"]>) =>
    setS((p) => ({ ...p, doctor: { ...p.doctor, ...patch } }));
  const setContact = (patch: Partial<SiteSettings["contact"]>) =>
    setS((p) => ({ ...p, contact: { ...p.contact, ...patch } }));
  const setSocials = (patch: Partial<SiteSettings["socials"]>) =>
    setS((p) => ({ ...p, socials: { ...p.socials, ...patch } }));
  const setHome = (patch: Partial<SiteSettings["home"]>) =>
    setS((p) => ({ ...p, home: { ...p.home, ...patch } }));
  const setMessages = (patch: Partial<SiteSettings["messages"]>) =>
    setS((p) => ({ ...p, messages: { ...p.messages, ...patch } }));

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
      timeSlots: s.timeSlots.map((t) => t.trim()).filter(Boolean),
    };

    const res = await saveSettingsAction(payload);
    setSaving(false);
    if (res.ok) {
      setMessage({ type: "success", text: "All settings saved." });
      window.scrollTo({ top: 0, behavior: "smooth" });
    } else {
      setMessage({ type: "error", text: res.error ?? "Failed to save." });
    }
  }

  return (
    <form onSubmit={handleSave} className="pb-24">
      {/* Tab navigation */}
      <div className="sticky top-16 z-20 -mx-1 mb-6 flex gap-1 overflow-x-auto rounded-xl border border-slate-200 bg-white/95 p-1 shadow-sm backdrop-blur">
        {TABS.map((tabItem) => (
          <button
            key={tabItem.id}
            type="button"
            onClick={() => setTab(tabItem.id)}
            className={`whitespace-nowrap rounded-lg px-4 py-2 text-sm font-medium transition ${
              tab === tabItem.id
                ? "bg-brand text-white shadow-sm"
                : "text-muted hover:bg-slate-50 hover:text-ink"
            }`}
          >
            {tabItem.label}
          </button>
        ))}
      </div>

      {/* GENERAL */}
      {tab === "general" && (
        <div className="space-y-6">
          <Section
            title="Language"
            description="Default language shown to new visitors."
          >
            <SelectField
              label="Default Language"
              value={s.defaultLanguage}
              onChange={(v) =>
                setTop("defaultLanguage", v as SiteSettings["defaultLanguage"])
              }
              options={LOCALES.map((l) => ({
                value: l,
                label: LOCALE_LABELS[l],
              }))}
            />
          </Section>

          <Section
            title="Site Metadata (SEO)"
            description="Browser title, search description, and keywords."
          >
            <LocalizedField
              label="Site Title"
              value={s.siteTitle}
              onChange={(v) => setTop("siteTitle", v)}
            />
            <LocalizedArea
              label="Meta Description"
              value={s.metaDescription}
              onChange={(v) => setTop("metaDescription", v)}
              rows={2}
            />
            <TextField
              label="Meta Keywords (comma-separated)"
              value={keywordsText}
              onChange={setKeywordsText}
            />
          </Section>

          <Section title="Branding">
            <LocalizedField
              label="Logo Text"
              value={s.logoText}
              onChange={(v) => setTop("logoText", v)}
            />
            <LocalizedField
              label="Logo Subtitle"
              value={s.logoSubtitle}
              onChange={(v) => setTop("logoSubtitle", v)}
            />
          </Section>
        </div>
      )}

      {/* PROFILE */}
      {tab === "profile" && (
        <div className="space-y-6">
          <Section title="Doctor Profile">
            <ImageUpload
              label="Profile Photo"
              hint="Shown on the home hero and about page."
              value={s.doctor.photo ?? ""}
              onChange={(url) => setDoctor({ photo: url })}
              rounded
            />
            <LocalizedField
              label="Name"
              value={s.doctor.name}
              onChange={(v) => setDoctor({ name: v })}
            />
            <div className="grid gap-4 sm:grid-cols-2">
              <LocalizedField
                label="Title"
                value={s.doctor.title}
                onChange={(v) => setDoctor({ title: v })}
              />
              <LocalizedField
                label="Department"
                value={s.doctor.department}
                onChange={(v) => setDoctor({ department: v })}
              />
              <LocalizedField
                label="Hospital"
                value={s.doctor.hospital}
                onChange={(v) => setDoctor({ hospital: v })}
              />
              <LocalizedField
                label="Location"
                value={s.doctor.location}
                onChange={(v) => setDoctor({ location: v })}
              />
            </div>
            <TextField
              label="Hero Initials (fallback when no photo)"
              value={s.doctor.initials ?? ""}
              onChange={(v) => setDoctor({ initials: v })}
            />
            <LocalizedField
              label="Tagline"
              value={s.doctor.tagline}
              onChange={(v) => setDoctor({ tagline: v })}
            />
            <LocalizedArea
              label="Intro (home hero)"
              value={s.doctor.intro}
              onChange={(v) => setDoctor({ intro: v })}
              rows={3}
            />
            <LocalizedArea
              label="Biography"
              value={s.doctor.bio}
              onChange={(v) => setDoctor({ bio: v })}
              rows={6}
              hint="Separate paragraphs with a blank line."
            />
          </Section>
        </div>
      )}

      {/* CONTACT */}
      {tab === "contact" && (
        <div className="space-y-6">
          <Section title="Contact">
            <div className="grid gap-4 sm:grid-cols-2">
              <TextField
                label="Email"
                value={s.contact.email}
                onChange={(v) => setContact({ email: v })}
              />
              <TextField
                label="Phone"
                value={s.contact.phone}
                onChange={(v) => setContact({ phone: v })}
              />
            </div>
            <LocalizedField
              label="Address"
              value={s.contact.address}
              onChange={(v) => setContact({ address: v })}
            />
            <LocalizedField
              label="Chamber Hours"
              value={s.contact.chamberHours}
              onChange={(v) => setContact({ chamberHours: v })}
            />
            <div className="grid gap-4 sm:grid-cols-3">
              <TextField
                label="Facebook URL"
                value={s.socials.facebook}
                onChange={(v) => setSocials({ facebook: v })}
              />
              <TextField
                label="LinkedIn URL"
                value={s.socials.linkedin}
                onChange={(v) => setSocials({ linkedin: v })}
              />
              <TextField
                label="Twitter/X URL"
                value={s.socials.twitter}
                onChange={(v) => setSocials({ twitter: v })}
              />
            </div>
          </Section>
        </div>
      )}

      {/* HOME PAGE */}
      {tab === "home" && (
        <div className="space-y-6">
          <Section title="Home Page Text">
            <LocalizedField
              label="Hero Badge"
              value={s.home.heroBadge}
              onChange={(v) => setHome({ heroBadge: v })}
            />
            <div className="grid gap-4 sm:grid-cols-2">
              <LocalizedField
                label="Primary Button"
                value={s.home.ctaPrimaryLabel}
                onChange={(v) => setHome({ ctaPrimaryLabel: v })}
              />
              <LocalizedField
                label="Secondary Button"
                value={s.home.ctaSecondaryLabel}
                onChange={(v) => setHome({ ctaSecondaryLabel: v })}
              />
            </div>
            <LocalizedField
              label="Areas Heading"
              value={s.home.areasHeading}
              onChange={(v) => setHome({ areasHeading: v })}
            />
            <LocalizedField
              label="Areas Subtitle"
              value={s.home.areasSubtitle}
              onChange={(v) => setHome({ areasSubtitle: v })}
            />
            <LocalizedField
              label="Latest Articles Heading"
              value={s.home.latestHeading}
              onChange={(v) => setHome({ latestHeading: v })}
            />
            <LocalizedField
              label="Latest Articles Subtitle"
              value={s.home.latestSubtitle}
              onChange={(v) => setHome({ latestSubtitle: v })}
            />
            <LocalizedField
              label="Bottom CTA Heading"
              value={s.home.bottomCtaHeading}
              onChange={(v) => setHome({ bottomCtaHeading: v })}
            />
            <LocalizedField
              label="Bottom CTA Subtitle"
              value={s.home.bottomCtaSubtitle}
              onChange={(v) => setHome({ bottomCtaSubtitle: v })}
            />
          </Section>
        </div>
      )}

      {/* MESSAGES */}
      {tab === "messages" && (
        <div className="space-y-6">
          <Section title="Messages">
            <LocalizedArea
              label="Appointment Intro"
              value={s.messages.appointmentIntro}
              onChange={(v) => setMessages({ appointmentIntro: v })}
              rows={2}
            />
            <LocalizedArea
              label="Appointment Success Message"
              value={s.messages.appointmentSuccess}
              onChange={(v) => setMessages({ appointmentSuccess: v })}
              rows={2}
            />
            <LocalizedArea
              label="Emergency Notice"
              value={s.messages.emergencyNotice}
              onChange={(v) => setMessages({ emergencyNotice: v })}
              rows={2}
            />
            <LocalizedArea
              label="Footer Disclaimer"
              value={s.messages.footerDisclaimer}
              onChange={(v) => setMessages({ footerDisclaimer: v })}
              rows={2}
            />
          </Section>
        </div>
      )}

      {/* NAVIGATION */}
      {tab === "navigation" && (
        <div className="space-y-6">
          <Section title="Navigation Menu">
            {s.menu.map((item, i) => (
              <RepeaterRow
                key={i}
                onRemove={() =>
                  setTop("menu", s.menu.filter((_, idx) => idx !== i))
                }
              >
                <LocalizedField
                  label="Label"
                  value={item.label}
                  onChange={(v) =>
                    setTop(
                      "menu",
                      s.menu.map((it, idx) =>
                        idx === i ? { ...it, label: v } : it
                      )
                    )
                  }
                />
                <div className="mt-3">
                  <TextField
                    label="Path (e.g. /about)"
                    value={item.href}
                    onChange={(v) =>
                      setTop(
                        "menu",
                        s.menu.map((it, idx) =>
                          idx === i ? { ...it, href: v } : it
                        )
                      )
                    }
                  />
                </div>
              </RepeaterRow>
            ))}
            <AddButton
              label="Add menu item"
              onClick={() =>
                setTop("menu", [
                  ...s.menu,
                  { href: "/", label: { en: "", bn: "" } },
                ])
              }
            />
          </Section>
        </div>
      )}

      {/* LISTS */}
      {tab === "lists" && (
        <div className="space-y-6">
          <Section title="Stats">
            {s.stats.map((item, i) => (
              <RepeaterRow
                key={i}
                onRemove={() =>
                  setTop("stats", s.stats.filter((_, idx) => idx !== i))
                }
              >
                <TextField
                  label="Value (e.g. 8+)"
                  value={item.value}
                  onChange={(v) =>
                    setTop(
                      "stats",
                      s.stats.map((it, idx) =>
                        idx === i ? { ...it, value: v } : it
                      )
                    )
                  }
                />
                <div className="mt-3">
                  <LocalizedField
                    label="Label"
                    value={item.label}
                    onChange={(v) =>
                      setTop(
                        "stats",
                        s.stats.map((it, idx) =>
                          idx === i ? { ...it, label: v } : it
                        )
                      )
                    }
                  />
                </div>
              </RepeaterRow>
            ))}
            <AddButton
              label="Add stat"
              onClick={() =>
                setTop("stats", [
                  ...s.stats,
                  { value: "", label: { en: "", bn: "" } },
                ])
              }
            />
          </Section>

          <Section title="Areas of Care">
            {s.specialties.map((item, i) => (
              <RepeaterRow
                key={i}
                onRemove={() =>
                  setTop(
                    "specialties",
                    s.specialties.filter((_, idx) => idx !== i)
                  )
                }
              >
                <div className="grid gap-3 sm:grid-cols-[1fr_200px]">
                  <LocalizedField
                    label="Title"
                    value={item.title}
                    onChange={(v) =>
                      setTop(
                        "specialties",
                        s.specialties.map((it, idx) =>
                          idx === i ? { ...it, title: v } : it
                        )
                      )
                    }
                  />
                  <SelectField
                    label="Icon"
                    value={item.icon}
                    options={ICON_OPTIONS}
                    onChange={(v) =>
                      setTop(
                        "specialties",
                        s.specialties.map((it, idx) =>
                          idx === i ? { ...it, icon: v } : it
                        )
                      )
                    }
                  />
                </div>
                <div className="mt-3">
                  <LocalizedArea
                    label="Description"
                    value={item.description}
                    rows={2}
                    onChange={(v) =>
                      setTop(
                        "specialties",
                        s.specialties.map((it, idx) =>
                          idx === i ? { ...it, description: v } : it
                        )
                      )
                    }
                  />
                </div>
              </RepeaterRow>
            ))}
            <AddButton
              label="Add area of care"
              onClick={() =>
                setTop("specialties", [
                  ...s.specialties,
                  {
                    icon: "stethoscope",
                    title: { en: "", bn: "" },
                    description: { en: "", bn: "" },
                  },
                ])
              }
            />
          </Section>

          <Section title="Education & Qualifications">
            {s.education.map((item, i) => (
              <RepeaterRow
                key={i}
                onRemove={() =>
                  setTop(
                    "education",
                    s.education.filter((_, idx) => idx !== i)
                  )
                }
              >
                <LocalizedField
                  label="Degree"
                  value={item.degree}
                  onChange={(v) =>
                    setTop(
                      "education",
                      s.education.map((it, idx) =>
                        idx === i ? { ...it, degree: v } : it
                      )
                    )
                  }
                />
                <div className="mt-3 grid gap-3 sm:grid-cols-[1fr_140px]">
                  <LocalizedField
                    label="Institution"
                    value={item.institution}
                    onChange={(v) =>
                      setTop(
                        "education",
                        s.education.map((it, idx) =>
                          idx === i ? { ...it, institution: v } : it
                        )
                      )
                    }
                  />
                  <TextField
                    label="Year"
                    value={item.year}
                    onChange={(v) =>
                      setTop(
                        "education",
                        s.education.map((it, idx) =>
                          idx === i ? { ...it, year: v } : it
                        )
                      )
                    }
                  />
                </div>
              </RepeaterRow>
            ))}
            <AddButton
              label="Add qualification"
              onClick={() =>
                setTop("education", [
                  ...s.education,
                  {
                    degree: { en: "", bn: "" },
                    institution: { en: "", bn: "" },
                    year: "",
                  },
                ])
              }
            />
          </Section>

          <Section title="Experience">
            {s.experience.map((item, i) => (
              <RepeaterRow
                key={i}
                onRemove={() =>
                  setTop(
                    "experience",
                    s.experience.filter((_, idx) => idx !== i)
                  )
                }
              >
                <LocalizedField
                  label="Role"
                  value={item.role}
                  onChange={(v) =>
                    setTop(
                      "experience",
                      s.experience.map((it, idx) =>
                        idx === i ? { ...it, role: v } : it
                      )
                    )
                  }
                />
                <div className="mt-3">
                  <LocalizedField
                    label="Place"
                    value={item.place}
                    onChange={(v) =>
                      setTop(
                        "experience",
                        s.experience.map((it, idx) =>
                          idx === i ? { ...it, place: v } : it
                        )
                      )
                    }
                  />
                </div>
                <div className="mt-3">
                  <LocalizedField
                    label="Period"
                    value={item.period}
                    onChange={(v) =>
                      setTop(
                        "experience",
                        s.experience.map((it, idx) =>
                          idx === i ? { ...it, period: v } : it
                        )
                      )
                    }
                  />
                </div>
                <div className="mt-3">
                  <LocalizedArea
                    label="Description"
                    value={item.description}
                    rows={2}
                    onChange={(v) =>
                      setTop(
                        "experience",
                        s.experience.map((it, idx) =>
                          idx === i ? { ...it, description: v } : it
                        )
                      )
                    }
                  />
                </div>
              </RepeaterRow>
            ))}
            <AddButton
              label="Add experience"
              onClick={() =>
                setTop("experience", [
                  ...s.experience,
                  {
                    role: { en: "", bn: "" },
                    place: { en: "", bn: "" },
                    period: { en: "", bn: "" },
                    description: { en: "", bn: "" },
                  },
                ])
              }
            />
          </Section>
        </div>
      )}

      {/* EMAIL */}
      {tab === "email" && (
        <div className="space-y-6">
          <Section
            title="Email (SMTP)"
            description="Configure outgoing email for sending prescriptions. Use your email provider's SMTP credentials."
          >
            <label className="flex items-center gap-3 rounded-lg border border-slate-200 bg-slate-50 p-3">
              <input
                type="checkbox"
                checked={s.email.enabled}
                onChange={(e) =>
                  setTop("email", { ...s.email, enabled: e.target.checked })
                }
                className="h-4 w-4 rounded border-slate-300 text-brand focus:ring-brand"
              />
              <span className="text-sm font-medium text-ink">
                Email sending enabled
              </span>
            </label>
            {s.email.enabled && (
              <>
                <div className="grid gap-4 sm:grid-cols-2">
                  <TextField
                    label="SMTP Host"
                    value={s.email.host}
                    onChange={(v) =>
                      setTop("email", { ...s.email, host: v })
                    }
                    placeholder="smtp.gmail.com"
                  />
                  <TextField
                    label="Port"
                    value={String(s.email.port)}
                    onChange={(v) =>
                      setTop("email", {
                        ...s.email,
                        port: Number(v) || 587,
                      })
                    }
                    placeholder="587"
                  />
                  <TextField
                    label="Username / Email"
                    value={s.email.user}
                    onChange={(v) =>
                      setTop("email", { ...s.email, user: v })
                    }
                    placeholder="your@gmail.com"
                  />
                  <TextField
                    label="Password / App Password"
                    value={s.email.pass}
                    onChange={(v) =>
                      setTop("email", { ...s.email, pass: v })
                    }
                    placeholder="••••••••"
                    type="password"
                  />
                </div>
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={s.email.secure}
                    onChange={(e) =>
                      setTop("email", {
                        ...s.email,
                        secure: e.target.checked,
                      })
                    }
                    className="h-4 w-4 rounded border-slate-300 text-brand focus:ring-brand"
                  />
                  <span className="text-sm text-ink">
                    Use SSL/TLS (port 465)
                  </span>
                </label>
                <TextField
                  label="From (display name + address)"
                  value={s.email.from}
                  onChange={(v) =>
                    setTop("email", { ...s.email, from: v })
                  }
                  placeholder='"Dr. Mahmud" <noreply@drmahmud.com>'
                />
              </>
            )}
          </Section>
        </div>
      )}

      {/* PAYMENT */}
      {tab === "payment" && (
        <div className="space-y-6">
          <Section
            title="Fee Structure"
            description="Configure consultation fees based on visit frequency. These will be auto-suggested when creating a consultation."
          >
            <div className="grid gap-4 sm:grid-cols-2">
              <TextField
                label="First Visit (৳)"
                value={String(s.feeStructure.firstVisit)}
                onChange={(v) =>
                  setTop("feeStructure", { ...s.feeStructure, firstVisit: Number(v) || 0 })
                }
                placeholder="500"
              />
              <TextField
                label="Within 7 Days (৳)"
                value={String(s.feeStructure.within7Days)}
                onChange={(v) =>
                  setTop("feeStructure", { ...s.feeStructure, within7Days: Number(v) || 0 })
                }
                placeholder="300"
              />
              <TextField
                label="Within 30 Days (৳)"
                value={String(s.feeStructure.within30Days)}
                onChange={(v) =>
                  setTop("feeStructure", { ...s.feeStructure, within30Days: Number(v) || 0 })
                }
                placeholder="200"
              />
              <TextField
                label="After 30 Days (৳)"
                value={String(s.feeStructure.after30Days)}
                onChange={(v) =>
                  setTop("feeStructure", { ...s.feeStructure, after30Days: Number(v) || 0 })
                }
                placeholder="500"
              />
            </div>
          </Section>
        </div>
      )}

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
                Saving applies changes from all tabs.
              </span>
            )}
          </div>
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
