import Link from "next/link";
import { getPostsPage, type PostStatusFilter } from "@/lib/store";
import AdminIcon from "@/components/admin/AdminIcon";
import PostsExplorer from "@/components/admin/PostsExplorer";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Blog Posts",
  robots: { index: false, follow: false },
};

export default async function AdminPostsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const sp = await searchParams;
  const str = (v: string | string[] | undefined) =>
    (Array.isArray(v) ? v[0] : v) ?? "";

  const query = {
    page: Number(str(sp.page)) || 1,
    q: str(sp.q),
    status: (str(sp.status) || "all") as PostStatusFilter,
  };

  const result = await getPostsPage(query);

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <p className="text-sm text-muted">
          {result.total} post{result.total === 1 ? "" : "s"}
        </p>
        <Link
          href="/admin/posts/new"
          className="inline-flex items-center gap-1.5 rounded-lg bg-brand px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-brand-dark"
        >
          <AdminIcon name="plus" className="h-4 w-4" /> New Post
        </Link>
      </div>

      <PostsExplorer
        items={result.items}
        total={result.total}
        page={result.page}
        perPage={result.perPage}
        totalPages={result.totalPages}
        filters={{ q: query.q, status: query.status }}
      />
    </div>
  );
}
