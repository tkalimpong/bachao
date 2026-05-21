import { Home, PlusCircle, Wallet, Users, History } from 'lucide-react';
import { useStore } from '../store/useStore';

const tabs = [
  { id: 'home',      Icon: Home,       en: 'Home',      hi: 'होम'    },
  { id: 'envelopes', Icon: Wallet,     en: 'Envelopes', hi: 'लिफ़ाफ़े' },
  { id: 'add',       Icon: PlusCircle, en: 'Add',       hi: 'जोड़ें'  },
  { id: 'family',    Icon: Users,      en: 'Family',    hi: 'परिवार' },
  { id: 'history',   Icon: History,    en: 'History',   hi: 'इतिहास' },
] as const;

export default function BottomNav() {
  const { currentTab, setTab, language } = useStore();

  return (
    <nav className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-sm bg-white border-t border-gray-100">
      <div className="flex items-center justify-around px-2 py-1 pb-2">
        {tabs.map(({ id, Icon, en, hi }) => {
          const active = currentTab === id;
          const isAdd  = id === 'add';
          const isPro  = false;
          const label  = language === 'en' ? en : hi;

          if (isAdd) {
            return (
              <button
                key={id}
                onClick={() => setTab(id)}
                className="-mt-5 flex flex-col items-center"
              >
                <div
                  className={`w-14 h-14 rounded-full flex items-center justify-center shadow-md active:scale-95 transition-transform ${
                    active ? 'bg-gray-900' : 'bg-brand-500'
                  }`}
                >
                  <Icon className="w-7 h-7 text-white" />
                </div>
              </button>
            );
          }

          return (
            <button
              key={id}
              onClick={() => setTab(id)}
              className={`flex flex-col items-center gap-0.5 py-1 px-3 rounded-xl transition-colors ${
                active ? 'text-brand-500' : 'text-gray-400'
              }`}
            >
              <div className="relative">
                <Icon className="w-5 h-5" />
                {isPro && !active && (
                  <span className="absolute -top-1 -right-1 w-2 h-2 bg-yellow-400 rounded-full" />
                )}
              </div>
              <span className="text-[10px] font-medium">{label}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}
