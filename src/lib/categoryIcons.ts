import type { LucideIcon } from 'lucide-react';
import {
  Apple,
  Baby,
  BadgeIndianRupee,
  Banknote,
  Bean,
  Bike,
  Bird,
  BookOpen,
  Briefcase,
  Bus,
  CakeSlice,
  Candy,
  Car,
  CarTaxiFront,
  Cat,
  ChefHat,
  Clapperboard,
  Coffee,
  CookingPot,
  CupSoda,
  Dog,
  Droplets,
  Dumbbell,
  Egg,
  Fan,
  Fish,
  Flame,
  Fuel,
  Gamepad2,
  Gem,
  Gift,
  GraduationCap,
  HandCoins,
  HandHeart,
  Handshake,
  HeartHandshake,
  HeartPulse,
  Home,
  Hospital,
  IndianRupee,
  Key,
  Languages,
  Library,
  Lightbulb,
  MapPin,
  Milk,
  Motorbike,
  Music,
  Navigation,
  Palette,
  PartyPopper,
  Phone,
  Pill,
  Plane,
  Popcorn,
  ReceiptIndianRupee,
  Refrigerator,
  Rabbit,
  Salad,
  School,
  Scissors,
  Scooter,
  Shirt,
  ShoppingBag,
  ShoppingBasket,
  ShoppingCart,
  Smartphone,
  SoapDispenserDroplet,
  Sparkles,
  SportShoe,
  Store,
  Soup,
  Stethoscope,
  Syringe,
  Tag,
  Ticket,
  Tractor,
  TrainFront,
  TrendingUp,
  Users,
  UtensilsCrossed,
  Wallet,
  WashingMachine,
  Wheat,
  Wifi,
  Zap,
} from 'lucide-react';

export type CategoryIconId = string;

export type CategoryIconDef = {
  id: CategoryIconId;
  Icon: LucideIcon;
};

export type CategoryIconSectionDef = {
  id: string;
  labelEn: string;
  labelHi: string;
  icons: CategoryIconDef[];
};

/** Kept for saved overrides / defaults — not shown in the picker. */
const CORE_ICON_DEFS: CategoryIconDef[] = [
  { id: 'tag', Icon: Tag },
  { id: 'cart', Icon: ShoppingCart },
  { id: 'navigation', Icon: Navigation },
];

/** Food: ingredients, groceries, dining out, café, dessert — 15 */
const FOOD_ICONS: CategoryIconDef[] = [
  { id: 'wheat', Icon: Wheat },
  { id: 'bean', Icon: Bean },
  { id: 'milk', Icon: Milk },
  { id: 'apple', Icon: Apple },
  { id: 'salad', Icon: Salad },
  { id: 'cooking-pot', Icon: CookingPot },
  { id: 'egg', Icon: Egg },
  { id: 'utensils', Icon: UtensilsCrossed },
  { id: 'chef-hat', Icon: ChefHat },
  { id: 'soup', Icon: Soup },
  { id: 'coffee', Icon: Coffee },
  { id: 'cup-soda', Icon: CupSoda },
  { id: 'candy', Icon: Candy },
  { id: 'cake-slice', Icon: CakeSlice },
  { id: 'popcorn', Icon: Popcorn },
];

/** Transport & travel — 10 */
const TRANSPORT_ICONS: CategoryIconDef[] = [
  { id: 'car', Icon: Car },
  { id: 'bus', Icon: Bus },
  { id: 'train', Icon: TrainFront },
  { id: 'plane', Icon: Plane },
  { id: 'scooter', Icon: Scooter },
  { id: 'bike', Icon: Bike },
  { id: 'motorbike', Icon: Motorbike },
  { id: 'car-taxi', Icon: CarTaxiFront },
  { id: 'fuel', Icon: Fuel },
  { id: 'map-pin', Icon: MapPin },
];

/** Medical — 5 */
const MEDICAL_ICONS: CategoryIconDef[] = [
  { id: 'heart-pulse', Icon: HeartPulse },
  { id: 'pill', Icon: Pill },
  { id: 'stethoscope', Icon: Stethoscope },
  { id: 'hospital', Icon: Hospital },
  { id: 'syringe', Icon: Syringe },
];

/** Daily necessities — 5 */
const DAILY_ICONS: CategoryIconDef[] = [
  { id: 'shopping-bag', Icon: ShoppingBag },
  { id: 'shopping-basket', Icon: ShoppingBasket },
  { id: 'soap-dispenser', Icon: SoapDispenserDroplet },
  { id: 'washing-machine', Icon: WashingMachine },
  { id: 'refrigerator', Icon: Refrigerator },
];

/** Clothing & beauty — 5 */
const STYLE_ICONS: CategoryIconDef[] = [
  { id: 'shirt', Icon: Shirt },
  { id: 'sport-shoe', Icon: SportShoe },
  { id: 'gem', Icon: Gem },
  { id: 'scissors', Icon: Scissors },
  { id: 'sparkles', Icon: Sparkles },
];

