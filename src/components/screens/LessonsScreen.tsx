import { useState, useMemo } from 'react';
import {
  Plus, Edit2, Trash2, Users, Clock, ArrowLeft, AlertTriangle,
  UserCheck, ChevronDown, LayoutList, CalendarDays, Layers,
} from 'lucide-react';
import { useGameStore } from '../../store/gameStore';
import { SERVICE_DEFINITIONS, getAvailableServices } from '../../data/services';
import type { ServiceType, Staff, GameClass } from '../../types/game';
import { formatCurrency, formatHM } from '../../utils/format';

const DAYS = ['月', '火', '水', '木', '金', '土', '日'];
const DURATION_OPTIONS = [30, 45, 60, 90, 120];
const GAP_OPTIONS = [0, 5, 10, 15, 20];
const MINUTE_OPTIONS = [0, 15, 30, 45];

type FilterMode = 'active' | 'paused' | 'all';
type ViewMode = 'type' | 'timetable';

// ============================================================
// Slot generation & conflict checking
// ============================================================
interface GeneratedSlot {
  startH: number;
  startM: number;
  endH: number;
  endM: number;
  label: string;
  conflict: string | null;
}

function generateSlots(
  startH: number, startM: number,
  endH: number, endM: number,
  durationMin: number, gapMin: number,
): GeneratedSlot[] {
  const slots: GeneratedSlot[] = [];
  let cur = startH * 60 + startM;
  const end = endH * 60 + endM;
  while (cur + durationMin <= end) {
    const slotEnd = cur + durationMin;
    slots.push({
      startH: Math.floor(cur / 60),
      startM: cur % 60,
      endH: Math.floor(slotEnd / 60),
      endM: slotEnd % 60,
      label: `${formatHM(Math.floor(cur / 60), cur % 60)}–${formatHM(Math.floor(slotEnd / 60), slotEnd % 60)}`,
      conflict: null,
    });
    cur += durationMin + gapMin;
  }
  return slots;
}

function checkConflict(
  existing: GameClass[],
  day: number,
  startH: number, startM: number,
  endH: number, endM: number,
): string | null {
  const sStart = startH * 60 + startM;
  const sEnd = endH * 60 + endM;
  for (const cls of existing) {
    if (cls.dayOfWeek !== day) continue;
    const cStart = cls.startHour * 60 + (cls.startMinute ?? 0);
    const cEnd = cStart + cls.durationMinutes;
    if (sStart < cEnd && sEnd > cStart) {
      return `${cls.name}（${formatHM(cls.startHour, cls.startMinute ?? 0)}）と重複`;
    }
  }
  return null;
}

