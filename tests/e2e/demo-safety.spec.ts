import { execFileSync } from 'node:child_process';
import { test, expect } from '@playwright/test';

for (const width of [1280, 390]) {
  test(`demo contact is non-submitting at ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 900 });
    const response = await page.goto('/contact');
    expect(response?.status()).toBe(200);
    await expect(page.locator('body')).toContainText('closed to new submissions');
    await expect(page.locator('.webform-button--submit, [data-wb-form], [data-wb-open]')).toHaveCount(0);
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
  });
}

test('restore has one enabled admin, closed forms, and null mail transports', async () => {
  const runner = process.env.IS_DDEV_PROJECT ? 'vendor/bin/drush' : 'ddev';
  const prefix = process.env.IS_DDEV_PROJECT ? [] : ['drush'];
  const report = JSON.parse(execFileSync(runner, [...prefix, 'php:eval', `
    $db = \Drupal::database();
    $forms = [];
    $etm = \Drupal::entityTypeManager();
    if ($etm->hasDefinition('webform')) {
      foreach ($etm->getStorage('webform')->loadMultiple() as $f) { $forms[] = $f->isClosed(); }
    }
    echo json_encode([
      'enabled' => (int) $db->query('SELECT COUNT(*) FROM {users_field_data} WHERE uid>0 AND status=1')->fetchField(),
      'enabled_ids' => array_map('intval', $db->query('SELECT uid FROM {users_field_data} WHERE uid>0 AND status=1')->fetchCol()),
      'admin_permission' => $etm->getStorage('user')->load(1)->hasPermission('administer users'),
      'forms' => $forms,
      'mail_interface' => \Drupal::config('system.mail')->get('interface.default'),
      'lite_plugin' => $etm->getStorage('symfony_mailer_lite_transport')->load('demo_disabled')->get('plugin'),
      'mail' => \Drupal::config('system.mail')->get('mailer_dsn.scheme'),
      'lite' => \Drupal::config('symfony_mailer_lite.settings')->get('default_transport'),
    ]);
  `], { encoding: 'utf8' }));
  expect(report.enabled).toBe(1);
  expect(report.enabled_ids).toEqual([1]);
  expect(report.admin_permission).toBe(true);
  expect(report.mail_interface).toBe('symfony_mailer');
  expect(report.lite_plugin).toBe('null');
  expect(report.forms.every(Boolean)).toBe(true);
  expect(report.mail).toBe('null');
  expect(report.lite).toBe('demo_disabled');
});
