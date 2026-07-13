// -----------------------------------------------------------------------------
// Prescription Design Templates — presets that doctors can select to quickly
// set up their prescription layout without designing from scratch.
// -----------------------------------------------------------------------------

import type { PrescriptionLayout } from "./prescription-layout";

export type PrescriptionDesignTemplate = {
  id: string;
  name: string;
  description: string;
  preview: string; // emoji or short label for visual identification
  layout: PrescriptionLayout;
};

function genId(prefix: string) { return `${prefix}-${Date.now()}`; }

// ─── Template 1: Classic (3-column header, standard layout) ─────────────────

const classicLayout: PrescriptionLayout = {
  pageSize: "A4",
  margins: { top: 15, right: 20, bottom: 15, left: 20 },
  header: [
    {
      id: "classic-h1",
      columns: 3,
      borderBottom: true,
      marginTop: 0,
      marginBottom: 12,
      cells: [
        { id: "classic-h1-l", type: "text", align: "left", content: "", lines: [
          { text: "ডাঃ মো: নাম", fontSize: 14, bold: true },
          { text: "MBBS, FCPS (Medicine)", fontSize: 10 },
          { text: "মেডিসিন বিশেষজ্ঞ", fontSize: 10 },
        ]},
        { id: "classic-h1-c", type: "text", align: "center", content: "", lines: [
          { text: "চেম্বার", fontSize: 12, bold: true, color: "#0d9488" },
          { text: "ঠিকানা লিখুন", fontSize: 10 },
          { text: "☎ ০১XXXXXXXXX", fontSize: 10 },
        ]},
        { id: "classic-h1-r", type: "text", align: "right", content: "", lines: [
          { text: "Dr. Name", fontSize: 14, bold: true },
          { text: "MBBS, FCPS (Medicine)", fontSize: 10 },
          { text: "Medicine Specialist", fontSize: 10 },
        ]},
      ],
    },
  ],
  footer: [
    {
      id: "classic-f1",
      columns: 3,
      borderBottom: false,
      marginTop: 0,
      marginBottom: 0,
      cells: [
        { id: "classic-f1-l", type: "text", align: "left", content: "", lines: [{ text: "সিরিয়ালের জন্য: ০১XXXXXXXXX", fontSize: 9 }] },
        { id: "classic-f1-c", type: "text", align: "center", content: "", lines: [{ text: "Generated digitally", fontSize: 9, color: "#64748b" }] },
        { id: "classic-f1-r", type: "qr", align: "right", content: "", lines: [{ text: "", fontSize: 11 }] },
      ],
    },
  ],
  bodyColumns: 2,
  bodyLeftWidth: 38,
  watermark: { enabled: false, type: "text", text: "", image: "", opacity: 0.06, fontSize: 60, rotation: -30 },
  showSignature: true,
  signatureName: "",
  signatureTitle: "",
  showQR: true,
  qrPosition: "footer-right",
};

// ─── Template 2: Minimal (clean, single header row) ─────────────────────────

const minimalLayout: PrescriptionLayout = {
  pageSize: "A4",
  margins: { top: 12, right: 15, bottom: 12, left: 15 },
  header: [
    {
      id: "minimal-h1",
      columns: 2,
      borderBottom: true,
      marginTop: 0,
      marginBottom: 10,
      cells: [
        { id: "minimal-h1-l", type: "text", align: "left", content: "", lines: [
          { text: "Dr. Name", fontSize: 14, bold: true },
          { text: "MBBS, Specialization", fontSize: 10, color: "#475569" },
        ]},
        { id: "minimal-h1-r", type: "text", align: "right", content: "", lines: [
          { text: "Chamber Name", fontSize: 11, bold: true },
          { text: "Address", fontSize: 9, color: "#475569" },
          { text: "Phone: 01XXXXXXXXX", fontSize: 9, color: "#475569" },
        ]},
      ],
    },
  ],
  footer: [
    {
      id: "minimal-f1",
      columns: 1,
      borderBottom: false,
      marginTop: 0,
      marginBottom: 0,
      cells: [
        { id: "minimal-f1-c", type: "text", align: "center", content: "", lines: [{ text: "Generated digitally · MediSite", fontSize: 9, color: "#94a3b8" }] },
      ],
    },
  ],
  bodyColumns: 2,
  bodyLeftWidth: 35,
  watermark: { enabled: false, type: "text", text: "", image: "", opacity: 0.06, fontSize: 60, rotation: -30 },
  showSignature: true,
  signatureName: "",
  signatureTitle: "",
  showQR: false,
  qrPosition: "footer-right",
};

// ─── Template 3: With Logo (logo on left, info on right) ────────────────────

