<?php

declare(strict_types=1);

namespace DroostCms\Canvas;

use Drupal\Component\Render\PlainTextOutput;
use Drupal\Component\Serialization\Json;
use Drupal\Core\Config\Entity\ConfigEntityInterface;
use Drupal\Component\Uuid\UuidInterface;
use Drupal\Core\Entity\EntityFieldManagerInterface;
use Drupal\Core\Entity\EntityTypeManagerInterface;
use Drupal\Core\Entity\FieldableEntityInterface;
use Drupal\Core\Field\FieldItemListInterface;
use Drupal\Core\Plugin\DefaultPluginManager;

/**
 * Shared component_tree plumbing for `droost/bin/canvas`.
 *
 * Owns the three cross-tool concerns so TreeGet / TreeValidate / TreeSet
 * agree with each other: discovering which field holds a tree, normalizing
 * persisted items into the agent-facing payload (inputs decoded, hierarchy
 * derived), and normalizing agent-provided items into field values (inputs
 * encoded, uuids generated, structural references checked). Semantic
 * validation is Canvas's job — see the ValidComponentTreeItem constraint —
 * and is deliberately NOT duplicated here.
 */
final class TreeManager {

  /**
   * The persisted item keys a writer may provide.
   */
  private const ITEM_KEYS = ['uuid', 'component_id', 'component_version', 'parent_uuid', 'slot', 'inputs', 'label'];

  /**
   * Whether the component registry was already refreshed during this call.
   *
   * One refresh per prepareValues() is enough: it is a cache rebuild, not a
   * lookup, and a second unknown id after a refresh is genuinely unknown.
   */
  private bool $refreshed = FALSE;

  public function __construct(
    private readonly EntityTypeManagerInterface $entityTypeManager,
    private readonly EntityFieldManagerInterface $fieldManager,
    private readonly UuidInterface $uuidService,
    private readonly DefaultPluginManager $sdcManager,
    private readonly ComponentRegistryRefresherInterface $refresher,
  ) {}

  /**
   * Whether a Canvas Component entity with this id exists — refreshing once.
   *
   * A process outlives what it read: a component authored after it booted
   * (round 25 generated two SDCs mid-run, read by a long-lived process) is
   * invisible to its cached SDC definitions and Component list, so the tree
   * writer refused ids the site knew perfectly well until a restart
   * (R25-F1). Same shape as the module and bundle staleness fixed for
   * alpha3: refresh, then refuse only what is still unknown.
   *
   * @param string $component_id
   *   The Canvas Component entity id.
   *
   * @return bool
   *   TRUE when the component exists (possibly after a refresh).
   */
  private function componentKnown(string $component_id): bool {
    // The entity type id goes through a method on purpose: the analyser's
    // Drupal extension resolves a LITERAL 'component' against the entity
    // types it scanned, does not know Canvas's, and then types every load()
    // here as null — so the honest comparisons below read as tautologies.
    $storage = $this->entityTypeManager->getStorage(self::componentEntityTypeId());
    $found = $storage->load($component_id);
    if ($found === NULL && !$this->refreshed) {
      $this->refreshed = TRUE;
      try {
        $this->refresher->refresh();
        $storage->resetCache();
      }
      catch (\Throwable) {
        // A refresh that fails leaves the question to the plain lookup below.
      }
      $found = $storage->load($component_id);
    }
    return $found !== NULL;
  }

  /**
   * Canvas's Component config entity type id.
   *
   * @return string
   *   The id.
   */
  private static function componentEntityTypeId(): string {
    return 'component';
  }

  /**
   * Maps component_tree fields across entity types.
   *
   * @return array<string, array<string, array<int, string>>>
   *   entity_type → field_name → bundles.
   */
  public function treeFieldMap(): array {
    $out = [];
    foreach ($this->fieldManager->getFieldMapByFieldType('component_tree') as $entity_type => $fields) {
      if (!is_array($fields)) {
        continue;
      }
      foreach ($fields as $field_name => $info) {
        $bundles = [];
        if (is_array($info) && isset($info['bundles']) && is_array($info['bundles'])) {
          $bundles = array_values(array_map(
            static fn (mixed $bundle): string => is_scalar($bundle) ? (string) $bundle : '',
            $info['bundles'],
          ));
        }
        $out[(string) $entity_type][(string) $field_name] = $bundles;
      }
    }
    return $out;
  }

