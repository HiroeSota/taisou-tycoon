import { chromium } from '@playwright/test';

const BASE = 'http://localhost:5179';
const OUT = '/tmp';

const BASE_STATE = {
  saveId: 'audit', gameVersion: '1.0.0', seed: 42,
  weekNumber: 5, currentDate: { year: 2027, month: 10, week: 1 },
  difficulty: 'normal', tutorialCompleted: true, tutorialStep: 9,
  selectedAreaId: 'kusatsu', selectedPropertyId: 'kusatsu_rental_01',
  company: {
    name: '体操テスト教室', founded: { year: 2027, month: 9, week: 1 },
    cash: 950000, reputation: 40, brandAwareness: 20,
    totalRevenue: 120000, totalExpenses: 80000,
    weeklyHistory: [{ week: 4, cashIn: 32000, cashOut: 20000 }],
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
  classes: [{
    id: 'cls_1', propertyId: 'kusatsu_rental_01', name: 'キッズ体操',
    serviceType: 'kids_gymnastics', targetAgeMin: 3, targetAgeMax: 10,
    dayOfWeek: 0, startHour: 15, durationMinutes: 60, capacity: 12,
    monthlyFee: 8000, trialFee: 1000, instructorId: null, enrolledCount: 0, active: true,
  }],
  members: [
    { id: 'm1', name: '山田花子', classId: 'cls_1', monthlyFee: 8000, joinedWeek: 2, satisfaction: 70, age: 7, ageGroup: 'child', trialCount: 1 },
    { id: 'm2', name: '田中太郎', classId: 'cls_1', monthlyFee: 8000, joinedWeek: 3, satisfaction: 75, age: 8, ageGroup: 'child', trialCount: 1 },
  ],
  staff: [{
    id: 'owner', name: '佐藤健太', role: 'owner', teachingAbility: 70,
    safetyAbility: 65, communicationAbility: 75, preferredAgeGroups: ['child'],
    preferredServices: ['kids_gymnastics'], weeklyWage: 0, availableHoursPerWeek: 40,
    usedHoursPerWeek: 0, motivation: 85, isOwner: true,
  }],
  marketingCampaigns: [{
    id: 'c1', type: 'sns_post', name: 'SNS投稿', weeklyBudget: 5000,
    active: true, startedWeek: 1, totalSpent: 20000, impressions: 0, inquiries: 0,
  }],
  competitors: [], marketDemand: 1.0, seasonalFactor: 1.2,
  funnel: { weeklyAwareness: 8, weeklyWebVisits: 5, weeklyInquiries: 1, weeklyTrialBookings: 1, weeklyTrialAttendance: 1, weeklyNewMembers: 0 },
  currentScreen: 'classroom',
  pendingEvents: [], lastWeekReport: null, showWeekReport: false,
  autoAdvance: false, autoAdvanceSpeed: 1500, tutorialSteps: [],
};

const VIEWPORTS = [
  { width: 390, height: 844, name: 'mobile' },
  { width: 1440, height: 900, name: 'desktop' },
];

const SCREENS = [
  'classroom', 'menu_lessons', 'menu_members', 'menu_marketing',
  'menu_staff', 'menu_finance', 'menu_strategy',
];

const findings = [];

async function injectAndLoad(page, state) {
  await page.goto(BASE);
  await page.waitForLoadState('domcontentloaded');
  await page.evaluate((s) => {
    localStorage.setItem('taisou-tycoon-save', JSON.stringify({ state: s, version: 0 }));
  }, state);
  await page.reload();
  await page.waitForTimeout(600);
}

async function checkCTA(page, screen, vpName) {
  const ctaTexts = ['この物件で開業する', 'クラスを作成', '採用する', 'クラス追加', '集客施策を追加'];
  const results = [];
  for (const text of ctaTexts) {
    const found = await page.evaluate((t) => {
      const btns = Array.from(document.querySelectorAll('button, a'));
      const el = btns.find(b => b.textContent.includes(t));
      if (!el) return null;
      const r = el.getBoundingClientRect();
      const vw = window.innerWidth;
      const vh = window.innerHeight;
      return {
        text: t,
        left: Math.round(r.left), right: Math.round(r.right),
        top: Math.round(r.top), bottom: Math.round(r.bottom),
        inViewport: r.right <= vw && r.bottom <= vh && r.left >= 0 && r.top >= 0,
        vw, vh,
      };
    }, text);
    if (found) results.push(found);
  }
  return results;
}

async function checkOverlap(page) {
  // Check if any fixed element overlaps main content buttons
  return await page.evaluate(() => {
    const fixedEls = Array.from(document.querySelectorAll('*')).filter(el => {
      const s = window.getComputedStyle(el);
      return s.position === 'fixed' && el.offsetHeight > 0;
    });
    const btns = Array.from(document.querySelectorAll('button')).filter(b => {
      const r = b.getBoundingClientRect();
      return r.width > 0 && r.height > 0;
    });
    const overlaps = [];
    for (const btn of btns) {
      const br = btn.getBoundingClientRect();
      for (const fixed of fixedEls) {
        const fr = fixed.getBoundingClientRect();
        const overlaps_x = br.left < fr.right && br.right > fr.left;
        const overlaps_y = br.top < fr.bottom && br.bottom > fr.top;
        if (overlaps_x && overlaps_y && fixed !== btn && !fixed.contains(btn)) {
          overlaps.push({
            button: btn.textContent.trim().slice(0, 30),
            fixedEl: fixed.className.slice(0, 60),
            btnBottom: Math.round(br.bottom),
            fixedTop: Math.round(fr.top),
          });
        }
      }
    }
    return overlaps;
  });
}

const browser = await chromium.launch({ headless: true });

for (const vp of VIEWPORTS) {
  console.log(`\n=== ${vp.name.toUpperCase()} (${vp.width}x${vp.height}) ===`);
  const page = await browser.newPage({ viewport: { width: vp.width, height: vp.height } });

  // --- Title screen (no state needed) ---
  await page.goto(BASE);
  await page.evaluate(() => localStorage.removeItem('taisou-tycoon-save'));
  await page.reload();
  await page.waitForTimeout(600);
  await page.screenshot({ path: `${OUT}/audit_title_${vp.name}.png` });
  console.log(`[title] screenshot saved`);

  // --- Map screen with property panel OPEN (the critical bug) ---
  const mapState = {
    ...BASE_STATE,
    currentScreen: 'map',
    selectedPropertyId: null,
    ownedPropertyIds: [], // not contracted yet
  };
  await injectAndLoad(page, mapState);
  await page.screenshot({ path: `${OUT}/audit_map_${vp.name}.png` });
  console.log(`[map] map screenshot saved`);

  // Click a property marker (SVG click by coordinates)
  await page.evaluate(() => {
    // Find SVG and simulate click at the property marker position (mapX:210, mapY:180)
    const svg = document.querySelector('svg');
    if (!svg) return;
    // Scale from SVG viewBox to actual element size
    const rect = svg.getBoundingClientRect();
    const scaleX = rect.width / 400;
    const scaleY = rect.height / 350;
    const clickX = rect.left + 210 * scaleX;
    const clickY = rect.top + 180 * scaleY;
    // Find the g element at that area
    const els = document.elementsFromPoint(clickX, clickY);
    for (const el of els) {
      if (el.closest('g[class*="cursor"]') || el.tagName === 'circle' || el.tagName === 'text') {
        el.dispatchEvent(new MouseEvent('click', { bubbles: true, clientX: clickX, clientY: clickY }));
        break;
      }
    }
  });
  await page.waitForTimeout(500);
  await page.screenshot({ path: `${OUT}/audit_map_panel_${vp.name}.png` });
  console.log(`[map] panel screenshot saved`);

  // Check if "この物件で開業する" button is visible and clickable
  const contractBtn = await page.evaluate(() => {
    const btn = Array.from(document.querySelectorAll('button')).find(b => b.textContent.includes('この物件で開業する'));
    if (!btn) return { found: false };
    const r = btn.getBoundingClientRect();
    const vw = window.innerWidth;
    const vh = window.innerHeight;
    // Check what element is on top at the button's center
    const cx = r.left + r.width / 2;
    const cy = r.top + r.height / 2;
    const topEl = document.elementFromPoint(cx, cy);
    const isClickable = topEl === btn || btn.contains(topEl);
    return {
      found: true,
      left: Math.round(r.left), right: Math.round(r.right),
      top: Math.round(r.top), bottom: Math.round(r.bottom),
      inViewport: r.right <= vw && r.bottom <= vh && r.left >= 0 && r.top >= 0,
      isClickable,
      topElClass: topEl?.className?.slice(0, 80) ?? '?',
      vw, vh,
    };
  });
  console.log(`[map] "この物件で開業する":`, JSON.stringify(contractBtn));
  if (contractBtn.found) {
    findings.push({ vp: vp.name, screen: 'map_panel', ...contractBtn });
  }

  // Check overlaps on map panel
  const mapOverlaps = await checkOverlap(page);
  if (mapOverlaps.length > 0) {
    console.log(`[map] OVERLAPS FOUND:`, mapOverlaps.length);
    mapOverlaps.forEach(o => console.log(`  "${o.button}" overlapped by .${o.fixedEl.split(' ')[0]}`));
  }

  // --- All other screens ---
  for (const screen of SCREENS) {
    const state = { ...BASE_STATE, currentScreen: screen };
    await injectAndLoad(page, state);
    await page.screenshot({ path: `${OUT}/audit_${screen}_${vp.name}.png` });

    const ctaResults = await checkCTA(page, screen, vp.name);
    const overlaps = await checkOverlap(page);
    const offscreen = ctaResults.filter(c => !c.inViewport);

    let status = '✅';
    if (offscreen.length > 0) { status = '❌ OFFSCREEN'; }
    else if (overlaps.length > 0) { status = '⚠️ OVERLAP'; }

    console.log(`[${screen}] ${status}${offscreen.length > 0 ? ' CTAs: ' + offscreen.map(c => c.text).join(', ') : ''}${overlaps.length > 0 ? ' overlaps:' + overlaps.length : ''}`);

    if (overlaps.length > 0) {
      overlaps.forEach(o => console.log(`    "${o.button.slice(0,20)}" vs .${o.fixedEl.split(' ')[0]}, btnBottom=${o.btnBottom} fixedTop=${o.fixedTop}`));
    }
  }

  await page.close();
}

// Also test at 1536x960 (the reported PC resolution)
console.log('\n=== PC 1536x960 (reported problem size) ===');
const pcPage = await browser.newPage({ viewport: { width: 1536, height: 960 } });
const mapStatePc = { ...BASE_STATE, currentScreen: 'map', selectedPropertyId: null, ownedPropertyIds: [] };
await injectAndLoad(pcPage, mapStatePc);
// Click property
await pcPage.evaluate(() => {
  const svg = document.querySelector('svg');
  if (!svg) return;
  const rect = svg.getBoundingClientRect();
  const scaleX = rect.width / 400;
  const scaleY = rect.height / 350;
  const clickX = rect.left + 210 * scaleX;
  const clickY = rect.top + 180 * scaleY;
  const els = document.elementsFromPoint(clickX, clickY);
  for (const el of els) {
    if (el.closest('g') || el.tagName === 'circle') {
      el.dispatchEvent(new MouseEvent('click', { bubbles: true, clientX: clickX, clientY: clickY }));
      break;
    }
  }
});
await pcPage.waitForTimeout(500);
await pcPage.screenshot({ path: `${OUT}/audit_map_panel_pc1536.png` });
const pcBtn = await pcPage.evaluate(() => {
  const btn = Array.from(document.querySelectorAll('button')).find(b => b.textContent.includes('この物件で開業する'));
  if (!btn) return { found: false };
  const r = btn.getBoundingClientRect();
  const cx = r.left + r.width / 2;
  const cy = r.top + r.height / 2;
  const topEl = document.elementFromPoint(cx, cy);
  return {
    found: true,
    bottom: Math.round(r.bottom), vh: window.innerHeight,
    inViewport: r.bottom <= window.innerHeight,
    isClickable: topEl === btn || (btn.contains(topEl) ?? false),
    topElClass: topEl?.className?.slice(0, 80),
  };
});
console.log(`[1536x960 map_panel] "この物件で開業する":`, JSON.stringify(pcBtn));
await pcPage.close();

await browser.close();

console.log('\n=== SUMMARY ===');
console.log('Critical findings:');
findings.forEach(f => {
  const issues = [];
  if (!f.inViewport) issues.push('OFF-VIEWPORT');
  if (!f.isClickable) issues.push(`NOT-CLICKABLE (top: ${f.topElClass})`);
  if (issues.length === 0) issues.push('OK');
  console.log(`  [${f.vp}] ${f.screen}: ${issues.join(', ')} (top=${f.top} bottom=${f.bottom} vh=${f.vh})`);
});
