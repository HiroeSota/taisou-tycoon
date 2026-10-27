import type { GameState, WeeklyFinancials, Member, MarketingFunnel, GameEvent, Competitor, GameClass, Staff } from '../types/game';
import { createRng } from '../utils/seededRandom';
import { RANDOM_EVENTS } from '../data/events';
import { weekToDate } from '../utils/format';
import { SERVICE_DEFINITIONS } from '../data/services';

const MARKETING_PARAMS = {
  flyer:       { costPerWeek: 8000,  impressionPerYen: 0.05, inquiryRate: 0.015, decayWeeks: 2 },
  sns:         { costPerWeek: 5000,  impressionPerYen: 0.12, inquiryRate: 0.025, decayWeeks: 4 },
  web_ad:      { costPerWeek: 15000, impressionPerYen: 0.08, inquiryRate: 0.030, decayWeeks: 0 },
  trial_event: { costPerWeek: 20000, impressionPerYen: 0.10, inquiryRate: 0.080, decayWeeks: 1 },
  referral:    { costPerWeek: 3000,  impressionPerYen: 0.02, inquiryRate: 0.060, decayWeeks: 6 },
  local_event: { costPerWeek: 10000, impressionPerYen: 0.06, inquiryRate: 0.040, decayWeeks: 2 },
};

const DIFFICULTY_MULTIPLIERS = {
  easy:   { demandBonus: 1.3, retention: 1.05, competitorStrength: 0.7, cashFlow: 1.2 },
  normal: { demandBonus: 1.0, retention: 1.00, competitorStrength: 1.0, cashFlow: 1.0 },
  hard:   { demandBonus: 0.7, retention: 0.95, competitorStrength: 1.3, cashFlow: 0.8 },
};

const SEASONAL_FACTORS = [
  // Jan  Feb  Mar  Apr  May  Jun  Jul  Aug  Sep  Oct  Nov  Dec
  0.75, 0.80, 1.10, 1.20, 1.15, 0.90, 0.85, 0.70, 1.30, 1.25, 1.10, 0.80
];

const MEMBER_NAMES = [
  '田中 花子', '山田 太郎', '佐藤 美咲', '伊藤 拓海', '渡辺 さくら',
  '中村 颯', '小林 陽菜', '加藤 悠人', '吉田 りん', '山口 蒼',
  '松本 心結', '井上 湊', '木村 あかり', '林 大翔', '清水 ひより',
];

