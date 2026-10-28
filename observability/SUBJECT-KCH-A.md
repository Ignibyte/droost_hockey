# KCH-A: building the subject

The commands for `PLAN-KCH-A-2026-10-20.md` §3c to §3d, in order. Each
step was run on the bench (`droost_cms-bench`,
2026-10-20) before it was written here, and the runbook was corrected
during the series (2026-10-20 to 21) to what the subject actually needed. A
step that fails on the subject is a defect in the step: fix the step, do not
improvise around it.

**Where:** `<site>`. This is not
`contrib/droost/kchockey`: the probes default to that path and write test
content into it.

**What it runs:**
- droost_cms `off-drupal` and droost/workflow `off-drupal`, both from their
  branches (the series began on droost_cms `a2e662b` and droost/workflow
  `867f31f`, and ended on `a15a23b` and `7e86d58`);
- Drupal CMS from Packagist;
- droost_theme `1.0.x-dev`.

Write each commit into the round record. The finished series is the
subject's tag `kch-a-r08-done` and the DDEV snapshot of the same name.

## 1. The site

```bash
mkdir <site> && cd <site>
ddev config --project-type=drupal11 --docroot=web --project-name=kch-a
ddev start
ddev composer create-project drupal/cms --no-interaction

# Composer runs on the HOST: the container cannot see a host path.
export COMPOSER_AUTH="{\"github-oauth\":{\"github.com\":\"$(gh auth token)\"}}"
composer config repositories.droost_cms '{"type":"vcs","url":"https://git.drupalcode.org/project/droost_cms.git"}'
composer config --json extra.drupal-scaffold.allowed-packages '["drupal/drupal_cms_blank","drupal/drupal_cms_site_template_base"]'
composer config minimum-stability dev && composer config prefer-stable true

# phpcs and phpstan, which the low gates run: drupal/core-dev, and the
# Composer plugins it brings, allowed before it is required.
composer config allow-plugins.dealerdirect/phpcodesniffer-composer-installer true
composer config allow-plugins.phpstan/extension-installer true
composer config allow-plugins.tbachert/spi true
composer require --dev 'drupal/core-dev:^11' --no-interaction

composer require 'drupal/droost_cms:dev-off-drupal' 'drupal/droost_theme:1.0.x-dev' --no-interaction

# Exported config lives in config/sync, outside the docroot and in git.
# Without this, DDEV's settings.ddev.php puts it under sites/default/files/sync.
cat >> web/sites/default/settings.php <<'PHP'
$settings['config_sync_directory'] = '../config/sync';
PHP

ddev drush site:install minimal -y
ddev drush recipe ../recipes/droost_cms
bash recipes/droost_cms/scripts/assert-recipe-applied.sh .     # RECIPE APPLIED CLEAN, or stop
```

Drupal CMS unpacks the recipe: `drupal/droost_cms` leaves the lock and its
files stay in `recipes/droost_cms/`. Record the commit from `composer
require`'s output before the unpack.

## 2. droost, the layer, and Playwright

```bash
mkdir -p tools/droost && cat > tools/droost/composer.json <<'JSON'
{
  "repositories": [
    {"type": "vcs", "url": "git@github.com:Ignibyte/droost-workflow.git"},
    {"type": "vcs", "url": "git@github.com:Ignibyte/droost-engine.git"}
  ],
  "require": {"droost/workflow": "dev-off-drupal", "droost/engine": "dev-off-drupal as 0.11.99"},
  "config": {"platform": {"php": "8.3.0"}},
  "minimum-stability": "dev", "prefer-stable": true
}
JSON
composer install -d tools/droost --no-interaction
git init -q && printf 'vendor/\nweb/core/\nweb/modules/contrib/\nweb/themes/contrib/\nweb/sites/*/files/\nweb/sites/*/settings*.php\nnode_modules/\ntools/droost/vendor/\n' > .gitignore
php tools/droost/vendor/bin/droost init
bash recipes/droost_cms/scripts/install-layer.sh .
# merge recipes/droost_cms/examples/droost.yml into droost/droost.yml (gates: one block, rules: one block)
php tools/droost/vendor/bin/droost init      # again: droost/agents.md into AGENTS.md
php tools/droost/vendor/bin/droost code:index
ddev drush config:export -y
php tools/droost/vendor/bin/droost code:wiki      # read-only: the inventory, from composer.lock and the exported core.extension.yml
```

**Playwright, on both sides.** droost runs on the host here, so the
`playwright` gate and parity launch the host's Chromium against
`https://kch-a.ddev.site`; the intake's audit runs in the web container,
which needs Chromium's system libraries baked into the image.

```bash
printf '{\n  "name": "kch-a",\n  "private": true,\n  "devDependencies": {\n    "@playwright/test": "^1.63.0"\n  }\n}\n' > package.json
git -C <site> show kch-a-baseline-0:playwright.config.ts > playwright.config.ts   # testDir tests/e2e, baseURL the DDEV site
npm install && npx playwright install chromium

mkdir -p .ddev/web-build && cat > .ddev/web-build/Dockerfile.playwright <<'DOCKER'
ARG BASE_IMAGE
FROM $BASE_IMAGE
RUN npx -y playwright@1.64.1 install-deps chromium
DOCKER
printf 'web_environment:\n  - PLAYWRIGHT_BROWSERS_PATH=/mnt/ddev-global-cache/playwright\n' > .ddev/config.playwright.yaml
ddev restart && ddev exec npx playwright install chromium
```

