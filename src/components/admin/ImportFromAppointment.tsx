"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import type { Appointment } from "@/lib/types";
import { createPatientFromAppointmentAction } from "@/app/admin/patient-actions";
import { useToast } from "@/components/admin/ToastProvider";

export default function ImportFromAppointment({
  appointments,
}: {
  appointments: Appointment[];
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const { toast } = useToast();

  function importPatient(id: string) {
    startTransition(async () => {
      try {
        const res = await createPatientFromAppointmentAction(id);
        if (res.ok && res.id) {
          router.push(`/admin/patients/${res.id}`);
          router.refresh();
        } else if (res.error) {
          toast("error", res.error);
        }
      } catch {
        toast("error", "Something went wrong");
      }
    });
  }

  if (appointments.length === 0) {
    return (
      <p className="text-sm text-muted">
        No new appointments to import. All existing appointment contacts are
        already patients.
      </p>
    );
  }

  return (
    <div className={`space-y-2 ${pending ? "opacity-60" : ""}`}>
      <p className="text-sm text-muted">
        Select an appointment to create a patient from:
      </p>
      <ul className="max-h-72 divide-y divide-slate-100 overflow-y-auto rounded-lg border border-slate-200">
        {appointments.map((a) => (
          <li
            key={a.id}
            className="flex items-center justify-between gap-3 px-4 py-3 transition hover:bg-slate-50"
          >
            <div className="min-w-0">
              <p className="truncate text-sm font-medium text-ink">{a.name}</p>
              <p className="truncate text-xs text-muted">
                {a.phone} · {a.date} · {a.time}
              </p>
            </div>
            <button
              type="button"
              disabled={pending}
              onClick={() => importPatient(a.id)}
              className="shrink-0 rounded-lg bg-brand px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-brand-dark disabled:opacity-50"
            >
              Import
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}
