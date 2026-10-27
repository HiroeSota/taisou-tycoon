import { TrendingUp, TrendingDown, AlertCircle, Lightbulb, ChevronRight } from 'lucide-react';
import { useGameStore } from '../../store/gameStore';
import { formatCurrency, formatPercent } from '../../utils/format';

export function MonthReport() {
  const { company, setScreen } = useGameStore();
  const report = company.monthlyReports[company.monthlyReports.length - 1];
  if (!report) return null;

  return (
    <div className="min-h-screen pb-8 bg-gradient-to-br from-slate-900 via-blue-950/30 to-slate-900" style={{ paddingTop: 'var(--topbar-h, 4rem)' }}>
      <div className="max-w-2xl mx-auto px-4">
        <div className="py-4">
          <h1 className="text-xl font-bold text-white">{report.year}年{report.month}月 月次レポート</h1>
        </div>

        {/* P&L Summary */}
        <div className={`card mb-4 ${report.operatingProfit >= 0 ? 'border-green-500/30' : 'border-red-500/30'}`}>
          <div className="flex items-center justify-between mb-3">
            <span className="text-slate-400 text-sm">今月の営業利益</span>
            {report.operatingProfit >= 0
              ? <TrendingUp size={16} className="text-green-400" />
              : <TrendingDown size={16} className="text-red-400" />
            }
          </div>
          <div className={`text-4xl font-black mb-3 ${report.operatingProfit >= 0 ? 'text-green-400' : 'text-red-400'}`}>
            {report.operatingProfit >= 0 ? '+' : ''}{formatCurrency(report.operatingProfit)}
          </div>
          <div className="grid grid-cols-2 gap-3">
            <PLItem label="売上" value={report.revenue} positive />
            <PLItem label="費用" value={-report.expenses} />
            <PLItem label="会員数" value={report.memberCount} suffix="名" noSign />
            <PLItem label="継続率" value={report.retentionRate * 100} suffix="%" noSign />
          </div>
        </div>

        {/* Highlights */}
        {report.highlights.length > 0 && (
          <div className="card mb-4">
            <h3 className="text-white font-bold mb-2 flex items-center gap-2">
              <span>✨</span> 今月のハイライト
            </h3>
            {report.highlights.map((h, i) => (
              <div key={i} className="flex items-start gap-2 text-green-300 text-sm mb-1">
                <span className="text-green-500 shrink-0">▲</span> {h}
              </div>
            ))}
          </div>
        )}

        {/* Warnings */}
        {report.warnings.length > 0 && (
          <div className="card mb-4 border-red-500/20">
            <h3 className="text-white font-bold mb-2 flex items-center gap-2">
              <AlertCircle size={16} className="text-red-400" /> 注意点
            </h3>
            {report.warnings.map((w, i) => (
              <div key={i} className="flex items-start gap-2 text-red-300 text-sm mb-1">
                <span className="text-red-500 shrink-0">!</span> {w}
              </div>
            ))}
          </div>
        )}

        {/* Suggestions */}
        {report.suggestions.length > 0 && (
          <div className="card mb-4 border-amber-500/20 bg-amber-500/5">
            <h3 className="text-white font-bold mb-2 flex items-center gap-2">
              <Lightbulb size={16} className="text-amber-400" /> 改善提案
            </h3>
            {report.suggestions.map((s, i) => (
              <div key={i} className="flex items-start gap-2 text-amber-200 text-sm mb-2">
                <span className="text-amber-500 shrink-0 mt-0.5">→</span> {s}
              </div>
            ))}
            <p className="text-slate-500 text-xs mt-2">
              ※これらはヒントです。最終的な判断はあなた自身で行ってください。
            </p>
          </div>
        )}

        <button onClick={() => setScreen('classroom')} className="btn-primary w-full justify-center">
          経営を続ける <ChevronRight size={16} />
        </button>
      </div>
    </div>
  );
}

function PLItem({ label, value, positive = false, suffix = '円', noSign = false }: {
  label: string; value: number; positive?: boolean; suffix?: string; noSign?: boolean;
}) {
  const displayValue = suffix === '円'
    ? formatCurrency(Math.abs(value))
    : `${Math.round(Math.abs(value))}${suffix}`;
  const color = noSign ? 'text-white' : (value >= 0 ? 'text-green-400' : 'text-red-400');
  const sign = noSign ? '' : (value >= 0 ? '+' : '-');

  return (
    <div className="bg-white/5 rounded-xl p-2">
      <div className="text-slate-500 text-xs">{label}</div>
      <div className={`font-bold text-sm ${color}`}>{sign}{displayValue}</div>
    </div>
  );
}
