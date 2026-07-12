"use client";

import { useRef, useState } from "react";

type UploadState = "idle" | "uploading" | "success" | "error";

export default function MobileUploadClient({ token, patientName }: { token: string; patientName: string }) {
  const [state, setState] = useState<UploadState>("idle");
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState("");
  const [uploadedFiles, setUploadedFiles] = useState<string[]>([]);
  const cameraRef = useRef<HTMLInputElement>(null);
  const galleryRef = useRef<HTMLInputElement>(null);

  async function uploadFiles(files: FileList | null) {
    if (!files || files.length === 0) return;

    setState("uploading");
    setError("");
    setProgress(0);

    const formData = new FormData();
    for (let i = 0; i < files.length; i++) {
      formData.append("files", files[i]);
    }

    try {
      const res = await fetch(`/api/upload/${token}`, {
        method: "POST",
        body: formData,
      });

      const data = await res.json();

      if (res.ok && data.ok) {
        setState("success");
        setUploadedFiles(data.files);
      } else {
        setState("error");
        setError(data.error || "Upload failed. Please try again.");
      }
    } catch {
      setState("error");
      setError("Network error. Please check your connection and try again.");
    }
  }

  if (state === "success") {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50 p-4">
        <div className="w-full max-w-sm rounded-xl bg-white p-8 text-center shadow-lg">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-green-100">
            <svg className="h-8 w-8 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h1 className="text-xl font-bold text-slate-900">Files Uploaded Successfully</h1>
          <p className="mt-2 text-sm text-slate-500">
            {uploadedFiles.length} file{uploadedFiles.length !== 1 ? "s" : ""} uploaded for {patientName}&apos;s record. You can close this page.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 p-4">
      <div className="w-full max-w-sm rounded-xl bg-white p-6 shadow-lg">
        <div className="mb-6 text-center">
          <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-full bg-teal-100">
            <svg className="h-7 w-7 text-teal-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          </div>
          <h1 className="text-lg font-bold text-slate-900">Upload Files</h1>
          <p className="mt-1 text-sm text-slate-500">
            Upload files for <span className="font-medium text-slate-700">{patientName}</span>&apos;s record
          </p>
        </div>

        {state === "error" && (
          <div className="mb-4 rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        )}

        {state === "uploading" ? (
          <div className="space-y-4 text-center">
            <div className="mx-auto h-12 w-12 animate-spin rounded-full border-4 border-slate-200 border-t-teal-600"></div>
            <p className="text-sm font-medium text-slate-600">Uploading...</p>
          </div>
        ) : (
          <div className="space-y-3">
            {/* Camera capture */}
            <input
              ref={cameraRef}
              type="file"
              accept="image/*"
              capture="environment"
              multiple
              className="hidden"
              onChange={(e) => uploadFiles(e.target.files)}
            />
            <button
              type="button"
              onClick={() => cameraRef.current?.click()}
              className="flex w-full items-center justify-center gap-3 rounded-xl border-2 border-dashed border-teal-300 bg-teal-50 px-6 py-5 text-base font-semibold text-teal-700 transition hover:bg-teal-100 active:scale-[0.98]"
            >
              <span className="text-2xl">📷</span>
              Capture Photo
            </button>

            {/* Gallery pick */}
            <input
              ref={galleryRef}
              type="file"
              accept="image/*,application/pdf"
              multiple
              className="hidden"
              onChange={(e) => uploadFiles(e.target.files)}
            />
            <button
              type="button"
              onClick={() => galleryRef.current?.click()}
              className="flex w-full items-center justify-center gap-3 rounded-xl border-2 border-dashed border-slate-300 bg-slate-50 px-6 py-5 text-base font-semibold text-slate-700 transition hover:bg-slate-100 active:scale-[0.98]"
            >
              <span className="text-2xl">🖼</span>
              Choose from Gallery
            </button>

            <p className="pt-2 text-center text-xs text-slate-400">
              Supported: JPG, PNG, PDF · Max 8MB per file
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
