import { randomBytes } from 'node:crypto';
import { execFileSync } from 'node:child_process';
import { test, expect, type Page, type Browser } from '@playwright/test';

/**
 * Rung 1: the KC Hockey theme, the frame and the page shells
 * (droost/intake/tickets/R01.md). Each test names the acceptance criteria it
 * proves.
 *
 * Several tests change the site (Site details, a menu link, a page's
 * publication) and put it back afterwards, so the file runs in order in one
 * worker: a footer read in one test must not race an edit in another.
 */
test.describe.configure({ mode: 'default' });

const PAGES = ['/', '/camps', '/rinks', '/private-lessons', '/new-to-hockey', '/youth-leagues', '/adult-leagues', '/contact'];
const MAIN = [
  ['Home', '/'],
  ['Camps & Clinics', '/camps'],
  ['Private Lessons', '/private-lessons'],
  ['KC Rinks', '/rinks'],
  ['New to Hockey', '/new-to-hockey'],
  ['Youth Leagues', '/youth-leagues'],
  ['Adult Leagues', '/adult-leagues'],
];
const EXPLORE = [
  ['Camps & Clinics', '/camps'],
  ['Private Lessons', '/private-lessons'],
  ['KC Rink Directory', '/rinks'],
  ['New to Hockey', '/new-to-hockey'],
  ['Youth Leagues', '/youth-leagues'],
  ['Adult Leagues', '/adult-leagues'],
];
const BLURB = "Kansas City's premier hockey resource. Built by rink rats, for rink rats. Find your next camp, clinic, or open skate in the heart of the Midwest.";
const EDITOR = 'r01_editor';

/** Runs drush in the DDEV site and returns what it printed. */
function drush(...args: string[]): string {
  return execFileSync('ddev', ['drush', ...args], { encoding: 'utf8' }).trim();
}

/** Runs PHP in the booted site. */
function php(code: string): string {
  return drush('php:eval', code);
}

/** Sets a Site details key the way the form would leave it. */
function setDetail(key: string, value: string): void {
  php(`\\Drupal::configFactory()->getEditable('kchockey_site.settings')->set('${key}', ${JSON.stringify(value)})->save();`);
}

/** A page logged in as a Content editor (a one-time login link). */
async function editorPage(browser: Browser): Promise<Page> {
  const context = await browser.newContext({ ignoreHTTPSErrors: true, viewport: { width: 1280, height: 900 } });
  const page = await context.newPage();
  const link = drush('user:login', `--name=${EDITOR}`, '--no-browser', `--uri=${process.env.PLAYWRIGHT_BASE_URL || 'https://kch-a.ddev.site'}`);
  await page.goto(link);
  return page;
}

/**
 * A visitor's page in a fresh browser. The site sends pages with
 * `Cache-Control: max-age=900, public`, so a second visit in the same browser
 * would be served from that browser's cache, not by the site.
 */
async function visit(browser: Browser, path: string): Promise<Page> {
  const context = await browser.newContext({ ignoreHTTPSErrors: true, viewport: { width: 1280, height: 900 } });
  const page = await context.newPage();
  await page.goto(path);
  return page;
}

/** Sets a menu link form's weight, which sits in its collapsed Display settings. */
async function setWeight(page: Page, weight: string): Promise<void> {
  const field = page.locator('input[name="weight[0][value]"]');
  if (!(await field.isVisible())) await page.locator('summary', { hasText: 'Display settings' }).click();
  await field.fill(weight);
}

/** Submits an admin form (Gin's sticky Save) and waits for Drupal to say it saved. */
async function save(page: Page): Promise<void> {
  await Promise.all([
    page.waitForResponse((r) => r.request().method() === 'POST' && r.request().resourceType() === 'document'),
    page.locator('#gin-sticky-edit-submit').click(),
  ]);
  await page.waitForLoadState('load');
  await expect(page.locator('[data-drupal-messages]')).toContainText('saved');
}

