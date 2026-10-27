/**
 * Game Balance Test — 6 strategies × 52 weeks
 *
 * Run: node --experimental-strip-types scripts/balance-test.ts
 */

import { advanceWeek, generateMonthlyReport } from '../src/engine/simulation.ts';
import { PROPERTIES } from '../src/data/properties.ts';
import { COMPETITORS_TEMPLATE } from '../src/data/competitors.ts';
import type { GameState, GameClass, MarketingCampaign } from '../src/types/game.ts';

// ---- Helpers ----
function makeClass(id: string, propertyId: string, override: Partial<GameClass> = {}): GameClass {
  return {
    id,
    propertyId,
    name: 'キッズ体操',
    serviceType: 'kids_gymnastics',
    targetAgeMin: 3,
    targetAgeMax: 10,
    dayOfWeek: 2,
    startHour: 15,
    durationMinutes: 60,
    capacity: 12,
    monthlyFee: 8000,
    trialFee: 1000,
    instructorId: null,
    enrolledCount: 0,
    active: true,
    ...override,
  };
}

function makeCampaign(id: string, type: MarketingCampaign['type'], budget: number): MarketingCampaign {
  return {
    id,
    type,
    name: type,
    weeklyBudget: budget,
    active: true,
    startedWeek: 0,
    totalSpent: 0,
    impressions: 0,
    inquiries: 0,
  };
}

