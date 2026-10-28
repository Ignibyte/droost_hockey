<?php

/**
 * @file
 * Gate: every SDC in the project's own code meets Canvas's requirements.
 *
 * An SDC that fails Canvas's requirements checker gets no Component entity
 * on the next cache rebuild, so it cannot be placed on a page; one that had
 * an entity keeps it, disabled. Neither failure says anything on the page
 * that was being built, so this gate asks Canvas itself, through
 * `droost/bin/canvas lint --custom`: the SDCs under modules/custom,
 * themes/custom and profiles/custom. Contributed SDCs are not the project's
 * to fix and are not read (on a fresh Drupal CMS, four of them fail).
 * Advisories (no group, no description, no examples) are reported and never
 * fail it.
 *
 * Exit 0: every custom SDC meets the requirements. Exit 1: at least one
 * does not, each named with Canvas's reason. Exit 4: it ran and there was
 * no custom SDC to read, which droost records as a labelled pass, never a
 * plain one. Exit 3: did not run (no drush, a site drush could not boot, no
 * Canvas, an answer that is not the tool's).
 */

declare(strict_types=1);

const PASSED = 0;
const FAILED = 1;
const DID_NOT_RUN = 3;
const EXAMINED_NOTHING = 4;

/**
 * Ends the gate with its verdict and a one-line summary.
 */
function finish(int $code, string $summary): never {
  fwrite(STDOUT, "\n" . $summary . "\n");
  exit($code);
}

$context = [];
if (!(function_exists('stream_isatty') && @stream_isatty(STDIN))) {
  $decoded = json_decode((string) stream_get_contents(STDIN), TRUE);
  $context = is_array($decoded) ? $decoded : [];
}
$root = '.';
foreach ([$context['project_root'] ?? NULL, getenv('DROOST_PROJECT_ROOT'), getcwd()] as $candidate) {
  if (is_string($candidate) && $candidate !== '' && is_dir($candidate)) {
    $root = rtrim($candidate, '/');
    break;
  }
}

if (!is_file($root . '/droost/bin/canvas')) {
  finish(DID_NOT_RUN, 'component_lint did not run: droost/bin/canvas is missing (recipes/droost_cms/scripts/install-layer.sh puts it there).');
}
$process = proc_open(
  ['bash', 'droost/bin/canvas', 'lint', '--custom'],
  [0 => ['file', '/dev/null', 'r'], 1 => ['pipe', 'w'], 2 => ['pipe', 'w']],
  $pipes,
  $root,
);
if (!is_resource($process)) {
  finish(DID_NOT_RUN, 'component_lint did not run: bash could not be started.');
}
$output = (string) stream_get_contents($pipes[1]);
$errors = (string) stream_get_contents($pipes[2]);
fclose($pipes[1]);
fclose($pipes[2]);
$code = proc_close($process);

$report = json_decode($output, TRUE);
if (is_array($report) && ($report['exit'] ?? NULL) === 2 && is_string($report['message'] ?? NULL)) {
  finish(DID_NOT_RUN, 'component_lint did not run: ' . $report['message']);
}
if (!is_array($report) || !isset($report['exit'], $report['message']) || !is_array($report['data']['summary'] ?? NULL)) {
  finish(DID_NOT_RUN, sprintf('component_lint did not run: the Canvas tools answered with something that is not a lint report (exit %d): %s', $code, substr(trim($output . ' ' . $errors), 0, 300)));
}

$summary = $report['data']['summary'];
$linted = (int) ($summary['linted'] ?? 0);
foreach (is_array($report['data']['components'] ?? NULL) ? $report['data']['components'] : [] as $row) {
  if (!is_array($row)) {
    continue;
  }
  foreach (is_array($row['blockers'] ?? NULL) ? $row['blockers'] : [] as $blocker) {
    fwrite(STDOUT, sprintf("%s: %s\n", (string) ($row['component'] ?? '?'), (string) $blocker));
  }
}

if ($report['exit'] === 1) {
  finish(FAILED, sprintf(
    'component_lint FAILED: %d of %d custom SDC(s) do not meet Canvas\'s requirements, so Canvas will not offer them on a page. %s',
    (int) ($summary['blocked'] ?? 0),
    $linted,
    $report['message'],
  ));
}
if ($report['exit'] === 0 && $linted === 0) {
  finish(EXAMINED_NOTHING, 'component_lint examined nothing: the project has no SDC under modules/custom, themes/custom or profiles/custom.');
}
if ($report['exit'] === 0) {
  finish(PASSED, sprintf('component_lint passed: %d custom SDC(s) meet Canvas\'s requirements (%d advisory(ies), which never fail it).', $linted, (int) ($summary['advisories'] ?? 0)));
}
finish(DID_NOT_RUN, sprintf('component_lint did not run: the Canvas tools exited %s, which is not a verdict.', var_export($report['exit'], TRUE)));
