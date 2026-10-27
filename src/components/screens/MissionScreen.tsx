import { ArrowLeft, CheckCircle, Circle, Clock, Target, Trophy } from 'lucide-react';
import { useGameStore } from '../../store/gameStore';
import { CHAPTER1_GOAL } from '../../data/missions';
import { formatCurrency } from '../../utils/format';

export function MissionScreen() {
  const {
    setScreen, missions, chapter1Eval, weekNumber, members,
    company, classes,
  } = useGameStore();

  const totalMissions = missions?.length ?? 0;
  const completedMissions = missions?.filter(m => m.completed).length ?? 0;
  const progressPct = totalMissions > 0 ? (completedMissions / totalMissions) * 100 : 0;

  const weeksLeft = Math.max(0, CHAPTER1_GOAL.evaluationWeekNumber - weekNumber);
  const evalDate = `${CHAPTER1_GOAL.evaluationYear}年${CHAPTER1_GOAL.evaluationMonth}月 第${CHAPTER1_GOAL.evaluationWeek}週`;

  // Live criteria status (before evaluation)
  const lastReport = company.monthlyReports[company.monthlyReports.length - 1];
  const consecutive = computeConsecutiveProfitableMonths(company.monthlyReports);
  const monthlyExpenses = lastReport?.expenses ?? 0;
  const cashReserveMonths = monthlyExpenses > 0 ? company.cash / monthlyExpenses : 0;
  const retentionRate = lastReport?.retentionRate ?? 0;
  const ownerClasses = (classes ?? []).filter(c => c.active && (c.instructorId === null || c.instructorId === 'owner'));
  const ownerHoursPerWeek = ownerClasses.reduce((s, c) => s + c.durationMinutes / 60, 0);

  // If chapter1 was evaluated, use that; otherwise show live status
  const criteria = chapter1Eval?.evaluated ? [
    { label: '3ヶ月連続黒字', ok: chapter1Eval.consecutiveProfitableMonths >= 3, detail: `${chapter1Eval.consecutiveProfitableMonths}ヶ月連続` },
    { label: '運転資金3ヶ月分', ok: chapter1Eval.cashReserveOk, detail: `${chapter1Eval.cashReserveMonths.toFixed(1)}ヶ月分` },
    { label: '継続率70%以上', ok: chapter1Eval.retentionRateOk, detail: `${(chapter1Eval.retentionRate * 100).toFixed(0)}%` },
    { label: '安全インシデント0件', ok: chapter1Eval.safetyOk, detail: '0件' },
    { label: 'オーナー週40h以内', ok: chapter1Eval.ownerHoursOk, detail: `${chapter1Eval.ownerHoursPerWeek.toFixed(1)}h/週` },
    { label: '在籍会員5名以上', ok: chapter1Eval.hasActiveMembers, detail: `${members?.length ?? 0}名在籍` },
  ] : [
    { label: '3ヶ月連続黒字', ok: consecutive >= 3, detail: `現在 ${consecutive}ヶ月連続` },
    { label: '運転資金3ヶ月分', ok: cashReserveMonths >= 3, detail: `現在 ${cashReserveMonths.toFixed(1)}ヶ月分（${formatCurrency(company.cash)}）` },
    { label: '継続率70%以上', ok: retentionRate >= 0.7, detail: lastReport ? `現在 ${(retentionRate * 100).toFixed(0)}%` : 'まだデータなし' },
    { label: '安全インシデント0件', ok: true, detail: '0件（問題なし）' },
    { label: 'オーナー週40h以内', ok: ownerHoursPerWeek <= 40, detail: `現在 ${ownerHoursPerWeek.toFixed(1)}h/週` },
    { label: '在籍会員5名以上', ok: (members?.length ?? 0) >= 5, detail: `現在 ${members?.length ?? 0}名` },
  ];

  const criteriaPassCount = criteria.filter(c => c.ok).length;

  return (
    <div className="min-h-screen pb-24 bg-gradient-to-br from-slate-900 via-blue-950/30 to-slate-900"
         style={{ paddingTop: 'var(--topbar-h, 4rem)' }}>
      <div className="max-w-2xl mx-auto px-4">

        {/* Header */}
        <div className="flex items-center gap-3 py-4">
          <button onClick={() => setScreen('classroom')} className="p-2 hover:bg-white/10 rounded-xl transition-colors">
            <ArrowLeft size={18} className="text-slate-400" />
          </button>
          <div>
            <h1 className="text-xl font-bold text-white">目標 / ミッション</h1>
            <div className="text-slate-400 text-xs">{CHAPTER1_GOAL.period}</div>
          </div>
        </div>

        {/* Chapter 1 banner */}
        <div className="card mb-4 bg-gradient-to-r from-blue-900/40 to-purple-900/40 border-blue-500/30">
          <div className="flex items-start justify-between mb-3">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <Trophy size={16} className="text-amber-400" />
                <span className="font-bold text-white">{CHAPTER1_GOAL.title}</span>
              </div>
              <p className="text-slate-400 text-sm">{CHAPTER1_GOAL.objective}</p>
            </div>
            <div className="text-right shrink-0 ml-4">
              <div className="text-xs text-slate-500">最終評価</div>
              <div className="text-white font-semibold text-sm">{evalDate}</div>
              {!chapter1Eval?.evaluated && (
                <div className="flex items-center gap-1 text-amber-400 text-xs mt-0.5">
                  <Clock size={11} />
                  <span>残り{weeksLeft}週</span>
                </div>
              )}
            </div>
          </div>
          {/* Milestone progress bar */}
          <div className="mb-1">
            <div className="flex items-center justify-between text-xs text-slate-500 mb-1">
              <span>マイルストーン進捗</span>
              <span>{completedMissions}/{totalMissions}</span>
            </div>
            <div className="h-2 bg-white/10 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-blue-500 to-purple-500 rounded-full transition-all"
                style={{ width: `${progressPct}%` }}
              />
            </div>
          </div>
        </div>

        {/* Milestones */}
        <h2 className="text-sm font-semibold text-slate-400 mb-2 flex items-center gap-2">
          <Target size={14} /> マイルストーン
        </h2>
        <div className="flex flex-col gap-2 mb-6">
          {(missions ?? []).map((mission, i) => (
            <MissionItem key={mission.id} mission={mission} index={i + 1} />
          ))}
        </div>

        {/* Chapter 1 Clear Conditions */}
        <h2 className="text-sm font-semibold text-slate-400 mb-2 flex items-center gap-2">
          <CheckCircle size={14} /> チャプター1クリア条件
          <span className={`text-xs font-bold ${criteriaPassCount === 6 ? 'text-green-400' : 'text-slate-500'}`}>
            {criteriaPassCount}/6 達成
          </span>
        </h2>
        {chapter1Eval?.evaluated && (
          <div className={`flex items-center gap-2 p-3 rounded-xl text-sm mb-3 ${chapter1Eval.cleared ? 'bg-green-500/15 text-green-400 border border-green-500/30' : 'bg-red-500/15 text-red-400 border border-red-500/30'}`}>
            {chapter1Eval.cleared ? (
              <><CheckCircle size={15} /> クリア済み — おめでとうございます！</>
            ) : (
              <><Trophy size={15} /> 最終評価：未達成（{criteriaPassCount}/6条件）</>
            )}
          </div>
        )}
        <div className="flex flex-col gap-2">
          {criteria.map((c, i) => (
            <CriteriaItem key={i} label={c.label} ok={c.ok} detail={c.detail} />
          ))}
        </div>
      </div>
    </div>
  );
}

