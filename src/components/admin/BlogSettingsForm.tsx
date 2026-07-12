"use client";

import { useState } from "react";
import type { SiteSettings } from "@/lib/types";
import { saveSettingsAction } from "@/app/admin/actions";

const inputClass =
  "mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-ink outline-none transition focus:border-brand focus:ring-2 focus:ring-brand/20";

export default function BlogSettingsForm({ initial }: { initial: SiteSettings }) {
  const [categories, setCategories] = useState<string[]>(initial.blog?.categories ?? []);
  const [disclaimer, setDisclaimer] = useState(initial.blog?.defaultDisclaimer ?? "");
  const [newCategory, setNewCategory] = useState("");
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  function addCategory() {
    const trimmed = newCategory.trim();
    if (trimmed && !categories.includes(trimmed)) {
      setCategories([...categories, trimmed]);
      setNewCategory("");
    }
  }

  function removeCategory(index: number) {
    setCategories(categories.filter((_, i) => i !== index));
  }

  function updateCategory(index: number, value: string) {
    const updated = [...categories];
    updated[index] = value;
    setCategories(updated);
  }

  async function handleSave() {
    setSaving(true);
    setMessage(null);
    try {
      const updated: SiteSettings = {
        ...initial,
        blog: {
          categories: categories.filter((c) => c.trim()),
          defaultDisclaimer: disclaimer,
        },
      };
      const result = await saveSettingsAction(updated);
      if (result.ok) {
        setMessage({ type: "success", text: "Blog settings saved." });
      } else {
        setMessage({ type: "error", text: result.error ?? "Failed to save." });
      }
    } catch {
      setMessage({ type: "error", text: "Failed to save settings." });
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="max-w-2xl space-y-6">
      <h2 className="text-lg font-bold text-ink">Blog Settings</h2>

      {message && (
        <div
          className={`rounded-lg border px-4 py-3 text-sm ${
            message.type === "success"
              ? "border-green-200 bg-green-50 text-green-700"
              : "border-red-200 bg-red-50 text-red-700"
          }`}
        >
          {message.text}
        </div>
      )}

      {/* Categories */}
      <div>
        <span className="text-sm font-medium text-ink">Blog Categories</span>
        <p className="text-xs text-muted mt-0.5">
          These appear as options in the post editor.
        </p>
        <div className="mt-3 space-y-2">
          {categories.map((cat, i) => (
            <div key={i} className="flex items-center gap-2">
              <input
                value={cat}
                onChange={(e) => updateCategory(i, e.target.value)}
                className={inputClass + " flex-1"}
              />
              <button
                type="button"
                onClick={() => removeCategory(i)}
                className="rounded px-2 py-1 text-xs font-medium text-red-600 hover:bg-red-50"
              >
                Remove
              </button>
            </div>
          ))}
        </div>
        <div className="mt-3 flex gap-2">
          <input
            value={newCategory}
            onChange={(e) => setNewCategory(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                addCategory();
              }
            }}
            className={inputClass + " flex-1"}
            placeholder="New category name"
          />
          <button
            type="button"
            onClick={addCategory}
            className="rounded-lg bg-brand px-4 py-2 text-sm font-medium text-white hover:bg-brand-dark"
          >
            Add
          </button>
        </div>
      </div>

      {/* Default Disclaimer */}
      <div>
        <label className="block">
          <span className="text-sm font-medium text-ink">Default Medical Disclaimer</span>
          <p className="text-xs text-muted mt-0.5">
            Shown on all blog posts unless overridden per post.
          </p>
          <textarea
            value={disclaimer}
            onChange={(e) => setDisclaimer(e.target.value)}
            rows={4}
            className={inputClass}
            placeholder="This content is for informational purposes only..."
          />
        </label>
      </div>

      <button
        type="button"
        onClick={handleSave}
        disabled={saving}
        className="rounded-full bg-brand px-6 py-2.5 text-sm font-semibold text-white transition hover:bg-brand-dark disabled:opacity-60"
      >
        {saving ? "Saving..." : "Save Blog Settings"}
      </button>
    </div>
  );
}
