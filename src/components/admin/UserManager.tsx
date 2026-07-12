"use client";

import { useState, useEffect } from "react";
import { getUsersAction, createUserAction, updateUserAction } from "@/app/admin/user-actions";
import type { UserRole } from "@prisma/client";

type UserPermissions = {
  canCreatePatient: boolean;
  canAddVitals: boolean;
  canConfirmAppointment: boolean;
  canPrintPrescription: boolean;
  canCollectFee: boolean;
  canViewPatients: boolean;
  canViewAppointments: boolean;
  canWriteRx: boolean;
  canEditConsultation: boolean;
  canManageSettings: boolean;
  canManageBlog: boolean;
  canManageMedicines: boolean;
  canManageUsers: boolean;
};

type UserData = {
  id: string;
  username: string;
  role: UserRole;
  displayName: string;
  active: boolean;
  permissions: UserPermissions;
};

const PERMISSION_LABELS: Record<keyof UserPermissions, string> = {
  canCreatePatient: "Create Patients",
  canAddVitals: "Add Vitals",
  canConfirmAppointment: "Confirm Appointments",
  canPrintPrescription: "Print Prescriptions",
  canCollectFee: "Collect Fees",
  canViewPatients: "View Patients",
  canViewAppointments: "View Appointments",
  canWriteRx: "Write Prescriptions (Rx)",
  canEditConsultation: "Edit Consultations",
  canManageSettings: "Manage Settings",
  canManageBlog: "Manage Blog",
  canManageMedicines: "Manage Medicines",
  canManageUsers: "Manage Users",
};

