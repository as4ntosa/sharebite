import { test, chromium } from '@playwright/test';
import path from 'path';
import fs from 'fs';

test.setTimeout(120000);

const VIEWPORT = { width: 390, height: 844 };
const BASE = 'http://localhost:3000';
const OUT = path.join(__dirname, 'public/screenshots');

test('capture app screenshots', async () => {
  fs.mkdirSync(OUT, { recursive: true });
  const browser = await chromium.launch();

  const shot = async (page: any, name: string) => {
    await page.waitForTimeout(1200);
    await page.screenshot({ path: `${OUT}/${name}.png` });
    console.log(`✓ ${name}.png`);
  };

  // ── Consumer flow ──────────────────────────────────────────
  const consumerCtx = await browser.newContext({ viewport: VIEWPORT });
  const cp = await consumerCtx.newPage();

  // Set consumer session directly via localStorage
  await cp.goto(BASE);
  await cp.evaluate(() => {
    localStorage.setItem('nibblen_user', JSON.stringify({
      id: 'user-1',
      email: 'alex@example.com',
      name: 'Alex Kim',
      role: 'consumer',
      city: 'San Francisco',
      zipCode: '94102',
    }));
  });

  // Landing
  await cp.goto(BASE);
  await shot(cp, '01-landing');

  // Login page
  await cp.goto(`${BASE}/login`);
  await shot(cp, '02-login');

  // Home feed
  await cp.goto(`${BASE}/home`);
  await cp.waitForLoadState('networkidle');
  await shot(cp, '03-consumer-home');

  // Search
  await cp.goto(`${BASE}/search`);
  await cp.waitForLoadState('networkidle');
  await shot(cp, '04-search');

  // Listing detail — grab first listing link
  await cp.goto(`${BASE}/home`);
  await cp.waitForLoadState('networkidle');
  const href = await cp.getAttribute('a[href*="/listing/"]', 'href');
  if (href) {
    await cp.goto(`${BASE}${href}`);
    await cp.waitForLoadState('networkidle');
    await shot(cp, '05-listing-detail');
  }

  // Reservations
  await cp.goto(`${BASE}/reservations`);
  await cp.waitForLoadState('networkidle');
  await shot(cp, '06-reservations');

  // Profile
  await cp.goto(`${BASE}/profile`);
  await cp.waitForLoadState('networkidle');
  await shot(cp, '07-consumer-profile');

  await consumerCtx.close();

  // ── Provider flow ──────────────────────────────────────────
  const providerCtx = await browser.newContext({ viewport: VIEWPORT });
  const pp = await providerCtx.newPage();

  await pp.goto(BASE);
  await pp.evaluate(() => {
    localStorage.setItem('nibblen_user', JSON.stringify({
      id: 'user-2',
      email: 'maria@freshbowl.com',
      name: 'Maria Chen',
      role: 'provider',
      providerStatus: 'approved',
      businessName: 'Fresh Bowl',
      businessType: 'Restaurant',
      city: 'San Francisco',
    }));
  });

  // Dashboard
  await pp.goto(`${BASE}/dashboard`);
  await pp.waitForLoadState('networkidle');
  await shot(pp, '08-provider-dashboard');

  // Listings
  await pp.goto(`${BASE}/listings`);
  await pp.waitForLoadState('networkidle');
  await shot(pp, '09-provider-listings');

  // Create listing
  await pp.goto(`${BASE}/listings/create`);
  await pp.waitForLoadState('networkidle');
  await shot(pp, '10-create-listing');

  await providerCtx.close();
  await browser.close();
});
