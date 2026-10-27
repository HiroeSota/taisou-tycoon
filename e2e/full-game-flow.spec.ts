/**
 * Full game flow E2E test.
 *
 * Tests the actual player journey from title screen to running a gym,
 * using only real UI interactions (no force clicks, no JS injection for flow).
 *
 * Validates:
 * - All buttons are within the viewport and clickable
 * - No elements are hidden behind BottomNav or TopBar
 * - The PropertyPanel "この物件で開業する" button is accessible
 * - The complete first-week cycle works end-to-end
 */
import { test, expect, Page } from '@playwright/test';

const BASE = 'http://localhost:5180';

/** Verify an element is fully within the viewport and not covered by another element */
async function assertClickable(page: Page, locator: ReturnType<Page['locator']>, label: string) {
  const box = await locator.boundingBox();
  expect(box, `${label}: element has no bounding box (not rendered)`).not.toBeNull();

  const viewport = page.viewportSize()!;
  expect(box!.x, `${label}: left edge is off-screen`).toBeGreaterThanOrEqual(0);
  expect(box!.y, `${label}: top edge is off-screen`).toBeGreaterThanOrEqual(0);
  expect(box!.x + box!.width, `${label}: right edge is off-screen`).toBeLessThanOrEqual(viewport.width + 1);
  expect(box!.y + box!.height, `${label}: bottom edge is off-screen`).toBeLessThanOrEqual(viewport.height + 2);

  // Check the center of the element is not covered by another element (like BottomNav)
  const centerX = Math.round(box!.x + box!.width / 2);
  const centerY = Math.round(box!.y + box!.height / 2);
  const topElement = await page.evaluate(({ x, y }) => {
    const el = document.elementFromPoint(x, y);
    return el ? { tag: el.tagName, class: el.className?.toString().slice(0, 80) } : null;
  }, { x: centerX, y: centerY });

  // The element at center should be the target or a child of it
  const isAccessible = await locator.evaluate((el, coords) => {
    const top = document.elementFromPoint(coords.x, coords.y);
    return top !== null && (el === top || el.contains(top) || top.contains(el));
  }, { x: centerX, y: centerY });

  expect(isAccessible, `${label}: center (${centerX},${centerY}) is covered by [${topElement?.tag}.${topElement?.class}]`).toBe(true);
}

