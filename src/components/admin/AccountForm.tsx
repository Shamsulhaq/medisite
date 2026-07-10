"use client";

import { useActionState } from "react";
import {
  updateAccountAction,
  type AccountState,
} from "@/app/admin/actions";

const initialState: AccountState = {};

const inputClass =
  "mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-ink outline-none transition focus:border-brand focus:ring-2 focus:ring-brand/20";

export default function AccountForm({
  currentUsername,
}: {
  currentUsername: string;
}) {
  const [state, formAction, pending] = useActionState(
    updateAccountAction,
    initialState
  );

  return (
    <form action={formAction} className="space-y-4">
      {state.error && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {state.error}
        </div>
      )}
      {state.success && (
        <div className="rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700">
          {state.success}
        </div>
      )}

      <label className="block">
        <span className="text-sm font-medium text-ink">Username</span>
        <input
          name="username"
          type="text"
          defaultValue={currentUsername}
          autoComplete="username"
          className={inputClass}
        />
      </label>

      <label className="block">
        <span className="text-sm font-medium text-ink">
          Current Password <span className="text-red-500">*</span>
        </span>
        <input
          name="currentPassword"
          type="password"
          required
          autoComplete="current-password"
          className={inputClass}
        />
        <span className="mt-1 block text-xs text-muted">
          Required to confirm any change.
        </span>
      </label>

      <div className="grid gap-4 sm:grid-cols-2">
        <label className="block">
          <span className="text-sm font-medium text-ink">New Password</span>
          <input
            name="newPassword"
            type="password"
            autoComplete="new-password"
            className={inputClass}
          />
        </label>
        <label className="block">
          <span className="text-sm font-medium text-ink">
            Confirm New Password
          </span>
          <input
            name="confirmPassword"
            type="password"
            autoComplete="new-password"
            className={inputClass}
          />
        </label>
      </div>

      <button
        type="submit"
        disabled={pending}
        className="rounded-full bg-slate-800 px-6 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-900 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {pending ? "Updating..." : "Update Account"}
      </button>
    </form>
  );
}
