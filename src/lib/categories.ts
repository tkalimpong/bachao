import type { Category } from '../store/useStore';
import type { CategoryIconId } from './categoryIcons';
import {
  bgForCategoryColor,
  normalizeIconId,
} from './categoryIcons';

export type CategoryOverride = {
  iconId?: string;
  color?: string;
  /** Custom name — shown in every UI language */
  label?: string;
  /** @deprecated Use label */
  en?: string;
  hi?: string;
  /** @deprecated Legacy emoji */
  icon?: string;
};

export type CategoryOverrides = Partial<Record<Category, CategoryOverride>>;

export type CategoryAppearance = {
  iconId: CategoryIconId;
  color: string;
  bg: string;
};

export type CategoryDef = {
  id: Category;
  iconId: CategoryIconId;
  color: string;
  bg: string;
  labelEn: string;
  labelHi: string;
};

/** Default icon, color, and name for each expense category. */
export const CATEGORY_DEFS: CategoryDef[] = [
  {
    id: 'food',
    iconId: 'utensils',
    color: '#f97316',
    bg: '#fff7ed',
    labelEn: 'Food',
    labelHi: 'खाना',
  },
  {
    id: 'transport',
    iconId: 'car',
    color: '#3b82f6',
    bg: '#eff6ff',
    labelEn: 'Transport',
    labelHi: 'यातायात',
  },
  {
    id: 'shopping',
    iconId: 'shopping-bag',
    color: '#ec4899',
    bg: '#fdf2f8',
    labelEn: 'Shopping',
    labelHi: 'खरीदारी',
  },
  {
    id: 'health',
    iconId: 'pill',
    color: '#22c55e',
    bg: '#f0fdf4',
    labelEn: 'Health',
    labelHi: 'स्वास्थ्य',
  },
  {
    id: 'entertainment',
    iconId: 'clapperboard',
    color: '#a855f7',
    bg: '#faf5ff',
    labelEn: 'Entertainment',
    labelHi: 'मनोरंजन',
  },
  {
    id: 'telecom',
    iconId: 'wifi',
    color: '#6366f1',
    bg: '#eef2ff',
    labelEn: 'Mobile & Internet',
    labelHi: 'मोबाइल / इंटरनेट',
  },
  {
    id: 'utilities',
    iconId: 'zap',
    color: '#eab308',
    bg: '#fefce8',
    labelEn: 'Electricity & Gas',
    labelHi: 'बिजली / गैस',
  },
  {
    id: 'education',
    iconId: 'book',
    color: '#06b6d4',
    bg: '#ecfeff',
    labelEn: 'Education',
    labelHi: 'शिक्षा',
  },
  {
    id: 'home',
    iconId: 'home',
    color: '#78716c',
    bg: '#fafaf9',
    labelEn: 'Home',
    labelHi: 'घर',
  },
  {
    id: 'other',
    iconId: 'tag',
    color: '#6b7280',
    bg: '#f9fafb',
    labelEn: 'Other',
    labelHi: 'अन्य',
  },
];

/** @deprecated Use CATEGORY_DEFS */
export const CATEGORIES = CATEGORY_DEFS;

export const CATEGORY_LABELS: Record<Category, { en: string; hi: string }> = Object.fromEntries(
  CATEGORY_DEFS.map((d) => [d.id, { en: d.labelEn, hi: d.labelHi }]),
) as Record<Category, { en: string; hi: string }>;

export function getCat(id: Category): CategoryDef {
  return CATEGORY_DEFS.find((c) => c.id === id) ?? CATEGORY_DEFS[CATEGORY_DEFS.length - 1];
}

export function categoryDefaultLabel(id: Category, lang: 'en' | 'hi'): string {
  const def = getCat(id);
  return lang === 'en' ? def.labelEn : def.labelHi;
}

function isDefaultCategoryLabel(id: Category, label: string): boolean {
  const def = getCat(id);
  const trimmed = label.trim();
  return trimmed === def.labelEn || trimmed === def.labelHi;
}

