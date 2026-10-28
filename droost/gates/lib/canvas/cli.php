<?php

/**
 * @file
 * The Canvas tools an agent builds pages with, run inside the site by drush.
 *
 * Run as `droost/bin/canvas <verb> [arguments]`, which is
 * `drush php:script droost/gates/lib/canvas/cli.php -- <verb> …`.
 *
 * Verbs:
 * - status: the Canvas version, the placeable component registry by source,
 *   components orphaned by a deleted SDC, and where component trees live.
 * - components [<component id>] [--source=sdc] [--enabled-only]: the
 *   registry tree items reference ("sdc.<provider>.<name>", never the SDC's
 *   "provider:name"); with an id, its slots, versions, prop schemas and what
 *   its template does with each prop.
 * - tree:get <entity id>: an entity's component tree, inputs decoded, with
 *   its roots and children. Its items are tree:set's input as they stand.
 * - tree:validate <entity id> --items=<file|->: the tree checked by this
 *   layer and by Canvas's own constraints, on a copy that is thrown away.
 * - tree:set <entity id> --items=<file|-> [--dry-run]: the same checks, then
 *   the whole tree replaced, all or nothing.
 * - lint [<sdc id>] [--all] [--custom] [--advisories-fail]: Canvas's own
 *   requirements checker over the SDCs, plus advisories that never fail.
 *
 * The tree verbs take --entity-type (default canvas_page) and --field (the
 * component_tree field, found when there is one). --items names a JSON file,
 * relative to the project root, holding a list of items or {"items": [...]},
 * or "-" for stdin.
 *
 * Output: one JSON object, {exit, ok, message, data}. `exit` is 0 when ok;
 * 1 when the tree or component was refused, or lint found a blocker; 2 when
 * the verb could not answer (no Canvas, a bad argument, an unknown entity).
 * It is in the JSON because drush owns the process's exit code: a script
 * that calls exit() is reported as "terminated abnormally" with status 1
 * whatever it passed. droost/bin/canvas exits with it; no envelope at all
 * (drush could not boot the site) is 2 there too.
 *
 * These files sit under droost/gates/ on purpose: droost freezes that tree
 * while a run is open, so the checks a run's pages go through cannot be
 * loosened by the run.
 */

declare(strict_types=1);

namespace DroostCms\Canvas;

use Drupal\Core\Render\RenderContext;

require_once __DIR__ . '/Answer.php';
require_once __DIR__ . '/ComponentRegistryRefresherInterface.php';
require_once __DIR__ . '/ComponentRegistryRefresher.php';
require_once __DIR__ . '/TreeManager.php';
require_once __DIR__ . '/ComponentLinter.php';
require_once __DIR__ . '/TwigBehaviorReader.php';

const OK = 0;
const REFUSED = 1;
const CANNOT_ANSWER = 2;

/**
 * Ends the verb with its envelope.
 *
 * @param int $code
 *   OK, REFUSED or CANNOT_ANSWER.
 * @param string $message
 *   One sentence a person reads.
 * @param array<string, mixed> $data
 *   The payload.
 */
function respond(int $code, string $message, array $data = []): never {
  throw new Answer((string) json_encode(
    ['exit' => $code, 'ok' => $code === OK, 'message' => $message, 'data' => $data],
    JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE,
  ));
}

/**
 * Splits drush's extra arguments into positionals and --options.
 *
 * @param list<string> $argv
 *   The arguments after `--`.
 *
 * @return array{0: list<string>, 1: array<string, string|true>}
 *   The positionals, and the options by name.
 */
function parse(array $argv): array {
  $positional = [];
  $options = [];
  foreach ($argv as $arg) {
    if (str_starts_with($arg, '--')) {
      [$name, $value] = array_pad(explode('=', substr($arg, 2), 2), 2, TRUE);
      $options[$name] = $value;
      continue;
    }
    $positional[] = $arg;
  }
  return [$positional, $options];
}

/**
 * Reads a string option, or the default.
 *
 * @param array<string, string|true> $options
 *   The options.
 */
function option(array $options, string $name, string $default = ''): string {
  $value = $options[$name] ?? NULL;
  return is_string($value) && $value !== '' ? $value : $default;
}

/**
 * Runs a callable inside a render context, so nothing it renders leaks.
 *
 * @param callable $callable
 *   The work.
 *
 * @return mixed
 *   Its result.
 */
function shielded(callable $callable): mixed {
  return \Drupal::service('renderer')->executeInRenderContext(new RenderContext(), $callable);
}

