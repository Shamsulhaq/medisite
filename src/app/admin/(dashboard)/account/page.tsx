import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/rbac";
import AccountForm from "@/components/admin/AccountForm";
import { PageHeader } from "@/components/admin/ui";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Account Settings",
  robots: { index: false, follow: false },
};

export default async function AccountPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/admin/login");

  return (
    <div>
      <PageHeader
        title="Account Settings"
        description="Manage your admin login credentials."
      />

      <div className="max-w-2xl overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-100 bg-slate-50/60 px-6 py-4">
          <h2 className="text-base font-semibold text-ink">Login Credentials</h2>
          <p className="mt-0.5 text-sm text-muted">
            Change your username and password. Your current password is required
            to confirm changes.
          </p>
        </div>
        <div className="p-6">
          <AccountForm currentUsername={user.username} />
        </div>
      </div>
    </div>
  );
}
