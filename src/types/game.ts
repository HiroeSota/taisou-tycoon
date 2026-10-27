// ============================================================
// Core Game Types
// ============================================================

export type Difficulty = 'easy' | 'normal' | 'hard';
export type AreaId = 'kusatsu' | 'ritto' | 'otsu';
export type PropertyType = 'rental_hall' | 'vacant_store' | 'studio' | 'community_center';
export type ServiceType =
  | 'mat_gymnastics'
  | 'acrobatics'
  | 'personal'
  | 'kids_gymnastics'
  | 'elementary_gymnastics'
  | 'adult_fitness'
  | 'senior_fitness'
  | 'visit_care';

export type MarketingType =
  | 'flyer'
  | 'sns'
  | 'web_ad'
  | 'trial_event'
  | 'referral'
  | 'local_event';

export type StaffRole = 'owner' | 'instructor' | 'assistant';

export type Screen =
  | 'title'
  | 'new_game'
  | 'tutorial'
  | 'map'
  | 'classroom'
  | 'menu_lessons'
  | 'menu_members'
  | 'menu_marketing'
  | 'menu_staff'
  | 'menu_finance'
  | 'menu_strategy'
  | 'menu_missions'
  | 'week_report'
  | 'month_report'
  | 'chapter1_result';

// ============================================================
// Missions
// ============================================================

export type MissionId =
  | 'contract_property'
  | 'create_first_class'
  | 'get_5_members'
  | 'first_monthly_profit'
  | 'three_months_profit'
  | 'chapter1_clear';

export interface Mission {
  id: MissionId;
  stage: 1 | 2 | 3 | 4 | 5;
  title: string;
  description: string;
  targetValue?: number;
  completed: boolean;
  completedWeek?: number;
  notifiedCompleted: boolean;
}

export interface Chapter1Eval {
  consecutiveProfitableMonths: number;
  cashReserveOk: boolean;
  cashReserveMonths: number;
  retentionRateOk: boolean;
  retentionRate: number;
  safetyOk: boolean;
  ownerHoursOk: boolean;
  ownerHoursPerWeek: number;
  hasActiveMembers: boolean;
  cleared: boolean;
  evaluated: boolean;
}

// ============================================================
// Game Date
// ============================================================

export interface GameDate {
  year: number;
  month: number;
  week: number; // 1-4 within month
}

// ============================================================
// Area
// ============================================================

export interface Area {
  id: AreaId;
  name: string;
  population: number;
  demandMultiplier: number;
  competitionLevel: number;
  avgRent: number;
  description: string;
}

// ============================================================
// Property (物件)
// ============================================================

export interface Property {
  id: string;
  areaId: AreaId;
  name: string;
  type: PropertyType;
  address: string;
  floorArea: number;      // ㎡
  usableWidth: number;    // m
  usableDepth: number;    // m
  ceilingHeight: number;  // m
  parking: boolean;
  toilet: boolean;
  storageAllowed: boolean;
  commercialAllowed: boolean;
  weeklyRent: number;     // 円/週
  initialCost: number;    // 敷金礼金等
  availableHoursPerWeek: number;
  stabilityScore: number; // 1-5 継続安定性
  attractivenessScore: number; // 1-5 集客力
  canFit3x9Mat: boolean;  // エアマット適合
  description: string;
  mapX: number;
  mapY: number;
}

// ============================================================
// Class (クラス)
// ============================================================

export interface GameClass {
  id: string;
  propertyId: string;
  name: string;
  serviceType: ServiceType;
  targetAgeMin: number;
  targetAgeMax: number;
  dayOfWeek: number;      // 0=Mon ... 6=Sun
  startHour: number;
  startMinute?: number;   // 0-59, defaults to 0
  durationMinutes: number;
  capacity: number;
  monthlyFee: number;     // 月謝
  trialFee: number;       // 体験料
  instructorId: string | null;
  enrolledCount: number;
  active: boolean;
  batchId?: string;       // groups classes created together
}

// ============================================================
// Member (会員)
// ============================================================

export interface Member {
  id: string;
  classId: string;
  name: string;
  ageGroup: 'child' | 'elementary' | 'teen' | 'adult' | 'senior';
  joinWeek: number;  // absolute week number from game start
  satisfaction: number;  // 0-100
  continuationWill: number; // 0-100
  growthLevel: number; // 0-100
  referralPotential: number; // 0-100
  monthlyFee: number;
}

// ============================================================
// Staff (スタッフ)
// ============================================================

export interface Staff {
  id: string;
  name: string;
  role: StaffRole;
  teachingAbility: number;    // 1-100
  safetyAbility: number;      // 1-100
  communicationAbility: number; // 1-100
  preferredAgeGroups: string[];
  preferredServices: ServiceType[];
  weeklyWage: number;
  availableHoursPerWeek: number;
  usedHoursPerWeek: number;
  motivation: number;         // 0-100
  isOwner: boolean;
}

