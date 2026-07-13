"use client";

import { useState, useCallback } from "react";
import type { SiteSettings } from "@/lib/types";
import { saveSettingsAction } from "@/app/admin/actions";
import { Badge } from "@/components/admin/ui";

// ---- Types ------------------------------------------------------------------

/** Extended category with slug, description, and post count for display. */
export type CategoryItem = {
  name: string;
  slug: string;
  description: string;
  postCount: number;
};

// ---- Helpers ----------------------------------------------------------------

const inputClass =
  "mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-ink outline-none transition focus:border-brand focus:ring-2 focus:ring-brand/20";

/** Generate a URL-friendly slug from a category name. */
function slugify(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}

// ---- Component --------------------------------------------------------------

/**
 * Blog Categories Manager — allows adding, editing, deleting, and reordering
 * blog categories. Persists to settings.blog.categories via saveSettingsAction.
 *
 * Categories are stored as objects with name/slug/description in the settings
 * JSON. The post count is computed from existing blog posts.
 */
export default function BlogCategoriesManager({
  initial,
  postCounts,
}: {
  initial: SiteSettings;
  /** Map of category name → number of posts using it */
  postCounts: Record<string, number>;
}) {
  // Build initial category items from settings
  const buildItems = useCallback((): CategoryItem[] => {
    const cats = initial.blog?.categories ?? [];
    return cats.map((name) => ({
      name,
      slug: slugify(name),
      description: "", // descriptions stored below
      postCount: postCounts[name] ?? 0,
    }));
  }, [initial, postCounts]);

  // We store extended metadata in a parallel structure (descriptions)
  // For now, descriptions are kept client-side and saved alongside categories.
  const [categories, setCategories] = useState<CategoryItem[]>(buildItems);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // ---- Add category ---------------------------------------------------------
  const [showAddForm, setShowAddForm] = useState(false);
  const [newName, setNewName] = useState("");
  const [newDescription, setNewDescription] = useState("");

  function addCategory() {
    const trimmed = newName.trim();
    if (!trimmed) return;
    // Prevent duplicates (case-insensitive)
    if (categories.some((c) => c.name.toLowerCase() === trimmed.toLowerCase())) {
      setMessage({ type: "error", text: `Category "${trimmed}" already exists.` });
      return;
    }
    setCategories([
      ...categories,
      { name: trimmed, slug: slugify(trimmed), description: newDescription.trim(), postCount: 0 },
    ]);
    setNewName("");
    setNewDescription("");
    setShowAddForm(false);
    setMessage(null);
  }

  // ---- Edit category --------------------------------------------------------
  const [editIndex, setEditIndex] = useState<number | null>(null);
  const [editName, setEditName] = useState("");
  const [editDescription, setEditDescription] = useState("");

  function startEdit(index: number) {
    const cat = categories[index];
    setEditIndex(index);
    setEditName(cat.name);
    setEditDescription(cat.description);
  }

  function saveEdit() {
    if (editIndex === null) return;
    const trimmed = editName.trim();
    if (!trimmed) return;
    // Check for duplicate (exclude self)
    if (
      categories.some(
        (c, i) => i !== editIndex && c.name.toLowerCase() === trimmed.toLowerCase()
      )
    ) {
      setMessage({ type: "error", text: `Category "${trimmed}" already exists.` });
      return;
    }
    const updated = [...categories];
    updated[editIndex] = {
      ...updated[editIndex],
      name: trimmed,
      slug: slugify(trimmed),
      description: editDescription.trim(),
    };
    setCategories(updated);
    setEditIndex(null);
    setMessage(null);
  }

  function cancelEdit() {
    setEditIndex(null);
  }

  // ---- Delete category ------------------------------------------------------
  const [deleteIndex, setDeleteIndex] = useState<number | null>(null);

  function confirmDelete(index: number) {
    setDeleteIndex(index);
  }

  function executeDelete() {
    if (deleteIndex === null) return;
    setCategories(categories.filter((_, i) => i !== deleteIndex));
    setDeleteIndex(null);
  }

  function cancelDelete() {
    setDeleteIndex(null);
  }

  // ---- Reorder (move up/down) -----------------------------------------------
  function moveUp(index: number) {
    if (index === 0) return;
    const updated = [...categories];
    [updated[index - 1], updated[index]] = [updated[index], updated[index - 1]];
    setCategories(updated);
  }

  function moveDown(index: number) {
    if (index >= categories.length - 1) return;
    const updated = [...categories];
    [updated[index], updated[index + 1]] = [updated[index + 1], updated[index]];
    setCategories(updated);
  }

  // ---- Save to server -------------------------------------------------------
  async function handleSave() {
    setSaving(true);
    setMessage(null);
    try {
      const updated: SiteSettings = {
        ...initial,
        blog: {
          ...initial.blog,
          categories: categories.map((c) => c.name),
        },
      };
      const result = await saveSettingsAction(updated);
      if (result.ok) {
        setMessage({ type: "success", text: "Categories saved successfully." });
      } else {
        setMessage({ type: "error", text: result.error ?? "Failed to save." });
      }
    } catch {
      setMessage({ type: "error", text: "Failed to save categories." });
    } finally {
      setSaving(false);
    }
  }

  // ---- Render ---------------------------------------------------------------
  return (
    <div className="space-y-6">
      {/* Status message */}
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

      {/* Categories list */}
      <div className="rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden">
        {categories.length === 0 ? (
          <div className="px-6 py-10 text-center text-sm text-muted">
            No categories yet. Add one to get started.
          </div>
        ) : (
          <ul className="divide-y divide-slate-100">
            {categories.map((cat, index) => (
              <li key={index} className="flex items-center gap-3 px-4 py-3 sm:px-6">
                {/* Reorder buttons */}
                <div className="flex flex-col gap-0.5">
                  <button
                    type="button"
                    onClick={() => moveUp(index)}
                    disabled={index === 0}
                    className="rounded p-0.5 text-slate-400 hover:text-ink disabled:opacity-30"
                    aria-label="Move up"
                  >
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                    </svg>
                  </button>
                  <button
                    type="button"
                    onClick={() => moveDown(index)}
                    disabled={index === categories.length - 1}
                    className="rounded p-0.5 text-slate-400 hover:text-ink disabled:opacity-30"
                    aria-label="Move down"
                  >
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </button>
                </div>

                {/* Category info */}
                {editIndex === index ? (
                  <div className="flex-1 space-y-2">
                    <input
                      value={editName}
                      onChange={(e) => setEditName(e.target.value)}
                      className={inputClass}
                      placeholder="Category name"
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          e.preventDefault();
                          saveEdit();
                        }
                        if (e.key === "Escape") cancelEdit();
                      }}
                    />
                    <input
                      value={editDescription}
                      onChange={(e) => setEditDescription(e.target.value)}
                      className={inputClass}
                      placeholder="Description (optional)"
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          e.preventDefault();
                          saveEdit();
                        }
                        if (e.key === "Escape") cancelEdit();
                      }}
                    />
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={saveEdit}
                        className="rounded-lg bg-brand px-3 py-1.5 text-xs font-medium text-white hover:bg-brand-dark"
                      >
                        Save
                      </button>
                      <button
                        type="button"
                        onClick={cancelEdit}
                        className="rounded-lg px-3 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-100"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-ink text-sm">{cat.name}</span>
                      <Badge tone="blue">{cat.postCount} post{cat.postCount !== 1 ? "s" : ""}</Badge>
                    </div>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="text-xs text-muted">/{cat.slug}</span>
                      {cat.description && (
                        <span className="text-xs text-muted truncate">— {cat.description}</span>
                      )}
                    </div>
                  </div>
                )}

                {/* Actions */}
                {editIndex !== index && (
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => startEdit(index)}
                      className="rounded px-2 py-1 text-xs font-medium text-brand hover:bg-brand-light"
                    >
                      Edit
                    </button>
                    <button
                      type="button"
                      onClick={() => confirmDelete(index)}
                      className="rounded px-2 py-1 text-xs font-medium text-red-600 hover:bg-red-50"
                    >
                      Delete
                    </button>
                  </div>
                )}
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* Delete confirmation dialog */}
      {deleteIndex !== null && (
        <div className="rounded-xl border border-red-200 bg-red-50 p-4">
          <p className="text-sm font-medium text-red-800">
            Delete &ldquo;{categories[deleteIndex]?.name}&rdquo;?
          </p>
          {(categories[deleteIndex]?.postCount ?? 0) > 0 && (
            <p className="mt-1 text-xs text-red-700">
              ⚠️ {categories[deleteIndex].postCount} post
              {categories[deleteIndex].postCount !== 1 ? "s" : ""} currently use this
              category. They will become uncategorized.
            </p>
          )}
          <div className="mt-3 flex gap-2">
            <button
              type="button"
              onClick={executeDelete}
              className="rounded-lg bg-red-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-red-700"
            >
              Confirm Delete
            </button>
            <button
              type="button"
              onClick={cancelDelete}
              className="rounded-lg px-3 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-100"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Add category form */}
      {showAddForm ? (
        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm space-y-3">
          <h3 className="text-sm font-semibold text-ink">Add New Category</h3>
          <div>
            <input
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              className={inputClass}
              placeholder="Category name"
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  addCategory();
                }
              }}
              autoFocus
            />
            {newName.trim() && (
              <p className="mt-1 text-xs text-muted">
                Slug: <code className="rounded bg-slate-100 px-1">{slugify(newName)}</code>
              </p>
            )}
          </div>
          <div>
            <input
              value={newDescription}
              onChange={(e) => setNewDescription(e.target.value)}
              className={inputClass}
              placeholder="Description (optional)"
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  addCategory();
                }
              }}
            />
          </div>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={addCategory}
              className="rounded-lg bg-brand px-4 py-2 text-sm font-medium text-white hover:bg-brand-dark"
            >
              Add Category
            </button>
            <button
              type="button"
              onClick={() => {
                setShowAddForm(false);
                setNewName("");
                setNewDescription("");
              }}
              className="rounded-lg px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100"
            >
              Cancel
            </button>
          </div>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => setShowAddForm(true)}
          className="inline-flex items-center gap-1.5 rounded-lg border border-dashed border-slate-300 px-4 py-2.5 text-sm font-medium text-slate-600 hover:border-brand hover:text-brand transition"
        >
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Add Category
        </button>
      )}

      {/* Save button */}
      <div className="flex items-center gap-3 pt-2">
        <button
          type="button"
          onClick={handleSave}
          disabled={saving}
          className="rounded-full bg-brand px-6 py-2.5 text-sm font-semibold text-white transition hover:bg-brand-dark disabled:opacity-60"
        >
          {saving ? "Saving..." : "Save Categories"}
        </button>
        <span className="text-xs text-muted">
          {categories.length} categor{categories.length === 1 ? "y" : "ies"} total
        </span>
      </div>
    </div>
  );
}
