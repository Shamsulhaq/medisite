import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { getSettings } from "@/lib/store";
import { t } from "@/lib/i18n";
import { getLocale } from "@/lib/i18n-server";

// Public content is editable at runtime, so always render fresh from the store.
export const dynamic = "force-dynamic";

export default async function SiteLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const settings = await getSettings();
  const locale = await getLocale(settings.defaultLanguage);

  const menu = settings.menu.map((m) => ({
    href: m.href,
    label: t(m.label, locale),
  }));

  return (
    <>
      <Header
        logoText={t(settings.logoText, locale)}
        logoSubtitle={t(settings.logoSubtitle, locale)}
        menu={menu}
        locale={locale}
      />
      <main className="flex-1">{children}</main>
      <Footer settings={settings} locale={locale} />
    </>
  );
}
