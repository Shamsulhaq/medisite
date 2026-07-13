type Props = {
  size: 'sm' | 'md' | 'lg' | 'xl';
};

/** Height map: sm=32px, md=64px, lg=96px, xl=128px */
const SIZE_MAP: Record<Props['size'], string> = {
  sm: 'h-8',   // 32px
  md: 'h-16',  // 64px
  lg: 'h-24',  // 96px
  xl: 'h-32',  // 128px
};

/**
 * SpacerBlock — renders an empty div with configurable vertical spacing.
 */
export default function SpacerBlock({ size }: Props) {
  return <div className={SIZE_MAP[size] ?? SIZE_MAP.md} aria-hidden="true" />;
}