const header = (page: Page) => page.locator('nav[data-site-header]');
const footer = (page: Page) => page.locator('footer[data-component-id="kchockey:site_footer"]');

test.beforeAll(() => {
  // The Content editor these tests act as: created once, kept for re-runs.
  const exists = php(`echo (int) (bool) user_load_by_name('${EDITOR}');`);
  if (exists !== '1') {
    drush('user:create', EDITOR, `--mail=${EDITOR}@example.com`, `--password=${randomBytes(32).toString('hex')}`);
  }
  drush('user:password', EDITOR, randomBytes(32).toString('hex'));
  drush('user:unblock', EDITOR);
  drush('user:role:add', 'content_editor', EDITOR);
});

for (const width of [1280, 390]) {
  for (const route of PAGES) {
    test(`AC-1: ${route} answers 200 with the header and footer at ${width}px`, async ({ page }) => {
      await page.setViewportSize({ width, height: 900 });
      const response = await page.goto(route);
      expect(response?.status()).toBe(200);
      await expect(header(page)).toBeVisible();
      await expect(header(page).locator('a[rel="home"]')).toHaveText('KCHockey');
      await expect(footer(page)).toBeVisible();
      await expect(footer(page)).toContainText('All rights reserved.');
      // Nothing scrolls sideways.
      const hscroll = await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth);
      expect(hscroll).toBe(false);
    });
  }
}

test('AC-2: the mark, the main menu in order and Contact Us; the header stays at the top', async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 700 });
  await page.goto('/');
  const mark = header(page).locator('a[rel="home"]');
  await expect(mark).toHaveAttribute('href', '/');
  const links = header(page).locator('.md\\:flex a');
  const seen = await links.evaluateAll((as) => as.map((a) => [a.textContent!.trim(), a.getAttribute('href')]));
  expect(seen).toEqual([...MAIN, ['Contact Us', '/contact']]);
  await expect(header(page)).toHaveCSS('position', 'sticky');
  await page.mouse.wheel(0, 800);
  await page.waitForFunction(() => window.scrollY > 300);
  const box = await header(page).boundingBox();
  expect(box?.y).toBe(0);
});

test('AC-3: the header highlights the link of the page the visitor is on', async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 900 });
  for (const [label, path] of MAIN) {
    await page.goto(path);
    const current = header(page).locator('.md\\:flex a[aria-current="page"]');
    await expect(current).toHaveCount(1);
    await expect(current).toHaveText(label);
    await expect(current).toHaveCSS('color', 'rgb(255, 183, 0)');
  }
  await page.goto('/contact');
  await expect(header(page).locator('a[aria-current="page"]')).toHaveCount(0);
});

test('AC-4: under 768px a toggle opens and closes the links and Contact Us', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/camps');
  const toggle = header(page).locator('[data-site-header-toggle]');
  const panel = header(page).locator('[data-site-header-panel]');
  await expect(header(page).locator('.md\\:flex')).toBeHidden();
  await expect(toggle).toBeVisible();
  await expect(panel).toBeHidden();

  await toggle.click();
  await expect(panel).toBeVisible();
  await expect(toggle).toHaveAttribute('aria-expanded', 'true');
  const seen = await panel.locator('a').evaluateAll((as) => as.map((a) => [a.textContent!.trim(), a.getAttribute('href')]));
  expect(seen).toEqual([...MAIN, ['Contact Us', '/contact']]);
  await expect(panel.locator('a[aria-current="page"]')).toHaveText('Camps & Clinics');

  await toggle.click();
  await expect(panel).toBeHidden();
  await expect(toggle).toHaveAttribute('aria-expanded', 'false');

  await toggle.click();
  await page.keyboard.press('Escape');
  await expect(panel).toBeHidden();

  await page.setViewportSize({ width: 1280, height: 900 });
  await expect(toggle).toBeHidden();
  await expect(header(page).locator('.md\\:flex')).toBeVisible();
});