  /**
   * Resolves the tree field to use for an entity type.
   *
   * @param string $entity_type
   *   The entity type id.
   * @param string $field
   *   An explicit field name, or '' to auto-resolve.
   * @param string $error
   *   Set to the failure reason when NULL is returned.
   *
   * @return string|null
   *   The field name, or NULL with $error set.
   */
  public function resolveField(string $entity_type, string $field, string &$error): ?string {
    $map = $this->treeFieldMap();
    $fields = $map[$entity_type] ?? [];
    if ($fields === []) {
      $error = sprintf(
        'Entity type "%s" has no component_tree field. Trees exist on: %s.',
        $entity_type,
        $map === [] ? '(none)' : implode(', ', array_map(
          static fn (string $et, array $f): string => $et . ' (' . implode(', ', array_keys($f)) . ')',
          array_keys($map),
          $map,
        )),
      );
      return NULL;
    }
    if ($field !== '') {
      if (!isset($fields[$field])) {
        $error = sprintf('Field "%s" is not a component_tree field on "%s". Available: %s.', $field, $entity_type, implode(', ', array_keys($fields)));
        return NULL;
      }
      return $field;
    }
    if (count($fields) > 1) {
      $error = sprintf('Entity type "%s" has multiple component_tree fields (%s) — pass "field".', $entity_type, implode(', ', array_keys($fields)));
      return NULL;
    }
    return (string) array_key_first($fields);
  }

  /**
   * Loads the host entity for a tree operation.
   *
   * @param string $entity_type
   *   The entity type id.
   * @param string $id
   *   The entity id.
   * @param bool $unchanged
   *   TRUE to bypass the static cache (for validate-then-discard flows).
   * @param string $error
   *   Set to the failure reason when NULL is returned.
   *
   * @return \Drupal\Core\Entity\FieldableEntityInterface|null
   *   The entity, or NULL with $error set.
   */
  public function loadHost(string $entity_type, string $id, bool $unchanged, string &$error): ?FieldableEntityInterface {
    if (!$this->entityTypeManager->hasDefinition($entity_type)) {
      $error = sprintf('Unknown entity type "%s".', $entity_type);
      return NULL;
    }
    $storage = $this->entityTypeManager->getStorage($entity_type);
    $entity = $unchanged ? $storage->loadUnchanged($id) : $storage->load($id);
    if ($entity === NULL) {
      $error = sprintf('No %s entity with id "%s".', $entity_type, $id);
      return NULL;
    }
    if (!$entity instanceof FieldableEntityInterface) {
      $error = sprintf('Entity type "%s" is not fieldable.', $entity_type);
      return NULL;
    }
    return $entity;
  }

  /**
   * Normalizes a persisted tree into the agent-facing payload.
   *
   * @param \Drupal\Core\Field\FieldItemListInterface<\Drupal\Core\Field\FieldItemInterface> $items
   *   The component_tree field item list.
   *
   * @return array<string, mixed>
   *   {items: [...], roots: [uuid...], children: {uuid: [uuid...]}}: the flat
   *   list (inputs decoded to objects) plus the derived hierarchy.
   */
  public function toPayload(FieldItemListInterface $items): array {
    $flat = [];
    $children = [];
    $roots = [];
    $raw = $items->getValue();
    foreach (is_array($raw) ? $raw : [] as $value) {
      if (!is_array($value)) {
        continue;
      }
      $uuid = isset($value['uuid']) && is_scalar($value['uuid']) ? (string) $value['uuid'] : '';
      $parent = isset($value['parent_uuid']) && is_scalar($value['parent_uuid']) ? (string) $value['parent_uuid'] : NULL;
      $inputs_raw = isset($value['inputs']) && is_scalar($value['inputs']) ? (string) $value['inputs'] : '{}';
      $decoded = json_decode($inputs_raw, TRUE);
      $flat[] = [
        'uuid' => $uuid,
        'component_id' => isset($value['component_id']) && is_scalar($value['component_id']) ? (string) $value['component_id'] : '',
        'component_version' => isset($value['component_version']) && is_scalar($value['component_version']) ? (string) $value['component_version'] : NULL,
        'parent_uuid' => $parent,
        'slot' => isset($value['slot']) && is_scalar($value['slot']) ? (string) $value['slot'] : NULL,
        'inputs' => is_array($decoded) ? $decoded : [],
        'label' => isset($value['label']) && is_scalar($value['label']) ? (string) $value['label'] : NULL,
      ];
      if ($parent === NULL || $parent === '') {
        $roots[] = $uuid;
      }
      else {
        $children[$parent][] = $uuid;
      }
    }
    return ['items' => $flat, 'roots' => $roots, 'children' => $children];
  }