/**
 * Reads the items --items names: a file under the project root, or stdin.
 *
 * @param array<string, string|true> $options
 *   The options.
 */
function items(array $options): mixed {
  $source = option($options, 'items');
  if ($source === '') {
    respond(CANNOT_ANSWER, '--items is required: a JSON file (relative to the project root) holding the tree, or "-" for stdin.');
  }
  if ($source === '-') {
    $raw = stream_get_contents(STDIN);
  }
  else {
    $path = str_starts_with($source, '/') ? $source : dirname(DRUPAL_ROOT) . '/' . $source;
    if (!is_file($path)) {
      respond(CANNOT_ANSWER, sprintf('--items names %s, which is not a file (paths are relative to the project root, %s).', $source, dirname(DRUPAL_ROOT)));
    }
    $raw = file_get_contents($path);
  }
  $decoded = json_decode(is_string($raw) ? $raw : '', TRUE);
  if (!is_array($decoded)) {
    respond(CANNOT_ANSWER, sprintf('--items %s is not JSON: %s.', $source, json_last_error_msg()));
  }
  return array_key_exists('items', $decoded) ? $decoded['items'] : $decoded;
}

/**
 * The tree manager, wired to the site's services.
 */
function tree_manager(): TreeManager {
  return new TreeManager(
    \Drupal::entityTypeManager(),
    \Drupal::service('entity_field.manager'),
    \Drupal::service('uuid'),
    \Drupal::service('plugin.manager.sdc'),
    new ComponentRegistryRefresher(
      \Drupal::service('plugin.manager.sdc'),
      \Drupal::service('Drupal\canvas\ComponentSource\ComponentSourceManager'),
    ),
  );
}

/**
 * Coerces a config value to a string.
 */
function str(mixed $value, string $default = ''): string {
  return is_scalar($value) || $value instanceof \Stringable ? (string) $value : $default;
}

/**
 * Verb status: what an agent needs to know before it builds a page.
 */
function status(): never {
  $info = \Drupal::service('extension.list.module')->getAllInstalledInfo();
  $version = isset($info['canvas']['version']) ? str($info['canvas']['version']) : NULL;
  $sdc = \Drupal::service('plugin.manager.sdc');
  $by_source = [];
  $orphaned = [];
  $enabled = 0;
  $total = 0;
  foreach (\Drupal::entityTypeManager()->getStorage('component')->loadMultiple() as $component) {
    $total++;
    if ($component->status()) {
      $enabled++;
    }
    $source = str($component->get('source'), 'unknown');
    $by_source[$source] = ($by_source[$source] ?? 0) + 1;
    // Deleting an SDC does not delete the Component entity Canvas made for
    // it, and the leftover keeps whatever status it had.
    $local = str($component->get('source_local_id'));
    if ($source === 'sdc' && $local !== '' && !$sdc->hasDefinition($local)) {
      $orphaned[] = ['component' => str($component->id()), 'sdc' => $local, 'enabled' => $component->status()];
    }
  }
  ksort($by_source);
  $fields = [];
  foreach (tree_manager()->treeFieldMap() as $entity_type => $names) {
    foreach ($names as $field => $bundles) {
      $count = NULL;
      try {
        $count = (int) \Drupal::entityTypeManager()->getStorage($entity_type)
          ->getQuery()->accessCheck(FALSE)->exists($field . '.uuid')->count()->execute();
      }
      catch (\Throwable) {
        // The count stays unknown for a storage with no query support.
      }
      $fields[] = [
        'entity_type' => $entity_type,
        'field' => $field,
        'bundles' => $bundles,
        'entities_with_tree' => $count,
      ];
    }
  }
  respond(OK, sprintf(
    'Canvas %s: %d placeable components (%d enabled; %s).%s Trees live on: %s.',
    $version ?? '(version unknown)',
    $total,
    $enabled,
    implode(', ', array_map(static fn (string $s, int $n): string => "$s: $n", array_keys($by_source), $by_source)),
    $orphaned === [] ? '' : sprintf(' %d component(s) point at an SDC that no longer exists; delete the config entity to clear each.', count($orphaned)),
    $fields === [] ? '(no component_tree field)' : implode('; ', array_map(
      static fn (array $f): string => sprintf('%s.%s (%s entities)', $f['entity_type'], $f['field'], $f['entities_with_tree'] ?? '?'),
      $fields,
    )),
  ), [
    'canvas' => $version,
    'components' => ['total' => $total, 'enabled' => $enabled, 'by_source' => $by_source, 'orphaned' => $orphaned],
    'tree_fields' => $fields,
  ]);
}

