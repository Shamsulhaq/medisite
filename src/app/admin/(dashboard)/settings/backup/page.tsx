import { PageHeader } from "@/components/admin/ui";
import BackupContent from "@/components/admin/BackupContent";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Backup & Restore",
  robots: { index: false, follow: false },
};

export default function BackupSettingsPage() {
  return (
    <>
      <PageHeader
        title="Backup & Restore"
        description="Download backups, restore data, or clear the database."
      />
      <BackupContent />
    </>
  );
}
