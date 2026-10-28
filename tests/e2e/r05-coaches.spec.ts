import { randomBytes } from 'node:crypto';
import { execFileSync } from 'node:child_process';
import path from 'node:path';
import { test, expect, type Page, type Browser } from '@playwright/test';

/**
 * Rung 5: coaches and /private-lessons (droost/intake/tickets/R05.md).
 * Each test names the acceptance criteria it proves.
 *
 * Tests that edit coaches or the page restore them, and the file runs in
 * order in one worker: the listing and the page are shared state.
 */
test.describe.configure({ mode: 'default', timeout: 120000 });

const BASE = process.env.PLAYWRIGHT_BASE_URL || 'https://kch-a.ddev.site';
const EDITOR = 'r05_editor';
const TEST_COACH = 'Coach Pat Tester';
const PAGE_ID = 4;
const INQUIRE = '/contact?subject=Private%20Lessons';
const PHOTO = path.join(__dirname, '../../design/KC-Hockey-Hub/attached_assets/generated_images/about-skates.jpg');

/** The source's coaches (design/…/src/data/mock-data.ts), in its order, with their initials. */
const COACHES: [string, string, string, number, string][] = [
  ['Coach Mike Donovan', 'Power skating specialist', '15 years coaching, former ECHL player', 75, 'MD'],
  ['Coach Sarah Tillman', 'Youth development & learn-to-skate', 'USAH certified Level 4', 60, 'ST'],
  ['Coach Jake Reardon', 'Goalie coach', 'Former D1 college goalie', 80, 'JR'],
  ['Coach Elena Voss', 'Figure skating & edge work', 'ISU certified, crossover training expert', 65, 'EV'],
];
const NAMES = COACHES.map(([name]) => name);

/** Runs drush in the DDEV site and returns what it printed. */
function drush(...args: string[]): string {
  return execFileSync('ddev', ['drush', ...args], { encoding: 'utf8' }).trim();
}

/** Runs PHP in the booted site. */
function php(code: string): string {
  return drush('php:eval', code);
}

/** Deletes the coach these tests add, if a run left it. */
function deleteTestCoach(): void {
  php(`foreach (\\Drupal::entityTypeManager()->getStorage('node')->loadByProperties(['type' => 'coach', 'title' => ${JSON.stringify(TEST_COACH)}]) as $n) { $n->delete(); }`);
}

/**
 * A visitor's page in a fresh browser. The site sends pages with
 * `Cache-Control: max-age=900, public`, so a second visit in the same browser
 * would be served from that browser's cache, not by the site.
 */
async function visit(browser: Browser, route: string, width = 1280): Promise<Page> {
  const context = await browser.newContext({ ignoreHTTPSErrors: true, viewport: { width, height: 900 } });
  const page = await context.newPage();
  await page.goto(route);
  return page;
}

/** A page logged in as a Content editor (a one-time login link). */
async function editorPage(browser: Browser): Promise<Page> {
  const context = await browser.newContext({ ignoreHTTPSErrors: true, viewport: { width: 1280, height: 900 } });
  const page = await context.newPage();
  await page.goto(drush('user:login', `--name=${EDITOR}`, '--no-browser', `--uri=${BASE}`));
  return page;
}

/** Saves a coach form (Gin's sticky Save); a coach's page forwards to /private-lessons. */
async function saveCoach(page: Page): Promise<void> {
  await Promise.all([
    page.waitForURL((url) => url.pathname === '/private-lessons'),
    page.locator('#gin-sticky-edit-submit').click(),
  ]);
}

const cards = (page: Page) => page.locator('[data-component-id="kchockey:coach_card"]');
const spotlight = (page: Page) => page.locator('[data-component-id="kchockey:instructor_spotlight"]');
const band = (page: Page) => page.locator('[data-component-id="kchockey:cta_band"]');

