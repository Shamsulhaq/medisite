'use client';

/**
 * BlockEditor — Rich per-block editor forms for the page builder.
 * Switches on block.type and renders appropriate form fields instead of raw JSON.
 * Falls back to a JSON textarea for unknown block types.
 */

import { useCallback } from 'react';
import type { BlockInstance } from '@/lib/page-builder/types';
import type { LocalizedString } from '@/lib/i18n';
import { TextField, SelectField, AddButton, RepeaterRow } from '@/components/admin/fields';
import { LocalizedField, LocalizedArea } from '@/components/admin/LocalizedField';

// ─── Helper: safe cast for localized strings ──────────────────────────────────

const EMPTY_LS: LocalizedString = { en: '', bn: '' };

function asLS(val: unknown): LocalizedString {
  if (val && typeof val === 'object' && 'en' in val && 'bn' in val) {
    return val as LocalizedString;
  }
  return EMPTY_LS;
}

function asString(val: unknown): string {
  return typeof val === 'string' ? val : '';
}

function asNumber(val: unknown): number {
  return typeof val === 'number' ? val : 0;
}

function asBoolean(val: unknown): boolean {
  return typeof val === 'boolean' ? val : false;
}

function asArray(val: unknown): Record<string, unknown>[] {
  return Array.isArray(val) ? (val as Record<string, unknown>[]) : [];
}

// ─── Main BlockEditor Component ───────────────────────────────────────────────

export default function BlockEditor({
  block,
  onUpdate,
}: {
  block: BlockInstance;
  onUpdate: (props: Record<string, unknown>) => void;
}) {
  const { type, props } = block;

  /** Helper to update a single prop field */
  const setProp = useCallback(
    (key: string, value: unknown) => {
      onUpdate({ ...props, [key]: value });
    },
    [props, onUpdate]
  );

  switch (type) {
    case 'hero':
      return <HeroEditor props={props} setProp={setProp} />;
    case 'stats':
      return <StatsEditor props={props} onUpdate={onUpdate} />;
    case 'featureGrid':
      return <FeatureGridEditor props={props} setProp={setProp} onUpdate={onUpdate} />;
    case 'richText':
      return <RichTextEditor props={props} setProp={setProp} />;
    case 'ctaBanner':
      return <CtaBannerEditor props={props} setProp={setProp} />;
    case 'blogPreview':
      return <BlogPreviewEditor props={props} setProp={setProp} />;
    case 'timeline':
      return <TimelineEditor props={props} setProp={setProp} onUpdate={onUpdate} />;
    case 'contactCard':
      return <ContactCardEditor props={props} setProp={setProp} onUpdate={onUpdate} />;
    case 'appointmentFormEmbed':
      return <AppointmentFormEmbedEditor props={props} setProp={setProp} />;
    case 'imageText':
      return <ImageTextEditor props={props} setProp={setProp} />;
    case 'spacer':
      return <SpacerEditor props={props} setProp={setProp} />;
    default:
      return <FallbackJsonEditor props={props} onUpdate={onUpdate} />;
  }
}

// ─── 1. Hero Editor ───────────────────────────────────────────────────────────

function HeroEditor({
  props,
  setProp,
}: {
  props: Record<string, unknown>;
  setProp: (key: string, value: unknown) => void;
}) {
  return (
    <div className="space-y-4">
      <LocalizedField label="Badge" value={asLS(props.badge)} onChange={(v) => setProp('badge', v)} />
      <LocalizedField label="Heading" value={asLS(props.heading)} onChange={(v) => setProp('heading', v)} />
      <LocalizedField label="Subtext" value={asLS(props.subtext)} onChange={(v) => setProp('subtext', v)} />
      <LocalizedField
        label="CTA Primary Label"
        value={asLS(props.ctaPrimaryLabel)}
        onChange={(v) => setProp('ctaPrimaryLabel', v)}
      />
      <TextField
        label="CTA Primary Href"
        value={asString(props.ctaPrimaryHref)}
        onChange={(v) => setProp('ctaPrimaryHref', v)}
        placeholder="/appointment"
      />
      <LocalizedField
        label="CTA Secondary Label"
        value={asLS(props.ctaSecondaryLabel)}
        onChange={(v) => setProp('ctaSecondaryLabel', v)}
      />
      <TextField
        label="CTA Secondary Href"
        value={asString(props.ctaSecondaryHref)}
        onChange={(v) => setProp('ctaSecondaryHref', v)}
        placeholder="/about"
      />
      <CheckboxField
        label="Show Photo"
        checked={asBoolean(props.showPhoto)}
        onChange={(v) => setProp('showPhoto', v)}
      />
    </div>
  );
}