test('AC-5: the footer shows the blurb, Explore, the location, the email and the copyright', async ({ page }) => {
  await page.goto('/rinks');
  const f = footer(page);
  await expect(f.locator('p').first()).toHaveText(BLURB);
  const explore = await f.locator('h3:has-text("Explore") + ul a').evaluateAll((as) => as.map((a) => [a.textContent!.trim(), a.getAttribute('href')]));
  expect(explore).toEqual(EXPLORE);
  await expect(f).toContainText('Kansas City, MO');
  await expect(f).toContainText('The Hockey Capital of the Midwest');
  await expect(f.locator('a[href="mailto:info@kchockey.com"]')).toHaveText('info@kchockey.com');
  await expect(f).toContainText(`© ${new Date().getFullYear()} KCHockey. All rights reserved.`);
});

test('AC-6, AC-7, AC-9: a Content editor sets the phone, a social address and the blurb in Site details', async ({ browser }) => {
  test.setTimeout(180_000);
  let page: Page;
  // As launched: no phone (Q7), no social icons (Q8).
  page = await visit(browser, '/');
  await expect(footer(page).locator('a[href^="tel:"]')).toHaveCount(0);
  await expect(footer(page).locator('a[aria-label="Instagram"], a[aria-label="X / Twitter"], a[aria-label="Facebook"]')).toHaveCount(0);

  const editor = await editorPage(browser);
  try {
    await editor.goto('/admin/config/system/site-details');
    await editor.locator('input[name="phone"]').fill('(816) 555-0100');
    await editor.locator('input[name="instagram"]').fill('https://www.instagram.com/kchockey');
    await editor.locator('textarea[name="blurb"]').fill('R01 blurb, changed by an editor.');
    await editor.locator('input[name="location_line_2"]').fill('R01 second line');
    await editor.locator('input[name="email"]').fill('r01@kchockey.com');
    await save(editor);

    page = await visit(browser, '/');
    const f = footer(page);
    await expect(f.locator('a[href="tel:+18165550100"]')).toHaveText('(816) 555-0100');
    await expect(f.locator('a[aria-label="Instagram"]')).toHaveAttribute('href', 'https://www.instagram.com/kchockey');
    await expect(f.locator('a[aria-label="X / Twitter"], a[aria-label="Facebook"]')).toHaveCount(0);
    await expect(f).toContainText('R01 blurb, changed by an editor.');
    await expect(f).toContainText('R01 second line');
    await expect(f.locator('a[href="mailto:r01@kchockey.com"]')).toHaveText('r01@kchockey.com');
  } finally {
    setDetail('phone', '');
    setDetail('instagram', '');
    setDetail('blurb', BLURB);
    setDetail('location_line_2', 'The Hockey Capital of the Midwest');
    setDetail('email', 'info@kchockey.com');
    await editor.context().close();
  }

  page = await visit(browser, '/');
  await expect(footer(page).locator('a[href^="tel:"]')).toHaveCount(0);
  await expect(footer(page).locator('a[aria-label="Instagram"]')).toHaveCount(0);
});

test('AC-8: a legal link shows to visitors only once its page is published', async ({ browser }) => {
  test.setTimeout(180_000);
  let page: Page;
  const termsId = php(`$n = \\Drupal::entityTypeManager()->getStorage('node')->loadByProperties(['type' => 'page', 'title' => 'Terms of Service']); echo reset($n)->id();`);
  const legal = (p: Page) => footer(p).locator('.mt-12 a');
  page = await visit(browser, '/');
  await expect(legal(page)).toHaveCount(0);

  // Unpublishing a published page is the workflow's "unpublished" state: a
  // "draft" of a published page is a pending revision, and the page stays live.
  const publish = (state: 'published' | 'unpublished') =>
    php(`$n = \\Drupal\\node\\Entity\\Node::load(${termsId}); $n->set('moderation_state', '${state}'); $n->save();`);
  publish('published');
  try {
    page = await visit(browser, '/');
    await expect(legal(page)).toHaveCount(1);
    await expect(legal(page)).toHaveText('Terms of Service');
    await expect(legal(page)).toHaveAttribute('href', '/terms-of-service');
  } finally {
    publish('unpublished');
  }
  page = await visit(browser, '/');
  await expect(legal(page)).toHaveCount(0);
});

