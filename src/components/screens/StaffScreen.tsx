import { useState } from 'react';
import { ArrowLeft, UserPlus, Star, Clock, Trash2, TrendingUp, AlertTriangle, Info } from 'lucide-react';
import { useGameStore } from '../../store/gameStore';
import type { Staff } from '../../types/game';
import { formatCurrency } from '../../utils/format';
import { computeOwnerTeachingHours } from '../../engine/simulation';

const STAFF_TEMPLATES: Omit<Staff, 'id'>[] = [
  {
    name: '鈴木 健一',
    role: 'instructor',
    teachingAbility: 75,
    safetyAbility: 80,
    communicationAbility: 65,
    preferredAgeGroups: ['child', 'elementary'],
    preferredServices: ['mat_gymnastics', 'kids_gymnastics'],
    weeklyWage: 25000,
    availableHoursPerWeek: 20,
    usedHoursPerWeek: 0,
    motivation: 80,
    isOwner: false,
  },
  {
    name: '田中 美咲',
    role: 'instructor',
    teachingAbility: 85,
    safetyAbility: 75,
    communicationAbility: 90,
    preferredAgeGroups: ['child', 'adult'],
    preferredServices: ['kids_gymnastics', 'adult_fitness'],
    weeklyWage: 32000,
    availableHoursPerWeek: 30,
    usedHoursPerWeek: 0,
    motivation: 85,
    isOwner: false,
  },
  {
    name: '山田 龍太',
    role: 'instructor',
    teachingAbility: 90,
    safetyAbility: 90,
    communicationAbility: 70,
    preferredAgeGroups: ['elementary', 'teen'],
    preferredServices: ['acrobatics', 'mat_gymnastics'],
    weeklyWage: 38000,
    availableHoursPerWeek: 25,
    usedHoursPerWeek: 0,
    motivation: 75,
    isOwner: false,
  },
  {
    name: '伊藤 花子',
    role: 'assistant',
    teachingAbility: 50,
    safetyAbility: 60,
    communicationAbility: 85,
    preferredAgeGroups: ['child'],
    preferredServices: ['kids_gymnastics'],
    weeklyWage: 12000,
    availableHoursPerWeek: 15,
    usedHoursPerWeek: 0,
    motivation: 90,
    isOwner: false,
  },
];

