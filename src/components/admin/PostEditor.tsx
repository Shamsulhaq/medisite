"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import type { BlogPost, SiteSettings } from "@/lib/types";
import { LOCALE_LABELS, LOCALES, type Locale, type LocalizedString } from "@/lib/i18n";
import { savePostAction, getRevisionsAction } from "@/app/admin/actions";
import Markdown from "@/components/Markdown";
import { LocalizedField, LocalizedArea } from "@/components/admin/LocalizedField";
import ImageUpload from "@/components/admin/ImageUpload";

const inputClass =
  "mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-ink outline-none transition focus:border-brand focus:ring-2 focus:ring-brand/20";

const emptyLS: LocalizedString = { en: "", bn: "" };

type ToolbarAction = {
  label: string;
  title: string;
  wrap?: [string, string];
  linePrefix?: string;
  insert?: string;
};

const TOOLBAR: ToolbarAction[] = [
  { label: "H2", title: "Heading", linePrefix: "## " },
  { label: "B", title: "Bold", wrap: ["**", "**"] },
  { label: "I", title: "Italic", wrap: ["*", "*"] },
  { label: "• List", title: "Bullet list", linePrefix: "- " },
  { label: "Quote", title: "Blockquote", linePrefix: "> " },
  { label: "Link", title: "Link", insert: "[label](https://example.com)" },
];

type Revision = { id: string; createdAt: string; data: unknown };

