// -----------------------------------------------------------------------------
// Prescription Layout Types — row-based layout with per-line styling.
// Each row has columns, each cell has lines. Each LINE can have its own
// font size, color, bold — so a single cell can have mixed styling.
// Rows have configurable margin-top/bottom for spacing control.
// -----------------------------------------------------------------------------

export type PrescriptionLine = {
  text: string;
  fontSize?: number; // px, default 11
  bold?: boolean;
  color?: string; // hex
};

export type PrescriptionLayoutCell = {
  id: string;
  type: 'text' | 'logo' | 'qr'; // 'text' = multi-line with per-line styling, 'logo' = image, 'qr' = QR code
  align: 'left' | 'center' | 'right';
  content: string; // for 'logo': image URL; for 'text': ignored (use lines instead)
  lines: PrescriptionLine[]; // individual lines with their own styling
};

export type PrescriptionLayoutRow = {
  id: string;
  columns: 1 | 2 | 3;
  cells: PrescriptionLayoutCell[];
  borderBottom?: boolean;
  marginTop?: number; // px, default 0
  marginBottom?: number; // px, default 8
};

export type PrescriptionWatermark = {
  enabled: boolean;
  type: 'text' | 'image';
  text?: string;
  image?: string;
  opacity: number; // 0-1
  fontSize?: number; // for text, default 60
  rotation?: number; // degrees, default -30
};

export type PrescriptionLayout = {
  // Page setup
  pageSize: 'A4' | 'A5' | 'Letter';
  margins: { top: number; right: number; bottom: number; left: number }; // mm

  // Header — rows with columns
  header: PrescriptionLayoutRow[];

  // Footer — rows with columns
  footer: PrescriptionLayoutRow[];

  // Body layout
  bodyColumns: 1 | 2;
  bodyLeftWidth: number; // percentage, default 38

  // Watermark
  watermark: PrescriptionWatermark;

  // Signature
  showSignature: boolean;
  signatureName: string;
  signatureTitle: string;

  // QR code
  showQR: boolean;
  qrPosition: 'footer-right' | 'footer-left' | 'footer-center' | 'header-right';
};

// Default layout
export const DEFAULT_PRESCRIPTION_LAYOUT: PrescriptionLayout = {
  pageSize: 'A4',
  margins: { top: 15, right: 20, bottom: 15, left: 20 },
  header: [
    {
      id: 'header-row-1',
      columns: 3,
      borderBottom: true,
      marginTop: 0,
      marginBottom: 10,
      cells: [
        { id: 'h1-left', type: 'text', align: 'left', content: '', lines: [{ text: '', fontSize: 11 }] },
        { id: 'h1-center', type: 'text', align: 'center', content: '', lines: [{ text: '', fontSize: 11 }] },
        { id: 'h1-right', type: 'text', align: 'right', content: '', lines: [{ text: '', fontSize: 11 }] },
      ],
    },
  ],
  footer: [
    {
      id: 'footer-row-1',
      columns: 3,
      borderBottom: false,
      marginTop: 0,
      marginBottom: 0,
      cells: [
        { id: 'f1-left', type: 'text', align: 'left', content: '', lines: [{ text: '', fontSize: 11 }] },
        { id: 'f1-center', type: 'text', align: 'center', content: '', lines: [{ text: 'Generated digitally', fontSize: 11 }] },
        { id: 'f1-right', type: 'text', align: 'right', content: '', lines: [{ text: '', fontSize: 11 }] },
      ],
    },
  ],
  bodyColumns: 2,
  bodyLeftWidth: 38,
  watermark: {
    enabled: false,
    type: 'text',
    text: '',
    image: '',
    opacity: 0.06,
    fontSize: 60,
    rotation: -30,
  },
  showSignature: true,
  signatureName: '',
  signatureTitle: '',
  showQR: true,
  qrPosition: 'footer-right',
};
