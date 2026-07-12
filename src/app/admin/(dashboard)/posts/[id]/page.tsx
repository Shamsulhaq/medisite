import Link from "next/link";
import { notFound } from "next/navigation";
import { getPostById, getSettings } from "@/lib/store";
import PostEditor from "@/components/admin/PostEditor";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Edit Post",
  robots: { index: false, follow: false },
};

export default async function EditPostPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const [post, settings] = await Promise.all([getPostById(id), getSettings()]);

  if (!post) {
    notFound();
  }

  return (
    <div>
      <Link
        href="/admin/posts"
        className="text-sm font-medium text-brand hover:text-brand-dark"
      >
        ← Back to posts
      </Link>
      <h1 className="mt-3 text-2xl font-bold text-ink">Edit Post</h1>
      <div className="mt-6">
        <PostEditor post={post} settings={settings} />
      </div>
    </div>
  );
}