test.beforeAll(() => {
  // The Content editor these tests act as: created once, kept for re-runs.
  const exists = php(`echo (int) (bool) user_load_by_name('${EDITOR}');`);
  if (exists !== '1') {
    drush('user:create', EDITOR, `--mail=${EDITOR}@example.com`, `--password=${randomBytes(32).toString('hex')}`);
  }
  drush('user:password', EDITOR, randomBytes(32).toString('hex'));
  drush('user:unblock', EDITOR);
  drush('user:role:add', 'content_editor', EDITOR);
  deleteTestCoach();
});

test.afterAll(() => {
  deleteTestCoach();
});

test('AC-1: the four coaches, published, in the source order with their specialty, experience and rate', () => {
  const rows = JSON.parse(php(`
    $ids = \\Drupal::entityQuery('node')->accessCheck(FALSE)->condition('type', 'coach')->condition('status', 1)->sort('field_coach_weight')->execute();
    $out = [];
    foreach (\\Drupal\\node\\Entity\\Node::loadMultiple($ids) as $n) {
      $out[] = [$n->label(), $n->field_coach_specialty->value, $n->field_coach_experience->value, (int) $n->field_coach_rate->value, $n->field_coach_photo->isEmpty()];
    }
    echo json_encode($out);`));
  expect(rows).toEqual(COACHES.map(([name, specialty, experience, rate]) => [name, specialty, experience, rate, true]));
});