// ─── 2. Stats Editor ──────────────────────────────────────────────────────────

function StatsEditor({
  props,
  onUpdate,
}: {
  props: Record<string, unknown>;
  onUpdate: (props: Record<string, unknown>) => void;
}) {
  const items = asArray(props.items);

  const updateItem = (index: number, key: string, value: unknown) => {
    const updated = items.map((item, i) =>
      i === index ? { ...item, [key]: value } : item
    );
    onUpdate({ ...props, items: updated });
  };

  const addItem = () => {
    onUpdate({ ...props, items: [...items, { value: '', label: EMPTY_LS }] });
  };

  const removeItem = (index: number) => {
    onUpdate({ ...props, items: items.filter((_, i) => i !== index) });
  };

  return (
    <div className="space-y-3">
      {items.map((item, i) => (
        <RepeaterRow key={i} onRemove={() => removeItem(i)}>
          <div className="space-y-3">
            <TextField
              label="Value"
              value={asString(item.value)}
              onChange={(v) => updateItem(i, 'value', v)}
              placeholder="e.g. 15+"
            />
            <LocalizedField
              label="Label"
              value={asLS(item.label)}
              onChange={(v) => updateItem(i, 'label', v)}
            />
          </div>
        </RepeaterRow>
      ))}
      <AddButton onClick={addItem} label="Add Item" />
    </div>
  );
}

// ─── 3. Feature Grid Editor ───────────────────────────────────────────────────

function FeatureGridEditor({
  props,
  setProp,
  onUpdate,
}: {
  props: Record<string, unknown>;
  setProp: (key: string, value: unknown) => void;
  onUpdate: (props: Record<string, unknown>) => void;
}) {
  const items = asArray(props.items);

  const updateItem = (index: number, key: string, value: unknown) => {
    const updated = items.map((item, i) =>
      i === index ? { ...item, [key]: value } : item
    );
    onUpdate({ ...props, items: updated });
  };

  const addItem = () => {
    onUpdate({
      ...props,
      items: [...items, { icon: '', title: EMPTY_LS, description: EMPTY_LS }],
    });
  };

  const removeItem = (index: number) => {
    onUpdate({ ...props, items: items.filter((_, i) => i !== index) });
  };

  return (
    <div className="space-y-4">
      <LocalizedField label="Heading" value={asLS(props.heading)} onChange={(v) => setProp('heading', v)} />
      <LocalizedField label="Subtitle" value={asLS(props.subtitle)} onChange={(v) => setProp('subtitle', v)} />

      <div className="space-y-3">
        <span className="text-sm font-medium text-ink">Items</span>
        {items.map((item, i) => (
          <RepeaterRow key={i} onRemove={() => removeItem(i)}>
            <div className="space-y-3">
              <TextField
                label="Icon"
                value={asString(item.icon)}
                onChange={(v) => updateItem(i, 'icon', v)}
                placeholder="e.g. heart, brain"
              />
              <LocalizedField
                label="Title"
                value={asLS(item.title)}
                onChange={(v) => updateItem(i, 'title', v)}
              />
              <LocalizedArea
                label="Description"
                value={asLS(item.description)}
                onChange={(v) => updateItem(i, 'description', v)}
                rows={2}
              />
            </div>
          </RepeaterRow>
        ))}
        <AddButton onClick={addItem} label="Add Item" />
      </div>
    </div>
  );
}

// ─── 4. Rich Text Editor ──────────────────────────────────────────────────────

function RichTextEditor({
  props,
  setProp,
}: {
  props: Record<string, unknown>;
  setProp: (key: string, value: unknown) => void;
}) {
  return (
    <div className="space-y-4">
      <LocalizedArea
        label="Content (Markdown)"
        value={asLS(props.content)}
        onChange={(v) => setProp('content', v)}
        rows={8}
        hint="Supports Markdown formatting"
      />
    </div>
  );
}

// ─── 5. CTA Banner Editor ─────────────────────────────────────────────────────

function CtaBannerEditor({
  props,
  setProp,
}: {
  props: Record<string, unknown>;
  setProp: (key: string, value: unknown) => void;
}) {
  return (
    <div className="space-y-4">
      <LocalizedField label="Heading" value={asLS(props.heading)} onChange={(v) => setProp('heading', v)} />
      <LocalizedField label="Subtitle" value={asLS(props.subtitle)} onChange={(v) => setProp('subtitle', v)} />
      <LocalizedField
        label="Button Label"
        value={asLS(props.buttonLabel)}
        onChange={(v) => setProp('buttonLabel', v)}
      />
      <TextField
        label="Button Href"
        value={asString(props.buttonHref)}
        onChange={(v) => setProp('buttonHref', v)}
        placeholder="/appointment"
      />
      <SelectField
        label="Variant"
        value={asString(props.variant)}
        onChange={(v) => setProp('variant', v)}
        options={[
          { value: 'dark', label: 'Dark' },
          { value: 'brand', label: 'Brand' },
          { value: 'light', label: 'Light' },
        ]}
      />
    </div>
  );
}

