import type { IncomeSource } from '../store/useStore';
import type { IncomeSourceOverrides } from '../lib/incomeSources';
import { resolveIncomeSourceAppearance } from '../lib/incomeSources';
import CategoryIconGlyph from './CategoryIconGlyph';

const SIZE = {
  sm: { box: 'w-9 h-9', icon: 'w-5 h-5', rounded: 'rounded-lg' },
  md: { box: 'w-11 h-11', icon: 'w-6 h-6', rounded: 'rounded-xl' },
  lg: { box: 'w-12 h-12', icon: 'w-7 h-7', rounded: 'rounded-xl' },
} as const;

type Props = {
  sourceId: IncomeSource;
  overrides?: IncomeSourceOverrides;
  size?: keyof typeof SIZE;
  variant?: 'badge' | 'circle' | 'plain';
  className?: string;
  faded?: boolean;
};

export default function IncomeSourceIcon({
  sourceId,
  overrides,
  size = 'md',
  variant = 'badge',
  className = '',
  faded = false,
}: Props) {
  const { iconId, color, bg } = resolveIncomeSourceAppearance(sourceId, overrides);
  const s = SIZE[size];
  const rounded = variant === 'circle' ? 'rounded-full' : s.rounded;

  if (variant === 'plain') {
    return (
      <CategoryIconGlyph
        iconId={iconId}
        className={`${s.icon} shrink-0 ${className}`}
        style={{ opacity: faded ? 0.5 : 1 }}
        color={color}
        strokeWidth={2.5}
      />
    );
  }

  return (
    <div
      className={`${s.box} ${rounded} flex items-center justify-center shrink-0 ${className}`}
      style={{ background: bg, opacity: faded ? 0.5 : 1 }}
    >
      <CategoryIconGlyph iconId={iconId} className={s.icon} color={color} strokeWidth={2.5} />
    </div>
  );
}
