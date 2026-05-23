import type { IncomeSource } from '../store/useStore';
import type { CategoryIconId } from './categoryIcons';
import {
  bgForCategoryColor,
  normalizeIconId,
} from './categoryIcons';

export type IncomeSourceOverride = {
  iconId?: string;
  color?: string;
  label?: string;
  en?: string;
  hi?: string;
  icon?: string;
};

export type IncomeSourceOverrides = Partial<Record<IncomeSource, IncomeSourceOverride>>;

export type IncomeSourceAppearance = {
  iconId: CategoryIconId;
  color: string;
  bg: string;
};

export type IncomeSourceDef = {
  id: IncomeSource;
  iconId: CategoryIconId;
  color: string;
  bg: string;
  labelEn: string;
  labelHi: string;
};

/** Default icon, color, and name for each income source. */
export const INCOME_SOURCE_DEFS: IncomeSourceDef[] = [
  {
    id: 'salary',
    iconId: 'briefcase',
    color: '#3b82f6',
    bg: '#eff6ff',
    labelEn: 'Salary',
    labelHi: 'वेतन',
  },
  {
    id: 'freelance',
    iconId: 'tractor',
    color: '#22c55e',
    bg: '#f0fdf4',
    labelEn: 'Farming',
    labelHi: 'खेती',
  },
  {
    id: 'business',
    iconId: 'store',
    color: '#f97316',
    bg: '#fff7ed',
    labelEn: 'Business',
    labelHi: 'व्यापार',
  },
  {
    id: 'gift',
    iconId: 'gift',
    color: '#ec4899',
    bg: '#fdf2f8',
    labelEn: 'Gift',
    labelHi: 'उपहार',
  },
  {
    id: 'rent',
    iconId: 'receipt-rupee',
    color: '#78716c',
    bg: '#fafaf9',
    labelEn: 'Rent',
    labelHi: 'किराया',
  },
  {
    id: 'other_income',
    iconId: 'indian-rupee',
    color: '#6366f1',
    bg: '#eef2ff',
    labelEn: 'Other',
    labelHi: 'अन्य',
  },
];

export const INCOME_SOURCE_LABELS: Record<IncomeSource, { en: string; hi: string }> = Object.fromEntries(
  INCOME_SOURCE_DEFS.map((d) => [d.id, { en: d.labelEn, hi: d.labelHi }]),
) as Record<IncomeSource, { en: string; hi: string }>;

/** @deprecated Use INCOME_SOURCE_DEFS */
export const INCOME_SOURCES = INCOME_SOURCE_DEFS.map((def) => ({
  id: def.id,
  icon: '',
  en: def.labelEn,
  hi: def.labelHi,
}));

const LEGACY_EMOJI_ICON: Record<string, CategoryIconId> = {
  '💼': 'briefcase',
  '🐄': 'tractor',
  '🏪': 'store',
  '🎁': 'gift',
  '🏠': 'receipt-rupee',
  '💸': 'indian-rupee',
  '💰': 'indian-rupee',
};

function normalizeIncomeIconId(iconId?: string, legacyEmoji?: string): CategoryIconId {
  if (legacyEmoji) {
    const mapped = LEGACY_EMOJI_ICON[legacyEmoji.trim()];
    if (mapped) return mapped;
  }
  if (iconId) return normalizeIconId(iconId);
  return 'tag';
}

export function getIncomeSourceDef(id: IncomeSource): IncomeSourceDef {
  return INCOME_SOURCE_DEFS.find((s) => s.id === id) ?? INCOME_SOURCE_DEFS[INCOME_SOURCE_DEFS.length - 1];
}

export function incomeSourceDefaultLabel(id: IncomeSource, lang: 'en' | 'hi'): string {
  const def = getIncomeSourceDef(id);
  return lang === 'en' ? def.labelEn : def.labelHi;
}

function isDefaultIncomeSourceLabel(id: IncomeSource, label: string): boolean {
  const def = getIncomeSourceDef(id);
  const trimmed = label.trim();
  return trimmed === def.labelEn || trimmed === def.labelHi;
}

