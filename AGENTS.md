# Agent guidance for this Drupal site

This codebase is a Composer-managed Drupal site.

## Detect the command runner first

Do not assume DDEV is installed. Before running anything, work out how this codebase invokes Composer
and Drush, from the project root:

1. **DDEV (preferred)** — a `.ddev/` directory exists *and* `ddev` is on `PATH` (`command -v ddev`).
   Use `ddev composer` and `ddev drush`, as described below.
2. **Local PHP + Composer** — no usable `ddev`, but `composer` is on `PATH` (`command -v composer`).
   Run `composer install` if `vendor/` doesn't exist yet. Use plain `composer`, and check
   whether `vendor/bin/drush` exists (some packages of this project ship without Drush), if it does, use that (not a global `drush`); if it doesn't, skip the Drush workflow below.

State which one you picked before running commands. If neither applies, stop and report it rather
than guessing at a command that will fail. In the workflow sections below, substitute the Composer
and Drush commands for the option you resolved.

## Local environment (DDEV)

Run commands from the project root:

- Start or restart the local environment with `ddev start`, `ddev restart`, and `ddev stop`.
- Install PHP dependencies with `ddev composer install`.
- Open the site with `ddev launch`.
- Run Drush commands with `ddev drush <command>` such as `status`, `user:login`,  `cache:rebuild`, and `updatedb`.

DDEV project config lives in `.ddev/config.yaml`. Use `.ddev/config.local.yaml` for machine-specific overrides.

## Common Drupal workflows

- Add a module with `ddev composer require drupal/<project>`, then  `ddev drush pm:enable --yes <module_machine_name>`, then `ddev drush cache:rebuild`.
- Apply database updates after code changes with `ddev drush updatedb --yes`.
- Import repository configuration into the site with `ddev drush config:import --yes`.
- Export site configuration back to the repo with `ddev drush config:export --yes`.

## Guardrails

- Do not commit secrets or machine-local overrides such as `.env`, `settings.local.php`, or `.ddev/config.local.yaml`.
- Do not commit `vendor/` or uploaded files under `web/sites/*/files`.
- Do not edit Drupal core or contributed projects in place.
- Put custom code in `web/modules/custom` and `web/themes/custom`.

## References

- https://docs.ddev.com/en/stable/
- https://www.drupal.org/docs/administering-a-drupal-site/configuration-management/workflow-using-drush

<!-- BEGIN DROOST WORKFLOW -->
## The build pipeline is installed — every build starts with a run

droost is one command, `tools/droost/vendor/bin/droost` in this project; the skills and this
block call it `droost`.

Building means ANY new functionality: a module, a class, a template, a
config change, or a schema change. The moment intent turns from
discussing a change to making it, your FIRST move is to open a run —
`droost workflow:run` (it begins one, and advances it by a phase on
each later call) — never a write. `droost workflow:status` inspects it,
and `droost workflow:declare-changes --files=… --tests=…` says what
the run will touch before it touches anything.

This is enforced, not advisory: with `require_run: hard` (the default in
`droost/droost.yml`) the editor guard blocks ungoverned custom-code
edits. A finished run counts as no run — `droost workflow:reset`
archives it under the state directory's `history/` rather than
discarding it. If a one-off should genuinely skip the pipeline, that is
the OPERATOR's call: show them `droost workflow:bypass "<why>"` and
let them run it in their own terminal. Never grant it yourself — the
guard refuses it from your shell, and a bypass with no human behind it
is indistinguishable from tampering.

A WHOLE SITE from a design (a Replit or Vite app, a folder of HTML)
starts with an intake, not a run: follow `.claude/skills/intake/SKILL.md`.
It reads the source (`droost workflow:intake audit`), proposes the
content model, asks the human what the source cannot say, and writes
the roadmap; no run opens until the human approves it (ask them; on
their yes, run `droost workflow:intake approve`).

This is a Drupal CMS site built from the droost_cms recipe: every page renders through Single Directory Components, and Canvas pages are written with `droost/bin/canvas` (`status`, `components`, `tree:get`, `tree:validate`, `tree:set`, `lint`), never by pasting HTML. Read the `canvas-build` skill before you build a page, a component, a display or a list.
<!-- END DROOST WORKFLOW -->

<!-- BEGIN DROOST GUIDELINES -->
# Droost — Drupal 11.4.10, PHP unknown

## Use droost first

droost knows this codebase first-hand: its code index, its structure and
its wiki are built from this project's own files, core and contrib
included. Before writing, changing, reviewing or planning any Drupal or
PHP code here, ask it what THIS project contains rather than trusting
prior knowledge: Drupal's APIs change between versions. droost reads files
only, so it answers while the site is broken.

- `droost code:wiki` — the wiki, and an inventory of every installed module
  and theme (`droost code:wiki inventory`, `droost code:wiki inventory/<name>`).
- `droost code:tree [module|path]` — the code's structure: files, classes,
  methods, and each module's hooks, services and routes.
- `droost search:arch "<words>"` — the documentation, as plain text.
- `droost code:symbol`, `droost code:graph`, `droost search:code`,
  `droost code:docs`, `droost code:deprecations`, `droost brief`.

`droost` with no argument lists the commands; `droost <command> help`
explains one. Plan consults `code:wiki` and `code:tree` before it closes.
When the code index is missing or stale, `droost code:index` rebuilds it.

How you build is your call. The site's house rules say what shape the
result must take, and the run's gates and seeker hold it to them.
<!-- END DROOST GUIDELINES -->
