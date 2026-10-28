import { execFileSync } from 'node:child_process';
import { mkdtempSync, readFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { test, expect, type Page, type Browser } from '@playwright/test';

/**
 * Rung 8: launch readiness (droost/intake/tickets/R08.md). The Content editor
 * role proven on everything staff keep current, an editor's save showing
 * without a cache clear, the sitemap, and the accessibility floor on the eight
 * pages. Each test names the acceptance criteria it proves; AC-4 (each page
 * whole against the source) is the parity gate's, and AC-6 is the handover.
 *
 * The test that edits shared content restores it, and the file runs in order
 * in one worker.
 */
test.describe.configure({ mode: 'default', timeout: 180000 });

const BASE = process.env.PLAYWRIGHT_BASE_URL || 'https://kch-a.ddev.site';
const EDITOR = 'r08_editor';

/** The eight pages, and the name of each one's parity reference (droost/parity/). */
const PAGES: [string, string][] = [
  ['/', 'home'], ['/camps', 'camps'], ['/rinks', 'rinks'], ['/private-lessons', 'private-lessons'],
  ['/new-to-hockey', 'new-to-hockey'], ['/youth-leagues', 'youth-leagues'], ['/adult-leagues', 'adult-leagues'], ['/contact', 'contact'],
];
/** The Canvas pages behind them (/ is page 1; page 9 is the not-found page). */
const CANVAS_IDS = [1, 2, 3, 4, 5, 6, 7, 8, 9];

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

/** A page signed in as the Content editor (a one-time login link). */
async function editorPage(browser: Browser): Promise<Page> {
  const context = await browser.newContext({ ignoreHTTPSErrors: true, viewport: { width: 1280, height: 900 } });
  const page = await context.newPage();
  await page.goto(drush('user:login', `--name=${EDITOR}`, '--no-browser', `--uri=${BASE}`));
  return page;
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

/** Submits an admin form (Gin's sticky Save) and waits for the page it lands on. */
async function save(page: Page): Promise<void> {
  await Promise.all([
    page.waitForResponse((r) => r.request().method() === 'POST' && r.request().resourceType() === 'document'),
    page.locator('#gin-sticky-edit-submit').click(),
  ]);
  await page.waitForLoadState('load');
}

const footer = (page: Page) => page.locator('footer[data-component-id="kchockey:site_footer"]');

test.beforeAll(() => {
  // The Content editor these tests act as, holding that role and no other.
  const exists = php(`echo (int) (bool) user_load_by_name('${EDITOR}');`);
  if (exists !== '1') {
    drush('user:create', EDITOR, `--mail=${EDITOR}@example.com`, `--password=r08-${Date.now()}`);
  }
  php(`$u = user_load_by_name('${EDITOR}'); foreach ($u->getRoles(TRUE) as $r) { $u->removeRole($r); } $u->addRole('content_editor'); $u->activate()->save();`);
});

test('AC-1: a Content editor reaches everything staff keep current, and nothing that changes the site itself', async ({ browser }) => {
  expect(php(`echo implode(',', user_load_by_name('${EDITOR}')->getRoles());`)).toBe('authenticated,content_editor');

  // What the role may do, asked of Drupal's own access checks for this user.
  const grants = JSON.parse(php(`
    $u = user_load_by_name('${EDITOR}');
    $etm = \\Drupal::entityTypeManager();
    $nodes = $etm->getAccessControlHandler('node');
    $first = fn ($type) => current($etm->getStorage('node')->loadByProperties(['type' => $type, 'status' => 1]) ?: $etm->getStorage('node')->loadByProperties(['type' => $type]));
    $out = [];
    foreach (['event', 'rink', 'coach'] as $type) {
      $n = $first($type);
      $out["create $type"] = $nodes->createAccess($type, $u);
      $out["update $type"] = $n->access('update', $u);
    }
    $out['feature camp'] = $first('event')->get('field_camp_featured')->access('edit', $u);
    $out['reorder rink'] = $first('rink')->get('field_rink_weight')->access('edit', $u);
    $out['reorder coach'] = $first('coach')->get('field_coach_weight')->access('edit', $u);
    $valid = \\Drupal::service('content_moderation.state_transition_validation');
    $out['camp transitions'] = array_keys($valid->getValidTransitions($first('event'), $u));
    foreach ($etm->getStorage('node')->loadByProperties(['type' => 'page']) as $legal) {
      $out['update ' . $legal->label()] = $legal->access('update', $u);
      $out[$legal->label() . ' transitions'] = array_keys($valid->getValidTransitions($legal, $u));
    }
    foreach (${JSON.stringify(CANVAS_IDS)} as $id) {
      $out["update canvas page $id"] = $etm->getStorage('canvas_page')->load($id)->access('update', $u);
    }
    foreach (['main', 'footer', 'legal'] as $menu) {
      $out["update menu $menu"] = $etm->getStorage('menu')->load($menu)->access('update', $u);
    }
    $out['site details'] = \\Drupal\\Core\\Url::fromRoute('kchockey_site.settings')->access($u);
    $out['contact submissions'] = \\Drupal\\Core\\Url::fromRoute('entity.webform.results_submissions', ['webform' => 'contact'])->access($u);
    $out['permissions'] = \\Drupal\\user\\Entity\\Role::load('content_editor')->getPermissions();
    $out['is admin'] = \\Drupal\\user\\Entity\\Role::load('content_editor')->isAdmin();
    echo json_encode($out);`));

  for (const type of ['event', 'rink', 'coach']) {
    for (const op of ['create', 'update']) expect(grants[`${op} ${type}`], `${op} ${type}`).toBe(true);
  }
  expect(grants['feature camp']).toBe(true);
  expect(grants['reorder rink']).toBe(true);
  expect(grants['reorder coach']).toBe(true);
  expect(grants['camp transitions']).toEqual(expect.arrayContaining(['publish', 'unpublish']));
  for (const legal of ['Privacy Policy', 'Terms of Service']) {
    expect(grants[`update ${legal}`], legal).toBe(true);
    expect(grants[`${legal} transitions`], legal).toContain('publish');
  }
  for (const id of CANVAS_IDS) expect(grants[`update canvas page ${id}`], `canvas page ${id}`).toBe(true);
  for (const menu of ['main', 'footer', 'legal']) expect(grants[`update menu ${menu}`], menu).toBe(true);
  expect(grants['site details']).toBe(true);
  expect(grants['contact submissions']).toBe(true);
  expect(grants['is admin']).toBe(false);
  // Nothing that changes the theme, modules, roles, users or configuration.
  const forbidden = [
    'administer themes', 'administer modules', 'administer permissions', 'administer users', 'administer site configuration',
    'administer software updates', 'administer content types', 'administer node fields', 'administer webform', 'administer views',
    'administer blocks', 'administer canvas', 'administer components', 'administer workflows', 'link to any page',
  ];
  expect((grants.permissions as string[]).filter((p) => forbidden.includes(p))).toEqual([]);

  // And the same, as the editor meets it in the browser.
  const editor = await editorPage(browser);
  const allowed = [
    '/node/add/event', '/node/add/rink', '/node/add/coach', '/admin/content', '/admin/config/system/site-details',
    '/admin/structure/menu/manage/main', '/admin/structure/menu/manage/footer', '/admin/structure/menu/manage/legal',
    '/admin/structure/webform/manage/contact/results/submissions',
    ...CANVAS_IDS.map((id) => `/canvas/editor/canvas_page/${id}`),
  ];
  for (const path of allowed) expect((await editor.goto(path))?.status(), path).toBe(200);
  const refused = [
    '/admin/appearance', '/admin/modules', '/admin/people/roles', '/admin/people/permissions', '/admin/people',
    '/admin/config/system/site-information', '/admin/config/development/performance', '/admin/structure/types',
    '/admin/structure/webform/manage/contact', '/admin/structure/block', '/admin/structure/views',
  ];
  for (const path of refused) expect((await editor.goto(path))?.status(), path).toBe(403);

  // The forms carry the controls: feature and unpublish a camp, order rinks
  // and coaches, publish a legal page, read the stored messages.
  const camp = php(`echo current(\\Drupal::entityTypeManager()->getStorage('node')->loadByProperties(['type' => 'event', 'title' => 'Goalie Clinic']))->id();`);
  await editor.goto(`/node/${camp}/edit`);
  await expect(editor.getByRole('checkbox', { name: 'Featured' })).toBeVisible();
  expect(await editor.locator('select[name="moderation_state[0][state]"] option').allTextContents()).toEqual(expect.arrayContaining(['Published', 'Unpublished']));
  for (const type of ['rink', 'coach']) {
    await editor.goto(`/node/add/${type}`);
    await expect(editor.locator(`input[name="field_${type}_weight[0][value]"]`)).toHaveCount(1);
  }
  await editor.goto(`/node/${php(`echo current(\\Drupal::entityTypeManager()->getStorage('node')->loadByProperties(['type' => 'page', 'title' => 'Privacy Policy']))->id();`)}/edit`);
  expect(await editor.locator('select[name="moderation_state[0][state]"] option').allTextContents()).toContain('Published');
  const stored = Number(drush('sqlq', "SELECT COUNT(*) FROM webform_submission WHERE webform_id = 'contact'"));
  await editor.goto('/admin/structure/webform/manage/contact/results/submissions');
  if (stored > 0) await expect(editor.locator('table tbody tr').first()).toBeVisible();
  await editor.context().close();
});

test('AC-2: an editor\'s saves show to the next visitor with no cache cleared', async ({ browser }) => {
  const details = JSON.parse(php(`echo json_encode(\\Drupal::config('kchockey_site.settings')->get('location_line_2'));`));
  const camp = php(`echo current(\\Drupal::entityTypeManager()->getStorage('node')->loadByProperties(['type' => 'event', 'title' => 'Goalie Clinic']))->id();`);
  const level = php(`echo \\Drupal\\node\\Entity\\Node::load(${camp})->get('field_camp_level')->value;`);
  const link = JSON.parse(php(`$l = current(\\Drupal::entityTypeManager()->getStorage('menu_link_content')->loadByProperties(['menu_name' => 'footer', 'title' => 'New to Hockey'])); echo json_encode(['id' => $l->id()]);`));
  const contact = getTree(8);
  // Each visit below is the site's first request after the save: a page the
  // page cache already held (warmed here) must not be served stale.
  for (const route of ['/', '/camps', '/contact']) await (await visit(browser, route)).context().close();

  const editor = await editorPage(browser);
  try {
    await editor.goto('/admin/config/system/site-details');
    await editor.locator('input[name="location_line_2"]').fill('R08 second line');
    await save(editor);
    let page = await visit(browser, '/');
    await expect(footer(page)).toContainText('R08 second line');
    await page.context().close();

    await editor.goto(`/node/${camp}/edit`);
    await editor.locator('input[name="field_camp_level[0][value]"]').fill('R08 level');
    await Promise.all([editor.waitForURL((url) => url.pathname === '/camps'), editor.locator('#gin-sticky-edit-submit').click()]);
    page = await visit(browser, '/camps');
    await expect(page.locator('[data-component-id="kchockey:camp_card"]').filter({ hasText: 'Goalie Clinic' })).toContainText('R08 level');
    await page.context().close();

    await editor.goto(`/admin/structure/menu/item/${link.id}/edit`);
    await editor.locator('input[name="title[0][value]"]').fill('First Time Here');
    await save(editor);
    page = await visit(browser, '/');
    await expect(footer(page).locator('a', { hasText: 'First Time Here' })).toHaveCount(1);
    await page.context().close();

    setTree(8, contact.map((i) => (i.component_id === 'sdc.kchockey.page_intro' ? { ...i, inputs: { ...i.inputs, heading: 'R08 Heading' } } : i)));
    page = await visit(browser, '/contact');
    await expect(page.locator('main h1')).toHaveText(/R08\s*Heading/);
    await page.context().close();
  } finally {
    php(`\\Drupal::configFactory()->getEditable('kchockey_site.settings')->set('location_line_2', ${JSON.stringify(details)})->save();
      \\Drupal\\node\\Entity\\Node::load(${camp})->set('field_camp_level', ${JSON.stringify(level)})->save();
      \\Drupal::entityTypeManager()->getStorage('menu_link_content')->load(${link.id})->set('title', 'New to Hockey')->save();`);
    setTree(8, contact);
    await editor.context().close();
  }
  expect(getTree(8)).toEqual(contact);
  const restored = await visit(browser, '/contact');
  await expect(restored.locator('main h1')).toHaveText(/Hit\s*Us\s*Up/);
  await restored.context().close();
});

test('AC-3: the XML sitemap lists the eight pages and no camp, rink or coach', async ({ request }) => {
  // Cron regenerates the sitemap on a live site; here it is generated now.
  drush('simple-sitemap:generate');
  const xml = await (await request.get('/sitemap.xml')).text();
  const locs = [...xml.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => new URL(m[1]).pathname);
  expect(locs.sort()).toEqual(PAGES.map(([route]) => route).sort());
  const records = JSON.parse(php(`$out = []; foreach (\\Drupal::entityTypeManager()->getStorage('node')->loadByProperties(['type' => ['event', 'rink', 'coach']]) as $n) { $out[] = $n->toUrl()->toString(); } echo json_encode($out);`));
  for (const path of records) expect(locs).not.toContain(path);
});

/** An sRGB colour from a computed CSS colour (rgb, rgba or oklab), laid over `ground` when translucent. */
function colour(css: string, ground?: number[]): number[] | null {
  let c: number[];
  let alpha = 1;
  const rgb = css.match(/^rgba?\(([^)]+)\)/);
  const oklab = css.match(/^oklab\(([^)]+)\)/);
  if (rgb) {
    const v = rgb[1].split(/[\s,/]+/).filter(Boolean).map(Number);
    c = v.slice(0, 3);
    alpha = v[3] ?? 1;
  } else if (oklab) {
    const [L, A, B, a] = oklab[1].split(/[\s,/]+/).filter(Boolean).map(Number);
    alpha = a ?? 1;
    const l = (L + 0.3963377774 * A + 0.2158037573 * B) ** 3;
    const m = (L - 0.1055613458 * A - 0.0638541728 * B) ** 3;
    const s = (L - 0.0894841775 * A - 1.291485548 * B) ** 3;
    c = [4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s, -1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s, -0.0041960863 * l - 0.7034186147 * m + 1.707614701 * s]
      .map((x) => 255 * (x <= 0.0031308 ? 12.92 * x : 1.055 * x ** (1 / 2.4) - 0.055));
  } else {
    return null;
  }
  return alpha < 1 && ground ? c.map((x, i) => alpha * x + (1 - alpha) * ground[i]) : c;
}

