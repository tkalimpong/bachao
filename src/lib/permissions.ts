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

export function getMemberRole(
  members: FamilyMember[],
  memberId: string,
): MemberRole | undefined {
  return members.find((m) => m.id === memberId)?.role;
}

export function roleLabel(role: MemberRole, lang: 'en' | 'hi'): string {
  return ROLE_LABELS[role][lang];
}

export function visibleTabs(role: MemberRole): string[] {
  if (role === 'helper') return ['add', 'family', 'history'];
  return ['home', 'envelopes', 'add', 'family', 'history'];
}