function MissionItem({ mission, index }: { mission: any; index: number }) {
  return (
    <div className={`flex items-start gap-3 p-3 rounded-xl border transition-all ${mission.completed ? 'bg-green-500/10 border-green-500/30' : 'bg-white/5 border-white/10'}`}>
      <div className={`mt-0.5 shrink-0 ${mission.completed ? 'text-green-400' : 'text-slate-600'}`}>
        {mission.completed ? <CheckCircle size={18} /> : <Circle size={18} />}
      </div>
      <div className="flex-1 min-w-0">
        <div className={`font-semibold text-sm ${mission.completed ? 'text-green-300' : 'text-white'}`}>
          {index}. {mission.title}
        </div>
        <div className="text-slate-500 text-xs mt-0.5">{mission.description}</div>
      </div>
      {mission.completed && mission.completedWeek !== undefined && (
        <div className="text-xs text-green-600 shrink-0">Week {mission.completedWeek}</div>
      )}
    </div>
  );
}

function CriteriaItem({ label, ok, detail }: { label: string; ok: boolean; detail: string }) {
  return (
    <div className={`flex items-center gap-3 p-3 rounded-xl border ${ok ? 'bg-green-500/10 border-green-500/30' : 'bg-white/5 border-white/10'}`}>
      <div className={`shrink-0 ${ok ? 'text-green-400' : 'text-slate-600'}`}>
        {ok ? <CheckCircle size={16} /> : <Circle size={16} />}
      </div>
      <div className="flex-1 min-w-0">
        <div className={`text-sm font-semibold ${ok ? 'text-green-300' : 'text-slate-300'}`}>{label}</div>
      </div>
      <div className={`text-xs shrink-0 ${ok ? 'text-green-400' : 'text-slate-500'}`}>{detail}</div>
    </div>
  );
}

function computeConsecutiveProfitableMonths(reports: any[]): number {
  let count = 0;
  for (let i = reports.length - 1; i >= 0; i--) {
    if (reports[i].operatingProfit > 0) count++;
    else break;
  }
  return count;
}
