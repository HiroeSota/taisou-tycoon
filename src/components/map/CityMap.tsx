import { useState } from 'react';
import { X, CheckCircle, MapPin, Clock, Ruler, Car, ArrowRight, ChevronDown } from 'lucide-react';
import { useGameStore } from '../../store/gameStore';
import { getPropertiesByArea } from '../../data/properties';
import type { Property } from '../../types/game';
import { formatCurrency } from '../../utils/format';

export function CityMap() {
  const {
    selectedAreaId, selectedPropertyId, ownedPropertyIds,
    selectProperty, openBusiness, setScreen,
    company,
  } = useGameStore();

  const [selectedProp, setSelectedProp] = useState<Property | null>(null);

  const properties = selectedAreaId ? getPropertiesByArea(selectedAreaId) : [];
  const areaNames: Record<string, string> = { kusatsu: '草津', ritto: '栗東', otsu: '大津' };
  const areaName = selectedAreaId ? areaNames[selectedAreaId] : '';

  const handlePropertyClick = (prop: Property) => {
    setSelectedProp(prop);
  };

  const handleContract = (prop: Property) => {
    if (prop.initialCost > company.cash) return;
    selectProperty(prop.id);
    setSelectedProp(null);
    openBusiness();
    setScreen('classroom');
  };

  const isContracted = (id: string) => ownedPropertyIds.includes(id);

  return (
    <div className="flex flex-col bg-gradient-to-br from-slate-900 via-blue-950/50 to-slate-900"
         style={{ height: '100dvh', paddingTop: 'var(--topbar-h, 4rem)' }}>
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 glass border-b border-white/10 shrink-0">
        <div>
          <div className="font-bold text-white text-lg">{areaName} エリアマップ</div>
          <div className="text-slate-400 text-xs">物件をタップして詳細を確認</div>
        </div>
        {ownedPropertyIds.length > 0 && (
          <button onClick={() => setScreen('classroom')} className="btn-success text-sm px-4 py-2">
            教室へ <ArrowRight size={14} />
          </button>
        )}
      </div>

      {/* Map Area — fills remaining space */}
      <div className="flex-1 relative overflow-hidden min-h-0">
        <MapSVG
          areaId={selectedAreaId ?? ''}
          properties={properties}
          selectedId={selectedProp?.id}
          ownedIds={ownedPropertyIds}
          onPropertyClick={handlePropertyClick}
        />

        {/* Hint when no property selected */}
        {!selectedProp && (
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-black/60 text-slate-300 text-xs px-4 py-2 rounded-full whitespace-nowrap pointer-events-none">
            ピンをタップして物件詳細を確認
          </div>
        )}
      </div>

      {/* Property Detail — full-screen overlay (fixed, above BottomNav) */}
      {selectedProp && (
        <PropertyPanel
          property={selectedProp}
          isContracted={isContracted(selectedProp.id)}
          canAfford={company.cash >= selectedProp.initialCost}
          cash={company.cash}
          onContract={handleContract}
          onClose={() => setSelectedProp(null)}
        />
      )}
    </div>
  );
}

// ===== Map SVG =====
function MapSVG({
  areaId, properties, selectedId, ownedIds, onPropertyClick
}: {
  areaId: string;
  properties: Property[];
  selectedId?: string;
  ownedIds: string[];
  onPropertyClick: (p: Property) => void;
}) {
  return (
    <svg
      viewBox="0 0 400 350"
      className="w-full h-full"
      style={{ background: 'linear-gradient(135deg, #0f2744 0%, #0a1628 100%)' }}
    >
      {/* Road network */}
      <g stroke="#1e3a5f" strokeWidth="8" fill="none">
        <line x1="50" y1="175" x2="350" y2="175" />
        <line x1="200" y1="50" x2="200" y2="300" />
        <line x1="100" y1="50" x2="100" y2="300" />
        <line x1="300" y1="50" x2="300" y2="300" />
        <line x1="50" y1="100" x2="350" y2="100" />
        <line x1="50" y1="250" x2="350" y2="250" />
      </g>
      <g stroke="#2d4a6b" strokeWidth="1" strokeDasharray="8,8" fill="none">
        <line x1="50" y1="175" x2="350" y2="175" />
        <line x1="200" y1="50" x2="200" y2="300" />
      </g>

      {CITY_BLOCKS.map((b, i) => (
        <rect key={i} x={b[0]} y={b[1]} width={b[2]} height={b[3]} fill="#0d2035" rx="3" opacity="0.8" />
      ))}
      {BUILDINGS.map((b, i) => (
        <g key={i}>
          <rect x={b[0]} y={b[1]} width={b[2]} height={b[3]} fill="#142236" rx="2" />
          {Array.from({ length: Math.floor(b[3] / 12) }).map((_, j) => (
            <rect key={j} x={b[0] + 3} y={b[1] + 4 + j * 12} width={b[2] - 6} height={5} fill="#1e4060" rx="1" />
          ))}
        </g>
      ))}

      <ellipse cx="160" cy="200" rx="20" ry="15" fill="#0d3520" opacity="0.8" />
      <ellipse cx="280" cy="80" rx="15" ry="12" fill="#0d3520" opacity="0.8" />

      {properties.map(prop => (
        <PropertyMarker
          key={prop.id}
          property={prop}
          isSelected={selectedId === prop.id}
          isOwned={ownedIds.includes(prop.id)}
          onClick={() => onPropertyClick(prop)}
        />
      ))}

      <text x="200" y="330" textAnchor="middle" fill="#334155" fontSize="11" fontWeight="bold">
        {areaId === 'kusatsu' ? '草津市' : areaId === 'ritto' ? '栗東市' : '大津市'}
      </text>
    </svg>
  );
}

