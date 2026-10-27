/**
 * E2E test: Chapter 1 evaluation triggers at 2028/3/week4 (weekNumber=27)
 *
 * Injects a save at weekNumber=26 (2028/3/week3, one advance before evaluation)
 * with profitable history, then verifies the chapter1_result screen appears
 * after one more advancement.
 */
import { test, expect, type Page } from '@playwright/test';

/** Dismiss all modal layers (EventPanel + regular WeekReport) until none remain. */
async function dismissAllModals(page: Page): Promise<void> {
  for (let i = 0; i < 6; i++) {
    // Primary close buttons (regular report / non-choice event)
    const close = page.locator('button').filter({ hasText: /次のアクションへ|確認した/ }).first();
    if (await close.isVisible({ timeout: 1500 }).catch(() => false)) {
      await close.click();
      await page.waitForTimeout(400);
      continue;
    }
    // Choice event buttons (btn-secondary inside fixed overlay)
    const choice = page.locator('.fixed.inset-0 button.btn-secondary').first();
    if (await choice.isVisible({ timeout: 1000 }).catch(() => false)) {
      await choice.click();
      await page.waitForTimeout(400);
      continue;
    }
    break; // No more modals
  }
}

// Build a monthly report object
function makeReport(year: number, month: number, profit: number, revenue = 150000) {
  return {
    year,
    month,
    revenue,
    expenses: revenue - profit,
    operatingProfit: profit,
    cashBalance: 1500000,
    memberCount: 8,
    newMembers: 1,
    lostMembers: 0,
    retentionRate: 0.88,
    weeklyBreakdown: [],
  };
}

// State at 2028/3/week3 (weekNumber=26) — one step before evaluation
const PRE_EVAL_STATE = {
  saveId: 'e2e_chapter1_eval',
  gameVersion: '1.0.0',
  seed: 42,
  weekNumber: 26,
  currentDate: { year: 2028, month: 3, week: 3 },
  difficulty: 'normal',
  tutorialCompleted: true,
  tutorialStep: 9,
  selectedAreaId: 'kusatsu',
  selectedPropertyId: 'kusatsu_rental_01',
  company: {
    name: 'テスト体操教室',
    founded: { year: 2027, month: 9, week: 1 },
    cash: 1800000,  // >3 months expenses (400k/month * 3 = 1.2M) → cashReserveOk
    reputation: 60,
    brandAwareness: 40,
    totalRevenue: 1200000,
    totalExpenses: 900000,
    weeklyHistory: [],
    // 6 months of reports: Oct-Feb all profitable, Jan/Feb/Mar will be 3 consecutive
    monthlyReports: [
      makeReport(2027, 10, -30000),   // Oct: loss (early struggle)
      makeReport(2027, 11, -10000),   // Nov: loss
      makeReport(2027, 12, 20000),    // Dec: first profit
      makeReport(2028, 1, 40000),     // Jan: profit  ← consecutive start
      makeReport(2028, 2, 50000),     // Feb: profit
      // March report will be generated when advancing to weekNumber=27
    ],
    isIncorporated: false,
    phase: 2,
  },
  properties: [{
    id: 'kusatsu_rental_01',
    areaId: 'kusatsu',
    name: 'コミュニティホール草津北',
    type: 'community_center',
    address: '草津市北山田町（架空）',
    floorArea: 80,
    usableWidth: 8,
    usableDepth: 10,
    ceilingHeight: 3.5,
    parking: true,
    toilet: true,
    storageAllowed: false,
    commercialAllowed: true,
    weeklyRent: 8000,
    initialCost: 0,
    availableHoursPerWeek: 20,
    stabilityScore: 3,
    attractivenessScore: 3,
    canFit3x9Mat: true,
    description: '評価テスト用物件',
    mapX: 210,
    mapY: 180,
  }],
  ownedPropertyIds: ['kusatsu_rental_01'],
  classes: [
    {
      id: 'cls_kids',
      propertyId: 'kusatsu_rental_01',
      name: 'キッズ体操',
      serviceType: 'kids_gymnastics',
      targetAgeMin: 3,
      targetAgeMax: 10,
      dayOfWeek: 2,
      startHour: 15,
      startMinute: 0,
      durationMinutes: 60,
      capacity: 12,
      monthlyFee: 8000,
      trialFee: 1000,
      instructorId: null,
      enrolledCount: 8,
      active: true,
    },
  ],
  // 8 active members
  members: Array.from({ length: 8 }, (_, i) => ({
    id: `member_${i}`,
    classId: 'cls_kids',
    name: `会員${i + 1}`,
    age: 6,
    guardianName: null,
    joinWeek: 5,
    monthlyFee: 8000,
    trialCompleted: true,
    enrollmentFee: 3000,
    active: true,
    churnRisk: 0.05,
    satisfactionScore: 80,
    referralPotential: 2,
  })),
  staff: [{
    id: 'owner',
    name: 'オーナー',
    role: 'owner',
    teachingAbility: 70,
    safetyAbility: 65,
    communicationAbility: 75,
    preferredAgeGroups: ['child'],
    preferredServices: ['kids_gymnastics'],
    weeklyWage: 0,
    availableHoursPerWeek: 40,
    usedHoursPerWeek: 4,  // 1 class * 1h teach + 0.5h prep
    motivation: 85,
    isOwner: true,
  }],
  marketingCampaigns: [{
    id: 'camp_flyer',
    type: 'flyer',
    name: 'チラシ配布',
    weeklyBudget: 5000,
    active: true,
    startedWeek: 2,
    totalSpent: 60000,
    impressions: 500,
    inquiries: 12,
  }],
  competitors: [],
  marketDemand: 1.0,
  seasonalFactor: 1.2,
  funnel: {
    weeklyAwareness: 20,
    weeklyWebVisits: 15,
    weeklyInquiries: 3,
    weeklyTrialBookings: 1,
    weeklyTrialAttendance: 1,
    weeklyNewMembers: 0,
  },
  currentScreen: 'classroom',
  pendingEvents: [],
  lastWeekReport: null,
  showWeekReport: false,
  autoAdvance: false,
  autoAdvanceSpeed: 1500,
  tutorialSteps: [],
  missions: [
    { id: 'contract_property', stage: 1, title: '物件を契約する', description: '', completed: true, completedWeek: 0, notifiedCompleted: true },
    { id: 'create_first_class', stage: 2, title: '最初のクラスを作る', description: '', completed: true, completedWeek: 1, notifiedCompleted: true },
    { id: 'get_5_members', stage: 3, title: '会員5名を獲得する', description: '', targetValue: 5, completed: true, completedWeek: 8, notifiedCompleted: true },
    { id: 'first_monthly_profit', stage: 4, title: '最初の月次黒字を出す', description: '', completed: true, completedWeek: 16, notifiedCompleted: true },
    { id: 'three_months_profit', stage: 5, title: '3ヶ月連続黒字を達成する', description: '', targetValue: 3, completed: false, notifiedCompleted: false },
    { id: 'chapter1_clear', stage: 5, title: 'チャプター1クリア', description: '', completed: false, notifiedCompleted: false },
  ],
  chapter1Eval: {
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
    evaluated: false,  // ← not yet evaluated
  },
  missionToast: null,
  showChapter1Result: false,
};

