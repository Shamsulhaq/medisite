"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import QRCode from "qrcode";

type Props = {
  patientId: string;
  targetType: "test_report" | "attachment";
  onComplete: (files: string[]) => void;
  onClose: () => void;
};

export default function QRUploadModal({ patientId, targetType, onComplete, onClose }: Props) {
  const [token, setToken] = useState<string | null>(null);
  const [expiresAt, setExpiresAt] = useState<Date | null>(null);
  const [status, setStatus] = useState<"loading" | "waiting" | "completed" | "expired" | "error">("loading");
  const [countdown, setCountdown] = useState("");
  const [error, setError] = useState("");
  const [qrDataUrl, setQrDataUrl] = useState("");
  const [uploadedFiles, setUploadedFiles] = useState<string[]>([]);
  const eventSourceRef = useRef<EventSource | null>(null);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const countdownRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const onCompleteRef = useRef(onComplete);

  // Keep onComplete ref up to date without triggering re-effects
  useEffect(() => {
    onCompleteRef.current = onComplete;
  }, [onComplete]);

  const cleanup = useCallback(() => {
    if (eventSourceRef.current) {
      eventSourceRef.current.close();
      eventSourceRef.current = null;
    }
    if (pollRef.current) {
      clearInterval(pollRef.current);
      pollRef.current = null;
    }
    if (countdownRef.current) {
      clearInterval(countdownRef.current);
      countdownRef.current = null;
    }
  }, []);

  const startPollingFallback = useCallback((sessionToken: string) => {
    // Fallback polling if SSE is not supported or errors out
    if (pollRef.current) clearInterval(pollRef.current);

    pollRef.current = setInterval(async () => {
      try {
        const res = await fetch(`/api/admin/upload-session?token=${sessionToken}`);
        const data = await res.json();
        if (data.status === "completed") {
          setStatus("completed");
          setUploadedFiles(data.files ?? []);
          onCompleteRef.current(data.files ?? []);
          if (pollRef.current) clearInterval(pollRef.current);
        } else if (data.status === "expired") {
          setStatus("expired");
          if (pollRef.current) clearInterval(pollRef.current);
        }
      } catch {
        // Ignore poll errors — will retry next interval
      }
    }, 3000);
  }, []);

  const startSSE = useCallback((sessionToken: string) => {
    // Check if EventSource is supported
    if (typeof EventSource === "undefined") {
      startPollingFallback(sessionToken);
      return;
    }

    const es = new EventSource(`/api/admin/upload-session/stream?token=${sessionToken}`);
    eventSourceRef.current = es;

    es.addEventListener("update", (e) => {
      try {
        const data = JSON.parse(e.data);
        if (data.status === "completed") {
          setStatus("completed");
          setUploadedFiles(data.files ?? []);
          onCompleteRef.current(data.files ?? []);
          es.close();
          eventSourceRef.current = null;
        }
      } catch {
        // Ignore parse errors
      }
    });

    es.addEventListener("expired", () => {
      setStatus("expired");
      es.close();
      eventSourceRef.current = null;
    });

    es.addEventListener("connected", () => {
      // Stream connected successfully
    });

    es.onerror = () => {
      // EventSource will auto-reconnect for temporary errors.
      // If readyState is CLOSED, fall back to polling.
      if (es.readyState === EventSource.CLOSED) {
        eventSourceRef.current = null;
        startPollingFallback(sessionToken);
      }
    };
  }, [startPollingFallback]);

  const createSession = useCallback(async () => {
    cleanup();
    setStatus("loading");
    setError("");
    setUploadedFiles([]);
    try {
      const res = await fetch("/api/admin/upload-session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ patientId, targetType }),
      });
      const data = await res.json();
      if (res.ok && data.ok) {
        setToken(data.token);
        setExpiresAt(new Date(data.expiresAt));
        setStatus("waiting");
        // Start SSE stream
        startSSE(data.token);
      } else {
        setStatus("error");
        setError(data.error || "Failed to create upload session");
      }
    } catch {
      setStatus("error");
      setError("Network error");
    }
  }, [patientId, targetType, cleanup, startSSE]);

  useEffect(() => {
    createSession();
    return cleanup;
  }, [createSession, cleanup]);

  // Countdown timer
  useEffect(() => {
    if (status !== "waiting" || !expiresAt) return;

    function update() {
      const diff = expiresAt!.getTime() - Date.now();
      if (diff <= 0) {
        setCountdown("0:00");
        setStatus("expired");
        return;
      }
      const mins = Math.floor(diff / 60000);
      const secs = Math.floor((diff % 60000) / 1000);
      setCountdown(`${mins}:${secs.toString().padStart(2, "0")}`);
    }

    update();
    countdownRef.current = setInterval(update, 1000);

    return () => {
      if (countdownRef.current) {
        clearInterval(countdownRef.current);
        countdownRef.current = null;
      }
    };
  }, [status, expiresAt]);

  const uploadUrl = token ? `${typeof window !== "undefined" ? window.location.origin : ""}/upload/${token}` : "";

  // Generate QR code data URL
  useEffect(() => {
    if (uploadUrl) {
      QRCode.toDataURL(uploadUrl, { width: 200, margin: 1 }).then(setQrDataUrl).catch(() => setQrDataUrl(""));
    }
  }, [uploadUrl]);

  const isImageFile = (url: string) => /\.(jpg|jpeg|png|webp|gif)$/i.test(url);

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/60 p-4" onClick={onClose}>
      <div className="relative w-full max-w-sm rounded-xl bg-white p-6 shadow-2xl" onClick={(e) => e.stopPropagation()}>
        <button
          type="button"
          onClick={onClose}
          className="absolute right-3 top-3 rounded-full p-1 text-slate-400 transition hover:bg-slate-100 hover:text-slate-600"
          aria-label="Close"
        >
          <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        <h3 className="text-lg font-semibold text-slate-900">📱 Upload from Phone</h3>
        <p className="mt-1 text-sm text-slate-500">Scan this QR code with your phone to upload files</p>

        <div className="mt-4 flex flex-col items-center">
          {status === "loading" && (
            <div className="flex h-48 items-center justify-center">
              <div className="h-8 w-8 animate-spin rounded-full border-4 border-slate-200 border-t-teal-600"></div>
            </div>
          )}

          {status === "waiting" && (
            <>
              <div className="rounded-lg border border-slate-200 bg-white p-2">
                <img
                  src={qrDataUrl}
                  alt="QR Code for upload"
                  width={200}
                  height={200}
                  className="block"
                />
              </div>
              <div className="mt-3 flex items-center gap-2">
                <span className="relative flex h-3 w-3">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-green-400 opacity-75"></span>
                  <span className="relative inline-flex h-3 w-3 rounded-full bg-green-500"></span>
                </span>
                <span className="text-sm text-slate-600">
                  Waiting for upload
                  <span className="inline-flex w-6">
                    <span className="animate-pulse">...</span>
                  </span>
                </span>
                <span className="rounded bg-slate-100 px-2 py-0.5 text-xs font-mono font-medium text-slate-700">{countdown}</span>
              </div>
              <div className="mt-2 flex items-center gap-1.5 text-xs text-slate-400">
                <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
                <span>Real-time • Instant notification on upload</span>
              </div>
              <p className="mt-2 text-center text-xs text-slate-400 break-all">{uploadUrl}</p>
            </>
          )}

          {status === "completed" && (
            <div className="flex flex-col items-center py-6 transition-all duration-500 ease-out">
              <div className="mb-3 flex h-14 w-14 items-center justify-center rounded-full bg-green-100 animate-[scaleIn_0.3s_ease-out]">
                <svg className="h-7 w-7 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <p className="text-base font-semibold text-green-700">Files uploaded!</p>
              <p className="mt-1 text-sm text-slate-500">
                {uploadedFiles.length} file{uploadedFiles.length !== 1 ? "s" : ""} received successfully.
              </p>
              {/* File thumbnails */}
              {uploadedFiles.length > 0 && (
                <div className="mt-3 flex flex-wrap justify-center gap-2">
                  {uploadedFiles.map((url) => (
                    <div key={url} className="relative h-14 w-14 overflow-hidden rounded-lg border border-slate-200 bg-slate-50">
                      {isImageFile(url) ? (
                        <img src={url} alt="Uploaded" className="h-full w-full object-cover" />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center">
                          <svg className="h-6 w-6 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
                          </svg>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {status === "expired" && (
            <div className="flex flex-col items-center py-6">
              <div className="mb-3 flex h-14 w-14 items-center justify-center rounded-full bg-amber-100">
                <svg className="h-7 w-7 text-amber-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <p className="text-base font-semibold text-amber-700">Session Expired</p>
              <button
                type="button"
                onClick={createSession}
                className="mt-3 rounded-lg bg-teal-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-teal-700"
              >
                Regenerate QR Code
              </button>
            </div>
          )}

          {status === "error" && (
            <div className="flex flex-col items-center py-6">
              <p className="text-sm text-red-600">{error}</p>
              <button
                type="button"
                onClick={createSession}
                className="mt-3 rounded-lg bg-teal-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-teal-700"
              >
                Try Again
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
