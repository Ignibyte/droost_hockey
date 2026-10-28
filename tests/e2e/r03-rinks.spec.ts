import { execFileSync } from 'node:child_process';
import { test, expect, type Page, type Browser } from '@playwright/test';

/**
 * Rung 3: rinks, /rinks and the home page's rinks (droost/intake/tickets/R03.md).
 * Each test names the acceptance criteria it proves.
 *
 * Tests that edit rinks restore them, and the file runs in order in one
 * worker: the lists are shared state.
 */
test.describe.configure({ mode: 'default', timeout: 120000 });

const BASE = process.env.PLAYWRIGHT_BASE_URL || 'https://kch-a.ddev.site';
const EDITOR = 'r03_editor';
const TEST_RINK = 'R03 Test Rink';

/** The source's rinks (design/…/src/data/mock-data.ts), in its order. */
const RINKS: [string, string, string, string, string[]][] = [
  ['Pepsi Ice Midwest', 'Overland Park', 'KS', 'A premier facility offering a full NHL sheet, dedicated pro shop, and extensive programming for all ages.', ['NHL Sheet', 'Pro Shop', 'Lessons', 'Leagues']],
  ['Cable Dahmer Arena', 'Independence', 'MO', "Home of the ECHL's Kansas City Mavericks. A professional venue with excellent ice quality and seating.", ['Professional Venue', 'Event Seating', 'Concessions', 'Team Store']],
  ['Central Park Ice Arena', 'Kansas City', 'MO', "The heart of KC's recreational skating. Great for families, beginners, and casual drop-in hockey.", ['Public Skate', 'Learn-to-Skate', 'Youth Leagues', 'Snack Bar']],
  ['Twin Rinks Ice Pavilion', 'Liberty', 'MO', "A massive dual-sheet facility hosting the region's largest tournaments and figure skating competitions.", ['Two Sheets', 'Tournaments', 'Figure Skating', 'Meeting Rooms']],
  ['Olathe Ice Arena', 'Olathe', 'KS', 'A tight-knit community rink focused on youth development and consistent stick-and-puck sessions.', ['Community Rink', 'Youth Leagues', 'Stick-and-Puck', 'Party Rooms']],
  ['Blade Runners Ice Complex', 'Blue Springs', 'MO', 'State-of-the-art training center with two sheets of ice, dedicated off-ice facilities, and competitive leagues.', ['Two Sheets', 'Leagues', 'Camps', 'Dryland Training']],
  ['Summit Ice Arena', "Lee's Summit", 'MO', 'Family-friendly environment perfect for birthday parties, introductory classes, and local youth hockey.', ['Public Skate', 'Youth Hockey', 'Birthday Parties', 'Cafe']],
  ['Swope Memorial Ice Rink', 'Kansas City', 'MO', 'A historic, seasonal outdoor rink offering a classic winter skating experience right in the city.', ['Historic Venue', 'Outdoor Skating', 'Seasonal Events', 'Skate Rentals']],
];
const NAMES = RINKS.map(([name]) => name);

/** Runs drush in the DDEV site and returns what it printed. */
function drush(...args: string[]): string {
  return execFileSync('ddev', ['drush', ...args], { encoding: 'utf8' }).trim();
}

/** Runs PHP in the booted site. */
function php(code: string): string {
  return drush('php:eval', code);
}

/** Sets a rink's phone and website (empty strings empty them). */
function setContact(name: string, phone: string, website: string): void {
  php(`$n = current(\\Drupal::entityTypeManager()->getStorage('node')->loadByProperties(['type' => 'rink', 'title' => ${JSON.stringify(name)}]));
    $n->set('field_rink_phone', ${JSON.stringify(phone)} ?: NULL);
    $n->set('field_rink_website', ${JSON.stringify(website)} ? ['uri' => ${JSON.stringify(website)}] : NULL);
    $n->save();`);
}

/** Deletes the rink these tests add, if a run left it. */
function deleteTestRink(): void {
  php(`foreach (\\Drupal::entityTypeManager()->getStorage('node')->loadByProperties(['type' => 'rink', 'title' => ${JSON.stringify(TEST_RINK)}]) as $n) { $n->delete(); }`);
}

/**
 * A visitor's page in a fresh browser. The site sends pages with
 * `Cache-Control: max-age=900, public`, so a second visit in the same browser
 * would be served from that browser's cache, not by the site.
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

/** Saves a rink form (Gin's sticky Save); a rink's page forwards to /rinks. */
async function saveRink(page: Page): Promise<void> {
  await Promise.all([
    page.waitForURL((url) => url.pathname === '/rinks'),
    page.locator('#gin-sticky-edit-submit').click(),
  ]);
}

const cards = (page: Page) => page.locator('[data-component-id="kchockey:rink_card"]');
const tiles = (page: Page) => page.locator('[data-component-id="kchockey:rink_tile"]');

