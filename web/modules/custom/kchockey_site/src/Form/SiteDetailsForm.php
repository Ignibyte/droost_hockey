<?php

declare(strict_types=1);

namespace Drupal\kchockey_site\Form;

use Drupal\Core\Form\ConfigFormBase;
use Drupal\Core\Form\FormStateInterface;

/**
 * Edits the site details the footer and the contact page show.
 */
final class SiteDetailsForm extends ConfigFormBase {

  /**
   * The configuration this form edits.
   */
  public const CONFIG = 'kchockey_site.settings';

  /**
   * {@inheritdoc}
   */
  public function getFormId(): string {
    return 'kchockey_site_details';
  }

  /**
   * {@inheritdoc}
   *
   * @return list<string>
   *   The configuration this form edits.
   */
  protected function getEditableConfigNames(): array {
    return [self::CONFIG];
  }

  /**
   * {@inheritdoc}
   *
   * @param array<string, mixed> $form
   *   The form.
   * @param \Drupal\Core\Form\FormStateInterface $form_state
   *   The form state.
   *
   * @return array<string, mixed>
   *   The form.
   */
  public function buildForm(array $form, FormStateInterface $form_state): array {
    $form['footer'] = [
      '#type' => 'details',
      '#title' => $this->t('Footer'),
      '#open' => TRUE,
    ];
    $form['footer']['blurb'] = [
      '#type' => 'textarea',
      '#title' => $this->t('Blurb'),
      '#description' => $this->t('The paragraph under the KC Hockey mark.'),
      '#rows' => 3,
      '#config_target' => self::CONFIG . ':blurb',
    ];
    $form['footer']['location_line_1'] = [
      '#type' => 'textfield',
      '#title' => $this->t('Location, first line'),
      '#config_target' => self::CONFIG . ':location_line_1',
    ];
    $form['footer']['location_line_2'] = [
      '#type' => 'textfield',
      '#title' => $this->t('Location, second line'),
      '#config_target' => self::CONFIG . ':location_line_2',
    ];

    $form['contact'] = [
      '#type' => 'details',
      '#title' => $this->t('Contact'),
      '#open' => TRUE,
    ];
    $form['contact']['email'] = [
      '#type' => 'email',
      '#title' => $this->t('Email'),
      '#required' => TRUE,
      '#config_target' => self::CONFIG . ':email',
    ];
    $form['contact']['phone'] = [
      '#type' => 'tel',
      '#title' => $this->t('Phone'),
      '#description' => $this->t('Shown as a call link. Leave empty to show no phone.'),
      '#config_target' => self::CONFIG . ':phone',
    ];
    $form['contact']['contact_area'] = [
      '#type' => 'textfield',
      '#title' => $this->t('Contact page: area'),
      '#config_target' => self::CONFIG . ':contact_area',
    ];
    $form['contact']['contact_note'] = [
      '#type' => 'textfield',
      '#title' => $this->t('Contact page: area note'),
      '#config_target' => self::CONFIG . ':contact_note',
    ];

    $form['social'] = [
      '#type' => 'details',
      '#title' => $this->t('Social addresses'),
      '#description' => $this->t('An icon shows in the footer only once its address is set.'),
      '#open' => TRUE,
    ];
    $networks = [
      'instagram' => $this->t('Instagram'),
      'twitter' => $this->t('X / Twitter'),
      'facebook' => $this->t('Facebook'),
    ];
    foreach ($networks as $key => $label) {
      $form['social'][$key] = [
        '#type' => 'url',
        '#title' => $label,
        '#config_target' => self::CONFIG . ':' . $key,
      ];
    }

    return parent::buildForm($form, $form_state);
  }

}
