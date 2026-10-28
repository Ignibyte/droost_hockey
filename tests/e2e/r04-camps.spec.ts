import { randomBytes } from 'node:crypto';
import { execFileSync } from 'node:child_process';
import { test, expect, type Page, type Browser } from '@playwright/test';

/**
 * Rung 4: camps, /camps and the home page's camps (droost/intake/tickets/R04.md).
 * Each test names the acceptance criteria it proves.
 *
 * Tests that change camps put them back by re-running the rung's content
 * script (scripts/kch/r04_camps.php, idempotent), and the file runs in order
 * in one worker: the lists are shared state.
 */
test.describe.configure({ mode: 'default', timeout: 120000 });

const BASE = process.env.PLAYWRIGHT_BASE_URL || 'https://kch-a.ddev.site';
const EDITOR = 'r04_editor';
const TEST_CAMP = 'R04 Test Camp';
const REGISTER = '/contact?subject=Camp%20Inquiry';

/** The source's camps (design/…/src/data/mock-data.ts), in its order: start date order. */
const CAMPS: [string, string, string, string, string, string][] = [
  ['Summer Power Skating Camp', 'July 28–Aug 1', 'Pepsi Ice Midwest', '8–14', 'All Skill Levels', '$275'],
  ['Goalie Clinic', 'Aug 10', 'Central Park Ice Arena', '10–18', 'Intermediate/Advanced', '$95'],
  ['Back-to-School Skills Camp', 'Aug 18–22', 'Cable Dahmer Arena', '6–16', 'Beginner/Intermediate', '$250'],
  ['Fall Puck Development Clinic', 'Sept 6', 'Pepsi Ice Midwest', '12–18', 'Advanced', '$85'],
  ['Adult Hockey League Showcase', 'Sept 14', 'Twin Rinks Ice Pavilion', '18+', 'All Levels', 'FREE'],
  ['USAH Level 1 Coaching Clinic', 'Oct 4–5', 'Olathe Ice Arena', 'Adults', 'Coaches', '$150'],
];
const TITLES = CAMPS.map(([title]) => title);

/** Runs drush in the DDEV site and returns what it printed. */
function drush(...args: string[]): string {
  return execFileSync('ddev', ['drush', ...args], { encoding: 'utf8' }).trim();
}

/** Runs PHP in the booted site. */
function php(code: string): string {
  return drush('php:eval', code);
}

/** Puts the six camps back as the rung made them, and removes test camps. */
function restore(): void {
  php(`foreach (\\Drupal::entityTypeManager()->getStorage('node')->loadByProperties(['type' => 'event']) as $n) {
    if (str_starts_with($n->label(), ${JSON.stringify(TEST_CAMP)})) { $n->delete(); } }`);
  drush('php:script', 'scripts/kch/r04_camps.php');
}

/** Sets fields on a camp, found by its title, and saves it. */
function setCamp(title: string, values: Record<string, unknown>): void {
  php(`$n = current(\\Drupal::entityTypeManager()->getStorage('node')->loadByProperties(['type' => 'event', 'title' => ${JSON.stringify(title)}]));
    foreach (json_decode(${JSON.stringify(JSON.stringify(values))}, TRUE) as $field => $value) { $n->set($field, $value); }
    $n->save();`);
}

/** A node's ID, by type and title. */
function nid(type: string, title: string): string {
  return php(`echo current(\\Drupal::entityTypeManager()->getStorage('node')->loadByProperties(['type' => '${type}', 'title' => ${JSON.stringify(title)}]))->id();`);
}

/** A program term's ID, by name. */
function program(name: string): string {
  return php(`echo current(\\Drupal::entityTypeManager()->getStorage('taxonomy_term')->loadByProperties(['vid' => 'program', 'name' => ${JSON.stringify(name)}]))->id();`);
}

/**
 * A visitor's page in a fresh browser: the site sends pages with a public
 * max-age, so a second visit in the same browser could come from its cache.
 */
