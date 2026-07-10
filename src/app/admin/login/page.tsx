import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { getSettings } from "@/lib/store";
import { t } from "@/lib/i18n";
import LoginForm from "@/components/admin/LoginForm";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Admin Login",
  robots: { index: false, follow: false },
};

export default async function LoginPage() {
  const session = await auth();
  if (session?.user) {
    redirect("/admin");
  }

  const settings = await getSettings();
  const name = t(settings.siteTitle, "en");

  return (
    <div className="grid min-h-screen lg:grid-cols-2">
      {/* Brand panel */}
      <div className="relative hidden overflow-hidden bg-gradient-to-br from-brand-dark via-brand to-teal-500 lg:block">
        <div className="absolute inset-0 opacity-20 [background-image:radial-gradient(circle_at_20%_20%,white_1px,transparent_1px)] [background-size:28px_28px]" />
        <div className="relative flex h-full flex-col justify-between p-12 text-white">
          <div className="flex items-center gap-3">
            <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-white/15 backdrop-blur">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="h-6 w-6"
                aria-hidden="true"
              >
                <path d="M4.8 2.3A.3.3 0 1 0 5 2H4a2 2 0 0 0-2 2v5a6 6 0 0 0 6 6a6 6 0 0 0 6-6V4a2 2 0 0 0-2-2h-1a.2.2 0 1 0 .3.3" />
                <path d="M8 15v1a6 6 0 0 0 6 6a6 6 0 0 0 6-6v-4" />
                <circle cx="20" cy="10" r="2" />
              </svg>
            </span>
            <span className="text-lg font-bold">Admin Console</span>
          </div>
          <div>
            <h1 className="text-3xl font-bold leading-tight">{name}</h1>
            <p className="mt-3 max-w-sm text-teal-50">
              Manage your website content, blog, appointments, and patient
              records — all in one place.
            </p>
          </div>
          <p className="text-sm text-teal-100/80">
            © {new Date().getFullYear()} {name}
          </p>
        </div>
      </div>

      {/* Form panel */}
      <div className="flex items-center justify-center bg-slate-50 px-4 py-12">
        <div className="w-full max-w-sm">
          <div className="mb-8 flex items-center gap-2.5 lg:hidden">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand text-white">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="h-5 w-5"
                aria-hidden="true"
              >
                <path d="M4.8 2.3A.3.3 0 1 0 5 2H4a2 2 0 0 0-2 2v5a6 6 0 0 0 6 6a6 6 0 0 0 6-6V4a2 2 0 0 0-2-2h-1a.2.2 0 1 0 .3.3" />
                <path d="M8 15v1a6 6 0 0 0 6 6a6 6 0 0 0 6-6v-4" />
                <circle cx="20" cy="10" r="2" />
              </svg>
            </span>
            <span className="font-bold text-ink">{name}</span>
          </div>

          <h2 className="text-2xl font-bold tracking-tight text-ink">
            Welcome back
          </h2>
          <p className="mt-1 text-sm text-muted">
            Sign in to access the admin console.
          </p>

          <div className="mt-8">
            <LoginForm />
          </div>
        </div>
      </div>
    </div>
  );
}
