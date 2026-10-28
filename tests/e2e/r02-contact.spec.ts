import { randomBytes } from 'node:crypto';
import { execFileSync } from 'node:child_process';
import { test, expect, type Page, type Browser } from '@playwright/test';

/**
 * Rung 2: the contact form and /contact (droost/intake/tickets/R02.md). Each
 * test names the acceptance criteria it proves.
 *
 * The form turns away a submission faster than its time limit (Honeypot, 5
 * seconds), and each refusal lengthens the limit for that address. So every
 * test that submits starts with a clean Honeypot record and waits out the
 * limit before it sends, and the file runs in order in one worker.
 */
test.describe.configure({ mode: 'default', timeout: 120000 });

const BASE = process.env.PLAYWRIGHT_BASE_URL || 'https://kch-a.ddev.site';
const MAILPIT = process.env.MAILPIT_URL || 'https://kch-a.ddev.site:8026';
const SUBJECTS = ['Camp Inquiry', 'Private Lessons', 'Rink Information', 'Other'];
const EDITOR = 'r02_editor';
const TIME_LIMIT_MS = 5500;

/** Runs drush in the DDEV site and returns what it printed. */
function drush(...args: string[]): string {
  return execFileSync('ddev', ['drush', ...args], { encoding: 'utf8' }).trim();
}

/** Runs PHP in the booted site. */
function php(code: string): string {
  return drush('php:eval', code);
}

/** Forgets every Honeypot refusal, so the time limit is the base 5 seconds. */
function resetHoneypot(): void {
  php(`\\Drupal::database()->delete('honeypot_user')->execute();`);
}

/** Sets Site details keys the way the form would leave them, in one save. */
function setDetails(values: Record<string, string>): void {
  const sets = Object.entries(values).map(([key, value]) => `->set('${key}', ${JSON.stringify(value)})`).join('');
  php(`\\Drupal::configFactory()->getEditable('kchockey_site.settings')${sets}->save();`);
}

/** How many contact submissions hold this exact message. */
function storedWith(message: string): number {
  return Number(php(`echo \\Drupal::database()->select('webform_submission_data', 'd')->condition('webform_id', 'contact')->condition('name', 'message')->condition('value', ${JSON.stringify(message)})->countQuery()->execute()->fetchField();`));
}

/** How many contact submissions are stored. */
function stored(): number {
  return Number(php(`echo \\Drupal::entityQuery('webform_submission')->accessCheck(FALSE)->condition('webform_id', 'contact')->count()->execute();`));
}

/** The mail Mailpit caught whose text holds `needle`, or null. */
async function mailWith(needle: string): Promise<{ to: string[]; replyTo: string[]; subject: string; text: string } | null> {
  const search = await fetch(`${MAILPIT}/api/v1/search?query=${encodeURIComponent(`"${needle}"`)}`);
  const found = (await search.json()) as { messages: { ID: string }[] };
  if (!found.messages.length) return null;
  const message = (await (await fetch(`${MAILPIT}/api/v1/message/${found.messages[0].ID}`)).json()) as {
    To: { Address: string }[];
    ReplyTo: { Address: string }[];
    Subject: string;
    Text: string;
  };
  return {
    to: message.To.map((a) => a.Address),
    replyTo: message.ReplyTo.map((a) => a.Address),
    subject: message.Subject,
    text: message.Text,
  };
}

/** A visitor's page in a fresh browser. */
async function visit(browser: Browser, path: string): Promise<Page> {
  const context = await browser.newContext({ ignoreHTTPSErrors: true, viewport: { width: 1280, height: 900 } });
  const page = await context.newPage();
  await page.goto(path);
  return page;
}

const form = (page: Page) => page.locator('form.webform-submission-contact-form');
const fire = (page: Page) => form(page).getByRole('button', { name: 'Fire Away' });

/** Fills the form; an undefined field is left as it is. */
async function fill(page: Page, values: { name?: string; email?: string; subject?: string; message?: string }): Promise<void> {
  if (values.name !== undefined) await page.getByLabel('Name').fill(values.name);
  if (values.email !== undefined) await page.getByLabel('Email', { exact: true }).fill(values.email);
  if (values.subject !== undefined) await page.getByLabel('Subject').selectOption(values.subject);
  if (values.message !== undefined) await page.getByLabel('Message').fill(values.message);
}

/** Sends the form as the browser would, and waits for the answer. */
async function send(page: Page): Promise<void> {
  await Promise.all([page.waitForURL(/\/contact/), page.waitForLoadState('load'), fire(page).click()]);
  await page.waitForLoadState('load');
}

test.beforeAll(() => {
  const exists = php(`echo (int) (bool) user_load_by_name('${EDITOR}');`);
  if (exists !== '1') {
    drush('user:create', EDITOR, `--mail=${EDITOR}@example.com`, `--password=${randomBytes(32).toString('hex')}`);
  }
  drush('user:password', EDITOR, randomBytes(32).toString('hex'));
  drush('user:unblock', EDITOR);
  drush('user:role:add', 'content_editor', EDITOR);
});

