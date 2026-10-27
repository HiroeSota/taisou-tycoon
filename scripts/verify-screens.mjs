import { chromium } from '@playwright/test';

const BASE = 'http://localhost:5179';

const BASE_STATE = {
  saveId: 'verify_v3', gameVersion: '1.0.0', seed: 42,
  weekNumber: 8, currentDate: { year: 2027, month: 11, week: 2 },
  difficulty: 'normal', tutorialCompleted: true, tutorialStep: 9,
  selectedAreaId: 'kusatsu', selectedPropertyId: 'kusatsu_rental_01',
  company: {
    name: 'テスト体操教室', founded: { year: 2027, month: 9, week: 1 },
    cash: 850000, reputation: 45, brandAwareness: 25,
    totalRevenue: 320000, totalExpenses: 280000,
    weeklyHistory: [{ week: 7, cashIn: 80000, cashOut: 45000 }],
    monthlyReports: [], isIncorporated: false, phase: 2,
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
  classes: [
    { id: 'cls_1', propertyId: 'kusatsu_rental_01', name: 'キッズ体操（月）', serviceType: 'kids_gymnastics',
      targetAgeMin: 3, targetAgeMax: 10, dayOfWeek: 0, startHour: 15, durationMinutes: 60,
      capacity: 12, monthlyFee: 8000, trialFee: 1000, instructorId: null, enrolledCount: 0, active: true },
    { id: 'cls_2', propertyId: 'kusatsu_rental_01', name: 'キッズ体操（水）', serviceType: 'kids_gymnastics',
      targetAgeMin: 3, targetAgeMax: 10, dayOfWeek: 2, startHour: 16, durationMinutes: 60,
      capacity: 12, monthlyFee: 8000, trialFee: 1000, instructorId: null, enrolledCount: 0, active: true },
  ],
  members: Array.from({ length: 16 }, (_, i) => ({
    id: `m${i}`, name: `会員${i+1}`, classId: i < 9 ? 'cls_1' : 'cls_2',
    monthlyFee: 8000, joinedWeek: 3, satisfaction: 65 + (i % 20),
    age: 6 + (i % 8), ageGroup: 'child', trialCount: 1,
  })),
  staff: [{
    id: 'owner', name: '佐藤 健太', role: 'owner', teachingAbility: 70,
    safetyAbility: 65, communicationAbility: 75, preferredAgeGroups: ['child'],
    preferredServices: ['kids_gymnastics'], weeklyWage: 0, availableHoursPerWeek: 40,
    usedHoursPerWeek: 0, motivation: 85, isOwner: true,
  }],
  marketingCampaigns: [{
    id: 'camp_1', type: 'sns_post', name: 'SNS投稿', weeklyBudget: 5000,
    active: true, startedWeek: 1, totalSpent: 35000, impressions: 0, inquiries: 0,
  }],
  competitors: [], marketDemand: 1.0, seasonalFactor: 1.2,
  funnel: { weeklyAwareness: 12, weeklyWebVisits: 8, weeklyInquiries: 2,
    weeklyTrialBookings: 1, weeklyTrialAttendance: 1, weeklyNewMembers: 0 },
  currentScreen: 'classroom',
  pendingEvents: [], lastWeekReport: null, showWeekReport: false,
  autoAdvance: false, autoAdvanceSpeed: 1500, tutorialSteps: [],
};

async function shot(page, name, label) {
  const p = `/tmp/screen_${name}.png`;
  await page.screenshot({ path: p });
  console.log(`  📷 [${label}] ${p}`);
}

async function loadScreen(page, screen) {
  const state = { ...BASE_STATE, currentScreen: screen };
  // Navigate to page first, then set localStorage, then reload
  const currentUrl = page.url();
  if (!currentUrl.startsWith(BASE)) {
    await page.goto(BASE);
    await page.waitForLoadState('domcontentloaded');
  }
  await page.evaluate((s) => {
    localStorage.setItem('taisou-tycoon-save', JSON.stringify({ state: s, version: 0 }));
  }, state);
  await page.reload();
  await page.waitForTimeout(700);
}

const browser = await chromium.launch({ headless: true });
const page = await browser.newPage({ viewport: { width: 390, height: 844 } });

try {
  // First, go to BASE so we're on the right origin
  await page.goto(BASE);
  await page.waitForLoadState('domcontentloaded');

  // ===== 1. Classroom =====
  console.log('[1] クラスルーム');
  await loadScreen(page, 'classroom');
  await shot(page, '01_classroom', 'クラスルーム');

  // Verify button position
  const btnPos = await page.evaluate(() => {
    const b = Array.from(document.querySelectorAll('button')).find(b => b.textContent.includes('次の週へ'));
    if (!b) return null;
    const r = b.getBoundingClientRect();
    return { left: Math.round(r.left), right: Math.round(r.right), inViewport: r.right <= window.innerWidth };
  });
  console.log(`  次の週へ: left=${btnPos?.left} right=${btnPos?.right} inViewport=${btnPos?.inViewport}`);

  // ===== 2. Advance week =====
  console.log('[2] 週進行');
  await page.evaluate(() => {
    const b = Array.from(document.querySelectorAll('button')).find(b => b.textContent.includes('次の週へ'));
    b?.click();
  });
  try {
    await page.waitForSelector('.fixed.inset-0', { timeout: 6000 });
    await shot(page, '02_week_report', '週次レポート');
    for (const text of ['次のアクションへ', '確認した', '閉じる']) {
      const b = page.locator(`button:has-text("${text}")`).first();
      if (await b.isVisible({ timeout: 400 }).catch(() => false)) { await b.click(); break; }
    }
    await page.waitForTimeout(400);
  } catch {
    await shot(page, '02_no_modal', '週進行後（モーダルなし）');
  }

  // ===== 3. クラス管理 =====
  console.log('[3] クラス管理');
  await loadScreen(page, 'menu_lessons');
  await shot(page, '03_lessons', 'クラス管理');

  const addClassBtn = page.locator('button').filter({ hasText: 'クラス追加' }).first();
  if (await addClassBtn.isVisible({ timeout: 2000 }).catch(() => false)) {
    await addClassBtn.click();
    await page.waitForTimeout(500);
    await shot(page, '04_class_form', 'クラス追加フォーム（担当講師選択）');
    const cancelBtn = page.locator('button').filter({ hasText: 'キャンセル' }).first();
    if (await cancelBtn.isVisible({ timeout: 400 }).catch(() => false)) await cancelBtn.click();
  }

  // ===== 4. スタッフ管理 =====
  console.log('[4] スタッフ管理');
  await loadScreen(page, 'menu_staff');
  await shot(page, '05_staff', 'スタッフ管理');

  const hireBtn = page.locator('button').filter({ hasText: '採用' }).first();
  if (await hireBtn.isVisible({ timeout: 2000 }).catch(() => false)) {
    await hireBtn.click();
    await page.waitForTimeout(500);
    await shot(page, '06_hire_list', 'スタッフ採用一覧');

    const previewBtn = page.locator('button').filter({ hasText: '詳細を確認' }).first();
    if (await previewBtn.isVisible({ timeout: 1000 }).catch(() => false)) {
      await previewBtn.click();
      await page.waitForTimeout(500);
      await shot(page, '07_hire_preview', '採用意思決定プレビュー');

      const backBtn = page.locator('button').filter({ hasText: '戻る' }).first();
      if (await backBtn.isVisible({ timeout: 400 }).catch(() => false)) await backBtn.click();
    }
    const cancelBtn = page.locator('button').filter({ hasText: 'キャンセル' }).first();
    if (await cancelBtn.isVisible({ timeout: 400 }).catch(() => false)) await cancelBtn.click();
  }

  // ===== 5. ファイナンス =====
  console.log('[5] ファイナンス');
  await loadScreen(page, 'menu_finance');
  await shot(page, '08_finance', 'ファイナンス');

  // ===== 6. マーケティング =====
  console.log('[6] マーケティング');
  await loadScreen(page, 'menu_marketing');
  await shot(page, '09_marketing', 'マーケティング');

  console.log('\n✅ 全スクリーンショット完了');

} catch (e) {
  console.error('❌', e.message);
  try { await page.screenshot({ path: '/tmp/screen_error.png' }); } catch {}
} finally {
  await browser.close();
}
