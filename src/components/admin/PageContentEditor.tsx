"use client";

// -----------------------------------------------------------------------------
// PageContentEditor — client component that renders different form fields
// depending on the page slug. On save, merges changes into full SiteSettings
// and calls saveSettingsAction.
// -----------------------------------------------------------------------------

import React, { useState, useTransition } from "react";
import { saveSettingsAction } from "@/app/admin/actions";
import { Section, TextField, TextArea, RepeaterRow, AddButton } from "./fields";
import { LocalizedField, LocalizedArea } from "./LocalizedField";
import type { SiteSettings, Education, Experience, Contact, Socials } from "@/lib/types";
import type { LocalizedString } from "@/lib/i18n";

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

interface Props {
  slug: string;
  settings: SiteSettings;
}

// ---------------------------------------------------------------------------
// Helper: empty LocalizedString
// ---------------------------------------------------------------------------

const emptyLS = (): LocalizedString => ({ en: "", bn: "" });

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------

export default function PageContentEditor({ slug, settings }: Props) {
  switch (slug) {
    case "home":
      return <HomeContentForm settings={settings} />;
    case "about":
      return <AboutContentForm settings={settings} />;
    case "contact":
      return <ContactContentForm settings={settings} />;
    default:
      return (
        <div className="rounded-xl border border-slate-200 bg-white p-8 text-center text-muted">
          No content editor available for this page.
        </div>
      );
  }
}

// ---------------------------------------------------------------------------
// Save button with loading state
// ---------------------------------------------------------------------------

function SaveButton({ saving }: { saving: boolean }) {
  return (
    <button
      type="submit"
      disabled={saving}
      className="rounded-lg bg-brand px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-brand-dark disabled:opacity-50"
    >
      {saving ? "Saving…" : "Save Changes"}
    </button>
  );
}

// ---------------------------------------------------------------------------
// HOME Content Form
// ---------------------------------------------------------------------------

