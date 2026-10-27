import { TrendingUp, TrendingDown, Users, DollarSign, ChevronRight, Lightbulb } from 'lucide-react';
import { useGameStore } from '../../store/gameStore';
import { formatCurrency, formatDate } from '../../utils/format';

export function WeekReport() {
  const {
    lastWeekReport, currentDate, members, company, funnel,
    closeWeekReport,
    pendingEvents, applyEventEffect, dismissEvent,
  } = useGameStore();

  if (!lastWeekReport) return null;

  const profit = lastWeekReport.cashIn - lastWeekReport.cashOut;
  const currentEvent = pendingEvents[0];

  if (currentEvent) {
    return (
      <EventPanel
        event={currentEvent}
        onChoice={(idx) => applyEventEffect(currentEvent, idx)}
        onDismiss={() => dismissEvent(currentEvent.id)}
      />
    );
  }

  return (
    <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-slate-800 rounded-2xl border border-white/15 overflow-hidden">
        {/* Header */}
        <div className={`px-5 py-4 ${profit >= 0 ? 'bg-gradient-to-r from-green-800/60 to-blue-900/60' : 'bg-gradient-to-r from-red-900/60 to-slate-900/60'}`}>
          <div className="text-slate-400 text-xs mb-0.5">
            {formatDate(currentDate.year, currentDate.month, currentDate.week)} 週次レポート
          </div>
          <div className="text-white font-black text-2xl">{company.name}</div>
        </div>

        <div className="p-5 max-h-[70vh] overflow-y-auto scrollbar-thin">
          {/* Key metrics */}
          <div className="grid grid-cols-2 gap-3 mb-5">
            <MetricCard
              label="今週の収入"
              value={formatCurrency(lastWeekReport.cashIn)}
              icon={<TrendingUp size={15} />}
              color="text-green-400"
            />
            <MetricCard
              label="今週の支出"
              value={formatCurrency(lastWeekReport.cashOut)}
              icon={<TrendingDown size={15} />}
              color="text-red-400"
            />
            <MetricCard
              label="今週の利益"
              value={`${profit >= 0 ? '+' : ''}${formatCurrency(profit)}`}
              icon={<DollarSign size={15} />}
              color={profit >= 0 ? 'text-green-400' : 'text-red-400'}
            />
            <MetricCard
              label="現金残高"
              value={formatCurrency(company.cash)}
              icon={<DollarSign size={15} />}
              color={company.cash < 100000 ? 'text-red-400' : 'text-white'}
            />
          </div>

          {/* Member changes */}
          <div className="card mb-4">
            <div className="flex items-center gap-2 mb-2">
              <Users size={14} className="text-blue-400" />
              <span className="text-white font-semibold text-sm">会員の動き</span>
            </div>
            <div className="flex justify-between items-center text-sm mb-3">
              <div>
                <span className="text-slate-400">入会</span>
                <span className="text-green-400 font-bold ml-2">+{lastWeekReport.newMembers}名</span>
              </div>
              <div>
                <span className="text-slate-400">退会</span>
                <span className="text-red-400 font-bold ml-2">-{lastWeekReport.lostMembers}名</span>
              </div>
              <div>
                <span className="text-slate-400">合計</span>
                <span className="text-white font-bold ml-2">{members.length}名</span>
              </div>
            </div>
            {/* Marketing funnel results */}
            {(funnel.weeklyInquiries > 0 || funnel.weeklyTrialAttendance > 0) && (
              <div className="border-t border-white/5 pt-2 flex items-center gap-3 text-xs text-slate-400">
                <span>集客:</span>
                <span>問い合わせ <span className="text-blue-300 font-semibold">{funnel.weeklyInquiries}件</span></span>
                <span>→</span>
                <span>体験 <span className="text-purple-300 font-semibold">{funnel.weeklyTrialAttendance}名</span></span>
                <span>→</span>
                <span>入会 <span className="text-green-400 font-semibold">{funnel.weeklyNewMembers}名</span></span>
              </div>
            )}
          </div>

          {/* Expense breakdown */}
          <div className="card mb-4">
            <div className="text-white font-semibold text-sm mb-2">支出の内訳</div>
            {Object.entries(lastWeekReport.expenses).map(([key, val]) => {
              if (!val) return null;
              return (
                <div key={key} className="flex justify-between text-xs text-slate-400 mb-1">
                  <span>{EXPENSE_LABELS[key] ?? key}</span>
                  <span>{formatCurrency(val as number)}</span>
                </div>
              );
            })}
          </div>

          {/* Context hint */}
          {getWeeklyInsight(lastWeekReport, members.length, company) && (
            <div className="p-3 bg-amber-500/10 border border-amber-500/20 rounded-xl mb-4 text-sm">
              <div className="flex items-start gap-2">
                <Lightbulb size={14} className="text-amber-400 mt-0.5 shrink-0" />
                <span className="text-amber-200">{getWeeklyInsight(lastWeekReport, members.length, company)}</span>
              </div>
            </div>
          )}
        </div>

        <div className="px-5 pb-5">
          <button
            onClick={closeWeekReport}
            className="btn-primary w-full justify-center"
          >
            次のアクションへ <ChevronRight size={16} />
          </button>
        </div>
      </div>
    </div>
  );
}

