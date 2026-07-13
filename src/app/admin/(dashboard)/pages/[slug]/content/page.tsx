// -----------------------------------------------------------------------------
// Page Content Editor — server component that loads settings and passes the
// relevant section to the client editor based on the page slug.
// -----------------------------------------------------------------------------

import { getSettings } from "@/lib/store";
import { PageHeader } from "@/components/admin/ui";
import PageContentEditor from "@/components/admin/PageContentEditor";

export const dynamic = "force-dynamic";
export const metadata = { title: "Edit Page Content", robots: { index: false, follow: false } };

const PAGE_META: Record<string, { name: string; description: string }> = {
  home: {
    name: "Home Page Content",
    description: "Edit hero badges, headings, CTA labels, and section text for the home page.",
  },
  about: {
    name: "About Page Content",
    description: "Edit doctor bio, education, experience, and specialties.",
  },
  contact: {
    name: "Contact Page Content",
    description: "Edit contact info, social links, and map URL.",
  },
};

export default async function PageContentPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const settings = await getSettings();
  const meta = PAGE_META[slug] || { name: `${slug} Content`, description: "Edit page content." };

  return (
    <div>
      <PageHeader title={meta.name} description={meta.description} />
      <PageContentEditor slug={slug} settings={settings} />
    </div>
  );
}