const logoLayout: PrescriptionLayout = {
  pageSize: "A4",
  margins: { top: 15, right: 20, bottom: 15, left: 20 },
  header: [
    {
      id: "logo-h1",
      columns: 3,
      borderBottom: true,
      marginTop: 0,
      marginBottom: 12,
      cells: [
        { id: "logo-h1-l", type: "logo", align: "left", content: "", lines: [{ text: "", fontSize: 11 }] },
        { id: "logo-h1-c", type: "text", align: "center", content: "", lines: [
          { text: "ডাঃ নাম", fontSize: 15, bold: true, color: "#0d9488" },
          { text: "MBBS, FCPS", fontSize: 10 },
          { text: "বিশেষজ্ঞ চিকিৎসক", fontSize: 10 },
        ]},
        { id: "logo-h1-r", type: "text", align: "right", content: "", lines: [
          { text: "চেম্বার: নাম", fontSize: 11, bold: true },
          { text: "ঠিকানা", fontSize: 9, color: "#475569" },
          { text: "☎ ০১XXXXXXXXX", fontSize: 9 },
        ]},
      ],
    },
  ],
  footer: [
    {
      id: "logo-f1",
      columns: 3,
      borderBottom: false,
      marginTop: 0,
      marginBottom: 0,
      cells: [
        { id: "logo-f1-l", type: "text", align: "left", content: "", lines: [{ text: "সন্ধ্যা ৬টা - রাত ১০টা", fontSize: 9 }] },
        { id: "logo-f1-c", type: "qr", align: "center", content: "", lines: [{ text: "", fontSize: 11 }] },
        { id: "logo-f1-r", type: "text", align: "right", content: "", lines: [{ text: "শুক্রবার বন্ধ", fontSize: 9 }] },
      ],
    },
  ],
  bodyColumns: 2,
  bodyLeftWidth: 38,
  watermark: { enabled: true, type: "text", text: "COPY", opacity: 0.04, fontSize: 70, rotation: -30 },
  showSignature: true,
  signatureName: "",
  signatureTitle: "",
  showQR: true,
  qrPosition: "footer-center",
};

// ─── Template 4: Compact A5 (for smaller prescriptions) ─────────────────────

const compactA5Layout: PrescriptionLayout = {
  pageSize: "A5",
  margins: { top: 10, right: 12, bottom: 10, left: 12 },
  header: [
    {
      id: "a5-h1",
      columns: 2,
      borderBottom: true,
      marginTop: 0,
      marginBottom: 8,
      cells: [
        { id: "a5-h1-l", type: "text", align: "left", content: "", lines: [
          { text: "ডাঃ নাম", fontSize: 12, bold: true },
          { text: "MBBS, FCPS", fontSize: 9 },
        ]},
        { id: "a5-h1-r", type: "text", align: "right", content: "", lines: [
          { text: "Chamber", fontSize: 10, bold: true },
          { text: "☎ 01XXXXXXXXX", fontSize: 9 },
        ]},
      ],
    },
  ],
  footer: [
    {
      id: "a5-f1",
      columns: 2,
      borderBottom: false,
      marginTop: 0,
      marginBottom: 0,
      cells: [
        { id: "a5-f1-l", type: "text", align: "left", content: "", lines: [{ text: "Digital Prescription", fontSize: 8, color: "#94a3b8" }] },
        { id: "a5-f1-r", type: "qr", align: "right", content: "", lines: [{ text: "", fontSize: 11 }] },
      ],
    },
  ],
  bodyColumns: 2,
  bodyLeftWidth: 35,
  watermark: { enabled: false, type: "text", text: "", image: "", opacity: 0.06, fontSize: 60, rotation: -30 },
  showSignature: true,
  signatureName: "",
  signatureTitle: "",
  showQR: true,
  qrPosition: "footer-right",
};

// ─── Template 5: Professional (bold header with department) ─────────────────

