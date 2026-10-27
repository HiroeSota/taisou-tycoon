import { ArrowLeft, Map, Award, Target, TrendingUp, Building2 } from 'lucide-react';
import { useGameStore } from '../../store/gameStore';
import { formatCurrency } from '../../utils/format';
import { AREAS } from '../../data/areas';

const PHASE_NAMES = ['', 'スタート', 'クラス拡大', '収益多角化', '固定店舗', '複数教室', '法人化', '地域展開'];

export function StrategyScreen() {
  const { company, members, classes, staff, selectedAreaId, competitors, setScreen } = useGameStore();

  const areaCompetitors = competitors.filter(c => c.areaId === selectedAreaId && c.isActive);
  const area = AREAS.find(a => a.id === selectedAreaId);

  const incorporationReady =
    company.weeklyHistory.slice(-8).every(w => w.cashIn >= w.cashOut) &&
    members.length >= 30 &&
    company.cash >= 1000000;

  const nextPhaseTarget = getNextPhaseTarget(company.phase, members.length, company.cash);

  return (
    <div className="min-h-screen pb-8 bg-gradient-to-br from-slate-900 via-blue-950/30 to-slate-900" style={{ paddingTop: 'var(--topbar-h, 4rem)' }}>
      <div className="max-w-2xl mx-auto px-4">
        <div className="flex items-center gap-3 py-4">
          <button onClick={() => setScreen('classroom')} className="p-2 hover:bg-white/10 rounded-xl">
            <ArrowLeft size={18} className="text-slate-400" />
          </button>
          <h1 className="text-xl font-bold text-white">経営戦略</h1>
        </div>

        {/* Current phase */}
        <div className="card mb-5">
          <div className="flex items-center gap-2 mb-3">
            <Award size={18} className="text-amber-400" />
            <h3 className="text-white font-bold">現在のフェーズ</h3>
          </div>
          <div className="flex items-center gap-3 mb-3">
            <div className="text-5xl font-black text-blue-400">{company.phase}</div>
            <div>
              <div className="text-white font-bold text-lg">{PHASE_NAMES[company.phase]}</div>
              <div className="text-slate-400 text-sm">
                {company.phase < 7 ? `次のフェーズ：${PHASE_NAMES[company.phase + 1]}` : '最高フェーズ達成！'}
              </div>
            </div>
          </div>
          {nextPhaseTarget && (
            <div className="p-3 bg-blue-600/10 rounded-xl text-sm">
              <div className="text-blue-300 font-semibold mb-1">次のフェーズへの条件</div>
              {nextPhaseTarget.map((t, i) => (
                <div key={i} className={`flex items-center gap-2 ${t.met ? 'text-green-400' : 'text-slate-400'}`}>
                  <span>{t.met ? '✓' : '○'}</span>
                  <span>{t.label}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Milestones */}
        <div className="card mb-5">
          <h3 className="text-white font-bold mb-3 flex items-center gap-2"><Target size={16} />ゲーム目標</h3>
          <MilestoneRow
            label="第1目標：2028年3月まで"
            desc="継続可能な事業基盤をつくる（黒字・会員20名以上）"
            met={members.length >= 20 && company.weeklyHistory.slice(-4).some(w => w.cashIn >= w.cashOut)}
          />
          <MilestoneRow
            label="第2目標：2028年4月頃"
            desc="法人化を検討できる状態にする"
            met={incorporationReady}
          />
        </div>

        {/* Competitor intelligence */}
        <div className="card mb-5">
          <h3 className="text-white font-bold mb-3 flex items-center gap-2"><TrendingUp size={16} />競合情報</h3>
          {areaCompetitors.length === 0 ? (
            <p className="text-slate-500 text-sm">このエリアに競合はいません</p>
          ) : (
            <div className="flex flex-col gap-3">
              {areaCompetitors.map(comp => (
                <div key={comp.id} className="p-3 bg-white/5 rounded-xl">
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <div className="text-white font-semibold text-sm">{comp.name}</div>
                      <div className="text-slate-500 text-xs">{STRATEGY_LABELS[comp.strategy]}</div>
                    </div>
                    <div className="text-amber-400 text-sm font-bold">{formatCurrency(comp.monthlyFee)}/月</div>
                  </div>
                  <div className="flex gap-3 text-xs">
                    <span className="text-slate-400">会員 {comp.memberCount}名</span>
                    <span className="text-slate-400">認知度 {comp.brandAwareness}%</span>
                    <span className="text-slate-400">品質 {comp.quality}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Business scores */}
        <div className="card mb-5">
          <h3 className="text-white font-bold mb-3 flex items-center gap-2"><Award size={16} />経営評価スコア</h3>
          <div className="grid grid-cols-2 gap-2">
            {getBusinessScores(company, members, classes, staff).map(score => (
              <ScoreItem key={score.label} {...score} />
            ))}
          </div>
        </div>

        {/* Incorporation */}
        {company.phase >= 3 && !company.isIncorporated && (
          <div className={`card border ${incorporationReady ? 'border-green-500/40 bg-green-500/5' : 'border-white/10'}`}>
            <h3 className="text-white font-bold mb-2 flex items-center gap-2"><Building2 size={16} />法人化の検討</h3>
            <div className="text-slate-400 text-sm mb-3 leading-relaxed">
              法人化すると節税・信用力向上・採用強化などのメリットがあります。
              ただし、設立費用・社会保険負担・決算費用などのコストも発生します。
            </div>
            {incorporationReady ? (
              <div className="p-3 bg-green-500/15 rounded-xl text-green-400 text-sm font-semibold text-center">
                ✓ 法人化の条件が整っています（ゲーム上の目安）
              </div>
            ) : (
              <div className="text-slate-500 text-xs">
                条件：8週連続黒字、会員30名以上、現金100万円以上（ゲーム上の目安）
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

const STRATEGY_LABELS: Record<string, string> = {
  price_focused: '低価格戦略',
  quality_focused: '品質重視戦略',
  community_focused: '地域密着戦略',
};

function MilestoneRow({ label, desc, met }: { label: string; desc: string; met: boolean }) {
  return (
    <div className={`flex items-start gap-3 p-3 rounded-xl mb-2 ${met ? 'bg-green-500/10' : 'bg-white/5'}`}>
      <div className={`text-xl ${met ? 'text-green-400' : 'text-slate-500'}`}>{met ? '🏆' : '🎯'}</div>
      <div>
        <div className={`font-semibold text-sm ${met ? 'text-green-400' : 'text-white'}`}>{label}</div>
        <div className="text-slate-400 text-xs mt-0.5">{desc}</div>
      </div>
    </div>
  );
}

function ScoreItem({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <div className="bg-white/5 rounded-xl p-2.5">
      <div className="text-slate-500 text-xs mb-1">{label}</div>
      <div className="flex items-center gap-2">
        <div className="flex-1 h-1.5 bg-white/10 rounded-full overflow-hidden">
          <div className={`h-full rounded-full ${color}`} style={{ width: `${value}%` }} />
        </div>
        <span className="text-xs text-white font-bold">{value}</span>
      </div>
    </div>
  );
}

function getBusinessScores(company: any, members: any[], classes: any[], staff: any[]) {
  const avgSat = members.length > 0 ? members.reduce((s: number, m: any) => s + m.satisfaction, 0) / members.length : 0;
  const capacityUsed = classes.length > 0
    ? members.length / classes.reduce((s: number, c: any) => s + c.capacity, 0) * 100
    : 0;

  return [
    { label: '収益性', value: Math.min(100, Math.round((company.totalRevenue / Math.max(1, company.totalExpenses)) * 50)), color: 'bg-green-500' },
    { label: '財務健全性', value: Math.min(100, Math.round(Math.min(company.cash / 10000, 100))), color: 'bg-blue-500' },
    { label: '顧客満足度', value: Math.round(avgSat), color: 'bg-purple-500' },
    { label: 'クラス稼働率', value: Math.min(100, Math.round(capacityUsed)), color: 'bg-amber-500' },
    { label: '評判', value: company.reputation, color: 'bg-pink-500' },
    { label: 'ブランド認知', value: company.brandAwareness, color: 'bg-cyan-500' },
  ];
}

function getNextPhaseTarget(phase: number, memberCount: number, cash: number): { label: string; met: boolean }[] | null {
  switch (phase) {
    case 1: return [
      { label: `会員15名（現在：${memberCount}名）`, met: memberCount >= 15 },
    ];
    case 2: return [
      { label: `会員30名（現在：${memberCount}名）`, met: memberCount >= 30 },
      { label: `現金50万円（現在：${formatCurrency(cash)}）`, met: cash >= 500000 },
    ];
    case 3: return [
      { label: `会員60名（現在：${memberCount}名）`, met: memberCount >= 60 },
      { label: `現金150万円（現在：${formatCurrency(cash)}）`, met: cash >= 1500000 },
    ];
    case 4: return [
      { label: `会員100名（現在：${memberCount}名）`, met: memberCount >= 100 },
      { label: `現金300万円（現在：${formatCurrency(cash)}）`, met: cash >= 3000000 },
    ];
    default: return null;
  }
}