export function StaffScreen() {
  const { staff, company, classes, members, setScreen, hireStaff, fireStaff } = useGameStore();
  const [showHire, setShowHire] = useState(false);
  const [previewTemplate, setPreviewTemplate] = useState<Omit<Staff, 'id'> | null>(null);

  const totalWeeklyWages = staff.filter(s => !s.isOwner).reduce((s, st) => s + st.weeklyWage, 0);
  const lastWeekCashOut = company.weeklyHistory.slice(-1)[0]?.cashOut ?? 0;
  const totalCapacity = classes.filter(c => c.active).reduce((s, c) => s + c.capacity, 0);
  const monthlyRevenue = members.reduce((s, m) => s + m.monthlyFee, 0);

  // Calculate owner's current teaching hours
  const ownerTeachingHours = computeOwnerTeachingHours({ classes, staff } as any);
  const ownerFreeHours = Math.max(0, 40 - ownerTeachingHours - 5);

  return (
    <div className="min-h-screen pb-8 bg-gradient-to-br from-slate-900 via-blue-950/30 to-slate-900" style={{ paddingTop: 'var(--topbar-h, 4rem)' }}>
      <div className="max-w-2xl mx-auto px-4">
        <div className="flex items-center gap-2 py-4">
          <button onClick={() => setScreen('classroom')} className="p-2 hover:bg-white/10 rounded-xl shrink-0">
            <ArrowLeft size={18} className="text-slate-400" />
          </button>
          <div className="flex-1 min-w-0">
            <h1 className="text-lg font-bold text-white truncate">スタッフ管理</h1>
            <div className="text-slate-400 text-xs">週間人件費：{formatCurrency(totalWeeklyWages)}</div>
          </div>
          {company.phase >= 2 && (
            <button onClick={() => setShowHire(true)} className="btn-primary text-xs px-3 py-2 gap-1 shrink-0">
              <UserPlus size={13} /> 採用
            </button>
          )}
        </div>

        {company.phase < 2 && (
          <div className="p-4 mb-4 bg-amber-500/10 rounded-xl border border-amber-500/20 text-amber-300 text-sm">
            会員数が15名に達するとスタッフの採用が可能になります（現在：{members.length}名）
          </div>
        )}

        {/* Owner time analysis */}
        <div className="card mb-4">
          <div className="flex items-center gap-2 mb-3">
            <Clock size={14} className="text-blue-400" />
            <span className="text-white font-semibold text-sm">オーナーの稼働時間分析</span>
          </div>
          <div className="grid grid-cols-3 gap-2 text-center text-xs">
            <div className="bg-white/5 rounded-xl p-2">
              <div className="text-slate-400 mb-1">指導時間</div>
              <div className="text-white font-bold">{ownerTeachingHours.toFixed(1)}h/週</div>
            </div>
            <div className="bg-white/5 rounded-xl p-2">
              <div className="text-slate-400 mb-1">管理・準備</div>
              <div className="text-white font-bold">5h/週</div>
            </div>
            <div className={`rounded-xl p-2 ${ownerFreeHours > 10 ? 'bg-green-500/10' : ownerFreeHours > 0 ? 'bg-amber-500/10' : 'bg-red-500/10'}`}>
              <div className="text-slate-400 mb-1">余力時間</div>
              <div className={`font-bold ${ownerFreeHours > 10 ? 'text-green-400' : ownerFreeHours > 0 ? 'text-amber-400' : 'text-red-400'}`}>
                {ownerFreeHours.toFixed(1)}h/週
              </div>
            </div>
          </div>
          {ownerFreeHours < 5 && (
            <div className="mt-3 flex items-start gap-2 text-xs text-amber-300 bg-amber-500/10 rounded-xl p-2">
              <AlertTriangle size={12} className="mt-0.5 shrink-0" />
              <span>余力時間が少ないため、集客活動が制限されています。スタッフを採用してオーナーの時間を確保しましょう。</span>
            </div>
          )}
          {ownerFreeHours > 10 && (
            <div className="mt-3 flex items-start gap-2 text-xs text-green-300 bg-green-500/10 rounded-xl p-2">
              <TrendingUp size={12} className="mt-0.5 shrink-0" />
              <span>余力時間が十分あります。この時間が集客・口コミ活動に活用され、問い合わせ増加につながっています。</span>
            </div>
          )}
        </div>

        {/* Staff list */}
        <div className="flex flex-col gap-3">
          {staff.map(member => (
            <StaffCard
              key={member.id}
              staff={member}
              assignedClasses={classes.filter(c => c.instructorId === member.id || (member.isOwner && (!c.instructorId || c.instructorId === 'owner')))}
              onFire={!member.isOwner ? () => fireStaff(member.id) : undefined}
            />
          ))}
        </div>

        {/* Opportunity cost note */}
        <div className="mt-5 p-4 bg-white/5 rounded-xl border border-white/10 text-sm text-slate-400">
          <span className="font-bold text-slate-300">実質コストについて</span><br />
          想定時給1,500円で計算すると、オーナーの週{(ownerTeachingHours + 5).toFixed(1)}時間は
          月<span className="text-amber-400 font-bold">{formatCurrency(Math.round((ownerTeachingHours + 5) * 4 * 1500))}</span>相当です。
          スタッフ採用はこの機会費用と比較して判断してください。
        </div>
      </div>

      {showHire && (
        <HireModal
          templates={STAFF_TEMPLATES}
          onPreview={(t) => { setPreviewTemplate(t); setShowHire(false); }}
          onHire={(template) => { hireStaff(template); setShowHire(false); }}
          onCancel={() => setShowHire(false)}
          cash={company.cash}
          currentWeeklyExpenses={lastWeekCashOut}
          memberCount={members.length}
          totalCapacity={totalCapacity}
          monthlyRevenue={monthlyRevenue}
        />
      )}

      {previewTemplate && (
        <HireDecisionPreview
          template={previewTemplate}
          cash={company.cash}
          memberCount={members.length}
          totalCapacity={totalCapacity}
          monthlyRevenue={monthlyRevenue}
          weeklyFixedCosts={lastWeekCashOut}
          ownerFreeHours={ownerFreeHours}
          onHire={() => { hireStaff(previewTemplate); setPreviewTemplate(null); }}
          onCancel={() => { setPreviewTemplate(null); setShowHire(true); }}
        />
      )}
    </div>
  );
}

