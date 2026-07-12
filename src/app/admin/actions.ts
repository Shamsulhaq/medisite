"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import {
  updateUsername,
  updatePassword,
  getUser,
  getUserByUsername,
  verifyPassword,
} from "@/lib/auth";
import { auth, signIn, signOut } from "@/auth";
import { saveSettings } from "@/lib/store";
import {
  createPost,
  updatePost,
  deletePost,
  getRevisions,
  getRevision,
  type PostInput,
} from "@/lib/store";
import {
  updateAppointmentStatus,
  deleteAppointment,
} from "@/lib/appointments";
import type { SiteSettings, AppointmentStatus } from "@/lib/types";
import { requirePermission } from "@/lib/rbac";
import { logAudit } from "@/lib/audit";
import { getCurrentUser } from "@/lib/rbac";

async function requireSession() {
  const session = await auth();
  if (!session?.user) {
    throw new Error("Unauthorized");
  }
  return session;
}

function revalidatePublic() {
  revalidatePath("/", "layout");
}

// ---- Auth ------------------------------------------------------------------

export type LoginState = { error?: string };

export async function loginAction(
  _prev: LoginState,
  formData: FormData
): Promise<LoginState> {
  const username = String(formData.get("username") ?? "").trim();
  const password = String(formData.get("password") ?? "");

  if (!username || !password) {
    return { error: "Please enter your username and password." };
  }

  try {
    await signIn("credentials", {
      username,
      password,
      redirectTo: "/admin",
    });

    // Log audit after successful login
    const user = await getUserByUsername(username);
    if (user) {
      await logAudit(user.id, "LOGIN", "session", undefined, { username });
    }
  } catch (err: unknown) {
    if (
      err &&
      typeof err === "object" &&
      "digest" in err &&
      typeof (err as { digest: unknown }).digest === "string" &&
      (err as { digest: string }).digest.startsWith("NEXT_REDIRECT")
    ) {
      // Log audit for successful login (signIn redirects before we can log above)
      const user = await getUserByUsername(username);
      if (user) {
        await logAudit(user.id, "LOGIN", "session", undefined, { username });
      }
      throw err;
    }
    return { error: "Invalid username or password." };
  }

  redirect("/admin");
}

export async function logoutAction() {
  const current = await getCurrentUser();
  if (current) {
    await logAudit(current.id, "LOGOUT", "session");
  }
  await signOut({ redirectTo: "/admin/login" });
}

export type AccountState = { error?: string; success?: string };

export async function updateAccountAction(
  _prev: AccountState,
  formData: FormData
): Promise<AccountState> {
  await requireSession();

  const newUsername = String(formData.get("username") ?? "").trim();
  const currentPassword = String(formData.get("currentPassword") ?? "");
  const newPassword = String(formData.get("newPassword") ?? "");
  const confirmPassword = String(formData.get("confirmPassword") ?? "");

  const user = await getUser();

  if (!verifyPassword(currentPassword, user.salt, user.hash)) {
    return { error: "Your current password is incorrect." };
  }

  if (newUsername && newUsername.length < 3) {
    return { error: "Username must be at least 3 characters." };
  }

  if (newPassword || confirmPassword) {
    if (newPassword.length < 6) {
      return { error: "New password must be at least 6 characters." };
    }
    if (newPassword !== confirmPassword) {
      return { error: "New password and confirmation do not match." };
    }
  }

  if (newUsername && newUsername !== user.username) {
    await updateUsername(newUsername);
  }
  if (newPassword) {
    await updatePassword(newPassword);
  }

  return { success: "Account updated successfully." };
}

// ---- Settings --------------------------------------------------------------

export async function saveSettingsAction(
  settings: SiteSettings
): Promise<{ ok: boolean; error?: string }> {
  await requireSession();
  await requirePermission("canManageSettings");

  try {
    if (!settings || typeof settings !== "object") {
      return { ok: false, error: "Invalid settings payload." };
    }
    await saveSettings(settings);
    revalidatePublic();

    const current = await getCurrentUser();
    if (current) {
      await logAudit(current.id, "UPDATE_SETTINGS", "settings", "main");
    }

    return { ok: true };
  } catch (err) {
    console.error("saveSettings failed:", err);
    return { ok: false, error: "Failed to save settings." };
  }
}

// ---- Blog posts ------------------------------------------------------------

export async function savePostAction(
  input: PostInput,
  id?: string
): Promise<{ ok: boolean; id?: string; slug?: string; error?: string }> {
  await requireSession();
  await requirePermission("canManageBlog");

  try {
    if (!input.title?.en?.trim() && !input.title?.bn?.trim()) {
      return { ok: false, error: "Title is required." };
    }
    const post = id ? await updatePost(id, input) : await createPost(input);
    if (!post) return { ok: false, error: "Post not found." };
    revalidatePublic();

    const current = await getCurrentUser();
    if (current) {
      await logAudit(
        current.id,
        id ? "UPDATE_POST" : "CREATE_POST",
        "blogPost",
        post.id,
        { title: post.title, slug: post.slug }
      );
    }

    return { ok: true, id: post.id, slug: post.slug };
  } catch (err) {
    console.error("savePost failed:", err);
    return { ok: false, error: "Failed to save post." };
  }
}

export async function deletePostAction(
  id: string
): Promise<{ ok: boolean }> {
  await requireSession();
  await requirePermission("canManageBlog");

  const ok = await deletePost(id);
  revalidatePublic();

  if (ok) {
    const current = await getCurrentUser();
    if (current) {
      await logAudit(current.id, "DELETE_POST", "blogPost", id);
    }
  }

  return { ok };
}

// ---- Appointments ----------------------------------------------------------

export async function setAppointmentStatusAction(
  id: string,
  status: AppointmentStatus
): Promise<{ ok: boolean }> {
  await requireSession();
  await requirePermission("canConfirmAppointment");

  const ok = await updateAppointmentStatus(id, status);
  revalidatePath("/admin/appointments");

  if (ok) {
    const current = await getCurrentUser();
    if (current) {
      await logAudit(current.id, "UPDATE_APPOINTMENT", "appointment", id, { status });
    }
  }

  return { ok };
}

export async function deleteAppointmentAction(
  id: string
): Promise<{ ok: boolean }> {
  await requireSession();
  await requirePermission("canConfirmAppointment");

  const ok = await deleteAppointment(id);
  revalidatePath("/admin/appointments");

  if (ok) {
    const current = await getCurrentUser();
    if (current) {
      await logAudit(current.id, "DELETE_APPOINTMENT", "appointment", id);
    }
  }

  return { ok };
}

// ---- Blog Revisions --------------------------------------------------------

export async function getRevisionsAction(
  postId: string
): Promise<{ id: string; createdAt: string; data: unknown }[]> {
  await requireSession();
  return getRevisions(postId);
}

export async function getRevisionAction(
  revisionId: string
): Promise<{ id: string; postId: string; data: unknown; createdAt: string } | null> {
  await requireSession();
  const rev = await getRevision(revisionId);
  return rev ?? null;
}
