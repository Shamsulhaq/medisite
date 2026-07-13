import type { BlockInstance } from '@/lib/page-builder/types';
import type { LocalizedString } from '@/lib/i18n';
import HeroBlock from './HeroBlock';
import StatsBlock from './StatsBlock';
import FeatureGridBlock from './FeatureGridBlock';
import RichTextBlock from './RichTextBlock';
import CTABannerBlock from './CTABannerBlock';
import BlogPreviewBlock from './BlogPreviewBlock';
import TimelineBlock from './TimelineBlock';
import ContactCardBlock from './ContactCardBlock';
import AppointmentFormEmbedBlock from './AppointmentFormEmbedBlock';
import ImageTextBlock from './ImageTextBlock';
import SpacerBlock from './SpacerBlock';

export type BlockContext = {
  doctorName: string;
  doctorPhoto?: string;
  doctorInitials: string;
};

export function renderBlock(
  block: BlockInstance,
  locale: 'en' | 'bn',
  context: BlockContext
) {
  if (!block.visible) return null;

  const key = block.id;
  const p = block.props;

  switch (block.type) {
    case 'hero':
      return (
        <HeroBlock
          key={key}
          locale={locale}
          badge={p.badge as LocalizedString}
          heading={p.heading as LocalizedString}
          subtext={p.subtext as LocalizedString}
          ctaPrimaryLabel={p.ctaPrimaryLabel as LocalizedString}
          ctaPrimaryHref={p.ctaPrimaryHref as string}
          ctaSecondaryLabel={p.ctaSecondaryLabel as LocalizedString}
          ctaSecondaryHref={p.ctaSecondaryHref as string}
          showPhoto={p.showPhoto as boolean}
          context={context}
        />
      );
    case 'stats':
      return (
        <StatsBlock
          key={key}
          locale={locale}
          items={p.items as Array<{ value: string; label: LocalizedString }>}
        />
      );
    case 'featureGrid':
      return (
        <FeatureGridBlock
          key={key}
          locale={locale}
          heading={p.heading as LocalizedString}
          subtitle={p.subtitle as LocalizedString}
          items={
            p.items as Array<{
              icon: string;
              title: LocalizedString;
              description: LocalizedString;
            }>
          }
        />
      );
    case 'richText':
      return (
        <RichTextBlock
          key={key}
          locale={locale}
          content={p.content as LocalizedString}
        />
      );
    case 'ctaBanner':
      return (
        <CTABannerBlock
          key={key}
          locale={locale}
          heading={p.heading as LocalizedString}
          subtitle={p.subtitle as LocalizedString}
          buttonLabel={p.buttonLabel as LocalizedString}
          buttonHref={p.buttonHref as string}
          variant={p.variant as 'dark' | 'brand' | 'light'}
        />
      );
    case 'blogPreview':
      return (
        <BlogPreviewBlock
          key={key}
          locale={locale}
          heading={p.heading as LocalizedString}
          subtitle={p.subtitle as LocalizedString}
          count={p.count as number}
        />
      );
    case 'timeline':
      return (
        <TimelineBlock
          key={key}
          locale={locale}
          heading={p.heading as LocalizedString}
          items={
            p.items as Array<{
              role: LocalizedString;
              place: LocalizedString;
              period: LocalizedString;
              description: LocalizedString;
            }>
          }
        />
      );
    case 'contactCard':
      return (
        <ContactCardBlock
          key={key}
          locale={locale}
          heading={p.heading as LocalizedString}
          items={
            p.items as Array<{
              icon: string;
              label: LocalizedString;
              value: string;
              href: string;
            }>
          }
        />
      );
    case 'appointmentFormEmbed':
      return (
        <AppointmentFormEmbedBlock
          key={key}
          locale={locale}
          heading={p.heading as LocalizedString}
          subtitle={p.subtitle as LocalizedString}
          showSidebar={p.showSidebar as boolean}
        />
      );
    case 'imageText':
      return (
        <ImageTextBlock
          key={key}
          locale={locale}
          image={p.image as string}
          heading={p.heading as LocalizedString}
          text={p.text as LocalizedString}
          imagePosition={p.imagePosition as 'left' | 'right'}
        />
      );
    case 'spacer':
      return (
        <SpacerBlock
          key={key}
          size={p.size as 'sm' | 'md' | 'lg' | 'xl'}
        />
      );
    default:
      return null;
  }
}
