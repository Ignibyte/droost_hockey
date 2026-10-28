<?php

declare(strict_types=1);

namespace Drupal\kchockey_site\Hook;

use Drupal\Component\Utility\Html;
use Drupal\Core\Form\FormStateInterface;
use Drupal\Core\Hook\Attribute\Hook;
use Drupal\webform\WebformSubmissionForm;

/**
 * The contact form as the design draws it.
 */
final class ContactFormHooks {

  /**
   * Implements hook_form_BASE_FORM_ID_alter() for the contact webform.
   *
   * The Subject select always has a subject chosen, so it offers no empty
   * "- Select -" choice (Webform adds one to every required select).
   *
   * Webform's inline confirmation (its own template) is replaced by the
   * theme's form_sent component, fed from the webform's confirmation
   * settings, so staff still edit the words in the webform.
   *
   * @param array<string, mixed> $form
   *   The form.
   * @param \Drupal\Core\Form\FormStateInterface $form_state
   *   The form state.
   */
  #[Hook('form_webform_submission_contact_form_alter')]
  public function contactFormAlter(array &$form, FormStateInterface $form_state): void {
    if (isset($form['elements']['subject']['#default_value'])) {
      unset($form['elements']['subject']['#empty_option'], $form['elements']['subject']['#empty_value']);
    }

    $form_object = $form_state->getFormObject();
    if (!isset($form['confirmation']) || !$form_object instanceof WebformSubmissionForm) {
      return;
    }
    /** @var \Drupal\webform\WebformSubmissionInterface $submission */
    $submission = $form_object->getEntity();
    $webform = $submission->getWebform();

    // Back to the empty form, at the address it was sent from, keeping a
    // preset subject but not the submission's token.
    $back = $submission->getSourceUrl();
    $query = $back->getOption('query') ?: [];
    unset($query['webform_id'], $query['ajax_form'], $query['_wrapper_format'], $query['token'], $query['page']);
    $back->setOption('query', $query);
    $back_url = $back->toString(TRUE);

    $form['confirmation'] = [
      '#type' => 'component',
      '#component' => 'kchockey:form_sent',
      '#props' => [
        'heading' => (string) $webform->getSetting('confirmation_title'),
        'message' => trim(Html::decodeEntities(strip_tags((string) $webform->getSetting('confirmation_message')))),
        'back_url' => $webform->getSetting('confirmation_back') ? $back_url->getGeneratedUrl() : '',
        'back_label' => (string) $webform->getSetting('confirmation_back_label'),
      ],
    ];
  }

}
