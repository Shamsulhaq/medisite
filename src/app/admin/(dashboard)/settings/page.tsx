import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Settings",
  robots: { index: false, follow: false },
};

/**
 * Settings index page — redirects to the General settings sub-page.
 * The old tab-based layout is superseded by dedicated route pages:
 *   /admin/settings/general
 *   /admin/settings/email
 *   /admin/settings/prescription
 *   /admin/settings/payment
 *   /admin/settings/backup
 */
export default function SettingsPage() {
  redirect("/admin/settings/general");
}
