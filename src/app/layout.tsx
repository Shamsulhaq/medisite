import type { Metadata, Viewport } from "next";
import { Geist } from "next/font/google";
import "./globals.css";
import { getSettings } from "@/lib/store";
import { t } from "@/lib/i18n";
import { getLocale } from "@/lib/i18n-server";

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

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${geistSans.variable} h-full`}>
      <body
        className="flex min-h-full flex-col bg-white text-ink antialiased"
        suppressHydrationWarning
      >
        {children}
      </body>
    </html>
  );
}
