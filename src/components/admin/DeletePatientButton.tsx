"use client";

import { useTransition } from "react";
import { deletePatientAction } from "@/app/admin/patient-actions";

export default function DeletePatientButton({
  id,
  name,
}: {
  id: string;
  name: string;
}) {
  const [pending, startTransition] = useTransition();

  function handleDelete() {
    if (
      !confirm(
        `Delete patient "${name}" and all their records? This cannot be undone.`
      )
    )
      return;
    startTransition(async () => {
      await deletePatientAction(id);
    });
  }

  return (
    <button
      type="button"
      onClick={handleDelete}
      disabled={pending}
      className="rounded-lg border border-red-200 px-4 py-2 text-sm font-medium text-red-600 transition hover:bg-red-50 disabled:opacity-50"
    >
      {pending ? "Deleting..." : "Delete Patient"}
    </button>
  );
}
