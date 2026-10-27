import { chromium } from '@playwright/test';

const BASE = 'http://localhost:5179';

const MAP_STATE = {
  saveId: 'audit2', gameVersion: '1.0.0', seed: 42,
  weekNumber: 1, currentDate: { year: 2027, month: 9, week: 1 },
  difficulty: 'normal', tutorialCompleted: true, tutorialStep: 9,
  selectedAreaId: 'kusatsu', selectedPropertyId: null,
  company: {
    name: '体操テスト教室', founded: { year: 2027, month: 9, week: 1 },
    cash: 1000000, reputation: 30, brandAwareness: 10,
    totalRevenue: 0, totalExpenses: 0, weeklyHistory: [],
    monthlyReports: [], isIncorporated: false, phase: 1,
  },
  properties: [
    { id: 'kusatsu_rental_01', areaId: 'kusatsu', name: 'コミュニティホール草津北',
      type: 'community_center', address: '草津市北山田町（架空）', floorArea: 80,
      usableWidth: 8, usableDepth: 10, ceilingHeight: 3.5, parking: true, toilet: true,
      storageAllowed: false, commercialAllowed: true, weeklyRent: 8000, initialCost: 0,
      availableHoursPerWeek: 20, stabilityScore: 3, attractivenessScore: 3,
      canFit3x9Mat: true, description: 'テスト', mapX: 210, mapY: 180 },
    { id: 'kusatsu_studio_01', areaId: 'kusatsu', name: 'スタジオKクサツ',
      type: 'studio', address: '草津市大路（架空）', floorArea: 120,
      usableWidth: 10, usableDepth: 12, ceilingHeight: 4.0, parking: true, toilet: true,
      storageAllowed: true, commercialAllowed: true, weeklyRent: 28000, initialCost: 150000,
      availableHoursPerWeek: 40, stabilityScore: 5, attractivenessScore: 4,
      canFit3x9Mat: true, description: '本格スタジオ', mapX: 280, mapY: 120 },
    { id: 'kusatsu_vacant_01', areaId: 'kusatsu', name: '旧衣料品店（空き店舗）',
      type: 'vacant_store', address: '草津市渋川（架空）', floorArea: 95,
      usableWidth: 9, usableDepth: 10, ceilingHeight: 3.2, parking: false, toilet: true,
      storageAllowed: true, commercialAllowed: true, weeklyRent: 15000, initialCost: 80000,
      availableHoursPerWeek: 60, stabilityScore: 4, attractivenessScore: 3,
      canFit3x9Mat: true, description: '空き店舗', mapX: 240, mapY: 240 },
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
  currentScreen: 'map',
  pendingEvents: [], lastWeekReport: null, showWeekReport: false,
  autoAdvance: false, autoAdvanceSpeed: 1500, tutorialSteps: [],
};

const VIEWPORTS = [
  { width: 390, height: 844, name: 'mobile' },
  { width: 1440, height: 900, name: 'desktop' },
  { width: 1536, height: 960, name: 'pc1536' },
];

const browser = await chromium.launch({ headless: true });

for (const vp of VIEWPORTS) {
  console.log(`\n=== ${vp.name} (${vp.width}x${vp.height}) ===`);
  const page = await browser.newPage({ viewport: { width: vp.width, height: vp.height } });

  await page.goto(BASE);
  await page.waitForLoadState('domcontentloaded');
  await page.evaluate((s) => {
    localStorage.setItem('taisou-tycoon-save', JSON.stringify({ state: s, version: 0 }));
  }, MAP_STATE);
  await page.reload();
  await page.waitForTimeout(800);

  // Screenshot empty map
  await page.screenshot({ path: `/tmp/map_empty_${vp.name}.png` });

  // Get SVG bounding rect and compute actual screen coords for property at mapX:210, mapY:180
  const clickCoords = await page.evaluate(() => {
    const svg = document.querySelector('svg');
    if (!svg) return null;
    const r = svg.getBoundingClientRect();
    // SVG viewBox is "0 0 400 350"
    const scaleX = r.width / 400;
    const scaleY = r.height / 350;
    return {
      x: r.left + 210 * scaleX,
      y: r.top + 180 * scaleY,
      svgLeft: r.left, svgTop: r.top, svgW: r.width, svgH: r.height,
    };
  });
  console.log('SVG click coords:', JSON.stringify(clickCoords));

  if (clickCoords) {
    // Click at the property marker
    await page.mouse.click(clickCoords.x, clickCoords.y);
    await page.waitForTimeout(500);
    await page.screenshot({ path: `/tmp/map_panel_${vp.name}.png` });

    // Analyze the button situation
    const analysis = await page.evaluate(() => {
      const btn = Array.from(document.querySelectorAll('button'))
        .find(b => b.textContent.includes('この物件で開業する'));
      const panel = document.querySelector('[class*="absolute"][class*="bottom-0"]');
      const bottomNav = document.querySelector('[class*="fixed"][class*="bottom-0"]');

      if (!btn) return { panelOpen: !!panel, btnFound: false, bottomNavFound: !!bottomNav };

      const br = btn.getBoundingClientRect();
      const pr = panel?.getBoundingClientRect();
      const nr = bottomNav?.getBoundingClientRect();
      const vh = window.innerHeight;
      const vw = window.innerWidth;

      // What's at the center of the button?
      const cx = br.left + br.width / 2;
      const cy = br.top + br.height / 2;
      const topEl = document.elementFromPoint(cx, cy);

      return {
        panelOpen: true,
        btnFound: true,
        btn: { top: Math.round(br.top), bottom: Math.round(br.bottom), left: Math.round(br.left), right: Math.round(br.right) },
        panel: pr ? { top: Math.round(pr.top), bottom: Math.round(pr.bottom) } : null,
        bottomNav: nr ? { top: Math.round(nr.top), bottom: Math.round(nr.bottom) } : null,
        vh, vw,
        btnInViewport: br.bottom <= vh && br.top >= 0,
        topElAtBtnCenter: topEl?.tagName + '.' + (topEl?.className?.split(' ')[0] ?? ''),
        btnClickable: topEl === btn || btn.contains(topEl),
        // Is bottom nav covering the button?
        navCoversBtn: nr ? (nr.top < br.bottom && nr.bottom > br.top) : false,
      };
    });
    console.log('Panel analysis:', JSON.stringify(analysis, null, 2));
  }

  await page.close();
}

await browser.close();
console.log('\nDone. Screenshots in /tmp/map_*.png');
