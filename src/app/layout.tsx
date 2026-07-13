import type { Metadata, Viewport } from "next";
import { Geist } from "next/font/google";
import "./globals.css";
import { getSettings } from "@/lib/store";
import { t } from "@/lib/i18n";
import { getLocale } from "@/lib/i18n-server";
import { generateAppearanceCSS } from "@/lib/appearance";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export async function generateMetadata(): Promise<Metadata> {
  const s = await getSettings();
  const locale = await getLocale(s.defaultLanguage);
  const title = t(s.siteTitle, locale);
  return {
    title: {
      default: `${title} — ${t(s.doctor.title, locale)}, ${t(
        s.doctor.hospital,
        locale
      )}`,
      template: `%s | ${title}`,
    },
    description: t(s.metaDescription, locale),
    keywords: s.metaKeywords,
  };
}

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const settings = await getSettings();
  const appearanceStyle = generateAppearanceCSS(settings.appearance);

  // Build Google Fonts URL if non-system fonts are selected
  const fontsToLoad = new Set<string>();
  const extractFont = (fontFamily?: string) => {
    if (!fontFamily || fontFamily === "system-ui") return;
    const match = /^'([^']+)'/.exec(fontFamily);
    if (match) fontsToLoad.add(match[1]);
  };
  extractFont(settings.appearance?.fontFamily);
  extractFont(settings.appearance?.headingFont);

  const googleFontsUrl = fontsToLoad.size > 0
    ? `https://fonts.googleapis.com/css2?${[...fontsToLoad].map((f) => `family=${f.replace(/ /g, "+")}:wght@400;500;600;700`).join("&")}&display=swap`
    : null;

  return (
    <html lang="en" className={`${geistSans.variable} h-full`}>
      <head>
        {googleFontsUrl && (
          <>
            <link rel="preconnect" href="https://fonts.googleapis.com" />
            <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
            <link rel="stylesheet" href={googleFontsUrl} />
          </>
        )}
        {appearanceStyle && (
          <style dangerouslySetInnerHTML={{ __html: `:root { ${appearanceStyle} }` }} />
        )}
      </head>
      <body
        className="flex min-h-full flex-col bg-white text-ink antialiased"
        style={settings.appearance?.fontFamily ? { fontFamily: `${settings.appearance.fontFamily}, system-ui, sans-serif` } : undefined}
        suppressHydrationWarning
      >
        {children}
      </body>
    </html>
  );
}