test.beforeAll(() => {
  // The Content editor these tests act as: created once, kept for re-runs.
  const exists = php(`echo (int) (bool) user_load_by_name('${EDITOR}');`);
  if (exists !== '1') {
    drush('user:create', EDITOR, `--mail=${EDITOR}@example.com`, `--password=r03-${Date.now()}`);
  }
  drush('user:role:add', 'content_editor', EDITOR);
  deleteTestRink();
});

test.afterAll(() => {
  deleteTestRink();
  setContact('Pepsi Ice Midwest', '', '');
});

test('AC-1: the eight rinks, published, in the source order with its details and no phone or website', () => {
  const rows = JSON.parse(php(`
    $ids = \\Drupal::entityQuery('node')->accessCheck(FALSE)->condition('type', 'rink')->condition('status', 1)->sort('field_rink_weight')->execute();
    $out = [];
    foreach (\\Drupal\\node\\Entity\\Node::loadMultiple($ids) as $n) {
      $out[] = [$n->label(), $n->field_rink_city->value, $n->field_rink_state->value, $n->field_rink_description->value,
        array_column($n->field_rink_amenities->getValue(), 'value'), $n->field_rink_phone->isEmpty(), $n->field_rink_website->isEmpty()];
    }
    echo json_encode($out);`));
  expect(rows).toEqual(RINKS.map((r) => [...r, true, true]));
});

test('AC-2: /rinks shows the intro, the map panel, then every rink card two to a row', async ({ browser }) => {
  const page = await visit(browser, '/rinks');
  const main = page.locator('main');
  await expect(main.locator('h1')).toHaveText('KC Rink Directory');
  await expect(main).toContainText('Every sheet of ice in the Kansas City metro area. Find locations, amenities, and contact info.');

  const map = page.locator('[data-component-id="kchockey:rink_map"]');
  const frame = map.locator('iframe');
  await expect(frame).toHaveAttribute('src', /^https:\/\/www\.google\.com\/maps\?q=Kansas(%20|\+)City(%20|\+)MO(%20|\+)ice(%20|\+)rinks&z=10&output=embed$/);
  await expect(map).toContainText('The KC Ice Map');
  await expect(map.locator('h2')).toHaveText('Find your sheet.');
  await expect(map).toContainText("From the Northland to Johnson County, the metro's ice is closer than you think.");
  const open = map.getByRole('link', { name: /Open in Google Maps/ });
  await expect(open).toHaveAttribute('href', 'https://www.google.com/maps/search/ice+rinks+in+Kansas+City/');
  await expect(open).toHaveAttribute('target', '_blank');

  // The intro, the map, then the cards.
  const order = await page.locator('main [data-component-id]').evaluateAll((els) => els.map((e) => e.getAttribute('data-component-id')));
  const at = (id: string) => order.indexOf(id);
  expect(at('kchockey:page_intro')).toBeLessThan(at('kchockey:rink_map'));
  expect(at('kchockey:rink_map')).toBeLessThan(at('kchockey:rink_card'));

  await expect(cards(page).locator('h2')).toHaveText(NAMES);
  for (const [i, [, city, state, description, amenities]] of RINKS.entries()) {
    const card = cards(page).nth(i);
    await expect(card).toContainText(`${city}, ${state}`);
    await expect(card).toContainText(description);
    await expect(card).toContainText('Amenities');
    await expect(card.locator('[data-component-id="kchockey:amenity_tag"]')).toHaveText(amenities);
  }

  // Two to a row at 1280px: the first two side by side, the third below.
  const [a, b, c] = await Promise.all([0, 1, 2].map((i) => cards(page).nth(i).boundingBox()));
  expect(Math.abs(a!.y - b!.y)).toBeLessThan(2);
  expect(b!.x).toBeGreaterThan(a!.x);
  expect(c!.y).toBeGreaterThan(a!.y + a!.height - 1);
  // One to a row at 390px.
  const narrow = await visit(browser, '/rinks', 390);
  const [n0, n1] = await Promise.all([0, 1].map((i) => cards(narrow).nth(i).boundingBox()));
  expect(Math.abs(n0!.x - n1!.x)).toBeLessThan(2);
  expect(n1!.y).toBeGreaterThan(n0!.y);
});

test('AC-3: a card shows no phone or website while they are empty, and a call link and Visit Website once set', async ({ browser }) => {
  const empty = await visit(browser, '/rinks');
  await expect(cards(empty)).toHaveCount(8);
  await expect(empty.locator('main a[href^="tel:"]')).toHaveCount(0);
  await expect(empty.locator('main')).not.toContainText('Visit Website');

  setContact('Pepsi Ice Midwest', '(913) 555-0101', 'https://example.com/pepsi-ice');
  try {
    const page = await visit(browser, '/rinks');
    const card = cards(page).filter({ hasText: 'Pepsi Ice Midwest' });
    const call = card.locator('a[href^="tel:"]');
    await expect(call).toHaveAttribute('href', 'tel:9135550101');
    await expect(call).toHaveText('(913) 555-0101');
    const site = card.getByRole('link', { name: /Visit Website/ });
    await expect(site).toHaveAttribute('href', 'https://example.com/pepsi-ice');
    await expect(site).toHaveAttribute('target', '_blank');
    // Only that rink's card changed.
    await expect(page.locator('main a[href^="tel:"]')).toHaveCount(1);
  }
  finally {
    setContact('Pepsi Ice Midwest', '', '');
  }
  const again = await visit(browser, '/rinks');
  await expect(again.locator('main a[href^="tel:"]')).toHaveCount(0);
});

