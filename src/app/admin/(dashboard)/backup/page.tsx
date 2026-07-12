"use client";

import { useState, useRef } from "react";
import { useToast } from "@/components/admin/ToastProvider";

export default function BackupPage() {
  const { toast } = useToast();

  // Backup state
  const [backupLoading, setBackupLoading] = useState(false);
  const [lastBackup, setLastBackup] = useState<string | null>(() => {
    if (typeof window !== "undefined") {
      return localStorage.getItem("lastBackupDate");
    }
    return null;
  });

  // Restore state
  const [restoreLoading, setRestoreLoading] = useState(false);
  const [restoreResult, setRestoreResult] = useState<Record<string, number> | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  // Clear state
  const [clearLoading, setClearLoading] = useState(false);
  const [clearConfirm, setClearConfirm] = useState("");

  // Download backup
  const handleBackup = async () => {
    setBackupLoading(true);
    try {
      const res = await fetch("/api/admin/backup");
      if (!res.ok) {
        const data = await res.json().catch(() => ({ error: "Backup failed" }));
        throw new Error(data.error || "Backup failed");
      }

      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = res.headers.get("Content-Disposition")?.split("filename=")[1] || `medisite-backup-${new Date().toISOString().slice(0, 10)}.zip`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      const now = new Date().toISOString();
      localStorage.setItem("lastBackupDate", now);
      setLastBackup(now);
      toast("success", "Backup downloaded successfully");
    } catch (err) {
      toast("error", err instanceof Error ? err.message : "Backup failed");
    } finally {
      setBackupLoading(false);
    }
  };

  // Restore from backup
  const handleRestore = async () => {
    const file = fileRef.current?.files?.[0];
    if (!file) {
      toast("error", "Please select a backup file");
      return;
    }

    if (!file.name.endsWith(".zip")) {
      toast("error", "Please select a .zip file");
      return;
    }

    setRestoreLoading(true);
    setRestoreResult(null);
    try {
      const formData = new FormData();
      formData.append("file", file);

      const res = await fetch("/api/admin/restore", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();
      if (!res.ok || !data.ok) {
        throw new Error(data.error || "Restore failed");
      }

      setRestoreResult(data.counts);
      toast("success", "Data restored successfully!");
      if (fileRef.current) fileRef.current.value = "";
    } catch (err) {
      toast("error", err instanceof Error ? err.message : "Restore failed");
    } finally {
      setRestoreLoading(false);
    }
  };

  // Clear data
  const handleClear = async () => {
    if (clearConfirm !== "CLEAR") {
      toast("error", "Type CLEAR to confirm");
      return;
    }

    setClearLoading(true);
    try {
      const res = await fetch("/api/admin/clear", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ confirm: true }),
      });

      const data = await res.json();
      if (!res.ok || !data.ok) {
        throw new Error(data.error || "Clear failed");
      }

      toast("success", "Data cleared successfully");
      setClearConfirm("");
    } catch (err) {
      toast("error", err instanceof Error ? err.message : "Clear failed");
    } finally {
      setClearLoading(false);
    }
  };

  return (
    <div className="space-y-8 max-w-2xl">
      <h1 className="text-2xl font-bold text-gray-900">Backup & Restore</h1>

      {/* Backup Section */}
      <section className="bg-white rounded-lg border p-6 space-y-4">
        <h2 className="text-lg font-semibold text-gray-900">Download Backup</h2>
        <p className="text-sm text-gray-600">
          Download a complete backup of your database as a ZIP file containing all patients,
          appointments, blog posts, settings, and more.
        </p>
        {lastBackup && (
          <p className="text-xs text-gray-500">
            Last backup: {new Date(lastBackup).toLocaleString()}
          </p>
        )}
        <button
          onClick={handleBackup}
          disabled={backupLoading}
          className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {backupLoading ? "Generating backup..." : "Download Backup"}
        </button>
      </section>

      {/* Restore Section */}
      <section className="bg-white rounded-lg border p-6 space-y-4">
        <h2 className="text-lg font-semibold text-gray-900">Restore from Backup</h2>
        <div className="bg-amber-50 border border-amber-200 rounded-md p-3">
          <p className="text-sm text-amber-800 font-medium">
            ⚠️ Warning: This will REPLACE all current data. Make a backup first!
          </p>
        </div>
        <p className="text-sm text-gray-600">
          Upload a previously downloaded backup ZIP file to restore your data.
          Medicines and investigations will be merged (not replaced).
        </p>
        <input
          ref={fileRef}
          type="file"
          accept=".zip"
          className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-medium file:bg-gray-100 file:text-gray-700 hover:file:bg-gray-200"
        />
        <button
          onClick={handleRestore}
          disabled={restoreLoading}
          className="px-4 py-2 bg-amber-600 text-white text-sm font-medium rounded-md hover:bg-amber-700 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {restoreLoading ? "Restoring..." : "Restore from Backup"}
        </button>
        {restoreResult && (
          <div className="bg-green-50 border border-green-200 rounded-md p-3">
            <p className="text-sm font-medium text-green-800 mb-2">Restore complete:</p>
            <ul className="text-xs text-green-700 space-y-1">
              {Object.entries(restoreResult).map(([key, val]) => (
                <li key={key}>• {key}: {val} records</li>
              ))}
            </ul>
          </div>
        )}
      </section>

      {/* Clear Section */}
      <section className="bg-white rounded-lg border border-red-200 p-6 space-y-4">
        <h2 className="text-lg font-semibold text-red-900">Clear Data</h2>
        <p className="text-sm text-gray-600">
          This will permanently delete selected data from the database. This action cannot be undone.
        </p>
        <div className="text-sm space-y-2">
          <p className="font-medium text-gray-700">Will be CLEARED:</p>
          <ul className="text-xs text-red-700 space-y-1 ml-4">
            <li>• All patients (including consultations & test reports)</li>
            <li>• All appointments</li>
            <li>• All blog posts & revisions</li>
            <li>• All audit logs</li>
            <li>• All upload sessions</li>
            <li>• Settings (reset to defaults)</li>
          </ul>
          <p className="font-medium text-gray-700 mt-3">Will be KEPT:</p>
          <ul className="text-xs text-green-700 space-y-1 ml-4">
            <li>• Medicines database</li>
            <li>• Investigations database</li>
            <li>• User accounts</li>
            <li>• Prescription presets (diagnoses, advices, timing, follow-up options)</li>
          </ul>
        </div>
        <div className="space-y-2">
          <label className="block text-sm font-medium text-gray-700">
            Type <span className="font-mono font-bold text-red-600">CLEAR</span> to confirm:
          </label>
          <input
            type="text"
            value={clearConfirm}
            onChange={(e) => setClearConfirm(e.target.value)}
            placeholder="Type CLEAR"
            className="block w-48 px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500"
          />
        </div>
        <button
          onClick={handleClear}
          disabled={clearLoading || clearConfirm !== "CLEAR"}
          className="px-4 py-2 bg-red-600 text-white text-sm font-medium rounded-md hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {clearLoading ? "Clearing..." : "Clear All Data"}
        </button>
      </section>
    </div>
  );
}
