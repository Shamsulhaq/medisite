"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import type { BlogPost } from "@/lib/types";
import { LOCALE_LABELS, LOCALES, type Locale, type LocalizedString } from "@/lib/i18n";
import { savePostAction } from "@/app/admin/actions";
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

export default function PostEditor({ post }: { post?: BlogPost }) {
  const router = useRouter();
  const bodyRef = useRef<HTMLTextAreaElement>(null);
  const imgInputRef = useRef<HTMLInputElement>(null);

  const [title, setTitle] = useState<LocalizedString>(post?.title ?? emptyLS);
  const [excerpt, setExcerpt] = useState<LocalizedString>(
    post?.excerpt ?? emptyLS
  );
  const [slug, setSlug] = useState(post?.slug ?? "");
  const [date, setDate] = useState(
    post?.date ?? new Date().toISOString().split("T")[0]
  );
  const [readingMinutes, setReadingMinutes] = useState(
    String(post?.readingMinutes ?? 4)
  );
  const [tags, setTags] = useState((post?.tags ?? []).join(", "));
  const [coverImage, setCoverImage] = useState(post?.coverImage ?? "");
  const [body, setBody] = useState<LocalizedString>(post?.body ?? emptyLS);
  const [bodyLang, setBodyLang] = useState<Locale>("en");
  const [published, setPublished] = useState(post?.published ?? false);
  const [preview, setPreview] = useState(false);
  const [saving, setSaving] = useState(false);
  const [uploadingImg, setUploadingImg] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const setBodyLangValue = (value: string) =>
    setBody((b) => ({ ...b, [bodyLang]: value }));

  function insertIntoBody(text: string, wrapSelection = false) {
    const el = bodyRef.current;
    const current = body[bodyLang];
    if (!el) {
      setBodyLangValue(current + text);
      return;
    }
    const start = el.selectionStart;
    const end = el.selectionEnd;
    const selected = current.slice(start, end);
    const insertText = wrapSelection ? text.replace("$1", selected) : text;
    const next = current.slice(0, start) + insertText + current.slice(end);
    setBodyLangValue(next);
    requestAnimationFrame(() => {
      el.focus();
      const cursor = start + insertText.length;
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
      next =
        current.slice(0, lineStart) +
        action.linePrefix +
        current.slice(lineStart);
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

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (!title.en.trim() && !title.bn.trim()) {
      setError("Title is required (at least one language).");
      return;
    }

    setSaving(true);
    const res = await savePostAction(
      {
        title,
        slug: slug.trim(),
        excerpt,
        date,
        readingMinutes: Number(readingMinutes) || 1,
        tags: tags
          .split(",")
          .map((t) => t.trim())
          .filter(Boolean),
        body,
        coverImage,
        published,
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

      <LocalizedArea label="Excerpt" value={excerpt} onChange={setExcerpt} rows={2} />

      <div className="grid gap-4 sm:grid-cols-2">
        <label className="block">
          <span className="text-sm font-medium text-ink">
            Tags (comma-separated)
          </span>
          <input
            value={tags}
            onChange={(e) => setTags(e.target.value)}
            className={inputClass}
            placeholder="Clinical Care, Patient Education"
          />
        </label>
        <label className="block">
          <span className="text-sm font-medium text-ink">
            Reading Time (minutes)
          </span>
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
              <Markdown
                content={body[bodyLang]}
                className="text-[15px] text-slate-700"
              />
            ) : (
              <p className="text-sm text-muted">Nothing to preview yet.</p>
            )}
          </div>
        )}
      </div>

      <label className="flex items-center gap-2">
        <input
          type="checkbox"
          checked={published}
          onChange={(e) => setPublished(e.target.checked)}
          className="h-4 w-4 rounded border-slate-300 text-brand focus:ring-brand"
        />
        <span className="text-sm font-medium text-ink">
          Published (visible on the public site)
        </span>
      </label>

      <div className="flex items-center gap-3">
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
      </div>
    </form>
  );
}
