import { Map, Home, BookOpen, Users, TrendingUp, BarChart2, Target } from 'lucide-react';
import { useGameStore } from '../../store/gameStore';
import type { Screen } from '../../types/game';

const NAV_ITEMS: { screen: Screen; icon: React.ReactNode; label: string }[] = [
  { screen: 'map', icon: <Map size={18} />, label: 'マップ' },
  { screen: 'classroom', icon: <Home size={18} />, label: '教室' },
  { screen: 'menu_lessons', icon: <BookOpen size={18} />, label: 'クラス' },
  { screen: 'menu_members', icon: <Users size={18} />, label: '会員' },
  { screen: 'menu_marketing', icon: <TrendingUp size={18} />, label: '集客' },
  { screen: 'menu_finance', icon: <BarChart2 size={18} />, label: '財務' },
  { screen: 'menu_missions', icon: <Target size={18} />, label: '目標' },
];

const IN_GAME_SCREENS: Screen[] = [
  'classroom', 'map', 'menu_lessons', 'menu_members', 'menu_marketing',
  'menu_staff', 'menu_finance', 'menu_strategy', 'menu_missions',
  'week_report', 'month_report', 'chapter1_result',
];

export function BottomNav() {
  const { currentScreen, setScreen } = useGameStore();
  if (!IN_GAME_SCREENS.includes(currentScreen)) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-40 glass-dark border-t border-white/10 safe-area-bottom">
      <div className="flex items-center justify-around px-1 py-1 max-w-lg mx-auto">
        {NAV_ITEMS.map(item => {
          const active = currentScreen === item.screen;
          return (
            <button
              key={item.screen}
              onClick={() => setScreen(item.screen)}
              className={`flex flex-col items-center gap-0.5 px-2 py-2 rounded-xl transition-all min-w-0 flex-1
                ${active ? 'text-blue-400' : 'text-slate-500 hover:text-slate-300'}`}
            >
              <div className={`transition-transform ${active ? 'scale-110' : ''}`}>{item.icon}</div>
              <span className="text-xs font-medium">{item.label}</span>
              {active && (
                <div className="w-1 h-1 rounded-full bg-blue-400" />
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
