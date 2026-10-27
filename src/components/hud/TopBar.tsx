import { Users, Wallet, TrendingUp, Calendar, ChevronRight, Pause, Play, FastForward } from 'lucide-react';
import { useGameStore } from '../../store/gameStore';
import { formatDate, formatCurrency } from '../../utils/format';

export function TopBar() {
  const {
    currentDate, company, members, currentScreen,
    autoAdvance, isAdvancing,
    setScreen, advanceWeek, setAutoAdvance,
  } = useGameStore();

  const isInGame = !['title', 'new_game'].includes(currentScreen);
  if (!isInGame) return null;

  const weeklyExpense = company.weeklyHistory.length > 0
    ? company.weeklyHistory[company.weeklyHistory.length - 1].cashOut
    : 0;
  const weeklyIncome = company.weeklyHistory.length > 0
    ? company.weeklyHistory[company.weeklyHistory.length - 1].cashIn
    : 0;
  const weeklyProfit = weeklyIncome - weeklyExpense;

  return (
    <div id="topbar-root" className="fixed top-0 left-0 right-0 z-50 glass-dark border-b border-white/10">
      <div className="max-w-7xl mx-auto flex items-center gap-2 px-3 py-2">
        {/* Logo */}
        <button
          onClick={() => setScreen('classroom')}
          className="text-blue-400 font-bold text-sm whitespace-nowrap hover:text-blue-300 transition-colors shrink-0"
        >
          体操TYCOON
        </button>

        {/* Stats — mobile: cash+members only; sm+: all four */}
        <div className="flex items-center gap-1.5 flex-1 min-w-0 overflow-hidden">
          {/* Always visible */}
          <StatChip
            icon={<Wallet size={12} />}
            label={formatCurrency(company.cash)}
            color={company.cash < 100000 ? 'text-red-400' : 'text-green-400'}
          />
          <StatChip
            icon={<Users size={12} />}
            label={`${members.length}名`}
            color="text-blue-400"
          />
          {/* Hidden on narrow mobile */}
          <span className="hidden sm:contents">
            <StatChip
              icon={<Calendar size={12} />}
              label={formatDate(currentDate.year, currentDate.month, currentDate.week)}
              color="text-slate-300"
            />
            <StatChip
              icon={<TrendingUp size={12} />}
              label={`${weeklyProfit >= 0 ? '+' : ''}${formatCurrency(weeklyProfit)}/週`}
              color={weeklyProfit >= 0 ? 'text-green-400' : 'text-red-400'}
            />
          </span>
          {/* Date on mobile as single compact line */}
          <span className="sm:hidden text-slate-400 text-xs whitespace-nowrap">
            {formatDate(currentDate.year, currentDate.month, currentDate.week)}
          </span>
        </div>

        {/* Controls — always visible, shrink-0 */}
        <div className="flex items-center gap-1.5 shrink-0">
          <button
            onClick={() => setAutoAdvance(!autoAdvance)}
            className="btn-secondary text-xs px-2 py-1.5 flex items-center gap-1"
            title={autoAdvance ? '一時停止' : '自動進行'}
          >
            {autoAdvance ? <Pause size={12} /> : <Play size={12} />}
          </button>
          <button
            onClick={() => advanceWeek()}
            disabled={isAdvancing}
            className="btn-success text-xs px-3 py-1.5 flex items-center gap-1 disabled:opacity-50 whitespace-nowrap shrink-0"
          >
            <ChevronRight size={13} />
            次の週へ
          </button>
        </div>
      </div>

      {/* Tutorial guide bar */}
      <TutorialBar />
    </div>
  );
}

function StatChip({ icon, label, color }: { icon: React.ReactNode; label: string; color: string }) {
  return (
    <div className={`flex items-center gap-1 px-2 py-1 rounded-lg bg-white/5 ${color} font-medium text-xs`}>
      {icon}
      <span>{label}</span>
    </div>
  );
}

function TutorialBar() {
  const { tutorialSteps, tutorialCompleted, tutorialStep } = useGameStore();
  if (tutorialCompleted) return null;
  const step = tutorialSteps[tutorialStep];
  if (!step || step.completed) return null;

  return (
    <div className="border-t border-white/5 px-4 py-1.5 flex items-center gap-2 text-xs text-amber-300 bg-amber-500/10">
      <span className="font-bold">チュートリアル</span>
      <span className="text-white/60">→</span>
      <span>{step.title}：{step.description}</span>
    </div>
  );
}
