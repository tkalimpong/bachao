export type Plan = 'free' | 'plus';

export const PLAN_MAX_MEMBERS: Record<Plan, number> = {
  free: 2,
  plus: 6,
};

export function isPlus(plan: Plan): boolean {
  return plan === 'plus';
}

export function maxMembers(plan: Plan): number {
  return PLAN_MAX_MEMBERS[plan];
}

export function canInviteMember(plan: Plan, currentCount: number): boolean {
  return currentCount < maxMembers(plan);
}

export function canChangeMemberRoles(plan: Plan): boolean {
  return plan === 'plus';
}

export function canEditCategories(plan: Plan): boolean {
  return plan === 'plus';
}

export function canBackup(plan: Plan): boolean {
  return plan === 'plus';
}

/** Role assigned when joining via invite code */
export function joinRoleForPlan(plan: Plan, currentMemberCount: number): 'partner' | 'helper' {
  if (plan === 'free' && currentMemberCount === 1) return 'partner';
  return 'helper';
}

export function planLabel(plan: Plan, lang: 'en' | 'hi'): string {
  if (plan === 'plus') return lang === 'en' ? 'Plus' : 'प्लस';
  return lang === 'en' ? 'Free' : 'मुफ़्त';
}

export function memberLimitLabel(plan: Plan, count: number, lang: 'en' | 'hi'): string {
  const max = maxMembers(plan);
  const tier = planLabel(plan, lang);
  return lang === 'en'
    ? `${count}/${max} members · ${tier}`
    : `${count}/${max} सदस्य · ${tier}`;
}