function StaffCard({ staff, assignedClasses, onFire }: {
  staff: Staff;
  assignedClasses: any[];
  onFire?: () => void;
}) {
  return (
    <div className="card">
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-blue-600/30 flex items-center justify-center text-blue-400 font-bold text-sm">
            {staff.name.charAt(0)}
          </div>
          <div>
            <div className="text-white font-bold">{staff.name}</div>
            <div className="text-slate-400 text-xs">
              {staff.isOwner ? '経営者（オーナー）' : staff.role === 'instructor' ? '指導員' : 'アシスタント'}
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {!staff.isOwner && (
            <div className="text-right">
              <div className="text-xs text-slate-500">週給</div>
              <div className="text-amber-400 font-bold text-sm">{formatCurrency(staff.weeklyWage)}</div>
            </div>
          )}
          {onFire && (
            <button onClick={onFire} className="p-1.5 hover:bg-red-500/20 rounded-lg transition-colors ml-1">
              <Trash2 size={14} className="text-red-400" />
            </button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-3 gap-2 mb-3">
        <AbilityStat label="指導力" value={staff.teachingAbility} />
        <AbilityStat label="安全管理" value={staff.safetyAbility} />
        <AbilityStat label="コミュ" value={staff.communicationAbility} />
      </div>

      <div className="flex items-center justify-between text-xs text-slate-500">
        <span className="flex items-center gap-1"><Clock size={11} /> 週{staff.availableHoursPerWeek}h</span>
        <span className="flex items-center gap-1"><Star size={11} className="text-amber-400" /> モチベ {staff.motivation}</span>
        {assignedClasses.length > 0 && (
          <span className="text-blue-400">{assignedClasses.length}クラス担当</span>
        )}
      </div>
    </div>
  );
}

function AbilityStat({ label, value }: { label: string; value: number }) {
  const color = value >= 80 ? 'bg-green-500' : value >= 60 ? 'bg-blue-500' : 'bg-amber-500';
  return (
    <div className="bg-white/5 rounded-xl p-2">
      <div className="text-slate-500 text-xs mb-1">{label}</div>
      <div className="flex items-center gap-1.5">
        <div className="flex-1 h-1.5 bg-white/10 rounded-full overflow-hidden">
          <div className={`h-full rounded-full ${color}`} style={{ width: `${value}%` }} />
        </div>
        <span className="text-xs text-white font-bold">{value}</span>
      </div>
    </div>
  );
}

// ===== Hire Modal =====
function HireModal({
  templates, onPreview, onHire, onCancel, cash,
  currentWeeklyExpenses, memberCount, totalCapacity, monthlyRevenue
}: {
  templates: Omit<Staff, 'id'>[];
  onPreview: (t: Omit<Staff, 'id'>) => void;
  onHire: (s: Omit<Staff, 'id'>) => void;
  onCancel: () => void;
  cash: number;
  currentWeeklyExpenses: number;
  memberCount: number;
  totalCapacity: number;
  monthlyRevenue: number;
}) {
  return (
    <div className="fixed inset-0 bg-black/70 z-50 flex items-end sm:items-center justify-center p-4">
      <div className="w-full max-w-md bg-slate-800 rounded-2xl p-5 max-h-[85vh] overflow-y-auto border border-white/15">
        <h2 className="text-white font-bold text-lg mb-2">スタッフを採用する</h2>
        <p className="text-slate-400 text-xs mb-4">
          採用後に担当クラスを設定してください。担当クラスが増えるほど収益ポテンシャルが上がります。
        </p>

        <div className="flex flex-col gap-3">
          {templates.map((t, i) => {
            const monthlyCost = t.weeklyWage * 4;
            const canAfford = cash >= monthlyCost;
            const qualityTag = t.teachingAbility >= 80 ? '高品質指導' : t.teachingAbility >= 70 ? '標準' : '補助重視';
            return (
              <div key={i} className={`p-3.5 rounded-xl border ${canAfford ? 'border-white/10 bg-white/5' : 'border-white/5 bg-white/2 opacity-60'}`}>
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <div className="text-white font-bold">{t.name}</div>
                    <div className="text-slate-400 text-xs">{t.role === 'instructor' ? '指導員' : 'アシスタント'} · {qualityTag}</div>
                  </div>
                  <div className="text-right">
                    <div className="text-amber-400 font-bold text-sm">{formatCurrency(t.weeklyWage)}/週</div>
                    <div className="text-slate-500 text-xs">月{formatCurrency(monthlyCost)}</div>
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-1.5 mb-3">
                  <AbilityStat label="指導" value={t.teachingAbility} />
                  <AbilityStat label="安全" value={t.safetyAbility} />
                  <AbilityStat label="コミュ" value={t.communicationAbility} />
                </div>
                <div className="text-xs text-slate-500 mb-3">
                  週{t.availableHoursPerWeek}h対応可能 · 担当できるクラス数：{Math.floor(t.availableHoursPerWeek / 2)}クラス程度
                </div>
                {canAfford ? (
                  <div className="flex gap-2">
                    <button onClick={() => onPreview(t)} className="btn-secondary flex-1 justify-center text-xs">
                      <Info size={12} /> 詳細を確認
                    </button>
                    <button onClick={() => onHire(t)} className="btn-primary flex-1 justify-center text-xs">
                      採用する
                    </button>
                  </div>
                ) : (
                  <p className="text-red-400 text-xs text-center">資金不足（月給 {formatCurrency(monthlyCost)} 必要）</p>
                )}
              </div>
            );
          })}
        </div>

        <button onClick={onCancel} className="w-full mt-3 text-sm text-slate-500 hover:text-slate-300 transition-colors">
          キャンセル
        </button>
      </div>
    </div>
  );
}

// ===== Decision Preview =====
function HireDecisionPreview({
  template, cash, memberCount, totalCapacity, monthlyRevenue,
  weeklyFixedCosts, ownerFreeHours, onHire, onCancel
}: {
  template: Omit<Staff, 'id'>;
  cash: number;
  memberCount: number;
  totalCapacity: number;
  monthlyRevenue: number;
  weeklyFixedCosts: number;
  ownerFreeHours: number;
  onHire: () => void;
  onCancel: () => void;
}) {
  const monthlyCost = template.weeklyWage * 4;
  const currentMonthlyExpenses = weeklyFixedCosts * 4;
  const newMonthlyExpenses = currentMonthlyExpenses + monthlyCost;

  // Owner free time gained (instructor teaches their classes → owner freed)
  const teachingHoursPerClass = 1.5; // 60min class + 30min prep
  const classesInstructor = Math.floor(template.availableHoursPerWeek / teachingHoursPerClass);
  const ownerHoursFreed = Math.min(ownerFreeHours + classesInstructor * teachingHoursPerClass, 20);

  // Break-even analysis
  const currentBE = monthlyRevenue > 0
    ? Math.ceil(currentMonthlyExpenses / (monthlyRevenue / Math.max(1, memberCount)))
    : 0;
  const newBE = monthlyCost > 0
    ? Math.ceil(newMonthlyExpenses / (monthlyRevenue / Math.max(1, memberCount)))
    : currentBE;

  // How many new members at average fee to cover staff cost?
  const avgFeePerMember = memberCount > 0 ? monthlyRevenue / memberCount : 8000;
  const membersNeededToCover = Math.ceil(monthlyCost / avgFeePerMember);

  // Cash runway
  const currentWeeklyLoss = weeklyFixedCosts - (monthlyRevenue / 4);
  const newWeeklyLoss = (weeklyFixedCosts + template.weeklyWage) - (monthlyRevenue / 4);
  const runwayWeeks = newWeeklyLoss > 0 ? Math.floor(cash / newWeeklyLoss) : 999;

  // Satisfaction benefit estimate
  const satisfactionBenefit = template.teachingAbility >= 80
    ? '会員満足度が継続的に上昇し、退会率が月1〜2%改善する見込み'
    : template.teachingAbility >= 70
    ? '会員満足度は現状維持〜微増。退会率への直接影響は小さい'
    : '指導品質が標準以下のため、満足度改善の効果は限定的';

  return (
    <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-slate-800 rounded-2xl border border-white/15 overflow-hidden">
        <div className="px-5 py-4 bg-gradient-to-r from-blue-900/60 to-slate-800">
          <div className="text-xs text-slate-400 mb-1">採用シミュレーション（予測値）</div>
          <div className="text-white font-bold text-lg">{template.name} を採用する</div>
        </div>

        <div className="p-5 space-y-4 max-h-[65vh] overflow-y-auto">
          {/* Cost impact */}
          <section>
            <div className="text-slate-400 text-xs font-semibold mb-2">コスト影響</div>
            <div className="grid grid-cols-2 gap-2">
              <ImpactRow label="週間追加費用" value={`+${formatCurrency(template.weeklyWage)}`} color="text-red-400" />
              <ImpactRow label="月間追加費用" value={`+${formatCurrency(monthlyCost)}`} color="text-red-400" />
              <ImpactRow label="現在の現金残高" value={formatCurrency(cash)} color="text-white" />
              <ImpactRow label="採用後の資金維持" value={runwayWeeks >= 52 ? '問題なし' : `約${runwayWeeks}週`} color={runwayWeeks < 8 ? 'text-red-400' : runwayWeeks < 16 ? 'text-amber-400' : 'text-green-400'} />
            </div>
          </section>

          {/* Capacity & break-even */}
          <section>
            <div className="text-slate-400 text-xs font-semibold mb-2">クラス・収益ポテンシャル</div>
            <div className="p-3 bg-blue-500/10 rounded-xl text-sm">
              <div className="text-blue-300 font-semibold mb-1">採用すると何ができるか</div>
              <ul className="text-slate-300 text-xs space-y-1 list-disc list-inside">
                <li>この講師が週{template.availableHoursPerWeek}hで担当できるクラス：約{classesInstructor}クラス</li>
                <li>追加クラスによる最大追加定員：約{classesInstructor * 10}〜{classesInstructor * 12}名</li>
                <li>追加定員が埋まった場合の月間追加収益：{formatCurrency(classesInstructor * 10 * avgFeePerMember)}〜{formatCurrency(classesInstructor * 12 * avgFeePerMember)}</li>
              </ul>
            </div>
            <div className="mt-2 p-3 bg-amber-500/10 rounded-xl text-xs text-amber-300">
              人件費を回収するには追加で<span className="font-bold text-white"> {membersNeededToCover}名 </span>の会員が必要（現在{memberCount}名）
            </div>
          </section>

          {/* Owner time */}
          <section>
            <div className="text-slate-400 text-xs font-semibold mb-2">オーナー稼働時間への影響</div>
            <div className="flex items-center gap-3 text-sm">
              <div className="flex-1 text-center p-2 bg-white/5 rounded-xl">
                <div className="text-slate-400 text-xs">現在の余力</div>
                <div className="text-white font-bold">{ownerFreeHours.toFixed(0)}h/週</div>
              </div>
              <div className="text-slate-400">→</div>
              <div className={`flex-1 text-center p-2 rounded-xl ${ownerHoursFreed > ownerFreeHours ? 'bg-green-500/15' : 'bg-white/5'}`}>
                <div className="text-slate-400 text-xs">採用後の余力</div>
                <div className={`font-bold ${ownerHoursFreed > ownerFreeHours ? 'text-green-400' : 'text-white'}`}>
                  {ownerHoursFreed.toFixed(0)}h/週
                </div>
              </div>
            </div>
            {ownerHoursFreed > ownerFreeHours + 5 && (
              <div className="mt-2 text-xs text-green-300/80">
                余力が増えると、集客・口コミ活動への投入時間が増え、問い合わせ数の増加につながります。
              </div>
            )}
          </section>

          {/* Satisfaction */}
          <section>
            <div className="text-slate-400 text-xs font-semibold mb-2">指導品質・会員満足度への影響</div>
            <div className="p-3 bg-white/5 rounded-xl text-xs text-slate-300">
              <div className="font-semibold text-white mb-1">指導力スコア：{template.teachingAbility}/100</div>
              {satisfactionBenefit}
            </div>
          </section>

          {/* Risks */}
          <section>
            <div className="text-slate-400 text-xs font-semibold mb-2">主なリスク</div>
            <ul className="space-y-1 text-xs text-slate-400">
              {runwayWeeks < 12 && <li className="flex gap-1.5 text-red-400"><AlertTriangle size={11} className="mt-0.5 shrink-0" />現在の収益水準では{runwayWeeks}週で資金が底をつく可能性</li>}
              <li className="flex gap-1.5"><Info size={11} className="mt-0.5 shrink-0" />採用後すぐに新しいクラスを設定しないと費用だけ増えます</li>
              <li className="flex gap-1.5"><Info size={11} className="mt-0.5 shrink-0" />講師との相性・スキルの定着には数週間かかります</li>
              <li className="flex gap-1.5"><Info size={11} className="mt-0.5 shrink-0" />これは予測です。実際の結果は需要・季節・競合状況で異なります</li>
            </ul>
          </section>
        </div>

        <div className="px-5 pb-5 flex gap-3">
          <button onClick={onCancel} className="btn-secondary flex-1 justify-center">戻る</button>
          <button onClick={onHire} className="btn-primary flex-1 justify-center">採用する</button>
        </div>
      </div>
    </div>
  );
}

function ImpactRow({ label, value, color }: { label: string; value: string; color: string }) {
  return (
    <div className="bg-white/5 rounded-xl p-2">
      <div className="text-slate-500 text-xs">{label}</div>
      <div className={`font-bold text-sm ${color}`}>{value}</div>
    </div>
  );
}
