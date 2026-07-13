import Link from 'next/link';
import { PageHeader } from '@/components/admin/ui';

export const metadata = { title: 'Pages', robots: { index: false, follow: false } };

const PAGES = [
  { slug: 'home', name: 'Home Page', description: 'Landing page with hero, stats, and content blocks' },
  { slug: 'about', name: 'About Page', description: 'Doctor biography, experience, and credentials' },
  { slug: 'appointment', name: 'Appointment Page', description: 'Booking form and chamber information' },
];

export default function PagesListPage() {
  return (
    <div>
      <PageHeader title="Pages" description="Customize your public website pages with drag-and-drop blocks." />
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {PAGES.map((p) => (
          <Link key={p.slug} href={`/admin/pages/${p.slug}`}
            className="rounded-xl border border-slate-200 bg-white p-6 transition hover:border-brand hover:shadow-md">
            <h3 className="font-semibold text-ink">{p.name}</h3>
            <p className="mt-1 text-sm text-muted">{p.description}</p>
          </Link>
        ))}
      </div>
    </div>
  );
}