export function advanceWeek(state: GameState): Partial<GameState> {
  const rng = createRng(state.seed + state.weekNumber * 1337);
  const diff = DIFFICULTY_MULTIPLIERS[state.difficulty];
  const newWeekNumber = state.weekNumber + 1;
  const newDate = weekToDate(newWeekNumber);
  const seasonal = SEASONAL_FACTORS[newDate.month - 1] ?? 1.0;

  // ---- Determine area demand ----
  const area = getAreaMultiplier(state.selectedAreaId);
  const baseInquiryPerWeek = 8 * area * seasonal * diff.demandBonus;

  // ---- Marketing funnel ----
  const funnel = computeFunnel(state, baseInquiryPerWeek, rng, diff.demandBonus);

  // ---- Member changes ----
  const { newMembers, lostMembers, updatedMembers } = computeMemberChanges(
    state, funnel, newWeekNumber, rng, diff.retention
  );

  const allMembers = [...updatedMembers, ...newMembers];

  // ---- Revenue ----
  const isMonthStart = newDate.week === 1;
  let tuitionRevenue = 0;
  if (isMonthStart) {
    // 月謝は月初に計上（二重計上防止）
    tuitionRevenue = allMembers.reduce((sum, m) => sum + m.monthlyFee, 0);
  }
  const trialRevenue = funnel.weeklyTrialAttendance * getAvgTrialFee(state);
  const enrollmentRevenue = newMembers.length * 5000; // 入会金

  // ---- Expenses ----
  const rentExpense = computeRent(state);
  const staffExpense = computeStaffWages(state);
  const marketingExpense = computeMarketingExpense(state);
  const insuranceExpense = Math.round(3000 / 4); // 週あたり保険料
  const suppliesExpense = allMembers.length * 100;

  const cashIn = tuitionRevenue + trialRevenue + enrollmentRevenue;
  const cashOut = rentExpense + staffExpense + marketingExpense + insuranceExpense + suppliesExpense;

  const weeklyFinancials: WeeklyFinancials = {
    week: newWeekNumber,
    revenue: {
      tuition: tuitionRevenue,
      trialFees: trialRevenue,
      enrollmentFees: enrollmentRevenue,
      personal: 0,
      events: 0,
    },
    expenses: {
      rent: rentExpense,
      staffWages: staffExpense,
      marketing: marketingExpense,
      insurance: insuranceExpense,
      supplies: suppliesExpense,
      equipment: 0,
      other: 0,
    },
    cashIn,
    cashOut,
    newMembers: newMembers.length,
    lostMembers: lostMembers,
  };

  const newCash = state.company.cash + cashIn - cashOut;

  // ---- Competitor AI ----
  const updatedCompetitors = updateCompetitors(state.competitors, rng, seasonal);

  // ---- Random Events ----
  const pendingEvents = generateEvents(state, rng, newWeekNumber);

  // ---- Phase check ----
  const newPhase = determinePhase(allMembers.length, newCash, state.company.phase);

  const newCompany = {
    ...state.company,
    cash: Math.max(0, newCash),
    totalRevenue: state.company.totalRevenue + cashIn,
    totalExpenses: state.company.totalExpenses + cashOut,
    weeklyHistory: [...state.company.weeklyHistory, weeklyFinancials].slice(-52),
    phase: newPhase,
  };

  return {
    weekNumber: newWeekNumber,
    currentDate: newDate,
    members: allMembers,
    company: newCompany,
    competitors: updatedCompetitors,
    funnel,
    lastWeekReport: weeklyFinancials,
    showWeekReport: true,
    pendingEvents,
    marketDemand: seasonal,
    seasonalFactor: seasonal,
  };
}

function getAreaMultiplier(areaId: string | null): number {
  switch (areaId) {
    case 'kusatsu': return 1.2;
    case 'ritto':   return 0.9;
    case 'otsu':    return 1.5;
    default:        return 1.0;
  }
}

function computeFunnel(
  state: GameState,
  baseInquiry: number,
  rng: ReturnType<typeof createRng>,
  demandBonus: number
): MarketingFunnel {
  const activeCampaigns = state.marketingCampaigns.filter(c => c.active);
  let marketingMultiplier = 0;

  for (const campaign of activeCampaigns) {
    const params = MARKETING_PARAMS[campaign.type];
    marketingMultiplier += (campaign.weeklyBudget / 10000) * params.inquiryRate * 10;
  }

  // Reputation multiplier (brand awareness)
  const reputationMult = 0.5 + (state.company.reputation / 100) * 1.5;

  // Competitor pressure reduces inquiry
  const competitorPressure = computeCompetitorPressure(state.competitors, state.selectedAreaId);

  // Owner free time bonus: when staff teach classes, owner can focus on sales/community
  // This is a key benefit of hiring staff — owner hours shift from teaching to business development
  const ownerTeachingHours = computeOwnerTeachingHours(state);
  const owner = state.staff.find(s => s.isOwner);
  const ownerTotalHours = owner?.availableHoursPerWeek ?? 40;
  const ownerFreeHours = Math.max(0, ownerTotalHours - ownerTeachingHours - 5); // 5h admin
  // Each free hour → 0.03 additional inquiry multiplier (cap at +0.9 = ~9h free)
  const freeTimeBonus = Math.min(0.9, ownerFreeHours * 0.03);

  const weeklyInquiries = Math.round(
    (baseInquiry * (1 + freeTimeBonus) + marketingMultiplier * 3) * reputationMult * (1 - competitorPressure * 0.3)
    * rng.float(0.7, 1.3)
  );

  const trialBookingRate = 0.5 + marketingMultiplier * 0.1;
  const trialAttendRate = 0.7 + rng.float(-0.1, 0.1);
  const enrollRate = computeEnrollRate(state, rng);

  const weeklyTrialBookings = Math.round(weeklyInquiries * trialBookingRate);
  const weeklyTrialAttendance = Math.round(weeklyTrialBookings * trialAttendRate);
  const weeklyNewMembers = Math.round(weeklyTrialAttendance * enrollRate);

  return {
    weeklyAwareness: Math.round(weeklyInquiries * 20),
    weeklyWebVisits: Math.round(weeklyInquiries * 5),
    weeklyInquiries,
    weeklyTrialBookings,
    weeklyTrialAttendance,
    weeklyNewMembers,
  };
}

