import { ArrowLeft, Users, TrendingUp, TrendingDown, Heart } from 'lucide-react';
import { useGameStore } from '../../store/gameStore';
import { formatCurrency } from '../../utils/format';

const AGE_GROUP_LABELS: Record<string, string> = {
  child: '幼児（3-6歳）',
  elementary: '小学生（6-12歳）',
  teen: '中高生（12-18歳）',
  adult: '大人（18-55歳）',
  senior: '高齢者（60歳以上）',
};

export function MembersScreen() {
  const { members, classes, setScreen, funnel } = useGameStore();

  const avgSatisfaction = members.length > 0
    ? Math.round(members.reduce((s, m) => s + m.satisfaction, 0) / members.length)
    : 0;

  const avgContinuation = members.length > 0
    ? Math.round(members.reduce((s, m) => s + m.continuationWill, 0) / members.length)
    : 0;

  const monthlyRevenue = members.reduce((s, m) => s + m.monthlyFee, 0);

  const ageGroups = Object.entries(
    members.reduce((acc, m) => {
      acc[m.ageGroup] = (acc[m.ageGroup] ?? 0) + 1;
      return acc;
    }, {} as Record<string, number>)
  );

  return (
    <div className="min-h-screen pb-8 bg-gradient-to-br from-slate-900 via-blue-950/30 to-slate-900" style={{ paddingTop: 'var(--topbar-h, 4rem)' }}>
      <div className="max-w-2xl mx-auto px-4">
        <div className="flex items-center gap-3 py-4">
          <button onClick={() => setScreen('classroom')} className="p-2 hover:bg-white/10 rounded-xl transition-colors">
            <ArrowLeft size={18} className="text-slate-400" />
          </button>
          <div>
            <h1 className="text-xl font-bold text-white">会員管理</h1>
            <div className="text-slate-400 text-xs">総会員数：{members.length}名</div>
          </div>
        </div>

        {/* Summary stats */}
        <div className="grid grid-cols-2 gap-3 mb-5">
          <StatCard label="月間会費収入" value={formatCurrency(monthlyRevenue)} color="text-green-400" />
          <StatCard label="平均満足度" value={`${avgSatisfaction}%`} color={avgSatisfaction >= 80 ? 'text-green-400' : 'text-amber-400'} />
          <StatCard label="継続意向" value={`${avgContinuation}%`} color={avgContinuation >= 80 ? 'text-blue-400' : 'text-amber-400'} />
          <StatCard label="今週の入会見込み" value={`${funnel.weeklyNewMembers}名`} color="text-purple-400" />
        </div>

        {/* Funnel */}
        <div className="card mb-5">
          <h3 className="text-white font-bold mb-3 flex items-center gap-2"><TrendingUp size={16} />集客ファネル（今週）</h3>
          <div className="flex flex-col gap-1">
            {[
              { label: '認知', value: funnel.weeklyAwareness, color: 'bg-blue-600' },
              { label: 'HP訪問', value: funnel.weeklyWebVisits, color: 'bg-blue-500' },
              { label: '問い合わせ', value: funnel.weeklyInquiries, color: 'bg-violet-500' },
              { label: '体験予約', value: funnel.weeklyTrialBookings, color: 'bg-amber-500' },
              { label: '体験参加', value: funnel.weeklyTrialAttendance, color: 'bg-orange-500' },
              { label: '新規入会', value: funnel.weeklyNewMembers, color: 'bg-green-500' },
            ].map(row => (
              <div key={row.label} className="flex items-center gap-2">
                <div className="w-20 text-xs text-slate-400 text-right">{row.label}</div>
                <div className="flex-1 h-5 bg-white/5 rounded-full overflow-hidden">
                  <div
                    className={`h-full ${row.color} rounded-full transition-all`}
                    style={{ width: `${Math.min(100, (row.value / Math.max(1, funnel.weeklyAwareness)) * 100)}%` }}
                  />
                </div>
                <div className="w-8 text-xs text-slate-300 text-right">{row.value}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Age composition */}
        {ageGroups.length > 0 && (
          <div className="card mb-5">
            <h3 className="text-white font-bold mb-3 flex items-center gap-2"><Users size={16} />会員構成</h3>
            {ageGroups.map(([group, count]) => (
              <div key={group} className="flex items-center gap-3 mb-2">
                <div className="text-slate-400 text-sm w-32">{AGE_GROUP_LABELS[group]}</div>
                <div className="flex-1 h-3 bg-white/5 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-blue-500 rounded-full"
                    style={{ width: `${(count / members.length) * 100}%` }}
                  />
                </div>
                <div className="text-white text-sm w-8 text-right">{count}</div>
              </div>
            ))}
          </div>
        )}

        {/* Member voices */}
        <div className="card mb-5">
          <h3 className="text-white font-bold mb-3 flex items-center gap-2"><Heart size={16} />会員の声</h3>
          {members.length === 0 ? (
            <p className="text-slate-500 text-sm">まだ会員がいません。集客を始めましょう。</p>
          ) : (
            <div className="flex flex-col gap-2">
              {getMemberVoices(members, classes).map((voice, i) => (
                <div key={i} className={`p-3 rounded-xl text-sm ${voice.positive ? 'bg-green-500/10 text-green-300' : 'bg-amber-500/10 text-amber-300'}`}>
                  "{voice.message}"
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Per class breakdown */}
        {classes.length > 0 && (
          <div className="card">
            <h3 className="text-white font-bold mb-3">クラス別会員数</h3>
            {classes.map(cls => {
              const count = members.filter(m => m.classId === cls.id).length;
              const pct = cls.capacity > 0 ? count / cls.capacity : 0;
              return (
                <div key={cls.id} className="flex items-center gap-3 mb-3">
                  <div className="flex-1">
                    <div className="text-white text-sm font-semibold">{cls.name}</div>
                    <div className="h-1.5 bg-white/10 rounded-full mt-1 overflow-hidden">
                      <div
                        className={`h-full rounded-full ${pct > 0.85 ? 'bg-amber-500' : 'bg-blue-500'}`}
                        style={{ width: `${Math.min(100, pct * 100)}%` }}
                      />
                    </div>
                  </div>
                  <div className="text-slate-300 text-sm">{count}/{cls.capacity}</div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

function StatCard({ label, value, color }: { label: string; value: string; color: string }) {
  return (
    <div className="card">
      <div className="text-slate-400 text-xs mb-1">{label}</div>
      <div className={`font-bold text-lg ${color}`}>{value}</div>
    </div>
  );
}

function getMemberVoices(members: any[], classes: any[]): { message: string; positive: boolean }[] {
  const voices: { message: string; positive: boolean }[] = [];
  if (members.length === 0) return voices;

  const avgSat = members.reduce((s, m) => s + m.satisfaction, 0) / members.length;
  const highSat = members.filter(m => m.satisfaction >= 85);
  const lowSat = members.filter(m => m.satisfaction <= 55);
  const nearCapacity = classes.some((c: any) => c.capacity > 0 && c.enrolledCount / c.capacity > 0.85);

  if (highSat.length > 0) {
    voices.push({ message: '子どもが毎週楽しみにしています！先生も丁寧で安心です。', positive: true });
  }
  if (avgSat >= 75) {
    voices.push({ message: '逆上がりが少しずつできるようになってきました。', positive: true });
  }
  if (nearCapacity) {
    voices.push({ message: '土曜のクラスは予約が取りにくいです。増設を希望します！', positive: false });
  }
  if (lowSat.length > 0) {
    voices.push({ message: '料金が高めなので、内容をもっと充実させてほしいです。', positive: false });
  }
  if (voices.length === 0) {
    voices.push({ message: 'まだ特に目立った声はありません。会員数が増えると声が届くようになります。', positive: true });
  }
  return voices.slice(0, 3);
}
