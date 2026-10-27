/**
 * E2E test: advance week using real page.click() (not dispatchEvent).
 *
 * Key assertion: advanceWeek is non-blocking — the setTimeout(0) fix means
 * Playwright's click() returns in <3s instead of hanging for 30s.
 */
import { test, expect } from '@playwright/test';

// Minimal in-game state with a valid property so TopBar + ClassroomView render
const GAME_STATE = {
  saveId: 'e2e_test',
  gameVersion: '1.0.0',
  seed: 12345,
  weekNumber: 1,
  currentDate: { year: 2027, month: 9, week: 1 },
  difficulty: 'normal',
  tutorialCompleted: true,
  tutorialStep: 9,
  selectedAreaId: 'kusatsu',
  selectedPropertyId: 'kusatsu_rental_01',
  company: {
    name: 'E2Eテスト教室',
    founded: { year: 2027, month: 9, week: 1 },
    cash: 1200000,
    reputation: 30,
    brandAwareness: 10,
    totalRevenue: 0,
    totalExpenses: 0,
    weeklyHistory: [],
    monthlyReports: [],
    isIncorporated: false,
    phase: 1,
  },
  // Include the property so ClassroomView can find it
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
    description: 'テスト物件',
    mapX: 210,
    mapY: 180,
  }],
  ownedPropertyIds: ['kusatsu_rental_01'],
  classes: [{
    id: 'cls_1',
    propertyId: 'kusatsu_rental_01',
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
  }],
  members: [],
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
    usedHoursPerWeek: 0,
    motivation: 90,
    isOwner: true,
  }],
  marketingCampaigns: [{
    id: 'camp_1',
    type: 'trial_event',
    name: '体験会開催',
    weeklyBudget: 15000,
    active: true,
    startedWeek: 0,
    totalSpent: 0,
    impressions: 0,
    inquiries: 0,
  }],
  competitors: [],
  marketDemand: 1.0,
  seasonalFactor: 1.3,
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
  tutorialSteps: [],
};

test.describe('週進行 (advance week)', () => {
  test('タイトル画面が表示される', async ({ page }) => {
    await page.goto('/');
    await page.evaluate(() => localStorage.removeItem('taisou-tycoon-save'));
    await page.reload();
    await expect(page.locator('text=体操経営').first()).toBeVisible({ timeout: 5000 });
  });

  test('「次の週へ」クリックが3秒以内に完了する（非ブロッキング検証）', async ({ page }) => {
    // Set up game state in localStorage before loading the app
    await page.goto('/');
    await page.evaluate((state) => {
      // Zustand persist stores { state: ..., version: 0 }
      localStorage.setItem('taisou-tycoon-save', JSON.stringify({ state, version: 0 }));
    }, GAME_STATE);

    // Reload so the app hydrates from our injected state
    await page.reload();

    // Wait for the classroom screen to be ready (TopBar shows "次の週へ")
    const advanceBtn = page.locator('button').filter({ hasText: '次の週へ' });
    await expect(advanceBtn).toBeVisible({ timeout: 8000 });

    // ---- THE KEY TEST ----
    // With the old synchronous code, click() would hang for 30s.
    // With setTimeout(0) fix, click() returns immediately after the
    // browser fires the event (isAdvancing=true disables the button).
    const clickStart = Date.now();
    await advanceBtn.click();
    const clickMs = Date.now() - clickStart;

    // The click handler returns immediately — should take <2s
    expect(clickMs).toBeLessThan(2000);

    // The simulation runs in setTimeout(0). After it completes, either:
    //   a) week report modal appears (no events), or
    //   b) event panel appears (random event generated)
    // Either way a fixed modal overlay is shown — we check for that.
    const modal = page.locator('.fixed.inset-0.z-50');
    await expect(modal).toBeVisible({ timeout: 8000 });

    // Dismiss any event or week report modal that appeared
    const dismissBtn = page.locator('button').filter({
      hasText: /次のアクションへ|確認した/
    }).first();
    if (await dismissBtn.isVisible({ timeout: 2000 }).catch(() => false)) {
      await dismissBtn.click();
    }

    // After dismissal, the advance button should be re-enabled
    await expect(advanceBtn).toBeEnabled({ timeout: 3000 });
  });

  test('新規ゲームフロー: タイトル → エリア選択まで動作する', async ({ page }) => {
    await page.goto('/');
    await page.evaluate(() => localStorage.removeItem('taisou-tycoon-save'));
    await page.reload();

    // Click new game
    await page.locator('button').filter({ hasText: '新しい事業を始める' }).click();
    await expect(page.locator('text=あなたの事業をつくる')).toBeVisible({ timeout: 3000 });

    // Fill business name and proceed
    const nameInput = page.locator('input').first();
    await nameInput.fill('テスト体操教室');

    // Setup step "next" button says "エリアを選ぶ"
    await page.locator('button').filter({ hasText: 'エリアを選ぶ' }).click();

    // Should now show area selection — area cards show "草津", "栗東", "大津"
    await expect(page.locator('text=草津').first()).toBeVisible({ timeout: 5000 });
  });
});
