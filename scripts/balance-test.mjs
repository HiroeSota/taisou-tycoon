/**
 * ゲームバランステスト — 6戦略 × 52週
 *
 * 実行: node scripts/balance-test.mjs
 *
 * シミュレーションエンジンのコアロジックを直接再現。
 * Viteの拡張子解決に依存しないため、Node.jsで直接動作する。
 */

// ---- Core simulation (mirrors src/engine/simulation.ts) ----

function mulberry32(seed) {
  let s = seed;
  return () => {
    s |= 0; s = s + 0x6D2B79F5 | 0;
    let t = Math.imul(s ^ s >>> 15, 1 | s);
    t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
    return ((t ^ t >>> 14) >>> 0) / 4294967296;
  };
}

function createRng(seed) {
  const rand = mulberry32(seed);
  return {
    next: rand,
    float: (min, max) => min + rand() * (max - min),
    chance: (p) => rand() < p,
    int: (min, max) => Math.floor(min + rand() * (max - min + 1)),
  };
}

const SEASONAL_FACTORS = [0.75, 0.80, 1.10, 1.20, 1.15, 0.90, 0.85, 0.70, 1.30, 1.25, 1.10, 0.80];
const MARKETING_PARAMS = {
  flyer:       { inquiryRate: 0.015 },
  sns:         { inquiryRate: 0.025 },
  web_ad:      { inquiryRate: 0.030 },
  trial_event: { inquiryRate: 0.080 },
  referral:    { inquiryRate: 0.060 },
  local_event: { inquiryRate: 0.040 },
};
const DIFFICULTY = { easy: 1.3, normal: 1.0, hard: 0.7 };

function weekToDate(week) {
  const totalMonths = Math.floor((week - 1) / 4);
  const startYear = 2027; const startMonth = 9;
  let month = startMonth + totalMonths;
  let year = startYear + Math.floor((month - 1) / 12);
  month = ((month - 1) % 12) + 1;
  return { year, month, week: ((week - 1) % 4) + 1 };
}

function simulate(strategy, totalWeeks = 52) {
  const {
    name, initialCash = 1200000, monthlyFee = 8000, capacity = 12,
    weeklyRent = 60000, campaigns = [], staffWagePerWeek = 0, difficulty = 'normal'
  } = strategy;

  const demandBonus = DIFFICULTY[difficulty];
  let cash = initialCash;
  let members = 0;
  let weekNumber = 0;
  let totalRevenue = 0;
  let totalExpenses = 0;
  let peakMembers = 0;
  let cashWentNegative = false;
  let breakEvenWeek = null;
  let consecutiveProfitWeeks = 0;
  let reputation = 20;
  const recentProfits = [];

  for (let w = 0; w < totalWeeks; w++) {
    weekNumber++;
    const date = weekToDate(weekNumber);
    const seasonal = SEASONAL_FACTORS[date.month - 1] ?? 1.0;
    const rng = createRng(42 + weekNumber * 1337);

    // Marketing funnel
    const baseInquiry = 8 * 1.2 * seasonal * demandBonus; // kusatsu area mult 1.2
    let mktMult = 0;
    for (const c of campaigns) {
      const p = MARKETING_PARAMS[c.type];
      if (p) mktMult += (c.budget / 10000) * p.inquiryRate * 10;
    }
    const reputationMult = 0.5 + (reputation / 100) * 1.5;
    const inquiries = Math.round(
      (baseInquiry + mktMult * 3) * reputationMult * rng.float(0.7, 1.3)
    );
    const trialAttendance = Math.round(inquiries * 0.5 * 0.75);
    const availableSlots = Math.max(0, capacity - members);
    const newMembersCandidates = Math.round(trialAttendance * 0.45);
    const newMembers = Math.min(newMembersCandidates, availableSlots);

    // Churn (weekly ~2%)
    const lost = Math.round(members * (1 - 0.98) * rng.float(0.7, 1.3));
    members = Math.max(0, members - lost) + newMembers;
    if (members > peakMembers) peakMembers = members;

    // Revenue (monthly fee only on week 1 of month)
    const isMonthStart = date.week === 1;
    const tuition = isMonthStart ? members * monthlyFee : 0;
    const trialRev = trialAttendance * 1000;
    const enrollFee = newMembers * 5000;
    const cashIn = tuition + trialRev + enrollFee;

    // Expenses
    const marketing = campaigns.reduce((s, c) => s + c.budget, 0);
    const insurance = Math.round(3000 / 4);
    const supplies = members * 100;
    const cashOut = weeklyRent + staffWagePerWeek + marketing + insurance + supplies;

    cash += cashIn - cashOut;
    totalRevenue += cashIn;
    totalExpenses += cashOut;
    if (cash < 0) cashWentNegative = true;
    cash = Math.max(0, cash);

    // Reputation drifts toward 50 slowly, +1 per profitable week
    const profit = cashIn - cashOut;
    if (profit > 0) reputation = Math.min(100, reputation + 0.5);
    recentProfits.push(profit);

    if (profit > 0) {
      consecutiveProfitWeeks++;
      if (consecutiveProfitWeeks >= 3 && breakEvenWeek === null) breakEvenWeek = w + 1;
    } else {
      consecutiveProfitWeeks = 0;
    }
  }

  const last4 = recentProfits.slice(-4);
  const avgWeeklyProfit = last4.reduce((s, v) => s + v, 0) / Math.max(1, last4.length);

  return {
    name, totalWeeks, finalCash: cash, finalMembers: members,
    totalRevenue, totalExpenses, avgWeeklyProfit: Math.round(avgWeeklyProfit),
    cashWentNegative, peakMembers, breakEvenWeek,
  };
}

