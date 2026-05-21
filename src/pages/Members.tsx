import { UserPlus, Trash2 } from 'lucide-react';
import { useStore } from '../store/useStore';
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

export default function Members() {
  const {
    members, language, isPremium, setTab,
    updateMemberRole, removeMember, currentUserId,
  } = useStore();

  const L = (en: string, hi: string) => (language === 'en' ? en : hi);
  const myRole = getMemberRole(members, currentUserId);
  const canManage = myRole ? canManageMembers(myRole) : false;
  const canPremium = myRole ? canUsePremium(myRole) : false;

  function handleInvite() {
    if (!canManage) return;
    if (canPremium && !isPremium) setTab('premium');
  }

  return (
    <div className="flex flex-col pb-24">
      <SubScreenHeader
        title={L('Members', 'सदस्य')}
        onBack={() => setTab('settings')}
      />

      {canManage && (
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
