<?php

declare(strict_types=1);

namespace DroostCms\Canvas;

use Drupal\canvas\ComponentDoesNotMeetRequirementsException;
use Drupal\canvas\ComponentMetadataRequirementsChecker;
use Drupal\Core\Config\Entity\ConfigEntityInterface;
use Drupal\Core\Entity\EntityTypeManagerInterface;
use Drupal\Core\Theme\ComponentPluginManager;

/**
 * Lints SDCs for Canvas-readiness, independently of any transport.
 *
 * The rules used to live inside a tool reachable only over MCP — so
 * the one place a team most wants a linter, CI, could not have it. The rules
 * are transport-agnostic; only the reporting was not. They live here now, and
 * both `droost/bin/canvas lint` and the component_lint gate are thin callers.
 *
 * Two tiers, and the difference is load-bearing:
 * - **blockers** are Canvas's OWN requirements checker — the exact call its SDC
 *   discovery makes on cache rebuild — so a blocker means "no Component entity
 *   will be created for this on the next rebuild".
 * - **advisories** are this layer's, and never fail anything. They are about the
 *   editing and AI experience (missing group, missing descriptions, untyped
 *   props), which is a quality argument, not a correctness one.
 *
 * Failing requirements is NOT the same as unusable, which is why every result
 * carries `placeable`: Canvas keeps an already-created Component entity whose
 * SDC later fails, merely disabling it, and disabled components stay placeable
 * in existing trees.
 */
