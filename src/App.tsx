import React from 'react';
import { useStore } from './store/useStore';
import BottomNav from './components/BottomNav';
import Dashboard from './pages/Dashboard';
import AddExpense from './pages/AddExpense';
import Envelopes from './pages/Envelopes';
import Family from './pages/Family';
import Premium from './pages/Premium';

const SCREENS: Record<string, React.FC> = {
  home:      Dashboard,
  add:       AddExpense,
  envelopes: Envelopes,
  family:    Family,
  premium:   Premium,
};

export default function App() {
  const { currentTab } = useStore();
  const Screen = SCREENS[currentTab] ?? Dashboard;

  return (
    <div className="min-h-screen bg-gray-100 flex items-start justify-center">
      {/* Phone frame */}
      <div className="relative w-full max-w-sm min-h-screen bg-surface overflow-hidden flex flex-col">
        {/* Status bar mock */}
        <div className="h-6 bg-transparent shrink-0" />

        {/* Scrollable content */}
        <div className="flex-1 overflow-y-auto">
          <Screen />
        </div>

        {/* Bottom nav */}
        <BottomNav />
      </div>
    </div>
  );
}
