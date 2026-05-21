import {
  Tag, Zap, Users, ChevronRight, Globe, Lock,
} from 'lucide-react';
import { useStore } from '../store/useStore';
import {
  canManageMembers,
  canUsePremium,
  getMemberRole,
} from '../lib/permissions';

type MenuItem = {
  id: string;
  Icon: typeof Tag;
  color: string;
  bg: string;
  en: string;
  hi: string;
  subEn: string;
  subHi: string;
  locked?: boolean;
  onClick: () => void;
};

export default function Settings() {
  const { language, isPremium, toggleLanguage, setTab, members, currentUserId } = useStore();
  const L = (en: string, hi: string) => (language === 'en' ? en : hi);

  const role = getMemberRole(members, currentUserId);
  const showPlan = role ? canUsePremium(role) : true;
  const canManage = role ? canManageMembers(role) : false;

  const items: MenuItem[] = [
    {
      id: 'members',
      Icon: Users,
      color: '#3b82f6',
      bg: '#eff6ff',
      en: 'Members',
      hi: 'सदस्य',
      subEn: canManage ? 'Edit roles & invite' : 'View member roles',
      subHi: canManage ? 'भूमिका बदलें और जोड़ें' : 'सदस्य भूमिका देखें',
      onClick: () => setTab('members'),
    },
    {
      id: 'categories',
      Icon: Tag,
      color: '#8b5cf6',
      bg: '#f5f3ff',
      en: 'Categories',
      hi: 'कैटेगरी',
      subEn: isPremium ? 'Edit icons and names' : 'View categories · Plus to edit',
      subHi: isPremium ? 'आइकन और नाम बदलें' : 'देखें · संपादन के लिए Plus',
      onClick: () => setTab('categories'),
    },
    ...(showPlan
      ? [{
          id: 'premium',
          Icon: Zap,
          color: '#eab308',
          bg: '#fefce8',
          en: 'Plan',
          hi: 'प्लान',
          subEn: isPremium ? 'Bachao Pro active' : 'Upgrade to Plus or Pro',
          subHi: isPremium ? 'बचाओ Pro सक्रिय' : 'Plus या Pro में अपग्रेड',
          onClick: () => setTab('premium'),
        }]
      : []),
  ];

  return (
    <div className="flex flex-col gap-4 pb-24 pt-10">
      <div className="px-5">
        <h1 className="text-xl font-bold text-gray-900">
          {L('Settings', 'सेटिंग')}
        </h1>
        <p className="text-xs text-gray-400 mt-0.5">
          {L('Manage members, categories & plan', 'सदस्य, कैटेगरी और प्लान')}
        </p>
      </div>

      <div className="px-4 flex flex-col gap-2">
        {items.map(({ id, Icon, color, bg, en, hi, subEn, subHi, locked, onClick }) => (
          <button
            key={id}
            onClick={onClick}
            disabled={locked}
            className="w-full bg-white rounded-2xl p-4 flex items-center gap-3 active:bg-gray-50 transition-colors text-left disabled:opacity-50"
          >
            <div
              className="w-11 h-11 rounded-xl flex items-center justify-center shrink-0"
              style={{ background: bg }}
            >
              <Icon className="w-5 h-5" style={{ color }} />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-gray-900">
                {L(en, hi)}
              </p>
              <p className="text-xs text-gray-400 truncate">
                {L(subEn, subHi)}
              </p>
            </div>
            {locked ? (
              <Lock className="w-4 h-4 text-gray-300 shrink-0" />
            ) : (
              <ChevronRight className="w-5 h-5 text-gray-300 shrink-0" />
            )}
          </button>
        ))}
      </div>

      <div className="px-4">
        <button
          onClick={toggleLanguage}
          className="w-full bg-white rounded-2xl p-4 flex items-center gap-3 active:bg-gray-50 transition-colors"
        >
          <div className="w-11 h-11 rounded-xl bg-sky-50 flex items-center justify-center shrink-0">
            <Globe className="w-5 h-5 text-sky-500" />
          </div>
          <div className="flex-1 text-left">
            <p className="text-sm font-semibold text-gray-900">
              {L('Language', 'भाषा')}
            </p>
            <p className="text-xs text-gray-400">
              {language === 'en' ? 'English' : 'हिन्दी'}
            </p>
          </div>
          <span className="text-xs font-bold text-brand-500 bg-brand-50 px-2.5 py-1 rounded-full">
            {language === 'en' ? 'EN' : 'HI'}
          </span>
        </button>
      </div>
    </div>
  );
}
