import { Play, BookOpen, Settings } from 'lucide-react';
import { useGameStore } from '../../store/gameStore';

export function TitleScreen() {
  const { setScreen, resetGame } = useGameStore();

  const handleNewGame = () => {
    resetGame();
    setScreen('new_game');
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center relative overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0">
        <div className="absolute inset-0 bg-gradient-to-br from-slate-900 via-blue-950 to-slate-900" />
        <CityBackground />
      </div>

      {/* Content */}
      <div className="relative z-10 flex flex-col items-center gap-8 px-4">
        {/* Title */}
        <div className="text-center">
          <div className="text-5xl md:text-7xl font-black text-white tracking-tight text-shadow mb-2">
            体操経営
          </div>
          <div className="text-3xl md:text-5xl font-black text-blue-400 tracking-widest text-shadow">
            TYCOON
          </div>
          <div className="mt-3 text-slate-400 text-sm">
            体操・運動事業の経営シミュレーション
          </div>
        </div>

        {/* Menu */}
        <div className="flex flex-col gap-3 w-full max-w-xs">
          <button
            onClick={handleNewGame}
            className="btn-primary text-lg py-4 w-full justify-center gap-3"
          >
            <Play size={20} />
            新しい事業を始める
          </button>
          <button
            onClick={() => setScreen('map')}
            className="btn-secondary text-base py-3 w-full justify-center gap-2"
          >
            続きから再開
          </button>
          <button
            onClick={() => {}}
            className="btn-secondary text-base py-3 w-full justify-center gap-2"
          >
            <BookOpen size={16} />
            遊び方
          </button>
        </div>

        {/* Footer */}
        <div className="text-slate-600 text-xs text-center">
          <div>ゲーム内の数値・物件・競合はすべてゲーム用の仮定です</div>
          <div>実在する事業・施設の経営状態を表すものではありません</div>
        </div>
      </div>
    </div>
  );
}

function CityBackground() {
  return (
    <svg
      className="absolute bottom-0 left-0 right-0 w-full opacity-20"
      viewBox="0 0 1200 300"
      preserveAspectRatio="xMidYMax slice"
    >
      {/* Mountains / Hills */}
      <ellipse cx="600" cy="350" rx="700" ry="200" fill="#1e3a5f" />
      {/* Buildings silhouettes */}
      {[
        [50, 180, 60, 120], [130, 160, 50, 140], [200, 140, 70, 160],
        [290, 120, 80, 180], [390, 160, 55, 140], [460, 100, 90, 200],
        [570, 130, 65, 170], [650, 80, 100, 220], [770, 110, 70, 190],
        [860, 150, 60, 150], [940, 130, 80, 170], [1040, 160, 65, 140],
        [1120, 140, 70, 160],
      ].map(([x, y, w, h], i) => (
        <rect key={i} x={x} y={y} width={w} height={h} fill="#0f2744" rx="2" />
      ))}
      {/* Windows */}
      {[
        [60, 200], [70, 200], [60, 220], [70, 220],
        [300, 140], [310, 140], [300, 160], [310, 160],
        [465, 120], [475, 120], [465, 140], [475, 140],
        [660, 100], [670, 100], [660, 120], [670, 120],
      ].map(([x, y], i) => (
        <rect key={`w_${i}`} x={x} y={y} width={7} height={7} fill="#fcd34d" opacity="0.6" rx="1" />
      ))}
    </svg>
  );
}