export default function UserManager() {
  const [users, setUsers] = useState<UserData[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [editingUser, setEditingUser] = useState<UserData | null>(null);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // Create form state
  const [newUsername, setNewUsername] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [newRole, setNewRole] = useState<UserRole>("ATTENDANT");
  const [newDisplayName, setNewDisplayName] = useState("");

  useEffect(() => {
    loadUsers();
  }, []);

  async function loadUsers() {
    setLoading(true);
    try {
      const data = await getUsersAction();
      setUsers(data as UserData[]);
    } catch (err) {
      setError("Failed to load users");
    } finally {
      setLoading(false);
    }
  }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setSuccess("");

    const result = await createUserAction({
      username: newUsername,
      password: newPassword,
      role: newRole,
      displayName: newDisplayName || newUsername,
    });

    if (result.ok) {
      setSuccess("User created successfully.");
      setShowCreate(false);
      setNewUsername("");
      setNewPassword("");
      setNewRole("ATTENDANT");
      setNewDisplayName("");
      loadUsers();
    } else {
      setError(result.error || "Failed to create user.");
    }
  }

  async function handleToggleActive(user: UserData) {
    const result = await updateUserAction(user.id, { active: !user.active });
    if (result.ok) {
      loadUsers();
    } else {
      setError(result.error || "Failed to update user.");
    }
  }

  async function handlePermissionChange(userId: string, permission: keyof UserPermissions, value: boolean) {
    const result = await updateUserAction(userId, {
      permissions: { [permission]: value },
    });
    if (result.ok) {
      loadUsers();
      if (editingUser?.id === userId) {
        setEditingUser((prev) =>
          prev ? { ...prev, permissions: { ...prev.permissions, [permission]: value } } : null
        );
      }
    } else {
      setError(result.error || "Failed to update permissions.");
    }
  }

  async function handlePasswordReset(userId: string, newPass: string) {
    if (!newPass || newPass.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }
    const result = await updateUserAction(userId, { password: newPass });
    if (result.ok) {
      setSuccess("Password reset successfully.");
    } else {
      setError(result.error || "Failed to reset password.");
    }
  }

  if (loading) {
    return <div className="flex items-center justify-center py-12 text-muted">Loading users...</div>;
  }

  return (
    <div className="space-y-6">
      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
          <button onClick={() => setError("")} className="ml-2 font-medium underline">dismiss</button>
        </div>
      )}
      {success && (
        <div className="rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700">
          {success}
          <button onClick={() => setSuccess("")} className="ml-2 font-medium underline">dismiss</button>
        </div>
      )}

      {/* User list */}
      <div className="rounded-xl border border-slate-200 bg-white">
        <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
          <h2 className="text-lg font-semibold text-ink">Users</h2>
          <button
            onClick={() => setShowCreate(true)}
            className="rounded-lg bg-brand px-4 py-2 text-sm font-medium text-white hover:bg-brand/90 transition"
          >
            Add User
          </button>
        </div>

        <div className="divide-y divide-slate-100">
          {users.map((user) => (
            <div key={user.id} className="flex items-center gap-4 px-5 py-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-brand/10 text-sm font-semibold text-brand">
                {user.displayName.slice(0, 2).toUpperCase()}
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <p className="font-medium text-ink">{user.displayName}</p>
                  <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${
                    user.role === "DOCTOR" ? "bg-purple-100 text-purple-700" : "bg-blue-100 text-blue-700"
                  }`}>
                    {user.role}
                  </span>
                  {!user.active && (
                    <span className="inline-flex rounded-full bg-red-100 px-2 py-0.5 text-xs font-medium text-red-700">
                      Inactive
                    </span>
                  )}
                </div>
                <p className="text-sm text-muted">@{user.username}</p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setEditingUser(user)}
                  className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-medium text-muted hover:border-brand hover:text-brand transition"
                >
                  Permissions
                </button>
                <button
                  onClick={() => handleToggleActive(user)}
                  className={`rounded-lg border px-3 py-1.5 text-xs font-medium transition ${
                    user.active
                      ? "border-red-200 text-red-600 hover:bg-red-50"
                      : "border-green-200 text-green-600 hover:bg-green-50"
                  }`}
                >
                  {user.active ? "Deactivate" : "Activate"}
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Create user modal */}
      {showCreate && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50" onClick={() => setShowCreate(false)}>
          <div className="w-full max-w-md rounded-xl bg-white p-6 shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-lg font-semibold text-ink mb-4">Add User</h3>
            <form onSubmit={handleCreate} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-ink mb-1">Username</label>
                <input
                  type="text"
                  value={newUsername}
                  onChange={(e) => setNewUsername(e.target.value)}
                  required
                  minLength={3}
                  className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-brand focus:ring-2 focus:ring-brand/20"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-ink mb-1">Display Name</label>
                <input
                  type="text"
                  value={newDisplayName}
                  onChange={(e) => setNewDisplayName(e.target.value)}
                  placeholder="Optional"
                  className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-brand focus:ring-2 focus:ring-brand/20"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-ink mb-1">Password</label>
                <input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  required
                  minLength={6}
                  className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-brand focus:ring-2 focus:ring-brand/20"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-ink mb-1">Role</label>
                <select
                  value={newRole}
                  onChange={(e) => setNewRole(e.target.value as UserRole)}
                  className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-brand focus:ring-2 focus:ring-brand/20"
                >
                  <option value="ATTENDANT">Attendant</option>
                  <option value="DOCTOR">Doctor</option>
                </select>
              </div>
              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowCreate(false)}
                  className="flex-1 rounded-lg border border-slate-200 px-4 py-2 text-sm font-medium text-muted hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 rounded-lg bg-brand px-4 py-2 text-sm font-medium text-white hover:bg-brand/90"
                >
                  Create User
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit permissions modal */}
      {editingUser && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50" onClick={() => setEditingUser(null)}>
          <div className="w-full max-w-lg max-h-[80vh] overflow-y-auto rounded-xl bg-white p-6 shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-ink">
                Permissions — {editingUser.displayName}
              </h3>
              <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${
                editingUser.role === "DOCTOR" ? "bg-purple-100 text-purple-700" : "bg-blue-100 text-blue-700"
              }`}>
                {editingUser.role}
              </span>
            </div>

            <div className="space-y-3">
              {(Object.entries(PERMISSION_LABELS) as Array<[keyof UserPermissions, string]>).map(([key, label]) => (
                <label key={key} className="flex items-center gap-3 rounded-lg px-3 py-2 hover:bg-slate-50 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={editingUser.permissions[key]}
                    onChange={(e) => handlePermissionChange(editingUser.id, key, e.target.checked)}
                    className="h-4 w-4 rounded border-slate-300 text-brand focus:ring-brand/20"
                  />
                  <span className="text-sm text-ink">{label}</span>
                </label>
              ))}
            </div>

            {/* Password reset */}
            <div className="mt-6 border-t border-slate-100 pt-4">
              <h4 className="text-sm font-medium text-ink mb-2">Reset Password</h4>
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  const form = e.target as HTMLFormElement;
                  const pass = (form.elements.namedItem("resetPass") as HTMLInputElement).value;
                  handlePasswordReset(editingUser.id, pass);
                  form.reset();
                }}
                className="flex gap-2"
              >
                <input
                  name="resetPass"
                  type="password"
                  placeholder="New password (min 6)"
                  minLength={6}
                  className="flex-1 rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-brand focus:ring-2 focus:ring-brand/20"
                />
                <button
                  type="submit"
                  className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-medium text-muted hover:border-brand hover:text-brand"
                >
                  Reset
                </button>
              </form>
            </div>

            <div className="mt-4 flex justify-end">
              <button
                onClick={() => setEditingUser(null)}
                className="rounded-lg bg-brand px-4 py-2 text-sm font-medium text-white hover:bg-brand/90"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