// ============================================================
// Main Screen
// ============================================================
export function LessonsScreen() {
  const {
    classes, company, members, selectedPropertyId, properties,
    staff, setScreen, addClass, addClassBatch, updateClass, removeClass,
  } = useGameStore();

  const [viewMode, setViewMode] = useState<ViewMode>('type');
  const [filterMode, setFilterMode] = useState<FilterMode>('all');
  const [showBulkModal, setShowBulkModal] = useState(false);
  const [showSingleModal, setShowSingleModal] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);

  const property = properties.find(p => p.id === selectedPropertyId);
  const availableHours = property?.availableHoursPerWeek ?? 0;
  const activeClasses = classes.filter(c => c.active);
  const usedHours = activeClasses.reduce((s, c) => s + c.durationMinutes / 60, 0);

  const filteredClasses = useMemo(() => {
    if (filterMode === 'active') return classes.filter(c => c.active);
    if (filterMode === 'paused') return classes.filter(c => !c.active);
    return classes;
  }, [classes, filterMode]);

  const availableServices = getAvailableServices(company.phase);

  // Summary stats
  const uniqueTypes = new Set(activeClasses.map(c => c.serviceType)).size;
  const totalCapacity = activeClasses.reduce((s, c) => s + c.capacity, 0);
  const totalEnrolled = members.length;

  const handleSingleSave = (data: ClassFormData) => {
    if (editId) {
      updateClass(editId, {
        name: data.name,
        dayOfWeek: data.dayOfWeek,
        startHour: data.startHour,
        startMinute: data.startMinute,
        durationMinutes: data.durationMinutes,
        capacity: data.capacity,
        monthlyFee: data.monthlyFee,
        trialFee: data.trialFee,
        instructorId: data.instructorId,
      });
      setEditId(null);
    } else {
      addClass({
        propertyId: selectedPropertyId ?? '',
        name: data.name,
        serviceType: data.serviceType,
        targetAgeMin: SERVICE_DEFINITIONS[data.serviceType].targetAgeMin,
        targetAgeMax: SERVICE_DEFINITIONS[data.serviceType].targetAgeMax,
        dayOfWeek: data.dayOfWeek,
        startHour: data.startHour,
        startMinute: data.startMinute,
        durationMinutes: data.durationMinutes,
        capacity: data.capacity,
        monthlyFee: data.monthlyFee,
        trialFee: data.trialFee,
        instructorId: data.instructorId,
        active: true,
      });
      setShowSingleModal(false);
    }
  };

  const openEdit = (id: string) => {
    setEditId(id);
    setShowSingleModal(true);
  };

  const closeModal = () => {
    setShowSingleModal(false);
    setEditId(null);
  };

  return (
    <div className="min-h-screen pb-32 bg-gradient-to-br from-slate-900 via-blue-950/30 to-slate-900"
         style={{ paddingTop: 'var(--topbar-h, 4rem)' }}>
      <div className="max-w-2xl mx-auto px-4">

        {/* Header */}
        <div className="flex items-center gap-3 py-4">
          <button onClick={() => setScreen('classroom')} className="p-2 hover:bg-white/10 rounded-xl transition-colors">
            <ArrowLeft size={18} className="text-slate-400" />
          </button>
          <div>
            <h1 className="text-xl font-bold text-white">クラス管理</h1>
            <div className="text-slate-400 text-xs">週 {usedHours.toFixed(1)}h / {availableHours}h 使用中</div>
          </div>
          <div className="flex-1" />
          {/* View toggle */}
          <div className="flex items-center bg-white/5 rounded-xl p-1 gap-1">
            <button
              onClick={() => setViewMode('type')}
              className={`flex items-center gap-1 px-2 py-1.5 rounded-lg text-xs transition-all ${viewMode === 'type' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-white'}`}
            >
              <Layers size={12} /> 種別
            </button>
            <button
              onClick={() => setViewMode('timetable')}
              className={`flex items-center gap-1 px-2 py-1.5 rounded-lg text-xs transition-all ${viewMode === 'timetable' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-white'}`}
            >
              <CalendarDays size={12} /> 時間割
            </button>
          </div>
        </div>

        {/* Summary bar */}
        <div className="grid grid-cols-4 gap-2 mb-4">
          <SummaryCard label="種別数" value={`${uniqueTypes}`} unit="種" />
          <SummaryCard label="週間コマ" value={`${activeClasses.length}`} unit="コマ" />
          <SummaryCard label="総定員" value={`${totalCapacity}`} unit="名" />
          <SummaryCard label="在籍" value={`${totalEnrolled}`} unit="名" highlight />
        </div>

        {/* Filter */}
        <div className="flex gap-2 mb-4">
          {(['all', 'active', 'paused'] as FilterMode[]).map(f => (
            <button
              key={f}
              onClick={() => setFilterMode(f)}
              className={`px-3 py-1.5 rounded-xl text-xs font-medium transition-all ${filterMode === f ? 'bg-blue-600 text-white' : 'bg-white/5 text-slate-400 hover:bg-white/10'}`}
            >
              {f === 'all' ? 'すべて' : f === 'active' ? '稼働中' : '休止中'}
            </button>
          ))}
        </div>

        {/* Content */}
        {classes.length === 0 ? (
          <EmptyState onAdd={() => setShowSingleModal(true)} onBulk={() => setShowBulkModal(true)} />
        ) : viewMode === 'type' ? (
          <TypeListView
            classes={filteredClasses}
            members={members}
            staff={staff}
            onEdit={openEdit}
            onDelete={removeClass}
            onToggle={(id) => {
              const cls = classes.find(c => c.id === id);
              if (cls) updateClass(id, { active: !cls.active });
            }}
          />
        ) : (
          <TimetableView
            classes={filteredClasses}
            members={members}
            staff={staff}
            onEdit={openEdit}
            onDelete={removeClass}
            onToggle={(id) => {
              const cls = classes.find(c => c.id === id);
              if (cls) updateClass(id, { active: !cls.active });
            }}
          />
        )}
      </div>

      {/* FAB area - fixed above BottomNav */}
      <div className="fixed bottom-16 left-0 right-0 z-30 px-4 pb-3 pt-2 pointer-events-none">
        <div className="max-w-2xl mx-auto flex gap-2 justify-end pointer-events-auto">
          <button
            onClick={() => setShowBulkModal(true)}
            className="flex items-center gap-2 bg-slate-700 hover:bg-slate-600 text-white text-sm font-semibold px-4 py-2.5 rounded-xl shadow-lg transition-all border border-white/10"
          >
            <LayoutList size={15} /> まとめて作成
          </button>
          <button
            onClick={() => setShowSingleModal(true)}
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-500 text-white text-sm font-semibold px-4 py-2.5 rounded-xl shadow-lg transition-all"
          >
            <Plus size={15} /> クラス追加
          </button>
        </div>
      </div>

      {/* Modals */}
      {(showSingleModal || editId) && (
        <SingleClassModal
          services={availableServices}
          staff={staff}
          existingClasses={classes}
          initialData={editId ? getEditData(classes, editId) : undefined}
          onSave={handleSingleSave}
          onCancel={closeModal}
          property={property}
        />
      )}
      {showBulkModal && (
        <BulkCreateModal
          services={availableServices}
          staff={staff}
          existingClasses={classes}
          property={property}
          selectedPropertyId={selectedPropertyId ?? ''}
          onSave={(batch) => {
            addClassBatch(batch);
            setShowBulkModal(false);
          }}
          onCancel={() => setShowBulkModal(false)}
        />
      )}
    </div>
  );
}

// ============================================================
// Summary Card
// ============================================================
function SummaryCard({ label, value, unit, highlight }: {
  label: string; value: string; unit: string; highlight?: boolean;
}) {
  return (
    <div className="bg-white/5 rounded-xl p-2.5 text-center">
      <div className="text-xs text-slate-500 mb-0.5">{label}</div>
      <div className={`font-bold text-sm ${highlight ? 'text-blue-400' : 'text-white'}`}>
        {value}<span className="text-xs font-normal text-slate-500 ml-0.5">{unit}</span>
      </div>
    </div>
  );
}

