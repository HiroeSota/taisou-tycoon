import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import type {
  GameState, Difficulty, AreaId, GameClass, Staff,
  MarketingCampaign, GameEvent, EventEffect, Screen, TutorialStep,
  Mission, MissionId, Chapter1Eval, MonthlyReport,
} from '../types/game';
import { PROPERTIES } from '../data/properties';
import { COMPETITORS_TEMPLATE } from '../data/competitors';
import { advanceWeek, generateMonthlyReport } from '../engine/simulation';
import { weekToDate } from '../utils/format';
import { INITIAL_MISSIONS } from '../data/missions';

// ================================================================
// Mission helpers
// ================================================================
function createInitialChapter1Eval(): Chapter1Eval {
  return {
    consecutiveProfitableMonths: 0,
    cashReserveOk: false,
    cashReserveMonths: 0,
    retentionRateOk: false,
    retentionRate: 0,
    safetyOk: true,
    ownerHoursOk: true,
    ownerHoursPerWeek: 0,
    hasActiveMembers: false,
    cleared: false,
    evaluated: false,
  };
}

function completeMission(missions: Mission[], id: MissionId, weekNumber: number): Mission[] {
  return missions.map(m =>
    m.id === id && !m.completed
      ? { ...m, completed: true, completedWeek: weekNumber, notifiedCompleted: false }
      : m
  );
}

function wasJustCompleted(before: Mission[], after: Mission[], id: MissionId): boolean {
  const prev = before.find(m => m.id === id);
  const next = after.find(m => m.id === id);
  return !(prev?.completed) && !!(next?.completed);
}

function computeConsecutiveProfitableMonths(reports: MonthlyReport[]): number {
  let count = 0;
  for (let i = reports.length - 1; i >= 0; i--) {
    if (reports[i].operatingProfit > 0) count++;
    else break;
  }
  return count;
}

function computeOwnerHoursFromClasses(classes: GameClass[]): number {
  return classes
    .filter(c => c.active && (c.instructorId === null || c.instructorId === 'owner'))
    .reduce((s, c) => s + c.durationMinutes / 60, 0);
}

// ================================================================
// Tutorial steps
// ================================================================
const TUTORIAL_STEPS: TutorialStep[] = [
  { id: 'create_business', title: '事業をつくる', description: '事業名・初期資金・難易度を設定してください', targetScreen: 'new_game', action: 'setup_complete', completed: false },
  { id: 'select_area', title: 'エリアを選ぶ', description: '草津・栗東・大津の中から開業エリアを選んでください', targetScreen: 'new_game', action: 'area_selected', completed: false },
  { id: 'select_property', title: '物件を契約する', description: 'マップで物件をクリックして詳細を確認し、契約してください', targetScreen: 'map', action: 'property_selected', completed: false },
  { id: 'create_class', title: 'クラスを作る', description: 'レッスン管理でクラスを1つ作成してください', targetScreen: 'menu_lessons', action: 'class_created', completed: false },
  { id: 'set_price', title: '料金を設定する', description: '月謝と体験料を設定してください', targetScreen: 'menu_lessons', action: 'price_set', completed: false },
  { id: 'start_marketing', title: '体験会を開催する', description: '集客メニューで施策を1つ開始してください', targetScreen: 'menu_marketing', action: 'marketing_started', completed: false },
  { id: 'advance_week', title: '最初の週を進める', description: '「次の週へ」ボタンを押してシミュレーションを進めてください', action: 'week_advanced', completed: false },
  { id: 'check_report', title: '週次レポートを確認する', description: '結果レポートを読んでから次のステップへ進みましょう', action: 'report_checked', completed: false },
  { id: 'first_month', title: '最初の月次レポートを確認する', description: '1ヶ月後、月次レポートで収支を確認してください', action: 'month_checked', completed: false },
];