// ─── 6. Blog Preview Editor ───────────────────────────────────────────────────

function BlogPreviewEditor({
  props,
  setProp,
}: {
  props: Record<string, unknown>;
  setProp: (key: string, value: unknown) => void;
}) {
  return (
    <div className="space-y-4">
      <LocalizedField label="Heading" value={asLS(props.heading)} onChange={(v) => setProp('heading', v)} />
      <LocalizedField label="Subtitle" value={asLS(props.subtitle)} onChange={(v) => setProp('subtitle', v)} />
      <label className="block">
        <span className="text-sm font-medium text-ink">Count</span>
        <input
          type="number"
          min={1}
          max={12}
          value={asNumber(props.count)}
          onChange={(e) => setProp('count', parseInt(e.target.value, 10) || 3)}
          className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-ink outline-none transition focus:border-brand focus:ring-2 focus:ring-brand/20"
        />
      </label>
    </div>
  );
}

// ─── 7. Timeline Editor ───────────────────────────────────────────────────────

function TimelineEditor({
  props,
  setProp,
  onUpdate,
}: {
  props: Record<string, unknown>;
  setProp: (key: string, value: unknown) => void;
  onUpdate: (props: Record<string, unknown>) => void;
}) {
  const items = asArray(props.items);

  const updateItem = (index: number, key: string, value: unknown) => {
    const updated = items.map((item, i) =>
      i === index ? { ...item, [key]: value } : item
    );
    onUpdate({ ...props, items: updated });
  };

  const addItem = () => {
    onUpdate({
      ...props,
      items: [...items, { role: EMPTY_LS, place: EMPTY_LS, period: '', description: EMPTY_LS }],
    });
  };

  const removeItem = (index: number) => {
    onUpdate({ ...props, items: items.filter((_, i) => i !== index) });
  };

  return (
    <div className="space-y-4">
      <LocalizedField label="Heading" value={asLS(props.heading)} onChange={(v) => setProp('heading', v)} />

      <div className="space-y-3">
        <span className="text-sm font-medium text-ink">Timeline Items</span>
        {items.map((item, i) => (
          <RepeaterRow key={i} onRemove={() => removeItem(i)}>
            <div className="space-y-3">
              <LocalizedField
                label="Role"
                value={asLS(item.role)}
                onChange={(v) => updateItem(i, 'role', v)}
              />
              <LocalizedField
                label="Place"
                value={asLS(item.place)}
                onChange={(v) => updateItem(i, 'place', v)}
              />
              <TextField
                label="Period"
                value={asString(item.period)}
                onChange={(v) => updateItem(i, 'period', v)}
                placeholder="e.g. 2020 – Present"
              />
              <LocalizedField
                label="Description"
                value={asLS(item.description)}
                onChange={(v) => updateItem(i, 'description', v)}
              />
            </div>
          </RepeaterRow>
        ))}
        <AddButton onClick={addItem} label="Add Item" />
      </div>
    </div>
  );
}

// ─── 8. Contact Card Editor ───────────────────────────────────────────────────

function ContactCardEditor({
  props,
  setProp,
  onUpdate,
}: {
  props: Record<string, unknown>;
  setProp: (key: string, value: unknown) => void;
  onUpdate: (props: Record<string, unknown>) => void;
}) {
  const items = asArray(props.items);

  const updateItem = (index: number, key: string, value: unknown) => {
    const updated = items.map((item, i) =>
      i === index ? { ...item, [key]: value } : item
    );
    onUpdate({ ...props, items: updated });
  };

  const addItem = () => {
    onUpdate({
      ...props,
      items: [...items, { icon: '', label: EMPTY_LS, value: '', href: '' }],
    });
  };

  const removeItem = (index: number) => {
    onUpdate({ ...props, items: items.filter((_, i) => i !== index) });
  };

  return (
    <div className="space-y-4">
      <LocalizedField label="Heading" value={asLS(props.heading)} onChange={(v) => setProp('heading', v)} />

      <div className="space-y-3">
        <span className="text-sm font-medium text-ink">Contact Items</span>
        {items.map((item, i) => (
          <RepeaterRow key={i} onRemove={() => removeItem(i)}>
            <div className="space-y-3">
              <TextField
                label="Icon"
                value={asString(item.icon)}
                onChange={(v) => updateItem(i, 'icon', v)}
                placeholder="e.g. phone, mail, map-pin"
              />
              <LocalizedField
                label="Label"
                value={asLS(item.label)}
                onChange={(v) => updateItem(i, 'label', v)}
              />
              <TextField
                label="Value"
                value={asString(item.value)}
                onChange={(v) => updateItem(i, 'value', v)}
                placeholder="e.g. +880 1234 567890"
              />
              <TextField
                label="Href"
                value={asString(item.href)}
                onChange={(v) => updateItem(i, 'href', v)}
                placeholder="e.g. tel:+8801234567890"
              />
            </div>
          </RepeaterRow>
        ))}
        <AddButton onClick={addItem} label="Add Item" />
      </div>
    </div>
  );
}