  /**
   * Normalizes agent-provided items into component_tree field values.
   *
   * Structural normalization only: uuid generation, inputs encoding, key
   * whitelisting, and parent-reference integrity within the provided tree.
   * Component existence, versions, slot names, and input schemas are left to
   * Canvas's own constraints (run via entity validation by the callers).
   *
   * @param mixed $items
   *   The raw "items" argument.
   * @param array<int, string> $errors
   *   Collected structural errors (by reference).
   * @param array<int, string> $notes
   *   Collects one note per component whose omitted props were filled from its
   *   schema, by reference.
   *
   * @return array<int, array<string, mixed>>
   *   The field values, ready for setValue(); [] when $errors is non-empty.
   */
  public function prepareValues(mixed $items, array &$errors, array &$notes = []): array {
    if (!is_array($items)) {
      $errors[] = 'items must be a list of tree items ({component_id, inputs?, parent_uuid?, slot?, uuid?, component_version?, label?}); an empty list clears the tree.';
      return [];
    }
    if ($items === []) {
      // An explicit empty list is the "clear the tree" operation.
      return [];
    }
    $values = [];
    $uuids = [];
    // Map each retained value back to its original items[] index: $values is
    // compacted (invalid items are skipped), so its own keys would misreport.
    $origin = [];
    foreach (array_values($items) as $i => $item) {
      $label = sprintf('items[%d]', $i);
      if (!is_array($item)) {
        $errors[] = $label . ': must be an object.';
        continue;
      }
      $unknown = array_diff(array_keys($item), self::ITEM_KEYS);
      if ($unknown !== []) {
        $errors[] = sprintf('%s: unknown key(s) %s. Allowed: %s.', $label, implode(', ', array_map(strval(...), $unknown)), implode(', ', self::ITEM_KEYS));
        continue;
      }
      $component_id = isset($item['component_id']) && is_scalar($item['component_id']) ? trim((string) $item['component_id']) : '';
      if ($component_id === '') {
        $errors[] = $label . ': "component_id" is required (a Canvas Component entity id like "sdc.mercury.cta" — `droost/bin/canvas components` lists them).';
        continue;
      }
      if (!$this->componentKnown($component_id)) {
        $errors[] = sprintf(
          '%s: unknown Canvas component "%s" — the registry was refreshed (SDC definitions, Component entities) and it is still absent. A brand-new SDC needs a valid component.yml that passes `droost/bin/canvas lint <sdc id>`; `droost/bin/canvas components` lists what is placeable.',
          $label,
          $component_id,
        );
        continue;
      }
      $uuid = isset($item['uuid']) && is_scalar($item['uuid']) ? trim((string) $item['uuid']) : '';
      if ($uuid === '') {
        $uuid = $this->uuidService->generate();
      }
      if (isset($uuids[$uuid])) {
        $errors[] = sprintf('%s: duplicate uuid "%s".', $label, $uuid);
        continue;
      }
      $uuids[$uuid] = TRUE;

      $parent = isset($item['parent_uuid']) && is_scalar($item['parent_uuid']) && trim((string) $item['parent_uuid']) !== '' ? trim((string) $item['parent_uuid']) : NULL;
      $slot = isset($item['slot']) && is_scalar($item['slot']) && trim((string) $item['slot']) !== '' ? trim((string) $item['slot']) : NULL;
      if (($parent === NULL) !== ($slot === NULL)) {
        $errors[] = $label . ': "parent_uuid" and "slot" must be provided together (a child is placed into a named slot of its parent) or both omitted (a root item).';
        continue;
      }

      $raw_inputs = $this->withSchemaDefaults($component_id, $item['inputs'] ?? NULL, $notes);
      $inputs = $this->encodeInputs($raw_inputs, $label, $errors);
      if ($inputs === NULL) {
        continue;
      }

      $value = [
        'uuid' => $uuid,
        'component_id' => $component_id,
        'parent_uuid' => $parent,
        'slot' => $slot,
        'inputs' => $inputs,
        'label' => isset($item['label']) && is_scalar($item['label']) && (string) $item['label'] !== '' ? (string) $item['label'] : NULL,
      ];
      $version = isset($item['component_version']) && is_scalar($item['component_version']) ? trim((string) $item['component_version']) : '';
      if ($version !== '') {
        // Omitted versions are auto-stamped by ComponentTreeItem with the
        // component's loaded version; only pass an explicit override through.
        $value['component_version'] = $version;
      }
      $values[] = $value;
      $origin[] = $i;
    }

    // Parent references must resolve within the provided tree (the write
    // replaces the whole field, so there is nothing else to point at).
    foreach ($values as $i => $value) {
      // $origin is built in lockstep with $values, so the key always exists;
      // the fallback keeps this total for the analyser.
      $item_index = $origin[$i] ?? $i;
      $parent = $value['parent_uuid'];
      if (is_string($parent) && !isset($uuids[$parent])) {
        $errors[] = sprintf('items[%d]: parent_uuid "%s" does not match any item in this tree.', $item_index, $parent);
      }
      if (is_string($parent) && $parent === $value['uuid']) {
        $errors[] = sprintf('items[%d]: an item cannot be its own parent.', $item_index);
      }
    }

    // Reject multi-node cycles (A->B->A): the self-parent check above only
    // catches length-1, but any loop leaves the tree rootless, which nothing
    // downstream detects. Walk each item's parent chain (bounded by the item
    // count) and flag the first that revisits a node.
    $parentOf = [];
    foreach ($values as $value) {
      if (is_string($value['parent_uuid'])) {
        $parentOf[$value['uuid']] = $value['parent_uuid'];
      }
    }
    foreach ($values as $i => $value) {
      if (!is_string($value['parent_uuid']) || $value['parent_uuid'] === $value['uuid']) {
        // No parent, or a self-parent already reported above.
        continue;
      }
      $seen = [$value['uuid'] => TRUE];
      $node = $value['parent_uuid'];
      while (isset($parentOf[$node])) {
        if (isset($seen[$node])) {
          $errors[] = sprintf('items[%d]: parent_uuid chain forms a cycle (a tree needs a root).', $origin[$i] ?? $i);
          break 2;
        }
        $seen[$node] = TRUE;
        $node = $parentOf[$node];
      }
    }

    return $errors === [] ? $values : [];
  }