// ================================================================
// Initial state factory
// ================================================================
function createInitialState(): GameState {
  return {
    saveId: `save_${Date.now()}`,
    gameVersion: '1.0.0',
    seed: Math.floor(Math.random() * 999999),
    weekNumber: 0,
    currentDate: { year: 2027, month: 9, week: 1 },
    difficulty: 'normal',
    tutorialCompleted: false,
    tutorialStep: 0,
    selectedAreaId: null,
    selectedPropertyId: null,
    company: {
      name: '体操教室',
      founded: { year: 2027, month: 9, week: 1 },
      cash: 1200000,
      reputation: 20,
      brandAwareness: 5,
      totalRevenue: 0,
      totalExpenses: 0,
      weeklyHistory: [],
      monthlyReports: [],
      isIncorporated: false,
      phase: 1,
    },
    properties: PROPERTIES,
    ownedPropertyIds: [],
    classes: [],
    members: [],
    staff: [
      {
        id: 'owner',
        name: 'あなた（経営者）',
        role: 'owner',
        teachingAbility: 70,
        safetyAbility: 65,
        communicationAbility: 75,
        preferredAgeGroups: ['child', 'elementary'],
        preferredServices: ['mat_gymnastics', 'acrobatics'],
        weeklyWage: 0,
        availableHoursPerWeek: 40,
        usedHoursPerWeek: 0,
        motivation: 90,
        isOwner: true,
      },
    ],
    marketingCampaigns: [],
    competitors: COMPETITORS_TEMPLATE.map((c, i) => ({ ...c, id: `comp_${i}` })),
    marketDemand: 1.0,
    seasonalFactor: 1.0,
    funnel: {
      weeklyAwareness: 0,
      weeklyWebVisits: 0,
      weeklyInquiries: 0,
      weeklyTrialBookings: 0,
      weeklyTrialAttendance: 0,
      weeklyNewMembers: 0,
    },
    currentScreen: 'title',
    pendingEvents: [],
    lastWeekReport: null,
    showWeekReport: false,
    autoAdvance: false,
    autoAdvanceSpeed: 1500,
    isAdvancing: false,
    tutorialSteps: TUTORIAL_STEPS,
    missions: INITIAL_MISSIONS,
    chapter1Eval: createInitialChapter1Eval(),
    missionToast: null,
    showChapter1Result: false,
  };
}

// ================================================================
// Store Actions
// ================================================================
interface GameActions {
  // Navigation
  setScreen: (screen: Screen) => void;

  // New Game setup
  startNewGame: (name: string, cash: number, difficulty: Difficulty) => void;
  selectArea: (areaId: AreaId) => void;
  selectProperty: (propertyId: string) => void;
  openBusiness: () => void;

  // Gameplay
  advanceWeek: () => void;
  closeWeekReport: () => void;
  applyEventEffect: (event: GameEvent, effectIndex?: number) => void;
  dismissEvent: (eventId: string) => void;
  setAutoAdvance: (enabled: boolean, speed?: number) => void;

  // Classes
  addClass: (cls: Omit<GameClass, 'id' | 'enrolledCount'>) => void;
  addClassBatch: (batch: Omit<GameClass, 'id' | 'enrolledCount'>[]) => void;
  updateClass: (id: string, changes: Partial<GameClass>) => void;
  removeClass: (id: string) => void;

  // Missions
  dismissMissionToast: () => void;
  dismissChapter1Result: () => void;

  // Marketing
  addCampaign: (type: MarketingCampaign['type'], budget: number) => void;
  toggleCampaign: (id: string) => void;
  removeCampaign: (id: string) => void;

  // Staff
  hireStaff: (staff: Omit<Staff, 'id'>) => void;
  fireStaff: (id: string) => void;
  updateStaff: (id: string, changes: Partial<Staff>) => void;

  // Tutorial
  completeTutorialStep: (stepId: string) => void;
  skipTutorial: () => void;

  // Save/Load
  loadSave: (state: GameState) => void;
  resetGame: () => void;
}

