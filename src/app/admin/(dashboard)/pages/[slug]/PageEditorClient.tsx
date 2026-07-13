'use client';

import { useState, useCallback, useTransition, useEffect, useRef, useId } from 'react';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core';
import {
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
  arrayMove,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import type { BlockInstance, BlockDefinition } from '@/lib/page-builder/types';
import type { PageTemplate } from '@/lib/page-builder/templates/home';
import { savePageAction } from './actions';
import BlockEditor from './BlockEditors';

// ─── Props ────────────────────────────────────────────────────────────────────

interface PageEditorClientProps {
  slug: string;
  initialBlocks: BlockInstance[];
  blockDefinitions: BlockDefinition[];
  templates: PageTemplate[];
}

// ─── Main Editor ──────────────────────────────────────────────────────────────

export default function PageEditorClient({
  slug,
  initialBlocks,
  blockDefinitions,
  templates,
}: PageEditorClientProps) {
  const dndId = useId();
  const [blocks, setBlocks] = useState<BlockInstance[]>(initialBlocks);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [showPalette, setShowPalette] = useState(false);
  const [showTemplates, setShowTemplates] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saved' | 'error'>('idle');

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  // ─── Handlers ───────────────────────────────────────────────────────────────

  const handleDragEnd = useCallback((event: DragEndEvent) => {
    const { active, over } = event;
    if (over && active.id !== over.id) {
      setBlocks((prev) => {
        const oldIndex = prev.findIndex((b) => b.id === active.id);
        const newIndex = prev.findIndex((b) => b.id === over.id);
        return arrayMove(prev, oldIndex, newIndex);
      });
    }
  }, []);

  const addBlock = useCallback((def: BlockDefinition) => {
    const newBlock: BlockInstance = {
      id: `block-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      type: def.type,
      props: structuredClone(def.defaultProps),
      visible: true,
    };
    setBlocks((prev) => [...prev, newBlock]);
    setShowPalette(false);
  }, []);

  const removeBlock = useCallback((id: string) => {
    setBlocks((prev) => prev.filter((b) => b.id !== id));
    if (editingId === id) setEditingId(null);
  }, [editingId]);

  const toggleVisibility = useCallback((id: string) => {
    setBlocks((prev) =>
      prev.map((b) => (b.id === id ? { ...b, visible: !b.visible } : b))
    );
  }, []);

  const updateBlockProps = useCallback((id: string, newProps: Record<string, unknown>) => {
    setBlocks((prev) =>
      prev.map((b) => (b.id === id ? { ...b, props: newProps } : b))
    );
  }, []);

  const applyTemplate = useCallback((template: PageTemplate) => {
    const blocksWithIds = template.blocks.map((b) => ({
      ...b,
      id: `block-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    }));
    setBlocks(blocksWithIds);
    setShowTemplates(false);
    setEditingId(null);
  }, []);

  const handleSave = useCallback(() => {
    startTransition(async () => {
      try {
        const result = await savePageAction(slug, blocks);
        if (result.ok) {
          setSaveStatus('saved');
          setTimeout(() => setSaveStatus('idle'), 2000);
        }
      } catch {
        setSaveStatus('error');
        setTimeout(() => setSaveStatus('idle'), 3000);
      }
    });
  }, [slug, blocks]);

  const getDefLabel = (type: string) =>
    blockDefinitions.find((d) => d.type === type)?.label ?? type;

  const getDefIcon = (type: string) =>
    blockDefinitions.find((d) => d.type === type)?.icon ?? 'grid';

  // ─── Live Preview ─────────────────────────────────────────────────────────────

  const [previewLoading, setPreviewLoading] = useState(false);
  const [previewKey, setPreviewKey] = useState(0);
  const [previewViewport, setPreviewViewport] = useState<'desktop' | 'tablet' | 'mobile'>('desktop');
  const previewTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isInitialMount = useRef(true);

  // Map slug to the public page URL
  const previewUrl = slug === 'home' ? '/' : slug === 'about' ? '/about' : slug === 'appointment' ? '/appointment' : '/';

  // Auto-save + refresh preview on every edit (debounced 500ms).
  // This makes edits truly live — they immediately affect the real public page.
  useEffect(() => {
    // Skip auto-save on initial mount (page just loaded, blocks haven't changed)
    if (isInitialMount.current) {
      isInitialMount.current = false;
      // Trigger initial preview load
      setPreviewKey((k) => k + 1);
      return;
    }
    if (previewTimerRef.current) clearTimeout(previewTimerRef.current);
    previewTimerRef.current = setTimeout(async () => {
      setPreviewLoading(true);
      try {
        await savePageAction(slug, blocks);
        // Refresh the preview iframe by changing the key
        setPreviewKey((k) => k + 1);
        setSaveStatus('saved');
        setTimeout(() => setSaveStatus('idle'), 1500);
      } catch {
        // Non-critical preview failure
      }
      setPreviewLoading(false);
    }, 500);
    return () => {
      if (previewTimerRef.current) clearTimeout(previewTimerRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [blocks, slug]);

  // ─── Resizable Panel ───────────────────────────────────────────────────────────

  const [editorWidth, setEditorWidth] = useState(400);
  const isDraggingRef = useRef(false);
  const startXRef = useRef(0);
  const startWidthRef = useRef(400);

  const handleResizeStart = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    isDraggingRef.current = true;
    startXRef.current = e.clientX;
    startWidthRef.current = editorWidth;

    const handleMouseMove = (ev: MouseEvent) => {
      if (!isDraggingRef.current) return;
      const delta = ev.clientX - startXRef.current;
      const newWidth = Math.max(280, Math.min(700, startWidthRef.current + delta));
      setEditorWidth(newWidth);
    };

    const handleMouseUp = () => {
      isDraggingRef.current = false;
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
    };

    document.body.style.cursor = 'col-resize';
    document.body.style.userSelect = 'none';
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  }, [editorWidth]);

  // ─── Render ─────────────────────────────────────────────────────────────────

  return (
    <div className="flex">
      {/* Editor Panel (left — scrollable, resizable) */}
      <div
        className="shrink-0 space-y-4 overflow-y-auto pr-2"
        style={{ width: `${editorWidth}px`, maxHeight: 'calc(100vh - 120px)' }}
      >
      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={() => setShowPalette(true)}
          className="inline-flex items-center gap-1.5 rounded-lg bg-brand px-4 py-2 text-sm font-medium text-white transition hover:bg-brand-dark"
        >
          <PlusIcon /> Add Block
        </button>
        {templates.length > 0 && (
          <button
            type="button"
            onClick={() => setShowTemplates(true)}
            className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-ink transition hover:border-brand hover:text-brand"
          >
            <TemplateIcon /> Apply Template
          </button>
        )}
        <div className="ml-auto flex items-center gap-2">
          {saveStatus === 'saved' && (
            <span className="text-sm text-green-600">✓ Saved</span>
          )}
          {saveStatus === 'error' && (
            <span className="text-sm text-red-600">Save failed</span>
          )}
          <button
            type="button"
            onClick={handleSave}
            disabled={isPending}
            className="inline-flex items-center gap-1.5 rounded-lg bg-ink px-4 py-2 text-sm font-medium text-white transition hover:bg-ink/90 disabled:opacity-50"
          >
            {isPending ? 'Saving…' : 'Save Changes'}
          </button>
        </div>
      </div>

      {/* Block List */}
      <DndContext id={dndId} sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
        <SortableContext items={blocks.map((b) => b.id)} strategy={verticalListSortingStrategy}>
          <div className="space-y-2">
            {blocks.length === 0 && (
              <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50 p-12 text-center">
                <p className="text-sm text-muted">No blocks yet. Add a block or apply a template to get started.</p>
              </div>
            )}
            {blocks.map((block) => (
              <SortableBlockCard
                key={block.id}
                block={block}
                label={getDefLabel(block.type)}
                icon={getDefIcon(block.type)}
                isEditing={editingId === block.id}
                onEdit={() => setEditingId(editingId === block.id ? null : block.id)}
                onRemove={() => removeBlock(block.id)}
                onToggleVisibility={() => toggleVisibility(block.id)}
                onUpdateProps={(props) => updateBlockProps(block.id, props)}
              />
            ))}
          </div>
        </SortableContext>
      </DndContext>

      {/* Block Palette Modal */}
      {showPalette && (
        <Modal title="Add Block" onClose={() => setShowPalette(false)}>
          <div className="grid gap-3 sm:grid-cols-2">
            {blockDefinitions.map((def) => (
              <button
                key={def.type}
                type="button"
                onClick={() => addBlock(def)}
                className="rounded-lg border border-slate-200 bg-white p-4 text-left transition hover:border-brand hover:shadow-sm"
              >
                <div className="flex items-center gap-2">
                  <BlockIconDisplay icon={def.icon} />
                  <span className="font-medium text-ink">{def.label}</span>
                </div>
              </button>
            ))}
          </div>
        </Modal>
      )}

      {/* Template Picker Modal */}
      {showTemplates && (
        <Modal title="Apply Template" onClose={() => setShowTemplates(false)}>
          <p className="mb-3 text-sm text-muted">This will replace all current blocks.</p>
          <div className="grid gap-3">
            {templates.map((tpl) => (
              <button
                key={tpl.id}
                type="button"
                onClick={() => applyTemplate(tpl)}
                className="rounded-lg border border-slate-200 bg-white p-4 text-left transition hover:border-brand hover:shadow-sm"
              >
                <h4 className="font-medium text-ink">{tpl.name}</h4>
                <p className="mt-0.5 text-sm text-muted">{tpl.description}</p>
                <p className="mt-1 text-xs text-muted">{tpl.blocks.length} blocks</p>
              </button>
            ))}
          </div>
        </Modal>
      )}
      </div>{/* end editor panel */}

      {/* Resize Handle */}
      <div
        onMouseDown={handleResizeStart}
        className="hidden lg:flex w-2 shrink-0 cursor-col-resize items-center justify-center group"
        title="Drag to resize"
      >
        <div className="h-8 w-1 rounded-full bg-slate-300 transition group-hover:bg-brand group-active:bg-brand" />
      </div>

      {/* Live Preview Panel (right — takes remaining space) */}
      <div className="hidden flex-1 min-w-0 lg:block">
        <div className="sticky top-20">
          <div className="mb-2 flex items-center justify-between">
            <h3 className="text-sm font-semibold text-ink">Live Preview</h3>
            <div className="flex items-center gap-1">
              {previewLoading && (
                <span className="text-xs text-muted animate-pulse mr-2">Updating...</span>
              )}
              {!previewLoading && saveStatus === 'saved' && (
                <span className="text-xs text-green-600 mr-2">✓ Live</span>
              )}
            </div>
          </div>
          {/* Viewport Tabs */}
          <div className="mb-2 flex items-center gap-1 rounded-lg border border-slate-200 bg-slate-50 p-1">
            <ViewportTab
              active={previewViewport === 'desktop'}
              onClick={() => setPreviewViewport('desktop')}
              label="Desktop"
              icon={<DesktopIcon />}
            />
            <ViewportTab
              active={previewViewport === 'tablet'}
              onClick={() => setPreviewViewport('tablet')}
              label="Tablet"
              icon={<TabletIcon />}
            />
            <ViewportTab
              active={previewViewport === 'mobile'}
              onClick={() => setPreviewViewport('mobile')}
              label="Mobile"
              icon={<MobileIcon />}
            />
          </div>
          <div
            className="mx-auto overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm transition-all duration-300"
            style={{
              height: 'calc(100vh - 200px)',
              width: previewViewport === 'desktop' ? '100%' : previewViewport === 'tablet' ? '768px' : '375px',
              maxWidth: '100%',
            }}
          >
            <iframe
              key={previewKey}
              src={`${previewUrl}?preview=${previewKey}`}
              className="h-full border-0"
              title="Page Preview"
              style={{
                width: previewViewport === 'desktop' ? '100%' : previewViewport === 'tablet' ? '768px' : '375px',
                maxWidth: '100%',
              }}
            />
          </div>
          <p className="mt-2 text-xs text-muted text-center">
            Changes auto-save and reflect on the live site in real-time.
          </p>
        </div>
      </div>
    </div>
  );
}