function baseState(overrides: Partial<GameState> = {}): GameState {
  const property = PROPERTIES.find(p => p.areaId === 'kusatsu')!;
  return {
    saveId: 'test',
    gameVersion: '1.0.0',
    seed: 42,
    weekNumber: 0,
    currentDate: { year: 2027, month: 9, week: 1 },
    difficulty: 'normal',
    tutorialCompleted: true,
    tutorialStep: 9,
    selectedAreaId: 'kusatsu',
    selectedPropertyId: property.id,
    company: {
      name: 'テスト教室',
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
    ownedPropertyIds: [property.id],
    classes: [],
    members: [],
    staff: [{
      id: 'owner',
      name: 'オーナー',
      role: 'owner',
      teachingAbility: 70,
      safetyAbility: 65,
      communicationAbility: 75,
      preferredAgeGroups: ['child', 'elementary'],
      preferredServices: ['kids_gymnastics'],
      weeklyWage: 0,
      availableHoursPerWeek: 40,
      usedHoursPerWeek: 0,
      motivation: 90,
      isOwner: true,
    }],
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
    currentScreen: 'classroom',
    pendingEvents: [],
    lastWeekReport: null,
    showWeekReport: false,
    autoAdvance: false,
    autoAdvanceSpeed: 1500,
    isAdvancing: false,
    tutorialSteps: [],
    ...overrides,
  };
}

// ---- Strategies ----
const property = PROPERTIES.find(p => p.areaId === 'kusatsu')!;
const propertyId = property.id;

const STRATEGIES: Record<string, GameState> = {
  '① 積極マーケ（Web広告+体験会）': baseState({
    classes: [makeClass('c1', propertyId, { monthlyFee: 8500 })],
    marketingCampaigns: [
      makeCampaign('m1', 'web_ad', 15000),
      makeCampaign('m2', 'trial_event', 20000),
    ],
  }),
  '② 最小広告（チラシのみ）': baseState({
    classes: [makeClass('c1', propertyId, { monthlyFee: 8000 })],
    marketingCampaigns: [
      makeCampaign('m1', 'flyer', 5000),
    ],
  }),
  '③ 低価格戦略（月謝6,500円）': baseState({
    classes: [makeClass('c1', propertyId, { monthlyFee: 6500, capacity: 16 })],
    marketingCampaigns: [
      makeCampaign('m1', 'flyer', 8000),
      makeCampaign('m2', 'sns', 5000),
    ],
  }),
  '④ 高品質戦略（月謝11,000円）': baseState({
    classes: [makeClass('c1', propertyId, { monthlyFee: 11000, capacity: 8 })],
    marketingCampaigns: [
      makeCampaign('m1', 'web_ad', 20000),
      makeCampaign('m2', 'local_event', 10000),
    ],
  }),
  '⑤ 早期スタッフ採用（週3万円）': baseState({
    classes: [
      makeClass('c1', propertyId, { monthlyFee: 8500 }),
      makeClass('c2', propertyId, { name: '成人体操', serviceType: 'adult_fitness', monthlyFee: 8000, dayOfWeek: 4 }),
    ],
    staff: [
      {
        id: 'owner', name: 'オーナー', role: 'owner', teachingAbility: 70, safetyAbility: 65,
        communicationAbility: 75, preferredAgeGroups: ['child'], preferredServices: ['kids_gymnastics'],
        weeklyWage: 0, availableHoursPerWeek: 40, usedHoursPerWeek: 0, motivation: 90, isOwner: true,
      },
      {
        id: 'staff1', name: '田中講師', role: 'instructor', teachingAbility: 75, safetyAbility: 70,
        communicationAbility: 65, preferredAgeGroups: ['adult'], preferredServices: ['adult_fitness'],
        weeklyWage: 30000, availableHoursPerWeek: 20, usedHoursPerWeek: 0, motivation: 80, isOwner: false,
      },
    ],
    marketingCampaigns: [
      makeCampaign('m1', 'web_ad', 15000),
      makeCampaign('m2', 'trial_event', 15000),
    ],
  }),
  '⑥ リーン（最小コスト）': baseState({
    classes: [makeClass('c1', propertyId, { monthlyFee: 7500 })],
    marketingCampaigns: [
      makeCampaign('m1', 'referral', 3000),
    ],
  }),
};

// ---- Run simulation ----
interface Result {
  strategy: string;
  weeks: number;
  finalCash: number;
  finalMembers: number;
  totalRevenue: number;
  totalExpenses: number;
  weeklyProfit: number;
  cashWentNegative: boolean;
  peakMembers: number;
  breakEvenWeek: number | null;
}

function runStrategy(name: string, initial: GameState, totalWeeks = 52): Result {
  let state = { ...initial };
  let cashWentNegative = false;
  let peakMembers = 0;
  let breakEvenWeek: number | null = null;
  let consecutiveProfitableWeeks = 0;

  for (let w = 0; w < totalWeeks; w++) {
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
    let monthlyReports = state.company.monthlyReports;
    if (newDate.week === 4) {
      const updatedState = { ...state, ...updates, classes: syncedClasses } as GameState;
      const report = generateMonthlyReport(updatedState);
      monthlyReports = [...monthlyReports, report];
    }

    state = {
      ...state,
      ...updates,
      classes: syncedClasses,
      pendingEvents: [], // skip events for balance test
      company: {
        ...(updates.company ?? state.company),
        monthlyReports,
      },
    } as GameState;

    const members = state.members.length;
    if (members > peakMembers) peakMembers = members;
    if (state.company.cash <= 0) cashWentNegative = true;

    // Track break-even (3+ consecutive profitable weeks)
    const lastW = state.company.weeklyHistory.slice(-1)[0];
    if (lastW && lastW.cashIn > lastW.cashOut) {
      consecutiveProfitableWeeks++;
      if (consecutiveProfitableWeeks >= 3 && breakEvenWeek === null) {
        breakEvenWeek = w + 1;
      }
    } else {
      consecutiveProfitableWeeks = 0;
    }
  }

  const lastReport = state.company.weeklyHistory.slice(-4);
  const weeklyProfit = lastReport.length > 0
    ? (lastReport.reduce((s, r) => s + r.cashIn - r.cashOut, 0) / lastReport.length)
    : 0;

  return {
    strategy: name,
    weeks: totalWeeks,
    finalCash: state.company.cash,
    finalMembers: state.members.length,
    totalRevenue: state.company.totalRevenue,
    totalExpenses: state.company.totalExpenses,
    weeklyProfit: Math.round(weeklyProfit),
    cashWentNegative,
    peakMembers,
    breakEvenWeek,
  };
}

// ---- Report ----
console.log('\n===== 体操経営 TYCOON — ゲームバランステスト（52週） =====\n');

const results: Result[] = [];
for (const [name, state] of Object.entries(STRATEGIES)) {
  process.stdout.write(`  シミュレーション中: ${name} ...`);
  const r = runStrategy(name, state, 52);
  results.push(r);
  console.log(` 完了`);
}

console.log('\n' + '─'.repeat(90));
console.log(
  '戦略'.padEnd(32) +
  '最終資金'.padStart(12) +
  '最終会員'.padStart(8) +
  'ピーク会員'.padStart(10) +
  '週利益(avg)'.padStart(12) +
  '損益分岐'.padStart(8) +
  '破産'.padStart(6)
);
console.log('─'.repeat(90));

for (const r of results) {
  const fmt = (n: number) =>
    n >= 0 ? `+${Math.round(n / 1000)}k` : `${Math.round(n / 1000)}k`;
  console.log(
    r.strategy.padEnd(32) +
    `¥${Math.round(r.finalCash / 10000)}万`.padStart(12) +
    `${r.finalMembers}名`.padStart(8) +
    `${r.peakMembers}名`.padStart(10) +
    fmt(r.weeklyProfit).padStart(12) +
    (r.breakEvenWeek ? `${r.breakEvenWeek}週目` : 'なし').padStart(8) +
    (r.cashWentNegative ? '⚠️' : '─').padStart(6)
  );
}

console.log('─'.repeat(90));
console.log(`\n単位: 万円 = ×10,000円 / k = ×1,000円`);

// ---- Summary insights ----
const best = results.reduce((a, b) => b.finalCash > a.finalCash ? b : a);
const worst = results.reduce((a, b) => b.finalCash < a.finalCash ? b : a);
const fastestBE = results.filter(r => r.breakEvenWeek !== null).sort((a, b) => a.breakEvenWeek! - b.breakEvenWeek!)[0];

console.log('\n📊 バランス評価:');
console.log(`  最高資金      → ${best.strategy} (¥${Math.round(best.finalCash / 10000)}万)`);
console.log(`  最低資金      → ${worst.strategy} (¥${Math.round(worst.finalCash / 10000)}万)`);
console.log(`  最速損益分岐  → ${fastestBE ? `${fastestBE.strategy} (${fastestBE.breakEvenWeek}週目)` : 'なし'}`);
const bankruptcies = results.filter(r => r.cashWentNegative);
if (bankruptcies.length > 0) {
  console.log(`  ⚠️  破産リスク → ${bankruptcies.map(r => r.strategy).join(', ')}`);
}
console.log();
