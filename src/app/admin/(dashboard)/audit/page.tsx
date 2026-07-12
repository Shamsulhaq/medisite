import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/rbac";
import { getAuditLogs } from "@/lib/audit";
import { getUsers } from "@/lib/auth";
import AuditLogViewer from "./AuditLogViewer";

export default async function AuditPage() {
  const user = await getCurrentUser();
  if (!user || user.role !== "DOCTOR") {
    redirect("/admin");
  }

  const logs = await getAuditLogs({ limit: 200 });
  const users = await getUsers();
  const userList = users.map((u) => ({ id: u.id, username: u.username, displayName: u.displayName }));

  return (
    <div className="mx-auto max-w-6xl">
      <AuditLogViewer
        initialLogs={logs.map((l) => ({
          ...l,
          createdAt: l.createdAt.toISOString(),
        }))}
        users={userList}
      />
    </div>
  );
}
