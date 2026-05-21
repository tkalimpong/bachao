import { useEffect, useState } from 'react';
import { UserPlus, Trash2, Copy, Check } from 'lucide-react';
import { useStore } from '../store/useStore';
import { fetchGroupInviteCode } from '../lib/authProfile';
import { isLiveFirebase } from '../lib/appMode';
import {
  EDITABLE_ROLES,
  ROLE_ICONS,
  ROLE_COLORS,
  canManageMembers,
  canUsePremium,
  getMemberRole,
  roleBadgeStyle,
  roleLabel,
} from '../lib/permissions';
import SubScreenHeader from '../components/SubScreenHeader';
import { goBackToTab } from '../lib/mainScroll';

export default function Members() {
  const {
    members, language, isPremium, setTab,
    updateMemberRole, removeMember, currentUserId, groupId,
  } = useStore();
  const [inviteCode, setInviteCode] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const L = (en: string, hi: string) => (language === 'en' ? en : hi);
  const myRole = getMemberRole(members, currentUserId);
  const canManage = myRole ? canManageMembers(myRole) : false;
  const canPremium = myRole ? canUsePremium(myRole) : false;

  useEffect(() => {
    if (!isLiveFirebase() || !canManage || !groupId) return;
    fetchGroupInviteCode(groupId).then(setInviteCode);
  }, [canManage, groupId]);

  async function copyInviteCode() {
    if (!inviteCode) return;
    try {
      await navigator.clipboard.writeText(inviteCode);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      /* clipboard unavailable */
    }
  }

  function handleInvite() {
    if (!canManage) return;
    if (isLiveFirebase() && inviteCode) {
      copyInviteCode();
      return;
    }
    if (canPremium && !isPremium) setTab('premium');
  }

  return (
    <div className="flex flex-col pb-24">
      <SubScreenHeader
        title={L('Members', 'सदस्य')}
        onBack={() => goBackToTab('settings')}
      />

      {canManage && isLiveFirebase() && inviteCode && (
        <div className="px-4 mb-4">
          <div className="bg-brand-50 rounded-2xl px-4 py-4">
            <p className="text-[10px] font-bold uppercase text-brand-600 mb-2">
              {L('Family invite code', 'परिवार कोड')}
            </p>
            <div className="flex items-center justify-between gap-3">
              <p className="text-2xl font-black tracking-[0.3em] text-brand-700">{inviteCode}</p>
              <button
                type="button"
                onClick={copyInviteCode}
                className="shrink-0 flex items-center gap-1.5 bg-white text-brand-600 text-xs font-bold px-3 py-2 rounded-xl active:scale-95"
              >
                {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                {copied ? L('Copied', 'कॉपी') : L('Copy', 'कॉपी')}
              </button>
            </div>
            <p className="text-[11px] text-brand-700/70 mt-2 leading-relaxed">
              {L(
                'Share this code. Family members sign in with Google on Login and enter it to join.',
                'यह कोड साझा करें। परिवार Google से साइन इन करके Login पर कोड दर्ज करें।',
              )}
            </p>
          </div>
        </div>
      )}

      {canManage && !isLiveFirebase() && (
        <div className="px-4 mb-4">
          <button
            onClick={handleInvite}
            className="w-full flex items-center justify-center gap-2 bg-brand-50 text-brand-600 text-sm font-semibold py-3 rounded-2xl active:scale-[0.98] transition-transform"
          >
            <UserPlus className="w-4 h-4" />
            {L('Invite member', 'सदस्य जोड़ें')}
          </button>
        </div>
      )}

      {!canManage && (
        <div className="mx-4 mb-4 bg-gray-50 rounded-2xl px-4 py-3">
          <p className="text-xs text-gray-500">
            {L('Only Owner or Partner can change roles.', 'केवल Owner या Partner भूमिका बदल सकते हैं।')}
          </p>
        </div>
      )}

      <div className="px-4 flex flex-col gap-2">
        {members.map((m) => {
          const RoleIcon = ROLE_ICONS[m.role];
          const isSelf = m.id === currentUserId;

          return (
            <div
              key={m.id}
              className="bg-white rounded-2xl px-4 py-3.5 flex items-start gap-3"
            >
              <div
                className="w-11 h-11 rounded-xl flex items-center justify-center text-sm font-black text-white shrink-0"
                style={{ background: m.color }}
              >
                {m.avatar}
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <p className="text-sm font-bold text-gray-900 truncate">{m.name}</p>
                  {isSelf && (
                    <span className="text-[9px] font-bold bg-gray-100 text-gray-500 px-1.5 py-0.5 rounded-full shrink-0">
                      {L('You', 'आप')}
                    </span>
                  )}
                </div>

                {m.role === 'owner' ? (
                  <div
                    className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-full text-[10px] font-semibold mt-1.5"
                    style={roleBadgeStyle('owner', m.color)}
                  >
                    <RoleIcon className="w-2.5 h-2.5" />
                    {roleLabel('owner', language)}
                  </div>
                ) : canManage ? (
                  <div className="flex items-center gap-2 mt-2">
                    <div className="flex bg-gray-100 rounded-lg p-0.5">
                      {EDITABLE_ROLES.map((role) => {
                        const Icon = ROLE_ICONS[role];
                        const active = m.role === role;
                        const rc = ROLE_COLORS[role];
                        return (
                          <button
                            key={role}
                            type="button"
                            onClick={() => updateMemberRole(m.id, role)}
                            className={`flex items-center gap-0.5 px-2 py-1 rounded-md text-[10px] font-semibold transition-all active:scale-95 ${
                              active ? 'shadow-sm' : 'text-gray-400'
                            }`}
                            style={
                              active
                                ? { background: '#fff', color: rc.main }
                                : undefined
                            }
                          >
                            <Icon
                              className="w-3 h-3"
                              style={active ? { color: rc.main } : { color: '#9ca3af' }}
                            />
                            {roleLabel(role, language)}
                          </button>
                        );
                      })}
                    </div>
                    <button
                      type="button"
                      onClick={() => removeMember(m.id)}
                      className="p-1.5 rounded-lg text-gray-300 active:bg-rose-50 active:text-rose-500"
                      aria-label={L('Remove member', 'हटाएं')}
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ) : (
                  <div
                    className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-full text-[10px] font-semibold mt-1.5"
                    style={roleBadgeStyle(m.role, m.color)}
                  >
                    <RoleIcon className="w-2.5 h-2.5" />
                    {roleLabel(m.role, language)}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      <div className="px-4 mt-4">
        <p className="text-[10px] text-gray-400 leading-relaxed px-1">
          {L(
            'Owner: full access · Partner: manage family & finances · Helper: record own transactions only',
            'Owner: पूर्ण · Partner: परिवार और वित्त · Helper: केवल अपने लेनदेन',
          )}
        </p>
      </div>
    </div>
  );
}