// ============================================================
// TypeListView - grouped by service type
// ============================================================
function TypeListView({ classes, members, staff, onEdit, onDelete, onToggle }: {
  classes: GameClass[];
  members: any[];
  staff: Staff[];
  onEdit: (id: string) => void;
  onDelete: (id: string) => void;
  onToggle: (id: string) => void;
}) {
  const groups = useMemo(() => {
    const map = new Map<ServiceType, GameClass[]>();
    for (const cls of classes) {
      const arr = map.get(cls.serviceType) ?? [];
      arr.push(cls);
      map.set(cls.serviceType, arr);
    }
    return Array.from(map.entries()).map(([type, list]) => ({ type, list }));
  }, [classes]);

  if (groups.length === 0) {
    return (
      <div className="card text-center py-8 text-slate-500 text-sm">
        該当するクラスがありません
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      {groups.map(({ type, list }) => (
        <ServiceTypeGroup
          key={type}
          serviceType={type}
          classes={list}
          members={members}
          staff={staff}
          onEdit={onEdit}
          onDelete={onDelete}
          onToggle={onToggle}
        />
      ))}
    </div>
  );
}

function ServiceTypeGroup({ serviceType, classes, members, staff, onEdit, onDelete, onToggle }: {
  serviceType: ServiceType;
  classes: GameClass[];
  members: any[];
  staff: Staff[];
  onEdit: (id: string) => void;
  onDelete: (id: string) => void;
  onToggle: (id: string) => void;
}) {
  const [open, setOpen] = useState(true);
  const def = SERVICE_DEFINITIONS[serviceType];
  const activeCount = classes.filter(c => c.active).length;

  return (
    <div className="bg-white/5 rounded-2xl border border-white/10 overflow-hidden">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between px-4 py-3 hover:bg-white/5 transition-colors"
      >
        <div className="flex items-center gap-2 min-w-0">
          <span className="font-bold text-white text-sm">{def?.name ?? serviceType}</span>
          <span className="text-xs text-slate-500 shrink-0">
            {activeCount}/{classes.length}クラス稼働中
          </span>
        </div>
        <ChevronDown size={16} className={`text-slate-400 transition-transform shrink-0 ${open ? 'rotate-180' : ''}`} />
      </button>
      {open && (
        <div className="px-4 pb-4 flex flex-col gap-3">
          {classes.map(cls => {
            const instructor = cls.instructorId && cls.instructorId !== 'owner'
              ? staff.find(s => s.id === cls.instructorId)
              : undefined;
            return (
              <ClassCard
                key={cls.id}
                cls={cls}
                memberCount={members.filter(m => m.classId === cls.id).length}
                instructorName={instructor?.name}
                onEdit={() => onEdit(cls.id)}
                onDelete={() => onDelete(cls.id)}
                onToggle={() => onToggle(cls.id)}
              />
            );
          })}
        </div>
      )}
    </div>
  );
}

// ============================================================
// TimetableView - by day of week
// ============================================================
function TimetableView({ classes, members, staff, onEdit, onDelete, onToggle }: {
  classes: GameClass[];
  members: any[];
  staff: Staff[];
  onEdit: (id: string) => void;
  onDelete: (id: string) => void;
  onToggle: (id: string) => void;
}) {
  const [openDay, setOpenDay] = useState<number | null>(null);

  return (
    <div className="flex flex-col gap-2">
      {DAYS.map((dayName, dayIdx) => {
        const dayClasses = classes
          .filter(c => c.dayOfWeek === dayIdx)
          .sort((a, b) => {
            const at = a.startHour * 60 + (a.startMinute ?? 0);
            const bt = b.startHour * 60 + (b.startMinute ?? 0);
            return at - bt;
          });
        const isOpen = openDay === dayIdx;

        return (
          <div key={dayIdx} className="bg-white/5 rounded-2xl border border-white/10 overflow-hidden">
            <button
              onClick={() => setOpenDay(isOpen ? null : dayIdx)}
              className="w-full flex items-center justify-between px-4 py-3 hover:bg-white/5 transition-colors"
              disabled={dayClasses.length === 0}
            >
              <div className="flex items-center gap-3">
                <span className={`font-bold w-5 text-center ${dayClasses.length > 0 ? 'text-white' : 'text-slate-600'}`}>
                  {dayName}
                </span>
                {dayClasses.length > 0 ? (
                  <div className="flex gap-1 flex-wrap">
                    {dayClasses.map(cls => (
                      <span key={cls.id} className="text-xs bg-blue-600/25 text-blue-300 px-2 py-0.5 rounded-full">
                        {formatHM(cls.startHour, cls.startMinute ?? 0)}
                      </span>
                    ))}
                  </div>
                ) : (
                  <span className="text-xs text-slate-600">開講なし</span>
                )}
              </div>
              {dayClasses.length > 0 && (
                <ChevronDown size={16} className={`text-slate-400 transition-transform shrink-0 ${isOpen ? 'rotate-180' : ''}`} />
              )}
            </button>

            {isOpen && dayClasses.length > 0 && (
              <div className="px-4 pb-4 flex flex-col gap-3">
                {dayClasses.map(cls => {
                  const instructor = cls.instructorId && cls.instructorId !== 'owner'
                    ? staff.find(s => s.id === cls.instructorId)
                    : undefined;
                  return (
                    <ClassCard
                      key={cls.id}
                      cls={cls}
                      memberCount={members.filter(m => m.classId === cls.id).length}
                      instructorName={instructor?.name}
                      onEdit={() => onEdit(cls.id)}
                      onDelete={() => onDelete(cls.id)}
                      onToggle={() => onToggle(cls.id)}
                    />
                  );
                })}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

// ============================================================
// ClassCard
// ============================================================
function ClassCard({ cls, memberCount, instructorName, onEdit, onDelete, onToggle }: {
  cls: GameClass;
  memberCount: number;
  instructorName?: string;
  onEdit: () => void;
  onDelete: () => void;
  onToggle: () => void;
}) {
  const def = SERVICE_DEFINITIONS[cls.serviceType as ServiceType];
  const occupancyRate = cls.capacity > 0 ? memberCount / cls.capacity : 0;
  const isNearFull = occupancyRate > 0.85;
  const endM = (cls.startHour * 60 + (cls.startMinute ?? 0) + cls.durationMinutes);
  const endHour = Math.floor(endM / 60);
  const endMinute = endM % 60;

  return (
    <div className={`bg-white/5 rounded-xl p-3 border border-white/10 ${!cls.active ? 'opacity-60' : ''}`}>
      <div className="flex items-start justify-between mb-2">
        <div className="min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-white font-semibold text-sm">{cls.name}</span>
            {!cls.active && (
              <span className="text-xs text-slate-500 bg-slate-700 px-2 py-0.5 rounded-full">停止中</span>
            )}
          </div>
          <div className="text-slate-500 text-xs mt-0.5 flex items-center gap-1.5 flex-wrap">
            <span className="flex items-center gap-1">
              <Clock size={10} />
              {DAYS[cls.dayOfWeek]}曜 {formatHM(cls.startHour, cls.startMinute ?? 0)}–{formatHM(endHour, endMinute)}
              <span className="text-slate-600">({cls.durationMinutes}分)</span>
            </span>
            {instructorName ? (
              <span className="flex items-center gap-0.5 text-blue-400">
                <UserCheck size={10} /> {instructorName}
              </span>
            ) : (
              <span className="text-amber-400/70">オーナー担当</span>
            )}
          </div>
        </div>
        <div className="flex items-center gap-1 shrink-0">
          <button onClick={onEdit} className="p-1.5 hover:bg-white/10 rounded-lg transition-colors">
            <Edit2 size={13} className="text-slate-400" />
          </button>
          <button onClick={onDelete} className="p-1.5 hover:bg-red-500/20 rounded-lg transition-colors">
            <Trash2 size={13} className="text-red-400" />
          </button>
        </div>
      </div>

      <div className="flex items-center gap-3">
        <div className="flex items-center gap-1 text-xs text-slate-400">
          <Users size={11} />
          <span className={isNearFull ? 'text-amber-400' : ''}>{memberCount}/{cls.capacity}名</span>
          {isNearFull && <AlertTriangle size={10} className="text-amber-400" />}
        </div>
        <div className="text-xs text-slate-500">{formatCurrency(cls.monthlyFee)}/月</div>
        <div className="flex-1 h-1.5 bg-white/10 rounded-full overflow-hidden">
          <div
            className={`h-full rounded-full transition-all ${occupancyRate > 0.85 ? 'bg-amber-500' : 'bg-blue-500'}`}
            style={{ width: `${Math.min(100, occupancyRate * 100)}%` }}
          />
        </div>
        <span className="text-xs text-slate-600">{Math.round(occupancyRate * 100)}%</span>
      </div>

      <button onClick={onToggle} className="mt-2 text-xs text-slate-600 hover:text-slate-400 transition-colors">
        {cls.active ? 'クラスを停止' : 'クラスを再開'}
      </button>
    </div>
  );
}

// ============================================================
// EmptyState
// ============================================================
function EmptyState({ onAdd, onBulk }: { onAdd: () => void; onBulk: () => void }) {
  return (
    <div className="card text-center py-12 flex flex-col items-center gap-4">
      <div className="text-5xl">🤸</div>
      <div>
        <div className="text-white font-bold text-lg mb-1">まだクラスがありません</div>
        <div className="text-slate-400 text-sm">クラスを作成して教室をスタートさせましょう</div>
      </div>
      <div className="flex gap-3">
        <button onClick={onBulk} className="btn-secondary">
          <LayoutList size={15} /> まとめて作成
        </button>
        <button onClick={onAdd} className="btn-primary">
          <Plus size={15} /> 1クラス追加
        </button>
      </div>
    </div>
  );
}

// ============================================================
// ClassFormData (shared between single & bulk)
// ============================================================
interface ClassFormData {
  name: string;
  serviceType: ServiceType;
  dayOfWeek: number;
  startHour: number;
  startMinute: number;
  durationMinutes: number;
  capacity: number;
  monthlyFee: number;
  trialFee: number;
  instructorId: string | null;
}

function getEditData(classes: GameClass[], id: string): ClassFormData | undefined {
  const cls = classes.find(c => c.id === id);
  if (!cls) return undefined;
  return {
    name: cls.name,
    serviceType: cls.serviceType,
    dayOfWeek: cls.dayOfWeek,
    startHour: cls.startHour,
    startMinute: cls.startMinute ?? 0,
    durationMinutes: cls.durationMinutes,
    capacity: cls.capacity,
    monthlyFee: cls.monthlyFee,
    trialFee: cls.trialFee,
    instructorId: cls.instructorId ?? null,
  };
}

// ============================================================
// SingleClassModal
// ============================================================
function SingleClassModal({ services, staff, existingClasses, initialData, onSave, onCancel, property }: {
  services: any[];
  staff: Staff[];
  existingClasses: GameClass[];
  initialData?: ClassFormData;
  onSave: (data: ClassFormData) => void;
  onCancel: () => void;
  property?: any;
}) {
  const [serviceType, setServiceType] = useState<ServiceType>(initialData?.serviceType ?? 'mat_gymnastics');
  const [name, setName] = useState(initialData?.name ?? SERVICE_DEFINITIONS['mat_gymnastics'].name);
  const [dayOfWeek, setDayOfWeek] = useState(initialData?.dayOfWeek ?? 5);
  const [startHour, setStartHour] = useState(initialData?.startHour ?? 10);
  const [startMinute, setStartMinute] = useState(initialData?.startMinute ?? 0);
  const [durationMinutes, setDurationMinutes] = useState(initialData?.durationMinutes ?? 60);
  const [capacity, setCapacity] = useState(initialData?.capacity ?? 8);
  const [monthlyFee, setMonthlyFee] = useState(initialData?.monthlyFee ?? 8000);
  const [trialFee, setTrialFee] = useState(initialData?.trialFee ?? 1000);
  const [instructorId, setInstructorId] = useState<string | null>(initialData?.instructorId ?? null);

  const def = SERVICE_DEFINITIONS[serviceType];
  const hiredInstructors = staff.filter(s => !s.isOwner);

  const hasCeilingIssue = property && def.requiredCeilingHeight > 0 && property.ceilingHeight < def.requiredCeilingHeight;
  const hasAreaIssue = property && def.requiredFloorArea > 0 && property.floorArea < def.requiredFloorArea;
  const hasCapacityIssue = capacity > 20;

  const endTotal = startHour * 60 + startMinute + durationMinutes;
  const endHour = Math.floor(endTotal / 60);
  const endMinute = endTotal % 60;

  // Check time conflict with other classes (not self when editing)
  const othersOnSameDay = existingClasses.filter(
    c => c.dayOfWeek === dayOfWeek && (!initialData || c.id !== existingClasses.find(ec => ec.name === initialData.name && ec.dayOfWeek === initialData.dayOfWeek)?.id)
  );
  const timeConflict = checkConflict(othersOnSameDay, dayOfWeek, startHour, startMinute, endHour, endMinute);

  const canSubmit = !hasCeilingIssue && !hasAreaIssue && !hasCapacityIssue && !timeConflict;

  const handleServiceChange = (type: ServiceType) => {
    setServiceType(type);
    const d = SERVICE_DEFINITIONS[type];
    setName(d.name);
    setMonthlyFee(d.defaultMonthlyFee);
    setTrialFee(d.defaultTrialFee);
    setCapacity(d.defaultCapacity);
    setDurationMinutes(d.defaultDurationMinutes);
  };

  return (
    <div className="fixed inset-0 bg-black/70 z-50 flex items-end sm:items-center justify-center">
      <div className="w-full sm:max-w-md bg-slate-800 rounded-t-2xl sm:rounded-2xl flex flex-col border border-white/15"
           style={{ maxHeight: 'calc(100dvh - var(--topbar-h, 4rem) - 1rem)' }}>

        <div className="px-5 pt-5 pb-3 shrink-0 border-b border-white/10">
          <h2 className="text-white font-bold text-lg">{initialData ? 'クラスを編集' : 'クラスを追加'}</h2>
        </div>

        <div className="overflow-y-auto flex-1 px-5 py-4">
          {!initialData && (
            <div className="mb-4">
              <label className="block text-sm font-semibold text-slate-300 mb-2">クラス種別</label>
              <div className="grid grid-cols-2 gap-2 max-h-44 overflow-y-auto">
                {services.map(s => (
                  <button
                    key={s.type}
                    onClick={() => handleServiceChange(s.type)}
                    className={`p-2.5 rounded-xl text-left text-sm border-2 transition-all ${serviceType === s.type ? 'border-blue-500 bg-blue-600/20 text-white' : 'border-white/10 bg-white/5 text-slate-400 hover:border-white/30'}`}
                  >
                    <div className="font-semibold text-xs">{s.name}</div>
                    <div className="text-slate-500 text-xs">{s.targetAgeMin}〜{s.targetAgeMax}歳</div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {hasCeilingIssue && (
            <div className="flex items-start gap-2 p-3 bg-red-500/15 rounded-xl text-sm text-red-400 mb-3">
              <AlertTriangle size={14} className="mt-0.5 shrink-0" />
              <span>天井高（{property.ceilingHeight}m）が必要な{def.requiredCeilingHeight}mに達しません。</span>
            </div>
          )}
          {hasAreaIssue && (
            <div className="flex items-start gap-2 p-3 bg-red-500/15 rounded-xl text-sm text-red-400 mb-3">
              <AlertTriangle size={14} className="mt-0.5 shrink-0" />
              <span>面積（{property.floorArea}㎡）が不足（必要：{def.requiredFloorArea}㎡）</span>
            </div>
          )}
          {timeConflict && (
            <div className="flex items-start gap-2 p-3 bg-amber-500/15 rounded-xl text-sm text-amber-400 mb-3">
              <AlertTriangle size={14} className="mt-0.5 shrink-0" />
              <span>{timeConflict}</span>
            </div>
          )}

          <div className="mb-4">
            <label className="block text-sm font-semibold text-slate-300 mb-2">クラス名</label>
            <input
              type="text"
              value={name}
              onChange={e => setName(e.target.value)}
              className="w-full bg-white/5 border border-white/15 rounded-xl px-3 py-2.5 text-white focus:outline-none focus:border-blue-400"
            />
          </div>

          <div className="grid grid-cols-2 gap-3 mb-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">曜日</label>
              <select value={dayOfWeek} onChange={e => setDayOfWeek(+e.target.value)}
                className="w-full bg-slate-700 border border-white/15 rounded-xl px-3 py-2.5 text-white focus:outline-none">
                {DAYS.map((d, i) => <option key={i} value={i}>{d}曜日</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">開始時間</label>
              <div className="flex gap-1">
                <select value={startHour} onChange={e => setStartHour(+e.target.value)}
                  className="flex-1 bg-slate-700 border border-white/15 rounded-xl px-2 py-2.5 text-white focus:outline-none text-sm">
                  {Array.from({ length: 15 }, (_, i) => i + 8).map(h => (
                    <option key={h} value={h}>{h}</option>
                  ))}
                </select>
                <select value={startMinute} onChange={e => setStartMinute(+e.target.value)}
                  className="w-16 bg-slate-700 border border-white/15 rounded-xl px-2 py-2.5 text-white focus:outline-none text-sm">
                  {MINUTE_OPTIONS.map(m => (
                    <option key={m} value={m}>{String(m).padStart(2, '0')}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 mb-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">時間</label>
              <select value={durationMinutes} onChange={e => setDurationMinutes(+e.target.value)}
                className="w-full bg-slate-700 border border-white/15 rounded-xl px-3 py-2.5 text-white focus:outline-none">
                {DURATION_OPTIONS.map(m => <option key={m} value={m}>{m}分</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">定員</label>
              <input type="number" min={1} max={20} value={capacity}
                onChange={e => setCapacity(Math.min(20, Math.max(1, +e.target.value)))}
                className="w-full bg-slate-700 border border-white/15 rounded-xl px-3 py-2.5 text-white focus:outline-none" />
              {hasCapacityIssue && <p className="text-red-400 text-xs mt-1">20名以下にしてください</p>}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 mb-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">月謝（円）</label>
              <input type="number" min={1000} step={500} value={monthlyFee}
                onChange={e => setMonthlyFee(+e.target.value)}
                className="w-full bg-slate-700 border border-white/15 rounded-xl px-3 py-2.5 text-white focus:outline-none" />
              <div className="text-xs text-slate-500 mt-1">相場：7,500〜10,000円</div>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">体験料（円）</label>
              <input type="number" min={0} step={100} value={trialFee}
                onChange={e => setTrialFee(+e.target.value)}
                className="w-full bg-slate-700 border border-white/15 rounded-xl px-3 py-2.5 text-white focus:outline-none" />
            </div>
          </div>

          <div className="mb-4">
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">担当講師</label>
            <select value={instructorId ?? 'owner'} onChange={e => setInstructorId(e.target.value === 'owner' ? null : e.target.value)}
              className="w-full bg-slate-700 border border-white/15 rounded-xl px-3 py-2.5 text-white focus:outline-none">
              <option value="owner">オーナー（自分が担当）</option>
              {hiredInstructors.map(s => (
                <option key={s.id} value={s.id}>{s.name}（指導力:{s.teachingAbility}）</option>
              ))}
            </select>
          </div>

          <div className="bg-blue-600/10 border border-blue-500/20 rounded-xl p-3">
            <div className="text-xs text-blue-300 mb-1">月間売上見込み（満員の場合）</div>
            <div className="text-blue-400 font-bold">{formatCurrency(capacity * monthlyFee)}</div>
          </div>
        </div>

        <div className="px-5 py-4 border-t border-white/10 shrink-0">
          <div className="flex gap-3">
            <button onClick={onCancel} className="btn-secondary flex-1 justify-center">キャンセル</button>
            <button
              onClick={() => canSubmit && name.trim() && onSave({ name, serviceType, dayOfWeek, startHour, startMinute, durationMinutes, capacity, monthlyFee, trialFee, instructorId })}
              disabled={!canSubmit || !name.trim()}
              className="btn-primary flex-1 justify-center disabled:opacity-40"
            >
              {initialData ? '更新する' : 'クラスを作成'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ============================================================
// BulkCreateModal
// ============================================================
function BulkCreateModal({ services, staff, existingClasses, property, selectedPropertyId, onSave, onCancel }: {
  services: any[];
  staff: Staff[];
  existingClasses: GameClass[];
  property?: any;
  selectedPropertyId: string;
  onSave: (batch: Omit<GameClass, 'id' | 'enrolledCount'>[]) => void;
  onCancel: () => void;
}) {
  const [serviceType, setServiceType] = useState<ServiceType>(services[0]?.type ?? 'mat_gymnastics');
  const [selectedDays, setSelectedDays] = useState<number[]>([5, 6]); // Sat, Sun
  const [startH, setStartH] = useState(10);
  const [startM, setStartM] = useState(0);
  const [endH, setEndH] = useState(19);
  const [endM, setEndM] = useState(0);
  const [durationMin, setDurationMin] = useState(60);
  const [gapMin, setGapMin] = useState(10);
  const [capacity, setCapacity] = useState(8);
  const [monthlyFee, setMonthlyFee] = useState(8000);
  const [trialFee, setTrialFee] = useState(1000);
  const [instructorId, setInstructorId] = useState<string | null>(null);

  const def = SERVICE_DEFINITIONS[serviceType];
  const hiredInstructors = staff.filter(s => !s.isOwner);

  const handleServiceChange = (type: ServiceType) => {
    setServiceType(type);
    const d = SERVICE_DEFINITIONS[type];
    setMonthlyFee(d.defaultMonthlyFee);
    setTrialFee(d.defaultTrialFee);
    setCapacity(d.defaultCapacity);
    setDurationMin(d.defaultDurationMinutes);
  };

  const toggleDay = (day: number) => {
    setSelectedDays(prev =>
      prev.includes(day) ? prev.filter(d => d !== day) : [...prev, day].sort()
    );
  };

  // Generate slots per day
  const slotsPerDay = useMemo(() => {
    if (endH * 60 + endM <= startH * 60 + startM) return [];
    return generateSlots(startH, startM, endH, endM, durationMin, gapMin);
  }, [startH, startM, endH, endM, durationMin, gapMin]);

  // Check conflicts for each day/slot combination
  const preview = useMemo(() => {
    return selectedDays.map(day => ({
      day,
      slots: slotsPerDay.map(slot => ({
        ...slot,
        conflict: checkConflict(existingClasses, day, slot.startH, slot.startM, slot.endH, slot.endM),
      })),
    }));
  }, [selectedDays, slotsPerDay, existingClasses]);

  const totalSlots = preview.reduce((s, d) => s + d.slots.length, 0);
  const conflictCount = preview.reduce((s, d) => s + d.slots.filter(sl => sl.conflict).length, 0);
  const validSlots = totalSlots - conflictCount;

  const hasCeilingIssue = property && def.requiredCeilingHeight > 0 && property.ceilingHeight < def.requiredCeilingHeight;
  const hasAreaIssue = property && def.requiredFloorArea > 0 && property.floorArea < def.requiredFloorArea;

  const canCreate = validSlots > 0 && selectedDays.length > 0 && !hasCeilingIssue && !hasAreaIssue;

  const handleCreate = () => {
    if (!canCreate) return;
    const batch: Omit<GameClass, 'id' | 'enrolledCount'>[] = [];
    for (const { day, slots } of preview) {
      for (const slot of slots) {
        if (slot.conflict) continue;
        batch.push({
          propertyId: selectedPropertyId,
          name: def.name,
          serviceType,
          targetAgeMin: def.targetAgeMin,
          targetAgeMax: def.targetAgeMax,
          dayOfWeek: day,
          startHour: slot.startH,
          startMinute: slot.startM,
          durationMinutes: durationMin,
          capacity,
          monthlyFee,
          trialFee,
          instructorId,
          active: true,
        });
      }
    }
    onSave(batch);
  };

  return (
    <div className="fixed inset-0 bg-black/70 z-50 flex items-end sm:items-center justify-center">
      <div className="w-full sm:max-w-lg bg-slate-800 rounded-t-2xl sm:rounded-2xl flex flex-col border border-white/15"
           style={{ maxHeight: 'calc(100dvh - var(--topbar-h, 4rem) - 1rem)' }}>

        <div className="px-5 pt-5 pb-3 shrink-0 border-b border-white/10">
          <h2 className="text-white font-bold text-lg">まとめてクラス作成</h2>
          <p className="text-slate-400 text-xs mt-0.5">時間帯を指定して複数のクラスを一括作成します</p>
        </div>

        <div className="overflow-y-auto flex-1 px-5 py-4">
          {/* Service type */}
          <div className="mb-4">
            <label className="block text-sm font-semibold text-slate-300 mb-2">クラス種別</label>
            <div className="grid grid-cols-2 gap-2 max-h-44 overflow-y-auto">
              {services.map(s => (
                <button key={s.type} onClick={() => handleServiceChange(s.type)}
                  className={`p-2.5 rounded-xl text-left text-sm border-2 transition-all ${serviceType === s.type ? 'border-blue-500 bg-blue-600/20 text-white' : 'border-white/10 bg-white/5 text-slate-400 hover:border-white/30'}`}>
                  <div className="font-semibold text-xs">{s.name}</div>
                  <div className="text-slate-500 text-xs">{s.targetAgeMin}〜{s.targetAgeMax}歳</div>
                </button>
              ))}
            </div>
          </div>

          {(hasCeilingIssue || hasAreaIssue) && (
            <div className="flex items-start gap-2 p-3 bg-red-500/15 rounded-xl text-sm text-red-400 mb-3">
              <AlertTriangle size={14} className="mt-0.5 shrink-0" />
              <span>{hasCeilingIssue ? `天井高不足（必要：${def.requiredCeilingHeight}m）` : `面積不足（必要：${def.requiredFloorArea}㎡）`}</span>
            </div>
          )}

          {/* Day selection */}
          <div className="mb-4">
            <label className="block text-sm font-semibold text-slate-300 mb-2">開催曜日</label>
            <div className="flex gap-2">
              {DAYS.map((d, i) => (
                <button key={i} onClick={() => toggleDay(i)}
                  className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all ${selectedDays.includes(i) ? 'bg-blue-600 text-white' : 'bg-white/5 text-slate-500 hover:bg-white/10'}`}>
                  {d}
                </button>
              ))}
            </div>
          </div>

          {/* Time range */}
          <div className="mb-4">
            <label className="block text-sm font-semibold text-slate-300 mb-2">開始〜終了時間帯</label>
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1 bg-slate-700 rounded-xl px-3 py-2 flex-1">
                <select value={startH} onChange={e => setStartH(+e.target.value)}
                  className="bg-transparent text-white focus:outline-none text-sm">
                  {Array.from({ length: 15 }, (_, i) => i + 8).map(h => (
                    <option key={h} value={h}>{h}</option>
                  ))}
                </select>
                <span className="text-slate-500 text-sm">:</span>
                <select value={startM} onChange={e => setStartM(+e.target.value)}
                  className="bg-transparent text-white focus:outline-none text-sm">
                  {MINUTE_OPTIONS.map(m => <option key={m} value={m}>{String(m).padStart(2, '0')}</option>)}
                </select>
              </div>
              <span className="text-slate-500">〜</span>
              <div className="flex items-center gap-1 bg-slate-700 rounded-xl px-3 py-2 flex-1">
                <select value={endH} onChange={e => setEndH(+e.target.value)}
                  className="bg-transparent text-white focus:outline-none text-sm">
                  {Array.from({ length: 15 }, (_, i) => i + 9).map(h => (
                    <option key={h} value={h}>{h}</option>
                  ))}
                </select>
                <span className="text-slate-500 text-sm">:</span>
                <select value={endM} onChange={e => setEndM(+e.target.value)}
                  className="bg-transparent text-white focus:outline-none text-sm">
                  {MINUTE_OPTIONS.map(m => <option key={m} value={m}>{String(m).padStart(2, '0')}</option>)}
                </select>
              </div>
            </div>
          </div>

          {/* Duration + Gap */}
          <div className="grid grid-cols-2 gap-3 mb-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">1コマの時間</label>
              <select value={durationMin} onChange={e => setDurationMin(+e.target.value)}
                className="w-full bg-slate-700 border border-white/15 rounded-xl px-3 py-2.5 text-white focus:outline-none">
                {DURATION_OPTIONS.map(m => <option key={m} value={m}>{m}分</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">コマ間の休憩</label>
              <select value={gapMin} onChange={e => setGapMin(+e.target.value)}
                className="w-full bg-slate-700 border border-white/15 rounded-xl px-3 py-2.5 text-white focus:outline-none">
                {GAP_OPTIONS.map(m => <option key={m} value={m}>{m}分</option>)}
              </select>
            </div>
          </div>

          {/* Capacity & Fees */}
          <div className="grid grid-cols-3 gap-3 mb-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">定員</label>
              <input type="number" min={1} max={20} value={capacity}
                onChange={e => setCapacity(Math.min(20, Math.max(1, +e.target.value)))}
                className="w-full bg-slate-700 border border-white/15 rounded-xl px-3 py-2.5 text-white focus:outline-none" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">月謝（円）</label>
              <input type="number" min={1000} step={500} value={monthlyFee}
                onChange={e => setMonthlyFee(+e.target.value)}
                className="w-full bg-slate-700 border border-white/15 rounded-xl px-3 py-2.5 text-white focus:outline-none" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">体験料（円）</label>
              <input type="number" min={0} step={100} value={trialFee}
                onChange={e => setTrialFee(+e.target.value)}
                className="w-full bg-slate-700 border border-white/15 rounded-xl px-3 py-2.5 text-white focus:outline-none" />
            </div>
          </div>

          {/* Instructor */}
          <div className="mb-4">
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">担当講師</label>
            <select value={instructorId ?? 'owner'} onChange={e => setInstructorId(e.target.value === 'owner' ? null : e.target.value)}
              className="w-full bg-slate-700 border border-white/15 rounded-xl px-3 py-2.5 text-white focus:outline-none">
              <option value="owner">オーナー（自分が担当）</option>
              {hiredInstructors.map(s => (
                <option key={s.id} value={s.id}>{s.name}（指導力:{s.teachingAbility}）</option>
              ))}
            </select>
          </div>

          {/* Preview */}
          <div className="bg-white/5 rounded-xl p-3 border border-white/10">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-semibold text-slate-300">作成プレビュー</span>
              <span className={`text-xs font-bold ${validSlots > 0 ? 'text-green-400' : 'text-slate-500'}`}>
                {validSlots}コマ作成予定
                {conflictCount > 0 && <span className="text-amber-400 ml-1">（{conflictCount}コマ重複スキップ）</span>}
              </span>
            </div>
            {selectedDays.length === 0 ? (
              <p className="text-slate-600 text-xs">曜日を選択してください</p>
            ) : slotsPerDay.length === 0 ? (
              <p className="text-slate-600 text-xs">時間帯設定を確認してください（終了が開始より後）</p>
            ) : (
              <div className="flex flex-col gap-2">
                {preview.map(({ day, slots }) => (
                  <div key={day}>
                    <div className="text-xs text-slate-500 mb-1">{DAYS[day]}曜日</div>
                    <div className="flex flex-wrap gap-1">
                      {slots.map((slot, i) => (
                        <span key={i} className={`text-xs px-2 py-1 rounded-lg ${slot.conflict ? 'bg-amber-500/20 text-amber-400 line-through' : 'bg-blue-600/20 text-blue-300'}`}>
                          {slot.label}
                          {slot.conflict && <span className="ml-1 no-underline not-italic text-amber-500/70">重複</span>}
                        </span>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="px-5 py-4 border-t border-white/10 shrink-0">
          <div className="flex gap-3">
            <button onClick={onCancel} className="btn-secondary flex-1 justify-center">キャンセル</button>
            <button
              onClick={handleCreate}
              disabled={!canCreate}
              className="btn-primary flex-1 justify-center disabled:opacity-40"
            >
              {validSlots}コマを一括作成
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