// ─── Sortable Block Card ──────────────────────────────────────────────────────

interface SortableBlockCardProps {
  block: BlockInstance;
  label: string;
  icon: string;
  isEditing: boolean;
  onEdit: () => void;
  onRemove: () => void;
  onToggleVisibility: () => void;
  onUpdateProps: (props: Record<string, unknown>) => void;
}

function SortableBlockCard({
  block,
  label,
  icon,
  isEditing,
  onEdit,
  onRemove,
  onToggleVisibility,
  onUpdateProps,
}: SortableBlockCardProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    setActivatorNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: block.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div ref={setNodeRef} style={style} {...attributes}>
      <div
        className={`rounded-xl border bg-white transition ${
          block.visible ? 'border-slate-200' : 'border-dashed border-slate-300 bg-slate-50'
        } ${isDragging ? 'shadow-lg' : ''}`}
      >
        {/* Card Header */}
        <div className="flex items-center gap-3 px-4 py-3">
          {/* Drag Handle */}
          <button
            ref={setActivatorNodeRef}
            {...listeners}
            type="button"
            className="cursor-grab touch-none text-slate-400 hover:text-slate-600"
            aria-label="Drag to reorder"
          >
            <GripIcon />
          </button>

          {/* Block Info */}
          <div className="flex items-center gap-2 flex-1 min-w-0">
            <BlockIconDisplay icon={icon} />
            <span className={`font-medium text-sm ${block.visible ? 'text-ink' : 'text-muted line-through'}`}>
              {label}
            </span>
            {!block.visible && (
              <span className="text-xs text-muted">(hidden)</span>
            )}
          </div>

          {/* Actions */}
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={onToggleVisibility}
              className="rounded-md p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
              aria-label={block.visible ? 'Hide block' : 'Show block'}
              title={block.visible ? 'Hide block' : 'Show block'}
            >
              {block.visible ? <EyeIcon /> : <EyeOffIcon />}
            </button>
            <button
              type="button"
              onClick={onEdit}
              className={`rounded-md p-1.5 transition ${
                isEditing
                  ? 'bg-brand/10 text-brand'
                  : 'text-slate-400 hover:bg-slate-100 hover:text-slate-600'
              }`}
              aria-label="Edit block"
              title="Edit block"
            >
              <EditIcon />
            </button>
            <button
              type="button"
              onClick={onRemove}
              className="rounded-md p-1.5 text-slate-400 hover:bg-red-50 hover:text-red-600"
              aria-label="Delete block"
              title="Delete block"
            >
              <TrashIcon />
            </button>
          </div>
        </div>

        {/* Inline Editor (Rich block editor) */}
        {isEditing && (
          <div className="border-t border-slate-100 px-4 py-3">
            <BlockEditor block={block} onUpdate={onUpdateProps} />
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Modal ────────────────────────────────────────────────────────────────────

function Modal({
  title,
  onClose,
  children,
}: {
  title: string;
  onClose: () => void;
  children: React.ReactNode;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/40"
        onClick={onClose}
        aria-hidden="true"
      />
      {/* Panel */}
      <div className="relative w-full max-w-lg rounded-xl bg-white p-6 shadow-xl">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-ink">{title}</h2>
          <button
            type="button"
            onClick={onClose}
            className="rounded-md p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
            aria-label="Close"
          >
            <CloseIcon />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}

// ─── Block Icon Display ───────────────────────────────────────────────────────

function BlockIconDisplay({ icon }: { icon: string }) {
  const iconMap: Record<string, string> = {
    star: '⭐',
    chart: '📊',
    grid: '▦',
    document: '📄',
    megaphone: '📢',
  };
  return (
    <span className="flex h-7 w-7 items-center justify-center rounded-md bg-slate-100 text-sm" aria-hidden="true">
      {iconMap[icon] || '▦'}
    </span>
  );
}

// ─── Inline SVG Icons ─────────────────────────────────────────────────────────

function PlusIcon() {
  return (
    <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
    </svg>
  );
}

function TemplateIcon() {
  return (
    <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 5a1 1 0 011-1h4a1 1 0 011 1v5a1 1 0 01-1 1H5a1 1 0 01-1-1V5zm10 0a1 1 0 011-1h4a1 1 0 011 1v2a1 1 0 01-1 1h-4a1 1 0 01-1-1V5zm0 7a1 1 0 011-1h4a1 1 0 011 1v5a1 1 0 01-1 1h-4a1 1 0 01-1-1v-5zM4 13a1 1 0 011-1h4a1 1 0 011 1v2a1 1 0 01-1 1H5a1 1 0 01-1-1v-2z" />
    </svg>
  );
}

function GripIcon() {
  return (
    <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
      <circle cx="9" cy="6" r="1.5" />
      <circle cx="15" cy="6" r="1.5" />
      <circle cx="9" cy="12" r="1.5" />
      <circle cx="15" cy="12" r="1.5" />
      <circle cx="9" cy="18" r="1.5" />
      <circle cx="15" cy="18" r="1.5" />
    </svg>
  );
}

function EyeIcon() {
  return (
    <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
    </svg>
  );
}

function EyeOffIcon() {
  return (
    <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
    </svg>
  );
}

function EditIcon() {
  return (
    <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
    </svg>
  );
}

function TrashIcon() {
  return (
    <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
    </svg>
  );
}

function CloseIcon() {
  return (
    <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
    </svg>
  );
}

// ─── Viewport Tab ─────────────────────────────────────────────────────────────

function ViewportTab({
  active,
  onClick,
  label,
  icon,
}: {
  active: boolean;
  onClick: () => void;
  label: string;
  icon: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex flex-1 items-center justify-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium transition ${
        active
          ? 'bg-white text-ink shadow-sm'
          : 'text-muted hover:text-ink'
      }`}
      title={label}
    >
      {icon}
      <span className="hidden xl:inline">{label}</span>
    </button>
  );
}

// ─── Viewport Icons ───────────────────────────────────────────────────────────

function DesktopIcon() {
  return (
    <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
    </svg>
  );
}

function TabletIcon() {
  return (
    <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 18h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
    </svg>
  );
}

function MobileIcon() {
  return (
    <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
    </svg>
  );
}
