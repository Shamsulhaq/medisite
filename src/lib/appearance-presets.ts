// -----------------------------------------------------------------------------
// Site Appearance Presets — predefined theme configurations for quick setup.
// Users can pick a preset or customize individual values.
// -----------------------------------------------------------------------------

import type { SiteAppearance } from "./types";

export type AppearancePreset = {
  id: string;
  name: string;
  description: string;
  colors: { brand: string; accent: string };
  appearance: SiteAppearance;
};

export const DEFAULT_APPEARANCE: SiteAppearance = {
  preset: "teal-professional",
  brandColor: "#0d9488",
  accentColor: "#0ea5e9",
  fontFamily: "system-ui",
  headingFont: "system-ui",
  borderRadius: "lg",
};

export const APPEARANCE_PRESETS: AppearancePreset[] = [
  {
    id: "teal-professional",
    name: "Teal Professional",
    description: "Default medical theme with teal brand color",
    colors: { brand: "#0d9488", accent: "#0ea5e9" },
    appearance: { preset: "teal-professional", brandColor: "#0d9488", accentColor: "#0ea5e9", fontFamily: "system-ui", headingFont: "system-ui", borderRadius: "lg" },
  },
  {
    id: "blue-modern",
    name: "Blue Modern",
    description: "Clean blue theme with a modern feel",
    colors: { brand: "#2563eb", accent: "#8b5cf6" },
    appearance: { preset: "blue-modern", brandColor: "#2563eb", accentColor: "#8b5cf6", fontFamily: "'Inter', system-ui", headingFont: "'Inter', system-ui", borderRadius: "xl" },
  },
  {
    id: "green-nature",
    name: "Green Nature",
    description: "Calming green palette for wellness clinics",
    colors: { brand: "#16a34a", accent: "#ca8a04" },
    appearance: { preset: "green-nature", brandColor: "#16a34a", accentColor: "#ca8a04", fontFamily: "system-ui", headingFont: "'Georgia', serif", borderRadius: "lg" },
  },
  {
    id: "purple-elegant",
    name: "Purple Elegant",
    description: "Sophisticated purple with warm accents",
    colors: { brand: "#7c3aed", accent: "#ec4899" },
    appearance: { preset: "purple-elegant", brandColor: "#7c3aed", accentColor: "#ec4899", fontFamily: "'Inter', system-ui", headingFont: "'Inter', system-ui", borderRadius: "md" },
  },
  {
    id: "navy-classic",
    name: "Navy Classic",
    description: "Traditional navy blue, formal and trustworthy",
    colors: { brand: "#1e3a5f", accent: "#0d9488" },
    appearance: { preset: "navy-classic", brandColor: "#1e3a5f", accentColor: "#0d9488", fontFamily: "'Georgia', serif", headingFont: "'Georgia', serif", borderRadius: "sm" },
  },
  {
    id: "red-bold",
    name: "Red Bold",
    description: "Energetic red with dark accent, for high-contrast",
    colors: { brand: "#dc2626", accent: "#1e293b" },
    appearance: { preset: "red-bold", brandColor: "#dc2626", accentColor: "#1e293b", fontFamily: "system-ui", headingFont: "system-ui", borderRadius: "md" },
  },
  {
    id: "orange-warm",
    name: "Orange Warm",
    description: "Friendly warm orange with teal accents",
    colors: { brand: "#ea580c", accent: "#0d9488" },
    appearance: { preset: "orange-warm", brandColor: "#ea580c", accentColor: "#0d9488", fontFamily: "system-ui", headingFont: "system-ui", borderRadius: "lg" },
  },
  {
    id: "slate-minimal",
    name: "Slate Minimal",
    description: "Monochrome grayscale, ultra-minimalist",
    colors: { brand: "#475569", accent: "#1e293b" },
    appearance: { preset: "slate-minimal", brandColor: "#475569", accentColor: "#1e293b", fontFamily: "'Inter', system-ui", headingFont: "'Inter', system-ui", borderRadius: "none" },
  },
];

export const FONT_OPTIONS = [
  { value: "system-ui", label: "System Default" },
  { value: "'Inter', system-ui", label: "Inter" },
  { value: "'Roboto', system-ui", label: "Roboto" },
  { value: "'Poppins', system-ui", label: "Poppins" },
  { value: "'Open Sans', system-ui", label: "Open Sans" },
  { value: "'Lato', system-ui", label: "Lato" },
  { value: "'Nunito', system-ui", label: "Nunito" },
  { value: "'Montserrat', system-ui", label: "Montserrat" },
  { value: "'Raleway', system-ui", label: "Raleway" },
  { value: "'Source Sans 3', system-ui", label: "Source Sans 3" },
  { value: "'DM Sans', system-ui", label: "DM Sans" },
  { value: "'Plus Jakarta Sans', system-ui", label: "Plus Jakarta Sans" },
  { value: "'Georgia', serif", label: "Georgia (Serif)" },
  { value: "'Merriweather', serif", label: "Merriweather (Serif)" },
  { value: "'Playfair Display', serif", label: "Playfair Display (Serif)" },
  { value: "'Lora', serif", label: "Lora (Serif)" },
  { value: "'Noto Sans Bengali', system-ui", label: "Noto Sans Bengali" },
  { value: "'Hind Siliguri', system-ui", label: "Hind Siliguri" },
  { value: "'Noto Serif Bengali', serif", label: "Noto Serif Bengali" },
  { value: "'Baloo Da 2', system-ui", label: "Baloo Da 2" },
  { value: "'JetBrains Mono', monospace", label: "JetBrains Mono (Mono)" },
  { value: "'Fira Code', monospace", label: "Fira Code (Mono)" },
];

export const RADIUS_OPTIONS = [
  { value: "none", label: "None (Sharp)" },
  { value: "sm", label: "Small" },
  { value: "md", label: "Medium" },
  { value: "lg", label: "Large" },
  { value: "xl", label: "Extra Large" },
];
