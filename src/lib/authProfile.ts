import type { User as FirebaseUser } from 'firebase/auth';
import {
  collection,
  doc,
  getDoc,
  getDocs,
  serverTimestamp,
  setDoc,
  writeBatch,
} from 'firebase/firestore';
import { db } from './firebase';
import type { MemberRole } from './permissions';
import { canInviteMember, joinRoleForPlan, type Plan } from './plan';

const MEMBER_COLORS = ['#2563eb', '#8b5cf6', '#22c55e', '#f59e0b', '#ec4899', '#14b8a6'];

function avatarLetter(name: string): string {
  const t = name.trim();
  return (t[0] ?? '?').toUpperCase();
}

function randomInviteCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = '';
  for (let i = 0; i < 6; i++) code += chars[Math.floor(Math.random() * chars.length)];
  return code;
}

export async function loadUserGroupId(uid: string): Promise<string | null> {
  if (!db) return null;
  const snap = await getDoc(doc(db, `users/${uid}`));
  return snap.exists() ? (snap.data().groupId as string) : null;
}

async function repairUserProfile(user: FirebaseUser, groupId: string): Promise<void> {
  if (!db) return;
  await setDoc(
    doc(db, `users/${user.uid}`),
    {
      groupId,
      email: user.email ?? null,
      displayName: user.displayName ?? null,
      photoURL: user.photoURL ?? null,
    },
    { merge: true },
  );
}

/** First sign-in: create a family group owned by this user. */
export async function createUserGroup(user: FirebaseUser): Promise<string> {
  if (!db) throw new Error('Firestore not configured');

  const groupId = user.uid;
  const linked = await loadUserGroupId(user.uid);
  if (linked) return linked;

  const name = user.displayName?.trim() || user.email?.split('@')[0] || 'Family';
  const inviteCode = randomInviteCode();
  const member = {
    name: user.displayName?.trim() || 'Owner',
    avatar: avatarLetter(user.displayName || 'O'),
    role: 'owner' as MemberRole,
    color: MEMBER_COLORS[0],
    email: user.email ?? null,
    photoURL: user.photoURL ?? null,
    joinedAt: serverTimestamp(),
  };

  const batch = writeBatch(db);
  batch.set(doc(db, `users/${user.uid}`), {
    groupId,
    email: user.email ?? null,
    displayName: user.displayName ?? null,
    photoURL: user.photoURL ?? null,
    createdAt: serverTimestamp(),
  });
  batch.set(doc(db, `groups/${groupId}`), {
    name,
    createdBy: user.uid,
    inviteCode,
    createdAt: serverTimestamp(),
  });
  batch.set(doc(db, `groups/${groupId}/members/${user.uid}`), member);
  batch.set(doc(db, `groups/${groupId}/settings/main`), { plan: 'free' as Plan });
  batch.set(doc(db, `inviteCodes/${inviteCode}`), { groupId, createdBy: user.uid });

  try {
    await batch.commit();
  } catch (e) {
    const retry = await loadUserGroupId(user.uid);
    if (retry) return retry;
    await repairUserProfile(user, groupId);
    throw e;
  }
  return groupId;
}

async function getGroupPlan(groupId: string): Promise<Plan> {
  const snap = await getDoc(doc(db!, `groups/${groupId}/settings/main`));
  return snap.data()?.plan === 'plus' ? 'plus' : 'free';
}

async function getGroupMemberCount(groupId: string): Promise<number> {
  const snap = await getDocs(collection(db!, `groups/${groupId}/members`));
  return snap.size;
}

/** Join an existing family via 6-character invite code. */
export async function joinGroupWithInviteCode(
  user: FirebaseUser,
  rawCode: string,
): Promise<string> {
  if (!db) throw new Error('Firestore not configured');

  const code = rawCode.trim().toUpperCase();
  if (code.length < 4) throw new Error('Invalid invite code');

  const inviteSnap = await getDoc(doc(db, `inviteCodes/${code}`));
  if (!inviteSnap.exists()) throw new Error('Invite code not found');

  const groupId = inviteSnap.data().groupId as string;
  const memberSnap = await getDoc(doc(db, `groups/${groupId}/members/${user.uid}`));
  if (memberSnap.exists()) {
    await repairUserProfile(user, groupId);
    return groupId;
  }

  const [plan, memberCount] = await Promise.all([
    getGroupPlan(groupId),
    getGroupMemberCount(groupId),
  ]);
  if (!canInviteMember(plan, memberCount)) {
    throw new Error(
      plan === 'free'
        ? 'Free plan allows 2 members (you + 1 partner). Ask the owner to upgrade to Plus.'
        : 'This family is full (6 members max).',
    );
  }

  const role = joinRoleForPlan(plan, memberCount);
  const color = MEMBER_COLORS[memberCount % MEMBER_COLORS.length];
  const batch = writeBatch(db);
  batch.set(doc(db, `users/${user.uid}`), {
    groupId,
    email: user.email ?? null,
    displayName: user.displayName ?? null,
    photoURL: user.photoURL ?? null,
    joinedAt: serverTimestamp(),
  });
  batch.set(doc(db, `groups/${groupId}/members/${user.uid}`), {
    name: user.displayName?.trim() || 'Member',
    avatar: avatarLetter(user.displayName || 'M'),
    role: role as MemberRole,
    color,
    email: user.email ?? null,
    photoURL: user.photoURL ?? null,
    joinedAt: serverTimestamp(),
  });
  await batch.commit();
  return groupId;
}

export async function resolveUserGroup(
  user: FirebaseUser,
  pendingInviteCode?: string | null,
): Promise<string> {
  if (pendingInviteCode?.trim()) {
    return joinGroupWithInviteCode(user, pendingInviteCode);
  }
  const existing = await loadUserGroupId(user.uid);
  if (existing) return existing;
  return createUserGroup(user);
}

export async function fetchGroupInviteCode(groupId: string): Promise<string | null> {
  if (!db) return null;
  const snap = await getDoc(doc(db, `groups/${groupId}`));
  return snap.exists() ? (snap.data().inviteCode as string) : null;
}
