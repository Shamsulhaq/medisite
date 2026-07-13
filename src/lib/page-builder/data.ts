import prisma from '@/lib/db';
import type { BlockInstance } from './types';

export async function getPageBlocks(slug: string): Promise<BlockInstance[]> {
  const page = await prisma.page.findUnique({ where: { slug } });
  if (!page) return [];
  return Array.isArray(page.blocks) ? (page.blocks as unknown as BlockInstance[]) : [];
}

export async function savePage(slug: string, blocks: BlockInstance[]): Promise<void> {
  await prisma.page.upsert({
    where: { slug },
    update: { blocks: blocks as unknown as object },
    create: { slug, blocks: blocks as unknown as object },
  });
}
