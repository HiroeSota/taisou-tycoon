import { chromium } from '@playwright/test';
const BASE = 'http://localhost:5179';

// Real kusatsu properties with actual descriptions
const MAP_STATE_REAL = {
  saveId: 'audit4', gameVersion: '1.0.0', seed: 42,
  weekNumber: 1, currentDate: { year: 2027, month: 9, week: 1 },
  difficulty: 'normal', tutorialCompleted: true, tutorialStep: 9,
  selectedAreaId: 'kusatsu', selectedPropertyId: null,
  company: { name: '体操テスト教室', founded: { year: 2027, month: 9, week: 1 },
    cash: 1000000, reputation: 30, brandAwareness: 10, totalRevenue: 0, totalExpenses: 0,
    weeklyHistory: [], monthlyReports: [], isIncorporated: false, phase: 1 },
  properties: [
    { id: 'kusatsu_rental_01', areaId: 'kusatsu', name: 'コミュニティホール草津北',
      type: 'community_center', address: '草津市北山田町（架空）', floorArea: 80,
      usableWidth: 8, usableDepth: 10, ceilingHeight: 3.5, parking: true, toilet: true,
      storageAllowed: false, commercialAllowed: true, weeklyRent: 8000, initialCost: 0,
      availableHoursPerWeek: 20, stabilityScore: 3, attractivenessScore: 3,
      canFit3x9Mat: true,
      description: '市の施設。安く借りられるが、週20時間の使用制限あり。マット保管不可のため毎回搬入が必要。',
      mapX: 210, mapY: 180 },
    { id: 'kusatsu_studio_01', areaId: 'kusatsu', name: 'スタジオKクサツ',
      type: 'studio', address: '草津市大路（架空）', floorArea: 120,
      usableWidth: 10, usableDepth: 12, ceilingHeight: 4.0, parking: true, toilet: true,
      storageAllowed: true, commercialAllowed: true, weeklyRent: 28000, initialCost: 150000,
      availableHoursPerWeek: 40, stabilityScore: 5, attractivenessScore: 4,
      canFit3x9Mat: true,
      description: '駅近のレンタルスタジオ。広い面積と高い天井で体操に最適。設備保管も可能。賃料は高め。',
      mapX: 280, mapY: 120 },
    { id: 'kusatsu_vacant_01', areaId: 'kusatsu', name: '旧衣料品店（空き店舗）',
      type: 'vacant_store', address: '草津市渋川（架空）', floorArea: 95,
      usableWidth: 9, usableDepth: 10, ceilingHeight: 2.8, parking: false, toilet: true,
      storageAllowed: true, commercialAllowed: true, weeklyRent: 15000, initialCost: 80000,
      availableHoursPerWeek: 60, stabilityScore: 4, attractivenessScore: 2,
      canFit3x9Mat: false,
      description: '商店街の空き店舗。天井高さが2.8mのためエアマット使用は難しい。改装費が必要。集客力は低め。',
      mapX: 240, mapY: 240 },
  ],
  ownedPropertyIds: [],
  classes: [], members: [],
  staff: [{ id: 'owner', name: '佐藤健太', role: 'owner', teachingAbility: 70,
    safetyAbility: 65, communicationAbility: 75, preferredAgeGroups: ['child'],
    preferredServices: ['kids_gymnastics'], weeklyWage: 0, availableHoursPerWeek: 40,
    usedHoursPerWeek: 0, motivation: 85, isOwner: true }],
  marketingCampaigns: [], competitors: [], marketDemand: 1.0, seasonalFactor: 1.2,
  funnel: { weeklyAwareness: 0, weeklyWebVisits: 0, weeklyInquiries: 0,
    weeklyTrialBookings: 0, weeklyTrialAttendance: 0, weeklyNewMembers: 0 },
  currentScreen: 'map', pendingEvents: [], lastWeekReport: null,
  showWeekReport: false, autoAdvance: false, autoAdvanceSpeed: 1500, tutorialSteps: [],
};

const browser = await chromium.launch({ headless: true });

for (const vp of [
  { w: 390, h: 844, name: 'mobile' },
  { w: 1536, h: 960, name: 'pc1536' },
]) {
  const page = await browser.newPage({ viewport: { width: vp.w, height: vp.h } });
  await page.goto(BASE);
  await page.waitForLoadState('domcontentloaded');
  await page.evaluate((s) => {
    localStorage.setItem('taisou-tycoon-save', JSON.stringify({ state: s, version: 0 }));
  }, MAP_STATE_REAL);
  await page.reload();
  await page.waitForTimeout(1000);

  // Click the first property using PointerEvent on SVG g
  await page.evaluate(() => {
    const groups = Array.from(document.querySelectorAll('svg g'));
    const clickable = groups.find(g => g.getAttribute('class')?.includes('cursor'));
    if (clickable) {
      clickable.dispatchEvent(new PointerEvent('click', { bubbles: true, cancelable: true }));
    }
  });
  await page.waitForTimeout(600);

  await page.screenshot({ path: `/tmp/map_real_${vp.name}.png` });

  const r = await page.evaluate(() => {
    const btn = Array.from(document.querySelectorAll('button'))
      .find(b => b.textContent.includes('この物件で開業する'));
    const nav = document.querySelector('[class*="fixed"][class*="bottom-0"]');
    if (!btn) return { found: false };
    const br = btn.getBoundingClientRect();
    const nr = nav?.getBoundingClientRect();
    const cx = br.left + br.width / 2;
    const cy = br.top + br.height / 2;
    const topEl = document.elementFromPoint(cx, cy);
    return {
      found: true,
      btn: { top: Math.round(br.top), bottom: Math.round(br.bottom) },
      nav: nr ? { top: Math.round(nr.top) } : null,
      vh: window.innerHeight,
      inViewport: br.bottom <= window.innerHeight,
      navCoversBtn: nr ? nr.top < br.bottom : false,
      clickable: topEl === btn || btn.contains(topEl),
      topElTag: topEl?.tagName,
      topElClasses: (topEl?.className || '').slice(0, 80),
    };
  });
  console.log(`[${vp.name}]`, JSON.stringify(r));
}

await browser.close();
