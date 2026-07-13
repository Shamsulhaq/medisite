import { getPageBlocks } from '@/lib/page-builder/data';
import { BLOCK_DEFINITIONS } from '@/lib/page-builder/blocks';
import { HOME_TEMPLATES } from '@/lib/page-builder/templates/home';
import { ABOUT_TEMPLATES } from '@/lib/page-builder/templates/about';
import { APPOINTMENT_TEMPLATES } from '@/lib/page-builder/templates/appointment';
import { CONTACT_TEMPLATES } from '@/lib/page-builder/templates/contact';
import type { PageTemplate } from '@/lib/page-builder/templates/home';
import PageEditorClient from './PageEditorClient';
import { PageHeader } from '@/components/admin/ui';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'Edit Page', robots: { index: false, follow: false } };

const PAGE_META: Record<string, { name: string }> = {
  home: { name: 'Home Page' },
  about: { name: 'About Page' },
  appointment: { name: 'Appointment Page' },
  contact: { name: 'Contact Page' },
};

const TEMPLATES_BY_SLUG: Record<string, PageTemplate[]> = {
  home: HOME_TEMPLATES,
  about: ABOUT_TEMPLATES,
  appointment: APPOINTMENT_TEMPLATES,
  contact: CONTACT_TEMPLATES,
};

export default async function EditPagePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const blocks = await getPageBlocks(slug);
  const meta = PAGE_META[slug] || { name: slug };
  const templates = TEMPLATES_BY_SLUG[slug] || [];

  return (
    <div>
      <PageHeader title={`Edit: ${meta.name}`} description="Drag blocks to reorder. Click to edit content." />
      <PageEditorClient
        slug={slug}
        initialBlocks={blocks}
        blockDefinitions={BLOCK_DEFINITIONS}
        templates={templates}
      />
    </div>
  );
}
