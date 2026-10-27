import { useState } from 'react';
import { ArrowLeft, Plus, Pause, Play, Trash2, TrendingUp, Info } from 'lucide-react';
import { useGameStore } from '../../store/gameStore';
import type { MarketingCampaign } from '../../types/game';
import { formatCurrency } from '../../utils/format';

const CAMPAIGN_OPTIONS = [
  {
    type: 'flyer' as const,
    name: 'チラシ配布',
    icon: '📄',
    desc: '近隣へのポスティング。即効性は低いが認知度向上に効果的',
    defaultBudget: 8000,
    budgetOptions: [5000, 8000, 15000],
    effectNote: '認知リーチ：高 / 入会率：低め',
    setupTime: '即日',
  },
  {
    type: 'sns' as const,
    name: 'SNS投稿',
    icon: '📱',
    desc: 'InstagramやX（旧Twitter）で教室の様子を発信',
    defaultBudget: 5000,
    budgetOptions: [3000, 5000, 10000],
    effectNote: '口コミ力：高 / 効果発現：2週後から',
    setupTime: '2〜3週後に効果',
  },
  {
    type: 'web_ad' as const,
    name: 'Web広告',
    icon: '💻',
    desc: 'Google・Instagram広告でリーチ拡大',
    defaultBudget: 15000,
    budgetOptions: [10000, 15000, 25000],
    effectNote: '即効性：高 / 予算比例',
    setupTime: '即効',
  },
  {
    type: 'trial_event' as const,
    name: '体験会開催',
    icon: '🎪',
    desc: '無料・低価格の体験会を定期開催して入会につなげる',
    defaultBudget: 20000,
    budgetOptions: [10000, 20000, 35000],
    effectNote: '入会転換率：最高 / コスト高め',
    setupTime: '翌週から効果',
  },
  {
    type: 'referral' as const,
    name: '口コミ紹介キャンペーン',
    icon: '🤝',
    desc: '既存会員に紹介特典を提供して口コミを促進',
    defaultBudget: 3000,
    budgetOptions: [2000, 3000, 5000],
    effectNote: '質の高い見込み客 / 効果発現：遅め',
    setupTime: '4〜6週後に効果',
  },
  {
    type: 'local_event' as const,
    name: '地域イベント参加',
    icon: '🏘️',
    desc: '地域の文化祭・スポーツイベントでの体験コーナー出展',
    defaultBudget: 10000,
    budgetOptions: [5000, 10000, 20000],
    effectNote: '評判向上：高 / 発現遅め',
    setupTime: '月1〜2回実施',
  },
];