const professionalLayout: PrescriptionLayout = {
  pageSize: "A4",
  margins: { top: 18, right: 22, bottom: 15, left: 22 },
  header: [
    {
      id: "pro-h1",
      columns: 1,
      borderBottom: false,
      marginTop: 0,
      marginBottom: 4,
      cells: [
        { id: "pro-h1-c", type: "text", align: "center", content: "", lines: [
          { text: "Hospital / Clinic Name", fontSize: 14, bold: true, color: "#0d9488" },
          { text: "Department of Medicine", fontSize: 10, color: "#475569" },
        ]},
      ],
    },
    {
      id: "pro-h2",
      columns: 2,
      borderBottom: true,
      marginTop: 0,
      marginBottom: 12,
      cells: [
        { id: "pro-h2-l", type: "text", align: "left", content: "", lines: [
          { text: "ডাঃ নাম", fontSize: 13, bold: true },
          { text: "MBBS, FCPS (Medicine)", fontSize: 10 },
          { text: "সহকারী রেজিস্ট্রার", fontSize: 10 },
        ]},
        { id: "pro-h2-r", type: "text", align: "right", content: "", lines: [
          { text: "Dr. Name", fontSize: 13, bold: true },
          { text: "MBBS, FCPS (Medicine)", fontSize: 10 },
          { text: "Assistant Registrar", fontSize: 10 },
        ]},
      ],
    },
  ],
  footer: [
    {
      id: "pro-f1",
      columns: 3,
      borderBottom: false,
      marginTop: 0,
      marginBottom: 0,
      cells: [
        { id: "pro-f1-l", type: "text", align: "left", content: "", lines: [
          { text: "চেম্বার: নাম ও ঠিকানা", fontSize: 9 },
          { text: "সময়: বিকাল ৫টা - রাত ৯টা", fontSize: 9 },
        ]},
        { id: "pro-f1-c", type: "text", align: "center", content: "", lines: [{ text: "Powered by MediSite", fontSize: 8, color: "#94a3b8" }] },
        { id: "pro-f1-r", type: "qr", align: "right", content: "", lines: [{ text: "", fontSize: 11 }] },
      ],
    },
  ],
  bodyColumns: 2,
  bodyLeftWidth: 40,
  watermark: { enabled: false, type: "text", text: "", image: "", opacity: 0.06, fontSize: 60, rotation: -30 },
  showSignature: true,
  signatureName: "",
  signatureTitle: "",
  showQR: true,
  qrPosition: "footer-right",
};

// ─── Template 6: Letter Size (US format) ────────────────────────────────────

const letterLayout: PrescriptionLayout = {
  pageSize: "Letter",
  margins: { top: 15, right: 20, bottom: 15, left: 20 },
  header: [
    {
      id: "letter-h1",
      columns: 2,
      borderBottom: true,
      marginTop: 0,
      marginBottom: 12,
      cells: [
        { id: "letter-h1-l", type: "logo", align: "left", content: "", lines: [{ text: "", fontSize: 11 }] },
        { id: "letter-h1-r", type: "text", align: "right", content: "", lines: [
          { text: "Dr. Name, MD", fontSize: 14, bold: true },
          { text: "Internal Medicine", fontSize: 10, color: "#475569" },
          { text: "Clinic Address", fontSize: 10, color: "#475569" },
          { text: "Phone: (XXX) XXX-XXXX", fontSize: 10, color: "#475569" },
        ]},
      ],
    },
  ],
  footer: [
    {
      id: "letter-f1",
      columns: 2,
      borderBottom: false,
      marginTop: 0,
      marginBottom: 0,
      cells: [
        { id: "letter-f1-l", type: "text", align: "left", content: "", lines: [{ text: "Electronic Prescription", fontSize: 9, color: "#94a3b8" }] },
        { id: "letter-f1-r", type: "qr", align: "right", content: "", lines: [{ text: "", fontSize: 11 }] },
      ],
    },
  ],
  bodyColumns: 2,
  bodyLeftWidth: 38,
  watermark: { enabled: false, type: "text", text: "", image: "", opacity: 0.06, fontSize: 60, rotation: -30 },
  showSignature: true,
  signatureName: "",
  signatureTitle: "",
  showQR: true,
  qrPosition: "footer-right",
};

// ─── Exported Templates ─────────────────────────────────────────────────────

export const PRESCRIPTION_DESIGN_TEMPLATES: PrescriptionDesignTemplate[] = [
  { id: "classic", name: "Classic", description: "Traditional 3-column header with Bengali & English. Standard clinic format.", preview: "📋", layout: classicLayout },
  { id: "minimal", name: "Minimal", description: "Clean 2-column header, minimal footer. Modern and simple.", preview: "✨", layout: minimalLayout },
  { id: "with-logo", name: "With Logo", description: "Logo on left, doctor info centered, chamber on right. Watermark enabled.", preview: "🏥", layout: logoLayout },
  { id: "compact-a5", name: "Compact (A5)", description: "Smaller A5 page for quick prescriptions. Space-efficient layout.", preview: "📄", layout: compactA5Layout },
  { id: "professional", name: "Professional", description: "Hospital/clinic name header with bilingual doctor info. Two-row header.", preview: "🎓", layout: professionalLayout },
  { id: "letter-us", name: "Letter (US)", description: "US Letter size with logo. Suitable for international format.", preview: "🇺🇸", layout: letterLayout },
];