async function visit(browser: Browser, path: string, width = 1280): Promise<Page> {
  const context = await browser.newContext({ ignoreHTTPSErrors: true, viewport: { width, height: 900 } });
  const page = await context.newPage();
  await page.goto(path);
  return page;
}

/** A page logged in as a Content editor (a one-time login link). */
async function editorPage(browser: Browser): Promise<Page> {
  const context = await browser.newContext({ ignoreHTTPSErrors: true, viewport: { width: 1280, height: 900 } });
  const page = await context.newPage();
  await page.goto(drush('user:login', `--name=${EDITOR}`, '--no-browser', `--uri=${BASE}`));
  return page;
}

/** Fills a camp's form (the fields given). */
async function fillCamp(page: Page, values: { title?: string; start?: string; end?: string; rink?: string; ages?: string; level?: string; price?: string; programs?: string[]; state?: string }): Promise<void> {
  if (values.title !== undefined) await page.locator('input[name="title[0][value]"]').fill(values.title);
  if (values.start !== undefined) await page.locator('input[name="field_event_date[0][value][date]"]').fill(values.start);
  if (values.end !== undefined) await page.locator('input[name="field_camp_end_date[0][value][date]"]').fill(values.end);
  if (values.rink !== undefined) await page.locator('select[name="field_camp_rink"]').selectOption({ label: values.rink });
  if (values.ages !== undefined) await page.locator('input[name="field_camp_ages[0][value]"]').fill(values.ages);
  if (values.level !== undefined) await page.locator('input[name="field_camp_level[0][value]"]').fill(values.level);
  if (values.price !== undefined) await page.locator('input[name="field_camp_price[0][value]"]').fill(values.price);
  for (const name of values.programs ?? []) await page.getByRole('checkbox', { name }).check();
  if (values.state !== undefined) await page.locator('select[name="moderation_state[0][state]"]').selectOption(values.state);
}

/** Saves a camp form; a saved camp's page forwards to /camps. */
async function saveCamp(page: Page): Promise<void> {
  await Promise.all([
    page.waitForURL((url) => url.pathname === '/camps'),
    page.locator('#gin-sticky-edit-submit').click(),
  ]);
}

/** A label followed by its value, whatever whitespace the markup puts between. */
const pair = (label: string, value: string) => new RegExp(`${label}\\s*${value.replace(/[.*+?^${}()|[\]\\$]/g, '\\$&')}`);

const cards = (page: Page) => page.locator('[data-component-id="kchockey:camp_card"]');
const tiles = (page: Page) => page.locator('[data-component-id="kchockey:camp_tile"]');
const featured = (page: Page) => page.locator('[data-component-id="kchockey:featured_camp"]');

test.beforeAll(() => {
  // The Content editor these tests act as: created once, kept for re-runs.
  const exists = php(`echo (int) (bool) user_load_by_name('${EDITOR}');`);
  if (exists !== '1') {
    drush('user:create', EDITOR, `--mail=${EDITOR}@example.com`, `--password=${randomBytes(32).toString('hex')}`);
  }
  drush('user:password', EDITOR, randomBytes(32).toString('hex'));
  drush('user:unblock', EDITOR);
  drush('user:role:add', 'content_editor', EDITOR);
  restore();
});

test.afterAll(() => {
  restore();
});