test('AC-4: the home page shows Find Your Ice after the ticker, with the first three rinks', async ({ browser }) => {
  const page = await visit(browser, '/');
  const order = await page.locator('main [data-component-id]').evaluateAll((els) => els.map((e) => e.getAttribute('data-component-id')));
  expect(order.indexOf('kchockey:ticker')).toBeGreaterThan(-1);
  expect(order.indexOf('kchockey:ticker')).toBeLessThan(order.indexOf('kchockey:rinks_band'));

  const band = page.locator('[data-component-id="kchockey:rinks_band"]');
  await expect(band.locator('h2')).toHaveText('Find Your Ice');
  await expect(band).toContainText("Whether you're looking for drop-in hockey, a learn-to-skate program for the kids, or late-night stick and puck. We've mapped out every sheet of ice in the KC metro.");
  await expect(tiles(page).locator('h3')).toHaveText(NAMES.slice(0, 3));
  for (const [i, [, city, state, , amenities]] of RINKS.slice(0, 3).entries()) {
    const tile = tiles(page).nth(i);
    await expect(tile).toContainText(`${city}, ${state}`);
    await expect(tile.locator('[data-component-id="kchockey:amenity_tag"]')).toHaveText(amenities.slice(0, 3));
    await expect(tile.getByRole('link', { name: /View Rink/ })).toHaveAttribute('href', '/rinks');
  }
  await expect(band.getByRole('link', { name: 'Directory of All KC Rinks' })).toHaveAttribute('href', '/rinks');
});

test('AC-5: a Content editor adds a rink, edits it and reorders it, and /rinks and / follow', async ({ browser }) => {
  const editor = await editorPage(browser);

  // Add: sort order 0 puts it first.
  await editor.goto('/node/add/rink');
  await editor.locator('input[name="title[0][value]"]').fill(TEST_RINK);
  await editor.locator('input[name="field_rink_city[0][value]"]').fill('Gladstone');
  await editor.locator('select[name="field_rink_state"]').selectOption('MO');
  await editor.locator('textarea[name="field_rink_description[0][value]"]').fill('A rink the tests add.');
  await editor.locator('input[name="field_rink_amenities[0][value]"]').fill('Test Ice');
  await editor.locator('input[name="field_rink_weight[0][value]"]').fill('0');
  await editor.locator('select[name="moderation_state[0][state]"]').selectOption('published');
  await saveRink(editor);

  let page = await visit(browser, '/rinks');
  await expect(cards(page).locator('h2')).toHaveText([TEST_RINK, ...NAMES]);
  await expect(cards(page).first()).toContainText('Gladstone, MO');
  page = await visit(browser, '/');
  await expect(tiles(page).locator('h3')).toHaveText([TEST_RINK, ...NAMES.slice(0, 2)]);

  // Edit.
  const nid = php(`echo current(\\Drupal::entityTypeManager()->getStorage('node')->loadByProperties(['type' => 'rink', 'title' => ${JSON.stringify(TEST_RINK)}]))->id();`);
  await editor.goto(`/node/${nid}/edit`);
  await editor.locator('input[name="field_rink_city[0][value]"]').fill('North Kansas City');
  await saveRink(editor);
  page = await visit(browser, '/rinks');
  await expect(cards(page).first()).toContainText('North Kansas City, MO');
  page = await visit(browser, '/');
  await expect(tiles(page).first()).toContainText('North Kansas City, MO');

  // Reorder: sort order 99 sends it last, and off the home page.
  await editor.goto(`/node/${nid}/edit`);
  await editor.locator('input[name="field_rink_weight[0][value]"]').fill('99');
  await saveRink(editor);
  page = await visit(browser, '/rinks');
  await expect(cards(page).locator('h2')).toHaveText([...NAMES, TEST_RINK]);
  page = await visit(browser, '/');
  await expect(tiles(page).locator('h3')).toHaveText(NAMES.slice(0, 3));
});

test("AC-6: a rink's own address forwards to /rinks", async ({ request }) => {
  const nid = php(`echo current(\\Drupal::entityTypeManager()->getStorage('node')->loadByProperties(['type' => 'rink', 'title' => 'Pepsi Ice Midwest']))->id();`);
  for (const path of ['/rinks/pepsi-ice-midwest', `/node/${nid}`]) {
    const response = await request.get(path, { maxRedirects: 0 });
    expect(response.status(), path).toBe(301);
    expect(new URL(response.headers()['location'], BASE).pathname, path).toBe('/rinks');
  }
});
