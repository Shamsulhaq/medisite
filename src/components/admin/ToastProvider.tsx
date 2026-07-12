"use client";

import { createContext, useCallback, useContext, useState, useRef } from "react";
import Toast, { type ToastType } from "./Toast";

type ToastContextValue = {
  toast: (type: ToastType, message: string) => void;
};

const ToastContext = createContext<ToastContextValue | null>(null);

export function useToast(): ToastContextValue {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error("useToast must be used within ToastProvider");
  return ctx;
}

export default function ToastProvider({ children }: { children: React.ReactNode }) {
  const [current, setCurrent] = useState<{ type: ToastType; message: string } | null>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const dismiss = useCallback(() => {
    setCurrent(null);
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  const toast = useCallback((type: ToastType, message: string) => {
    // Clear existing timer
    if (timerRef.current) {
      clearTimeout(timerRef.current);
    }
    setCurrent({ type, message });
    // Auto-dismiss after 5 seconds
    timerRef.current = setTimeout(() => {
      setCurrent(null);
      timerRef.current = null;
    }, 5000);
  }, []);

  return (
    <ToastContext.Provider value={{ toast }}>
      {current && (
        <Toast type={current.type} message={current.message} onClose={dismiss} />
      )}
      {children}
    </ToastContext.Provider>
  );
}