const CITY_BLOCKS = [
  [60, 60, 80, 80], [160, 60, 80, 80], [260, 60, 80, 80],
  [60, 160, 80, 80], [160, 160, 80, 80], [260, 160, 80, 80],
  [60, 260, 80, 60], [160, 260, 80, 60], [260, 260, 80, 60],
];
const BUILDINGS = [
  [65, 65, 20, 35], [88, 75, 15, 25], [165, 65, 25, 40], [195, 70, 15, 30],
  [265, 65, 22, 50], [290, 68, 18, 40], [165, 165, 20, 30], [275, 170, 22, 45],
];

function PropertyMarker({
  property, isSelected, isOwned, onClick
}: {
  property: Property;
  isSelected: boolean;
  isOwned: boolean;
  onClick: () => void;
}) {
  const x = property.mapX;
  const y = property.mapY;
  const color = isOwned ? '#22c55e' : isSelected ? '#3b82f6' : '#f59e0b';
  const size = isSelected ? 22 : 18;

  return (
    <>
      {/* Animated pulse ring — rendered OUTSIDE the clickable group so it doesn't
          affect Playwright's stability check for the clickable element */}
      {!isOwned && (
        <circle cx={x} cy={y} r={size + 5} fill="none" stroke={color} strokeWidth="1.5" opacity="0.4" style={{ pointerEvents: 'none' }}>
          <animate attributeName="r" values={`${size + 3};${size + 10};${size + 3}`} dur="2s" repeatCount="indefinite" />
          <animate attributeName="opacity" values="0.4;0;0.4" dur="2s" repeatCount="indefinite" />
        </circle>
      )}

      {/* Clickable group — contains only static elements */}
      <g
        onClick={onClick}
        className="cursor-pointer"
        style={{ userSelect: 'none' }}
        data-property-id={property.id}
        aria-label={property.name}
      >
        {/* Larger transparent hit area for easier tapping */}
        <circle cx={x} cy={y} r={size} fill="transparent" />
        <circle cx={x} cy={y} r={size / 2} fill={color} opacity="0.9" />
        <circle cx={x} cy={y} r={size / 2 - 3} fill="rgba(0,0,0,0.3)" />
        {isOwned
          ? <text x={x} y={y + 4} textAnchor="middle" fill="white" fontSize="9">✓</text>
          : <text x={x} y={y + 4} textAnchor="middle" fill="white" fontSize="9">🏢</text>
        }
        <rect x={x - 32} y={y + 12} width={64} height={14} rx="3" fill="rgba(0,0,0,0.7)" />
        <text x={x} y={y + 22} textAnchor="middle" fill="white" fontSize="8" fontWeight="bold">
          {property.name.length > 9 ? property.name.slice(0, 8) + '…' : property.name}
        </text>
      </g>
    </>
  );
}

