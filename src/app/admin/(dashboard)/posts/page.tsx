import Link from "next/link";
import { getPosts } from "@/lib/store";
import { t } from "@/lib/i18n";
import AdminIcon from "@/components/admin/AdminIcon";
import { Badge } from "@/components/admin/ui";
import DeletePostButton from "@/components/admin/DeletePostButton";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Blog Posts",
  robots: { index: false, follow: false },
};

export default async function AdminPostsPage() {
  const posts = await getPosts();

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <p className="text-sm text-muted">{posts.length} post{posts.length === 1 ? "" : "s"}</p>
        <Link href="/admin/posts/new" className="inline-flex items-center gap-1.5 rounded-lg bg-brand px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-brand-dark">
          <AdminIcon name="plus" className="h-4 w-4" /> New Post
        </Link>
      </div>

      {posts.length === 0 ? (
        <div className="rounded-xl border border-dashed border-slate-300 bg-white p-12 text-center">
          <p className="text-sm text-muted">
            No posts yet. Create your first article.
          </p>
          <Link
            href="/admin/posts/new"
            className="mt-4 inline-flex items-center gap-1.5 rounded-lg bg-brand px-4 py-2 text-sm font-semibold text-white transition hover:bg-brand-dark"
          >
            <AdminIcon name="plus" className="h-4 w-4" />
            New Post
          </Link>
        </div>
      ) : (
        <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-200 text-sm">
              <thead className="bg-slate-50 text-left text-xs font-semibold uppercase tracking-wide text-muted">
                <tr>
                  <th className="px-5 py-3">Title</th>
                  <th className="px-5 py-3">Date</th>
                  <th className="px-5 py-3">Status</th>
                  <th className="px-5 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {posts.map((post) => (
                  <tr key={post.id} className="transition hover:bg-slate-50/60">
                    <td className="px-5 py-3">
                      <p className="font-medium text-ink">
                        {t(post.title, "en")}
                      </p>
                      <p className="text-xs text-muted">/{post.slug}</p>
                    </td>
                    <td className="px-5 py-3 text-muted">{post.date}</td>
                    <td className="px-5 py-3">
                      <Badge tone={post.published ? "green" : "slate"}>
                        {post.published ? "Published" : "Draft"}
                      </Badge>
                    </td>
                    <td className="px-5 py-3">
                      <div className="flex items-center justify-end gap-4">
                        {post.published && (
                          <Link
                            href={`/blog/${post.slug}`}
                            target="_blank"
                            className="text-sm font-medium text-muted hover:text-brand"
                          >
                            View
                          </Link>
                        )}
                        <Link
                          href={`/admin/posts/${post.id}`}
                          className="text-sm font-medium text-brand hover:text-brand-dark"
                        >
                          Edit
                        </Link>
                        <DeletePostButton
                          id={post.id}
                          title={t(post.title, "en")}
                        />
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
