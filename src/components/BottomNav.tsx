import { Home, TrendingDown, TrendingUp, Settings, Users, History } from 'lucide-react';
import { useStore } from '../store/useStore';
import { getMemberRole, isSettingsArea, visibleTabs } from '../lib/permissions';

const LEFT_TABS = [
  { id: 'home',    Icon: Home,    en: 'Home',    hi: 'होम'     },
  { id: 'history', Icon: History, en: 'History', hi: 'इतिहास'  },
] as const;

const RIGHT_TABS = [
  { id: 'family',   Icon: Users,    en: 'Family',   hi: 'परिवार'  },
  { id: 'settings', Icon: Settings, en: 'Settings', hi: 'सेटिंग' },
] as const;

export default function BottomNav() {
  const { currentTab, addMode, setTab, language, members, currentUserId } = useStore();
  const role = getMemberRole(members, currentUserId);
  const allowed = role ? visibleTabs(role) : ['home', 'settings', 'add', 'family', 'history'];
  const showAdd = allowed.includes('add');
  const onAdd = currentTab === 'add';
  const L = (en: string, hi: string) => (language === 'en' ? en : hi);

  const leftTabs  = LEFT_TABS.filter(({ id }) => allowed.includes(id));
  const rightTabs = RIGHT_TABS.filter(({ id }) => allowed.includes(id));

  function isActive(id: string) {
    if (id === 'settings') return isSettingsArea(currentTab);
    return currentTab === id;
  }

  function renderTab({ id, Icon, en, hi }: (typeof LEFT_TABS)[number] | (typeof RIGHT_TABS)[number]) {
    const active = isActive(id);
    const label = L(en, hi);
    return (
      <button
        key={id}
        onClick={() => setTab(id)}
        aria-label={label}
        className={`flex flex-col items-center gap-1 py-1.5 px-2.5 rounded-xl transition-colors min-w-[3.75rem] ${
          active ? 'text-brand-500' : 'text-gray-400'
        }`}
      >
        <Icon className="w-6 h-6" strokeWidth={2.5} />
        <span className="text-xs font-semibold leading-tight">{label}</span>
      </button>
    );
  }

  return (
    <nav className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-sm bg-white border-t border-gray-100">
      <div className="flex items-end justify-around px-2 pt-2 pb-3">
        {leftTabs.map(renderTab)}

        {showAdd && (
          <div className="-mt-3 flex items-end gap-2 px-1">
            <button
              onClick={() => setTab('add', 'expense')}
              aria-label={L('Add expense', 'खर्च जोड़ें')}
              className="flex flex-col items-center gap-1 active:scale-95 transition-transform"
            >
              <div
                className={`w-12 h-12 rounded-full flex items-center justify-center shadow-md transition-all ${
                  onAdd && addMode === 'expense'
                    ? 'bg-rose-600 ring-2 ring-rose-300 ring-offset-1'
                    : 'bg-rose-500'
                }`}
              >
                <TrendingDown className="w-6 h-6 text-white" />
              </div>
              <span
                className={`text-xs font-medium leading-none ${
                  onAdd && addMode === 'expense' ? 'text-rose-600' : 'text-gray-400'
                }`}
              >
                {L('Expense', 'खर्च')}
              </span>
            </button>
            <button
              onClick={() => setTab('add', 'income')}
              aria-label={L('Add income', 'आय जोड़ें')}
              className="flex flex-col items-center gap-1 active:scale-95 transition-transform"
            >
              <div
                className={`w-12 h-12 rounded-full flex items-center justify-center shadow-md transition-all ${
                  onAdd && addMode === 'income'
                    ? 'bg-emerald-600 ring-2 ring-emerald-300 ring-offset-1'
                    : 'bg-emerald-500'
                }`}
              >
                <TrendingUp className="w-6 h-6 text-white" />
              </div>
              <span
                className={`text-xs font-medium leading-none ${
                  onAdd && addMode === 'income' ? 'text-emerald-600' : 'text-gray-400'
                }`}
              >
                {L('Income', 'आय')}
              </span>
            </button>
          </div>
        )}

        {rightTabs.map(renderTab)}
      </div>
    </nav>
  );
}
