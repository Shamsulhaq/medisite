'use server';

import { savePage } from '@/lib/page-builder/data';
import { requirePermission } from '@/lib/rbac';
import { revalidatePath } from 'next/cache';
import type { BlockInstance } from '@/lib/page-builder/types';

export async function savePageAction(slug: string, blocks: BlockInstance[]) {
  await requirePermission('canManageSettings');
  await savePage(slug, blocks);
  revalidatePath('/', 'layout');
  return { ok: true };
}