test('AC-1: /contact shows the intro, Contact Info, the coach note and the form', async ({ page }) => {
  const response = await page.goto('/contact');
  expect(response?.status()).toBe(200);
  await expect(page.locator('h1')).toHaveText('Hit Us Up');
  await expect(page.getByText('Got a question about a camp? Want to list your clinic? Just want to talk hockey? Drop us a line.')).toBeVisible();

  const info = page.locator('[data-component-id="kchockey:contact_info"]');
  await expect(info.locator('h2')).toHaveText('Contact Info');
  const mail = info.getByRole('link', { name: 'info@kchockey.com' });
  await expect(mail).toHaveAttribute('href', 'mailto:info@kchockey.com');
  await expect(info).toContainText('Location');
  await expect(info).toContainText('Kansas City Metro Area');
  await expect(info).toContainText('We operate out of rinks across KC.');

  const note = page.locator('[data-component-id="kchockey:callout"]');
  await expect(note.locator('h3')).toHaveText('Are you a coach?');
  await expect(note).toContainText('Send us an email with your resume and USA Hockey credentials.');

  await expect(page.getByRole('heading', { level: 2, name: 'Send a Message' })).toBeVisible();
  await expect(page.getByLabel('Name')).toHaveAttribute('placeholder', 'Shoresy');
  await expect(page.getByLabel('Email', { exact: true })).toHaveAttribute('type', 'email');
  await expect(page.getByLabel('Subject')).toBeVisible();
  await expect(page.getByLabel('Message')).toHaveAttribute('placeholder', 'How can we help?');
  await expect(fire(page)).toBeVisible();

  // The form card sits beside the details at desktop width, as the design has it.
  const infoBox = await info.boundingBox();
  const formBox = await form(page).boundingBox();
  expect(formBox!.x).toBeGreaterThan(infoBox!.x + infoBox!.width);
});

test('AC-2: the Subject offers the four subjects, Camp Inquiry chosen', async ({ page }) => {
  await page.goto('/contact');
  const subject = page.getByLabel('Subject');
  const options = await subject.locator('option').evaluateAll((os) => os.map((o) => o.textContent!.trim()));
  expect(options).toEqual(SUBJECTS);
  await expect(subject).toHaveValue('Camp Inquiry');
});

test('AC-3: /contact?subject= opens the form with that subject chosen', async ({ page }) => {
  for (const subject of SUBJECTS) {
    await page.goto(`/contact?subject=${encodeURIComponent(subject)}`);
    await expect(page.getByLabel('Subject')).toHaveValue(subject);
  }
});

test('AC-4: the browser refuses a form missing Name, Email or Message, or with a bad email', async ({ page }) => {
  await page.goto('/contact');
  const cases: [string, { name: string; email: string; message: string }][] = [
    ['Name', { name: '', email: 'a@example.com', message: 'Hi' }],
    ['Email', { name: 'A', email: '', message: 'Hi' }],
    ['Email', { name: 'A', email: 'not-an-email', message: 'Hi' }],
    ['Message', { name: 'A', email: 'a@example.com', message: '' }],
  ];
  for (const [field, values] of cases) {
    await fill(page, values);
    await fire(page).click();
    // Nothing was sent: the form is still here, and the field says why.
    await expect(page.getByText('Message Sent!')).toHaveCount(0);
    const input = page.getByLabel(field, { exact: true });
    const message = await input.evaluate((el: HTMLInputElement) => el.validationMessage);
    expect(message, `${field} should be refused`).not.toBe('');
  }
});

test('AC-4: the site itself refuses the same, naming each field (no browser checks)', async ({ page }) => {
  resetHoneypot();
  const before = stored();
  await page.goto('/contact');
  await form(page).evaluate((f: HTMLFormElement) => f.setAttribute('novalidate', 'novalidate'));
  await fill(page, { name: '', email: 'not-an-email', message: '' });
  await page.waitForTimeout(TIME_LIMIT_MS);
  await send(page);
  await expect(page.getByText('Message Sent!')).toHaveCount(0);
  await expect(page.locator('.form-item-name')).toContainText('Name field is required.');
  await expect(page.locator('.form-item-email')).toContainText('not-an-email is not valid');
  await expect(page.locator('.form-item-message')).toContainText('Message field is required.');
  expect(stored()).toBe(before);
});