final readonly class ComponentLinter {

  /**
   * Canvas's own prop-shape development fixture, exempt in its discovery.
   */
  private const string FIXTURE = 'sdc_test_all_props:all-props';

  /**
   * Constructs a ComponentLinter.
   *
   * @param \Drupal\Core\Theme\ComponentPluginManager $componentManager
   *   The SDC plugin manager (the catalog under test).
   * @param \Drupal\Core\Entity\EntityTypeManagerInterface $entityTypeManager
   *   The entity type manager (the live Component entity cross-reference).
   */
  public function __construct(
    private ComponentPluginManager $componentManager,
    private EntityTypeManagerInterface $entityTypeManager,
  ) {}

  /**
   * Whether an SDC id is discoverable.
   *
   * @param string $id
   *   The SDC plugin id.
   *
   * @return bool
   *   TRUE when the catalog carries it.
   */
  public function exists(string $id): bool {
    $definitions = $this->componentManager->getDefinitions();
    return isset($definitions[$id]) && is_array($definitions[$id]);
  }

  /**
   * Lints one SDC.
   *
   * @param string $id
   *   The SDC plugin id.
   *
   * @return array{component: string, meets_requirements: bool, blockers: array<int, string>, advisories: array<int, string>, placeable: bool, component_entity: array{id: string, exists: bool, enabled: bool}|null}|null
   *   The result, or NULL when the id is not discoverable.
   */
  public function lintOne(string $id): ?array {
    $definitions = $this->componentManager->getDefinitions();
    if (!isset($definitions[$id]) || !is_array($definitions[$id])) {
      return NULL;
    }
    return $this->lint($id, self::stringKeyed($definitions[$id]));
  }

  /**
   * Lints the whole catalog.
   *
   * @param bool $onlyProblems
   *   Return only components with blockers or advisories.
   *
   * @return array{ok: bool, summary: array{linted: int, passing: int, blocked: int, returned: int}, components: array<int, array{component: string, meets_requirements: bool, blockers: array<int, string>, advisories: array<int, string>, placeable: bool, component_entity: array{id: string, exists: bool, enabled: bool}|null}>}
   *   {ok, summary: {linted, passing, blocked, returned}, components: [...]}.
   *   `ok` is the gate-able verdict: every SDC meets Canvas's requirements.
   *   Advisories are deliberately excluded from it — a CI gate that failed on
   *   a missing description would be turned off within a week.
   */
  public function sweep(bool $onlyProblems = TRUE): array {
    $definitions = $this->componentManager->getDefinitions();
    $results = [];
    $passing = 0;
    foreach ($definitions as $id => $definition) {
      if (!is_array($definition)) {
        continue;
      }
      $result = $this->lint((string) $id, self::stringKeyed($definition));
      if ($result['meets_requirements'] === TRUE) {
        $passing++;
      }
      if ($onlyProblems && $result['blockers'] === [] && $result['advisories'] === []) {
        continue;
      }
      $results[] = $result;
    }
    $blocked = count($definitions) - $passing;
    return [
      'ok' => $blocked === 0,
      'summary' => [
        'linted' => count($definitions),
        'passing' => $passing,
        'blocked' => $blocked,
        'returned' => count($results),
      ],
      'components' => $results,
    ];
  }

  /**
   * Lints one SDC definition.
   *
   * @param string $id
   *   The SDC plugin id.
   * @param array<string, mixed> $definition
   *   The plugin definition.
   *
   * @return array{component: string, meets_requirements: bool, blockers: array<int, string>, advisories: array<int, string>, placeable: bool, component_entity: array{id: string, exists: bool, enabled: bool}|null}
   *   {component, meets_requirements, blockers, advisories, placeable,
   *   component_entity}.
   */
  private function lint(string $id, array $definition): array {
    $blockers = [];

    // The blocking gauntlet mirrors Canvas's SingleDirectoryComponentDiscovery
    // ::checkRequirements() exactly, so "meets_requirements" here means "will
    // get a Component entity on the next rebuild" — including Canvas's own
    // special case for its prop-shape development fixture.
    if ($id === self::FIXTURE) {
      return [
        'component' => $id,
        'meets_requirements' => TRUE,
        'blockers' => [],
        'advisories' => $this->advisories($definition),
      ] + $this->componentEntityStatus($id);
    }
    if (($definition['status'] ?? NULL) === 'obsolete') {
      $blockers[] = 'Component has "obsolete" status';
    }
    if ((bool) ($definition['noUi'] ?? FALSE)) {
      $blockers[] = 'Component flagged "noUi".';
    }
    if ($blockers === []) {
      try {
        $plugin = $this->componentManager->createInstance($id);
        $required = [];
        if (isset($definition['props']) && is_array($definition['props']) && isset($definition['props']['required']) && is_array($definition['props']['required'])) {
          $required = array_values(array_map(
            static fn (mixed $name): string => is_scalar($name) ? (string) $name : '',
            $definition['props']['required'],
          ));
        }
        ComponentMetadataRequirementsChecker::check($id, $plugin->metadata, $required);
      }
      catch (ComponentDoesNotMeetRequirementsException $e) {
        $blockers = array_values(array_map(
          static fn (mixed $message): string => is_scalar($message) || $message instanceof \Stringable ? (string) $message : '',
          $e->getMessages(),
        ));
      }
      catch (\Throwable $e) {
        $blockers[] = sprintf('Component failed to instantiate: %s', $e->getMessage());
      }
    }

    return [
      'component' => $id,
      'meets_requirements' => $blockers === [],
      'blockers' => $blockers,
      'advisories' => $this->advisories($definition),
    ] + $this->componentEntityStatus($id);
  }

  /**
   * Cross-references the live Canvas Component entity for an SDC.
   *
   * Canvas keeps (but disables) an existing Component entity whose SDC later
   * fails requirements, and disabled components remain placeable in trees —
   * so "requirements failing" must never be read as "cannot be placed".
   *
   * @param string $sdc_id
   *   The SDC plugin id ("provider:machine_name").
   *
   * @return array{placeable: bool, component_entity: array{id: string, exists: bool, enabled: bool}|null}
   *   {placeable, component_entity: {id, exists, enabled}|null}.
   */
  private function componentEntityStatus(string $sdc_id): array {
    $entity_id = 'sdc.' . str_replace(':', '.', $sdc_id);
    $component = $this->entityTypeManager->getStorage('component')->load($entity_id);
    if (!$component instanceof ConfigEntityInterface) {
      return ['placeable' => FALSE, 'component_entity' => NULL];
    }
    return [
      'placeable' => TRUE,
      'component_entity' => [
        'id' => $entity_id,
        'exists' => TRUE,
        'enabled' => $component->status(),
      ],
    ];
  }

  /**
   * Advisory checks: quality of the Canvas editing/AI experience.
   *
   * @param array<string, mixed> $definition
   *   The plugin definition.
   *
   * @return array<int, string>
   *   Advisory messages (never block eligibility).
   */
  private function advisories(array $definition): array {
    $advisories = [];
    if (self::str($definition['group'] ?? NULL) === '') {
      $advisories[] = 'No "group": the component lands in the default bucket in the Canvas library.';
    }
    if (self::str($definition['description'] ?? NULL) === '') {
      $advisories[] = 'No component "description": Canvas AI uses descriptions for component selection.';
    }
    $props = isset($definition['props']) && is_array($definition['props']) ? $definition['props'] : [];
    $properties = isset($props['properties']) && is_array($props['properties']) ? $props['properties'] : [];
    foreach ($properties as $prop_name => $schema) {
      if (!is_array($schema)) {
        continue;
      }
      $prop_name = (string) $prop_name;
      if ($prop_name === 'attributes') {
        // The attributes prop must be typed as the Attribute object, NOT
        // "object": an Attribute JSON-serialises to a string, so `type: object`
        // fails core SDC validation ("String value found, but an object is
        // required"). This is the single most common SDC schema error, so it is
        // checked here, not skipped. (SdcBlueprint emits the correct form.)
        $attr_type = ltrim(self::str($schema['type'] ?? NULL), '\\');
        if ($attr_type !== 'Drupal\\Core\\Template\\Attribute') {
          $advisories[] = sprintf(
            'Prop "attributes" should be type "Drupal\\Core\\Template\\Attribute"%s — a plain "type: object" fails core SDC validation because Attribute serialises to a string.',
            $attr_type !== '' ? sprintf(' (got "%s")', $attr_type) : ' (no type declared)',
          );
        }
        continue;
      }
      if (self::str($schema['description'] ?? NULL) === '') {
        $advisories[] = sprintf('Prop "%s" has no description (Canvas AI reads them).', $prop_name);
      }
      // A prop with neither "type" nor "$ref" is untyped: SDC cannot
      // validate or coerce it, and Canvas cannot build an input for it.
      if (!array_key_exists('type', $schema) && !array_key_exists('$ref', $schema)) {
        $advisories[] = sprintf('Prop "%s" declares no "type" (or $ref).', $prop_name);
      }
      if (($schema['type'] ?? NULL) === 'object' && !isset($schema['$ref']) && !isset($schema['properties'])) {
        $advisories[] = sprintf('Prop "%s" is a bare "type: object" without $ref or properties — Canvas cannot build an input for it.', $prop_name);
      }
      if (!array_key_exists('examples', $schema)) {
        $advisories[] = sprintf('Prop "%s" has no examples[] (Canvas uses examples[0] as the default value).', $prop_name);
      }
    }
    foreach (isset($definition['slots']) && is_array($definition['slots']) ? $definition['slots'] : [] as $slot_name => $slot) {
      if (is_array($slot) && self::str($slot['description'] ?? NULL) === '') {
        $advisories[] = sprintf('Slot "%s" has no description.', (string) $slot_name);
      }
    }
    return $advisories;
  }

  /**
   * Coerces a definition value to a string.
   *
   * @param mixed $value
   *   The value.
   *
   * @return string
   *   The string form, or ''.
   */
  private static function str(mixed $value): string {
    if (is_string($value)) {
      return $value;
    }
    return is_scalar($value) || $value instanceof \Stringable ? (string) $value : '';
  }

  /**
   * Re-keys a definition array with string keys.
   *
   * @param array<mixed> $definition
   *   The raw definition.
   *
   * @return array<string, mixed>
   *   The definition, string-keyed.
   */
  private static function stringKeyed(array $definition): array {
    $out = [];
    foreach ($definition as $key => $value) {
      $out[(string) $key] = $value;
    }
    return $out;
  }

}