/**
 * Drops objects a decorator put into a prop schema.
 *
 * @param array<string|int, mixed> $schema
 *   The subtree.
 *
 * @return array<string|int, mixed>
 *   The subtree, plain data only.
 */
function plain_schema(array $schema): array {
  $out = [];
  foreach ($schema as $key => $value) {
    if ($key === 'ui_patterns') {
      continue;
    }
    if (is_array($value)) {
      $out[$key] = plain_schema($value);
    }
    elseif (!is_object($value)) {
      $out[$key] = $value;
    }
  }
  return $out;
}

/**
 * Verb components: the registry, or one component in full.
 *
 * @param list<string> $args
 *   The positionals.
 * @param array<string, string|true> $options
 *   The options.
 */
function components(array $args, array $options): never {
  $storage = \Drupal::entityTypeManager()->getStorage('component');
  $sdc = \Drupal::service('plugin.manager.sdc');
  $id = $args[0] ?? '';
  if ($id !== '') {
    $component = $storage->load($id);
    if ($component === NULL) {
      $ids = array_map('strval', array_keys($storage->loadMultiple()));
      sort($ids);
      respond(REFUSED, sprintf(
        'Unknown Canvas component "%s". %d exist, e.g. %s. Tree items use these ids, not the SDC\'s provider:name.',
        $id,
        count($ids),
        implode(', ', array_slice($ids, 0, 20)),
      ));
    }
    $slots = [];
    foreach ($component->getSlotDefinitions() as $name => $definition) {
      $slots[(string) $name] = is_array($definition) ? $definition : [];
    }
    $schemas = [];
    $behavior = ['available' => FALSE, 'reason' => 'only SDC-sourced components have a template to read'];
    if (str($component->get('source')) === 'sdc') {
      try {
        $definition = $sdc->getDefinition(str($component->get('source_local_id')));
      }
      catch (\Throwable) {
        $definition = NULL;
      }
      if (is_array($definition)) {
        $props = is_array($definition['props'] ?? NULL) ? $definition['props'] : [];
        $properties = is_array($props['properties'] ?? NULL) ? $props['properties'] : [];
        $schemas = [
          'required' => array_values(array_filter(is_array($props['required'] ?? NULL) ? $props['required'] : [], 'is_string')),
          'properties' => array_map(static fn (mixed $s): array => is_array($s) ? plain_schema($s) : [], $properties),
        ];
        $path = str($definition['path'] ?? NULL);
        $template = str($definition['template'] ?? NULL);
        $behavior = $path === '' || $template === ''
          ? ['available' => FALSE, 'reason' => 'the component declares no template']
          : (new TwigBehaviorReader())->read($path . '/' . $template, array_map('strval', array_keys($properties)));
      }
      else {
        $behavior = ['available' => FALSE, 'reason' => 'the source component could not be resolved'];
      }
    }
    respond(OK, sprintf(
      'Component %s ("%s", %s): active version %s of %d, %d slot(s).',
      $id,
      str($component->label()),
      $component->status() ? 'enabled' : 'disabled',
      $component->getActiveVersion(),
      count($component->getVersions()),
      count($slots),
    ), [
      'id' => $id,
      'label' => str($component->label()),
      'source' => str($component->get('source')),
      'local_source_id' => str($component->get('source_local_id')),
      'status' => $component->status(),
      'active_version' => $component->getActiveVersion(),
      'versions' => array_map('strval', $component->getVersions()),
      'slots' => $slots,
      'settings' => $component->getSettings(),
      'prop_schemas' => $schemas,
      'template_behavior' => $behavior,
      'category' => str($component->get('category')),
    ]);
  }
  $source = option($options, 'source');
  $enabled_only = isset($options['enabled-only']);
  $items = [];
  foreach ($storage->loadMultiple() as $key => $component) {
    $from = str($component->get('source'));
    if (($source !== '' && $from !== $source) || ($enabled_only && !$component->status())) {
      continue;
    }
    $items[(string) $key] = [
      'id' => (string) $key,
      'label' => str($component->label()),
      'source' => $from,
      'local_source_id' => str($component->get('source_local_id')),
      'status' => $component->status(),
      'active_version' => $component->getActiveVersion(),
      'slots' => array_map('strval', array_keys($component->getSlotDefinitions())),
    ];
  }
  ksort($items);
  respond(OK, sprintf(
    '%d placeable Canvas components%s%s. Name one for its slots, prop schemas and template behaviour.',
    count($items),
    $source !== '' ? sprintf(' from source "%s"', $source) : '',
    $enabled_only ? ' (enabled only)' : '',
  ), ['components' => array_values($items)]);
}