  /**
   * Applies tree values to an entity in memory and validates it.
   *
   * Canvas's constraints (ValidComponentTreeItem,
   * ComponentTreeMeetRequirements) run as part of normal entity validation;
   * this is the authoritative semantic check for component existence,
   * versions, slots, and input schemas.
   *
   * @param \Drupal\Core\Entity\FieldableEntityInterface $entity
   *   The host entity (callers pass a fresh loadUnchanged() copy).
   * @param string $field
   *   The component_tree field name.
   * @param array<int, array<string, mixed>> $values
   *   The prepared field values.
   *
   * @return array<int, array{path: string, message: string, in_tree: bool}>
   *   Violations; `in_tree` marks the ones on the tree field itself.
   */
  public function applyAndValidate(FieldableEntityInterface $entity, string $field, array $values): array {
    $entity->set($field, $values);
    $out = [];
    foreach ($entity->validate() as $violation) {
      $path = (string) $violation->getPropertyPath();
      $out[] = [
        'path' => $path,
        // Canvas violation messages carry HTML placeholder markup and entity
        // encoding; agents need copyable plain text (slot names, versions).
        'message' => PlainTextOutput::renderFromHtml((string) $violation->getMessage()),
        'in_tree' => $path === $field || str_starts_with($path, $field . '.'),
      ];
    }
    return $out;
  }

  /**
   * Drops an entity from its storage's static cache.
   *
   * Validate-only flows mutate an in-memory copy; resetting guarantees no
   * later code in the same process sees the discarded mutation.
   *
   * @param \Drupal\Core\Entity\FieldableEntityInterface $entity
   *   The entity to forget.
   */
  public function forget(FieldableEntityInterface $entity): void {
    $id = $entity->id();
    if ($id !== NULL) {
      $this->entityTypeManager->getStorage($entity->getEntityTypeId())->resetCache([$id]);
    }
  }

