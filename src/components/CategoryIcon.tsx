import type { Category } from '../store/useStore';
import type { CategoryOverrides } from '../lib/categories';
import { resolveCategoryAppearance } from '../lib/categories';
import CategoryIconGlyph from './CategoryIconGlyph';

const SIZE = {
  sm: { box: 'w-9 h-9', icon: 'w-5 h-5', rounded: 'rounded-lg' },
  md: { box: 'w-11 h-11', icon: 'w-6 h-6', rounded: 'rounded-xl' },
  lg: { box: 'w-12 h-12', icon: 'w-7 h-7', rounded: 'rounded-xl' },
  xl: { box: 'w-14 h-14', icon: 'w-8 h-8', rounded: 'rounded-2xl' },
} as const;

type Props = {
  categoryId: Category;
  overrides?: CategoryOverrides;
  size?: keyof typeof SIZE;
  /** badge = rounded square tile (default); circle = round tile; plain = icon only */
  variant?: 'badge' | 'circle' | 'plain';
  className?: string;
  faded?: boolean;
};

export default function CategoryIcon({
  categoryId,
  overrides,
  size = 'md',
  variant = 'badge',
  className = '',
  faded = false,
}: Props) {
  const { iconId, color, bg } = resolveCategoryAppearance(categoryId, overrides);
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
      <CategoryIconGlyph
        iconId={iconId}
        className={s.icon}
        color={color}
        strokeWidth={2.5}
      />
    </div>
  );
}