// ============================================================
// Marketing Campaign
// ============================================================

export interface MarketingCampaign {
  id: string;
  type: MarketingType;
  name: string;
  weeklyBudget: number;
  active: boolean;
  startedWeek: number;
  totalSpent: number;
  impressions: number;
  inquiries: number;
}

// ============================================================
// Competitor (競合)
// ============================================================

export interface Competitor {
  id: string;
  name: string;
  areaId: AreaId;
  strategy: 'price_focused' | 'quality_focused' | 'community_focused';
  monthlyFee: number;
  quality: number;        // 1-100
  brandAwareness: number; // 0-100
  memberCount: number;
  adSpendWeekly: number;
  services: ServiceType[];
  isActive: boolean;
  mapX: number;
  mapY: number;
}

// ============================================================
// Finance
// ============================================================

export interface WeeklyFinancials {
  week: number;
  revenue: {
    tuition: number;
    trialFees: number;
    enrollmentFees: number;
    personal: number;
    events: number;
  };
  expenses: {
    rent: number;
    staffWages: number;
    marketing: number;
    insurance: number;
    supplies: number;
    equipment: number;
    other: number;
  };
  cashIn: number;
  cashOut: number;
  newMembers: number;
  lostMembers: number;
}

export interface MonthlyReport {
  year: number;
  month: number;
  revenue: number;
  expenses: number;
  operatingProfit: number;
  cashBalance: number;
  memberCount: number;
  newMembers: number;
  lostMembers: number;
  retentionRate: number;
  breakEvenPoint: number;
  ownerHoursWorked: number;
  avgSatisfaction: number;
  highlights: string[];
  warnings: string[];
  suggestions: string[];
}

// ============================================================
// Random Event
// ============================================================

export interface GameEvent {
  id: string;
  type: 'good' | 'bad' | 'neutral' | 'choice';
  title: string;
  description: string;
  choices?: EventChoice[];
  autoEffect?: EventEffect;
}

export interface EventChoice {
  label: string;
  description: string;
  effect: EventEffect;
}

export interface EventEffect {
  cash?: number;
  members?: number;
  satisfaction?: number;
  reputation?: number;
  ownerHours?: number;
  message?: string;
}

// ============================================================
// Tutorial Step
// ============================================================

export interface TutorialStep {
  id: string;
  title: string;
  description: string;
  targetScreen?: Screen;
  action?: string;
  completed: boolean;
}

// ============================================================
// Player Company
// ============================================================

export interface PlayerCompany {
  name: string;
  founded: GameDate;
  cash: number;
  reputation: number; // 0-100
  brandAwareness: number; // 0-100 in selected area
  totalRevenue: number;
  totalExpenses: number;
  weeklyHistory: WeeklyFinancials[];
  monthlyReports: MonthlyReport[];
  isIncorporated: boolean;
  phase: 1 | 2 | 3 | 4 | 5 | 6 | 7;
}

// ============================================================
// Marketing Funnel State
// ============================================================

export interface MarketingFunnel {
  weeklyAwareness: number;   // 認知リーチ
  weeklyWebVisits: number;   // HP訪問
  weeklyInquiries: number;   // 問い合わせ
  weeklyTrialBookings: number; // 体験予約
  weeklyTrialAttendance: number; // 体験参加
  weeklyNewMembers: number;  // 入会
}

// ============================================================
// Root Game State
// ============================================================

export interface GameState {
  // Meta
  saveId: string;
  gameVersion: string;
  seed: number;
  weekNumber: number; // absolute weeks from game start
  currentDate: GameDate;
  difficulty: Difficulty;
  tutorialCompleted: boolean;
  tutorialStep: number;

  // Setup
  selectedAreaId: AreaId | null;
  selectedPropertyId: string | null;

  // Entities
  company: PlayerCompany;
  properties: Property[];   // all available props in current area
  ownedPropertyIds: string[];
  classes: GameClass[];
  members: Member[];
  staff: Staff[];
  marketingCampaigns: MarketingCampaign[];
  competitors: Competitor[];

  // Market state
  marketDemand: number; // 0-2 multiplier, seasonal
  seasonalFactor: number;

  // Marketing funnel (latest week)
  funnel: MarketingFunnel;

  // UI State
  currentScreen: Screen;
  pendingEvents: GameEvent[];
  lastWeekReport: WeeklyFinancials | null;
  showWeekReport: boolean;
  autoAdvance: boolean;
  autoAdvanceSpeed: number; // ms between advances
  isAdvancing: boolean;

  // Tutorial
  tutorialSteps: TutorialStep[];

  // Missions & Chapter progress
  missions: Mission[];
  chapter1Eval: Chapter1Eval;
  missionToast: string | null;
  showChapter1Result: boolean;
}