// ===== Property Detail Panel =====
// Rendered as a fixed full-screen overlay so it always sits above the BottomNav.
// Structure: backdrop + sliding panel with scrollable body + sticky footer button.
function PropertyPanel({
  property, isContracted, canAfford, cash, onContract, onClose
}: {
  property: Property;
  isContracted: boolean;
  canAfford: boolean;
  cash: number;
  onContract: (p: Property) => void;
  onClose: () => void;
}) {
  const typeLabels: Record<string, string> = {
    rental_hall: 'レンタルホール',
    vacant_store: '空き店舗',
    studio: 'スタジオ',
    community_center: 'コミュニティセンター',
  };

  return (
    <>
      {/* Backdrop — tap to close */}
      <div
        className="fixed inset-0 bg-black/50 z-50"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Panel — fixed at bottom, above BottomNav */}
      <div
        className="fixed inset-x-0 bottom-16 z-50 flex flex-col rounded-t-2xl glass-dark border-t border-white/15"
        style={{ maxHeight: 'calc(100dvh - 120px)' }}
        onClick={e => e.stopPropagation()}
      >
        {/* Drag handle */}
        <div className="flex justify-center pt-2 pb-1 shrink-0">
          <div className="w-10 h-1 bg-white/20 rounded-full" />
        </div>

        {/* Scrollable content */}
        <div className="overflow-y-auto flex-1 px-5 pb-2">
          {/* Header */}
          <div className="flex items-start justify-between mb-4 pt-2">
            <div className="flex-1 min-w-0 pr-3">
              <div className="flex items-center gap-2">
                <MapPin size={16} className="text-amber-400 shrink-0" />
                <span className="font-bold text-white text-lg leading-tight">{property.name}</span>
              </div>
              <div className="text-slate-400 text-sm mt-0.5">
                {typeLabels[property.type]} · {property.address}
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-1.5 hover:bg-white/10 rounded-lg transition-colors shrink-0"
              aria-label="閉じる"
            >
              <X size={18} className="text-slate-400" />
            </button>
          </div>

          {/* Info grid */}
          <div className="grid grid-cols-2 gap-3 mb-4">
            <InfoCard icon={<Ruler size={13} />} label="面積" value={`${property.floorArea}㎡ (${property.usableWidth}m×${property.usableDepth}m)`} />
            <InfoCard icon={<Ruler size={13} />} label="天井高" value={`${property.ceilingHeight}m`} />
            <InfoCard icon={<Coins size={13} />} label="週額賃料" value={formatCurrency(property.weeklyRent)} />
            <InfoCard icon={<Coins size={13} />} label="初期費用" value={property.initialCost === 0 ? '不要' : formatCurrency(property.initialCost)} />
            <InfoCard icon={<Clock size={13} />} label="利用可能時間" value={`週${property.availableHoursPerWeek}時間`} />
            <InfoCard icon={<Car size={13} />} label="駐車場" value={property.parking ? 'あり' : 'なし'} />
          </div>

          {/* Mat compatibility */}
          <div className={`flex items-center gap-2 px-3 py-2 rounded-xl text-sm mb-4 ${property.canFit3x9Mat ? 'bg-green-500/15 text-green-400' : 'bg-red-500/15 text-red-400'}`}>
            {property.canFit3x9Mat
              ? <CheckCircle size={14} className="shrink-0" />
              : <X size={14} className="shrink-0" />
            }
            <span>
              {property.canFit3x9Mat
                ? '3m×9mエアマット設置可能（安全スペース確保済）'
                : '3m×9mエアマット設置不可（面積または天井高が不足）'
              }
            </span>
          </div>

          <p className="text-slate-400 text-sm leading-relaxed mb-4">{property.description}</p>

          {/* Scores */}
          <div className="flex gap-4 mb-4">
            <ScoreBar label="集客力" value={property.attractivenessScore} />
            <ScoreBar label="安定性" value={property.stabilityScore} />
          </div>
        </div>

        {/* Sticky footer — action button always visible */}
        <div className="shrink-0 px-5 py-4 border-t border-white/10">
          {isContracted ? (
            <div className="bg-green-500/20 text-green-400 rounded-xl px-4 py-3 text-center font-semibold">
              ✓ 契約済み
            </div>
          ) : (
            <div className="flex flex-col gap-2">
              {!canAfford && (
                <div className="text-red-400 text-sm text-center">
                  資金不足：{formatCurrency(cash)} / 初期費用 {formatCurrency(property.initialCost)}
                </div>
              )}
              <button
                onClick={() => onContract(property)}
                disabled={!canAfford}
                className="btn-primary justify-center disabled:opacity-40 w-full text-base py-3"
              >
                この物件で開業する
              </button>
              <button
                onClick={onClose}
                className="btn-secondary justify-center w-full"
              >
                <ChevronDown size={14} /> 閉じる
              </button>
            </div>
          )}
        </div>
      </div>
    </>
  );
}

function InfoCard({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="bg-white/5 rounded-xl p-2.5">
      <div className="flex items-center gap-1 text-slate-500 text-xs mb-0.5">{icon} {label}</div>
      <div className="text-white text-sm font-semibold">{value}</div>
    </div>
  );
}

function Coins({ size }: { size: number }) {
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="8" cy="8" r="6"/><path d="M18.09 10.37A6 6 0 1 1 10.34 18"/><path d="M7 6h1v4"/><path d="m16.71 13.88.7.71-2.82 2.82"/></svg>;
}

function ScoreBar({ label, value }: { label: string; value: number }) {
  return (
    <div className="flex-1">
      <div className="text-xs text-slate-400 mb-1">{label}</div>
      <div className="flex gap-1">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className={`flex-1 h-2 rounded-full ${i < value ? 'bg-blue-500' : 'bg-white/10'}`} />
        ))}
      </div>
    </div>
  );
}
