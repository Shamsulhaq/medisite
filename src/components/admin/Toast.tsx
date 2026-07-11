"use client";

export type ToastType = "success" | "error" | "info";

const STYLES: Record<ToastType, string> = {
  success: "bg-green-600 text-white",
  error: "bg-red-600 text-white",
  info: "bg-blue-600 text-white",
};

const ICONS: Record<ToastType, string> = {
  success: "✓",
  error: "✕",
  info: "ℹ",
};

export default function Toast({
  type,
  message,
  onClose,
}: {
  type: ToastType;
  message: string;
  onClose: () => void;
}) {
  return (
    <div
      className={`fixed top-0 left-0 right-0 z-[9999] animate-slide-down flex items-center justify-between gap-3 px-5 py-3 shadow-lg ${STYLES[type]}`}
      role="alert"
    >
      <div className="flex items-center gap-2">
        <span className="text-lg font-bold">{ICONS[type]}</span>
        <p className="text-sm font-medium">{message}</p>
      </div>
      <button
        type="button"
        onClick={onClose}
        className="shrink-0 rounded p-1 hover:bg-white/20 transition"
        aria-label="Close notification"
      >
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4" aria-hidden="true">
          <path d="M18 6 6 18" /><path d="m6 6 12 12" />
        </svg>
      </button>
    </div>
  );
}