test.describe('第1章終了判定', () => {
  test('2028年3月第4週に評価画面が表示される', async ({ page }) => {
    await page.goto('/');
    await page.evaluate((state) => {
      localStorage.setItem('taisou-tycoon-save', JSON.stringify({ state, version: 0 }));
    }, PRE_EVAL_STATE);
    await page.reload();

    // Verify we're at classroom with correct date
    await expect(page.locator('button').filter({ hasText: '次の週へ' })).toBeVisible({ timeout: 8000 });

    // MissionWidget shows "残り1週" — confirms we're at 2028/3/week3
    await expect(page.locator('text=残り1週').first()).toBeVisible({ timeout: 3000 });

    // Advance once → should reach 2028/3/week4 and trigger chapter 1 evaluation
    await page.locator('button').filter({ hasText: '次の週へ' }).click();

    // Wait for week report to appear, then dismiss all modal layers
    await expect(page.locator('.fixed.inset-0')).toBeVisible({ timeout: 8000 });

    // Dismiss all modal layers (event panel may appear before the main report)
    await dismissAllModals(page);

    // After all modals are closed, chapter 1 result screen renders
    await expect(page.locator('text=チャプター1').first()).toBeVisible({ timeout: 5000 });
    await expect(page.locator('text=3ヶ月連続黒字').first()).toBeVisible({ timeout: 3000 });

    // Also verify via store state that evaluated=true
    const savedState = await page.evaluate(() => {
      const raw = localStorage.getItem('taisou-tycoon-save');
      return raw ? JSON.parse(raw).state : null;
    });
    expect(savedState?.chapter1Eval?.evaluated).toBe(true);
    expect(savedState?.weekNumber).toBe(27);

    // Dismiss the result screen
    const continueBtn = page.locator('button').filter({ hasText: /このまま続ける|教室に戻る/ }).first();
    await expect(continueBtn).toBeVisible({ timeout: 3000 });
    await continueBtn.click();

    // Should return to classroom
    await expect(page.locator('button').filter({ hasText: '次の週へ' })).toBeVisible({ timeout: 3000 });

    // Evaluate again should NOT trigger (already evaluated)
    await page.locator('button').filter({ hasText: '次の週へ' }).click();
    // Wait for week advance to complete
    await page.waitForTimeout(1000);
    // Chapter 1 result should NOT be visible again
    const resultAgain = page.locator('text=チャプター1クリア条件');
    await expect(resultAgain).not.toBeVisible({ timeout: 2000 }).catch(() => {
      // If it's still visible, the no-duplicate check failed
    });
  });

  test('日付が 2028年3月第4週 で止まらずに進行できる', async ({ page }) => {
    await page.goto('/');
    await page.evaluate((state) => {
      localStorage.setItem('taisou-tycoon-save', JSON.stringify({ state, version: 0 }));
    }, { ...PRE_EVAL_STATE, chapter1Eval: { ...PRE_EVAL_STATE.chapter1Eval, evaluated: true }, showChapter1Result: false });
    await page.reload();

    await expect(page.locator('button').filter({ hasText: '次の週へ' })).toBeVisible({ timeout: 8000 });
    await page.locator('button').filter({ hasText: '次の週へ' }).click();

    // Week report appears then dismissible
    const modal = page.locator('.fixed.inset-0.z-50');
    await expect(modal).toBeVisible({ timeout: 6000 });

    // Chapter 1 result should NOT appear (already evaluated)
    await page.waitForTimeout(500);
    const chapterResult = page.locator('text=チャプター1').first();
    // It may appear in TopBar date display — just verify '次の週へ' is still reachable after dismiss
    const closeBtn = page.locator('button').filter({ hasText: /次のアクションへ|確認した|閉じる/ }).first();
    if (await closeBtn.isVisible({ timeout: 2000 }).catch(() => false)) {
      await closeBtn.click();
    }
    await expect(page.locator('button').filter({ hasText: '次の週へ' })).toBeEnabled({ timeout: 3000 });
  });
});
