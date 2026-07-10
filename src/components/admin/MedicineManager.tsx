"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import type { MedicineRef } from "@/lib/medicines";
import AdminIcon from "@/components/admin/AdminIcon";

const ALPHA = "abcdefghijklmnopqrstuvwxyz".split("");

const inputClass =
  "w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-ink outline-none transition focus:border-brand focus:ring-2 focus:ring-brand/20";

function MedicineRow({ med, index, onUpdate }: { med: MedicineRef; index: number; onUpdate: () => void }) {
  const [expanded, setExpanded] = useState(false);
  const [editing, setEditing] = useState(false);
  const [brands, setBrands] = useState(med.brands.join(", "));
  const [forms, setForms] = useState(med.forms.join(", "));
  const [dosages, setDosages] = useState(med.dosages.join(", "));
  const [advice, setAdvice] = useState(med.defaultAdvice ?? "");
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState("");

  async function handleSave() {
    setSaving(true); setMsg("");
    const updated: MedicineRef = {
      generic: med.generic,
      brands: brands.split(",").map((b) => b.trim()).filter(Boolean),
      forms: forms.split(",").map((f) => f.trim()).filter(Boolean),
      dosages: dosages.split(",").map((d) => d.trim()).filter(Boolean),
      defaultAdvice: advice.trim() || undefined,
    };
    const res = await fetch("/api/admin/medicines/manage", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify([updated]),
    });
    const data = await res.json();
    setSaving(false);
    if (data.ok) {
      setMsg("✓ Saved");
      setEditing(false);
      onUpdate();
      setTimeout(() => setMsg(""), 2000);
    } else {
      setMsg(data.error ?? "Failed");
    }
  }

  return (
    <>
      <tr className="hover:bg-slate-50/60 cursor-pointer" onClick={() => setExpanded((v) => !v)}>
        <td className="px-4 py-2.5 text-xs text-muted sm:px-5">{index}</td>
        <td className="px-4 py-2.5 font-medium text-ink sm:px-5">{med.generic}</td>
        <td className="px-4 py-2.5 sm:px-5">
          <div className="flex flex-wrap gap-1">
            {med.brands.slice(0, 4).map((b) => (
              <span key={b} className="rounded bg-brand-light px-1.5 py-0.5 text-xs text-brand-dark">{b}</span>
            ))}
            {med.brands.length > 4 && (
              <button type="button" onClick={(e) => { e.stopPropagation(); setExpanded(true); }}
                className="rounded bg-slate-200 px-1.5 py-0.5 text-xs font-medium text-slate-600 hover:bg-slate-300">
                +{med.brands.length - 4}
              </button>
            )}
          </div>
        </td>
        <td className="hidden px-5 py-2.5 text-xs text-muted sm:table-cell">{med.forms.slice(0, 3).join(", ") || "—"}</td>
        <td className="hidden px-5 py-2.5 text-xs text-muted sm:table-cell">
          {med.dosages.slice(0, 3).join(", ") || "—"}
          {med.dosages.length > 3 && "..."}
        </td>
      </tr>
      {expanded && (
        <tr className="bg-slate-50">
          <td colSpan={5} className="px-4 py-4 sm:px-5">
            {!editing ? (
              <div className="space-y-3">
                <div>
                  <p className="text-xs font-semibold uppercase text-muted">All Brands ({med.brands.length})</p>
                  <div className="mt-1 flex flex-wrap gap-1.5">
                    {med.brands.map((b) => (
                      <span key={b} className="rounded-full bg-brand-light px-2.5 py-0.5 text-xs font-medium text-brand-dark">{b}</span>
                    ))}
                    {med.brands.length === 0 && <span className="text-xs text-muted">No brands</span>}
                  </div>
                </div>
                <div className="grid gap-3 sm:grid-cols-3">
                  <div>
                    <p className="text-xs font-semibold uppercase text-muted">Forms</p>
                    <p className="mt-0.5 text-sm text-ink">{med.forms.join(", ") || "—"}</p>
                  </div>
                  <div>
                    <p className="text-xs font-semibold uppercase text-muted">Dosages</p>
                    <p className="mt-0.5 text-sm text-ink">{med.dosages.join(", ") || "—"}</p>
                  </div>
                  <div>
                    <p className="text-xs font-semibold uppercase text-muted">Default Advice</p>
                    <p className="mt-0.5 text-sm text-ink">{med.defaultAdvice || "—"}</p>
                  </div>
                </div>
                <button type="button" onClick={() => setEditing(true)}
                  className="rounded-lg border border-slate-300 px-3 py-1.5 text-sm font-medium text-ink hover:bg-white">
                  Edit
                </button>
              </div>
            ) : (
              <div className="space-y-3">
                <div>
                  <label className="text-xs font-medium text-muted">Brands (comma-separated)</label>
                  <textarea value={brands} onChange={(e) => setBrands(e.target.value)} rows={2} className={inputClass} />
                </div>
                <div className="grid gap-3 sm:grid-cols-3">
                  <div>
                    <label className="text-xs font-medium text-muted">Forms</label>
                    <input value={forms} onChange={(e) => setForms(e.target.value)} className={inputClass} />
                  </div>
                  <div>
                    <label className="text-xs font-medium text-muted">Dosages</label>
                    <input value={dosages} onChange={(e) => setDosages(e.target.value)} className={inputClass} />
                  </div>
                  <div>
                    <label className="text-xs font-medium text-muted">Default Advice</label>
                    <input value={advice} onChange={(e) => setAdvice(e.target.value)} className={inputClass} dir="auto" />
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button type="button" onClick={handleSave} disabled={saving}
                    className="rounded-lg bg-brand px-4 py-2 text-sm font-semibold text-white hover:bg-brand-dark disabled:opacity-50">
                    {saving ? "Saving..." : "Save"}
                  </button>
                  <button type="button" onClick={() => setEditing(false)}
                    className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-ink hover:bg-white">
                    Cancel
                  </button>
                  {msg && <span className="text-sm text-muted">{msg}</span>}
                </div>
              </div>
            )}
          </td>
        </tr>
      )}
    </>
  );
}