test('AC-1: the six camps, published, with the source\'s rinks, ages, levels and prices, dated 2027', () => {
  const rows = JSON.parse(php(`
    $ids = \\Drupal::entityQuery('node')->accessCheck(FALSE)->condition('type', 'event')->condition('status', 1)->sort('field_event_date')->execute();
    $out = [];
    foreach (\\Drupal\\node\\Entity\\Node::loadMultiple($ids) as $n) {
      $out[] = [$n->label(), $n->field_event_date->value, $n->field_camp_end_date->value, $n->field_camp_rink->entity->label(),
        $n->field_camp_ages->value, $n->field_camp_level->value, (int) $n->field_camp_price->value, (bool) $n->field_camp_featured->value];
    }
    echo json_encode($out);`));
  expect(rows).toEqual([
    ['Summer Power Skating Camp', '2027-07-28', '2027-08-01', 'Pepsi Ice Midwest', '8–14', 'All Skill Levels', 275, true],
    ['Goalie Clinic', '2027-08-10', null, 'Central Park Ice Arena', '10–18', 'Intermediate/Advanced', 95, false],
    ['Back-to-School Skills Camp', '2027-08-18', '2027-08-22', 'Cable Dahmer Arena', '6–16', 'Beginner/Intermediate', 250, false],
    ['Fall Puck Development Clinic', '2027-09-06', null, 'Pepsi Ice Midwest', '12–18', 'Advanced', 85, false],
    ['Adult Hockey League Showcase', '2027-09-14', null, 'Twin Rinks Ice Pavilion', '18+', 'All Levels', 0, false],
    ['USAH Level 1 Coaching Clinic', '2027-10-04', '2027-10-05', 'Olathe Ice Arena', 'Adults', 'Coaches', 150, false],
  ]);
});

test('AC-2, AC-16: an editor picks the location from the rinks; a camp will not save without one, or ending before it starts', async ({ browser }) => {
  const editor = await editorPage(browser);
  await editor.goto('/node/add/event');

  // The choices are the site's rinks, by name.
  const rinks = JSON.parse(php(`$ids = \\Drupal::entityQuery('node')->accessCheck(FALSE)->condition('type', 'rink')->sort('title')->execute();
    echo json_encode(array_values(array_map(fn ($n) => $n->label(), \\Drupal\\node\\Entity\\Node::loadMultiple($ids))));`));
  const options = await editor.locator('select[name="field_camp_rink"] option').allTextContents();
  expect(options.filter((o) => !o.startsWith('-'))).toEqual(rinks);
  expect(rinks).toContain('Pepsi Ice Midwest');

  // No rink: refused. (The browser's own check is lifted to reach the site's.)
  await fillCamp(editor, { title: TEST_CAMP, start: '2027-11-01', ages: '8–12', level: 'Beginner', price: '50', programs: ['Youth Hockey'], state: 'published' });
  await editor.locator('form.node-form').evaluate((form) => form.setAttribute('novalidate', ''));
  await editor.locator('#gin-sticky-edit-submit').click();
  await expect(editor.locator('body')).toContainText('Location field is required');
  expect(php(`echo count(\\Drupal::entityTypeManager()->getStorage('node')->loadByProperties(['title' => ${JSON.stringify(TEST_CAMP)}]));`)).toBe('0');

  // End before start: refused.
  await fillCamp(editor, { rink: 'Pepsi Ice Midwest', end: '2027-10-30' });
  await editor.locator('form.node-form').evaluate((form) => form.setAttribute('novalidate', ''));
  await editor.locator('#gin-sticky-edit-submit').click();
  await expect(editor.locator('body')).toContainText('The end date cannot be before the start date.');
  expect(php(`echo count(\\Drupal::entityTypeManager()->getStorage('node')->loadByProperties(['title' => ${JSON.stringify(TEST_CAMP)}]));`)).toBe('0');

  // With its rink and a good end date: saved, and on /camps.
  await fillCamp(editor, { end: '2027-11-02' });
  await saveCamp(editor);
  const page = await visit(browser, '/camps');
  const card = cards(page).filter({ hasText: TEST_CAMP });
  await expect(card).toContainText('Nov 1–2');
  await expect(card).toContainText('Pepsi Ice Midwest');
  restore();
});

