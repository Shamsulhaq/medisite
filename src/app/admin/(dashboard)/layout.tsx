import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { getCurrentUser } from "@/lib/rbac";
import AdminShell from "@/components/admin/AdminShell";
import ToastProvider from "@/components/admin/ToastProvider";

export const dynamic = "force-dynamic";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();
  if (!session?.user) {
    redirect("/admin/login");
  }

  const currentUser = await getCurrentUser();
  const userRole = currentUser?.role ?? "ATTENDANT";
  const permissions = currentUser?.permissions ?? {};

  return (
    <AdminShell
      username={currentUser?.displayName || session.user.name || "admin"}
      userRole={userRole}
      permissions={permissions as Record<string, boolean>}
    >
      <ToastProvider>{children}</ToastProvider>
    </AdminShell>
  );
}