function computeCompetitorPressure(competitors: Competitor[], areaId: string | null): number {
  const active = competitors.filter(c => c.areaId === areaId && c.isActive);
  if (active.length === 0) return 0;
  const avgBrand = active.reduce((s, c) => s + c.brandAwareness, 0) / active.length;
  return Math.min(0.8, avgBrand / 100);
}

function computeEnrollRate(state: GameState, rng: ReturnType<typeof createRng>): number {
  if (state.classes.length === 0) return 0;
  const avgFee = state.classes.reduce((s, c) => s + c.monthlyFee, 0) / state.classes.length;
  // Price sensitivity: 8000円が標準
  const priceFactor = Math.max(0.3, 1.0 - (avgFee - 8000) / 20000);
  // Satisfaction factor
  const members = state.members;
  const avgSatisfaction = members.length > 0
    ? members.reduce((s, m) => s + m.satisfaction, 0) / members.length
    : 70;
  const satisfactionFactor = 0.3 + (avgSatisfaction / 100) * 0.7;
  // Capacity check
  const totalCapacity = state.classes.reduce((s, c) => s + c.capacity, 0);
  const capacityFactor = totalCapacity > 0 ? Math.min(1.0, (totalCapacity - members.length) / totalCapacity) : 0;

  return Math.max(0, Math.min(0.8, 0.4 * priceFactor * satisfactionFactor * capacityFactor * rng.float(0.8, 1.2)));
}

function computeMemberChanges(
  state: GameState,
  funnel: MarketingFunnel,
  weekNumber: number,
  rng: ReturnType<typeof createRng>,
  retentionMult: number
): { newMembers: Member[]; lostMembers: number; updatedMembers: Member[] } {
  // Churn: weekly churn per member
  const avgMonthlyRetention = state.members.length > 0
    ? state.members.reduce((s, m) => s + m.continuationWill / 100, 0) / state.members.length
    : 0.9;
  const weeklyChurnRate = Math.max(0, (1 - avgMonthlyRetention * retentionMult) / 4);

  const updatedMembers: Member[] = [];
  let lostCount = 0;

  for (const member of state.members) {
    const churnRoll = rng.next();
    if (churnRoll < weeklyChurnRate) {
      lostCount++;
      continue;
    }
    // Instructor quality drives satisfaction drift.
    // High-ability staff → satisfaction trends up; low-ability or no staff → drifts down faster.
    const instructor = getClassInstructor(state, member.classId);
    const teachingQuality = instructor
      ? instructor.teachingAbility
      : (state.staff.find(s => s.isOwner)?.teachingAbility ?? 70);
    // ±2 quality drift per week relative to 70-baseline (range: -2.0 to +1.2)
    const qualityDrift = (teachingQuality - 70) * 0.04;

    const newSatisfaction = Math.min(100, Math.max(10,
      member.satisfaction + rng.float(-2, 4) + qualityDrift
    ));
    const newGrowth = Math.min(100, member.growthLevel + rng.float(0.5, 2.0));
    const newContinuation = Math.max(20, Math.min(100,
      member.continuationWill + (newSatisfaction - 70) * 0.1
    ));
    updatedMembers.push({
      ...member,
      satisfaction: newSatisfaction,
      growthLevel: newGrowth,
      continuationWill: newContinuation,
    });
  }

  // New members (limited by capacity)
  const availableCapacity = computeAvailableCapacity(state, updatedMembers.length);
  const targetNew = Math.min(funnel.weeklyNewMembers, availableCapacity);

  const newMembers: Member[] = [];
  for (let i = 0; i < targetNew; i++) {
    const classId = pickClassForNewMember(state.classes, rng);
    if (!classId) break;
    const cls = state.classes.find(c => c.id === classId)!;
    const memberName = MEMBER_NAMES[rng.int(0, MEMBER_NAMES.length)];
    newMembers.push({
      id: `member_${weekNumber}_${i}`,
      classId,
      name: memberName,
      ageGroup: getAgeGroupForService(cls.serviceType),
      joinWeek: weekNumber,
      satisfaction: rng.float(65, 85),
      continuationWill: rng.float(70, 90),
      growthLevel: 10,
      referralPotential: rng.float(30, 80),
      monthlyFee: cls.monthlyFee,
    });
  }

  return { newMembers, lostMembers: lostCount, updatedMembers };
}