test('AC-5: a valid message is stored, emailed to info@kchockey.com and answered with Message Sent!', async ({ page }) => {
  resetHoneypot();
  const stamp = `r02-${Date.now()}`;
  const message = `Is the summer camp still open? (${stamp})`;
  await page.goto('/contact?subject=Rink%20Information');
  await fill(page, { name: 'Shoresy Test', email: 'shoresy@example.com', subject: 'Private Lessons', message });
  await page.waitForTimeout(TIME_LIMIT_MS);
  await send(page);

  const sent = page.locator('[data-component-id="kchockey:form_sent"]');
  await expect(sent.locator('h3')).toHaveText('Message Sent!');
  await expect(sent).toContainText("Thanks for reaching out. We'll get back to you between periods.");
  await expect(page.getByLabel('Name')).toHaveCount(0);

  expect(storedWith(message)).toBe(1);

  await expect.poll(() => mailWith(stamp), { timeout: 15000 }).not.toBeNull();
  const mail = (await mailWith(stamp))!;
  expect(mail.to).toEqual(['info@kchockey.com']);
  expect(mail.replyTo).toEqual(['shoresy@example.com']);
  expect(mail.subject).toContain('Private Lessons');
  for (const value of ['Shoresy Test', 'shoresy@example.com', 'Private Lessons', message]) {
    expect(mail.text).toContain(value);
  }

  // Send Another brings back the empty form.
  await sent.getByRole('link', { name: 'Send Another' }).click();
  await page.waitForLoadState('load');
  await expect(page.getByLabel('Name')).toHaveValue('');
  await expect(page.getByLabel('Message')).toHaveValue('');
  await expect(page.getByText('Message Sent!')).toHaveCount(0);
});

test('AC-6: a Content editor lists every stored message; a visitor may not', async ({ browser }) => {
  const total = stored();
  expect(total).toBeGreaterThan(0);
  const path = '/admin/structure/webform/manage/contact/results/submissions';

  const visitor = await visit(browser, path);
  expect((await visitor.goto(path))?.status()).toBe(403);

  const context = await browser.newContext({ ignoreHTTPSErrors: true, viewport: { width: 1280, height: 900 } });
  const editor = await context.newPage();
  await editor.goto(drush('user:login', `--name=${EDITOR}`, '--no-browser', `--uri=${BASE}`));
  const response = await editor.goto(`${path}?items_per_page=All`);
  expect(response?.status()).toBe(200);
  await expect(editor.locator('table tbody tr')).toHaveCount(total);
  // And the form is under Structure › Webforms, where they look for it.
  expect((await editor.goto('/admin/structure/webform'))?.status()).toBe(200);
});

test('AC-7: a filled trap field or a too-fast submission is refused; no puzzle, no checkbox', async ({ page }) => {
  resetHoneypot();
  await page.goto('/contact');
  // Nothing for a person to solve or tick.
  await expect(form(page).locator('input[type="checkbox"], iframe, .captcha, [class*="captcha"]')).toHaveCount(0);
  await expect(form(page).locator('input[name="url"]')).toBeHidden();

  // Too fast: sent the moment the page loaded.
  const fast = `r02-fast-${Date.now()}`;
  await fill(page, { name: 'Bot', email: 'bot@example.com', message: fast });
  await send(page);
  await expect(page.getByText('Message Sent!')).toHaveCount(0);
  await expect(page.locator('[data-drupal-messages]')).toContainText('There was a problem with your form submission');
  expect(storedWith(fast)).toBe(0);

  // The trap: a bot fills the hidden field, however long it waits.
  resetHoneypot();
  await page.goto('/contact');
  const trapped = `r02-trap-${Date.now()}`;
  await fill(page, { name: 'Bot', email: 'bot@example.com', message: trapped });
  await form(page).locator('input[name="url"]').evaluate((el: HTMLInputElement) => (el.value = 'http://spam.example'));
  await page.waitForTimeout(TIME_LIMIT_MS);
  await send(page);
  await expect(page.getByText('Message Sent!')).toHaveCount(0);
  expect(storedWith(trapped)).toBe(0);
  resetHoneypot();
});

test('AC-8: a Site details change shows in Contact Info', async ({ browser }) => {
  const before = { email: 'info@kchockey.com', contact_area: 'Kansas City Metro Area', contact_note: 'We operate out of rinks across KC.' };
  try {
    setDetails({ email: 'hello@kchockey.com', contact_area: 'Greater Kansas City', contact_note: 'Rinks on both sides of State Line.' });
    const page = await visit(browser, '/contact');
    const info = page.locator('[data-component-id="kchockey:contact_info"]');
    await expect(info.getByRole('link', { name: 'hello@kchockey.com' })).toHaveAttribute('href', 'mailto:hello@kchockey.com');
    await expect(info).toContainText('Greater Kansas City');
    await expect(info).toContainText('Rinks on both sides of State Line.');
  }
  finally {
    setDetails(before);
  }
  const page = await visit(browser, '/contact');
  await expect(page.locator('[data-component-id="kchockey:contact_info"]')).toContainText('Kansas City Metro Area');
});

// Test identities must never remain usable after the suite.
test.afterAll(() => {
  drush('user:block', EDITOR);
});