test('AC-3: a rink a camp is held at cannot be deleted, and the site names the camps held there', async ({ browser, request }) => {
  const pepsi = nid('rink', 'Pepsi Ice Midwest');
  const refusal = 'This rink cannot be deleted: 2 camps are held here (Summer Power Skating Camp, Fall Puck Development Clinic). Move them to another rink first.';

  // The site refuses the operation itself: the editor may not delete it.
  expect(php(`$u = user_load_by_name('${EDITOR}'); echo (int) \\Drupal\\node\\Entity\\Node::load(${pepsi})->access('delete', $u);`)).toBe('0');

  // Where the editor would look for Delete, there is none, and the camps are named.
  const editor = await editorPage(browser);
  await editor.goto(`/node/${pepsi}/edit`);
  await expect(editor.locator('body')).toContainText(refusal);
  await expect(editor.getByRole('link', { name: 'Delete', exact: true })).toHaveCount(0);
  const direct = await editor.goto(`/node/${pepsi}/delete`);
  expect(direct!.status()).toBe(403);

  // Someone who bypasses node access gets the refusal on the delete form, and no Delete button.
  const admin = await (await browser.newContext({ ignoreHTTPSErrors: true })).newPage();
  await admin.goto(drush('user:login', '--uid=1', '--no-browser', `--uri=${BASE}`, `node/${pepsi}/delete`));
  await expect(admin.locator('body')).toContainText(refusal);
  await expect(admin.getByRole('button', { name: 'Delete' })).toHaveCount(0);
  expect(php(`echo \\Drupal\\node\\Entity\\Node::load(${pepsi}) ? 'kept' : 'gone';`)).toBe('kept');

  // A rink no camp is held at may still be deleted.
  const blade = nid('rink', 'Blade Runners Ice Complex');
  expect(php(`$u = user_load_by_name('${EDITOR}'); echo (int) \\Drupal\\node\\Entity\\Node::load(${blade})->access('delete', $u);`)).toBe('1');
  await editor.goto(`/node/${blade}/edit`);
  await expect(editor.locator('body')).not.toContainText('cannot be deleted');
  await editor.goto(`/node/${blade}/delete`);
  await expect(editor.getByRole('button', { name: 'Delete' })).toHaveCount(1);
});

