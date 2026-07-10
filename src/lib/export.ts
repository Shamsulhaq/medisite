// -----------------------------------------------------------------------------
// Dependency-free client-side exporters (CSV, Excel-compatible .xls, print PDF).
// Called only from client event handlers.
// -----------------------------------------------------------------------------

function escHtml(v: unknown): string {
  return String(v ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

function triggerDownload(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

export function downloadCSV(
  headers: string[],
  rows: (string | number)[][],
  filename: string
) {
  const esc = (v: string | number) => {
    const s = String(v ?? "");
    return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  };
  const csv = [headers, ...rows].map((r) => r.map(esc).join(",")).join("\n");
  // BOM for Excel UTF-8 compatibility.
  triggerDownload(
    new Blob(["\ufeff" + csv], { type: "text/csv;charset=utf-8;" }),
    filename
  );
}

export function downloadExcel(
  headers: string[],
  rows: (string | number)[][],
  filename: string
) {
  const thead = `<tr>${headers.map((h) => `<th>${escHtml(h)}</th>`).join("")}</tr>`;
  const tbody = rows
    .map((r) => `<tr>${r.map((c) => `<td>${escHtml(c)}</td>`).join("")}</tr>`)
    .join("");
  const html =
    `<html xmlns:o="urn:schemas-microsoft-com:office:office" ` +
    `xmlns:x="urn:schemas-microsoft-com:office:excel"><head>` +
    `<meta charset="utf-8"></head><body><table border="1">` +
    `<thead>${thead}</thead><tbody>${tbody}</tbody></table></body></html>`;
  triggerDownload(
    new Blob([html], { type: "application/vnd.ms-excel" }),
    filename
  );
}

export function openPrintPDF(
  title: string,
  headers: string[],
  rows: (string | number)[][]
) {
  const w = window.open("", "_blank");
  if (!w) return;
  const style =
    "body{font-family:system-ui,-apple-system,sans-serif;padding:24px;color:#0f172a}" +
    "h1{font-size:18px;margin:0 0 4px}p{color:#64748b;font-size:12px;margin:0 0 16px}" +
    "table{width:100%;border-collapse:collapse;font-size:11px}" +
    "th,td{border:1px solid #e2e8f0;padding:6px 8px;text-align:left;vertical-align:top}" +
    "th{background:#f1f5f9}";
  const thead = `<tr>${headers.map((h) => `<th>${escHtml(h)}</th>`).join("")}</tr>`;
  const tbody = rows
    .map((r) => `<tr>${r.map((c) => `<td>${escHtml(c)}</td>`).join("")}</tr>`)
    .join("");
  w.document.write(
    `<html><head><title>${escHtml(title)}</title><style>${style}</style></head>` +
      `<body><h1>${escHtml(title)}</h1><p>${rows.length} record(s)</p>` +
      `<table><thead>${thead}</thead><tbody>${tbody}</tbody></table></body></html>`
  );
  w.document.close();
  w.focus();
  setTimeout(() => w.print(), 300);
}