/**
 * Resolves the tree verbs' target: entity type, id and field.
 *
 * @param list<string> $args
 *   The positionals.
 * @param array<string, string|true> $options
 *   The options.
 *
 * @return array{0: string, 1: string, 2: string}
 *   The entity type, the entity id and the field.
 */
function target(TreeManager $trees, array $args, array $options): array {
  $id = $args[0] ?? '';
  if ($id === '') {
    respond(CANNOT_ANSWER, 'Name the entity: <verb> <entity id> [--entity-type=canvas_page] [--field=<component_tree field>].');
  }
  $entity_type = option($options, 'entity-type', 'canvas_page');
  $error = '';
  $field = $trees->resolveField($entity_type, option($options, 'field'), $error);
  if ($field === NULL) {
    respond(CANNOT_ANSWER, $error);
  }
  return [$entity_type, $id, $field];
}

/**
 * Verb tree:get.
 *
 * @param list<string> $args
 *   The positionals.
 * @param array<string, string|true> $options
 *   The options.
 */
function tree_get(array $args, array $options): never {
  $trees = tree_manager();
  [$entity_type, $id, $field] = target($trees, $args, $options);
  $error = '';
  $entity = shielded(static fn () => $trees->loadHost($entity_type, $id, FALSE, $error));
  if ($entity === NULL) {
    respond(CANNOT_ANSWER, $error);
  }
  $payload = $trees->toPayload($entity->get($field));
  respond(OK, sprintf(
    '%s %s ("%s") %s: %d tree item(s), %d root(s).',
    $entity_type,
    $id,
    str($entity->label()),
    $field,
    count($payload['items']),
    count($payload['roots']),
  ), ['entity_type' => $entity_type, 'id' => $id, 'label' => str($entity->label()), 'field' => $field] + $payload);
}

/**
 * Verbs tree:validate and tree:set: one path, so they cannot disagree.
 *
 * @param list<string> $args
 *   The positionals.
 * @param array<string, string|true> $options
 *   The options.
 * @param bool $write
 *   TRUE for tree:set without --dry-run.
 */
function tree_write(array $args, array $options, bool $write): never {
  $trees = tree_manager();
  [$entity_type, $id, $field] = target($trees, $args, $options);
  $structural = [];
  $filled = [];
  $values = $trees->prepareValues(items($options), $structural, $filled);
  if ($structural !== []) {
    respond(REFUSED, "Structurally invalid; Canvas's checks were not reached and nothing was written:\n- " . implode("\n- ", $structural), ['structural' => $structural]);
  }
  $error = '';
  $entity = shielded(static fn () => $trees->loadHost($entity_type, $id, TRUE, $error));
  if ($entity === NULL) {
    respond(CANNOT_ANSWER, $error);
  }
  $validated = FALSE;
  try {
    $violations = shielded(static fn (): array => $trees->applyAndValidate($entity, $field, $values));
    $validated = TRUE;
    if ($violations !== []) {
      $trees->forget($entity);
      $in_tree = array_values(array_filter($violations, static fn (array $v): bool => $v['in_tree']));
      $elsewhere = array_values(array_filter($violations, static fn (array $v): bool => !$v['in_tree']));
      respond(REFUSED, sprintf(
        "Canvas refused the tree; nothing was written:\n- %s",
        implode("\n- ", array_map(
          static fn (array $v): string => $v['path'] . ': ' . $v['message'] . ($v['in_tree'] ? '' : ' (already on the entity, outside the tree)'),
          $violations,
        )),
      ), [
        'valid' => FALSE,
        'violations' => $in_tree,
        'other_violations' => $elsewhere,
        'schema_defaults_applied' => $filled,
      ]);
    }
    if (!$write) {
      // What a save would persist: versions stamped, uuids generated.
      $applied = $trees->toPayload($entity->get($field));
      $trees->forget($entity);
      respond(OK, sprintf(
        'VALID: %d item(s) pass this layer\'s checks and Canvas\'s for %s %s (%s). Nothing was written.%s',
        count($applied['items']),
        $entity_type,
        $id,
        $field,
        $filled === [] ? '' : ' Schema defaults applied: ' . implode('; ', $filled),
      ), ['valid' => TRUE, 'persisted' => FALSE, 'schema_defaults_applied' => $filled] + $applied);
    }
    shielded(static fn () => $entity->save());
  }
  catch (Answer $answer) {
    throw $answer;
  }
  catch (\Throwable $e) {
    $trees->forget($entity);
    respond(CANNOT_ANSWER, $validated
      ? 'The tree passed validation but the save failed; the entity may be partly saved, so read it back with tree:get: ' . $e->getMessage()
      : 'Applying the tree to validate it failed; nothing was written: ' . $e->getMessage());
  }
  // Read back from storage: what persisted, not what was sent.
  $saved = shielded(static fn () => $trees->loadHost($entity_type, $id, TRUE, $error));
  $payload = $saved === NULL ? ['items' => [], 'roots' => [], 'children' => []] : $trees->toPayload($saved->get($field));
  respond(OK, sprintf(
    'Canvas tree written: %s %s (%s) now has %d item(s).%s Look at the page in a browser.',
    $entity_type,
    $id,
    $field,
    count($payload['items']),
    $filled === [] ? '' : ' Schema defaults applied: ' . implode('; ', $filled),
  ), ['persisted' => TRUE, 'schema_defaults_applied' => $filled] + $payload);
}