test('AC-10: a Content editor adds, renames and reorders main and footer menu links', async ({ browser }) => {
  test.setTimeout(180_000);
  let page: Page;
  // The links are found by where they go and put back as rung 1 made them
  // (scripts/kch/r01_content.php), whatever an interrupted run left behind.
  const linkTo = (menu: string, path: string): { id: string } =>
    JSON.parse(php(`$p = \\Drupal::service('path_alias.manager')->getPathByAlias('${path}');
      foreach (\\Drupal::entityTypeManager()->getStorage('menu_link_content')->loadByProperties(['menu_name' => '${menu}']) as $l) {
        if ($l->getUrlObject()->getInternalPath() === ltrim($p, '/')) { echo json_encode(['id' => $l->id()]); break; }
      }`));
  const rinksMain = linkTo('main', '/rinks');
  const rinksFooter = linkTo('footer', '/rinks');
  const editor = await editorPage(browser);
  try {
    // Rename a main menu link.
    await editor.goto(`/admin/structure/menu/item/${rinksMain.id}/edit`);
    await editor.locator('input[name="title[0][value]"]').fill('Rinks R01');
    await save(editor);
    // Rename and move a footer link to the top.
    await editor.goto(`/admin/structure/menu/item/${rinksFooter.id}/edit`);
    await editor.locator('input[name="title[0][value]"]').fill('Rink Directory R01');
    await setWeight(editor, '-20');
    await save(editor);
    // Add a footer link.
    await editor.goto('/admin/structure/menu/manage/footer/add');
    await editor.locator('input[name="title[0][value]"]').fill('Added R01');
    await editor.locator('input[name="link[0][uri]"]').fill('/contact');
    await setWeight(editor, '50');
    await save(editor);

    page = await visit(browser, '/');
    await expect(header(page).locator('.md\\:flex a[href="/rinks"]')).toHaveText('Rinks R01');
    const explore = await footer(page).locator('h3:has-text("Explore") + ul a').evaluateAll((as) => as.map((a) => a.textContent!.trim()));
    expect(explore[0]).toBe('Rink Directory R01');
    expect(explore[explore.length - 1]).toBe('Added R01');
  } finally {
    php(`$s = \\Drupal::entityTypeManager()->getStorage('menu_link_content');
      $s->load(${rinksMain.id})->set('title', 'KC Rinks')->set('weight', 3)->save();
      $s->load(${rinksFooter.id})->set('title', 'KC Rink Directory')->set('weight', 2)->save();
      foreach ($s->loadByProperties(['title' => 'Added R01']) as $l) { $l->delete(); }`);
    await editor.context().close();
  }
  page = await visit(browser, '/');
  await expect(header(page).locator('.md\\:flex a[href="/rinks"]')).toHaveText('KC Rinks');
});