  /**
   * Merges the component schema's defaults into omitted inputs.
   *
   * Canvas rejects a component whose schema-defaulted prop is simply absent,
   * and the rejection names a validation constraint rather than the prop, so
   * the writer learns "the tree is invalid" and not "you left out `padding`".
   * The schema already carries the answer, so fill it in rather than bounce the
   * write: 66 of this site's 268 SDC props declare a `default`.
   *
   * Two sources, both schema-sanctioned, in order:
   * - `default`, which is the component author saying what absence means;
   * - the first `enum` value, but ONLY for a required prop with no default —
   *   it is valid by construction, and the alternative is a guaranteed
   *   rejection.
   *
   * Deliberately NOT filled from `examples`. Examples are illustrative prose
   * ("Find your next ride"), and a tool that quietly ships placeholder copy
   * into a real page is worse than one that refuses: 170 props carry examples,
   * and inventing content is not the same as applying a default.
   *
   * A provided value always wins, including an explicit NULL or empty string —
   * those are choices, not omissions.
   *
   * @param string $component_id
   *   The Canvas Component entity id (e.g. "sdc.mercury.cta").
   * @param mixed $inputs
   *   The caller-provided inputs, in whatever shape they arrived.
   * @param array<int, string> $notes
   *   Collects one note per component filled, by reference.
   *
   * @return mixed
   *   The inputs with defaults merged, or the original value untouched when
   *   the component has no readable SDC schema or the inputs are not a map.
   */
  private function withSchemaDefaults(string $component_id, mixed $inputs, array &$notes): mixed {
    // Only the object form can be merged into. A JSON string or a list is
    // left alone: encodeInputs() judges those, and reshaping input it is about
    // to reject would only confuse the error.
    $provided = $inputs ?? [];
    if (!is_array($provided) || ($provided !== [] && array_is_list($provided))) {
      return $inputs;
    }
    $required = [];
    $properties = $this->componentProps($component_id, $required);
    if ($properties === []) {
      return $inputs;
    }
    $filled = [];
    foreach ($properties as $name => $prop) {
      if (!is_array($prop) || array_key_exists($name, $provided)) {
        continue;
      }
      if (array_key_exists('default', $prop)) {
        $provided[$name] = $prop['default'];
        $filled[] = $name;
        continue;
      }
      $enum = $prop['enum'] ?? NULL;
      if (in_array($name, $required, TRUE) && is_array($enum) && $enum !== []) {
        $provided[$name] = reset($enum);
        $filled[] = $name;
      }
    }
    if ($filled !== []) {
      sort($filled);
      $notes[] = sprintf('%s: filled %s from the component schema.', $component_id, implode(', ', $filled));
    }
    return $provided;
  }

  /**
   * The SDC prop schema behind a Canvas Component entity.
   *
   * @param string $component_id
   *   The Component entity id.
   * @param array<int, string> $required
   *   Receives the schema's required prop names.
   *
   * @return array<string, mixed>
   *   The prop properties, or an empty array when this component is not
   *   SDC-backed or its SDC no longer exists (`droost/bin/canvas status`
   *   reports those orphans).
   */
  private function componentProps(string $component_id, array &$required): array {
    $required = [];
    try {
      $component = $this->entityTypeManager->getStorage('component')->load($component_id);
    }
    catch (\Throwable) {
      return [];
    }
    if (!$component instanceof ConfigEntityInterface || $component->get('source') !== 'sdc') {
      return [];
    }
    $sdc_id = $component->get('source_local_id');
    if (!is_string($sdc_id) || $sdc_id === '' || !$this->sdcManager->hasDefinition($sdc_id)) {
      return [];
    }
    $definition = $this->sdcManager->getDefinition($sdc_id);
    $props = is_array($definition) && is_array($definition['props'] ?? NULL) ? $definition['props'] : [];
    $names = $props['required'] ?? [];
    if (is_array($names)) {
      $required = array_values(array_filter($names, 'is_string'));
    }
    $properties = $props['properties'] ?? NULL;
    if (!is_array($properties)) {
      return [];
    }
    $out = [];
    foreach ($properties as $name => $prop) {
      $out[(string) $name] = $prop;
    }
    return $out;
  }

  /**
   * Encodes an agent-provided inputs value to the persisted JSON string.
   *
   * @param mixed $inputs
   *   An object/map (preferred), a pre-encoded JSON object string, or NULL.
   * @param string $label
   *   The error label.
   * @param array<int, string> $errors
   *   Collected errors (by reference).
   *
   * @return string|null
   *   The JSON string, or NULL on error.
   */
  private function encodeInputs(mixed $inputs, string $label, array &$errors): ?string {
    if ($inputs === NULL) {
      return '{}';
    }
    if (is_array($inputs)) {
      if ($inputs === []) {
        return '{}';
      }
      if (array_is_list($inputs)) {
        $errors[] = $label . ': "inputs" must be an object of prop_name: value (or source-wrapped) pairs, not a list.';
        return NULL;
      }
      return Json::encode($inputs);
    }
    if (is_string($inputs)) {
      $decoded = json_decode($inputs, TRUE);
      if (!is_array($decoded) || ($decoded !== [] && array_is_list($decoded))) {
        $errors[] = $label . ': "inputs" string must be a JSON object.';
        return NULL;
      }
      // Re-encode rather than passing the raw bytes through: Canvas's
      // ComponentInputs::setValue() asserts the value starts with '{', which
      // a whitespace-prefixed (still valid) JSON object string would fail.
      return $decoded === [] ? '{}' : Json::encode($decoded);
    }
    $errors[] = $label . ': "inputs" must be an object or a JSON object string.';
    return NULL;
  }

}
