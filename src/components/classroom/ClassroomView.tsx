import { Users, Star, MapPin, BookOpen, TrendingUp, BarChart2, ShoppingBag, UserPlus, AlertTriangle, ChevronRight, Target } from 'lucide-react';
import { useGameStore } from '../../store/gameStore';
import { formatCurrency } from '../../utils/format';
import { CHAPTER1_GOAL } from '../../data/missions';
import type { Screen } from '../../types/game';

export function ClassroomView() {
  const {
    company, members, classes, staff, selectedPropertyId,
    properties, marketingCampaigns, setScreen,
    missions, weekNumber,
  } = useGameStore();

  const property = properties.find(p => p.id === selectedPropertyId);
  const avgSatisfaction = members.length > 0
    ? Math.round(members.reduce((s, m) => s + m.satisfaction, 0) / members.length)
    : 0;

  const activeClasses = classes.filter(c => c.active);
  const nearlyFullClasses = activeClasses.filter(c => c.capacity > 0 && c.enrolledCount / c.capacity >= 0.85);
  const hasMarketing = marketingCampaigns.some(c => c.active);

  const menuItems: { screen: Screen; icon: React.ReactNode; label: string; badge?: number }[] = [
    { screen: 'menu_lessons', icon: <BookOpen size={20} />, label: 'クラス', badge: classes.length },
    { screen: 'menu_members', icon: <Users size={20} />, label: '会員', badge: members.length },
    { screen: 'menu_marketing', icon: <TrendingUp size={20} />, label: '集客' },
    { screen: 'menu_staff', icon: <UserPlus size={20} />, label: 'スタッフ', badge: staff.length },
    { screen: 'menu_finance', icon: <BarChart2 size={20} />, label: '財務' },
    { screen: 'menu_strategy', icon: <ShoppingBag size={20} />, label: '戦略' },
  ];

  return (
    <div className="min-h-screen pb-8 bg-gradient-to-br from-slate-900 via-blue-950/30 to-slate-900" style={{ paddingTop: 'var(--topbar-h, 4rem)' }}>
      {/* Classroom Visual */}
      <div className="relative mx-auto max-w-3xl px-4 mb-4">
        <ClassroomIllustration
          memberCount={members.length}
          classCount={classes.length}
          hasInstructor={staff.filter(s => !s.isOwner).length > 0}
          hasMat={property?.canFit3x9Mat ?? false}
          propertyName={property?.name}
          nearlyFull={nearlyFullClasses.length > 0}
        />
      </div>

      {/* Capacity warnings */}
      {nearlyFullClasses.length > 0 && (
        <div className="max-w-3xl mx-auto px-4 mb-4">
          <div className="flex items-center gap-2 p-3 bg-amber-500/10 border border-amber-500/30 rounded-xl text-amber-300 text-sm">
            <AlertTriangle size={15} className="shrink-0" />
            <span>
              {nearlyFullClasses.map(c => c.name).join('、')}が定員の85%超です。新しいクラスの追加を検討しましょう。
            </span>
          </div>
        </div>
      )}

      {/* Next Action guidance */}
      <NextAction
        hasClasses={activeClasses.length > 0}
        hasMarketing={hasMarketing}
        memberCount={members.length}
        cash={company.cash}
        onNavigate={setScreen}
      />

      {/* Quick Stats */}
      <div className="max-w-3xl mx-auto px-4 mb-6">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <QuickStat label="手元資金" value={formatCurrency(company.cash)} color={company.cash < 100000 ? 'text-red-400' : 'text-green-400'} />
          <QuickStat label="会員数" value={`${members.length}名`} color="text-blue-400" />
          <QuickStat label="開講クラス" value={`${activeClasses.length}クラス`} color="text-purple-400" />
          <QuickStat label="満足度" value={members.length > 0 ? `${avgSatisfaction}%` : '-'} color={avgSatisfaction >= 80 ? 'text-green-400' : 'text-amber-400'} />
        </div>
      </div>

      {/* Mission Widget */}
      {missions && missions.length > 0 && (
        <div className="max-w-3xl mx-auto px-4 mb-4">
          <MissionWidget missions={missions} weekNumber={weekNumber} onNavigate={() => setScreen('menu_missions')} />
        </div>
      )}

      {/* Navigation Menu */}
      <div className="max-w-3xl mx-auto px-4">
        <div className="grid grid-cols-3 md:grid-cols-6 gap-3">
          {menuItems.map(item => (
            <button
              key={item.screen}
              onClick={() => setScreen(item.screen)}
              className="card flex flex-col items-center gap-2 py-4 hover:bg-white/12 transition-all group cursor-pointer relative"
            >
              <div className="text-blue-400 group-hover:text-blue-300 transition-colors">
                {item.icon}
              </div>
              <span className="text-sm font-semibold text-slate-300 group-hover:text-white transition-colors">
                {item.label}
              </span>
              {item.badge !== undefined && item.badge > 0 && (
                <div className="absolute top-2 right-2 bg-blue-600 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center font-bold">
                  {item.badge}
                </div>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Company info bar */}
      <div className="max-w-3xl mx-auto px-4 mt-6">
        <div className="card flex items-center gap-3">
          <div className="flex-1">
            <div className="font-bold text-white text-lg">{company.name}</div>
            <div className="flex items-center gap-2 text-xs text-slate-400">
              {property && <><MapPin size={11} /> {property.name}</>}
            </div>
          </div>
          <div className="text-right">
            <div className="text-xs text-slate-500">評判</div>
            <div className="flex items-center gap-1">
              <Star size={13} className="text-amber-400" fill="#fbbf24" />
              <span className="text-amber-400 font-bold">{company.reputation}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function QuickStat({ label, value, color }: { label: string; value: string; color: string }) {
  return (
    <div className="card text-center">
      <div className="text-xs text-slate-500 mb-1">{label}</div>
      <div className={`font-bold text-sm ${color}`}>{value}</div>
    </div>
  );
}

// ===== Next Action Guidance =====
function NextAction({
  hasClasses, hasMarketing, memberCount, cash, onNavigate
}: {
  hasClasses: boolean;
  hasMarketing: boolean;
  memberCount: number;
  cash: number;
  onNavigate: (s: Screen) => void;
}) {
  let hint: { text: string; cta: string; screen: Screen; urgent?: boolean } | null = null;

  if (!hasClasses) {
    hint = { text: 'まずクラスを作りましょう。クラスがないと会員を受け入れられません。', cta: 'クラスを作る', screen: 'menu_lessons', urgent: true };
  } else if (!hasMarketing) {
    hint = { text: '集客施策がありません。体験会を開催して見込み客を呼び込みましょう。', cta: '集客施策を設定', screen: 'menu_marketing', urgent: true };
  } else if (cash < 150000) {
    hint = { text: `資金残高が${Math.floor(cash / 10000)}万円を切っています。収支を確認してください。`, cta: '財務を確認', screen: 'menu_finance', urgent: true };
  } else if (memberCount === 0) {
    hint = { text: '集客施策は設定済みです。週を進めて最初の問い合わせを待ちましょう。', cta: '会員状況を確認', screen: 'menu_members' };
  }

  if (!hint) return null;

  return (
    <div className="max-w-3xl mx-auto px-4 mb-4">
      <div className={`flex items-center justify-between gap-3 p-3 rounded-xl border text-sm
        ${hint.urgent
          ? 'bg-blue-600/10 border-blue-500/30 text-blue-200'
          : 'bg-white/5 border-white/10 text-slate-300'
        }`}
      >
        <span className="flex-1">{hint.text}</span>
        <button
          onClick={() => onNavigate(hint!.screen)}
          className={`flex items-center gap-1 text-xs font-semibold whitespace-nowrap px-3 py-1.5 rounded-lg shrink-0
            ${hint.urgent ? 'bg-blue-600/30 text-blue-300 hover:bg-blue-600/50' : 'bg-white/10 text-slate-200 hover:bg-white/20'}`}
        >
          {hint.cta} <ChevronRight size={12} />
        </button>
      </div>
    </div>
  );
}

// ===== Classroom Illustration =====
function ClassroomIllustration({
  memberCount, classCount, hasInstructor, hasMat, propertyName, nearlyFull
}: {
  memberCount: number;
  classCount: number;
  hasInstructor: boolean;
  hasMat: boolean;
  propertyName?: string;
  nearlyFull?: boolean;
}) {
  return (
    <div className={`relative rounded-2xl overflow-hidden border ${nearlyFull ? 'border-amber-500/50' : 'border-white/10'}`} style={{ minHeight: 240 }}>
      <svg viewBox="0 0 700 260" className="w-full" style={{ background: '#0d1f3c' }}>
        {/* Floor */}
        <rect x="0" y="200" width="700" height="60" fill="#0a1628" />
        <line x1="0" y1="200" x2="700" y2="200" stroke="#1e3a5f" strokeWidth="2" />

        {/* Walls */}
        <rect x="30" y="30" width="640" height="175" fill="#0f2744" rx="4" />
        <rect x="30" y="30" width="640" height="10" fill="#1e3a5f" rx="4" />

        {/* Window */}
        <rect x="60" y="55" width="80" height="60" fill="#1e3a5f" rx="3" />
        <line x1="100" y1="55" x2="100" y2="115" stroke="#2d4a6b" strokeWidth="1" />
        <line x1="60" y1="85" x2="140" y2="85" stroke="#2d4a6b" strokeWidth="1" />
        <rect x="65" y="60" width="30" height="23" fill="#1a4a7a" opacity="0.5" rx="1" />
        <rect x="100" y="60" width="30" height="23" fill="#1a4a7a" opacity="0.3" rx="1" />

        {/* Sign */}
        <rect x="280" y="55" width="140" height="30" fill="#1e3a5f" rx="4" />
        <text x="350" y="73" textAnchor="middle" fill="#60a5fa" fontSize="11" fontWeight="bold">
          {propertyName ? propertyName.slice(0, 10) : 'MY STUDIO'}
        </text>

        {/* Mat */}
        {hasMat && (
          <g>
            <rect x="150" y="155" width="270" height="40" rx="4" fill="#1a4060" stroke="#2d6a9f" strokeWidth="1.5" />
            <text x="285" y="179" textAnchor="middle" fill="#60a5fa" fontSize="9">エアマット（3m×9m）</text>
          </g>
        )}
        {!hasMat && (
          <rect x="150" y="165" width="180" height="25" rx="3" fill="#1a3020" stroke="#2d6a40" strokeWidth="1" />
        )}

        {/* Equipment (if has classes) */}
        {classCount > 0 && (
          <g>
            <rect x="550" y="130" width="30" height="60" rx="3" fill="#1a2a40" />
            <rect x="558" y="120" width="14" height="10" rx="2" fill="#2d4a6b" />
            <text x="565" y="210" textAnchor="middle" fill="#334155" fontSize="8">器具</text>
          </g>
        )}

        {/* Instructor */}
        {(classCount > 0) && (
          <Person x={460} y={140} color={hasInstructor ? '#3b82f6' : '#10b981'} label={hasInstructor ? '講師' : '自分'} />
        )}

        {/* Members */}
        {Array.from({ length: Math.min(memberCount, 8) }).map((_, i) => (
          <Person
            key={i}
            x={160 + (i % 4) * 55}
            y={i < 4 ? 145 : 150}
            color="#94a3b8"
            label=""
          />
        ))}
        {memberCount > 8 && (
          <text x="490" y="185" fill="#64748b" fontSize="10">+{memberCount - 8}名</text>
        )}

        {/* No class hint */}
        {classCount === 0 && (
          <text x="350" y="170" textAnchor="middle" fill="#334155" fontSize="13">
            クラスを作成してください
          </text>
        )}
      </svg>
    </div>
  );
}

function Person({ x, y, color, label }: { x: number; y: number; color: string; label: string }) {
  return (
    <g>
      <circle cx={x + 10} cy={y} r={8} fill={color} opacity="0.9" />
      <rect x={x + 2} y={y + 8} width={16} height={20} rx="4" fill={color} opacity="0.8" />
      {label && (
        <text x={x + 10} y={y + 38} textAnchor="middle" fill={color} fontSize="8" opacity="0.8">{label}</text>
      )}
    </g>
  );
}

// ===== Mission Widget =====
function MissionWidget({
  missions, weekNumber, onNavigate
}: {
  missions: any[];
  weekNumber: number;
  onNavigate: () => void;
}) {
  const completed = missions.filter(m => m.completed).length;
  const total = missions.length;
  const pct = total > 0 ? (completed / total) * 100 : 0;
  const weeksLeft = Math.max(0, CHAPTER1_GOAL.evaluationWeekNumber - weekNumber);
  const nextMission = missions.find(m => !m.completed);

  return (
    <button
      onClick={onNavigate}
      className="w-full card flex items-center gap-3 hover:bg-white/12 transition-all text-left group"
    >
      <div className="p-2 bg-blue-600/20 rounded-xl shrink-0">
        <Target size={18} className="text-blue-400" />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between mb-1">
          <span className="text-white font-semibold text-sm">チャプター1 目標</span>
          <span className="text-xs text-slate-500 shrink-0">残り{weeksLeft}週</span>
        </div>
        <div className="h-1.5 bg-white/10 rounded-full overflow-hidden mb-1">
          <div
            className="h-full bg-gradient-to-r from-blue-500 to-purple-500 rounded-full transition-all"
            style={{ width: `${pct}%` }}
          />
        </div>
        <div className="text-xs text-slate-500">
          {nextMission ? `次：${nextMission.title}` : `${completed}/${total}クリア`}
        </div>
      </div>
      <ChevronRight size={14} className="text-slate-600 group-hover:text-slate-400 transition-colors shrink-0" />
    </button>
  );
}