export function incomeSourceOverrideFromEdit(
  id: IncomeSource,
  { iconId, color, name }: { iconId: string; color: string; name: string },
): IncomeSourceOverride | null {
  const base = getIncomeSourceDef(id);
  const trimmed = name.trim();
  const label = trimmed && !isDefaultIncomeSourceLabel(id, trimmed) ? trimmed : undefined;
  const resolvedIconId = normalizeIncomeIconId(iconId);
  const hasIcon = resolvedIconId !== base.iconId;
  const hasColor = color !== base.color;
  if (!label && !hasIcon && !hasColor) return null;
  return {
    ...(hasIcon ? { iconId: resolvedIconId } : {}),
    ...(hasColor ? { color } : {}),
    ...(label ? { label } : {}),
  };
}

export function resolveIncomeSourceAppearance(
  id: IncomeSource,
  overrides?: IncomeSourceOverrides,
): IncomeSourceAppearance {
  const base = getIncomeSourceDef(id);
  const o = overrides?.[id];
  const iconId = o?.iconId || o?.icon
    ? normalizeIncomeIconId(o.iconId, o.icon)
    : base.iconId;
  const color = o?.color ?? base.color;
  const bg = bgForCategoryColor(color, base.bg);
  return { iconId, color, bg };
}

export function resolveIncomeSourceLabel(
  id: IncomeSource,
  lang: 'en' | 'hi',
  overrides?: IncomeSourceOverrides,
): string {
  const o = overrides?.[id];
  const label = o?.label?.trim() || o?.en?.trim() || o?.hi?.trim();
  if (label && !isDefaultIncomeSourceLabel(id, label)) return label;
  return incomeSourceDefaultLabel(id, lang);
}

export function defaultIncomeSourceNote(
  source: IncomeSource,
  lang: 'en' | 'hi',
  overrides?: IncomeSourceOverrides,
): string {
  return `(${resolveIncomeSourceLabel(source, lang, overrides)})`;
}

export function isIncomeSourceCustomized(
  id: IncomeSource,
  overrides?: IncomeSourceOverrides,
): boolean {
  const o = overrides?.[id];
  if (!o) return false;
  const base = getIncomeSourceDef(id);
  const label = o.label?.trim() || o.en?.trim() || o.hi?.trim();
  if (label && !isDefaultIncomeSourceLabel(id, label)) return true;
  if (o.color && o.color !== base.color) return true;
  if (o.iconId && normalizeIncomeIconId(o.iconId, o.icon) !== base.iconId) return true;
  return false;
}

export function normalizeIncomeSourceOverrides(raw: IncomeSourceOverrides): IncomeSourceOverrides {
  const out: IncomeSourceOverrides = {};
  for (const [key, o] of Object.entries(raw) as [IncomeSource, IncomeSourceOverride][]) {
    if (!o) continue;
    const base = getIncomeSourceDef(key);
    const iconId = o.iconId || o.icon
      ? normalizeIncomeIconId(o.iconId, o.icon)
      : base.iconId;
    const label = o.label?.trim() || o.en?.trim() || o.hi?.trim();
    const hasLabel = !!label && !isDefaultIncomeSourceLabel(key, label);
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

/** @deprecated Use resolveIncomeSourceLabel */
export function incomeSourceLabel(id: IncomeSource, lang: 'en' | 'hi'): string {
  return resolveIncomeSourceLabel(id, lang);
}

export function getVisibleIncomeSources(hidden: IncomeSource[] = []) {
  const hiddenSet = new Set(hidden);
  return INCOME_SOURCE_DEFS.filter((s) => !hiddenSet.has(s.id));
}

/** Visible sources plus an optional extra (e.g. when editing income with a hidden source). */
export function getSelectableIncomeSources(hidden: IncomeSource[] = [], include?: IncomeSource) {
  const visible = getVisibleIncomeSources(hidden);
  if (!include || !hidden.includes(include)) return visible;
  const extra = INCOME_SOURCE_DEFS.find((s) => s.id === include);
  if (!extra || visible.some((s) => s.id === include)) return visible;
  return [...visible, extra];
}