function getAgeGroupForService(service: string): Member['ageGroup'] {
  switch (service) {
    case 'kids_gymnastics': return 'child';
    case 'elementary_gymnastics': return 'elementary';
    case 'adult_fitness': return 'adult';
    case 'senior_fitness': return 'senior';
    default: return rng_ageGroup();
  }
}

function rng_ageGroup(): Member['ageGroup'] {
  const groups: Member['ageGroup'][] = ['child', 'elementary', 'teen', 'adult'];
  return groups[Math.floor(Math.random() * groups.length)];
}

function pickClassForNewMember(classes: GameClass[], rng: ReturnType<typeof createRng>): string | null {
  const available = classes.filter(c => c.active && c.enrolledCount < c.capacity);
  if (available.length === 0) return null;
  return rng.pick(available).id;
}

function computeAvailableCapacity(state: GameState, currentCount: number): number {
  const totalCapacity = state.classes.filter(c => c.active).reduce((s, c) => s + c.capacity, 0);
  return Math.max(0, totalCapacity - currentCount);
}

function computeRent(state: GameState): number {
  if (!state.selectedPropertyId) return 0;
  const property = state.properties.find(p => p.id === state.selectedPropertyId);
  return property ? property.weeklyRent : 0;
}

function getClassInstructor(state: GameState, classId: string): Staff | null {
  const cls = state.classes.find(c => c.id === classId);
  if (!cls?.instructorId || cls.instructorId === 'owner') return null;
  return state.staff.find(s => s.id === cls.instructorId) ?? null;
}

// Export for UI use (owner hours freed when staff teach)
export function computeOwnerTeachingHours(state: GameState): number {
  return state.classes
    .filter(c => c.active && (!c.instructorId || c.instructorId === 'owner'))
    .reduce((sum, c) => sum + (c.durationMinutes / 60) + 0.5, 0);
}

function computeStaffWages(state: GameState): number {
  return state.staff
    .filter(s => !s.isOwner)
    .reduce((sum, s) => sum + s.weeklyWage, 0);
}

function computeMarketingExpense(state: GameState): number {
  return state.marketingCampaigns
    .filter(c => c.active)
    .reduce((sum, c) => sum + c.weeklyBudget, 0);
}

function getAvgTrialFee(state: GameState): number {
  if (state.classes.length === 0) return 1000;
  return Math.round(state.classes.reduce((s, c) => s + c.trialFee, 0) / state.classes.length);
}

function updateCompetitors(
  competitors: Competitor[],
  rng: ReturnType<typeof createRng>,
  seasonal: number
): Competitor[] {
  return competitors.map(comp => {
    if (!comp.isActive) return comp;
    let { memberCount, brandAwareness, monthlyFee, adSpendWeekly } = comp;

    // Competitors gain/lose members
    const netMemberChange = rng.int(-3, 5);
    memberCount = Math.max(0, memberCount + netMemberChange);

    // Brand awareness evolves
    brandAwareness = Math.min(100, Math.max(10,
      brandAwareness + rng.float(-1, 2)
    ));

    // Occasional price changes based on strategy
    if (rng.chance(0.03)) {
      if (comp.strategy === 'price_focused') {
        monthlyFee = Math.max(5000, monthlyFee - rng.int(0, 500));
      } else if (comp.strategy === 'quality_focused') {
        monthlyFee = Math.min(15000, monthlyFee + rng.int(0, 500));
      }
    }

    return { ...comp, memberCount, brandAwareness, monthlyFee, adSpendWeekly };
  });
}

