<?php

declare(strict_types=1);

namespace Drupal\kchockey_site\Hook;

use Drupal\Core\Access\AccessResult;
use Drupal\Core\Access\AccessResultInterface;
use Drupal\Core\Entity\EntityTypeInterface;
use Drupal\Core\Entity\EntityTypeManagerInterface;
use Drupal\Core\Field\FieldDefinitionInterface;
use Drupal\Core\Form\FormStateInterface;
use Drupal\Core\Hook\Attribute\Hook;
use Drupal\Core\Session\AccountInterface;
use Drupal\Core\StringTranslation\StringTranslationTrait;
use Drupal\node\NodeInterface;

/**
 * Camps (the `event` type) and the rinks they are held at.
 */
final class CampHooks {

  use StringTranslationTrait;

  public function __construct(
    private readonly EntityTypeManagerInterface $entityTypeManager,
  ) {}

  /**
   * Implements hook_entity_bundle_field_info_alter().
   *
   * A camp's end date may not come before its start date.
   *
   * @param array<string, \Drupal\Core\Field\FieldDefinitionInterface> $fields
   *   The bundle's field definitions.
   * @param \Drupal\Core\Entity\EntityTypeInterface $entity_type
   *   The entity type.
   * @param string $bundle
   *   The bundle.
   */
  #[Hook('entity_bundle_field_info_alter')]
  public function bundleFieldInfoAlter(array &$fields, EntityTypeInterface $entity_type, string $bundle): void {
    if ($entity_type->id() === 'node' && $bundle === 'event' && isset($fields['field_camp_end_date'])) {
      $end = $fields['field_camp_end_date'];
      if ($end instanceof FieldDefinitionInterface && method_exists($end, 'addConstraint')) {
        $end->addConstraint('KchockeyCampEndDate');
      }
    }
  }

  /**
   * Implements hook_node_access().
   *
   * A rink a camp is held at cannot be deleted: every camp has its rink.
   * (Users who bypass node access never reach this hook; the delete form
   * below refuses them too.)
   */
  #[Hook('node_access')]
  public function nodeAccess(NodeInterface $node, string $operation, AccountInterface $account): AccessResultInterface {
    if ($operation !== 'delete' || $node->bundle() !== 'rink' || $node->isNew()) {
      return AccessResult::neutral();
    }
    $camps = $this->campsAt($node);
    $result = $camps
      ? AccessResult::forbidden((string) $this->refusal($camps))
      : AccessResult::neutral();
    return $result->addCacheTags(['node_list:event'])->addCacheableDependency($node);
  }

  /**
   * Implements hook_form_FORM_ID_alter() for the rink edit form.
   *
   * Where an editor would look for Delete (refused by nodeAccess() above,
   * so the form offers none), says why: the camps held at the rink.
   *
   * @param array<string, mixed> $form
   *   The form.
   * @param \Drupal\Core\Form\FormStateInterface $form_state
   *   The form state.
   */
  #[Hook('form_node_rink_edit_form_alter')]
  public function rinkEditFormAlter(array &$form, FormStateInterface $form_state): void {
    $form_object = $form_state->getFormObject();
    $node = method_exists($form_object, 'getEntity') ? $form_object->getEntity() : NULL;
    if (!$node instanceof NodeInterface) {
      return;
    }
    $form['#cache']['tags'][] = 'node_list:event';
    $camps = $this->campsAt($node);
    if (!$camps) {
      return;
    }
    $form['kchockey_camps_held_here'] = [
      '#theme' => 'status_messages',
      '#message_list' => ['warning' => [$this->refusal($camps)]],
      '#status_headings' => ['warning' => $this->t('Warning message')],
      '#weight' => -100,
    ];
  }

  /**
   * Implements hook_form_FORM_ID_alter() for the rink delete form.
   *
   * Says which camps are held at the rink instead of offering to delete it
   * (for users who bypass node access; everyone else is refused the form).
   *
   * @param array<string, mixed> $form
   *   The form.
   * @param \Drupal\Core\Form\FormStateInterface $form_state
   *   The form state.
   */
  #[Hook('form_node_rink_delete_form_alter')]
  public function rinkDeleteFormAlter(array &$form, FormStateInterface $form_state): void {
    $form_object = $form_state->getFormObject();
    $node = method_exists($form_object, 'getEntity') ? $form_object->getEntity() : NULL;
    if (!$node instanceof NodeInterface) {
      return;
    }
    $camps = $this->campsAt($node);
    $form['#cache']['tags'][] = 'node_list:event';
    if (!$camps) {
      return;
    }
    $form['#title'] = $this->t('%rink cannot be deleted', ['%rink' => $node->label()]);
    $form['description'] = ['#plain_text' => (string) $this->refusal($camps)];
    $form['actions']['submit']['#access'] = FALSE;
    $form['#validate'][] = [self::class, 'refuseDelete'];
  }

  /**
   * Form validation: never deletes a rink a camp is held at.
   *
   * @param array<string, mixed> $form
   *   The form.
   * @param \Drupal\Core\Form\FormStateInterface $form_state
   *   The form state.
   */
  public static function refuseDelete(array &$form, FormStateInterface $form_state): void {
    $form_state->setErrorByName('', t('Camps are held at this rink. Move them to another rink first.'));
  }

  /**
   * The titles of the camps held at a rink, by start date.
   *
   * Every revision a camp may yet publish counts, its latest included.
   *
   * @return string[]
   *   Camp titles, keyed by node ID.
   */
  private function campsAt(NodeInterface $rink): array {
    $storage = $this->entityTypeManager->getStorage('node');
    $ids = [];
    foreach ([FALSE, TRUE] as $latest) {
      $query = $storage->getQuery()
        ->accessCheck(FALSE)
        ->condition('type', 'event')
        ->condition('field_camp_rink', $rink->id());
      if ($latest) {
        $query->latestRevision();
      }
      $ids += array_flip(array_values($query->execute()));
    }
    if (!$ids) {
      return [];
    }
    $camps = $storage->loadMultiple(array_keys($ids));
    uasort($camps, fn ($a, $b) => strcmp((string) $a->get('field_event_date')->value, (string) $b->get('field_event_date')->value));
    return array_map(fn ($camp) => (string) $camp->label(), $camps);
  }

  /**
   * The refusal, naming the camps.
   *
   * @param string[] $camps
   *   Camp titles.
   */
  private function refusal(array $camps): \Stringable {
    return $this->formatPlural(
      count($camps),
      'This rink cannot be deleted: a camp is held here (@camps). Move it to another rink first.',
      'This rink cannot be deleted: @count camps are held here (@camps). Move them to another rink first.',
      ['@camps' => implode(', ', $camps)],
    );
  }

}
