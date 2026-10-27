import { ArrowLeft, TrendingUp, TrendingDown, DollarSign, AlertCircle } from 'lucide-react';
import { useGameStore } from '../../store/gameStore';
import { formatCurrency, formatCurrencyFull, formatPercent } from '../../utils/format';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts';

export function FinanceScreen() {
  const { company, members, classes, staff, selectedPropertyId, properties, setScreen } = useGameStore();

  const property = properties.find(p => p.id === selectedPropertyId);
  const weeklyRent = property?.weeklyRent ?? 0;
  const weeklyWages = staff.filter(s => !s.isOwner).reduce((s, st) => s + st.weeklyWage, 0);
  const monthlyRevenue = members.reduce((s, m) => s + m.monthlyFee, 0);
  const monthlyFixedCost = (weeklyRent + weeklyWages) * 4;
  const monthlyInsurance = 3000;
  const monthlySupplies = members.length * 400;
  const monthlyExpenseEst = monthlyFixedCost + monthlyInsurance + monthlySupplies;
  const breakEven = monthlyFixedCost > 0 && classes.length > 0
    ? Math.ceil(monthlyFixedCost / Math.max(1, classes.reduce((s, c) => s + c.monthlyFee, 0) / Math.max(1, classes.length)))
    : 0;

  const history = company.weeklyHistory.slice(-12);
  const chartData = history.map((w, i) => ({
    week: `W${i + 1}`,
    収入: w.cashIn,
    支出: w.cashOut,
    利益: w.cashIn - w.cashOut,
  }));

  const totalRevenue4w = history.slice(-4).reduce((s, w) => s + w.cashIn, 0);
  const totalExpenses4w = history.slice(-4).reduce((s, w) => s + w.cashOut, 0);
  const operatingProfit = totalRevenue4w - totalExpenses4w;

  // Owner opportunity cost — calculated from actual class schedule
  // (teaching time + 30min prep per session) for classes the owner teaches, plus admin overhead
  const ownerTeachingHours = classes
    .filter(c => c.active && (!c.instructorId || c.instructorId === 'owner'))
    .reduce((sum, c) => sum + (c.durationMinutes / 60) + 0.5, 0);
  const ownerWeeklyHours = Math.max(10, ownerTeachingHours + 5); // min 10h, +5h for admin
  const ownerHourlyCost = 1500;
  const ownerMonthlyCost = Math.round(ownerWeeklyHours * 4 * ownerHourlyCost);
  const realProfit = operatingProfit - ownerMonthlyCost;

  return (
    <div className="min-h-screen pb-8 bg-gradient-to-br from-slate-900 via-blue-950/30 to-slate-900" style={{ paddingTop: 'var(--topbar-h, 4rem)' }}>
      <div className="max-w-2xl mx-auto px-4">
        <div className="flex items-center gap-3 py-4">
          <button onClick={() => setScreen('classroom')} className="p-2 hover:bg-white/10 rounded-xl">
            <ArrowLeft size={18} className="text-slate-400" />
          </button>
          <h1 className="text-xl font-bold text-white">財務管理</h1>
        </div>

        {/* Cash balance highlight */}
        <div className={`card mb-4 ${company.cash < 100000 ? 'border-red-500/40 bg-red-500/5' : ''}`}>
          <div className="flex items-center justify-between">
            <div>
              <div className="text-slate-400 text-xs mb-1 flex items-center gap-1">
                <DollarSign size={12} /> 現金残高
              </div>
              <div className={`text-3xl font-black ${company.cash < 100000 ? 'text-red-400' : company.cash >= 500000 ? 'text-green-400' : 'text-white'}`}>
                {formatCurrency(company.cash)}
              </div>
            </div>
            {company.cash < 100000 && (
              <div className="flex items-center gap-1.5 text-red-400 text-sm bg-red-500/15 px-3 py-2 rounded-xl">
                <AlertCircle size={14} />
                <span>資金不足の警告</span>
              </div>
            )}
          </div>
        </div>

        {/* Monthly P&L estimate */}
        <div className="card mb-5">
          <h3 className="text-white font-bold mb-3">月間収支（直近4週）</h3>
          <div className="space-y-2">
            <PLRow label="売上" value={totalRevenue4w} isPositive />
            <PLRow label="　└ 月謝・体験料" value={totalRevenue4w} isPositive sub />
            <div className="border-t border-white/5 my-2" />
            <PLRow label="費用" value={-totalExpenses4w} />
            <PLRow label="　└ 会場費" value={-(weeklyRent * 4)} sub />
            <PLRow label="　└ 人件費" value={-(weeklyWages * 4)} sub />
            <PLRow label="　└ その他" value={-(monthlyInsurance + monthlySupplies)} sub />
            <div className="border-t border-white/10 my-2" />
            <div className="flex justify-between items-center">
              <span className="text-white font-bold">営業利益</span>
              <span className={`font-black text-lg ${operatingProfit >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                {operatingProfit >= 0 ? '+' : ''}{formatCurrency(operatingProfit)}
              </span>
            </div>
            {/* Owner cost note */}
            <div className="mt-3 p-3 bg-amber-500/10 rounded-xl text-xs text-amber-300">
              <div className="font-semibold mb-1">経営者の自己労働コストを含めた実質収益</div>
              <div>想定時給1,500円 × 週{ownerWeeklyHours.toFixed(1)}h × 4週 = <span className="font-bold">-{formatCurrency(ownerMonthlyCost)}</span></div>
              <div className="text-amber-300/60 mt-0.5">（授業{ownerTeachingHours.toFixed(1)}h＋準備・管理5h）</div>
              <div className="mt-1">実質利益：<span className={`font-bold ${realProfit >= 0 ? 'text-green-400' : 'text-red-400'}`}>{formatCurrency(realProfit)}</span></div>
            </div>
          </div>
        </div>

        {/* Break-even */}
        {breakEven > 0 && (
          <div className="card mb-5">
            <h3 className="text-white font-bold mb-2">損益分岐点</h3>
            <div className="text-slate-400 text-xs mb-3">
              損益分岐点とは、売上と費用がちょうど同じになるラインです。これを超えると黒字になります。
            </div>
            <div className="flex items-center justify-between">
              <div>
                <div className="text-slate-400 text-xs">必要会員数</div>
                <div className="text-white text-2xl font-black">{breakEven}名</div>
              </div>
              <div className="text-right">
                <div className="text-slate-400 text-xs">現在の会員数</div>
                <div className={`text-2xl font-black ${members.length >= breakEven ? 'text-green-400' : 'text-amber-400'}`}>
                  {members.length}名
                </div>
              </div>
              <div>
                <div className="text-slate-400 text-xs">あと</div>
                <div className={`text-xl font-bold ${members.length >= breakEven ? 'text-green-400' : 'text-red-400'}`}>
                  {members.length >= breakEven ? '達成！' : `${breakEven - members.length}名`}
                </div>
              </div>
            </div>
            <div className="mt-3 h-3 bg-white/10 rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full transition-all ${members.length >= breakEven ? 'bg-green-500' : 'bg-amber-500'}`}
                style={{ width: `${Math.min(100, breakEven > 0 ? (members.length / breakEven) * 100 : 0)}%` }}
              />
            </div>
          </div>
        )}

        {/* Revenue chart */}
        {chartData.length > 0 && (
          <div className="card mb-5">
            <h3 className="text-white font-bold mb-3">収支推移（直近12週）</h3>
            <ResponsiveContainer width="100%" height={180}>
              <AreaChart data={chartData}>
                <defs>
                  <linearGradient id="gIn" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#22c55e" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#22c55e" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="gOut" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#f87171" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#f87171" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <XAxis dataKey="week" tick={{ fill: '#475569', fontSize: 10 }} />
                <YAxis tick={{ fill: '#475569', fontSize: 10 }} tickFormatter={v => `${(v / 10000).toFixed(0)}万`} />
                <Tooltip
                  contentStyle={{ background: '#1e293b', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', color: '#e2e8f0', fontSize: 12 }}
                  formatter={(v: any) => [formatCurrency(v as number)]}
                />
                <Area type="monotone" dataKey="収入" stroke="#22c55e" fill="url(#gIn)" strokeWidth={2} />
                <Area type="monotone" dataKey="支出" stroke="#f87171" fill="url(#gOut)" strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        )}

        {/* Monthly reports */}
        {company.monthlyReports.length > 0 && (
          <div className="card">
            <h3 className="text-white font-bold mb-3">月次レポート履歴</h3>
            <div className="flex flex-col gap-2">
              {[...company.monthlyReports].reverse().slice(0, 6).map((r, i) => (
                <div key={i} className="flex items-center justify-between p-3 bg-white/5 rounded-xl">
                  <div className="text-slate-400 text-sm">{r.year}年{r.month}月</div>
                  <div className={`font-bold text-sm ${r.operatingProfit >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                    {r.operatingProfit >= 0 ? '+' : ''}{formatCurrency(r.operatingProfit)}
                  </div>
                  <div className="text-slate-400 text-xs">{r.memberCount}名</div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function PLRow({ label, value, isPositive = false, sub = false }: {
  label: string; value: number; isPositive?: boolean; sub?: boolean;
}) {
  return (
    <div className={`flex justify-between items-center ${sub ? 'text-slate-500 text-xs' : 'text-sm'}`}>
      <span className={sub ? '' : 'text-slate-300'}>{label}</span>
      <span className={isPositive ? 'text-green-400' : 'text-red-400'}>
        {value >= 0 ? '+' : ''}{formatCurrency(value)}
      </span>
    </div>
  );
}