function generateEvents(
  state: GameState,
  rng: ReturnType<typeof createRng>,
  weekNumber: number
): GameEvent[] {
  const events: GameEvent[] = [];

  // Random event chance ~20% per week
  if (rng.chance(0.20)) {
    const candidates = RANDOM_EVENTS.filter(e => !state.pendingEvents.find(pe => pe.id === e.id));
    if (candidates.length > 0) {
      events.push(rng.pick(candidates));
    }
  }

  // Low cash warning
  if (state.company.cash < 50000 && rng.chance(0.5)) {
    events.push({
      id: 'low_cash_warning',
      type: 'bad',
      title: '資金が少なくなっています',
      description: `現金残高が${state.company.cash.toLocaleString()}円に減少しています。費用を見直しましょう。`,
      autoEffect: {},
    });
  }

  return events;
}

function determinePhase(memberCount: number, cash: number, currentPhase: number): 1 | 2 | 3 | 4 | 5 | 6 | 7 {
  if (memberCount >= 100 && cash >= 3000000) return Math.max(currentPhase, 5) as any;
  if (memberCount >= 60 && cash >= 1500000) return Math.max(currentPhase, 4) as any;
  if (memberCount >= 30 && cash >= 500000) return Math.max(currentPhase, 3) as any;
  if (memberCount >= 15) return Math.max(currentPhase, 2) as any;
  return currentPhase as 1 | 2 | 3 | 4 | 5 | 6 | 7;
}

// --- Monthly report generation ---
export function generateMonthlyReport(state: GameState): import('../types/game').MonthlyReport {
  const { year, month } = state.currentDate;
  const history = state.company.weeklyHistory.slice(-4);

  const revenue = history.reduce((s, w) => s + w.cashIn, 0);
  const expenses = history.reduce((s, w) => s + w.cashOut, 0);
  const newM = history.reduce((s, w) => s + w.newMembers, 0);
  const lostM = history.reduce((s, w) => s + w.lostMembers, 0);
  const memberCount = state.members.length;
  const prevCount = memberCount - newM + lostM;
  const retentionRate = prevCount > 0 ? Math.max(0, (prevCount - lostM) / prevCount) : 1;

  const fixedCosts = computeRent(state) * 4 + computeStaffWages(state) * 4;
  const breakEven = fixedCosts > 0
    ? Math.ceil(fixedCosts / Math.max(1, state.classes.reduce((s, c) => s + c.monthlyFee, 0) / Math.max(1, state.classes.length)))
    : 0;

  const avgSat = memberCount > 0
    ? Math.round(state.members.reduce((s, m) => s + m.satisfaction, 0) / memberCount)
    : 0;

  const highlights: string[] = [];
  const warnings: string[] = [];
  const suggestions: string[] = [];

  if (newM > lostM) highlights.push(`会員数が${newM - lostM}名増加しました`);
  if (revenue > expenses) highlights.push('今月は黒字でした');
  if (avgSat >= 80) highlights.push('会員満足度が高い水準です');

  if (revenue < expenses) warnings.push(`今月は${(expenses - revenue).toLocaleString()}円の赤字でした`);
  if (state.company.cash < 100000) warnings.push('現金残高が10万円を下回っています。資金繰りに注意してください');
  if (lostM > 3) warnings.push(`今月${lostM}名が退会しました。満足度を確認してください`);

  const capacity = state.classes.reduce((s, c) => s + c.capacity, 0);
  if (capacity > 0 && memberCount / capacity > 0.85) {
    suggestions.push('クラスの定員が満杯に近づいています。増設を検討してください');
  }
  if (state.marketingCampaigns.filter(c => c.active).length === 0) {
    suggestions.push('集客施策を実施しましょう。体験会やSNS投稿が効果的です');
  }
  if (memberCount >= 20 && state.staff.filter(s => !s.isOwner).length === 0) {
    suggestions.push('会員数が増えてきました。講師採用を検討する時期です');
  }

  return {
    year, month, revenue, expenses,
    operatingProfit: revenue - expenses,
    cashBalance: state.company.cash,
    memberCount, newMembers: newM, lostMembers: lostM,
    retentionRate,
    breakEvenPoint: breakEven,
    ownerHoursWorked: 40,
    avgSatisfaction: avgSat,
    highlights, warnings, suggestions,
  };
}
