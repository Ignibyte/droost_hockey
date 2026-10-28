# droost_hockey

KC Hockey is a Drupal CMS example built with Droost. Visit [the demonstration](https://hockey.droost.org).

## What is here

- `web/modules/custom/kchockey_site`: site-specific Drupal behavior.
- `web/themes/custom/kchockey`: Single Directory Components and the site theme.
- `config/sync`: exported demonstration configuration.
- `droost` and `tools/droost`: the original development workflow and its Composer requirements.
- `observability`: the historical plans, evaluations, workflow reports, status snapshots and source patches. Start with its subject runbook and series summary.
- `tests`: the original behavioral suites plus `tests/e2e/demo-safety.spec.ts`.

The observability files describe the original build. They retain failed attempts, review limitations and any original truncation notices; they are not results from a fresh security test. The exported artifacts were reviewed for accidental disclosure before this copy was prepared.

## Run locally

Use DDEV when available:

```sh
ddev start
ddev composer install
# Obtain a sanitized content/database backup separately; it is not in Git.
ddev import-db --file=/path/to/sanitized-demo.sql.gz
ddev drush cache:rebuild
ddev drush user:login
```

For the historical Droost tooling:

```sh
ddev composer --working-dir=tools/droost install
ddev exec tools/droost/vendor/bin/droost workflow:status
```

The lockfiles preserve the versions used by these examples. The workflow packages reference their historical development branch. Runtime workflow state and code indexes are intentionally ignored.

Uploaded media, installed dependencies, databases, local settings, salts, passwords and session material are excluded from Git. A database restore is required to reproduce the original Canvas content and content entities. Generate independent settings and credentials for every restore; never reuse a production backup as a public fixture.

## Demonstration controls

- Core mail uses a null transport, and Symfony Mailer Lite delivery is disabled.
- Webforms are closed. Wild Bills’ inquiry component shows a non-submitting notice while demo notices are enabled.
- Imported Hockey editor identities are blocked, stripped of roles and anonymized; the sole enabled administrator has a newly generated password. Previous sessions, mail records, contact submissions and logs are removed.
- Live salts are independent from the local restore and from each other.
- Public login, registration and password-request routes are blocked at the web server. Administration uses `vendor/bin/drush --uri=https://hockey.droost.org user:login` from the live project root. One-time links are private credentials; do not save them in reports.
- Only `web/` is served. Database backups, observability and development tooling are not HTTP directories. PHP execution is restricted to the front controller; source/config files are denied.

The Caddy access logs omit request URLs and headers so one-time login tokens are not retained there. These host controls are deployment configuration, not behavior supplied by the theme.

## Checks

```sh
npm ci
npx playwright install chromium
PLAYWRIGHT_BASE_URL=https://droost-hockey.ddev.site:8843 npx playwright test tests/e2e/demo-safety.spec.ts --workers=1
ddev composer audit --locked
```

The historical editor suites intentionally mutate a local restore and expect its original editable forms. Do not run them against a live site. Hockey test credentials now use cryptographic randomness and its editor accounts are blocked in teardown.

The original design ZIP archives are kept private because they contain embedded Git metadata. The extracted design source is included. Public history omits those archives. Drupal package dependencies were updated on 27 October 2026; the observability records still describe the original build.