// ================================================================
// Store
// ================================================================
export const useGameStore = create<GameState & GameActions>()(
  persist(
    (set, get) => ({
      ...createInitialState(),

      // ---- Navigation ----
      setScreen: (screen) => set({ currentScreen: screen }),

      // ---- New Game Setup ----
      startNewGame: (name, cash, difficulty) => {
        const fresh = createInitialState();
        set({
          ...fresh,
          company: { ...fresh.company, name, cash },
          difficulty,
          currentScreen: 'new_game',
          seed: Math.floor(Math.random() * 999999),
        });
      },

      selectArea: (areaId) => {
        set({ selectedAreaId: areaId });
        get().completeTutorialStep('select_area');
      },

      selectProperty: (propertyId) => {
        const state = get();
        const property = state.properties.find(p => p.id === propertyId);
        if (!property) return;
        const newCash = state.company.cash - property.initialCost;
        const missions = completeMission(state.missions ?? INITIAL_MISSIONS, 'contract_property', state.weekNumber);
        set({
          selectedPropertyId: propertyId,
          ownedPropertyIds: [...state.ownedPropertyIds, propertyId],
          company: { ...state.company, cash: newCash },
          missions,
        });
        get().completeTutorialStep('select_property');
      },

      openBusiness: () => {
        set({ currentScreen: 'classroom' });
      },

      // ---- Advance Week ----
      advanceWeek: () => {
        const state = get();
        if (state.isAdvancing) return;
        // First set: mark advancing so the button disables immediately.
        // React flushes this render before setTimeout fires, which lets
        // Playwright's click() return without waiting for the heavy work.
        set({ isAdvancing: true });

        setTimeout(() => {
          const updates = advanceWeek(state);

          const membersByClass: Record<string, number> = {};
          (updates.members ?? state.members).forEach(m => {
            membersByClass[m.classId] = (membersByClass[m.classId] ?? 0) + 1;
          });
          const syncedClasses = state.classes.map(cls => ({
            ...cls,
            enrolledCount: membersByClass[cls.id] ?? 0,
          }));

          const newDate = updates.currentDate ?? state.currentDate;
          const newWeekNumber = (updates as any).weekNumber ?? state.weekNumber + 1;
          let monthlyReports = state.company.monthlyReports;
          let newMonthlyReport: MonthlyReport | null = null;
          if (newDate.week === 4) {
            const updatedState = { ...state, ...updates, classes: syncedClasses };
            newMonthlyReport = generateMonthlyReport(updatedState as GameState);
            monthlyReports = [...monthlyReports, newMonthlyReport];
          }

          // Tutorial steps
          const steps = state.tutorialSteps.map(s =>
            s.id === 'advance_week' ? { ...s, completed: true } : s
          );
          const nextStep = steps.findIndex(s => !s.completed);

          // Mission checking
          const baseMissions = state.missions ?? INITIAL_MISSIONS;
          let missions = [...baseMissions];
          let missionToast: string | null = null;

          const newMembers = updates.members ?? state.members ?? [];
          if (newMembers.length >= 5) {
            const before = missions;
            missions = completeMission(missions, 'get_5_members', newWeekNumber);
            if (wasJustCompleted(before, missions, 'get_5_members')) {
              missionToast = '🎯 マイルストーン達成：会員5名獲得！';
            }
          }

          if (newMonthlyReport) {
            if (newMonthlyReport.operatingProfit > 0) {
              const before = missions;
              missions = completeMission(missions, 'first_monthly_profit', newWeekNumber);
              if (wasJustCompleted(before, missions, 'first_monthly_profit')) {
                missionToast = '🎯 マイルストーン達成：初めての月次黒字！';
              }

              const consecutive = computeConsecutiveProfitableMonths(monthlyReports);
              if (consecutive >= 3) {
                const before2 = missions;
                missions = completeMission(missions, 'three_months_profit', newWeekNumber);
                if (wasJustCompleted(before2, missions, 'three_months_profit')) {
                  missionToast = '🎯 マイルストーン達成：3ヶ月連続黒字！';
                }
              }
            }
          }

          // Chapter 1 evaluation at weekNumber 59 (2028/3/week4)
          let chapter1Eval = state.chapter1Eval ?? createInitialChapter1Eval();
          let showChapter1Result = state.showChapter1Result ?? false;

          // Date-based trigger: 2028/3/week4 = weekNumber 27 from game epoch
          // Using date comparison so it's robust against save-data weekNumber drift
          if (newDate.year === 2028 && newDate.month === 3 && newDate.week === 4 && !chapter1Eval.evaluated) {
            const lastReport = monthlyReports[monthlyReports.length - 1];
            const consecutive = computeConsecutiveProfitableMonths(monthlyReports);
            const monthlyExpenses = lastReport?.expenses ?? 0;
            const cash = ((updates as any).company ?? state.company).cash;
            const cashReserveMonths = monthlyExpenses > 0 ? cash / monthlyExpenses : 0;
            const retentionRate = lastReport?.retentionRate ?? 0;
            const ownerHours = computeOwnerHoursFromClasses(syncedClasses);

            const cashReserveOk = cashReserveMonths >= 3;
            const retentionRateOk = retentionRate >= 0.7;
            const ownerHoursOk = ownerHours <= 40;
            const hasActiveMembers = newMembers.length >= 5;

            const cleared =
              consecutive >= 3 && cashReserveOk && retentionRateOk &&
              true /* safetyOk */ && ownerHoursOk && hasActiveMembers;

            chapter1Eval = {
              consecutiveProfitableMonths: consecutive,
              cashReserveOk,
              cashReserveMonths,
              retentionRateOk,
              retentionRate,
              safetyOk: true,
              ownerHoursOk,
              ownerHoursPerWeek: ownerHours,
              hasActiveMembers,
              cleared,
              evaluated: true,
            };
            showChapter1Result = true;

            if (cleared) {
              missions = completeMission(missions, 'chapter1_clear', newWeekNumber);
              missionToast = '🏆 チャプター1クリア！おめでとうございます！';
            }
          }

          set({
            ...updates,
            classes: syncedClasses,
            company: {
              ...(updates.company ?? state.company),
              monthlyReports,
            },
            missions,
            chapter1Eval,
            missionToast,
            showChapter1Result,
            tutorialSteps: steps,
            tutorialStep: nextStep === -1 ? steps.length : nextStep,
            isAdvancing: false,
          });
        }, 0);
      },

      closeWeekReport: () => {
        set({ showWeekReport: false });
        get().completeTutorialStep('report_checked');
      },

      applyEventEffect: (event, effectIndex) => {
        const state = get();
        let effect: EventEffect;
        if (event.choices && effectIndex !== undefined) {
          effect = event.choices[effectIndex].effect;
        } else if (event.autoEffect) {
          effect = event.autoEffect;
        } else {
          effect = {};
        }

        const cash = state.company.cash + (effect.cash ?? 0);
        const reputation = Math.min(100, Math.max(0, state.company.reputation + (effect.reputation ?? 0)));

        set({
          company: { ...state.company, cash: Math.max(0, cash), reputation },
          pendingEvents: state.pendingEvents.filter(e => e.id !== event.id),
        });
      },

      dismissEvent: (eventId) => {
        set(state => ({
          pendingEvents: state.pendingEvents.filter(e => e.id !== eventId),
        }));
      },

      setAutoAdvance: (enabled, speed) => {
        set({ autoAdvance: enabled, ...(speed ? { autoAdvanceSpeed: speed } : {}) });
      },

      // ---- Classes ----
      addClass: (cls) => {
        const id = `class_${Date.now()}`;
        set(state => {
          const missions = state.classes.length === 0
            ? completeMission(state.missions ?? INITIAL_MISSIONS, 'create_first_class', state.weekNumber)
            : state.missions;
          return {
            classes: [...state.classes, { ...cls, id, enrolledCount: 0 }],
            missions,
          };
        });
        get().completeTutorialStep('create_class');
        get().completeTutorialStep('price_set');
      },

      addClassBatch: (batch) => {
        const now = Date.now();
        const batchId = `batch_${now}`;
        const newClasses = batch.map((cls, i) => ({
          ...cls,
          id: `class_${now}_${i}`,
          enrolledCount: 0,
          batchId,
        }));
        set(state => {
          const missions = state.classes.length === 0
            ? completeMission(state.missions ?? INITIAL_MISSIONS, 'create_first_class', state.weekNumber)
            : state.missions;
          return {
            classes: [...state.classes, ...newClasses],
            missions,
          };
        });
        get().completeTutorialStep('create_class');
        get().completeTutorialStep('price_set');
      },

      updateClass: (id, changes) => {
        set(state => ({
          classes: state.classes.map(c => c.id === id ? { ...c, ...changes } : c),
        }));
      },

      removeClass: (id) => {
        set(state => ({
          classes: state.classes.filter(c => c.id !== id),
        }));
      },

      // ---- Marketing ----
      addCampaign: (type, budget) => {
        const id = `campaign_${Date.now()}`;
        const names: Record<string, string> = {
          flyer: 'チラシ配布',
          sns: 'SNS投稿',
          web_ad: 'Web広告',
          trial_event: '体験会開催',
          referral: '口コミ紹介キャンペーン',
          local_event: '地域イベント参加',
        };
        const campaign: MarketingCampaign = {
          id,
          type,
          name: names[type] ?? type,
          weeklyBudget: budget,
          active: true,
          startedWeek: get().weekNumber,
          totalSpent: 0,
          impressions: 0,
          inquiries: 0,
        };
        set(state => ({ marketingCampaigns: [...state.marketingCampaigns, campaign] }));
        get().completeTutorialStep('start_marketing');
      },

      toggleCampaign: (id) => {
        set(state => ({
          marketingCampaigns: state.marketingCampaigns.map(c =>
            c.id === id ? { ...c, active: !c.active } : c
          ),
        }));
      },

      removeCampaign: (id) => {
        set(state => ({
          marketingCampaigns: state.marketingCampaigns.filter(c => c.id !== id),
        }));
      },

      // ---- Staff ----
      hireStaff: (staff) => {
        const id = `staff_${Date.now()}`;
        set(state => ({ staff: [...state.staff, { ...staff, id }] }));
      },

      fireStaff: (id) => {
        set(state => ({ staff: state.staff.filter(s => s.id !== id) }));
      },

      updateStaff: (id, changes) => {
        set(state => ({
          staff: state.staff.map(s => s.id === id ? { ...s, ...changes } : s),
        }));
      },

      // ---- Missions ----
      dismissMissionToast: () => set({ missionToast: null }),
      dismissChapter1Result: () => set({ showChapter1Result: false }),

      // ---- Tutorial ----
      completeTutorialStep: (stepId) => {
        set(state => {
          const steps = state.tutorialSteps.map(s =>
            s.id === stepId ? { ...s, completed: true } : s
          );
          const nextStep = steps.findIndex(s => !s.completed);
          return { tutorialSteps: steps, tutorialStep: nextStep === -1 ? steps.length : nextStep };
        });
      },

      skipTutorial: () => {
        set(state => ({
          tutorialCompleted: true,
          tutorialSteps: state.tutorialSteps.map(s => ({ ...s, completed: true })),
        }));
      },

      // ---- Save/Load ----
      loadSave: (savedState) => {
        set(savedState);
      },

      resetGame: () => {
        set(createInitialState());
      },
    }),
    {
      name: 'taisou-tycoon-save',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => {
        const { isAdvancing, ...rest } = state;
        return rest;
      },
    }
  )
);
