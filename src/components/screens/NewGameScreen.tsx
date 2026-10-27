import { useState } from 'react';
import { ArrowRight, ArrowLeft, MapPin, Building2, Coins, Zap } from 'lucide-react';
import { useGameStore } from '../../store/gameStore';
import type { Difficulty, AreaId } from '../../types/game';
import { AREAS } from '../../data/areas';

type Step = 'setup' | 'area' | 'property';

export function NewGameScreen() {
  const [step, setStep] = useState<Step>('setup');
  const [businessName, setBusinessName] = useState('体操教室');
  const [cash, setCash] = useState(1200000);
  const [difficulty, setDifficulty] = useState<Difficulty>('normal');

  const { startNewGame, selectArea, selectedAreaId, setScreen } = useGameStore();

  const handleSetupNext = () => {
    startNewGame(businessName, cash, difficulty);
    setStep('area');
  };

  const handleAreaSelect = (areaId: AreaId) => {
    selectArea(areaId);
    setStep('property');
  };

  const handleGoToMap = () => {
    setScreen('map');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-950 to-slate-900 flex items-center justify-center p-4">
      <div className="w-full max-w-lg">
        {/* Progress indicator */}
        <div className="flex items-center gap-2 mb-8 justify-center">
          {[
            { key: 'setup', label: '事業設定' },
            { key: 'area', label: 'エリア選択' },
            { key: 'property', label: '物件選択' },
          ].map((s, i) => (
            <div key={s.key} className="flex items-center gap-2">
              <div className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-sm font-semibold
                ${step === s.key ? 'bg-blue-600 text-white' :
                  (i < ['setup', 'area', 'property'].indexOf(step)) ? 'bg-green-600/30 text-green-400' : 'bg-white/5 text-slate-500'}`}>
                <span>{i + 1}</span>
                <span className="hidden sm:inline">{s.label}</span>
              </div>
              {i < 2 && <div className="w-4 h-px bg-white/20" />}
            </div>
          ))}
        </div>

        {/* Step content */}
        <div className="card p-6">
          {step === 'setup' && (
            <SetupStep
              businessName={businessName}
              setBusinessName={setBusinessName}
              cash={cash}
              setCash={setCash}
              difficulty={difficulty}
              setDifficulty={setDifficulty}
              onNext={handleSetupNext}
            />
          )}
          {step === 'area' && (
            <AreaStep onSelect={handleAreaSelect} onBack={() => setStep('setup')} />
          )}
          {step === 'property' && (
            <PropertyStep onNext={handleGoToMap} onBack={() => setStep('area')} />
          )}
        </div>
      </div>
    </div>
  );
}

// ---- Setup Step ----
function SetupStep({
  businessName, setBusinessName,
  cash, setCash,
  difficulty, setDifficulty,
  onNext,
}: {
  businessName: string;
  setBusinessName: (v: string) => void;
  cash: number;
  setCash: (v: number) => void;
  difficulty: Difficulty;
  setDifficulty: (v: Difficulty) => void;
  onNext: () => void;
}) {
  const cashOptions = [
    { value: 600000, label: '60万円', note: '少ない（挑戦的）' },
    { value: 1200000, label: '120万円', note: '標準' },
    { value: 2000000, label: '200万円', note: '余裕あり' },
  ];
  const difficultyOptions: { value: Difficulty; label: string; desc: string; color: string }[] = [
    { value: 'easy', label: 'やさしい', desc: '集客しやすく、競合も弱め', color: 'text-green-400' },
    { value: 'normal', label: '標準', desc: '現実に近いバランス', color: 'text-blue-400' },
    { value: 'hard', label: 'リアル', desc: '資金繰りが厳しく、競合も強い', color: 'text-red-400' },
  ];

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h2 className="text-xl font-bold text-white mb-1">あなたの事業をつくる</h2>
        <p className="text-slate-400 text-sm">体操・運動事業の経営者としてのキャリアが始まります</p>
      </div>

      {/* Business Name */}
      <div>
        <label className="block text-sm font-semibold text-slate-300 mb-2">事業名</label>
        <input
          type="text"
          value={businessName}
          onChange={e => setBusinessName(e.target.value)}
          className="w-full bg-white/5 border border-white/15 rounded-xl px-4 py-3 text-white text-lg font-bold focus:outline-none focus:border-blue-400 transition-colors"
          placeholder="例：草津体操スクール"
          maxLength={20}
        />
      </div>

      {/* Initial Cash */}
      <div>
        <label className="block text-sm font-semibold text-slate-300 mb-2 flex items-center gap-1">
          <Coins size={14} />
          初期資金
        </label>
        <div className="grid grid-cols-3 gap-2">
          {cashOptions.map(opt => (
            <button
              key={opt.value}
              onClick={() => setCash(opt.value)}
              className={`p-3 rounded-xl border-2 text-center transition-all
                ${cash === opt.value
                  ? 'border-blue-500 bg-blue-600/20 text-white'
                  : 'border-white/10 bg-white/5 text-slate-400 hover:border-white/30'}`}
            >
              <div className="font-bold text-sm">{opt.label}</div>
              <div className="text-xs mt-0.5 text-slate-500">{opt.note}</div>
            </button>
          ))}
        </div>
      </div>

      {/* Difficulty */}
      <div>
        <label className="block text-sm font-semibold text-slate-300 mb-2 flex items-center gap-1">
          <Zap size={14} />
          難易度
        </label>
        <div className="flex flex-col gap-2">
          {difficultyOptions.map(opt => (
            <button
              key={opt.value}
              onClick={() => setDifficulty(opt.value)}
              className={`flex items-center gap-3 p-3 rounded-xl border-2 text-left transition-all
                ${difficulty === opt.value
                  ? 'border-blue-500 bg-blue-600/15'
                  : 'border-white/10 bg-white/5 hover:border-white/25'}`}
            >
              <span className={`font-bold text-sm w-16 ${opt.color}`}>{opt.label}</span>
              <span className="text-slate-400 text-sm">{opt.desc}</span>
            </button>
          ))}
        </div>
      </div>

      <button onClick={onNext} disabled={!businessName.trim()} className="btn-primary justify-center disabled:opacity-40">
        エリアを選ぶ <ArrowRight size={16} />
      </button>
    </div>
  );
}

// ---- Area Step ----
function AreaStep({ onSelect, onBack }: { onSelect: (a: AreaId) => void; onBack: () => void }) {
  return (
    <div className="flex flex-col gap-5">
      <div>
        <h2 className="text-xl font-bold text-white mb-1">開業エリアを選ぶ</h2>
        <p className="text-slate-400 text-sm">エリアによって人口規模・競合・需要が異なります</p>
      </div>

      <div className="flex flex-col gap-3">
        {AREAS.map(area => (
          <button
            key={area.id}
            onClick={() => onSelect(area.id as AreaId)}
            className="p-4 rounded-xl border border-white/15 bg-white/5 hover:bg-white/10 hover:border-blue-500/50 text-left transition-all group"
          >
            <div className="flex items-start justify-between mb-2">
              <div className="flex items-center gap-2">
                <MapPin size={16} className="text-blue-400" />
                <span className="text-white font-bold text-lg">{area.name}</span>
              </div>
              <div className="text-slate-500 text-xs">人口 {(area.population / 10000).toFixed(0)}万人</div>
            </div>
            <p className="text-slate-400 text-sm leading-relaxed">{area.description}</p>
            <div className="flex gap-4 mt-3 text-xs">
              <AreaStat label="需要" value={area.demandMultiplier} max={2} color="text-blue-400" />
              <AreaStat label="競争" value={area.competitionLevel} max={2} color="text-red-400" />
              <AreaStat label="家賃" value={area.avgRent / 10000} max={2.5} color="text-amber-400" unit="万/週" />
            </div>
          </button>
        ))}
      </div>

      <button onClick={onBack} className="btn-secondary justify-center">
        <ArrowLeft size={15} /> 戻る
      </button>
    </div>
  );
}

function AreaStat({ label, value, max, color, unit = '' }: {
  label: string; value: number; max: number; color: string; unit?: string;
}) {
  const pct = Math.min(100, (value / max) * 100);
  return (
    <div className="flex flex-col gap-1 flex-1">
      <div className={`text-xs ${color} font-semibold`}>{label}</div>
      <div className="h-1.5 bg-white/10 rounded-full overflow-hidden">
        <div className={`h-full rounded-full bg-current ${color}`} style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}

// ---- Property Prompt Step ----
function PropertyStep({ onNext, onBack }: { onNext: () => void; onBack: () => void }) {
  return (
    <div className="flex flex-col gap-5">
      <div>
        <h2 className="text-xl font-bold text-white mb-1">物件を選ぶ</h2>
        <p className="text-slate-400 text-sm">
          マップ上の物件をクリックして詳細を確認し、開業する物件を決めてください
        </p>
      </div>
      <div className="p-4 rounded-xl bg-blue-600/10 border border-blue-500/30 text-sm text-blue-300">
        <div className="font-semibold mb-1 flex items-center gap-1"><Building2 size={14} />物件選択のポイント</div>
        <ul className="space-y-1 text-blue-200/80 list-disc list-inside">
          <li>3m×9mのエアマットは天井高4m以上・面積60㎡以上が必要</li>
          <li>マット保管の可否は毎回の搬入コストに影響する</li>
          <li>週あたり利用可能時間がレッスン数を制限する</li>
        </ul>
      </div>
      <div className="flex gap-3">
        <button onClick={onBack} className="btn-secondary flex-1 justify-center">
          <ArrowLeft size={15} /> 戻る
        </button>
        <button onClick={onNext} className="btn-primary flex-1 justify-center">
          マップへ <ArrowRight size={15} />
        </button>
      </div>
    </div>
  );
}