export function MarketingScreen() {
  const { marketingCampaigns, setScreen, addCampaign, toggleCampaign, removeCampaign, company, funnel } = useGameStore();
  const [showAddModal, setShowAddModal] = useState(false);

  const totalWeeklyBudget = marketingCampaigns.filter(c => c.active).reduce((s, c) => s + c.weeklyBudget, 0);

  return (
    <div className="min-h-screen pb-8 bg-gradient-to-br from-slate-900 via-blue-950/30 to-slate-900" style={{ paddingTop: 'var(--topbar-h, 4rem)' }}>
      <div className="max-w-2xl mx-auto px-4">
        <div className="flex items-center gap-2 py-4">
          <button onClick={() => setScreen('classroom')} className="p-2 hover:bg-white/10 rounded-xl shrink-0">
            <ArrowLeft size={18} className="text-slate-400" />
          </button>
          <div className="flex-1 min-w-0">
            <h1 className="text-lg font-bold text-white truncate">集客・マーケティング</h1>
            <div className="text-slate-400 text-xs">週間広告費：{formatCurrency(totalWeeklyBudget)}</div>
          </div>
          <button onClick={() => setShowAddModal(true)} className="btn-primary text-xs px-3 py-2 gap-1 shrink-0">
            <Plus size={13} /> 施策を追加
          </button>
        </div>

        {/* Funnel summary */}
        <div className="card mb-5">
          <div className="flex items-center gap-2 mb-3">
            <TrendingUp size={16} className="text-blue-400" />
            <span className="text-white font-bold">今週の集客効果</span>
          </div>
          <div className="grid grid-cols-3 gap-2">
            <MiniStat label="問い合わせ" value={`${funnel.weeklyInquiries}件`} />
            <MiniStat label="体験参加" value={`${funnel.weeklyTrialAttendance}名`} />
            <MiniStat label="入会見込み" value={`${funnel.weeklyNewMembers}名`} color="text-green-400" />
          </div>
        </div>

        {/* Active campaigns */}
        {marketingCampaigns.length === 0 ? (
          <div className="card text-center py-10 flex flex-col items-center gap-4">
            <div className="text-4xl">📣</div>
            <div>
              <div className="text-white font-bold mb-1">施策がありません</div>
              <div className="text-slate-400 text-sm">集客施策を開始して会員を獲得しましょう</div>
            </div>
            <button onClick={() => setShowAddModal(true)} className="btn-primary">
              <Plus size={14} /> 最初の施策を追加
            </button>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {marketingCampaigns.map(campaign => (
              <CampaignCard
                key={campaign.id}
                campaign={campaign}
                onToggle={() => toggleCampaign(campaign.id)}
                onRemove={() => removeCampaign(campaign.id)}
              />
            ))}
          </div>
        )}

        {/* Marketing tips */}
        <div className="mt-5 p-4 rounded-xl bg-blue-600/10 border border-blue-500/20">
          <div className="flex items-center gap-2 text-blue-300 font-semibold text-sm mb-2">
            <Info size={14} />
            集客のヒント
          </div>
          <ul className="text-blue-200/70 text-xs space-y-1.5 list-disc list-inside">
            <li>広告費を増やしても、クラスの定員が満員なら入会が増えません</li>
            <li>口コミは効果が出るまで時間がかかりますが、入会率が高い優良顧客につながります</li>
            <li>体験会は最も高い転換率ですが、運営コストも高めです</li>
            <li>サービス品質（満足度）が低いと、どれだけ広告を出しても継続率が下がります</li>
          </ul>
        </div>
      </div>

      {showAddModal && (
        <AddCampaignModal
          onAdd={(type, budget) => { addCampaign(type, budget); setShowAddModal(false); }}
          onCancel={() => setShowAddModal(false)}
          existingTypes={marketingCampaigns.map(c => c.type)}
        />
      )}
    </div>
  );
}

function MiniStat({ label, value, color = 'text-white' }: { label: string; value: string; color?: string }) {
  return (
    <div className="bg-white/5 rounded-xl p-2 text-center">
      <div className="text-slate-500 text-xs">{label}</div>
      <div className={`font-bold text-sm ${color}`}>{value}</div>
    </div>
  );
}

function CampaignCard({
  campaign, onToggle, onRemove
}: {
  campaign: MarketingCampaign;
  onToggle: () => void;
  onRemove: () => void;
}) {
  const opt = CAMPAIGN_OPTIONS.find(o => o.type === campaign.type);
  return (
    <div className={`card ${!campaign.active ? 'opacity-60' : ''}`}>
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <span className="text-2xl">{opt?.icon ?? '📣'}</span>
          <div>
            <div className="text-white font-bold text-sm">{campaign.name}</div>
            <div className="text-slate-500 text-xs">{formatCurrency(campaign.weeklyBudget)}/週</div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={onToggle}
            className={`p-2 rounded-xl transition-colors ${campaign.active ? 'bg-amber-500/20 text-amber-400 hover:bg-amber-500/30' : 'bg-green-500/20 text-green-400 hover:bg-green-500/30'}`}
            title={campaign.active ? '一時停止' : '再開'}
          >
            {campaign.active ? <Pause size={14} /> : <Play size={14} />}
          </button>
          <button onClick={onRemove} className="p-2 rounded-xl bg-red-500/15 text-red-400 hover:bg-red-500/25 transition-colors">
            <Trash2 size={14} />
          </button>
        </div>
      </div>
      {opt && (
        <div className="text-xs text-slate-500">{opt.effectNote}</div>
      )}
    </div>
  );
}

