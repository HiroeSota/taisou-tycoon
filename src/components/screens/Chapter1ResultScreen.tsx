import { Trophy, CheckCircle, XCircle, RotateCcw, ChevronRight } from 'lucide-react';
import { useGameStore } from '../../store/gameStore';
import { CHAPTER1_GOAL } from '../../data/missions';
import { formatCurrency } from '../../utils/format';

export function Chapter1ResultScreen() {
  const {
    chapter1Eval, dismissChapter1Result, setScreen,
    company, members, resetGame,
  } = useGameStore();

  if (!chapter1Eval?.evaluated) {
    setScreen('classroom');
    return null;
  }

  const { cleared } = chapter1Eval;
  const lastReport = company.monthlyReports[company.monthlyReports.length - 1];

  const criteria = [
    { label: '3ヶ月連続黒字', ok: chapter1Eval.consecutiveProfitableMonths >= 3, detail: `${chapter1Eval.consecutiveProfitableMonths}ヶ月連続` },
    { label: '運転資金3ヶ月分', ok: chapter1Eval.cashReserveOk, detail: `${chapter1Eval.cashReserveMonths.toFixed(1)}ヶ月分確保` },
    { label: '継続率70%以上', ok: chapter1Eval.retentionRateOk, detail: `${(chapter1Eval.retentionRate * 100).toFixed(0)}%` },
    { label: '安全インシデント0件', ok: chapter1Eval.safetyOk, detail: '0件' },
    { label: 'オーナー週40h以内', ok: chapter1Eval.ownerHoursOk, detail: `${chapter1Eval.ownerHoursPerWeek.toFixed(1)}h/週` },
    { label: '在籍会員5名以上', ok: chapter1Eval.hasActiveMembers, detail: `${members?.length ?? 0}名` },
  ];

  const passCount = criteria.filter(c => c.ok).length;

  return (
    <div className="min-h-screen pb-24 bg-gradient-to-br from-slate-900 via-blue-950/30 to-slate-900"
         style={{ paddingTop: 'var(--topbar-h, 4rem)' }}>
      <div className="max-w-2xl mx-auto px-4 py-6">

        {/* Result header */}
        <div className={`card text-center mb-6 ${cleared ? 'bg-gradient-to-b from-amber-900/30 to-green-900/20 border-amber-500/30' : 'bg-gradient-to-b from-slate-800/80 to-slate-900/80 border-white/10'}`}>
          <div className={`text-6xl mb-3 ${cleared ? '' : 'grayscale opacity-60'}`}>
            {cleared ? '🏆' : '📋'}
          </div>
          <h1 className={`text-2xl font-bold mb-1 ${cleared ? 'text-amber-300' : 'text-white'}`}>
            {cleared ? 'チャプター1 クリア！' : 'チャプター1 終了'}
          </h1>
          <p className="text-slate-400 text-sm mb-4">
            {cleared
              ? 'おめでとうございます！地域に根ざした体操教室を見事に軌道に乗せました。'
              : `クリア条件 ${passCount}/6 達成。次のチャレンジに活かしましょう。`}
          </p>
          <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-bold ${cleared ? 'bg-green-500/20 text-green-400' : 'bg-slate-700 text-slate-400'}`}>
            {cleared ? <CheckCircle size={15} /> : <XCircle size={15} />}
            {passCount}/6 条件達成
          </div>
        </div>

        {/* Business performance summary */}
        <h2 className="text-sm font-semibold text-slate-400 mb-3">最終業績サマリー</h2>
        <div className="grid grid-cols-2 gap-3 mb-6">
          <StatCard label="手元資金" value={formatCurrency(company.cash)} ok={company.cash >= 0} />
          <StatCard label="在籍会員" value={`${members?.length ?? 0}名`} ok={(members?.length ?? 0) >= 5} />
          <StatCard
            label="最終月売上"
            value={lastReport ? formatCurrency(lastReport.revenue) : '-'}
            ok={!!(lastReport && lastReport.revenue > 0)}
          />
          <StatCard
            label="最終月損益"
            value={lastReport ? formatCurrency(lastReport.operatingProfit) : '-'}
            ok={!!(lastReport && lastReport.operatingProfit > 0)}
          />
        </div>

        {/* Criteria detail */}
        <h2 className="text-sm font-semibold text-slate-400 mb-3">{CHAPTER1_GOAL.title} クリア条件</h2>
        <div className="flex flex-col gap-2 mb-6">
          {criteria.map((c, i) => (
            <div key={i} className={`flex items-center gap-3 p-3 rounded-xl border ${c.ok ? 'bg-green-500/10 border-green-500/30' : 'bg-red-500/10 border-red-500/20'}`}>
              <div className={`shrink-0 ${c.ok ? 'text-green-400' : 'text-red-400'}`}>
                {c.ok ? <CheckCircle size={16} /> : <XCircle size={16} />}
              </div>
              <div className="flex-1 text-sm font-semibold text-slate-200">{c.label}</div>
              <div className={`text-xs shrink-0 ${c.ok ? 'text-green-400' : 'text-red-400'}`}>{c.detail}</div>
            </div>
          ))}
        </div>

        {/* Actions */}
        <div className="flex flex-col gap-3">
          {cleared ? (
            <button
              onClick={() => { dismissChapter1Result(); setScreen('classroom'); }}
              className="btn-primary justify-center py-3 text-base"
            >
              教室に戻る <ChevronRight size={16} />
            </button>
          ) : (
            <>
              <button
                onClick={() => { dismissChapter1Result(); setScreen('classroom'); }}
                className="btn-primary justify-center py-3 text-base"
              >
                このまま続ける <ChevronRight size={16} />
              </button>
              <button
                onClick={() => {
                  if (confirm('最初からやり直しますか？現在のデータはすべて消えます。')) {
                    resetGame();
                  }
                }}
                className="btn-secondary justify-center"
              >
                <RotateCcw size={15} /> 最初からやり直す
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

function StatCard({ label, value, ok }: { label: string; value: string; ok: boolean }) {
  return (
    <div className={`card text-center border ${ok ? 'border-green-500/20' : 'border-white/5'}`}>
      <div className="text-xs text-slate-500 mb-1">{label}</div>
      <div className={`font-bold text-sm ${ok ? 'text-green-400' : 'text-slate-400'}`}>{value}</div>
    </div>
  );
}