test('AC-4, AC-5, AC-6, AC-7: /camps shows the intro, the filter bar, and the cards by start date as the source writes them', async ({ browser }) => {
  const page = await visit(browser, '/camps');
  const main = page.locator('main');
  await expect(main.locator('h1')).toHaveText('Camps & Clinics');
  await expect(main).toContainText('From learn-to-skate to elite power skating. Find the right development program to elevate your game this season.');
  expect(await page.locator('[data-component-id="kchockey:page_intro"]').innerHTML()).toMatch(/background-image: url\('\/sites\/default\/files\/kch\/camps-drills\.jpg/);

  const filter = page.locator('[data-component-id="kchockey:camp_filter"]');
  await expect(filter).toContainText('Filter By:');
  await expect(filter.getByRole('link')).toHaveText(['All Events', 'Youth Hockey', 'Adult/Coaches', 'Goalies']);
  await expect(filter.getByRole('link', { name: 'All Events' })).toHaveAttribute('aria-current', 'page');

  await expect(cards(page).locator('h3')).toHaveText(TITLES);
  for (const [i, [, date, rink, ages, level, price]] of CAMPS.entries()) {
    const card = cards(page).nth(i);
    await expect(card).toContainText(date);
    await expect(card).toContainText(rink);
    await expect(card).toContainText(`Ages: ${ages}`);
    await expect(card).toContainText(`Level: ${level}`);
    await expect(card).toContainText(price);
    await expect(card.getByRole('link', { name: /^Register/ })).toHaveAttribute('href', REGISTER);
  }
  // No year anywhere on a card.
  await expect(cards(page).filter({ hasText: /20\d\d/ })).toHaveCount(0);
  // Only the featured camp carries the band.
  await expect(cards(page).filter({ hasText: 'Featured Event' }).locator('h3')).toHaveText(['Summer Power Skating Camp']);

  // Three to a row at 1280px, one at 390px.
  const [a, b, c, d] = await Promise.all([0, 1, 2, 3].map((i) => cards(page).nth(i).boundingBox()));
  expect(Math.abs(a!.y - c!.y)).toBeLessThan(2);
  expect(b!.x).toBeGreaterThan(a!.x);
  expect(d!.y).toBeGreaterThan(a!.y + a!.height - 1);
  const narrow = await visit(browser, '/camps', 390);
  const [n0, n1] = await Promise.all([0, 1].map((i) => cards(narrow).nth(i).boundingBox()));
  expect(Math.abs(n0!.x - n1!.x)).toBeLessThan(2);
});

test('AC-6: a free camp reads "Free" on the home page', async ({ browser }) => {
  setCamp('Goalie Clinic', { field_camp_price: 0 });
  try {
    const page = await visit(browser, '/');
    await expect(tiles(page).filter({ hasText: 'Goalie Clinic' })).toContainText(pair('Price', 'Free'));
  }
  finally {
    restore();
  }
});

test('AC-8: each program filter shows its camps, and All Events every camp', async ({ browser }) => {
  const page = await visit(browser, '/camps');
  const filter = page.locator('[data-component-id="kchockey:camp_filter"]');
  const expected: [string, string[]][] = [
    ['Youth Hockey', TITLES.slice(0, 4)],
    ['Adult/Coaches', TITLES.slice(4)],
    ['Goalies', ['Goalie Clinic']],
    ['All Events', TITLES],
  ];
  for (const [name, titles] of expected) {
    await filter.getByRole('link', { name }).click();
    await expect(filter.getByRole('link', { name })).toHaveAttribute('aria-current', 'page');
    await expect(cards(page).locator('h3')).toHaveText(titles);
  }
});

test('AC-9: a filter matching no camp shows "No camps found" and "Reset Filters" back to every camp', async ({ browser }) => {
  setCamp('Goalie Clinic', { moderation_state: 'unpublished' });
  try {
    const page = await visit(browser, `/camps?program=${program('Goalies')}`);
    await expect(cards(page)).toHaveCount(0);
    const empty = page.locator('[data-component-id="kchockey:camp_empty"]');
    await expect(empty).toContainText('No camps found');
    // The bar stays, so another choice is one click away.
    await expect(page.locator('[data-component-id="kchockey:camp_filter"]')).toBeVisible();
    await empty.getByRole('link', { name: 'Reset Filters' }).click();
    await expect(page).toHaveURL(/\/camps$/);
    await expect(cards(page)).toHaveCount(5);
  }
  finally {
    restore();
  }
});

test('AC-10: a camp leaves the lists the day after its last day, and the pages expire at the next midnight', async ({ browser, request }) => {
  // Dates in the site's timezone (America/Chicago), where "today" is decided.
  const [yesterday, today, before] = JSON.parse(php(`$tz = new \\DateTimeZone('America/Chicago');
    echo json_encode([(new \\DateTime('yesterday', $tz))->format('Y-m-d'), (new \\DateTime('today', $tz))->format('Y-m-d'), (new \\DateTime('-3 days', $tz))->format('Y-m-d')]);`));
  const pepsi = nid('rink', 'Pepsi Ice Midwest');
  const add = (suffix: string, start: string, end: string | null) => php(`\\Drupal\\node\\Entity\\Node::create(['type' => 'event', 'title' => ${JSON.stringify(TEST_CAMP)} . ' ${suffix}',
    'field_event_date' => '${start}', 'field_camp_end_date' => ${end ? `'${end}'` : 'NULL'}, 'field_camp_rink' => ${pepsi},
    'field_camp_ages' => 'All', 'field_camp_level' => 'All', 'field_camp_price' => 10, 'moderation_state' => 'published', 'uid' => 1])->save();`);
  try {
    add('ended yesterday', before, yesterday);
    add('one day, yesterday', yesterday, null);
    add('ends today', before, today);
    add('one day, today', today, null);

    const page = await visit(browser, '/camps');
    const shown = await cards(page).locator('h3').allTextContents();
    expect(shown).toContain(`${TEST_CAMP} ends today`);
    expect(shown).toContain(`${TEST_CAMP} one day, today`);
    expect(shown).not.toContain(`${TEST_CAMP} ended yesterday`);
    expect(shown).not.toContain(`${TEST_CAMP} one day, yesterday`);

    const home = await visit(browser, '/');
    const listed = await home.locator('main h2, main h3').allTextContents();
    expect(listed.some((t) => t.includes('ended yesterday') || t.includes('one day, yesterday'))).toBe(false);
    expect(listed.some((t) => t.includes(`${TEST_CAMP} ends today`) || t.includes(`${TEST_CAMP} one day, today`))).toBe(true);

    // Every cache lets go at the next midnight in Kansas City: the page
    // cache by the Expires header, a browser or proxy by max-age.
    const midnight = Number(php(`echo (new \\DateTime('tomorrow', new \\DateTimeZone('America/Chicago')))->getTimestamp();`));
    for (const path of ['/camps', '/', '/camps']) {
      const response = await request.get(path);
      const headers = response.headers();
      expect(Date.parse(headers['expires']) / 1000, path).toBe(midnight);
      const maxAge = Number(/max-age=(\d+)/.exec(headers['cache-control'])![1]);
      expect(Date.now() / 1000 + maxAge, path).toBeLessThanOrEqual(midnight + 5);
    }
  }
  finally {
    restore();
  }
});

test('AC-11: Register and Register Now open /contact with Camp Inquiry chosen', async ({ browser }) => {
  const page = await visit(browser, '/camps');
  await cards(page).nth(1).getByRole('link', { name: /^Register/ }).click();
  await expect(page).toHaveURL(/\/contact\?subject=Camp(%20|\+)Inquiry$/);
  await expect(page.locator('select[name="subject"]')).toHaveValue('Camp Inquiry');

  const home = await visit(browser, '/');
  await featured(home).getByRole('link', { name: 'Register Now' }).click();
  await expect(home).toHaveURL(/\/contact\?subject=Camp(%20|\+)Inquiry$/);
  await expect(home.locator('select[name="subject"]')).toHaveValue('Camp Inquiry');
});

test('AC-12: the home page shows the featured camp, then Upcoming Action, between the ticker and Find Your Ice', async ({ browser }) => {
  const page = await visit(browser, '/');
  const order = await page.locator('main [data-component-id]').evaluateAll((els) => els.map((e) => e.getAttribute('data-component-id')));
  const at = (id: string) => order.indexOf(id);
  expect(at('kchockey:ticker')).toBeGreaterThan(-1);
  expect(at('kchockey:ticker')).toBeLessThan(at('kchockey:featured_camp'));
  expect(at('kchockey:featured_camp')).toBeLessThan(at('kchockey:upcoming_band'));
  expect(at('kchockey:upcoming_band')).toBeLessThan(at('kchockey:rinks_band'));

  const camp = featured(page);
  await expect(camp).toContainText('Featured Camp');
  await expect(camp.locator('h2')).toHaveText('Summer Power Skating Camp');
  await expect(camp).toContainText('Join the biggest power skating development camp in the Midwest. Limited spots available for the upcoming session.');
  await expect(camp).toContainText(pair('Date', 'July 28–Aug 1'));
  await expect(camp).toContainText(pair('Location', 'Pepsi Ice Midwest'));
  await expect(camp).toContainText(pair('Ages', '8–14'));
  await expect(camp).toContainText(pair('Price', '$275'));
  await expect(camp.getByRole('link', { name: 'Register Now' })).toHaveAttribute('href', REGISTER);
  const photo = camp.locator('img');
  await expect(photo).toHaveAttribute('src', /about-skates\.jpg$/);
  expect(await photo.evaluate((img: HTMLImageElement) => img.complete && img.naturalWidth > 0)).toBe(true);
  await expect(camp).toContainText('Level Up.');

  const band = page.locator('[data-component-id="kchockey:upcoming_band"]');
  await expect(band.locator('h2')).toHaveText('Upcoming Action');
  await expect(band.getByRole('link', { name: 'View All Events' })).toHaveAttribute('href', '/camps');
  await expect(tiles(page).locator('h3')).toHaveText(TITLES.slice(1, 4));
  for (const [i, [, date, rink, ages, level, price]] of CAMPS.slice(1, 4).entries()) {
    const tile = tiles(page).nth(i);
    await expect(tile).toContainText(rink);
    await expect(tile).toContainText(pair('Date', date));
    await expect(tile).toContainText(pair('Ages', ages));
    await expect(tile).toContainText(pair('Level', level));
    await expect(tile).toContainText(pair('Price', price));
    await expect(tile.getByRole('link', { name: /^Details/ })).toHaveAttribute('href', '/camps');
  }
});

test('AC-13: with no featured camp, the home page features the next one and does not repeat it', async ({ browser }) => {
  setCamp('Summer Power Skating Camp', { field_camp_featured: 0 });
  setCamp('Goalie Clinic', { moderation_state: 'unpublished' });
  try {
    const page = await visit(browser, '/');
    await expect(featured(page).locator('h2')).toHaveText('Summer Power Skating Camp');
    await expect(tiles(page).locator('h3')).toHaveText(['Back-to-School Skills Camp', 'Fall Puck Development Clinic', 'Adult Hockey League Showcase']);
    await expect(tiles(page).filter({ hasText: 'Adult Hockey League Showcase' })).toContainText(pair('Price', 'Free'));
    const camps = await visit(browser, '/camps');
    await expect(cards(camps).filter({ hasText: 'Featured Event' })).toHaveCount(0);
  }
  finally {
    restore();
  }
});

test('AC-14: an editor edits, features and unpublishes a camp, and /camps and the home page follow', async ({ browser }) => {
  const editor = await editorPage(browser);
  const fall = nid('event', 'Fall Puck Development Clinic');

  // Edit.
  await editor.goto(`/node/${fall}/edit`);
  await fillCamp(editor, { level: 'Elite', price: '90' });
  await saveCamp(editor);
  let page = await visit(browser, '/camps');
  await expect(cards(page).filter({ hasText: 'Fall Puck Development Clinic' })).toContainText('Level: Elite');
  await expect(cards(page).filter({ hasText: 'Fall Puck Development Clinic' })).toContainText('$90');
  page = await visit(browser, '/');
  await expect(tiles(page).filter({ hasText: 'Fall Puck Development Clinic' })).toContainText(pair('Level', 'Elite'));

  // Feature it: the soonest featured camp is still Summer Power Skating;
  // unfeature that one and Fall Puck takes the home page.
  await editor.goto(`/node/${fall}/edit`);
  await editor.getByRole('checkbox', { name: 'Featured' }).check();
  await saveCamp(editor);
  const summer = nid('event', 'Summer Power Skating Camp');
  await editor.goto(`/node/${summer}/edit`);
  await editor.getByRole('checkbox', { name: 'Featured' }).uncheck();
  await saveCamp(editor);
  page = await visit(browser, '/');
  await expect(featured(page).locator('h2')).toHaveText('Fall Puck Development Clinic');
  await expect(tiles(page).locator('h3')).toHaveText(TITLES.slice(0, 3));
  page = await visit(browser, '/camps');
  await expect(cards(page).filter({ hasText: 'Featured Event' }).locator('h3')).toHaveText(['Fall Puck Development Clinic']);

  // Unpublish it: gone from both.
  await editor.goto(`/node/${fall}/edit`);
  await fillCamp(editor, { state: 'unpublished' });
  await saveCamp(editor);
  page = await visit(browser, '/camps');
  await expect(cards(page).locator('h3')).toHaveText(TITLES.filter((t) => t !== 'Fall Puck Development Clinic'));
  page = await visit(browser, '/');
  await expect(featured(page).locator('h2')).toHaveText('Summer Power Skating Camp');
  await expect(page.locator('main')).not.toContainText('Fall Puck Development Clinic');
  restore();
});

test("AC-15: a camp's own address forwards to /camps", async ({ request }) => {
  const id = nid('event', 'Summer Power Skating Camp');
  for (const path of ['/camps/summer-power-skating-camp', `/node/${id}`]) {
    const response = await request.get(path, { maxRedirects: 0 });
    expect(response.status(), path).toBe(301);
    expect(new URL(response.headers()['location'], BASE).pathname, path).toBe('/camps');
  }
  const add = await request.get('/node/add/event', { maxRedirects: 0 });
  expect(add.status()).toBe(403);
});

// Test identities must never remain usable after the suite.
test.afterAll(() => {
  drush('user:block', EDITOR);
});
