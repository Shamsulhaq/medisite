"use client";

import { useEffect, useMemo, useState } from "react";
import { t, UI, type Locale } from "@/lib/i18n";
import type { AppointmentConfig, AppointmentMode } from "@/lib/types";
import { generateSlotsForDate, isHoliday, weekdayName, dayMaxPatients } from "@/lib/availability";
import { todayInBD } from "@/lib/utils";

type Status =
  | { state: "idle" }
  | { state: "submitting" }
  | { state: "success"; message: string }
  | { state: "error"; errors: string[] };

const initialForm = {
  name: "",
  email: "",
  phone: "",
  date: "",
  time: "",
  reason: "",
};

export default function AppointmentForm({
  appointment,
  successMessage,
  locale,
}: {
  appointment: AppointmentConfig;
  successMessage: string;
  locale: Locale;
}) {
  const modes = useMemo<AppointmentMode[]>(() => {
    const m: AppointmentMode[] = [];
    if (appointment.chambers.length > 0) m.push("offline");
    if (appointment.online.enabled) m.push("online");
    return m;
  }, [appointment]);

  const [mode, setMode] = useState<AppointmentMode>(modes[0] ?? "offline");
  const [chamberId, setChamberId] = useState(
    appointment.chambers[0]?.id ?? ""
  );
  const [form, setForm] = useState(initialForm);
  const [status, setStatus] = useState<Status>({ state: "idle" });

  const today = todayInBD();

  const selectedAvailability = useMemo(() => {
    if (mode === "online") return appointment.online.availability;
    return appointment.chambers.find((c) => c.id === chamberId)?.availability;
  }, [mode, chamberId, appointment]);

  const slots = useMemo(
    () =>
      form.date && selectedAvailability
        ? generateSlotsForDate(selectedAvailability, form.date)
        : [],
    [form.date, selectedAvailability]
  );

  const dayClosed = form.date !== "" && slots.length === 0;
  const isHol =
    form.date && selectedAvailability
      ? isHoliday(selectedAvailability, form.date)
      : false;

  const [bookedCounts, setBookedCounts] = useState<Record<string, number>>({});
  const maxPerSlot = selectedAvailability?.maxPerSlot ?? 10;

  // Per-day capacity: total booked for the day+location vs the weekday's cap.
  const dayMax =
    form.date && selectedAvailability
      ? dayMaxPatients(selectedAvailability, form.date)
      : 0;
  const dayTotal = Object.values(bookedCounts).reduce((sum, n) => sum + n, 0);
  const dayFull = dayMax > 0 && dayTotal >= dayMax;

  const location = useMemo(() => {
    if (mode === "online") return "Online";
    return appointment.chambers.find((c) => c.id === chamberId)?.name ?? "";
  }, [mode, chamberId, appointment]);

  useEffect(() => {
    if (!form.date || !location) { setBookedCounts({}); return; }
    fetch(`/api/appointments?date=${form.date}&location=${encodeURIComponent(location)}`)
      .then((r) => r.json())
      .then((d) => setBookedCounts(d.counts ?? {}))
      .catch(() => setBookedCounts({}));
  }, [form.date, location]);

  const update =
    (field: keyof typeof form) =>
    (
      e: React.ChangeEvent<
        HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
      >
    ) =>
      setForm((f) => ({ ...f, [field]: e.target.value }));

  const resetTime = () => setForm((f) => ({ ...f, time: "" }));

  const onDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const date = e.target.value;
    const next =
      selectedAvailability ? generateSlotsForDate(selectedAvailability, date) : [];
    setForm((f) => ({ ...f, date, time: next.includes(f.time) ? f.time : "" }));
  };

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setStatus({ state: "submitting" });
    try {
      const res = await fetch("/api/appointments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, mode, chamberId }),
      });
      const data = await res.json();
      if (res.ok && data.ok) {
        setStatus({ state: "success", message: data.message ?? successMessage });
        setForm(initialForm);
      } else {
        setStatus({
          state: "error",
          errors: data.errors ?? ["Unable to submit. Please try again."],
        });
      }
    } catch {
      setStatus({
        state: "error",
        errors: ["Network error. Please check your connection and try again."],
      });
    }
  }

  if (status.state === "success") {
    return (
      <div className="rounded-xl border border-green-200 bg-green-50 p-8 text-center">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-green-100 text-green-600">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="h-7 w-7"
            aria-hidden="true"
          >
            <path d="M20 6 9 17l-5-5" />
          </svg>
        </div>
        <h3 className="mt-4 text-lg font-semibold text-ink">
          {t(UI.requestReceived, locale)}
        </h3>
        <p className="mt-2 text-sm text-muted">{status.message}</p>
        <button
          type="button"
          onClick={() => setStatus({ state: "idle" })}
          className="mt-6 rounded-full bg-brand px-6 py-2.5 text-sm font-semibold text-white transition hover:bg-brand-dark"
        >
          {t(UI.bookAnother, locale)}
        </button>
      </div>
    );
  }

  const inputClass =
    "mt-1 w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm text-ink outline-none transition focus:border-brand focus:ring-2 focus:ring-brand/20";

  const selectedChamber = appointment.chambers.find((c) => c.id === chamberId);

  return (
    <form
      onSubmit={handleSubmit}
      className="rounded-xl border border-slate-200 bg-white p-6 sm:p-8"
      noValidate
    >
      {status.state === "error" && (
        <div className="mb-6 rounded-lg border border-red-200 bg-red-50 p-4">
          <ul className="list-disc space-y-1 pl-5 text-sm text-red-600">
            {status.errors.map((err, i) => (
              <li key={i}>{err}</li>
            ))}
          </ul>
        </div>
      )}

      {/* Consultation type */}
      {modes.length > 0 && (
        <div className="mb-5">
          <span className="text-sm font-medium text-ink">
            Consultation Type
          </span>
          <div className="mt-2 inline-flex rounded-lg border border-slate-300 p-1">
            {modes.map((m) => (
              <button
                key={m}
                type="button"
                onClick={() => {
                  setMode(m);
                  resetTime();
                }}
                className={`rounded-md px-4 py-1.5 text-sm font-medium transition ${
                  mode === m
                    ? "bg-brand text-white"
                    : "text-muted hover:text-ink"
                }`}
              >
                {m === "online" ? "Online" : "In-person"}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Chamber selection (offline) */}
      {mode === "offline" && appointment.chambers.length > 0 && (
        <div className="mb-5">
          <label htmlFor="chamber" className="text-sm font-medium text-ink">
            Chamber <span className="text-red-500">*</span>
          </label>
          {appointment.chambers.length > 1 ? (
            <select
              id="chamber"
              value={chamberId}
              onChange={(e) => {
                setChamberId(e.target.value);
                resetTime();
              }}
              className={inputClass}
            >
              {appointment.chambers.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          ) : (
            <p className="mt-1 text-sm font-medium text-ink">
              {selectedChamber?.name}
            </p>
          )}

          {/* Chamber details card */}
          {selectedChamber && (
            <div className="mt-3 rounded-lg border border-slate-200 bg-slate-50 p-4">
              <div className="flex gap-4">
                {selectedChamber.photo && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={selectedChamber.photo}
                    alt={selectedChamber.name}
                    className="h-20 w-20 shrink-0 rounded-lg object-cover ring-1 ring-slate-200"
                  />
                )}
                <div className="min-w-0 flex-1 space-y-1.5">
                  {selectedChamber.address && (
                    <p className="flex items-start gap-1.5 text-sm text-muted">
                      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="mt-0.5 h-4 w-4 shrink-0 text-brand" aria-hidden="true"><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0z"/><circle cx="12" cy="10" r="3"/></svg>
                      {selectedChamber.address}
                    </p>
                  )}
                  {selectedChamber.phone && (
                    <p className="flex items-center gap-1.5 text-sm text-muted">
                      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4 shrink-0 text-brand" aria-hidden="true"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.13.96.36 1.9.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.9.34 1.85.57 2.81.7A2 2 0 0 1 22 16.92z"/></svg>
                      <a href={`tel:${selectedChamber.phone.replace(/\s/g, "")}`} className="hover:text-brand">{selectedChamber.phone}</a>
                    </p>
                  )}
                  {selectedChamber.description && (
                    <p className="text-sm text-muted">
                      {selectedChamber.description}
                    </p>
                  )}
                  {selectedChamber.mapUrl && (
                    <a
                      href={selectedChamber.mapUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-xs font-medium text-brand hover:text-brand-dark"
                    >
                      View on map →
                    </a>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Online info */}
      {mode === "online" && (
        <div className="mb-5 rounded-lg border border-brand-light bg-brand-light/30 px-4 py-3 text-sm text-slate-700">
          <span className="font-medium text-brand-dark">
            {appointment.online.platform}
          </span>
          {appointment.online.instructions && (
            <p className="mt-0.5 text-xs">{appointment.online.instructions}</p>
          )}
        </div>
      )}

      <div className="grid gap-5 sm:grid-cols-2">
        <div className="sm:col-span-2">
          <label htmlFor="name" className="text-sm font-medium text-ink">
            {t(UI.fullName, locale)} <span className="text-red-500">*</span>
          </label>
          <input
            id="name"
            type="text"
            required
            value={form.name}
            onChange={update("name")}
            className={inputClass}
            autoComplete="name"
          />
        </div>

        <div>
          <label htmlFor="email" className="text-sm font-medium text-ink">
            {t(UI.email, locale)} <span className="text-xs text-muted">(optional)</span>
          </label>
          <input
            id="email"
            type="email"
            value={form.email}
            onChange={update("email")}
            className={inputClass}
            placeholder="you@example.com"
            autoComplete="email"
          />
        </div>

        <div>
          <label htmlFor="phone" className="text-sm font-medium text-ink">
            {t(UI.phone, locale)} <span className="text-red-500">*</span>
          </label>
          <input
            id="phone"
            type="tel"
            required
            value={form.phone}
            onChange={update("phone")}
            className={inputClass}
            placeholder="+880 1XXX-XXXXXX"
            autoComplete="tel"
          />
        </div>

        <div>
          <label htmlFor="date" className="text-sm font-medium text-ink">
            {t(UI.preferredDate, locale)}{" "}
            <span className="text-red-500">*</span>
          </label>
          <input
            id="date"
            type="date"
            required
            min={today}
            value={form.date}
            onChange={onDateChange}
            className={inputClass}
          />
          {form.date && (
            <p className="mt-1 text-xs text-muted">{weekdayName(form.date)}</p>
          )}
        </div>

        <div>
          <label htmlFor="time" className="text-sm font-medium text-ink">
            {t(UI.preferredTime, locale)}{" "}
            <span className="text-red-500">*</span>
          </label>
          <select
            id="time"
            required
            value={form.time}
            onChange={update("time")}
            disabled={!form.date || dayClosed || dayFull}
            className={`${inputClass} disabled:cursor-not-allowed disabled:bg-slate-50 disabled:text-slate-400`}
          >
            <option value="">
              {!form.date
                ? "Select a date first"
                : dayClosed
                  ? "Not available"
                  : dayFull
                    ? "Fully booked for this day"
                    : t(UI.selectTimeSlot, locale)}
            </option>
            {slots.map((slot) => {
              const full = dayFull || (bookedCounts[slot] ?? 0) >= maxPerSlot;
              return (
                <option key={slot} value={slot} disabled={full}>
                  {slot}{full ? " (Full)" : ""}
                </option>
              );
            })}
          </select>
          {form.date && !dayClosed && dayMax > 0 && (
            <p className="mt-1 text-xs text-muted">
              {Math.max(0, dayMax - dayTotal)} of {dayMax} slots left for this day
            </p>
          )}
        </div>

        {dayClosed && (
          <div className="sm:col-span-2 rounded-lg border border-amber-200 bg-amber-50 px-4 py-2.5 text-sm text-amber-700">
            {isHol
              ? "Closed on this date (holiday). Please choose another day."
              : "Not available on this day for the selected option. Please choose another day."}
          </div>
        )}

        {!dayClosed && dayFull && (
          <div className="sm:col-span-2 rounded-lg border border-amber-200 bg-amber-50 px-4 py-2.5 text-sm text-amber-700">
            This day is fully booked ({dayMax} patients). Please choose another day.
          </div>
        )}

        <div className="sm:col-span-2">
          <label htmlFor="reason" className="text-sm font-medium text-ink">
            {t(UI.reasonForVisit, locale)}
          </label>
          <textarea
            id="reason"
            rows={4}
            value={form.reason}
            onChange={update("reason")}
            className={inputClass}
            placeholder={t(UI.reasonPlaceholder, locale)}
            maxLength={1000}
          />
        </div>
      </div>

      <button
        type="submit"
        disabled={status.state === "submitting" || dayClosed || dayFull || !form.time}
        className="mt-6 w-full rounded-full bg-brand px-6 py-3 text-sm font-semibold text-white transition hover:bg-brand-dark disabled:cursor-not-allowed disabled:opacity-60"
      >
        {status.state === "submitting"
          ? t(UI.submitting, locale)
          : t(UI.requestAppointment, locale)}
      </button>
      <p className="mt-3 text-center text-xs text-muted">
        {t(UI.formNote, locale)}
      </p>
    </form>
  );
}
