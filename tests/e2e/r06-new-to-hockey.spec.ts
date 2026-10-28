import { execFileSync } from 'node:child_process';
import { test, expect, type Page, type Browser } from '@playwright/test';

/**
 * Rung 6: /new-to-hockey, its first steps, the question intro and the FAQ
 * accordion (droost/intake/tickets/R06.md). Each test names the acceptance
 * criteria it proves.
 *
 * The test that edits the page restores its tree, and the file runs in order
 * in one worker: the page is shared state.
 */
test.describe.configure({ mode: 'default', timeout: 120000 });

const BASE = process.env.PLAYWRIGHT_BASE_URL || 'https://kch-a.ddev.site';
const EDITOR = 'r06_editor';
const PAGE_ID = 5;

/** The source's first steps (artifacts/kchockey/src/pages/new-to-hockey.tsx), in its order. */
const STEPS: [string, string][] = [
  ['Find the ice', 'Start with a rink that offers learn-to-skate or beginner hockey programs.'],
  ['Get fitted', 'Ask the rink about rental gear or a proper equipment fitting before buying.'],
  ['Take the first stride', 'Book an intro class, clinic, or private lesson and have fun learning.'],
];
const CHECKLIST = ['No skating experience required', 'Rental gear is available at many rinks', 'Programs for kids and adults'];
const QUESTIONS = [
  'What age can my child start hockey?',
  'What equipment do we need to begin?',
  'Does my player need to know how to skate?',
  'How much does it cost to get started?',
  'Is hockey safe for kids?',
  'What is the difference between a clinic, camp, and league?',
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

type Item = { uuid: string; component_id: string; parent_uuid: string | null; slot: string | null; inputs: Record<string, unknown> | unknown[] };

/** The page's Canvas tree, as `droost/bin/canvas tree:get` reads it. */
function getTree(): Item[] {
  const answer = JSON.parse(execFileSync('droost/bin/canvas', ['tree:get', String(PAGE_ID)], { encoding: 'utf8' }));
  return answer.data.items.map(({ uuid, component_id, parent_uuid, slot, inputs }: Item) => ({ uuid, component_id, parent_uuid, slot, inputs }));
}

/** Writes the page's Canvas tree, validated by Canvas, as an editor's save does. */
function setTree(items: Item[]): void {
  execFileSync('droost/bin/canvas', ['tree:set', String(PAGE_ID), '--items=-'], { input: JSON.stringify({ items }), encoding: 'utf8' });
}

/**
 * A visitor's page in a fresh browser. The site sends pages with
 * `Cache-Control: max-age=900, public`, so a second visit in the same browser
 * would be served from that browser's cache, not by the site.
 */
async function visit(browser: Browser, route: string, options: { width?: number; javaScriptEnabled?: boolean } = {}): Promise<Page> {
  const context = await browser.newContext({
    ignoreHTTPSErrors: true,
    viewport: { width: options.width ?? 1280, height: 900 },
    javaScriptEnabled: options.javaScriptEnabled ?? true,
  });
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

type AxNode = { role?: { value: string }; name?: { value: string }; properties?: { name: string; value: { value: unknown } }[]; ignored?: boolean };

/** Chromium's accessibility tree: what assistive technology is given. */
async function axTree(page: Page): Promise<AxNode[]> {
  const cdp = await page.context().newCDPSession(page);
  await cdp.send('Accessibility.enable');
  const { nodes } = (await cdp.send('Accessibility.getFullAXTree')) as { nodes: AxNode[] };
  return nodes.filter((node) => !node.ignored);
}

/** The step numbers as the page presents them (a CSS counter, so no DOM text). */
async function stepNumbers(page: Page): Promise<string[]> {
  return (await axTree(page))
    .filter((node) => node.role?.value === 'StaticText' && /^\d\d$/.test(String(node.name?.value)))
    .map((node) => String(node.name?.value));
}

/**
 * The accessibility node of a question: its role and whether it is expanded.
 * Chromium names it as the page shows it, uppercased by the stylesheet.
 */
async function questionNode(page: Page, question: string): Promise<{ role: string; expanded: unknown }> {
  const node = (await axTree(page)).find((n) => String(n.name?.value).toLowerCase() === question.toLowerCase() && n.role?.value !== 'StaticText');
  expect(node, question).toBeTruthy();
  return { role: String(node!.role?.value), expanded: node!.properties?.find((p) => p.name === 'expanded')?.value.value };
}

const steps = (page: Page) => page.locator('[data-component-id="kchockey:first_step"]');
const intro = (page: Page) => page.locator('[data-component-id="kchockey:question_intro"]');
const checks = (page: Page) => intro(page).locator('[data-component-id="kchockey:check_item"]');
const accordion = (page: Page) => page.locator('[data-component-id="kchockey:faq_accordion"]');
const items = (page: Page) => accordion(page).locator('[data-faq-item]');
const item = (page: Page, question: string) => items(page).filter({ has: page.locator('summary', { hasText: question }) });
const answer = (page: Page, question: string) => item(page, question).locator('summary + div');

test.beforeAll(() => {
  // The Content editor these tests act as: created once, kept for re-runs.
  const exists = php(`echo (int) (bool) user_load_by_name('${EDITOR}');`);
  if (exists !== '1') {
    drush('user:create', EDITOR, `--mail=${EDITOR}@example.com`, `--password=r06-${Date.now()}`);
  }
  drush('user:role:add', 'content_editor', EDITOR);
});

test('AC-1: /new-to-hockey shows the intro, the numbered first steps, then the question intro beside the six questions', async ({ browser }) => {
  const page = await visit(browser, '/new-to-hockey');
  const main = page.locator('main');
  await expect(main).toContainText('Your first shift starts here');
  await expect(main.locator('h1')).toHaveText(/New to\s*Hockey\?/);
  await expect(main).toContainText('Every hockey player starts somewhere. Here is the no-jargon guide to finding the right rink, gear, and first skate in Kansas City.');

  // The sections, in the source's order.
  const order = await main.locator('[data-component-id]').evaluateAll((els) =>
    els.map((el) => el.getAttribute('data-component-id')).filter((id) => ['kchockey:page_intro', 'kchockey:first_steps', 'kchockey:question_section'].includes(id ?? '')));
  expect(order).toEqual(['kchockey:page_intro', 'kchockey:first_steps', 'kchockey:question_section']);

  // Three step cards, numbered from their order, three to a row.
  await expect(steps(page).locator('h2')).toHaveText(STEPS.map(([title]) => title));
  for (const [i, [, text]] of STEPS.entries()) {
    await expect(steps(page).nth(i)).toContainText(text);
  }
  expect(await stepNumbers(page)).toEqual(['01', '02', '03']);
  const tops = await steps(page).evaluateAll((els) => els.map((el) => Math.round(el.getBoundingClientRect().top)));
  expect(new Set(tops).size).toBe(1);

  // The question intro: eyebrow, the two-line heading, the text, the checklist, the button.
  await expect(intro(page)).toContainText("The beginner's bench");
  await expect(intro(page).locator('h2')).toHaveText(/Questions\?\s*We've got you\./);
  await expect(intro(page)).toContainText('No question is too basic. Hockey has a lot of gear, lingo, and rink schedules to decode. Start with the answers below, then reach out if you still need a hand.');
  await expect(checks(page)).toHaveText(CHECKLIST);
  const button = intro(page).getByRole('link', { name: 'Find a beginner rink' });
  await expect(button).toHaveAttribute('href', '/rinks');

  // The six questions in order, all closed, beside the intro at desktop width.
  await expect(items(page).locator('summary')).toHaveText(QUESTIONS);
  for (const question of QUESTIONS) {
    await expect(answer(page, question)).toBeHidden();
  }
  const left = await intro(page).boundingBox();
  const right = await accordion(page).boundingBox();
  expect(right!.x).toBeGreaterThan(left!.x + left!.width);
  expect(Math.abs(right!.y - left!.y)).toBeLessThan(40);

  // At phone width the questions follow the intro.
  const phone = await visit(browser, '/new-to-hockey', { width: 390 });
  const top = await intro(phone).boundingBox();
  const below = await accordion(phone).boundingBox();
  expect(below!.y).toBeGreaterThan(top!.y + top!.height - 1);
  await page.context().close();
  await phone.context().close();
});

test('AC-2: opening a question shows its answer and closes the open one; opening it again closes it', async ({ browser }) => {
  const page = await visit(browser, '/new-to-hockey');
  const [first, second] = QUESTIONS;

  await item(page, first).locator('summary').click();
  await expect(answer(page, first)).toBeVisible();
  await expect(answer(page, first)).toContainText('Most KC rinks welcome skaters as young as three');

  await item(page, second).locator('summary').click();
  await expect(answer(page, second)).toBeVisible();
  await expect(answer(page, first)).toBeHidden();
  await expect(items(page).and(page.locator('[open]'))).toHaveCount(1);

  await item(page, second).locator('summary').click();
  await expect(answer(page, second)).toBeHidden();
  await expect(items(page).and(page.locator('[open]'))).toHaveCount(0);
  await page.context().close();
});

test('AC-3: the accordion works from the keyboard and tells assistive technology whether a question is open', async ({ browser }) => {
  const page = await visit(browser, '/new-to-hockey');
  const [first, second] = QUESTIONS;

  // Each question is an expandable control, closed: a disclosure, "Grouped"
  // where the browser keeps its group to one open.
  for (const question of QUESTIONS) {
    const node = await questionNode(page, question);
    expect(node.role).toMatch(/^DisclosureTriangle(Grouped)?$/);
    expect(node.expanded).toBe(false);
  }

  // Tab from the button reaches the first question; Enter opens it.
  await intro(page).getByRole('link', { name: 'Find a beginner rink' }).focus();
  await page.keyboard.press('Tab');
  await expect(item(page, first).locator('summary')).toBeFocused();
  await page.keyboard.press('Enter');
  await expect(answer(page, first)).toBeVisible();
  expect((await questionNode(page, first)).expanded).toBe(true);

  // Tab reaches the next question; Space opens it and closes the first.
  await page.keyboard.press('Tab');
  await expect(item(page, second).locator('summary')).toBeFocused();
  await page.keyboard.press('Space');
  await expect(answer(page, second)).toBeVisible();
  await expect(answer(page, first)).toBeHidden();
  expect((await questionNode(page, second)).expanded).toBe(true);
  expect((await questionNode(page, first)).expanded).toBe(false);

  // Enter closes it again.
  await page.keyboard.press('Enter');
  await expect(answer(page, second)).toBeHidden();
  expect((await questionNode(page, second)).expanded).toBe(false);
  await page.context().close();
});

test('AC-4: a Content editor adds, edits, removes and reorders questions, steps and checklist lines in Canvas', async ({ browser }) => {
  // The editor may open the page in Canvas, where every piece is placeable.
  const editor = await editorPage(browser);
  const response = await editor.goto(`/canvas/editor/canvas_page/${PAGE_ID}`);
  expect(response?.status()).toBe(200);
  await editor.context().close();
  const ids = ['first_steps', 'first_step', 'question_section', 'question_intro', 'checklist', 'check_item', 'faq_accordion', 'faq_item'];
  const enabled = php(`$s = \\Drupal::entityTypeManager()->getStorage('component'); foreach (${JSON.stringify(ids.map((id) => `sdc.kchockey.${id}`)).replace(/"/g, "'")} as $id) { echo (int) $s->load($id)->status(); }`);
  expect(enabled).toBe('1'.repeat(ids.length));

  const original = getTree();
  const of = (component: string) => original.filter((i) => i.component_id === `sdc.kchockey.${component}`);
  const input = (i: Item, key: string) => (i.inputs as Record<string, unknown>)[key];
  const [findIce, getFitted, firstStride] = of('first_step');
  const lines = of('check_item');
  const faqs = of('faq_item');

  // Steps: "Get fitted" moved first, a fourth step added. Checklist: the last
  // line removed. Questions: the first reworded, the last two swapped, one added.
  const edited: Item[] = [];
  for (const i of original) {
    if (i === findIce) {
      edited.push(getFitted, findIce);
    }
    else if (i === getFitted || i === lines[2]) {
      continue;
    }
    else if (i === firstStride) {
      edited.push(i, { ...i, uuid: 'a6f0c3d2-6b1e-4c7a-9d58-2e4f1b7c9a01', inputs: { icon: 'shield', title: 'Lace up', text: 'Tie your skates snug at the ankle.' } });
    }
    else if (i === faqs[0]) {
      edited.push({ ...i, inputs: { ...(i.inputs as object), question: 'At what age can my child start?' } });
    }
    else if (i === faqs[4]) {
      edited.push(faqs[5], faqs[4], { ...i, uuid: 'b7a1d4e3-7c2f-4d8b-8e69-3f5a2c8dab12', inputs: { question: 'Where do I park?', answer: 'Every KC rink has free parking.' } });
    }
    else if (i === faqs[5]) {
      continue;
    }
    else {
      edited.push(i);
    }
  }

  try {
    setTree(edited);
    const page = await visit(browser, '/new-to-hockey');
    await expect(steps(page).locator('h2')).toHaveText(['Get fitted', 'Find the ice', 'Take the first stride', 'Lace up']);
    expect(await stepNumbers(page)).toEqual(['01', '02', '03', '04']);
    await expect(checks(page)).toHaveText(CHECKLIST.slice(0, 2));
    await expect(items(page).locator('summary')).toHaveText([
      'At what age can my child start?',
      ...QUESTIONS.slice(1, 4),
      QUESTIONS[5],
      QUESTIONS[4],
      'Where do I park?',
    ]);
    await item(page, 'Where do I park?').locator('summary').click();
    await expect(answer(page, 'Where do I park?')).toHaveText('Every KC rink has free parking.');
    expect(input(findIce, 'title')).toBe('Find the ice');
    await page.context().close();
  }
  finally {
    setTree(original);
  }
  expect(getTree()).toEqual(original);
  const restored = await visit(browser, '/new-to-hockey');
  await expect(items(restored).locator('summary')).toHaveText(QUESTIONS);
  await restored.context().close();
});

test('AC-5: with no JavaScript, each question still opens to show its answer', async ({ browser }) => {
  const page = await visit(browser, '/new-to-hockey', { javaScriptEnabled: false });
  for (const question of QUESTIONS) {
    await expect(answer(page, question)).toBeHidden();
    await item(page, question).locator('summary').click();
    await expect(answer(page, question)).toBeVisible();
  }
  await page.context().close();
});