function MetricCard({ label, value, icon, color }: {
  label: string; value: string; icon: React.ReactNode; color: string;
}) {
  return (
    <div className="bg-white/5 rounded-xl p-3">
      <div className="flex items-center gap-1.5 text-slate-500 text-xs mb-1">
        <span className={color}>{icon}</span>
        {label}
      </div>
      <div className={`font-bold text-sm ${color}`}>{value}</div>
    </div>
  );
}

const EXPENSE_LABELS: Record<string, string> = {
  rent: '会場費',
  staffWages: '人件費',
  marketing: '広告費',
  insurance: '保険料',
  supplies: '消耗品費',
  equipment: '設備費',
  other: 'その他',
};

function getWeeklyInsight(report: any, memberCount: number, company: any): string | null {
  if (report.cashIn - report.cashOut < 0 && report.cashIn > 0) {
    return '今週は赤字です。費用を見直すか、会員数を増やしましょう。';
  }
  if (report.newMembers === 0) {
    return '今週は入会がありませんでした。集客施策を見直してみましょう。';
  }
  if (report.expenses.marketing > report.cashIn * 0.4) {
    return '広告費が収入の40%を超えています。広告費に対して入会数が見合っているか確認しましょう。';
  }
  return null;
}

// ===== Event Panel =====
function EventPanel({
  event, onChoice, onDismiss
}: {
  event: any;
  onChoice: (idx: number) => void;
  onDismiss: () => void;
}) {
  const colors = {
    good: 'from-green-900/60 to-blue-900/60 border-green-500/30',
    bad: 'from-red-900/60 to-slate-900/60 border-red-500/30',
    neutral: 'from-slate-800/80 to-slate-900/60 border-white/10',
    choice: 'from-blue-900/60 to-slate-900/60 border-blue-500/30',
  };
  const icons = { good: '🌟', bad: '⚠️', neutral: 'ℹ️', choice: '🤔' };

  return (
    <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4">
      <div className={`w-full max-w-md bg-slate-800 rounded-2xl border overflow-hidden ${colors[event.type as keyof typeof colors]}`}>
        <div className={`px-5 py-4 bg-gradient-to-r ${colors[event.type as keyof typeof colors].split(' ').slice(0, 2).join(' ')}`}>
          <div className="flex items-center gap-2">
            <span className="text-2xl">{icons[event.type as keyof typeof icons]}</span>
            <span className="text-white font-bold text-lg">{event.title}</span>
          </div>
        </div>

        <div className="p-5">
          <p className="text-slate-300 text-sm leading-relaxed mb-5">{event.description}</p>

          {event.choices ? (
            <div className="flex flex-col gap-2">
              {event.choices.map((choice: any, i: number) => (
                <button
                  key={i}
                  onClick={() => onChoice(i)}
                  className="btn-secondary text-left flex-col items-start gap-1 p-3.5 w-full"
                >
                  <span className="font-bold text-white text-sm">{choice.label}</span>
                  <span className="text-slate-400 text-xs">{choice.description}</span>
                </button>
              ))}
            </div>
          ) : (
            <button onClick={onDismiss} className="btn-primary w-full justify-center">
              確認した <ChevronRight size={15} />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