function AddCampaignModal({
  onAdd, onCancel, existingTypes
}: {
  onAdd: (type: MarketingCampaign['type'], budget: number) => void;
  onCancel: () => void;
  existingTypes: string[];
}) {
  const [selected, setSelected] = useState<typeof CAMPAIGN_OPTIONS[0] | null>(null);
  const [budget, setBudget] = useState(0);

  const handleSelect = (opt: typeof CAMPAIGN_OPTIONS[0]) => {
    setSelected(opt);
    setBudget(opt.defaultBudget);
  };

  return (
    <div className="fixed inset-0 bg-black/70 z-40 flex items-end sm:items-center justify-center p-4">
      <div className="w-full max-w-md bg-slate-800 rounded-2xl p-5 max-h-[85vh] overflow-y-auto scrollbar-thin border border-white/15">
        <h2 className="text-white font-bold text-lg mb-4">施策を追加</h2>

        {!selected ? (
          <div className="grid grid-cols-1 gap-2">
            {CAMPAIGN_OPTIONS.map(opt => {
              const active = existingTypes.includes(opt.type);
              return (
                <button
                  key={opt.type}
                  onClick={() => !active && handleSelect(opt)}
                  disabled={active}
                  className={`p-3.5 rounded-xl text-left border-2 transition-all
                    ${active ? 'opacity-40 cursor-not-allowed border-transparent bg-white/5' : 'border-white/10 bg-white/5 hover:border-blue-500/50 hover:bg-blue-600/10'}`}
                >
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">{opt.icon}</span>
                    <div>
                      <div className="text-white font-semibold text-sm">{opt.name}</div>
                      <div className="text-slate-400 text-xs">{opt.desc}</div>
                      <div className="text-slate-500 text-xs mt-0.5">週{formatCurrency(opt.defaultBudget)}〜 · {opt.setupTime}</div>
                    </div>
                    {active && <span className="ml-auto text-xs text-slate-500">実施中</span>}
                  </div>
                </button>
              );
            })}
          </div>
        ) : (
          <div>
            <div className="flex items-center gap-3 mb-4 p-3 bg-blue-600/10 rounded-xl">
              <span className="text-2xl">{selected.icon}</span>
              <div>
                <div className="text-white font-bold">{selected.name}</div>
                <div className="text-slate-400 text-xs">{selected.effectNote}</div>
              </div>
            </div>

            <div className="mb-4">
              <label className="block text-sm font-semibold text-slate-300 mb-2">週間予算</label>
              <div className="flex gap-2 mb-2">
                {selected.budgetOptions.map(b => (
                  <button
                    key={b}
                    onClick={() => setBudget(b)}
                    className={`flex-1 py-2 rounded-xl text-sm border-2 transition-all
                      ${budget === b ? 'border-blue-500 bg-blue-600/20 text-white' : 'border-white/10 bg-white/5 text-slate-400 hover:border-white/30'}`}
                  >
                    {formatCurrency(b)}
                  </button>
                ))}
              </div>
              <input
                type="number"
                value={budget}
                min={1000}
                step={1000}
                onChange={e => setBudget(+e.target.value)}
                className="w-full bg-slate-700 border border-white/15 rounded-xl px-3 py-2 text-white focus:outline-none text-sm"
              />
            </div>

            <div className="flex gap-3">
              <button onClick={() => setSelected(null)} className="btn-secondary flex-1 justify-center">戻る</button>
              <button onClick={() => onAdd(selected.type, budget)} className="btn-primary flex-1 justify-center">施策を開始</button>
            </div>
          </div>
        )}

        <button onClick={onCancel} className="w-full mt-3 text-sm text-slate-500 hover:text-slate-300 transition-colors">
          キャンセル
        </button>
      </div>
    </div>
  );
}