export default function PostEditor({
  post,
  settings,
}: {
  post?: BlogPost;
  settings?: SiteSettings;
}) {
  const router = useRouter();
  const bodyRef = useRef<HTMLTextAreaElement>(null);
  const imgInputRef = useRef<HTMLInputElement>(null);

  const categories = settings?.blog?.categories ?? [];
  const globalDisclaimer = settings?.blog?.defaultDisclaimer ?? "";

  const [title, setTitle] = useState<LocalizedString>(post?.title ?? emptyLS);
  const [excerpt, setExcerpt] = useState<LocalizedString>(post?.excerpt ?? emptyLS);
  const [slug, setSlug] = useState(post?.slug ?? "");
  const [date, setDate] = useState(post?.date ?? new Date().toISOString().split("T")[0]);
  const [readingMinutes, setReadingMinutes] = useState(String(post?.readingMinutes ?? 4));
  const [tags, setTags] = useState((post?.tags ?? []).join(", "));
  const [coverImage, setCoverImage] = useState(post?.coverImage ?? "");
  const [body, setBody] = useState<LocalizedString>(post?.body ?? emptyLS);
  const [bodyLang, setBodyLang] = useState<Locale>("en");

  // New fields
  const [category, setCategory] = useState(post?.category ?? "");
  const [status, setStatus] = useState<"draft" | "published" | "scheduled">(
    post?.scheduledDate ? "scheduled" : post?.published ? "published" : "draft"
  );
  const [scheduledDate, setScheduledDate] = useState(post?.scheduledDate ?? "");
  const [metaTitle, setMetaTitle] = useState(post?.metaTitle ?? "");
  const [metaDescription, setMetaDescription] = useState(post?.metaDescription ?? "");
  const [ogImage, setOgImage] = useState(post?.ogImage ?? "");
  const [references, setReferences] = useState(post?.references ?? "");
  const [reviewedBy, setReviewedBy] = useState(post?.reviewedBy ?? "");
  const [reviewedDate, setReviewedDate] = useState(post?.reviewedDate ?? "");
  const [disclaimer, setDisclaimer] = useState(post?.disclaimer ?? "");
  const [seoOpen, setSeoOpen] = useState(false);

  const [preview, setPreview] = useState(false);
  const [saving, setSaving] = useState(false);
  const [uploadingImg, setUploadingImg] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Revision history
  const [showHistory, setShowHistory] = useState(false);
  const [revisions, setRevisions] = useState<Revision[]>([]);
  const [loadingRevisions, setLoadingRevisions] = useState(false);

  // Pre-fill disclaimer from global default if empty and creating new post
  useEffect(() => {
    if (!post && !disclaimer && globalDisclaimer) {
      setDisclaimer(globalDisclaimer);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const setBodyLangValue = (value: string) =>
    setBody((b) => ({ ...b, [bodyLang]: value }));

  function insertIntoBody(text: string) {
    const el = bodyRef.current;
    const current = body[bodyLang];
    if (!el) {
      setBodyLangValue(current + text);
      return;
    }
    const start = el.selectionStart;
    const end = el.selectionEnd;
    const next = current.slice(0, start) + text + current.slice(end);
    setBodyLangValue(next);
    requestAnimationFrame(() => {
      el.focus();
      const cursor = start + text.length;
      el.setSelectionRange(cursor, cursor);
    });
  }

  function applyToolbar(action: ToolbarAction) {
    const el = bodyRef.current;
    const current = body[bodyLang];
    if (!el) return;
    const start = el.selectionStart;
    const end = el.selectionEnd;
    const selected = current.slice(start, end);
    let next = current;
    let cursor = end;

    if (action.wrap) {
      const [a, b] = action.wrap;
      next = current.slice(0, start) + a + selected + b + current.slice(end);
      cursor = end + a.length + b.length;
    } else if (action.linePrefix) {
      const lineStart = current.lastIndexOf("\n", start - 1) + 1;
      next = current.slice(0, lineStart) + action.linePrefix + current.slice(lineStart);
      cursor = end + action.linePrefix.length;
    } else if (action.insert) {
      next = current.slice(0, start) + action.insert + current.slice(end);
      cursor = start + action.insert.length;
    }

    setBodyLangValue(next);
    requestAnimationFrame(() => {
      el.focus();
      el.setSelectionRange(cursor, cursor);
    });
  }

  async function handleImageUpload(file: File) {
    setUploadingImg(true);
    setError(null);
    try {
      const fd = new FormData();
      fd.append("file", file);
      const res = await fetch("/api/admin/upload", { method: "POST", body: fd });
      const data = await res.json();
      if (res.ok && data.ok) {
        insertIntoBody(`\n\n![](${data.url})\n\n`);
      } else {
        setError(data.error ?? "Image upload failed.");
      }
    } catch {
      setError("Image upload failed.");
    } finally {
      setUploadingImg(false);
    }
  }

  async function loadRevisions() {
    if (!post?.id) return;
    setLoadingRevisions(true);
    try {
      const revs = await getRevisionsAction(post.id);
      setRevisions(revs);
    } catch {
      // ignore
    } finally {
      setLoadingRevisions(false);
    }
  }

  function restoreRevision(rev: Revision) {
    const d = rev.data as BlogPost;
    setTitle(d.title ?? emptyLS);
    setExcerpt(d.excerpt ?? emptyLS);
    setSlug(d.slug ?? "");
    setDate(d.date ?? "");
    setReadingMinutes(String(d.readingMinutes ?? 4));
    setTags((d.tags ?? []).join(", "));
    setCoverImage(d.coverImage ?? "");
    setBody(d.body ?? emptyLS);
    setCategory(d.category ?? "");
    setMetaTitle(d.metaTitle ?? "");
    setMetaDescription(d.metaDescription ?? "");
    setOgImage(d.ogImage ?? "");
    setReferences(d.references ?? "");
    setReviewedBy(d.reviewedBy ?? "");
    setReviewedDate(d.reviewedDate ?? "");
    setDisclaimer(d.disclaimer ?? "");
    setScheduledDate(d.scheduledDate ?? "");
    setStatus(d.scheduledDate ? "scheduled" : d.published ? "published" : "draft");
    setShowHistory(false);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (!title.en.trim() && !title.bn.trim()) {
      setError("Title is required (at least one language).");
      return;
    }

    setSaving(true);
    const published = status === "published";
    const res = await savePostAction(
      {
        title,
        slug: slug.trim(),
        excerpt,
        date,
        readingMinutes: Number(readingMinutes) || 1,
        tags: tags.split(",").map((t) => t.trim()).filter(Boolean),
        body,
        coverImage,
        published,
        category,
        metaTitle,
        metaDescription,
        ogImage,
        reviewedBy,
        reviewedDate,
        references,
        disclaimer,
        scheduledDate: status === "scheduled" ? scheduledDate : "",
      },
      post?.id
    );
    setSaving(false);

    if (res.ok) {
      router.push("/admin/posts");
      router.refresh();
    } else {
      setError(res.error ?? "Failed to save post.");
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      {/* View Count Display */}
      {post && (
        <div className="flex items-center gap-2 text-sm text-muted">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
            <circle cx="12" cy="12" r="3" />
          </svg>
          {post.viewCount} view{post.viewCount === 1 ? "" : "s"}
        </div>
      )}

      <LocalizedField label="Title" value={title} onChange={setTitle} />

      <div className="grid gap-4 sm:grid-cols-2">
        <label className="block">
          <span className="text-sm font-medium text-ink">Slug (optional)</span>
          <input
            value={slug}
            onChange={(e) => setSlug(e.target.value)}
            className={inputClass}
            placeholder="auto-generated from English title"
          />
        </label>
        <label className="block">
          <span className="text-sm font-medium text-ink">Date</span>
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className={inputClass}
          />
        </label>
      </div>

      {/* Category */}
      <div>
        <label className="block">
          <span className="text-sm font-medium text-ink">Category</span>
          <div className="mt-1 flex gap-2">
            <select
              value={categories.includes(category) ? category : "__custom__"}
              onChange={(e) => {
                if (e.target.value === "__custom__") return;
                setCategory(e.target.value);
              }}
              className={inputClass + " flex-1"}
            >
              <option value="">— None —</option>
              {categories.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
              {category && !categories.includes(category) && (
                <option value="__custom__">Custom: {category}</option>
              )}
            </select>
            <input
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className={inputClass + " flex-1"}
              placeholder="Or type custom category"
            />
          </div>
        </label>
      </div>

      <LocalizedArea label="Excerpt" value={excerpt} onChange={setExcerpt} rows={2} />

      <div className="grid gap-4 sm:grid-cols-2">
        <label className="block">
          <span className="text-sm font-medium text-ink">Tags (comma-separated)</span>
          <input
            value={tags}
            onChange={(e) => setTags(e.target.value)}
            className={inputClass}
            placeholder="Clinical Care, Patient Education"
          />
        </label>
        <label className="block">
          <span className="text-sm font-medium text-ink">Reading Time (minutes)</span>
          <input
            type="number"
            min={1}
            value={readingMinutes}
            onChange={(e) => setReadingMinutes(e.target.value)}
            className={inputClass}
          />
        </label>
      </div>

      <ImageUpload
        label="Cover Image"
        hint="Shown on the blog list and at the top of the post."
        value={coverImage}
        onChange={setCoverImage}
      />

      {/* Body editor */}
      <div>
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium text-ink">Content (markdown)</span>
          <button
            type="button"
            onClick={() => setPreview((p) => !p)}
            className="text-xs font-medium text-brand hover:text-brand-dark"
          >
            {preview ? "← Back to editor" : "Preview →"}
          </button>
        </div>

        {/* language tabs */}
        <div className="mt-2 flex gap-1">
          {LOCALES.map((l) => (
            <button
              key={l}
              type="button"
              onClick={() => setBodyLang(l)}
              className={`rounded-t-lg px-3 py-1.5 text-xs font-semibold transition ${
                bodyLang === l
                  ? "bg-slate-50 text-brand ring-1 ring-slate-300"
                  : "text-muted hover:text-ink"
              }`}
            >
              {LOCALE_LABELS[l]}
            </button>
          ))}
        </div>

        {!preview ? (
          <>
            <div className="flex flex-wrap gap-1 border border-b-0 border-slate-300 bg-slate-50 p-2">
              {TOOLBAR.map((action) => (
                <button
                  key={action.label}
                  type="button"
                  title={action.title}
                  onClick={() => applyToolbar(action)}
                  className="rounded px-2 py-1 text-xs font-medium text-slate-600 transition hover:bg-slate-200"
                >
                  {action.label}
                </button>
              ))}
              <input
                ref={imgInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  if (f) handleImageUpload(f);
                  e.target.value = "";
                }}
              />
              <button
                type="button"
                title="Insert image"
                onClick={() => imgInputRef.current?.click()}
                disabled={uploadingImg}
                className="rounded px-2 py-1 text-xs font-medium text-slate-600 transition hover:bg-slate-200 disabled:opacity-60"
              >
                {uploadingImg ? "Uploading…" : "🖼 Image"}
              </button>
            </div>
            <textarea
              ref={bodyRef}
              value={body[bodyLang]}
              onChange={(e) => setBodyLangValue(e.target.value)}
              rows={16}
              dir="auto"
              className="w-full rounded-b-lg border border-slate-300 px-3 py-2 font-mono text-sm text-ink outline-none transition focus:border-brand focus:ring-2 focus:ring-brand/20"
              placeholder={`Write the ${LOCALE_LABELS[bodyLang]} content in markdown…`}
            />
            <p className="mt-1 text-xs text-muted">
              Editing <strong>{LOCALE_LABELS[bodyLang]}</strong>. Markdown:{" "}
              <code>## Heading</code>, <code>**bold**</code>, <code>- list</code>,{" "}
              <code>&gt; quote</code>, <code>![](image)</code>.
            </p>
          </>
        ) : (
          <div className="mt-2 rounded-lg border border-slate-300 bg-white p-5">
            {body[bodyLang].trim() ? (
              <Markdown content={body[bodyLang]} className="text-[15px] text-slate-700" />
            ) : (
              <p className="text-sm text-muted">Nothing to preview yet.</p>
            )}
          </div>
        )}
      </div>

      {/* References */}
      <label className="block">
        <span className="text-sm font-medium text-ink">References (markdown)</span>
        <textarea
          value={references}
          onChange={(e) => setReferences(e.target.value)}
          rows={4}
          className={inputClass + " font-mono"}
          placeholder="1. Author et al. Title. Journal. Year;&#10;2. ..."
        />
      </label>

      {/* Reviewed by */}
      <div className="grid gap-4 sm:grid-cols-2">
        <label className="block">
          <span className="text-sm font-medium text-ink">Reviewed By</span>
          <input
            value={reviewedBy}
            onChange={(e) => setReviewedBy(e.target.value)}
            className={inputClass}
            placeholder="Dr. Name, Specialty"
          />
        </label>
        <label className="block">
          <span className="text-sm font-medium text-ink">Reviewed Date</span>
          <input
            type="date"
            value={reviewedDate}
            onChange={(e) => setReviewedDate(e.target.value)}
            className={inputClass}
          />
        </label>
      </div>

      {/* Disclaimer */}
      <label className="block">
        <span className="text-sm font-medium text-ink">
          Disclaimer <span className="font-normal text-muted">(leave empty to use global default)</span>
        </span>
        <textarea
          value={disclaimer}
          onChange={(e) => setDisclaimer(e.target.value)}
          rows={3}
          className={inputClass}
          placeholder={globalDisclaimer || "Medical disclaimer for this post..."}
        />
      </label>

      {/* SEO Section (collapsible) */}
      <div className="rounded-lg border border-slate-200 bg-slate-50/50">
        <button
          type="button"
          onClick={() => setSeoOpen(!seoOpen)}
          className="flex w-full items-center justify-between px-4 py-3 text-sm font-medium text-ink"
        >
          <span>SEO Settings</span>
          <span className="text-muted">{seoOpen ? "▲" : "▼"}</span>
        </button>
        {seoOpen && (
          <div className="space-y-4 border-t border-slate-200 p-4">
            <label className="block">
              <span className="text-sm font-medium text-ink">Meta Title</span>
              <input
                value={metaTitle}
                onChange={(e) => setMetaTitle(e.target.value)}
                className={inputClass}
                placeholder="Custom page title for search engines"
              />
            </label>
            <label className="block">
              <span className="text-sm font-medium text-ink">Meta Description</span>
              <textarea
                value={metaDescription}
                onChange={(e) => setMetaDescription(e.target.value)}
                rows={2}
                className={inputClass}
                placeholder="Custom description for search engines"
              />
            </label>
            <ImageUpload
              label="OG Image"
              hint="Social sharing image (recommended 1200×630)"
              value={ogImage}
              onChange={setOgImage}
            />
          </div>
        )}
      </div>

      {/* Status */}
      <div>
        <span className="text-sm font-medium text-ink">Status</span>
        <div className="mt-2 flex gap-3">
          {(["draft", "published", "scheduled"] as const).map((s) => (
            <label key={s} className="flex items-center gap-2">
              <input
                type="radio"
                name="status"
                value={s}
                checked={status === s}
                onChange={() => setStatus(s)}
                className="h-4 w-4 border-slate-300 text-brand focus:ring-brand"
              />
              <span className="text-sm capitalize text-ink">{s}</span>
            </label>
          ))}
        </div>
      </div>

      {/* Scheduled date */}
      {status === "scheduled" && (
        <label className="block">
          <span className="text-sm font-medium text-ink">Scheduled Publish Date</span>
          <input
            type="datetime-local"
            value={scheduledDate}
            onChange={(e) => setScheduledDate(e.target.value)}
            className={inputClass}
          />
        </label>
      )}

      <div className="flex flex-wrap items-center gap-3">
        <button
          type="submit"
          disabled={saving}
          className="rounded-full bg-brand px-6 py-2.5 text-sm font-semibold text-white transition hover:bg-brand-dark disabled:cursor-not-allowed disabled:opacity-60"
        >
          {saving ? "Saving..." : post ? "Update Post" : "Create Post"}
        </button>
        <button
          type="button"
          onClick={() => router.push("/admin/posts")}
          className="rounded-full border border-slate-300 px-6 py-2.5 text-sm font-semibold text-slate-600 transition hover:bg-slate-50"
        >
          Cancel
        </button>
        {post && (
          <button
            type="button"
            onClick={() => {
              setShowHistory(true);
              loadRevisions();
            }}
            className="rounded-full border border-slate-300 px-6 py-2.5 text-sm font-semibold text-slate-600 transition hover:bg-slate-50"
          >
            History
          </button>
        )}
      </div>

      {/* Revision History Modal */}
      {showHistory && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="max-h-[80vh] w-full max-w-lg overflow-y-auto rounded-xl bg-white p-6 shadow-xl">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-ink">Revision History</h3>
              <button
                type="button"
                onClick={() => setShowHistory(false)}
                className="text-muted hover:text-ink text-xl leading-none"
              >
                ×
              </button>
            </div>
            {loadingRevisions ? (
              <p className="text-sm text-muted">Loading...</p>
            ) : revisions.length === 0 ? (
              <p className="text-sm text-muted">No revisions found.</p>
            ) : (
              <div className="space-y-3">
                {revisions.map((rev) => {
                  const d = rev.data as BlogPost;
                  return (
                    <div key={rev.id} className="rounded-lg border border-slate-200 p-3">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium text-ink">
                            {new Date(rev.createdAt).toLocaleString()}
                          </p>
                          <p className="text-xs text-muted truncate">
                            {d?.title?.en || d?.title?.bn || "Untitled"}
                          </p>
                        </div>
                        <button
                          type="button"
                          onClick={() => restoreRevision(rev)}
                          className="rounded-lg bg-brand/10 px-3 py-1.5 text-xs font-medium text-brand hover:bg-brand/20"
                        >
                          Restore
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}
    </form>
  );
}
