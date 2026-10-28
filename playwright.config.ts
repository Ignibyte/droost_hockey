import { defineConfig, devices } from '@playwright/test';

/**
 * The `playwright` gate runs `node_modules/.bin/playwright test` from the
 * project root, where droost runs: on this project, the host, against the
 * DDEV site. testDir is scoped so contrib's own JS tests are never reached.
 */
const demoTestUrl = new URL(process.env.PLAYWRIGHT_BASE_URL || 'https://droost-hockey.ddev.site:8843');
if (!demoTestUrl.hostname.endsWith('.ddev.site') && !['localhost', '127.0.0.1'].includes(demoTestUrl.hostname)) {
  throw new Error('The destructive editor suites may run only against a local demo restore.');
}

export default defineConfig({
  testDir: './tests/e2e',
  fullyParallel: true,
  reporter: [['list']],
  use: {
    baseURL: demoTestUrl.href,
    ignoreHTTPSErrors: true,
  },
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
});
