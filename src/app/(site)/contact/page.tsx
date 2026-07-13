import type { Metadata } from "next";
import Link from "next/link";
import { getSettings } from "@/lib/store";
import { t, UI } from "@/lib/i18n";
import { getLocale } from "@/lib/i18n-server";
import Icon from "@/components/Icon";
import { getPageBlocks } from "@/lib/page-builder/data";
import { renderBlock, type BlockContext } from "@/components/blocks";

export async function generateMetadata(): Promise<Metadata> {
  const s = await getSettings();
  const locale = await getLocale(s.defaultLanguage);
  return {
    title: `${locale === "bn" ? "যোগাযোগ" : "Contact"} — ${t(s.doctor.name, locale)}`,
    description: `${locale === "bn" ? "যোগাযোগ করুন" : "Get in touch with"} ${t(s.doctor.name, locale)}`,
  };
}

export default async function ContactPage() {
  const settings = await getSettings();
  const locale = await getLocale(settings.defaultLanguage);
  const { doctor, contact, socials } = settings;

  const name = t(doctor.name, locale);
  const initials =
    doctor.initials?.trim() ||
    name
      .replace(/^Dr\.?\s*|^ডা\.?\s*/i, "")
      .split(" ")
      .map((w) => w[0])
      .slice(0, 2)
      .join("");

  // --- Page Builder: render blocks if configured ---
  const blocks = await getPageBlocks("contact");

  if (blocks.length > 0) {
    const context: BlockContext = {
      doctorName: name,
      doctorPhoto: doctor.photo || undefined,
      doctorInitials: initials,
    };
    return <>{blocks.map((block) => renderBlock(block, locale, context))}</>;
  }

  // --- Fallback: default layout when no page builder blocks exist ---
  return (
    <>
      {/* Header */}
      <section className="bg-slate-50">
        <div className="mx-auto max-w-6xl px-4 py-14 sm:px-6">
          <p className="text-sm font-semibold uppercase tracking-wide text-brand">
            {locale === "bn" ? "যোগাযোগ" : "Contact"}
          </p>
          <h1 className="mt-2 text-3xl font-bold text-ink sm:text-4xl">
            {locale === "bn" ? "যোগাযোগ করুন" : "Get in Touch"}
          </h1>
          <p className="mt-3 max-w-2xl text-muted">
            {locale === "bn"
              ? "অ্যাপয়েন্টমেন্ট বুক করতে বা কোনো প্রশ্ন থাকলে নিচের তথ্য ব্যবহার করুন।"
              : "Use the information below to book an appointment or reach out with any questions."}
          </p>
        </div>
      </section>

      {/* Content */}
      <div className="mx-auto grid max-w-6xl gap-10 px-4 py-14 sm:px-6 lg:grid-cols-3">
        {/* Contact details */}
        <div className="lg:col-span-2 space-y-8">
          <div className="rounded-xl border border-slate-200 bg-white p-6">
            <h2 className="text-lg font-semibold text-ink">
              {locale === "bn" ? "যোগাযোগের তথ্য" : "Contact Information"}
            </h2>
            <ul className="mt-6 space-y-5 text-sm text-muted">
              <li className="flex items-start gap-4">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-brand-light text-brand-dark">
                  <Icon name="location" className="h-5 w-5" />
                </span>
                <span>
                  <span className="block font-medium text-ink">
                    {locale === "bn" ? "ঠিকানা" : "Address"}
                  </span>
                  {t(contact.address, locale)}
                </span>
              </li>
              <li className="flex items-start gap-4">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-brand-light text-brand-dark">
                  <Icon name="clock" className="h-5 w-5" />
                </span>
                <span>
                  <span className="block font-medium text-ink">
                    {locale === "bn" ? "চেম্বার সময়" : "Chamber Hours"}
                  </span>
                  {t(contact.chamberHours, locale)}
                </span>
              </li>
              <li className="flex items-start gap-4">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-brand-light text-brand-dark">
                  <Icon name="phone" className="h-5 w-5" />
                </span>
                <span>
                  <span className="block font-medium text-ink">
                    {locale === "bn" ? "ফোন" : "Phone"}
                  </span>
                  <a
                    href={`tel:${contact.phone.replace(/\s/g, "")}`}
                    className="transition hover:text-brand"
                  >
                    {contact.phone}
                  </a>
                </span>
              </li>
              {contact.email && (
                <li className="flex items-start gap-4">
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-brand-light text-brand-dark">
                    <Icon name="mail" className="h-5 w-5" />
                  </span>
                  <span>
                    <span className="block font-medium text-ink">
                      {locale === "bn" ? "ইমেইল" : "Email"}
                    </span>
                    <a
                      href={`mailto:${contact.email}`}
                      className="transition hover:text-brand"
                    >
                      {contact.email}
                    </a>
                  </span>
                </li>
              )}
            </ul>
          </div>

          {/* Social links */}
          {(socials.facebook || socials.linkedin || socials.twitter) && (
            <div className="rounded-xl border border-slate-200 bg-white p-6">
              <h2 className="text-lg font-semibold text-ink">
                {locale === "bn" ? "সামাজিক যোগাযোগ" : "Follow Us"}
              </h2>
              <div className="mt-4 flex flex-wrap gap-3">
                {socials.facebook && (
                  <a
                    href={socials.facebook}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 rounded-lg border border-slate-200 px-4 py-2.5 text-sm font-medium text-ink transition hover:border-brand hover:text-brand"
                  >
                    Facebook
                  </a>
                )}
                {socials.linkedin && (
                  <a
                    href={socials.linkedin}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 rounded-lg border border-slate-200 px-4 py-2.5 text-sm font-medium text-ink transition hover:border-brand hover:text-brand"
                  >
                    LinkedIn
                  </a>
                )}
                {socials.twitter && (
                  <a
                    href={socials.twitter}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 rounded-lg border border-slate-200 px-4 py-2.5 text-sm font-medium text-ink transition hover:border-brand hover:text-brand"
                  >
                    Twitter / X
                  </a>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Sidebar */}
        <aside className="space-y-6">
          <div className="rounded-xl border border-brand-light bg-brand-light/40 p-6">
            <h2 className="flex items-center gap-2 font-semibold text-brand-dark">
              <Icon name="calendar" className="h-5 w-5" />
              {locale === "bn" ? "অ্যাপয়েন্টমেন্ট নিন" : "Book an Appointment"}
            </h2>
            <p className="mt-2 text-sm text-slate-700">
              {locale === "bn"
                ? "অনলাইনে অ্যাপয়েন্টমেন্ট বুক করুন — মাত্র এক মিনিট লাগে।"
                : "Book an appointment online — it only takes a minute."}
            </p>
            <Link
              href="/appointment"
              className="mt-4 block rounded-full bg-brand px-4 py-2.5 text-center text-sm font-semibold text-white transition hover:bg-brand-dark"
            >
              {locale === "bn" ? "অ্যাপয়েন্টমেন্ট নিন" : "Book Now"}
            </Link>
          </div>

          <div className="rounded-xl border border-slate-200 bg-white p-6">
            <h2 className="flex items-center gap-2 font-semibold text-ink">
              <Icon name="shield" className="h-5 w-5 text-brand" />
              {locale === "bn" ? "জরুরি অবস্থায়" : "For Emergencies"}
            </h2>
            <p className="mt-2 text-sm text-muted">
              {locale === "bn"
                ? "জরুরি অবস্থায় নিকটস্থ জরুরি বিভাগে যান অথবা সরাসরি কল করুন।"
                : "For emergencies, visit the nearest emergency department or call directly."}
            </p>
            <a
              href={`tel:${contact.phone.replace(/\s/g, "")}`}
              className="mt-4 inline-block rounded-full bg-red-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-red-700"
            >
              {contact.phone}
            </a>
          </div>
        </aside>
      </div>
    </>
  );
}