/** Leisure — 5 */
const LEISURE_ICONS: CategoryIconDef[] = [
  { id: 'clapperboard', Icon: Clapperboard },
  { id: 'ticket', Icon: Ticket },
  { id: 'gamepad', Icon: Gamepad2 },
  { id: 'music', Icon: Music },
  { id: 'dumbbell', Icon: Dumbbell },
];

/** Education — 5 */
const EDUCATION_ICONS: CategoryIconDef[] = [
  { id: 'graduation', Icon: GraduationCap },
  { id: 'school', Icon: School },
  { id: 'book', Icon: BookOpen },
  { id: 'palette', Icon: Palette },
  { id: 'music', Icon: Music },
];

/** Social & gifts — 5 */
const SOCIAL_ICONS: CategoryIconDef[] = [
  { id: 'users', Icon: Users },
  { id: 'handshake', Icon: Handshake },
  { id: 'gift', Icon: Gift },
  { id: 'party-popper', Icon: PartyPopper },
  { id: 'heart-handshake', Icon: HeartHandshake },
];

/** Communication, utilities & home — 10 */
const HOME_ICONS: CategoryIconDef[] = [
  { id: 'wifi', Icon: Wifi },
  { id: 'smartphone', Icon: Smartphone },
  { id: 'phone', Icon: Phone },
  { id: 'droplets', Icon: Droplets },
  { id: 'flame', Icon: Flame },
  { id: 'zap', Icon: Zap },
  { id: 'lightbulb', Icon: Lightbulb },
  { id: 'fan', Icon: Fan },
  { id: 'home', Icon: Home },
  { id: 'key', Icon: Key },
];

/** Animals — Lucide only (no goat/sheep/cow/elephant icons exist) — 5 */
const ANIMAL_ICONS: CategoryIconDef[] = [
  { id: 'rabbit', Icon: Rabbit },
  { id: 'bird', Icon: Bird },
  { id: 'dog', Icon: Dog },
  { id: 'cat', Icon: Cat },
  { id: 'fish', Icon: Fish },
];

/** Income — 10 */
export const INCOME_ICON_OPTIONS: CategoryIconDef[] = [
  { id: 'indian-rupee', Icon: IndianRupee },
  { id: 'badge-rupee', Icon: BadgeIndianRupee },
  { id: 'briefcase', Icon: Briefcase },
  { id: 'store', Icon: Store },
  { id: 'banknote', Icon: Banknote },
  { id: 'wallet', Icon: Wallet },
  { id: 'trending-up', Icon: TrendingUp },
  { id: 'hand-coins', Icon: HandCoins },
  { id: 'receipt-rupee', Icon: ReceiptIndianRupee },
  { id: 'tractor', Icon: Tractor },
];

export const EXPENSE_ICON_SECTIONS: CategoryIconSectionDef[] = [
  {
    id: 'food',
    labelEn: 'Food & dining',
    labelHi: 'खाना और बाहर का',
    icons: FOOD_ICONS,
  },
  {
    id: 'transport',
    labelEn: 'Transport & travel',
    labelHi: 'यातायात और यात्रा',
    icons: TRANSPORT_ICONS,
  },
  {
    id: 'medical',
    labelEn: 'Medical',
    labelHi: 'चिकित्सा',
    icons: MEDICAL_ICONS,
  },
  {
    id: 'daily',
    labelEn: 'Daily goods',
    labelHi: 'दैनिक सामान',
    icons: DAILY_ICONS,
  },
  {
    id: 'style',
    labelEn: 'Clothing & beauty',
    labelHi: 'कपड़े और सौंदर्य',
    icons: STYLE_ICONS,
  },
  {
    id: 'leisure',
    labelEn: 'Leisure',
    labelHi: 'मनोरंजन',
    icons: LEISURE_ICONS,
  },
  {
    id: 'education',
    labelEn: 'Education',
    labelHi: 'शिक्षा',
    icons: EDUCATION_ICONS,
  },
  {
    id: 'social',
    labelEn: 'Social & gifts',
    labelHi: 'मिलना-जुलना',
    icons: SOCIAL_ICONS,
  },
  {
    id: 'home',
    labelEn: 'Home & bills',
    labelHi: 'घर और बिल',
    icons: HOME_ICONS,
  },
  {
    id: 'animals',
    labelEn: 'Animals',
    labelHi: 'जानवर',
    icons: ANIMAL_ICONS,
  },
];

export const INCOME_ICON_SECTION: CategoryIconSectionDef = {
  id: 'income',
  labelEn: 'Income',
  labelHi: 'आय',
  icons: INCOME_ICON_OPTIONS,
};

export const EXPENSE_ICON_OPTIONS: CategoryIconDef[] = EXPENSE_ICON_SECTIONS.flatMap(
  (section) => section.icons,
);

/** Flat list for expense picker (80 icons). */
export const CATEGORY_ICON_OPTIONS: CategoryIconDef[] = EXPENSE_ICON_OPTIONS;

