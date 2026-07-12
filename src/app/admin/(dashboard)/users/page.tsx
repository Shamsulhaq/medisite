import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/rbac";
import UserManager from "@/components/admin/UserManager";

export default async function UsersPage() {
  const user = await getCurrentUser();
  if (!user || user.role !== "DOCTOR") {
    redirect("/admin");
  }

  return (
    <div className="mx-auto max-w-4xl">
      <UserManager />
    </div>
  );
}
