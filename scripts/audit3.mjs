import { chromium } from '@playwright/test';
const BASE = 'http://localhost:5179';

const MAP_STATE = {
  saveId: 'audit3', gameVersion: '1.0.0', seed: 42,
  weekNumber: 1, currentDate: { year: 2027, month: 9, week: 1 },
  difficulty: 'normal', tutorialCompleted: true, tutorialStep: 9,
  selectedAreaId: 'kusatsu', selectedPropertyId: null,
  company: { name: '体操テスト教室', founded: { year: 2027, month: 9, week: 1 },
    cash: 1000000, reputation: 30, brandAwareness: 10, totalRevenue: 0, totalExpenses: 0,
    weeklyHistory: [], monthlyReports: [], isIncorporated: false, phase: 1 },
  properties: [
    { id: 'kusatsu_rental_01', areaId: 'kusatsu', name: 'コミュニティホール草津北',
      type: 'community_center', address: '草津市北山田町', floorArea: 80,
      usableWidth: 8, usableDepth: 10, ceilingHeight: 3.5, parking: true, toilet: true,
      storageAllowed: false, commercialAllowed: true, weeklyRent: 8000, initialCost: 0,
      availableHoursPerWeek: 20, stabilityScore: 3, attractivenessScore: 3,
      canFit3x9Mat: true, description: 'テスト', mapX: 210, mapY: 180 },
  ],
  ownedPropertyIds: [], classes: [], members: [],
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
  { w: 1440, h: 900, name: 'desktop' },
]) {
  const page = await browser.newPage({ viewport: { width: vp.w, height: vp.h } });
  await page.goto(BASE);
  await page.waitForLoadState('domcontentloaded');
  await page.evaluate((s) => {
    localStorage.setItem('taisou-tycoon-save', JSON.stringify({ state: s, version: 0 }));
  }, MAP_STATE);
  await page.reload();
  await page.waitForTimeout(1000);

  // Force open the panel by triggering React state via DOM event on SVG g element
  // First, find all circle elements and click the one at mapX:210 mapY:180
  const opened = await page.evaluate(() => {
    // The SVG viewBox is 0 0 400 350. mapX=210, mapY=180.
    // Find all g elements that are cursor-pointer (property markers)
    const groups = Array.from(document.querySelectorAll('svg g[class*="cursor"]'));
    console.log('g groups found:', groups.length);
    if (groups.length > 0) {
      // Click the first one (our only property)
      groups[0].dispatchEvent(new PointerEvent('click', { bubbles: true, cancelable: true }));
      return true;
    }
    // fallback: click any circle in SVG
    const circles = document.querySelectorAll('svg circle');
    for (const c of circles) {
      if (c.getAttribute('r') && parseInt(c.getAttribute('r')) > 5) {
        c.dispatchEvent(new PointerEvent('click', { bubbles: true, cancelable: true }));
        return 'circle';
      }
    }
    return false;
  });
  console.log(`[${vp.name}] panel open attempt:`, opened);
  await page.waitForTimeout(500);

  // Check if panel appeared
  const panelOpen = await page.evaluate(() => {
    return !!document.querySelector('button') &&
      Array.from(document.querySelectorAll('button')).some(b => b.textContent.includes('この物件で開業する'));
  });
  console.log(`[${vp.name}] panel open:`, panelOpen);

  await page.screenshot({ path: `/tmp/map_panel2_${vp.name}.png` });

  if (panelOpen) {
    const result = await page.evaluate(() => {
      const btn = Array.from(document.querySelectorAll('button'))
        .find(b => b.textContent.includes('この物件で開業する'));
      const nav = document.querySelector('.fixed.bottom-0');
      const panel = document.querySelector('.absolute.bottom-0, .absolute.inset-x-0.bottom-0');
      const br = btn.getBoundingClientRect();
      const nr = nav?.getBoundingClientRect();
      const pr = panel?.getBoundingClientRect();
      const cx = br.left + br.width / 2;
      const cy = br.top + br.height / 2;
      const topEl = document.elementFromPoint(cx, cy);
      return {
        btn: { top: Math.round(br.top), bottom: Math.round(br.bottom) },
        nav: nr ? { top: Math.round(nr.top), bottom: Math.round(nr.bottom) } : null,
        panel: pr ? { top: Math.round(pr.top), bottom: Math.round(pr.bottom) } : null,
        vh: window.innerHeight,
        btnInViewport: br.bottom <= window.innerHeight && br.top >= 0,
        navCoversBtn: nr ? (nr.top < br.bottom && nr.bottom > br.top) : false,
        clickable: topEl === btn || btn.contains(topEl),
        topEl: topEl?.tagName + '.' + (topEl?.className || '').slice(0, 60),
      };
    });
    console.log(`[${vp.name}] button analysis:`, JSON.stringify(result, null, 2));
  }

  await page.close();
}

await browser.close();