function dedupeIcons(icons: CategoryIconDef[]): CategoryIconDef[] {
  const seen = new Set<string>();
  return icons.filter(({ id }) => {
    if (seen.has(id)) return false;
    seen.add(id);
    return true;
  });
}

const ALL_ICON_DEFS = dedupeIcons([
  ...CORE_ICON_DEFS,
  ...EXPENSE_ICON_OPTIONS,
  ...INCOME_ICON_OPTIONS,
  { id: 'baby', Icon: Baby },
  { id: 'hand-heart', Icon: HandHeart },
  { id: 'library', Icon: Library },
  { id: 'languages', Icon: Languages },
]);

export const CATEGORY_ICON_MAP: Record<CategoryIconId, LucideIcon> = Object.fromEntries(
  ALL_ICON_DEFS.map((o) => [o.id, o.Icon]),
) as Record<CategoryIconId, LucideIcon>;

export const DEFAULT_CATEGORY_ICON_ID: CategoryIconId = 'tag';

/** Removed custom icons → Lucide fallback for saved overrides */
const REMOVED_ICON_FALLBACK: Record<string, CategoryIconId> = {
  'auto-rickshaw': 'scooter',
  'naan-curry': 'utensils',
  'india-flag': 'sparkles',
  mithai: 'candy',
  'utensils-alt': 'utensils',
  cake: 'cake-slice',
  package: 'shopping-basket',
  diamond: 'gem',
  drumstick: 'rabbit',
  cow: 'rabbit',
  elephant: 'bird',
  beef: 'rabbit',
  squirrel: 'bird',
  library: 'book',
  languages: 'music',
  wheat: 'tractor',
  lightbulb: 'zap',
  'swatch-book': 'shirt',
  'mirror-round': 'sparkles',
  'wand-sparkles': 'sparkles',
  'spray-can': 'sparkles',
  brush: 'sparkles',
};

export function getCategoryIcon(iconId: CategoryIconId): LucideIcon {
  return CATEGORY_ICON_MAP[iconId] ?? Tag;
}

/** @deprecated Use getCategoryIcon */
export function getCategoryLucideIcon(iconId: CategoryIconId): LucideIcon {
  const icon = getCategoryIcon(iconId);
  return icon as LucideIcon;
}

export type CategoryColorPreset = { color: string; bg: string };

/** Retired picker colors — still used for background lookup on saved overrides. */
const RETIRED_CATEGORY_COLOR_PRESETS: CategoryColorPreset[] = [
  { color: '#ea580c', bg: '#fff4ed' },
  { color: '#d97706', bg: '#fffbeb' },
  { color: '#0d9488', bg: '#f0fdfa' },
  { color: '#7c3aed', bg: '#f5f3ff' },
];

/** 12 curated colors shown in the icon edit picker. */
export const CATEGORY_COLOR_PRESETS: CategoryColorPreset[] = [
  { color: '#f97316', bg: '#fff7ed' },
  { color: '#3b82f6', bg: '#eff6ff' },
  { color: '#ec4899', bg: '#fdf2f8' },
  { color: '#22c55e', bg: '#f0fdf4' },
  { color: '#a855f7', bg: '#faf5ff' },
  { color: '#6366f1', bg: '#eef2ff' },
  { color: '#eab308', bg: '#fefce8' },
  { color: '#06b6d4', bg: '#ecfeff' },
  { color: '#78716c', bg: '#fafaf9' },
  { color: '#6b7280', bg: '#f9fafb' },
  { color: '#ef4444', bg: '#fef2f2' },
  { color: '#14b8a6', bg: '#f0fdfa' },
];

export function bgForCategoryColor(color: string, fallbackBg: string): string {
  const preset = [...CATEGORY_COLOR_PRESETS, ...RETIRED_CATEGORY_COLOR_PRESETS].find(
    (p) => p.color === color,
  );
  return preset?.bg ?? fallbackBg;
}

/** Map legacy emoji overrides to silhouette ids. */
const LEGACY_EMOJI_ICON: Record<string, CategoryIconId> = {
  '🍛': 'utensils',
  '🛺': 'scooter',
  '🛒': 'cart',
  '💊': 'pill',
  '🎬': 'clapperboard',
  '📶': 'wifi',
  '💡': 'lightbulb',
  '📚': 'book',
  '🏠': 'home',
  '📌': 'tag',
};

export function legacyEmojiToIconId(emoji: string): CategoryIconId | undefined {
  const trimmed = emoji.trim();
  return LEGACY_EMOJI_ICON[trimmed] ?? (trimmed.length <= 2 ? LEGACY_EMOJI_ICON[trimmed] : undefined);
}

export function normalizeIconId(iconId?: string, legacyEmoji?: string): CategoryIconId {
  if (iconId && CATEGORY_ICON_MAP[iconId]) return iconId;
  if (iconId && REMOVED_ICON_FALLBACK[iconId]) return REMOVED_ICON_FALLBACK[iconId];
  if (legacyEmoji) {
    const mapped = legacyEmojiToIconId(legacyEmoji);
    if (mapped) return mapped;
  }
  return DEFAULT_CATEGORY_ICON_ID;
}