test('AC-11: the home page opens with the hero, then the gold ticker', async ({ page }) => {
  await page.goto('/');
  const hero = page.locator('[data-component-id="kchockey:home_hero"]');
  await expect(hero).toContainText('The Heart of KC Hockey');
  await expect(hero.locator('h1')).toHaveText(/^\s*Kansas City's\s*Ice Headquarters\s*$/);
  await expect(hero.locator('h1 span')).toHaveText('Ice Headquarters');
  await expect(hero).toContainText('Built by rink rats, for rink rats. Find your next camp, private lesson, or drop-in skate anywhere in the metro.');
  await expect(hero.getByRole('link', { name: 'Find a Camp' })).toHaveAttribute('href', '/camps');
  await expect(hero.getByRole('link', { name: 'Explore KC Rinks' })).toHaveAttribute('href', '/rinks');
  const background = await hero.locator('div[style*="background-image"]').first().getAttribute('style');
  expect(background).toContain('hero-hockey.jpg');

  // The ticker is the next section, gold, with the three announcements.
  const ticker = page.locator('main [data-component-id="kchockey:home_hero"] + [data-component-id="kchockey:ticker"]');
  await expect(ticker).toHaveCSS('background-color', 'rgb(255, 183, 0)');
  for (const item of ['Next USAH Level 1 Clinic: Oct 4-5', 'Adult League Reg Open', 'Fall Puck Dev Clinic filling fast!']) {
    await expect(ticker.getByText(item).first()).toBeVisible();
  }
});

test('AC-12: the hero and the ticker are Canvas props a Content editor can change', async ({ browser }) => {
  test.setTimeout(180_000);
  let page: Page;
  // The editor may open the home page in Canvas, where both are placeable.
  const editor = await editorPage(browser);
  const response = await editor.goto('/canvas/editor/canvas_page/1');
  expect(response?.status()).toBe(200);
  await editor.context().close();
  const enabled = php(`$s = \\Drupal::entityTypeManager()->getStorage('component'); echo (int) $s->load('sdc.kchockey.home_hero')->status(), (int) $s->load('sdc.kchockey.ticker')->status();`);
  expect(enabled).toBe('11');

  // A change to the props in the page's tree is what the home page shows.
  const tree = php(`echo json_encode(\\Drupal::entityTypeManager()->getStorage('canvas_page')->load(1)->get('components')->getValue());`);
  const edit = (from: string, to: string) =>
    php(`$p = \\Drupal::entityTypeManager()->getStorage('canvas_page')->load(1); $v = $p->get('components')->getValue();
      foreach ($v as &$i) { $i['inputs'] = str_replace(${JSON.stringify(JSON.stringify(from).slice(1, -1))}, ${JSON.stringify(JSON.stringify(to).slice(1, -1))}, $i['inputs']); }
      $p->set('components', $v); $p->save();`);
  try {
    edit('Adult League Reg Open', 'Adult League Reg Open R01');
    edit('The Heart of KC Hockey', 'The Heart of KC Hockey R01');
    page = await visit(browser, '/');
    await expect(page.locator('[data-component-id="kchockey:ticker"]').getByText('Adult League Reg Open R01').first()).toBeVisible();
    await expect(page.locator('[data-component-id="kchockey:home_hero"]')).toContainText('The Heart of KC Hockey R01');
  } finally {
    edit('Adult League Reg Open R01', 'Adult League Reg Open');
    edit('The Heart of KC Hockey R01', 'The Heart of KC Hockey');
  }
  const restored = php(`echo json_encode(\\Drupal::entityTypeManager()->getStorage('canvas_page')->load(1)->get('components')->getValue());`);
  expect(restored).toBe(tree);
});

test('AC-13: with reduced motion the entrance animations and the ticker do not move', async ({ browser }) => {
  const still = await browser.newContext({ ignoreHTTPSErrors: true, reducedMotion: 'reduce' });
  const moving = await browser.newContext({ ignoreHTTPSErrors: true, reducedMotion: 'no-preference' });
  try {
    const a = await moving.newPage();
    await a.goto('/');
    expect(await a.locator('.animate-rise').evaluate((el) => getComputedStyle(el).animationName)).toBe('kch-rise');

    const b = await still.newPage();
    for (const route of ['/', '/new-to-hockey', '/youth-leagues', '/adult-leagues']) {
      await b.goto(route);
      const names = await b.locator('.animate-rise, .animate-rise-short').evaluateAll((els) => els.map((el) => getComputedStyle(el).animationName));
      expect(names.length).toBeGreaterThan(0);
      for (const name of names) expect(name).toBe('none');
    }
    await b.goto('/');
    const item = b.locator('[data-component-id="kchockey:ticker"] span').first();
    const x1 = (await item.boundingBox())!.x;
    await b.waitForTimeout(1000);
    const x2 = (await item.boundingBox())!.x;
    expect(x2).toBe(x1);
  } finally {
    await still.close();
    await moving.close();
  }
});

test('AC-14: headings in Oswald and text in Inter, both served by the site', async ({ page, baseURL }) => {
  const fonts: string[] = [];
  page.on('request', (req) => {
    if (req.resourceType() === 'font' || /fonts\.(googleapis|gstatic)\.com/.test(req.url())) fonts.push(req.url());
  });
  await page.goto('/new-to-hockey');
  await page.evaluate(() => document.fonts.ready);
  expect(await page.locator('main h1').evaluate((el) => getComputedStyle(el).fontFamily)).toMatch(/^"?Oswald/);
  expect(await page.locator('main p').last().evaluate((el) => getComputedStyle(el).fontFamily)).toMatch(/^"?Inter/);
  const loaded = await page.evaluate(() => [...document.fonts].filter((f) => f.status === 'loaded').map((f) => f.family.replace(/"/g, '')));
  expect(loaded).toEqual(expect.arrayContaining(['Oswald', 'Inter']));
  expect(fonts.length).toBeGreaterThan(0);
  const origin = new URL(baseURL!).origin;
  for (const url of fonts) expect(new URL(url).origin).toBe(origin);
});

test('AC-15: an unknown address answers 404 with the not-found page inside the frame', async ({ page }) => {
  const response = await page.goto('/no-such-page-r01');
  expect(response?.status()).toBe(404);
  await expect(header(page)).toBeVisible();
  await expect(footer(page)).toBeVisible();
  const notFound = page.locator('[data-component-id="kchockey:not_found"]');
  await expect(notFound.locator('h1')).toHaveText(/^\s*Off the\s*Ice\s*$/);
  await expect(notFound.getByRole('link', { name: 'Back to Home' })).toHaveAttribute('href', '/');
  await expect(notFound).toHaveCSS('background-color', 'rgb(10, 20, 41)');
});

test('AC-16: each other page shows its intro as the source draws it', async ({ page }) => {
  const NAVY = 'rgb(10, 20, 41)';
  const intros: Array<{ route: string; heading: RegExp; eyebrow?: string; text: string; bg: string; image?: string }> = [
    { route: '/camps', heading: /^\s*Camps & Clinics\s*$/, text: 'From learn-to-skate to elite power skating.', bg: NAVY, image: 'camps-drills.jpg' },
    { route: '/rinks', heading: /^\s*KC Rink Directory\s*$/, text: 'Every sheet of ice in the Kansas City metro area.', bg: NAVY },
    { route: '/private-lessons', heading: /^\s*Private Lessons\s*$/, text: '1-on-1 and small group development.', bg: 'rgb(241, 245, 249)' },
    { route: '/new-to-hockey', heading: /^\s*New to\s*Hockey\?\s*$/, eyebrow: 'Your first shift starts here', text: 'Every hockey player starts somewhere.', bg: NAVY },
    { route: '/youth-leagues', heading: /^\s*Youth\s*Leagues\s*$/, eyebrow: 'Build the next generation', text: 'Find the right place for your young player', bg: NAVY },
    { route: '/adult-leagues', heading: /^\s*Adult\s*Leagues\s*$/, eyebrow: 'Your week needs a skate', text: 'Find your next league, join a team', bg: NAVY },
    { route: '/contact', heading: /^\s*Hit Us Up\s*$/, text: 'Got a question about a camp?', bg: NAVY },
  ];
  for (const intro of intros) {
    await page.goto(intro.route);
    const band = page.locator('main [data-component-id="kchockey:page_intro"]');
    await expect(band).toHaveCount(1);
    await expect(band.locator('h1')).toHaveText(intro.heading);
    await expect(band).toContainText(intro.text);
    await expect(band).toHaveCSS('background-color', intro.bg);
    if (intro.eyebrow) await expect(band.locator('p').first()).toHaveText(intro.eyebrow);
    if (intro.image) expect(await band.locator('div[style*="background-image"]').first().getAttribute('style')).toContain(intro.image);
    await expect(band.locator('h1')).toHaveCSS('text-transform', 'uppercase');
  }
});

// Test identities must never remain usable after the suite.
test.afterAll(() => {
  drush('user:block', EDITOR);
});