(On the subject, `package.json` and `playwright.config.ts` are in baseline
0 and the two DDEV files in baseline 1; either place works.)

Then check, and stop on any red:

```bash
php tools/droost/vendor/bin/droost doctor
WF_BRANCH=off-drupal ENG_BRANCH=off-drupal bash droost_observability/bin/verify-freshness.sh . \
  droost_workflow-offdrupal droost-engine
bash droost_observability/probes/probe-canvas-layer.sh .   # 8/8, BEFORE baseline 0: it writes
php tools/droost/vendor/bin/droost workflow:gate --phase=code --json   # component_lint: passed, labelled (no custom SDC yet)
ddev drush php:eval 'print \Drupal::entityQuery("node")->accessCheck(FALSE)->count()->execute();'   # entityQuery, never SQL
git add -A && git commit -qm "baseline 0" && git tag kch-a-baseline-0
```

## 3. Baseline 1

**The design** is the client's file as delivered, never unpacked by the
observer in the subject: the intake unpacks it.

```bash
mkdir -p design && cp <the client's KC-Hockey-Hub.zip> design/      # the operator copies it
shasum -a 256 design/KC-Hockey-Hub.zip   # 3489c53def1b67da33555d85d56c21795f5b7802cd42a5372f677ee9e9e330e7
bash droost_observability/bin/set-dial.sh low .
php tools/droost/vendor/bin/droost workflow:status      # the RESOLVED table: low, require_run hard
```

Then, in `droost/droost.yml`, the operator's edits, and `workflow:status`
again after them:
- `lead: autonomous` (decision 17: the agent answers every hold);
- under `gates:`, `parity: { on: true, required: true, scope: frame }`.

**The reference** is the observer's, read from its own copy of the source
(never the subject's), on the platform the gate will judge on, which since
F-351 the manifest records as `read_on`:

```bash
OBS=droost_observability
mkdir -p $OBS/bin/artifacts/kch-a/source && unzip -q design/KC-Hockey-Hub.zip -d $OBS/bin/artifacts/kch-a/source
# pnpm-workspace.yaml: set `overrides: {}` (the source pins linux-x64 binaries only), so it installs on macOS
( cd $OBS/bin/artifacts/kch-a/source/KC-Hockey-Hub && pnpm install && \
  PORT=5199 BASE_PATH=/ pnpm --filter @workspace/kchockey dev > $OBS/bin/artifacts/kch-a/source-dev.log 2>&1 & )
tools/droost/vendor/bin/droost-parity capture --source http://localhost:5199 \
  --routes /,/rinks,/camps,/private-lessons,/contact,/new-to-hockey,/youth-leagues,/adult-leagues --width 1280,390
```

Do not reuse the old site's `droost/parity/`, which 0.13 captured.
`decided.json` (the texts the client set aside) is the intake's to write,
not the observer's.

- **The observer's documents:** the yardstick
  `docs/intake/KCHOCKEY-ANSWER-KEY.md` (restored from
  `pre-reset-2026-10-16`) and the pre-registration
  `rounds/KCH-A-1-prereg.md` with its client brief and predictions, in this
  repository, committed before `send`. Never show them to the subject.
- **Empty state:** `ls droost/droost-workflow/` shows only what `init`
  wrote. Copy `<agent memory>`
  into the round's artifacts, then empty it.

```bash
git add -A && git commit -qm "baseline 1" && git tag kch-a-baseline-1
```

## 4. The rounds

```bash
cd droost_observability
DOGFOOD_SITE=<site> bin/dogfood.sh launch
bin/dogfood.sh send KCH-A-1 "<the request, verbatim from the pre-registration>"
```

- The owner answers the intake as the client, through the agent's
  AskUserQuestion dialogs, and approves it.
- Each rung after the intake is a run of its own, launched in a fresh
  session with a kickoff naming the ticket (`droost/intake/tickets/R0n.md`).
- `watch`, then `collect`, then copy the memory out and empty it before the
  next launch.
- Score with `SCORE_SITE=<site> bin/score/transcript_facts.py <session>`.
  It names each `droost/bin/canvas` call and every Canvas tree touched
  outside `tree:set`.

**Between rungs**, the operator's changes are committed in the subject as
`operator before R0n: …` and named in the next round's record:
- a droost upgrade (`composer update -d tools/droost`, then `droost init`
  and `verify-freshness.sh`);
- parity's `pages` lever, which judges a finished page whole. Add a page
  only after measuring it passing (`droost-parity judge --pages <route>`):
  `/contact,/rinks` before R04, `/` and `/camps` before R05,
  `/private-lessons` before R06, `/new-to-hockey` before R07, all eight
  before R08;
- a re-read of the reference when the reader changes (before R04, F-349) or
  when the manifest must say where it was read (before R07, F-351), with
  the same routes and the same `decided.json`.

**A failed rung's second attempt** starts from a new baseline: R01's was
baseline 1b (`kch-a-baseline-1b`), with the approved intake committed and
the site reinstalled from the recipe (§1's `site:install` and `recipe`,
then `config:export` and `droost init`; UUIDs regenerate, so re-baseline).
