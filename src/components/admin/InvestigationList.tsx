"use client";

import { useCallback, useEffect, useState } from "react";

type Inv = { name: string; category: string; aliases: string[] };

const inputClass =
  "w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-ink outline-none transition focus:border-brand focus:ring-2 focus:ring-brand/20";

export default function InvestigationList() {
  const [items, setItems] = useState<Inv[]>([]);
  const [loading, setLoading] = useState(true);
  const [newName, setNewName] = useState("");
  const [newCategory, setNewCategory] = useState("");
  const [addMsg, setAddMsg] = useState("");

  const fetchList = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/investigations?q=");
      // The API returns results for empty q too (all items) — but it requires at least 1 char
      // Fetch all by using a workaround: get the full list
      const res2 = await fetch("/api/admin/investigations/list");
      if (res2.ok) {
        const data = await res2.json();
        setItems(Array.isArray(data) ? data : []);
      } else {
        // Fallback: search with common letters to get most
        const all: Inv[] = [];
        for (const letter of "abcdefghijklmnopqrstuvwxyz".split("")) {
          const r = await fetch(`/api/admin/investigations?q=${letter}`);
          const d = await r.json();
          for (const item of d) {
            if (!all.find((a) => a.name === item.name)) all.push(item);
          }
        }
        setItems(all.sort((a, b) => a.name.localeCompare(b.name)));
      }
    } catch {}
    setLoading(false);
  }, []);

  useEffect(() => { fetchList(); }, [fetchList]);

  async function handleAdd() {
    if (!newName.trim()) return;
    setAddMsg("");
    try {
      const res = await fetch("/api/admin/investigations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: newName.trim(), category: newCategory.trim() }),
      });
      if (res.ok) {
        setAddMsg("✓ Added");
        setNewName(""); setNewCategory("");
        fetchList();
      } else {
        setAddMsg("Failed to add");
      }
    } catch {
      setAddMsg("Error");
    }
  }

  const categories = [...new Set(items.map((i) => i.category).filter(Boolean))].sort();

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 text-sm text-muted">
        <span>{items.length} investigations in database</span>
        {loading && <span className="text-xs">(loading...)</span>}
      </div>

      {/* Add new */}
      <div className="flex flex-wrap gap-2 items-end">
        <div className="flex-1 min-w-[200px]">
          <label className="text-xs font-medium text-muted">Name</label>
          <input value={newName} onChange={(e) => setNewName(e.target.value)} className={inputClass} placeholder="e.g. Serum Vitamin D" />
        </div>
        <div className="w-40">
          <label className="text-xs font-medium text-muted">Category</label>
          <input value={newCategory} onChange={(e) => setNewCategory(e.target.value)} className={inputClass} placeholder="e.g. Blood" list="inv-categories" />
          <datalist id="inv-categories">
            {categories.map((c) => <option key={c} value={c} />)}
          </datalist>
        </div>
        <button type="button" onClick={handleAdd} className="rounded-lg bg-brand px-4 py-2 text-sm font-semibold text-white hover:bg-brand-dark">Add</button>
        {addMsg && <span className="text-xs text-muted">{addMsg}</span>}
      </div>

      {/* List grouped by category */}
      {categories.map((cat) => (
        <div key={cat}>
          <p className="text-xs font-semibold uppercase text-muted mt-3 mb-1">{cat}</p>
          <div className="flex flex-wrap gap-1.5">
            {items.filter((i) => i.category === cat).map((inv) => (
              <span key={inv.name} className="rounded-full bg-slate-100 px-2.5 py-1 text-xs text-ink">
                {inv.name}
              </span>
            ))}
          </div>
        </div>
      ))}
      {items.filter((i) => !i.category).length > 0 && (
        <div>
          <p className="text-xs font-semibold uppercase text-muted mt-3 mb-1">Other</p>
          <div className="flex flex-wrap gap-1.5">
            {items.filter((i) => !i.category).map((inv) => (
              <span key={inv.name} className="rounded-full bg-slate-100 px-2.5 py-1 text-xs text-ink">
                {inv.name}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
