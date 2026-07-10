import { redirect } from "next/navigation";
import { auth } from "@/auth";
import AdminShell from "@/components/admin/AdminShell";

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

  return <AdminShell username={session.user.name ?? "admin"}>{children}</AdminShell>;
}
