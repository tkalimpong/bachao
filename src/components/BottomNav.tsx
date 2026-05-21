import { Home, TrendingDown, TrendingUp, Settings, Users, History } from 'lucide-react';
import { useStore } from '../store/useStore';
import { getMemberRole, isSettingsArea, visibleTabs } from '../lib/permissions';

const LEFT_TABS = [
  { id: 'home',    Icon: Home,    label: 'Home'    },
  { id: 'history', Icon: History, label: 'History' },
] as const;

const RIGHT_TABS = [
  { id: 'family',   Icon: Users,    label: 'Family'   },
  { id: 'settings', Icon: Settings, label: 'Settings' },
] as const;

export default function BottomNav() {
  const { currentTab, addMode, setTab, members, currentUserId } = useStore();
  const role = getMemberRole(members, currentUserId);
  const allowed = role ? visibleTabs(role) : ['home', 'settings', 'add', 'family', 'history'];
  const showAdd = allowed.includes('add');
  const onAdd = currentTab === 'add';

  const leftTabs  = LEFT_TABS.filter(({ id }) => allowed.includes(id));
  const rightTabs = RIGHT_TABS.filter(({ id }) => allowed.includes(id));

  function isActive(id: string) {
    if (id === 'settings') return isSettingsArea(currentTab);
    return currentTab === id;
  }

  function renderTab({ id, Icon, label }: (typeof LEFT_TABS)[number] | (typeof RIGHT_TABS)[number]) {
    const active = isActive(id);
    return (
      <button
        key={id}
        onClick={() => setTab(id)}
        aria-label={label}
        className={`p-2 rounded-xl transition-colors ${
          active ? 'text-brand-500' : 'text-gray-400'
        }`}
      >
        <Icon className="w-6 h-6" />
      </button>
    );
  }

  return (
    <nav className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-sm bg-white border-t border-gray-100">
      <div className="flex items-center justify-around px-1 py-2 pb-3">
        {leftTabs.map(renderTab)}

        {showAdd && (
          <div className="-mt-4 flex items-center gap-2 px-1">
            <button
              onClick={() => setTab('add', 'expense')}
              aria-label="Add expense"
              className="active:scale-95 transition-transform"
            >
              <div
                className={`w-12 h-12 rounded-full flex items-center justify-center shadow-md transition-all ${
                  onAdd && addMode === 'expense'
                    ? 'bg-rose-600 ring-2 ring-rose-300 ring-offset-1'
                    : 'bg-rose-500'
                }`}
              >
                <TrendingDown className="w-5 h-5 text-white" />
              </div>
            </button>
            <button
              onClick={() => setTab('add', 'income')}
              aria-label="Add income"
              className="active:scale-95 transition-transform"
            >
              <div
                className={`w-12 h-12 rounded-full flex items-center justify-center shadow-md transition-all ${
                  onAdd && addMode === 'income'
                    ? 'bg-emerald-600 ring-2 ring-emerald-300 ring-offset-1'
                    : 'bg-emerald-500'
                }`}
              >
                <TrendingUp className="w-5 h-5 text-white" />
              </div>
            </button>
          </div>
        )}

        {rightTabs.map(renderTab)}
      </div>
    </nav>
  );
}
