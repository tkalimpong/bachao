import type { Category } from '../store/useStore';

export const CATEGORIES: {
  id: Category;
  icon: string;
  color: string;
  bg: string;
}[] = [
  { id: 'food',          icon: '🍛', color: '#f97316', bg: '#fff7ed' },
  { id: 'transport',     icon: '🛺', color: '#3b82f6', bg: '#eff6ff' },
  { id: 'shopping',      icon: '🛒', color: '#ec4899', bg: '#fdf2f8' },
  { id: 'health',        icon: '💊', color: '#22c55e', bg: '#f0fdf4' },
  { id: 'entertainment', icon: '🎬', color: '#a855f7', bg: '#faf5ff' },
  { id: 'utilities',     icon: '💡', color: '#eab308', bg: '#fefce8' },
  { id: 'education',     icon: '📚', color: '#06b6d4', bg: '#ecfeff' },
  { id: 'home',          icon: '🏠', color: '#78716c', bg: '#fafaf9' },
  { id: 'other',         icon: '📌', color: '#6b7280', bg: '#f9fafb' },
  { id: 'telecom',       icon: '📱', color: '#6b7280', bg: '#f9fafb' },
];

export function getCat(id: Category) {
  return CATEGORIES.find((c) => c.id === id) ?? CATEGORIES[CATEGORIES.length - 1];
}