// ---- Strategy definitions ----
// 物件家賃は実際のデータに合わせる:
//   コミュニティホール草津北: 8,000/週  (kusatsu_rental_01)
//   スタジオKクサツ:           28,000/週 (kusatsu_studio_01)
const RENT_HALL = 8000;    // 安いが時間制限あり
const RENT_STUDIO = 28000; // 広くて安定、初期費用15万

const STRATEGIES = [
  {
    name: '① 積極マーケ（Web+体験会）',
    initialCash: 1200000,
    monthlyFee: 8500,
    capacity: 12,
    weeklyRent: RENT_HALL,
    campaigns: [
      { type: 'web_ad', budget: 15000 },
      { type: 'trial_event', budget: 20000 },
    ],
    staffWagePerWeek: 0,
  },
  {
    name: '② 最小広告（チラシのみ）',
    initialCash: 1200000,
    monthlyFee: 8000,
    capacity: 12,
    weeklyRent: RENT_HALL,
    campaigns: [
      { type: 'flyer', budget: 5000 },
    ],
    staffWagePerWeek: 0,
  },
  {
    name: '③ 低価格（月謝6,500円）',
    initialCash: 1200000,
    monthlyFee: 6500,
    capacity: 16,
    weeklyRent: RENT_HALL,
    campaigns: [
      { type: 'flyer', budget: 8000 },
      { type: 'sns', budget: 5000 },
    ],
    staffWagePerWeek: 0,
  },
  {
    // ④ 高品質戦略: 安い会場で少人数・高単価を狙う
    // (スタジオは会員が増えてから移転が現実的)
    name: '④ 高品質（月謝11,000円）',
    initialCash: 1200000,
    monthlyFee: 11000,
    capacity: 10,
    weeklyRent: RENT_HALL,     // ホールで始めて高単価で収益化
    campaigns: [
      { type: 'web_ad', budget: 15000 },
      { type: 'local_event', budget: 8000 },
    ],
    staffWagePerWeek: 0,
  },
  {
    // ⑤ 早期スタッフ: 2クラス体制で拡張。スタジオは必要だが
    // 初期費用150,000を差し引いた状態でスタート
    name: '⑤ 早期スタッフ採用',
    initialCash: 1050000,      // 初期費用150k差し引き済み
    monthlyFee: 8500,
    capacity: 20,              // 2クラス相当の定員
    weeklyRent: RENT_STUDIO,
    campaigns: [
      { type: 'web_ad', budget: 15000 },
      { type: 'trial_event', budget: 10000 },
    ],
    staffWagePerWeek: 25000,   // 講師1名（週25,000円）
  },
  {
    name: '⑥ リーン（最小コスト）',
    initialCash: 1200000,
    monthlyFee: 7500,
    capacity: 12,
    weeklyRent: RENT_HALL,
    campaigns: [
      { type: 'referral', budget: 3000 },
    ],
    staffWagePerWeek: 0,
  },
];

// ---- Run & Report ----
console.log('\n===== 体操経営 TYCOON — ゲームバランステスト（52週） =====\n');

const results = STRATEGIES.map(s => simulate(s, 52));

const W = 24;
console.log('─'.repeat(85));
console.log(
  '戦略'.padEnd(W) +
  '最終資金'.padStart(10) +
  '最終会員'.padStart(8) +
  'ピーク'.padStart(7) +
  '週利益avg'.padStart(10) +
  '損益分岐'.padStart(8) +
  '破産'.padStart(5)
);
console.log('─'.repeat(85));

for (const r of results) {
  const fmt = n => (n >= 0 ? '+' : '') + Math.round(n / 1000) + 'k';
  console.log(
    r.name.padEnd(W) +
    `¥${Math.round(r.finalCash / 10000)}万`.padStart(10) +
    `${r.finalMembers}名`.padStart(8) +
    `${r.peakMembers}名`.padStart(7) +
    fmt(r.avgWeeklyProfit).padStart(10) +
    (r.breakEvenWeek ? `${r.breakEvenWeek}週目` : 'なし').padStart(8) +
    (r.cashWentNegative ? '⚠' : '─').padStart(5)
  );
}
console.log('─'.repeat(85));
console.log('単位: 万=×10,000円 / k=×1,000円');

const best = results.reduce((a, b) => b.finalCash > a.finalCash ? b : a);
const worst = results.reduce((a, b) => b.finalCash < a.finalCash ? b : a);
const fastestBE = results.filter(r => r.breakEvenWeek).sort((a, b) => a.breakEvenWeek - b.breakEvenWeek)[0];
const bankrupt = results.filter(r => r.cashWentNegative);

console.log('\n📊 バランス評価:');
console.log(`  最高資金:     ${best.name} → ¥${Math.round(best.finalCash / 10000)}万`);
console.log(`  最低資金:     ${worst.name} → ¥${Math.round(worst.finalCash / 10000)}万`);
console.log(`  最速損益分岐: ${fastestBE ? `${fastestBE.name} → ${fastestBE.breakEvenWeek}週目` : 'なし'}`);
if (bankrupt.length) console.log(`  ⚠  破産リスク: ${bankrupt.map(r => r.name).join(', ')}`);

const cashRange = best.finalCash - worst.finalCash;
console.log(`\n  戦略間の資金差: ¥${Math.round(cashRange / 10000)}万`);
if (cashRange > 2000000) {
  console.log('  ⚠  戦略格差が大きい（200万円超）。難易度・マーケ効果の調整を検討。');
} else if (cashRange < 500000) {
  console.log('  ℹ  戦略間の差が小さい（50万円未満）。もう少し差別化を。');
} else {
  console.log('  ✓  戦略間バランス良好。');
}
console.log();