export default function MedicineManager({
  initialCount,
}: {
  initialCount: number;
}) {
  const router = useRouter();
  const fileRef = useRef<HTMLInputElement>(null);
  const [count, setCount] = useState(initialCount);

  // List state
  const [items, setItems] = useState<MedicineRef[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [alpha, setAlpha] = useState("");
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(false);

  // Modal state
  const [showAdd, setShowAdd] = useState(false);
  const [newGeneric, setNewGeneric] = useState("");
  const [newBrands, setNewBrands] = useState("");
  const [newForms, setNewForms] = useState("");
  const [newDosages, setNewDosages] = useState("");
  const [newAdvice, setNewAdvice] = useState("");
  const [addMsg, setAddMsg] = useState("");

  // Import state
  const [importMsg, setImportMsg] = useState("");

  // Fetch list
  const fetchList = useCallback(async (p: number, a: string, q: string) => {
    setLoading(true);
    try {
      if (q.length >= 2) {
        // Use search API
        const res = await fetch(`/api/admin/medicines?q=${encodeURIComponent(q)}`);
        const data = await res.json();
        setItems(Array.isArray(data) ? data : []);
        setTotal(data.length ?? 0);
        setPage(1);
        setTotalPages(1);
      } else {
        // Use paginated list API
        const params = new URLSearchParams({ page: String(p), per: "50" });
        if (a) params.set("alpha", a);
        const res = await fetch(`/api/admin/medicines/list?${params}`);
        const data = await res.json();
        setItems(data.items ?? []);
        setTotal(data.total ?? 0);
        setPage(data.page ?? 1);
        setTotalPages(data.totalPages ?? 1);
      }
    } catch {}
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchList(1, alpha, search);
  }, [alpha, fetchList, search]);

  // Add medicine
  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    if (!newGeneric.trim()) { setAddMsg("Generic name required."); return; }
    setAddMsg("");
    const med: MedicineRef = {
      generic: newGeneric.trim(),
      brands: newBrands.split(",").map((b) => b.trim()).filter(Boolean),
      forms: newForms.split(",").map((f) => f.trim()).filter(Boolean),
      dosages: newDosages.split(",").map((d) => d.trim()).filter(Boolean),
      defaultAdvice: newAdvice.trim() || undefined,
    };
    const res = await fetch("/api/admin/medicines/manage", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify([med]),
    });
    const data = await res.json();
    if (data.ok) {
      setAddMsg(`✓ Added/merged. Total: ${data.total}`);
      setCount(data.total);
      setNewGeneric(""); setNewBrands(""); setNewForms(""); setNewDosages(""); setNewAdvice("");
      fetchList(page, alpha, search);
      setTimeout(() => { setShowAdd(false); setAddMsg(""); }, 1500);
    } else {
      setAddMsg(data.error ?? "Failed.");
    }
  }

  // Import
  async function handleImport(file: File) {
    setImportMsg("Importing...");
    const fd = new FormData();
    fd.append("file", file);
    const res = await fetch("/api/admin/medicines/manage?mode=merge", { method: "POST", body: fd });
    const data = await res.json();
    if (data.ok) {
      setImportMsg(`✓ Imported ${data.imported} new. Total: ${data.total}`);
      setCount(data.total);
      fetchList(page, alpha, search);
      router.refresh();
    } else {
      setImportMsg(data.error ?? "Import failed.");
    }
    setTimeout(() => setImportMsg(""), 4000);
  }

  return (
    <div>
      {/* Header bar */}
      <div className="rounded-xl border border-slate-200 bg-white shadow-sm">
        {/* Top: search + actions */}
        <div className="flex flex-col gap-3 border-b border-slate-100 px-4 py-4 sm:flex-row sm:flex-wrap sm:items-center sm:px-5">
          <div className="relative flex-1 min-w-0">
            <input
              value={search}
              onChange={(e) => { setSearch(e.target.value); setAlpha(""); }}
              placeholder="Search by name or generic..."
              className={`${inputClass} pl-9`}
            />
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" aria-hidden="true">
              <circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/>
            </svg>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <span className="text-sm text-muted">{search.length >= 2 ? `${total} results` : `${count} total`}</span>

            <button type="button" onClick={() => setShowAdd(true)}
              className="inline-flex items-center gap-1.5 rounded-lg bg-brand px-3 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-brand-dark">
              <AdminIcon name="plus" className="h-4 w-4" />
              <span className="hidden sm:inline">Add</span>
            </button>

            <input ref={fileRef} type="file" accept=".json,.csv" className="hidden"
              onChange={(e) => { const f = e.target.files?.[0]; if (f) handleImport(f); e.target.value = ""; }} />
            <button type="button" onClick={() => fileRef.current?.click()}
              className="rounded-lg border border-slate-300 px-3 py-2 text-sm font-medium text-ink transition hover:bg-slate-50">
              Import
            </button>
            <a href="/api/admin/medicines/manage?format=json" download="medicines.json"
              className="hidden rounded-lg border border-slate-300 px-3 py-2 text-sm font-medium text-ink transition hover:bg-slate-50 sm:inline-block">
              JSON
            </a>
            <a href="/api/admin/medicines/manage?format=csv" download="medicines.csv"
              className="rounded-lg border border-slate-300 px-3 py-2 text-sm font-medium text-ink transition hover:bg-slate-50">
              CSV
            </a>
          </div>
        </div>

        {importMsg && (
          <div className="border-b border-slate-100 bg-green-50 px-5 py-2 text-sm text-green-700">{importMsg}</div>
        )}

        {/* Alphabet filter */}
        <div className="flex flex-wrap gap-1 border-b border-slate-100 px-5 py-2.5">
          <button type="button" onClick={() => { setAlpha(""); setSearch(""); }}
            className={`rounded px-2 py-1 text-xs font-medium transition ${!alpha && !search ? "bg-brand text-white" : "text-muted hover:bg-slate-100"}`}>
            All
          </button>
          {ALPHA.map((l) => (
            <button key={l} type="button" onClick={() => { setAlpha(l); setSearch(""); }}
              className={`rounded px-2 py-1 text-xs font-medium uppercase transition ${alpha === l ? "bg-brand text-white" : "text-muted hover:bg-slate-100"}`}>
              {l}
            </button>
          ))}
        </div>

        {/* Table */}
        <div className={`overflow-x-auto ${loading ? "opacity-50" : ""}`}>
          {items.length === 0 ? (
            <p className="px-5 py-10 text-center text-sm text-muted">
              {loading ? "Loading..." : "No medicines found."}
            </p>
          ) : (
            <table className="min-w-full divide-y divide-slate-100 text-sm">
              <thead className="bg-slate-50 text-left text-xs font-semibold uppercase tracking-wide text-muted">
                <tr>
                  <th className="px-5 py-2.5 w-10">#</th>
                  <th className="px-5 py-2.5">Generic Name</th>
                  <th className="px-5 py-2.5">Brands</th>
                  <th className="px-5 py-2.5">Forms</th>
                  <th className="px-5 py-2.5">Dosages</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {items.map((m, i) => (
                  <MedicineRow key={`${m.generic}-${i}`} med={m} index={(page - 1) * 50 + i + 1} onUpdate={() => fetchList(page, alpha, search)} />
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between border-t border-slate-100 px-5 py-3">
            <button type="button" disabled={page <= 1} onClick={() => fetchList(page - 1, alpha, search)}
              className="rounded-lg border border-slate-300 px-3 py-1.5 text-sm font-medium text-ink transition hover:bg-slate-50 disabled:opacity-40">
              ← Previous
            </button>
            <span className="text-xs text-muted">Page {page} of {totalPages}</span>
            <button type="button" disabled={page >= totalPages} onClick={() => fetchList(page + 1, alpha, search)}
              className="rounded-lg border border-slate-300 px-3 py-1.5 text-sm font-medium text-ink transition hover:bg-slate-50 disabled:opacity-40">
              Next →
            </button>
          </div>
        )}
      </div>

      {/* Add Medicine Modal */}
      {showAdd && (
        <>
          <div onClick={() => setShowAdd(false)} className="fixed inset-0 z-40 bg-slate-900/50 backdrop-blur-sm" />
          <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto p-4 sm:items-center">
            <div className="w-full max-w-lg rounded-2xl border border-slate-200 bg-white p-5 shadow-xl sm:p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-ink">Add Medicine</h3>
              <button type="button" onClick={() => setShowAdd(false)} className="text-slate-400 hover:text-ink">
                <AdminIcon name="close" className="h-5 w-5" />
              </button>
            </div>
            <form onSubmit={handleAdd} className="space-y-3">
              <div>
                <label className="text-xs font-medium text-muted">Generic Name *</label>
                <input value={newGeneric} onChange={(e) => setNewGeneric(e.target.value)} className={inputClass} placeholder="e.g. Paracetamol" />
              </div>
              <div>
                <label className="text-xs font-medium text-muted">Brand Names (comma-separated)</label>
                <input value={newBrands} onChange={(e) => setNewBrands(e.target.value)} className={inputClass} placeholder="e.g. Napa, Ace, Panacet" />
              </div>
              <div className="grid gap-3 grid-cols-2">
                <div>
                  <label className="text-xs font-medium text-muted">Forms</label>
                  <input value={newForms} onChange={(e) => setNewForms(e.target.value)} className={inputClass} placeholder="Tablet, Syrup" />
                </div>
                <div>
                  <label className="text-xs font-medium text-muted">Dosages</label>
                  <input value={newDosages} onChange={(e) => setNewDosages(e.target.value)} className={inputClass} placeholder="500mg, 250mg" />
                </div>
              </div>
              <div>
                <label className="text-xs font-medium text-muted">Default Advice (auto-added when prescribed)</label>
                <input value={newAdvice} onChange={(e) => setNewAdvice(e.target.value)} className={inputClass} placeholder="e.g. ব্যবহারের পর কুলি করবেন" dir="auto" />
              </div>
              <div className="flex items-center gap-3 pt-2">
                <button type="submit" className="rounded-lg bg-brand px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-brand-dark">
                  Add Medicine
                </button>
                <button type="button" onClick={() => setShowAdd(false)} className="rounded-lg border border-slate-300 px-5 py-2.5 text-sm font-medium text-ink transition hover:bg-slate-50">
                  Cancel
                </button>
                {addMsg && <span className="text-sm text-muted">{addMsg}</span>}
              </div>
            </form>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