/**
 * Whether an SDC lives in the project's own code (custom modules, themes).
 *
 * @param array<string, mixed> $definition
 *   The SDC definition.
 */
function is_custom(array $definition): bool {
  $path = str($definition['path'] ?? NULL);
  return preg_match('#/(modules|themes|profiles)/custom/#', $path) === 1;
}

/**
 * Verb lint.
 *
 * @param list<string> $args
 *   The positionals.
 * @param array<string, string|true> $options
 *   The options.
 */
function lint(array $args, array $options): never {
  $sdc = \Drupal::service('plugin.manager.sdc');
  $linter = new ComponentLinter($sdc, \Drupal::entityTypeManager());
  $one = $args[0] ?? '';
  if ($one !== '') {
    $result = $linter->lintOne($one);
    if ($result === NULL) {
      respond(CANNOT_ANSWER, sprintf('Unknown SDC "%s" (lint takes the SDC id, provider:name).', $one));
    }
    $results = [$result];
  }
  else {
    $custom = isset($options['custom']);
    $results = [];
    foreach ($sdc->getDefinitions() as $id => $definition) {
      if (!is_array($definition) || ($custom && !is_custom($definition))) {
        continue;
      }
      $result = $linter->lintOne((string) $id);
      if ($result !== NULL) {
        $results[] = $result;
      }
    }
  }
  $blocked = array_values(array_filter($results, static fn (array $r): bool => !$r['meets_requirements']));
  $advisories = array_sum(array_map(static fn (array $r): int => count($r['advisories']), $results));
  $shown = isset($options['all']) ? $results : array_values(array_filter(
    $results,
    static fn (array $r): bool => $r['blockers'] !== [] || $r['advisories'] !== [],
  ));
  $failed = $blocked !== [] || (isset($options['advisories-fail']) && $advisories > 0);
  respond($failed ? REFUSED : OK, sprintf(
    '%d linted, %d meet Canvas\'s requirements, %d blocked (%s), %d advisory(ies).',
    count($results),
    count($results) - count($blocked),
    count($blocked),
    $blocked === [] ? 'none' : implode(', ', array_map(static fn (array $r): string => $r['component'], $blocked)),
    $advisories,
  ), [
    'summary' => ['linted' => count($results), 'blocked' => count($blocked), 'advisories' => $advisories],
    'components' => $shown,
  ]);
}

// Drush's php:script hands the arguments after `--` over as $extra.
try {
  [$positional, $options] = parse(array_values(array_map('strval', $extra ?? [])));
  $verb = array_shift($positional) ?? '';
  if (!\Drupal::moduleHandler()->moduleExists('canvas') && $verb !== '') {
    respond(CANNOT_ANSWER, 'Canvas is not installed on this site, so there is nothing for these verbs to read or write.');
  }
  match ($verb) {
    'status' => status(),
    'components' => components($positional, $options),
    'tree:get' => tree_get($positional, $options),
    'tree:validate' => tree_write($positional, $options, FALSE),
    'tree:set' => tree_write($positional, $options, !isset($options['dry-run'])),
    'lint' => lint($positional, $options),
    default => respond(CANNOT_ANSWER, sprintf(
      '%s. Verbs: status, components [<id>], tree:get <id>, tree:validate <id> --items=<file|->, tree:set <id> --items=<file|-> [--dry-run], lint [<sdc id>] [--custom] [--all].',
      $verb === '' ? 'Name a verb' : sprintf('Unknown verb "%s"', $verb),
    )),
  };
}
catch (Answer $answer) {
  print $answer->getMessage() . "\n";
}
