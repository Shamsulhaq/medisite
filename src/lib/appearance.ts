// -----------------------------------------------------------------------------
// Generates inline CSS custom property overrides from SiteAppearance settings.
// These override the @theme defaults in globals.css when applied to <html>.
// -----------------------------------------------------------------------------

import type { SiteAppearance } from "./types";

/**
 * Convert a hex color to HSL-adjacent lighter/darker variants.
 */
function hexToRgb(hex: string): { r: number; g: number; b: number } | null {
  const match = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  if (!match) return null;
  return { r: parseInt(match[1], 16), g: parseInt(match[2], 16), b: parseInt(match[3], 16) };
}

function darken(hex: string, amount: number): string {
  const rgb = hexToRgb(hex);
  if (!rgb) return hex;
  const r = Math.max(0, Math.round(rgb.r * (1 - amount)));
  const g = Math.max(0, Math.round(rgb.g * (1 - amount)));
  const b = Math.max(0, Math.round(rgb.b * (1 - amount)));
  return `#${r.toString(16).padStart(2, "0")}${g.toString(16).padStart(2, "0")}${b.toString(16).padStart(2, "0")}`;
}

function lighten(hex: string, amount: number): string {
  const rgb = hexToRgb(hex);
  if (!rgb) return hex;
  const r = Math.min(255, Math.round(rgb.r + (255 - rgb.r) * amount));
  const g = Math.min(255, Math.round(rgb.g + (255 - rgb.g) * amount));
  const b = Math.min(255, Math.round(rgb.b + (255 - rgb.b) * amount));
  return `#${r.toString(16).padStart(2, "0")}${g.toString(16).padStart(2, "0")}${b.toString(16).padStart(2, "0")}`;
}

const RADIUS_MAP: Record<string, string> = {
  none: "0px",
  sm: "4px",
  md: "8px",
  lg: "12px",
  xl: "16px",
};

/**
 * Generate a CSS style string with custom properties to override the theme.
 * Applied as inline style on <html> element.
 */
export function generateAppearanceCSS(appearance?: SiteAppearance | null): string {
  if (!appearance) return "";

  const vars: string[] = [];

  if (appearance.brandColor) {
    vars.push(`--color-brand: ${appearance.brandColor}`);
    vars.push(`--color-brand-dark: ${darken(appearance.brandColor, 0.15)}`);
    vars.push(`--color-brand-light: ${lighten(appearance.brandColor, 0.85)}`);
  }

  if (appearance.accentColor) {
    vars.push(`--color-accent: ${appearance.accentColor}`);
  }

  if (appearance.fontFamily) {
    vars.push(`--font-sans: ${appearance.fontFamily}, system-ui, sans-serif`);
  }

  if (appearance.headingFont) {
    vars.push(`--font-heading: ${appearance.headingFont}, system-ui, sans-serif`);
  }

  if (appearance.borderRadius && RADIUS_MAP[appearance.borderRadius]) {
    vars.push(`--radius-base: ${RADIUS_MAP[appearance.borderRadius]}`);
  }

  return vars.join("; ");
}
