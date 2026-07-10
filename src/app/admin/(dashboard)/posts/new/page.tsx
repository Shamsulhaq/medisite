import Link from "next/link";
import PostEditor from "@/components/admin/PostEditor";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "New Post",
  robots: { index: false, follow: false },
};

export default function NewPostPage() {
  return (
    <div>
      <Link
        href="/admin/posts"
        className="text-sm font-medium text-brand hover:text-brand-dark"
      >
        ← Back to posts
      </Link>
      <h1 className="mt-3 text-2xl font-bold text-ink">New Post</h1>
      <div className="mt-6">
        <PostEditor />
      </div>
    </div>
  );
}