/** Build override from edit form; null when everything matches defaults. */
export function categoryOverrideFromEdit(
  id: Category,
  { iconId, color, name }: { iconId: string; color: string; name: string },
): CategoryOverride | null {
  const base = getCat(id);
  const trimmed = name.trim();
  const label = trimmed && !isDefaultCategoryLabel(id, trimmed) ? trimmed : undefined;
  const resolvedIconId = normalizeIconId(iconId);
  const hasIcon = resolvedIconId !== base.iconId;
  const hasColor = color !== base.color;
  if (!label && !hasIcon && !hasColor) return null;
  return {
    ...(hasIcon ? { iconId: resolvedIconId } : {}),
    ...(hasColor ? { color } : {}),
    ...(label ? { label } : {}),
  };
}

export function resolveCategoryAppearance(
  id: Category,
  overrides?: CategoryOverrides,
): CategoryAppearance {
  const base = getCat(id);
  const o = overrides?.[id];
  const iconId = o?.iconId || o?.icon
    ? normalizeIconId(o.iconId, o.icon)
    : base.iconId;
  const color = o?.color ?? base.color;
  const bg = bgForCategoryColor(color, base.bg);
  return { iconId, color, bg };
}

/** @deprecated Use resolveCategoryAppearance + CategoryIcon */
export function resolveCategoryIcon(id: Category, overrides?: CategoryOverrides): string {
  return resolveCategoryAppearance(id, overrides).iconId;
}

export function resolveCategoryLabel(
  id: Category,
  lang: 'en' | 'hi',
  overrides?: CategoryOverrides,
): string {
  const o = overrides?.[id];
  const label = o?.label?.trim() || o?.en?.trim() || o?.hi?.trim();
  if (label && !isDefaultCategoryLabel(id, label)) return label;
  return categoryDefaultLabel(id, lang);
}

export function isCategoryCustomized(id: Category, overrides?: CategoryOverrides): boolean {
  const o = overrides?.[id];
  if (!o) return false;
  const base = getCat(id);
  const label = o.label?.trim() || o.en?.trim() || o.hi?.trim();
  if (label && !isDefaultCategoryLabel(id, label)) return true;
  const iconId = normalizeIconId(o.iconId, o.icon);
  if (o.iconId && iconId !== base.iconId) return true;
  if (o.color && o.color !== base.color) return true;
  return false;
}

/** Default note when user leaves Note empty: "(Category name)" */
export function defaultCategoryNote(
  category: Category,
  lang: 'en' | 'hi',
  overrides?: CategoryOverrides,
): string {
  return `(${resolveCategoryLabel(category, lang, overrides)})`;
}

export function getVisibleCategories(hidden: Category[] = []) {
  const hiddenSet = new Set(hidden);
  return CATEGORY_DEFS.filter((c) => !hiddenSet.has(c.id));
}

/** Visible categories plus an optional extra (e.g. when editing an expense in a hidden category). */
export function getSelectableCategories(hidden: Category[] = [], include?: Category) {
  const visible = getVisibleCategories(hidden);
  if (!include || !hidden.includes(include)) return visible;
  const extra = CATEGORY_DEFS.find((c) => c.id === include);
  if (!extra || visible.some((c) => c.id === include)) return visible;
  return [...visible, extra];
}

export function normalizeCategoryOverrides(raw: CategoryOverrides): CategoryOverrides {
  const out: CategoryOverrides = {};
  for (const [key, o] of Object.entries(raw) as [Category, CategoryOverride][]) {
    if (!o) continue;
    const base = getCat(key);
    const iconId = o.iconId || o.icon
      ? normalizeIconId(o.iconId, o.icon)
      : base.iconId;
    const label = o.label?.trim() || o.en?.trim() || o.hi?.trim();
    const hasLabel = !!label && !isDefaultCategoryLabel(key, label);
    const hasIcon = iconId !== base.iconId;
    const hasColor = !!o.color && o.color !== base.color;
    if (!hasLabel && !hasIcon && !hasColor) continue;
    out[key] = {
      ...(hasIcon ? { iconId } : {}),
      ...(hasColor ? { color: o.color } : {}),
      ...(hasLabel ? { label } : {}),
    };
  }
  return out;
}
