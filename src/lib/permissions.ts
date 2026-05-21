import { Crown, Handshake, PenLine } from 'lucide-react';
import type { FamilyMember } from '../store/useStore';

export type MemberRole = 'owner' | 'partner' | 'helper';

export const ROLE_ICONS = {
  owner: Crown,
  partner: Handshake,
  helper: PenLine,
} as const;

export const ROLE_LABELS: Record<MemberRole, { en: string; hi: string }> = {
  owner:   { en: 'Owner',   hi: 'Owner' },
  partner: { en: 'Partner', hi: 'Partner' },
  helper:  { en: 'Helper',  hi: 'Helper' },
};

/** Role badge colors (owner uses member avatar color when provided) */
export const ROLE_COLORS: Record<MemberRole, { main: string; bg: string }> = {
  owner:   { main: '#2563eb', bg: '#eff6ff' },
  partner: { main: '#7c3aed', bg: '#ede9fe' },
  helper:  { main: '#059669', bg: '#d1fae5' },
};

export function roleBadgeStyle(
  role: MemberRole,
  memberColor?: string,
): { background: string; color: string } {
  if (role === 'owner' && memberColor) {
    return { background: memberColor + '22', color: memberColor };
  }
  const c = ROLE_COLORS[role];
  return { background: c.bg, color: c.main };
}

/** Roles that managers can assign (not owner) */
export const EDITABLE_ROLES: ('partner' | 'helper')[] = ['partner', 'helper'];

/** グループ全体の収支・予算の閲覧 */
export function canViewGroupFinances(role: MemberRole): boolean {
  return role === 'owner' || role === 'partner';
}

/** プレミアム機能（Pro アップグレード等） */
export function canUsePremium(role: MemberRole): boolean {
  return role === 'owner';
}

/** メンバー招待・削除、ロール変更 */
export function canManageMembers(role: MemberRole): boolean {
  return role === 'owner' || role === 'partner';
}

export function canEditMemberRole(actorRole: MemberRole): boolean {
  return canManageMembers(actorRole);
}

export function canRecordTransactions(_role: MemberRole): boolean {
  return true;
}

export function canViewAllHistory(role: MemberRole): boolean {
  return canViewGroupFinances(role);
}

export function canEditTransaction(
  role: MemberRole,
  txMemberId: string,
  currentUserId: string,
): boolean {
  if (canViewGroupFinances(role)) return true;
  return txMemberId === currentUserId;
}

/** 家族間の移動 — 関係者またはグループ閲覧者が編集可 */
export function canEditTransfer(
  role: MemberRole,
  fromMemberId: string,
  toMemberId: string,
  currentUserId: string,
): boolean {
  if (canViewGroupFinances(role)) return true;
  return fromMemberId === currentUserId || toMemberId === currentUserId;
}

export function getMemberRole(
  members: FamilyMember[],
  memberId: string,
): MemberRole | undefined {
  return members.find((m) => m.id === memberId)?.role;
}

export function roleLabel(role: MemberRole, lang: 'en' | 'hi'): string {
  return ROLE_LABELS[role][lang];
}

/** Bottom nav tabs — same for every role; data scope differs by permission helpers */
export function visibleTabs(_role: MemberRole): string[] {
  return ['home', 'settings', 'add', 'family', 'history'];
}

export const SETTINGS_SCREENS = ['settings', 'envelopes', 'categories', 'premium', 'members'] as const;

export function isSettingsArea(tab: string): boolean {
  return (SETTINGS_SCREENS as readonly string[]).includes(tab);
}

export function canAccessTab(role: MemberRole, tab: string): boolean {
  if (tab === 'envelopes') return canViewGroupFinances(role);
  if (tab === 'premium') return canUsePremium(role);
  if (tab === 'categories') return true;
  if (tab === 'members') return true;
  if (isSettingsArea(tab)) return visibleTabs(role).includes('settings');
  return visibleTabs(role).includes(tab);
}
