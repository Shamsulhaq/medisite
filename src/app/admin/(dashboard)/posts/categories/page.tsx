import Link from "next/link";
import { getSettings } from "@/lib/store";
import prisma from "@/lib/db";
import { PageHeader } from "@/components/admin/ui";
import BlogCategoriesManager from "@/components/admin/BlogCategoriesManager";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Blog Categories",
  robots: { index: false, follow: false },
};

/**
 * Blog Categories management page.
 *
 * Fetches settings (settings.blog.categories) and also computes post counts
 * per category from the database. If no categories are defined in settings,
 * extracts unique categories from existing posts as the initial set.
 */
export default async function CategoriesPage() {
  const settings = await getSettings();

  // Count posts per category using a raw groupBy query
  const categoryCounts = await prisma.blogPost.groupBy({
    by: ["category"],
    _count: { id: true },
    where: { category: { not: "" } },
  });

  // Build a postCounts map: category name → count
  const postCounts: Record<string, number> = {};
  for (const row of categoryCounts) {
    postCounts[row.category] = row._count.id;
  }

  // If settings have no categories defined, bootstrap from existing posts
  let effectiveSettings = settings;
  if (
    !settings.blog.categories ||
    settings.blog.categories.length === 0
  ) {
    const uniqueFromPosts = categoryCounts
      .map((r) => r.category)
      .filter((c) => c.trim())
      .sort();
    if (uniqueFromPosts.length > 0) {
      effectiveSettings = {
        ...settings,
        blog: { ...settings.blog, categories: uniqueFromPosts },
      };
    }
  }

  return (
    <div>
      <PageHeader
        title="Blog Categories"
        description="Manage blog post categories — add, edit, reorder, or remove."
        action={
          <Link
            href="/admin/posts"
            className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 px-3 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50 transition"
          >
            ← Back to Posts
          </Link>
        }
      />

      <BlogCategoriesManager
        initial={effectiveSettings}
        postCounts={postCounts}
      />
    </div>
  );
}