/** WCAG contrast of a captured text against its ground; null over an image. */
function contrast(t: { color: string; ground: string }): number | null {
  const ground = colour(t.ground);
  const fore = ground && colour(t.color, ground);
  if (!ground || !fore) return null;
  const lum = (c: number[]) => {
    const [r, g, b] = c.map((x) => (x / 255 <= 0.03928 ? x / 255 / 12.92 : ((x / 255 + 0.055) / 1.055) ** 2.4));
    return 0.2126 * r + 0.7152 * g + 0.0722 * b;
  };
  const [a, b] = [lum(fore), lum(ground)];
  return (Math.max(a, b) + 0.05) / (Math.min(a, b) + 0.05);
}

type Text = { text: string; color: string; ground: string; size: number; weight: number };

test('AC-5: every page at 1280 and 390px: no sideways scroll, one h1, labelled fields, alt text, and the source\'s contrast', async ({ browser }) => {
  for (const width of [1280, 390]) {
    for (const [route] of PAGES) {
      const page = await visit(browser, route, width);
      const found = await page.evaluate(() => ({
        overflow: document.documentElement.scrollWidth - window.innerWidth,
        h1: document.querySelectorAll('h1').length,
        unlabelled: [...document.querySelectorAll<HTMLInputElement>('input:not([type=hidden]):not([type=submit]), select, textarea')]
          .filter((e) => !e.labels?.length && !e.getAttribute('aria-label') && !e.getAttribute('aria-labelledby')).map((e) => e.name),
        noAlt: [...document.querySelectorAll('img:not([alt])')].map((i) => (i as HTMLImageElement).src),
      }));
      expect(found.overflow, `${route} at ${width}px scrolls sideways`).toBeLessThanOrEqual(0);
      expect(found.h1, `${route} at ${width}px`).toBe(1);
      expect(found.unlabelled, `${route} at ${width}px`).toEqual([]);
      expect(found.noAlt, `${route} at ${width}px`).toEqual([]);
      await page.context().close();
    }
  }

  // Contrast: the pages captured as the parity references were (each text,
  // its colour and the ground it sits on), then each text held to WCAG AA or,
  // where the source's palette sits below it, to the same text in the source.
  const dir = mkdtempSync(join(tmpdir(), 'r08-contrast-'));
  try {
    const routes = PAGES.map(([route]) => route).join(',');
    for (const width of [1280, 390]) {
      execFileSync('tools/droost/vendor/bin/droost-parity', ['capture', '--source', BASE, '--routes', routes, '--width', String(width), '--out', join(dir, String(width))], { encoding: 'utf8' });
    }
    const low: string[] = [];
    for (const width of [1280, 390]) {
      for (const [route, name] of PAGES) {
        const site: Text[] = JSON.parse(readFileSync(join(dir, String(width), `${name}.json`), 'utf8')).texts;
        const source: Text[] = JSON.parse(readFileSync(`droost/parity/${name}${width === 390 ? '@390' : ''}.json`, 'utf8')).texts;
        expect(site.length, `${route} at ${width}px captured no text`).toBeGreaterThan(0);
        for (const t of site) {
          const ratio = contrast(t);
          const same = source.filter((s) => s.text === t.text);
          if (ratio === null) {
            // Text over an image: held to the source doing the same.
            if (!same.some((s) => contrast(s) === null)) low.push(`${route}@${width} "${t.text}" sits on ${t.ground}, the source's does not`);
            continue;
          }
          const large = t.size >= 24 || (t.size >= 18.66 && t.weight >= 700);
          if (ratio >= (large ? 3 : 4.5)) continue;
          const floor = Math.min(...same.map((s) => contrast(s) ?? Infinity));
          if (ratio < floor - 0.05) low.push(`${route}@${width} "${t.text}" ${ratio.toFixed(2)} (source ${Number.isFinite(floor) ? floor.toFixed(2) : 'has no such text'})`);
        }
      }
    }
    expect(low).toEqual([]);
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});
