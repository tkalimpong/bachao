import type { IncomeSource } from '../store/useStore';

export const INCOME_SOURCES: {
  id: IncomeSource;
  icon: string;
  en: string;
  hi: string;
}[] = [
  { id: 'salary',       icon: '💼', en: 'Salary',  hi: 'तनख्वाह' },
  { id: 'freelance',    icon: '🐄', en: 'Farming', hi: 'खेती' },
  { id: 'business',     icon: '🏪', en: 'Business', hi: 'व्यापार' },
  { id: 'gift',         icon: '🎁', en: 'Gift',     hi: 'उपहार' },
  { id: 'rent',         icon: '🏠', en: 'Rent',     hi: 'किराया' },
  { id: 'other_income', icon: '💸', en: 'Other',    hi: 'अन्य' },
];

export const SOURCE_ICONS: Record<IncomeSource, string> = Object.fromEntries(
  INCOME_SOURCES.map((s) => [s.id, s.icon]),
) as Record<IncomeSource, string>;

export function incomeSourceLabel(id: IncomeSource, lang: 'en' | 'hi'): string {
  const src = INCOME_SOURCES.find((s) => s.id === id);
  return src ? src[lang === 'en' ? 'en' : 'hi'] : id.replace('_', ' ');
}