test('AC-2: /private-lessons shows the intro, the spotlight, the coaches four to a row, then the call to action', async ({ browser }) => {
  const page = await visit(browser, '/private-lessons');
  const main = page.locator('main');
  await expect(main.locator('h1')).toHaveText('Private Lessons');
  await expect(main).toContainText("1-on-1 and small group development. Work with Kansas City's top hockey and skating professionals to target specific areas of your game.");

  // The sections, in the source's order.
  const order = await main.locator('[data-component-id]').evaluateAll((els) =>
    els.map((el) => el.getAttribute('data-component-id')).filter((id) => ['kchockey:page_intro', 'kchockey:instructor_spotlight', 'kchockey:coach_grid', 'kchockey:cta_band'].includes(id ?? '')));
  expect(order).toEqual(['kchockey:page_intro', 'kchockey:instructor_spotlight', 'kchockey:coach_grid', 'kchockey:cta_band']);

  const spot = spotlight(page);
  for (const text of ['Featured Instructor', 'This month at KCHockey', 'Power Skating & Edge Work', 'Featured rate', '$75/hr',
    'Former ECHL player with 15 years behind the bench, Mike helps players build speed, balance, and confidence one stride at a time. His sessions are a great fit for players ready to make their skating the foundation of their game.']) {
    await expect(spot).toContainText(text);
  }
  await expect(spot.locator('p', { hasText: /^Level\s*Up\.$/ })).toBeVisible();
  await expect(spot.locator('h2')).toHaveText('Coach Mike Donovan');
  await expect(spot.locator('[data-component-id="kchockey:check_item"]')).toHaveText(['Former ECHL player', '15 years coaching', 'Youth through adult', 'Individual game plan']);
  await expect(spot.getByRole('link', { name: 'Book a session' })).toHaveAttribute('href', '/contact');

  // Four to a row at desktop width: the four cards share one top edge.
  await expect(cards(page)).toHaveCount(4);
  const tops = await cards(page).evaluateAll((els) => els.map((el) => Math.round(el.getBoundingClientRect().top)));
  expect(new Set(tops).size).toBe(1);

  await expect(band(page).locator('h2')).toHaveText('Need a Coach Recommendation?');
  await expect(band(page)).toContainText("Not sure who to work with? Tell us about the player's age, current level, and what they want to improve. We'll match you with the right professional.");
  await expect(band(page).getByRole('link', { name: 'Get Matched' })).toHaveAttribute('href', '/contact');

  // One to a row on a phone, with no sideways scroll.
  const phone = await visit(browser, '/private-lessons', 390);
  const lefts = await cards(phone).evaluateAll((els) => els.map((el) => Math.round(el.getBoundingClientRect().left)));
  expect(new Set(lefts).size).toBe(1);
  expect(await phone.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
});

test('AC-3: each card shows the initials, name, specialty, experience, the rate and Inquire; hovered, "View Profile"', async ({ browser }) => {
  const page = await visit(browser, '/private-lessons');
  await expect(cards(page).locator('h3')).toHaveText(NAMES);
  for (const [i, [name, specialty, experience, rate, initials]] of COACHES.entries()) {
    const card = cards(page).nth(i);
    await expect(card.locator('img')).toHaveCount(0);
    await expect(card.getByText(initials, { exact: true })).toBeVisible();
    for (const text of [name, specialty, experience, 'All Ages & Skill Levels', 'Rate', `$${rate}/hr`]) {
      await expect(card).toContainText(text);
    }
    await expect(card.getByRole('link', { name: /^Inquire/ })).toHaveAttribute('href', INQUIRE);
  }

  const card = cards(page).first();
  const label = card.getByText('View Profile');
  await expect(label).toHaveCount(1);
  const overlay = label.locator('..');
  await expect(overlay).toHaveCSS('opacity', '0');
  await card.hover();
  await expect(overlay).toHaveCSS('opacity', '1');
});

test('AC-4: Inquire opens /contact with Private Lessons chosen', async ({ browser }) => {
  const page = await visit(browser, '/private-lessons');
  await cards(page).nth(2).getByRole('link', { name: /^Inquire/ }).click();
  await expect(page).toHaveURL(/\/contact\?subject=Private(%20|\+)Lessons$/);
  await expect(page.locator('select[name="subject"]')).toHaveValue('Private Lessons');
});

test('AC-5: a Content editor adds a coach, edits, reorders and gives it a photo, and the listing follows', async ({ browser }) => {
  test.setTimeout(180_000);
  const editor = await editorPage(browser);

  // Add: sort order 0 puts it first, with its initials.
  await editor.goto('/node/add/coach');
  await editor.locator('input[name="title[0][value]"]').fill(TEST_COACH);
  await editor.locator('input[name="field_coach_specialty[0][value]"]').fill('Stickhandling');
  await editor.locator('input[name="field_coach_experience[0][value]"]').fill('A coach the tests add');
  await editor.locator('input[name="field_coach_rate[0][value]"]').fill('55');
  await editor.locator('input[name="field_coach_weight[0][value]"]').fill('0');
  await editor.locator('select[name="moderation_state[0][state]"]').selectOption('published');
  await saveCoach(editor);

  let page = await visit(browser, '/private-lessons');
  await expect(cards(page).locator('h3')).toHaveText([TEST_COACH, ...NAMES]);
  await expect(cards(page).first()).toContainText('Stickhandling');
  await expect(cards(page).first()).toContainText('$55/hr');
  await expect(cards(page).first().getByText('PT', { exact: true })).toBeVisible();

  // Edit.
  const nid = php(`echo current(\\Drupal::entityTypeManager()->getStorage('node')->loadByProperties(['type' => 'coach', 'title' => ${JSON.stringify(TEST_COACH)}]))->id();`);
  await editor.goto(`/node/${nid}/edit`);
  await editor.locator('input[name="field_coach_rate[0][value]"]').fill('90');
  await saveCoach(editor);
  page = await visit(browser, '/private-lessons');
  await expect(cards(page).first()).toContainText('$90/hr');

  // A photo takes the initials' place.
  await editor.goto(`/node/${nid}/edit`);
  await editor.locator('input[type="file"][name="files[field_coach_photo_0]"]').setInputFiles(PHOTO);
  const alt = editor.locator('input[name="field_coach_photo[0][alt]"]');
  await expect(alt).toBeVisible();
  await alt.fill('Pat Tester on the ice');
  await saveCoach(editor);
  page = await visit(browser, '/private-lessons');
  const photo = cards(page).first().locator('img');
  await expect(photo).toHaveAttribute('alt', 'Pat Tester on the ice');
  await expect(cards(page).first().getByText('PT', { exact: true })).toHaveCount(0);
  // It fills the square (inside the square's 1px bottom border).
  const box = await photo.boundingBox();
  const square = await cards(page).first().locator('.aspect-square').boundingBox();
  expect(Math.abs(box!.width - square!.width)).toBeLessThanOrEqual(1);
  expect(Math.abs(box!.height - square!.height)).toBeLessThanOrEqual(1);

  // Reorder: sort order 99 sends it last.
  await editor.goto(`/node/${nid}/edit`);
  await editor.locator('input[name="field_coach_weight[0][value]"]').fill('99');
  await saveCoach(editor);
  page = await visit(browser, '/private-lessons');
  await expect(cards(page).locator('h3')).toHaveText([...NAMES, TEST_COACH]);
});

test('AC-5: adding a coach is for staff only', async ({ request }) => {
  const response = await request.get('/node/add/coach', { maxRedirects: 0 });
  expect(response.status()).toBe(403);
});

test('AC-6: the spotlight is Canvas props a Content editor can change', async ({ browser }) => {
  // The editor may open the page in Canvas, where the spotlight is placeable.
  const editor = await editorPage(browser);
  const response = await editor.goto(`/canvas/editor/canvas_page/${PAGE_ID}`);
  expect(response?.status()).toBe(200);
  await editor.context().close();
  const enabled = php(`$s = \\Drupal::entityTypeManager()->getStorage('component'); echo (int) $s->load('sdc.kchockey.instructor_spotlight')->status(), (int) $s->load('sdc.kchockey.check_item')->status(), (int) $s->load('sdc.kchockey.cta_band')->status();`);
  expect(enabled).toBe('111');

  // A change to the props in the page's tree is what the page shows.
  const tree = php(`echo json_encode(\\Drupal::entityTypeManager()->getStorage('canvas_page')->load(${PAGE_ID})->get('components')->getValue());`);
  const edit = (from: string, to: string) =>
    php(`$p = \\Drupal::entityTypeManager()->getStorage('canvas_page')->load(${PAGE_ID}); $v = $p->get('components')->getValue();
      foreach ($v as &$i) { $i['inputs'] = str_replace(${JSON.stringify(JSON.stringify(from).slice(1, -1))}, ${JSON.stringify(JSON.stringify(to).slice(1, -1))}, $i['inputs']); }
      $p->set('components', $v); $p->save();`);
  // (Texts without "&", which the stored inputs escape.)
  try {
    edit('This month at KCHockey', 'Next month at KCHockey');
    edit('Individual game plan', 'Video review included');
    const page = await visit(browser, '/private-lessons');
    await expect(spotlight(page)).toContainText('Next month at KCHockey');
    await expect(spotlight(page)).toContainText('Video review included');
    await expect(spotlight(page)).not.toContainText('This month at KCHockey');
  } finally {
    edit('Next month at KCHockey', 'This month at KCHockey');
    edit('Video review included', 'Individual game plan');
  }
  const restored = php(`echo json_encode(\\Drupal::entityTypeManager()->getStorage('canvas_page')->load(${PAGE_ID})->get('components')->getValue());`);
  expect(restored).toBe(tree);
});

test("AC-7: a coach's own address forwards to /private-lessons", async ({ request }) => {
  const nid = php(`echo current(\\Drupal::entityTypeManager()->getStorage('node')->loadByProperties(['type' => 'coach', 'title' => 'Coach Mike Donovan']))->id();`);
  for (const route of ['/private-lessons/coach-mike-donovan', `/node/${nid}`]) {
    const response = await request.get(route, { maxRedirects: 0 });
    expect(response.status(), route).toBe(301);
    expect(new URL(response.headers()['location'], BASE).pathname, route).toBe('/private-lessons');
  }
});

// Test identities must never remain usable after the suite.
test.afterAll(() => {
  drush('user:block', EDITOR);
});