// ─── 9. Appointment Form Embed Editor ─────────────────────────────────────────

function AppointmentFormEmbedEditor({
  props,
  setProp,
}: {
  props: Record<string, unknown>;
  setProp: (key: string, value: unknown) => void;
}) {
  return (
    <div className="space-y-4">
      <LocalizedField label="Heading" value={asLS(props.heading)} onChange={(v) => setProp('heading', v)} />
      <LocalizedField label="Subtitle" value={asLS(props.subtitle)} onChange={(v) => setProp('subtitle', v)} />
      <CheckboxField
        label="Show Sidebar"
        checked={asBoolean(props.showSidebar)}
        onChange={(v) => setProp('showSidebar', v)}
      />
    </div>
  );
}

// ─── 10. Image + Text Editor ──────────────────────────────────────────────────

function ImageTextEditor({
  props,
  setProp,
}: {
  props: Record<string, unknown>;
  setProp: (key: string, value: unknown) => void;
}) {
  return (
    <div className="space-y-4">
      <TextField
        label="Image URL"
        value={asString(props.image)}
        onChange={(v) => setProp('image', v)}
        placeholder="/images/photo.jpg"
      />
      <LocalizedField label="Heading" value={asLS(props.heading)} onChange={(v) => setProp('heading', v)} />
      <LocalizedArea
        label="Text"
        value={asLS(props.text)}
        onChange={(v) => setProp('text', v)}
        rows={4}
      />
      <SelectField
        label="Image Position"
        value={asString(props.imagePosition)}
        onChange={(v) => setProp('imagePosition', v)}
        options={[
          { value: 'left', label: 'Left' },
          { value: 'right', label: 'Right' },
        ]}
      />
    </div>
  );
}

// ─── 11. Spacer Editor ────────────────────────────────────────────────────────

function SpacerEditor({
  props,
  setProp,
}: {
  props: Record<string, unknown>;
  setProp: (key: string, value: unknown) => void;
}) {
  return (
    <div className="space-y-4">
      <SelectField
        label="Size"
        value={asString(props.size)}
        onChange={(v) => setProp('size', v)}
        options={[
          { value: 'sm', label: 'Small (32px)' },
          { value: 'md', label: 'Medium (64px)' },
          { value: 'lg', label: 'Large (96px)' },
          { value: 'xl', label: 'Extra Large (128px)' },
        ]}
      />
    </div>
  );
}

// ─── Fallback JSON Editor ─────────────────────────────────────────────────────

function FallbackJsonEditor({
  props,
  onUpdate,
}: {
  props: Record<string, unknown>;
  onUpdate: (props: Record<string, unknown>) => void;
}) {
  return (
    <div>
      <label className="block text-xs font-medium text-muted mb-1">
        Block Properties (JSON)
      </label>
      <textarea
        className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 font-mono text-xs text-ink focus:border-brand focus:outline-none focus:ring-1 focus:ring-brand"
        rows={8}
        value={JSON.stringify(props, null, 2)}
        onChange={(e) => {
          try {
            const parsed = JSON.parse(e.target.value);
            onUpdate(parsed);
          } catch {
            // Invalid JSON, ignore until valid
          }
        }}
      />
      <p className="mt-1 text-xs text-muted">
        No dedicated editor for this block type. Edit JSON directly.
      </p>
    </div>
  );
}

// ─── Checkbox Field (shared utility) ──────────────────────────────────────────

function CheckboxField({
  label,
  checked,
  onChange,
}: {
  label: string;
  checked: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <label className="flex items-center gap-2 cursor-pointer">
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        className="h-4 w-4 rounded border-slate-300 text-brand focus:ring-brand/20"
      />
      <span className="text-sm font-medium text-ink">{label}</span>
    </label>
  );
}