function HomeContentForm({ settings }: { settings: SiteSettings }) {
  const [home, setHome] = useState(settings.home);
  const [isPending, startTransition] = useTransition();
  const [message, setMessage] = useState("");

  const update = (key: keyof typeof home, value: LocalizedString) => {
    setHome((prev) => ({ ...prev, [key]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setMessage("");
    startTransition(async () => {
      const result = await saveSettingsAction({ ...settings, home });
      setMessage(result.ok ? "Saved successfully!" : result.error || "Save failed.");
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <Section title="Hero Section" description="Badge and CTA button labels shown in the hero.">
        <LocalizedField label="Hero Badge" value={home.heroBadge} onChange={(v) => update("heroBadge", v)} />
        <LocalizedField label="CTA Primary Label" value={home.ctaPrimaryLabel} onChange={(v) => update("ctaPrimaryLabel", v)} />
        <LocalizedField label="CTA Secondary Label" value={home.ctaSecondaryLabel} onChange={(v) => update("ctaSecondaryLabel", v)} />
      </Section>

      <Section title="Areas of Care Section" description="Heading and subtitle for the specialties grid.">
        <LocalizedField label="Areas Heading" value={home.areasHeading} onChange={(v) => update("areasHeading", v)} />
        <LocalizedField label="Areas Subtitle" value={home.areasSubtitle} onChange={(v) => update("areasSubtitle", v)} />
      </Section>

      <Section title="Latest Articles Section" description="Heading and subtitle for the blog preview.">
        <LocalizedField label="Latest Heading" value={home.latestHeading} onChange={(v) => update("latestHeading", v)} />
        <LocalizedField label="Latest Subtitle" value={home.latestSubtitle} onChange={(v) => update("latestSubtitle", v)} />
      </Section>

      <Section title="Bottom CTA Section" description="Call-to-action banner at the bottom of the page.">
        <LocalizedField label="Bottom CTA Heading" value={home.bottomCtaHeading} onChange={(v) => update("bottomCtaHeading", v)} />
        <LocalizedField label="Bottom CTA Subtitle" value={home.bottomCtaSubtitle} onChange={(v) => update("bottomCtaSubtitle", v)} />
      </Section>

      <div className="flex items-center gap-4">
        <SaveButton saving={isPending} />
        {message && (
          <span className={`text-sm ${message.includes("success") ? "text-green-600" : "text-red-600"}`}>
            {message}
          </span>
        )}
      </div>
    </form>
  );
}

// ---------------------------------------------------------------------------
// ABOUT Content Form
// ---------------------------------------------------------------------------

function AboutContentForm({ settings }: { settings: SiteSettings }) {
  const [bio, setBio] = useState(settings.doctor.bio);
  const [education, setEducation] = useState<Education[]>(settings.education);
  const [experience, setExperience] = useState<Experience[]>(settings.experience);
  const [isPending, startTransition] = useTransition();
  const [message, setMessage] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setMessage("");
    startTransition(async () => {
      const updated: SiteSettings = {
        ...settings,
        doctor: { ...settings.doctor, bio },
        education,
        experience,
      };
      const result = await saveSettingsAction(updated);
      setMessage(result.ok ? "Saved successfully!" : result.error || "Save failed.");
    });
  };

  // --- Education helpers ---
  const updateEdu = (index: number, field: keyof Education, value: LocalizedString | string) => {
    setEducation((prev) =>
      prev.map((item, i) => (i === index ? { ...item, [field]: value } : item))
    );
  };
  const addEducation = () => {
    setEducation((prev) => [...prev, { degree: emptyLS(), institution: emptyLS(), year: "" }]);
  };
  const removeEducation = (index: number) => {
    setEducation((prev) => prev.filter((_, i) => i !== index));
  };

  // --- Experience helpers ---
  const updateExp = (index: number, field: keyof Experience, value: LocalizedString) => {
    setExperience((prev) =>
      prev.map((item, i) => (i === index ? { ...item, [field]: value } : item))
    );
  };
  const addExperience = () => {
    setExperience((prev) => [
      ...prev,
      { role: emptyLS(), place: emptyLS(), period: emptyLS(), description: emptyLS() },
    ]);
  };
  const removeExperience = (index: number) => {
    setExperience((prev) => prev.filter((_, i) => i !== index));
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <Section title="Doctor Bio" description="Biography paragraphs (separate with blank lines).">
        <LocalizedArea
          label="Bio"
          value={bio}
          onChange={setBio}
          rows={6}
          hint="Separate paragraphs with a blank line."
        />
      </Section>

      <Section title="Education" description="Degrees and qualifications.">
        <div className="space-y-4">
          {education.map((edu, i) => (
            <RepeaterRow key={i} onRemove={() => removeEducation(i)}>
              <div className="space-y-3">
                <LocalizedField label="Degree" value={edu.degree} onChange={(v) => updateEdu(i, "degree", v)} />
                <LocalizedField label="Institution" value={edu.institution} onChange={(v) => updateEdu(i, "institution", v)} />
                <TextField label="Year" value={edu.year} onChange={(v) => updateEdu(i, "year", v)} placeholder="e.g. 2018" />
              </div>
            </RepeaterRow>
          ))}
          <AddButton onClick={addEducation} label="Add Education" />
        </div>
      </Section>

      <Section title="Experience" description="Professional experience timeline entries.">
        <div className="space-y-4">
          {experience.map((exp, i) => (
            <RepeaterRow key={i} onRemove={() => removeExperience(i)}>
              <div className="space-y-3">
                <LocalizedField label="Role" value={exp.role} onChange={(v) => updateExp(i, "role", v)} />
                <LocalizedField label="Place" value={exp.place} onChange={(v) => updateExp(i, "place", v)} />
                <LocalizedField label="Period" value={exp.period} onChange={(v) => updateExp(i, "period", v)} />
                <LocalizedField label="Description" value={exp.description} onChange={(v) => updateExp(i, "description", v)} />
              </div>
            </RepeaterRow>
          ))}
          <AddButton onClick={addExperience} label="Add Experience" />
        </div>
      </Section>

      <div className="flex items-center gap-4">
        <SaveButton saving={isPending} />
        {message && (
          <span className={`text-sm ${message.includes("success") ? "text-green-600" : "text-red-600"}`}>
            {message}
          </span>
        )}
      </div>
    </form>
  );
}

// ---------------------------------------------------------------------------
// CONTACT Content Form
// ---------------------------------------------------------------------------

function ContactContentForm({ settings }: { settings: SiteSettings }) {
  const [contact, setContact] = useState<Contact>(settings.contact);
  const [socials, setSocials] = useState<Socials>(settings.socials);
  const [mapUrl, setMapUrl] = useState(
    // mapUrl is stored on the first chamber if it exists; otherwise use a standalone field
    settings.appointment.chambers[0]?.mapUrl || ""
  );
  const [isPending, startTransition] = useTransition();
  const [message, setMessage] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setMessage("");
    startTransition(async () => {
      // Merge map URL into the first chamber if there is one
      const appointment = { ...settings.appointment };
      if (appointment.chambers.length > 0) {
        appointment.chambers = appointment.chambers.map((c, i) =>
          i === 0 ? { ...c, mapUrl } : c
        );
      }
      const updated: SiteSettings = {
        ...settings,
        contact,
        socials,
        appointment,
      };
      const result = await saveSettingsAction(updated);
      setMessage(result.ok ? "Saved successfully!" : result.error || "Save failed.");
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <Section title="Contact Information" description="Primary contact details.">
        <TextField
          label="Phone"
          value={contact.phone}
          onChange={(v) => setContact((prev) => ({ ...prev, phone: v }))}
          placeholder="+880 1XXX-XXXXXX"
        />
        <TextField
          label="Email"
          value={contact.email}
          onChange={(v) => setContact((prev) => ({ ...prev, email: v }))}
          placeholder="doctor@example.com"
          type="email"
        />
        <LocalizedField
          label="Address"
          value={contact.address}
          onChange={(v) => setContact((prev) => ({ ...prev, address: v }))}
        />
        <LocalizedField
          label="Chamber Hours"
          value={contact.chamberHours}
          onChange={(v) => setContact((prev) => ({ ...prev, chamberHours: v }))}
        />
      </Section>

      <Section title="Social Links" description="Social media profile URLs.">
        <TextField
          label="Facebook"
          value={socials.facebook}
          onChange={(v) => setSocials((prev) => ({ ...prev, facebook: v }))}
          placeholder="https://facebook.com/..."
        />
        <TextField
          label="LinkedIn"
          value={socials.linkedin}
          onChange={(v) => setSocials((prev) => ({ ...prev, linkedin: v }))}
          placeholder="https://linkedin.com/in/..."
        />
        <TextField
          label="Twitter / X"
          value={socials.twitter}
          onChange={(v) => setSocials((prev) => ({ ...prev, twitter: v }))}
          placeholder="https://x.com/..."
        />
      </Section>

      <Section title="Map" description="Google Maps or similar embed URL for the chamber location.">
        <TextField
          label="Map URL"
          value={mapUrl}
          onChange={setMapUrl}
          placeholder="https://maps.google.com/..."
        />
      </Section>

      <div className="flex items-center gap-4">
        <SaveButton saving={isPending} />
        {message && (
          <span className={`text-sm ${message.includes("success") ? "text-green-600" : "text-red-600"}`}>
            {message}
          </span>
        )}
      </div>
    </form>
  );
}