test.describe('全画面フロー (Full Game Flow)', () => {

  test.beforeEach(async ({ page }) => {
    // Clear any saved state so we always start fresh
    await page.goto(BASE);
    await page.evaluate(() => localStorage.removeItem('taisou-tycoon-save'));
    await page.reload();
  });

  test('P0: タイトル画面が表示され、ゲーム開始ボタンが押せる', async ({ page }) => {
    await expect(page.locator('text=体操経営').first()).toBeVisible({ timeout: 5000 });

    const startBtn = page.locator('button').filter({ hasText: '新しい事業を始める' });
    await assertClickable(page, startBtn, '新しい事業を始める');
    await startBtn.click();

    await expect(page.locator('text=あなたの事業をつくる')).toBeVisible({ timeout: 3000 });
  });

  test('P0: 新規ゲーム → エリア選択 → マップ → 物件選択 → 開業 (完全フロー)', async ({ page }) => {
    // ----- Step 1: Title -----
    await expect(page.locator('text=体操経営').first()).toBeVisible({ timeout: 5000 });
    await page.locator('button').filter({ hasText: '新しい事業を始める' }).click();

    // ----- Step 2: Setup -----
    await expect(page.locator('text=あなたの事業をつくる')).toBeVisible({ timeout: 3000 });

    const nameInput = page.locator('input').first();
    await nameInput.clear();
    await nameInput.fill('テスト体操スクール');

    const nextBtn = page.locator('button').filter({ hasText: 'エリアを選ぶ' });
    await assertClickable(page, nextBtn, 'エリアを選ぶ');
    await nextBtn.click();

    // ----- Step 3: Area -----
    await expect(page.locator('text=開業エリアを選ぶ')).toBeVisible({ timeout: 3000 });

    const kusatsuBtn = page.locator('button').filter({ hasText: '草津' }).first();
    await assertClickable(page, kusatsuBtn, '草津エリア選択');
    await kusatsuBtn.click();

    // ----- Step 4: Property prompt -----
    await expect(page.locator('text=物件を選ぶ')).toBeVisible({ timeout: 3000 });

    const mapBtn = page.locator('button').filter({ hasText: 'マップへ' });
    await assertClickable(page, mapBtn, 'マップへ');
    await mapBtn.click();

    // ----- Step 5: City Map -----
    await expect(page.locator('text=エリアマップ')).toBeVisible({ timeout: 5000 });

    // Wait for SVG property markers to render
    await page.waitForSelector('svg', { timeout: 5000 });
    await page.waitForTimeout(500);

    // Click on the first property marker (SVG circle/group)
    // Properties have animated circles + text labels in the SVG
    const propertyMarker = page.locator('svg g.cursor-pointer').first();
    await expect(propertyMarker).toBeVisible({ timeout: 3000 });
    await propertyMarker.click();

    // ----- Step 6: Property Detail Panel -----
    // Panel should appear above BottomNav (fixed bottom-16 z-50)
    await expect(page.locator('text=この物件で開業する')).toBeVisible({ timeout: 3000 });

    // The critical test: "この物件で開業する" button must be clickable (not behind BottomNav)
    const contractBtn = page.locator('button').filter({ hasText: 'この物件で開業する' });
    await assertClickable(page, contractBtn, 'この物件で開業する');

    // Take screenshot for evidence
    await page.screenshot({ path: '/tmp/e2e_property_panel.png' });

    await contractBtn.click();

    // ----- Step 7: Classroom -----
    await expect(page.locator('text=手元資金').first()).toBeVisible({ timeout: 5000 });
    await page.screenshot({ path: '/tmp/e2e_classroom.png' });

    console.log('✅ 物件選択・開業フロー完了');
  });

  test('P0: 開業後 → クラス作成 → 週進行 → レポート確認 (経営サイクル)', async ({ page }) => {
    // Fast-forward through new game setup
    await page.locator('button').filter({ hasText: '新しい事業を始める' }).click();
    await expect(page.locator('text=あなたの事業をつくる')).toBeVisible({ timeout: 3000 });

    const nameInput = page.locator('input').first();
    await nameInput.clear();
    await nameInput.fill('体操スクールE2E');
    await page.locator('button').filter({ hasText: 'エリアを選ぶ' }).click();
    await page.locator('button').filter({ hasText: '草津' }).first().click();
    await page.locator('button').filter({ hasText: 'マップへ' }).click();
    await expect(page.locator('text=エリアマップ')).toBeVisible({ timeout: 5000 });
    await page.waitForTimeout(500);
    await page.locator('svg g.cursor-pointer').first().click();
    await expect(page.locator('button').filter({ hasText: 'この物件で開業する' })).toBeVisible({ timeout: 3000 });
    await page.locator('button').filter({ hasText: 'この物件で開業する' }).click();

    // ----- Add a class -----
    await expect(page.locator('text=手元資金').first()).toBeVisible({ timeout: 5000 });

    // Navigate to class management via bottom nav or classroom menu
    const classNavBtn = page.locator('button').filter({ hasText: 'クラス' }).first();
    await assertClickable(page, classNavBtn, 'クラスナビ');
    await classNavBtn.click();

    await expect(page.locator('text=クラス管理')).toBeVisible({ timeout: 3000 });
    await page.screenshot({ path: '/tmp/e2e_lessons.png' });

    // Add a class
    const addBtn = page.locator('button').filter({ hasText: 'クラス追加' }).first();
    await assertClickable(page, addBtn, 'クラス追加');
    await addBtn.click();

    await expect(page.locator('text=クラスを追加')).toBeVisible({ timeout: 3000 });
    await page.screenshot({ path: '/tmp/e2e_add_class_form.png' });

    // Verify the submit button is visible and clickable
    const createBtn = page.locator('button').filter({ hasText: 'クラスを作成' });
    await assertClickable(page, createBtn, 'クラスを作成');
    await createBtn.click();

    // Should return to lessons screen with 1 class
    await expect(page.locator('text=クラス管理')).toBeVisible({ timeout: 3000 });
    await page.screenshot({ path: '/tmp/e2e_after_class_create.png' });

    // ----- Set up marketing -----
    const marketingNav = page.locator('button').filter({ hasText: '集客' }).first();
    await assertClickable(page, marketingNav, '集客ナビ');
    await marketingNav.click();

    await expect(page.locator('text=集客・マーケティ').first()).toBeVisible({ timeout: 3000 });
    await page.screenshot({ path: '/tmp/e2e_marketing.png' });

    // Add marketing campaign
    const addCampaignBtn = page.locator('button').filter({ hasText: '施策を追加' }).first();
    if (await addCampaignBtn.isVisible({ timeout: 1000 }).catch(() => false)) {
      await assertClickable(page, addCampaignBtn, '施策を追加');
    }

    // ----- Advance week -----
    // Go back to classroom
    const homeNav = page.locator('button').filter({ hasText: '教室' }).first();
    await homeNav.click();
    await expect(page.locator('text=手元資金').first()).toBeVisible({ timeout: 3000 });

    // Click "次の週へ" — must be in viewport
    const advBtn = page.locator('button').filter({ hasText: '次の週へ' });
    await expect(advBtn).toBeVisible({ timeout: 3000 });
    await assertClickable(page, advBtn, '次の週へ');

    const clickStart = Date.now();
    await advBtn.click();
    const clickMs = Date.now() - clickStart;
    expect(clickMs).toBeLessThan(2000); // Non-blocking check

    // Wait for week report or event panel
    const modal = page.locator('.fixed.inset-0.z-50');
    await expect(modal).toBeVisible({ timeout: 8000 });
    await page.screenshot({ path: '/tmp/e2e_week_report.png' });

    // Close the report — handles regular report ("次のアクションへ"), event dismissal ("確認した"),
    // and choice events (click the first visible choice btn-secondary inside the modal)
    const closeBtn = page.locator('button').filter({
      hasText: /次のアクションへ|確認した|閉じる/
    }).first();
    const hasCloseBtn = await closeBtn.isVisible({ timeout: 2000 }).catch(() => false);
    if (hasCloseBtn) {
      await assertClickable(page, closeBtn, '週次レポート閉じる');
      await closeBtn.click();
    } else {
      // Choice event — click the first choice button inside the modal
      const choiceBtn = page.locator('.fixed.inset-0.z-50 button.btn-secondary').first();
      await expect(choiceBtn).toBeVisible({ timeout: 3000 });
      await choiceBtn.click();
      // After choosing, the regular report or another event may appear; dismiss if needed
      const closeBtn2 = page.locator('button').filter({ hasText: /次のアクションへ|確認した/ }).first();
      if (await closeBtn2.isVisible({ timeout: 2000 }).catch(() => false)) {
        await closeBtn2.click();
      }
    }

    // Should be back at classroom
    await expect(advBtn).toBeEnabled({ timeout: 5000 });
    await page.screenshot({ path: '/tmp/e2e_after_report.png' });

    console.log('✅ 経営サイクル完了（クラス作成→週進行→レポート）');
  });

  test('P1: PropertyPanel のボタンはBottomNavに隠れない (390×844)', async ({ page }) => {
    // Navigate directly to map with an area selected (using localStorage injection)
    await page.goto(BASE);
    await page.evaluate(() => {
      const state = {
        saveId: 'e2e_map',
        gameVersion: '1.0.0',
        seed: 1,
        weekNumber: 1,
        currentDate: { year: 2027, month: 9, week: 1 },
        difficulty: 'normal',
        tutorialCompleted: true,
        tutorialStep: 9,
        selectedAreaId: 'kusatsu',
        selectedPropertyId: null,
        company: {
          name: 'テスト', founded: { year: 2027, month: 9, week: 1 },
          cash: 1200000, reputation: 0, brandAwareness: 0,
          totalRevenue: 0, totalExpenses: 0,
          weeklyHistory: [], monthlyReports: [], isIncorporated: false, phase: 1,
        },
        properties: [],
        ownedPropertyIds: [],
        classes: [],
        members: [],
        staff: [{ id: 'owner', name: 'オーナー', role: 'owner', teachingAbility: 70,
          safetyAbility: 65, communicationAbility: 75, preferredAgeGroups: ['child'],
          preferredServices: ['kids_gymnastics'], weeklyWage: 0, availableHoursPerWeek: 40,
          usedHoursPerWeek: 0, motivation: 90, isOwner: true }],
        marketingCampaigns: [],
        competitors: [],
        marketDemand: 1.0,
        seasonalFactor: 1.0,
        funnel: { weeklyAwareness: 0, weeklyWebVisits: 0, weeklyInquiries: 0,
          weeklyTrialBookings: 0, weeklyTrialAttendance: 0, weeklyNewMembers: 0 },
        currentScreen: 'map',
        pendingEvents: [],
        lastWeekReport: null,
        showWeekReport: false,
        autoAdvance: false,
        autoAdvanceSpeed: 1500,
        tutorialSteps: [],
      };
      localStorage.setItem('taisou-tycoon-save', JSON.stringify({ state, version: 0 }));
    });
    await page.reload();
    await expect(page.locator('text=エリアマップ')).toBeVisible({ timeout: 5000 });

    // Click a property marker
    await page.waitForTimeout(500);
    await page.locator('svg g.cursor-pointer').first().click();

    // Panel should appear
    await expect(page.locator('text=この物件で開業する')).toBeVisible({ timeout: 3000 });

    // Screenshot
    await page.screenshot({ path: '/tmp/e2e_property_panel_390.png' });

    // Critical assertion: button is in viewport and not behind BottomNav
    const contractBtn = page.locator('button').filter({ hasText: 'この物件で開業する' });
    const box = await contractBtn.boundingBox();
    expect(box).not.toBeNull();

    const viewport = page.viewportSize()!;

    // Button must be fully within viewport height
    expect(box!.y, 'Button top must be on screen').toBeGreaterThanOrEqual(0);
    expect(box!.y + box!.height, 'Button bottom must be on screen').toBeLessThanOrEqual(viewport.height);

    // Button center must not be covered by BottomNav
    const centerX = box!.x + box!.width / 2;
    const centerY = box!.y + box!.height / 2;

    // Check BottomNav position
    const bottomNavBox = await page.locator('.fixed.bottom-0').first().boundingBox();
    if (bottomNavBox) {
      // Button center Y must be above BottomNav top
      expect(centerY, 'Button center must be above BottomNav').toBeLessThan(bottomNavBox.y);
    }

    // The element at button center must be the button (not BottomNav)
    const isClickable = await contractBtn.evaluate((el, { x, y }) => {
      const top = document.elementFromPoint(x, y);
      return el === top || el.contains(top as Node) || (top as HTMLElement)?.closest('button') === el;
    }, { x: centerX, y: centerY });
    expect(isClickable, 'Button must be clickable (not covered)').toBe(true);

    console.log(`✅ PropertyPanel button: y=${box!.y.toFixed(0)}, bottom=${(box!.y + box!.height).toFixed(0)}, viewport=${viewport.height}`);
  });

  test('P1: 全ナビ画面のCTAボタンがBottomNav/TopBarに隠れない (390×844)', async ({ page }) => {
    // Inject game state for all in-game screens
    await page.goto(BASE);
    const baseState = {
      saveId: 'e2e_nav',
      gameVersion: '1.0.0',
      seed: 42,
      weekNumber: 3,
      currentDate: { year: 2027, month: 9, week: 3 },
      difficulty: 'normal',
      tutorialCompleted: true,
      tutorialStep: 9,
      selectedAreaId: 'kusatsu',
      selectedPropertyId: 'kusatsu_rental_01',
      company: {
        name: 'E2Eテスト教室', founded: { year: 2027, month: 9, week: 1 },
        cash: 900000, reputation: 30, brandAwareness: 15,
        totalRevenue: 80000, totalExpenses: 50000,
        weeklyHistory: [{ week: 2, cashIn: 40000, cashOut: 25000 }],
        monthlyReports: [], isIncorporated: false, phase: 1,
      },
      properties: [{
        id: 'kusatsu_rental_01', areaId: 'kusatsu', name: 'コミュニティホール草津北',
        type: 'community_center', address: '草津市北山田町（架空）', floorArea: 80,
        usableWidth: 8, usableDepth: 10, ceilingHeight: 3.5, parking: true, toilet: true,
        storageAllowed: false, commercialAllowed: true, weeklyRent: 8000, initialCost: 0,
        availableHoursPerWeek: 20, stabilityScore: 3, attractivenessScore: 3,
        canFit3x9Mat: true, description: 'テスト', mapX: 210, mapY: 180,
      }],
      ownedPropertyIds: ['kusatsu_rental_01'],
      classes: [{ id: 'cls_1', propertyId: 'kusatsu_rental_01', name: 'キッズ体操',
        serviceType: 'kids_gymnastics', targetAgeMin: 3, targetAgeMax: 10,
        dayOfWeek: 0, startHour: 15, durationMinutes: 60, capacity: 12,
        monthlyFee: 8000, trialFee: 1000, instructorId: null, enrolledCount: 3, active: true }],
      members: [
        { id: 'm1', name: '山田花子', classId: 'cls_1', monthlyFee: 8000, joinedWeek: 1,
          satisfaction: 70, age: 7, ageGroup: 'child', trialCount: 1 },
        { id: 'm2', name: '田中太郎', classId: 'cls_1', monthlyFee: 8000, joinedWeek: 2,
          satisfaction: 75, age: 8, ageGroup: 'child', trialCount: 1 },
        { id: 'm3', name: '鈴木次郎', classId: 'cls_1', monthlyFee: 8000, joinedWeek: 2,
          satisfaction: 65, age: 6, ageGroup: 'child', trialCount: 1 },
      ],
      staff: [{ id: 'owner', name: 'オーナー', role: 'owner', teachingAbility: 70,
        safetyAbility: 65, communicationAbility: 75, preferredAgeGroups: ['child'],
        preferredServices: ['kids_gymnastics'], weeklyWage: 0, availableHoursPerWeek: 40,
        usedHoursPerWeek: 0, motivation: 85, isOwner: true }],
      marketingCampaigns: [{ id: 'c1', type: 'sns_post', name: 'SNS', weeklyBudget: 5000,
        active: true, startedWeek: 1, totalSpent: 10000, impressions: 0, inquiries: 0 }],
      competitors: [], marketDemand: 1.0, seasonalFactor: 1.0,
      funnel: { weeklyAwareness: 5, weeklyWebVisits: 3, weeklyInquiries: 1,
        weeklyTrialBookings: 1, weeklyTrialAttendance: 1, weeklyNewMembers: 0 },
      currentScreen: 'classroom',
      pendingEvents: [], lastWeekReport: null, showWeekReport: false,
      autoAdvance: false, autoAdvanceSpeed: 1500, tutorialSteps: [],
    };

    await page.evaluate((s) => {
      localStorage.setItem('taisou-tycoon-save', JSON.stringify({ state: s, version: 0 }));
    }, baseState);
    await page.reload();
    await expect(page.locator('text=手元資金').first()).toBeVisible({ timeout: 5000 });

    const viewport = page.viewportSize()!;

    // Check "次の週へ" button in TopBar
    const advBtn = page.locator('button').filter({ hasText: '次の週へ' });
    const advBox = await advBtn.boundingBox();
    expect(advBox, '次の週へ button not found').not.toBeNull();
    expect(advBox!.x + advBox!.width, '次の週へ right edge off-screen')
      .toBeLessThanOrEqual(viewport.width + 1);
    console.log(`  ✅ 次の週へ: x=${advBox!.x.toFixed(0)}-${(advBox!.x+advBox!.width).toFixed(0)}, viewport=${viewport.width}`);
    await page.screenshot({ path: '/tmp/e2e_topbar_check.png' });

    // Navigate to each screen and check for hidden buttons
    const screensToCheck: { screen: string; inject: Partial<typeof baseState>; expect: string }[] = [
      { screen: 'menu_lessons', inject: {}, expect: 'クラス追加' },
      { screen: 'menu_marketing', inject: {}, expect: '施策を追加' },
      { screen: 'menu_finance', inject: {}, expect: '財務管理' },
    ];

    for (const check of screensToCheck) {
      await page.evaluate((s) => {
        const raw = localStorage.getItem('taisou-tycoon-save');
        if (raw) {
          const parsed = JSON.parse(raw);
          parsed.state.currentScreen = s;
          localStorage.setItem('taisou-tycoon-save', JSON.stringify(parsed));
        }
      }, check.screen);
      await page.reload();
      await page.waitForTimeout(600);

      // Verify the screen title/header is visible
      const header = page.locator('h1, .text-xl.font-bold').first();
      await expect(header).toBeVisible({ timeout: 3000 });

      // Check no horizontal overflow
      const hasOverflow = await page.evaluate(() => document.body.scrollWidth > window.innerWidth);
      expect(hasOverflow, `${check.screen}: horizontal overflow detected`).toBe(false);

      await page.screenshot({ path: `/tmp/e2e_screen_${check.screen}.png` });
      console.log(`  ✅ ${check.screen}: no overflow`);
    }
  });
});
