import { randomBytes } from 'node:crypto';
import { execFileSync } from 'node:child_process';
import { test, expect, type Page, type Browser } from '@playwright/test';

/**
 * Rung 7: /youth-leagues and /adult-leagues, the season snapshot, the
 * division guide, the format cards and the event spotlight
 * (droost/intake/tickets/R07.md). Each test names the acceptance criteria it
 * proves.
 *
 * The test that edits the pages restores their trees, and the file runs in
 * order in one worker: the pages are shared state.
 */
test.describe.configure({ mode: 'default', timeout: 120000 });

const BASE = process.env.PLAYWRIGHT_BASE_URL || 'https://kch-a.ddev.site';
const EDITOR = 'r07_editor';
const YOUTH_ID = 6;
const ADULT_ID = 7;

/** The source's words (artifacts/kchockey/src/pages/youth-leagues.tsx), in its order. */
const YOUTH_CHECKS = ['Beginner-friendly programs', 'Certified coaches', 'Rec and competitive paths'];
const FIGURES: [string, string][] = [['5', 'Age pathways'], ['8+', 'KC rinks'], ['1', 'Great first step'], ['100%', 'Team energy']];
const DIVISIONS: [string, string, string, string][] = [
  ['Mite', '6U–8U', 'A welcoming introduction to team hockey with an emphasis on skating, confidence, and fun.', 'Half-ice games and skill-first practices'],
  ['Squirt', '10U', 'Players build stronger fundamentals while learning positioning, passing, and playing as a team.', 'Full-ice development and game play'],
  ['Peewee', '12U', 'A faster pace with more tactical detail, helping players find their strengths on the ice.', 'Competitive rec and travel pathways'],
  ['Bantam', '14U', 'Players sharpen decision-making, systems, and physical confidence in an age-appropriate environment.', 'Team systems and skill development'],
  ['High School', '15U–18U', 'A place to keep playing, compete hard, and prepare for the next level of hockey.', 'School-year and club opportunities'],
];
const YOUTH_QUESTIONS = [
  'Does my child need prior hockey experience?',
  'How are players placed on teams?',
  'What does a typical season include?',
  'Where can I find youth league registration?',
];

/** The source's words (artifacts/kchockey/src/pages/adult-leagues.tsx), in its order. */
const FORMATS: [string, string, string][] = [
  ['Recreational', 'All skill levels', 'Low-pressure games, new friends, and a reason to leave work on time. A great place to get back on the ice or learn the adult game.'],
  ['Intermediate', 'C / B level', 'Competitive enough to matter and friendly enough to grab a drink afterward. Balanced teams keep every shift moving.'],
  ['Advanced', 'A / AA level', 'Fast, structured hockey for players who want a serious skate and a full 60 minutes of pace.'],
];
const ADULT_QUESTIONS = [
  'Do I need a full team to register?',
  'What equipment do adult players need?',
  'What level should I sign up for?',
  'Where are adult leagues played?',
];

/**
 * Runs drush in the DDEV site and returns what it printed: through ddev from
 * the host, directly inside the web container (where `ddev` is only a stub).
 */
function drush(...args: string[]): string {
  return process.env.IS_DDEV_PROJECT === 'true'
    ? execFileSync('drush', args, { encoding: 'utf8' }).trim()
    : execFileSync('ddev', ['drush', ...args], { encoding: 'utf8' }).trim();
}

/** Runs PHP in the booted site. */
function php(code: string): string {
  return drush('php:eval', code);
}

type Item = { uuid: string; component_id: string; parent_uuid: string | null; slot: string | null; inputs: Record<string, unknown> };

/** A page's Canvas tree, as `droost/bin/canvas tree:get` reads it. */
function getTree(id: number): Item[] {
  const answer = JSON.parse(execFileSync('droost/bin/canvas', ['tree:get', String(id)], { encoding: 'utf8' }));
  return answer.data.items.map(({ uuid, component_id, parent_uuid, slot, inputs }: Item) => ({ uuid, component_id, parent_uuid, slot, inputs }));
}

