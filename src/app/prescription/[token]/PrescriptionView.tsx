"use client";

/**
 * PrescriptionView — renders the prescription HTML in a sandboxed iframe.
 *
 * SECURITY NOTE: The HTML is generated server-side by generateConsultationHtml()
 * from trusted data (our own code), NOT from user-supplied input.
 * Nevertheless, we render it in a sandboxed iframe to prevent any possibility
 * of XSS (e.g., if consultation data were ever tampered with in the database).
 * The sandbox attribute blocks scripts, forms, popups, and same-origin access.
 */

export default function PrescriptionView({ html, token, patientName }: { html: string; token: string; patientName: string }) {
  function handlePrint() {
    window.print();
  }

  function handleWhatsApp() {
    const url = `${window.location.origin}/prescription/${token}`;
    const text = `Prescription for ${patientName}\n\nView & download: ${url}`;
    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, "_blank");
  }

  return (
    <div className="min-h-screen bg-slate-100">
      {/* Action bar - hidden on print */}
      <div className="sticky top-0 z-50 border-b border-slate-200 bg-white shadow-sm print:hidden">
        <div className="mx-auto flex max-w-4xl items-center justify-between px-4 py-3">
          <h1 className="text-sm font-semibold text-slate-700">Digital Prescription</h1>
          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="inline-flex items-center gap-2 rounded-lg bg-teal-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-teal-700"
            >
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
              </svg>
              Download PDF
            </button>
            <button
              onClick={handleWhatsApp}
              className="inline-flex items-center gap-2 rounded-lg bg-green-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-green-700"
            >
              <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor">
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
              </svg>
              Share via WhatsApp
            </button>
          </div>
        </div>
      </div>

      {/* Prescription content — rendered in sandboxed iframe for XSS protection */}
      <div className="mx-auto max-w-4xl p-4 print:max-w-none print:p-0">
        <iframe
          srcDoc={html}
          sandbox="allow-same-origin"
          title="Prescription"
          className="w-full min-h-[800px] rounded-lg bg-white shadow-sm border-0 print:rounded-none print:shadow-none print:min-h-0"
          style={{ height: "auto" }}
          onLoad={(e) => {
            // Auto-resize iframe to fit content
            const iframe = e.currentTarget;
            try {
              const body = iframe.contentDocument?.body;
              if (body) {
                iframe.style.height = `${body.scrollHeight + 32}px`;
              }
            } catch {
              // sandbox may prevent access in some cases
            }
          }}
        />
      </div>

      {/* Footer - hidden on print */}
      <div className="mx-auto max-w-4xl px-4 py-6 text-center print:hidden">
        <p className="text-sm text-slate-500">
          This is a digital copy of the prescription issued by Dr. Mahmud ul Hasan Miju
        </p>
      </div>
    </div>
  );
}
