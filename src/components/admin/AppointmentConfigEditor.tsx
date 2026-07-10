"use client";

import { useState } from "react";
import type { AppointmentConfig, Availability, Chamber } from "@/lib/types";
import { defaultAvailability } from "@/lib/availability";
import { Section, TextField, AddButton } from "@/components/admin/fields";
import AvailabilityEditor from "@/components/admin/AvailabilityEditor";
import ImageUpload from "@/components/admin/ImageUpload";
import AdminIcon from "@/components/admin/AdminIcon";

function newId(): string {
  const g = globalThis as { crypto?: { randomUUID?: () => string } };
  return g.crypto?.randomUUID?.() ?? `ch-${Math.random().toString(36).slice(2)}`;
}

type Tab = "inperson" | "online";

export default function AppointmentConfigEditor({
  value,
  onChange,
}: {
  value: AppointmentConfig;
  onChange: (c: AppointmentConfig) => void;
}) {
  const [tab, setTab] = useState<Tab>("inperson");
  const [openId, setOpenId] = useState<string | null>(
    value.chambers[0]?.id ?? null
  );

  const setOnline = (patch: Partial<AppointmentConfig["online"]>) =>
    onChange({ ...value, online: { ...value.online, ...patch } });

  const setChamber = (id: string, patch: Partial<Chamber>) =>
    onChange({
      ...value,
      chambers: value.chambers.map((c) =>
        c.id === id ? { ...c, ...patch } : c
      ),
    });

  const setChamberAvailability = (id: string, a: Availability) =>
    setChamber(id, { availability: a });

  const addChamber = () => {
    const id = newId();
    onChange({
      ...value,
      chambers: [
        ...value.chambers,
        {
          id,
          name: "",
          address: "",
          phone: "",
          mapUrl: "",
          description: "",
          photo: "",
          availability: defaultAvailability,
        },
      ],
    });
    setOpenId(id);
  };

  const removeChamber = (id: string) => {
    onChange({
      ...value,
      chambers: value.chambers.filter((c) => c.id !== id),
    });
    if (openId === id) setOpenId(null);
  };

  return (
    <div className="space-y-6">
      {/* Tab bar: In-person / Online */}
      <div className="inline-flex rounded-lg border border-slate-300 p-1">
        <button
          type="button"
          onClick={() => setTab("inperson")}
          className={`rounded-md px-5 py-2 text-sm font-medium transition ${
            tab === "inperson"
              ? "bg-brand text-white shadow-sm"
              : "text-muted hover:text-ink"
          }`}
        >
          In-person
        </button>
        <button
          type="button"
          onClick={() => setTab("online")}
          className={`rounded-md px-5 py-2 text-sm font-medium transition ${
            tab === "online"
              ? "bg-brand text-white shadow-sm"
              : "text-muted hover:text-ink"
          }`}
        >
          Online
        </button>
      </div>

      {/* IN-PERSON TAB */}
      {tab === "inperson" && (
        <div className="space-y-4">
          {value.chambers.length === 0 && (
            <div className="rounded-xl border border-dashed border-slate-300 bg-white p-8 text-center text-sm text-muted">
              No chambers yet. Add one so patients can book in-person visits.
            </div>
          )}

          {/* Chambers list */}
          {value.chambers.map((chamber) => {
            const isOpen = openId === chamber.id;
            return (
              <div
                key={chamber.id}
                className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm"
              >
                {/* Header (click to expand/collapse) */}
                <button
                  type="button"
                  onClick={() => setOpenId(isOpen ? null : chamber.id)}
                  className="flex w-full items-center gap-3 px-5 py-4 text-left transition hover:bg-slate-50"
                >
                  {chamber.photo ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={chamber.photo}
                      alt=""
                      className="h-10 w-10 shrink-0 rounded-lg object-cover ring-1 ring-slate-200"
                    />
                  ) : (
                    <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-slate-400">
                      <AdminIcon name="location" className="h-5 w-5" />
                    </span>
                  )}
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold text-ink">
                      {chamber.name || "Untitled Chamber"}
                    </p>
                    {chamber.address && (
                      <p className="truncate text-xs text-muted">
                        {chamber.address}
                      </p>
                    )}
                  </div>
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className={`h-5 w-5 shrink-0 text-slate-400 transition-transform ${
                      isOpen ? "rotate-180" : ""
                    }`}
                    aria-hidden="true"
                  >
                    <path d="m6 9 6 6 6-6" />
                  </svg>
                </button>

                {/* Expanded content */}
                {isOpen && (
                  <div className="border-t border-slate-100 p-5">
                    <div className="grid gap-4 sm:grid-cols-2">
                      <TextField
                        label="Chamber Name"
                        value={chamber.name}
                        onChange={(v) => setChamber(chamber.id, { name: v })}
                        placeholder="e.g. Evening Chamber"
                      />
                      <TextField
                        label="Address"
                        value={chamber.address}
                        onChange={(v) => setChamber(chamber.id, { address: v })}
                        placeholder="Street, area, city"
                      />
                      <TextField
                        label="Phone"
                        value={chamber.phone}
                        onChange={(v) => setChamber(chamber.id, { phone: v })}
                        placeholder="+880 1XXX-XXXXXX"
                      />
                      <TextField
                        label="Map / Direction Link"
                        value={chamber.mapUrl}
                        onChange={(v) => setChamber(chamber.id, { mapUrl: v })}
                        placeholder="https://maps.google.com/..."
                      />
                    </div>
                    <div className="mt-4">
                      <TextField
                        label="Description / Notes"
                        value={chamber.description}
                        onChange={(v) =>
                          setChamber(chamber.id, { description: v })
                        }
                        placeholder="Floor, landmarks, parking info, etc."
                      />
                    </div>
                    <div className="mt-4">
                      <ImageUpload
                        label="Chamber Photo"
                        value={chamber.photo}
                        onChange={(url) =>
                          setChamber(chamber.id, { photo: url })
                        }
                      />
                    </div>

                    <div className="mt-5 rounded-lg border border-slate-200 bg-slate-50 p-4">
                      <p className="mb-3 text-sm font-semibold text-ink">
                        Schedule
                      </p>
                      <AvailabilityEditor
                        value={chamber.availability}
                        onChange={(a) =>
                          setChamberAvailability(chamber.id, a)
                        }
                      />
                    </div>

                    <div className="mt-4 flex justify-end">
                      <button
                        type="button"
                        onClick={() => removeChamber(chamber.id)}
                        className="text-sm font-medium text-red-600 transition hover:text-red-700"
                      >
                        Remove this chamber
                      </button>
                    </div>
                  </div>
                )}
              </div>
            );
          })}

          <AddButton label="Add chamber" onClick={addChamber} />
        </div>
      )}

      {/* ONLINE TAB */}
      {tab === "online" && (
        <Section
          title="Online Consultation"
          description="Video appointments via Zoom, Google Meet, etc."
        >
          <label className="flex items-center gap-3 rounded-lg border border-slate-200 bg-slate-50 p-3">
            <input
              type="checkbox"
              checked={value.online.enabled}
              onChange={(e) => setOnline({ enabled: e.target.checked })}
              className="h-4 w-4 rounded border-slate-300 text-brand focus:ring-brand"
            />
            <span className="text-sm font-medium text-ink">
              Offer online consultations
            </span>
          </label>

          {value.online.enabled && (
            <>
              <div className="grid gap-4 sm:grid-cols-2">
                <TextField
                  label="Platform"
                  value={value.online.platform}
                  onChange={(v) => setOnline({ platform: v })}
                  placeholder="Zoom / Google Meet"
                />
              </div>
              <TextField
                label="Instructions (shown to patient after booking)"
                value={value.online.instructions}
                onChange={(v) => setOnline({ instructions: v })}
                placeholder="A meeting link will be shared after confirmation."
              />
              <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
                <p className="mb-3 text-sm font-semibold text-ink">
                  Online Schedule
                </p>
                <AvailabilityEditor
                  value={value.online.availability}
                  onChange={(a) => setOnline({ availability: a })}
                />
              </div>
            </>
          )}
        </Section>
      )}
    </div>
  );
}