/** Writes a page's Canvas tree, validated by Canvas, as an editor's save does. */
function setTree(id: number, items: Item[]): void {
  execFileSync('droost/bin/canvas', ['tree:set', String(id), '--items=-'], { input: JSON.stringify({ items }), encoding: 'utf8' });
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

const component = (page: Page, name: string) => page.locator(`[data-component-id="kchockey:${name}"]`);
const questions = (page: Page) => component(page, 'faq_accordion').locator('[data-faq-item] summary');

/** The page's sections, in order, by component. */
async function sections(page: Page): Promise<string[]> {
  return page.locator('main [data-component-id]').evaluateAll((els) =>
    els.filter((el) => !el.parentElement?.closest('main [data-component-id]')).map((el) => String(el.getAttribute('data-component-id'))));
}

/** Asserts that `right` sits beside `left`, top-aligned within `slack` pixels. */
async function beside(left: ReturnType<Page['locator']>, right: ReturnType<Page['locator']>, slack = 40): Promise<void> {
  const a = (await left.boundingBox())!;
  const b = (await right.boundingBox())!;
  expect(b.x).toBeGreaterThanOrEqual(a.x + a.width - 1);
  expect(Math.abs(b.y - a.y)).toBeLessThan(slack);
}

/** Asserts that the question intro shows its two buttons and the accordion opens a question. */
async function questionsWork(page: Page, buttons: [string, string][], list: string[]): Promise<void> {
  const intro = component(page, 'question_intro');
  for (const [label, href] of buttons) {
    await expect(intro.getByRole('link', { name: label })).toHaveAttribute('href', href);
  }
  await expect(questions(page)).toHaveText(list);
  await beside(intro, component(page, 'faq_accordion'));
  await questions(page).first().click();
  await expect(component(page, 'faq_accordion').locator('[data-faq-item][open]')).toHaveCount(1);
}

test.beforeAll(() => {
  // The Content editor the editing test acts as: created once, kept for re-runs.
  const exists = php(`echo (int) (bool) user_load_by_name('${EDITOR}');`);
  if (exists !== '1') {
    drush('user:create', EDITOR, `--mail=${EDITOR}@example.com`, `--password=${randomBytes(32).toString('hex')}`);
  }
  drush('user:password', EDITOR, randomBytes(32).toString('hex'));
  drush('user:unblock', EDITOR);
  drush('user:role:add', 'content_editor', EDITOR);
});

test('AC-1: /youth-leagues shows the intro, the start panel beside the season snapshot, the division guide, then the questions', async ({ browser }) => {
  const page = await visit(browser, '/youth-leagues');
  const main = page.locator('main');
  await expect(main).toContainText('Build the next generation');
  await expect(main.locator('h1')).toHaveText(/Youth\s*Leagues/);
  expect(await sections(page)).toEqual(['kchockey:page_intro', 'kchockey:start_panel', 'kchockey:division_guide', 'kchockey:question_section']);

  // "Start here": heading, text, three checks in a row that wraps (the
  // column is too narrow for all three, in the source too), beside the snapshot.
  const panel = component(page, 'start_panel');
  await expect(panel).toContainText('Start here');
  await expect(panel.locator('h2')).toHaveText('A team for every stage.');
  await expect(panel).toContainText('KC youth hockey has room for first-time skaters, weekend players, and serious competitors.');
  const checks = panel.locator('[data-component-id="kchockey:check_item"]');
  await expect(checks).toHaveText(YOUTH_CHECKS);
  const lefts = await checks.evaluateAll((els) => els.map((el) => el.getBoundingClientRect()).map((r) => [Math.round(r.top), Math.round(r.left)]));
  expect(lefts[1][0]).toBe(lefts[0][0]);
  expect(lefts[1][1]).toBeGreaterThan(lefts[0][1]);
  const snapshot = component(page, 'season_snapshot');
  await expect(snapshot).toContainText('Season snapshot');
  const figures = snapshot.locator('[data-component-id="kchockey:stat_figure"]');
  await expect(figures.locator('p:first-child')).toHaveText(FIGURES.map(([value]) => value));
  await expect(figures.locator('p:last-child')).toHaveText(FIGURES.map(([, label]) => label));
  await beside(panel.locator('h2'), snapshot, 400);

  // The division guide: five rows of name, ages, description and detail.
  const guide = component(page, 'division_guide');
  await expect(guide).toContainText('Find the fit');
  await expect(guide.locator('h2')).toHaveText('Division guide');
  const rows = guide.locator('[data-component-id="kchockey:division_row"]');
  await expect(rows).toHaveCount(DIVISIONS.length);
  for (const [i, [name, ages, description, detail]] of DIVISIONS.entries()) {
    await expect(rows.nth(i).locator('h3')).toHaveText(name);
    await expect(rows.nth(i).locator('span')).toHaveText(ages);
    await expect(rows.nth(i).locator('p').first()).toHaveText(description);
    await expect(rows.nth(i).locator('p').last()).toHaveText(detail);
    await expect(rows.nth(i).locator('p').last()).toBeVisible();
  }

  // "Parents, we've got answers." beside the four questions.
  const intro = component(page, 'question_intro');
  await expect(intro).toContainText('On the bench');
  await expect(intro.locator('h2')).toHaveText(/Parents,\s*we've got answers\./);
  await expect(intro).toContainText('Starting a new sport comes with a lot of questions.');
  await questionsWork(page, [['Find a rink', '/rinks'], ['New to hockey?', '/new-to-hockey']], YOUTH_QUESTIONS);
  await page.context().close();
});

test('AC-2: /adult-leagues shows the intro, the format cards, the season spotlight, then the questions', async ({ browser }) => {
  const page = await visit(browser, '/adult-leagues');
  const main = page.locator('main');
  await expect(main).toContainText('Your week needs a skate');
  await expect(main.locator('h1')).toHaveText(/Adult\s*Leagues/);
  expect(await sections(page)).toEqual(['kchockey:page_intro', 'kchockey:format_section', 'kchockey:event_spotlight', 'kchockey:question_section']);

  // "A league for every level." with its note, over three cards in a row.
  const formats = component(page, 'format_section');
  await expect(formats).toContainText('Pick your pace');
  await expect(formats.locator('h2')).toHaveText(/A league for\s*every level\./);
  await expect(formats).toContainText('From first-time adult players to former college skaters, the right division makes every game more fun.');
  const cards = formats.locator('[data-component-id="kchockey:format_card"]');
  await expect(cards).toHaveCount(FORMATS.length);
  for (const [i, [title, level, description]] of FORMATS.entries()) {
    await expect(cards.nth(i).locator('h3')).toHaveText(title);
    await expect(cards.nth(i).locator('span')).toHaveText(level);
    await expect(cards.nth(i).locator('p')).toHaveText(description);
    await expect(cards.nth(i).locator('svg')).toHaveCount(1);
  }
  const tops = await cards.evaluateAll((els) => els.map((el) => Math.round(el.getBoundingClientRect().top)));
  expect(new Set(tops).size).toBe(1);

  // The spotlight band.
  const spotlight = component(page, 'event_spotlight');
  await expect(spotlight).toContainText('Fall season spotlight');
  await expect(spotlight.locator('h2')).toHaveText('Adult Hockey League Showcase');
  await expect(spotlight).toContainText('Want to see the adult hockey scene before you commit? The showcase at Twin Rinks Ice Pavilion is a free chance to watch local teams, meet players, and find your next league.');
  for (const line of ['Sept 14', 'Twin Rinks Ice Pavilion', '18+ · All levels']) {
    await expect(spotlight.locator('div.flex', { hasText: line })).toBeVisible();
  }
  await expect(spotlight.getByRole('link', { name: 'View event details' })).toHaveAttribute('href', '/camps');

  // "New to the adult game?" beside the four questions.
  const intro = component(page, 'question_intro');
  await expect(intro).toContainText('Before your first game');
  await expect(intro.locator('h2')).toHaveText(/New to the\s*adult game\?/);
  await expect(intro).toContainText('You do not need a perfect beer-league résumé.');
  await questionsWork(page, [['Start with the basics', '/new-to-hockey'], ['Browse KC rinks', '/rinks']], ADULT_QUESTIONS);
  await page.context().close();
});

test('AC-3: at phone width each division keeps its name and ages on one line, the description below at full width, and no detail', async ({ browser }) => {
  const page = await visit(browser, '/youth-leagues', 390);
  const rows = component(page, 'division_guide').locator('[data-component-id="kchockey:division_row"]');
  await expect(rows).toHaveCount(DIVISIONS.length);
  for (let i = 0; i < DIVISIONS.length; i++) {
    const row = rows.nth(i);
    const box = (await row.boundingBox())!;
    const name = (await row.locator('h3').boundingBox())!;
    const ages = (await row.locator('span').boundingBox())!;
    const description = (await row.locator('p').first().boundingBox())!;
    expect(ages.x).toBeGreaterThan(name.x + name.width - 1);
    expect(Math.abs(ages.y + ages.height / 2 - (name.y + name.height / 2))).toBeLessThan(4);
    expect(description.y).toBeGreaterThanOrEqual(Math.max(name.y + name.height, ages.y + ages.height) - 1);
    expect(description.width).toBeGreaterThan(box.width - 2);
    await expect(row.locator('p').last()).toBeHidden();
  }
  await page.context().close();
});

test('AC-4: a Content editor edits a figure, a division, a format, the spotlight and a question in Canvas, and the pages show it', async ({ browser }) => {
  // The editor may open both pages in Canvas, where every piece is placeable.
  const editor = await browser.newContext({ ignoreHTTPSErrors: true });
  const tab = await editor.newPage();
  await tab.goto(drush('user:login', `--name=${EDITOR}`, '--no-browser', `--uri=${BASE}`));
  for (const id of [YOUTH_ID, ADULT_ID]) {
    expect((await tab.goto(`/canvas/editor/canvas_page/${id}`))?.status()).toBe(200);
  }
  await editor.close();
  const ids = ['start_panel', 'season_snapshot', 'stat_figure', 'division_guide', 'division_row', 'format_section', 'format_card', 'event_spotlight'];
  const enabled = php(`$s = \\Drupal::entityTypeManager()->getStorage('component'); foreach (${JSON.stringify(ids.map((id) => `sdc.kchockey.${id}`)).replace(/"/g, "'")} as $id) { echo (int) $s->load($id)->status(); }`);
  expect(enabled).toBe('1'.repeat(ids.length));

  const youth = getTree(YOUTH_ID);
  const adult = getTree(ADULT_ID);
  const edit = (items: Item[], match: (i: Item) => boolean, inputs: Record<string, unknown>) =>
    items.map((i) => (match(i) ? { ...i, inputs: { ...i.inputs, ...inputs } } : i));
  const is = (name: string, key: string, value: unknown) => (i: Item) => i.component_id === `sdc.kchockey.${name}` && i.inputs[key] === value;

  let youthEdited = edit(youth, is('stat_figure', 'label', 'KC rinks'), { value: '9+' });
  youthEdited = edit(youthEdited, is('division_row', 'name', 'Bantam'), { ages: '13U–14U', detail: 'Body-contact introduction' });
  youthEdited = edit(youthEdited, is('faq_item', 'question', YOUTH_QUESTIONS[1]), { question: 'How are teams formed?' });
  let adultEdited = edit(adult, is('format_card', 'title', 'Intermediate'), { level: 'B level', description: 'Balanced teams, every shift.' });
  adultEdited = edit(adultEdited, is('event_spotlight', 'heading', 'Adult Hockey League Showcase'), { heading: 'Winter Classic', date: 'Jan 10', place: 'Line Creek Community Center' });
  adultEdited = edit(adultEdited, is('faq_item', 'question', ADULT_QUESTIONS[3]), { answer: 'At every rink in the directory.' });

  try {
    setTree(YOUTH_ID, youthEdited);
    setTree(ADULT_ID, adultEdited);

    const y = await visit(browser, '/youth-leagues');
    const figure = component(y, 'stat_figure').filter({ hasText: 'KC rinks' });
    await expect(figure.locator('p').first()).toHaveText('9+');
    const bantam = component(y, 'division_row').filter({ has: y.locator('h3', { hasText: 'Bantam' }) });
    await expect(bantam.locator('span')).toHaveText('13U–14U');
    await expect(bantam.locator('p').last()).toHaveText('Body-contact introduction');
    await expect(questions(y)).toHaveText([YOUTH_QUESTIONS[0], 'How are teams formed?', ...YOUTH_QUESTIONS.slice(2)]);
    await y.context().close();

    const a = await visit(browser, '/adult-leagues');
    const intermediate = component(a, 'format_card').filter({ has: a.locator('h3', { hasText: 'Intermediate' }) });
    await expect(intermediate.locator('span')).toHaveText('B level');
    await expect(intermediate.locator('p')).toHaveText('Balanced teams, every shift.');
    const spotlight = component(a, 'event_spotlight');
    await expect(spotlight.locator('h2')).toHaveText('Winter Classic');
    await expect(spotlight).toContainText('Jan 10');
    await expect(spotlight).toContainText('Line Creek Community Center');
    await expect(spotlight).not.toContainText('Sept 14');
    const last = component(a, 'faq_accordion').locator('[data-faq-item]').last();
    await last.locator('summary').click();
    await expect(last.locator('summary + div')).toHaveText('At every rink in the directory.');
    await a.context().close();
  }
  finally {
    setTree(YOUTH_ID, youth);
    setTree(ADULT_ID, adult);
  }
  expect(getTree(YOUTH_ID)).toEqual(youth);
  expect(getTree(ADULT_ID)).toEqual(adult);
  const restored = await visit(browser, '/adult-leagues');
  await expect(component(restored, 'event_spotlight').locator('h2')).toHaveText('Adult Hockey League Showcase');
  await restored.context().close();
});

// Test identities must never remain usable after the suite.
test.afterAll(() => {
  drush('user:block', EDITOR);
});
