<?php

declare(strict_types=1);

namespace Drupal\kchockey_site\Plugin\views\area;

use Drupal\Core\Form\FormStateInterface;
use Drupal\Core\Url;
use Drupal\views\Attribute\ViewsArea;
use Drupal\views\Plugin\views\area\AreaPluginBase;

/**
 * The "No camps found" panel, with "Reset Filters" back to the unfiltered page.
 *
 * Rendered as the theme's camp_empty component.
 */
#[ViewsArea('kchockey_camp_empty')]
final class CampEmpty extends AreaPluginBase {

  /**
   * {@inheritdoc}
   */
  protected function defineOptions() {
    $options = parent::defineOptions();
    $options['heading'] = ['default' => 'No camps found'];
    $options['text'] = ['default' => 'Try adjusting your filters to see more events.'];
    $options['reset_label'] = ['default' => 'Reset Filters'];
    return $options;
  }

  /**
   * {@inheritdoc}
   */
  public function buildOptionsForm(&$form, FormStateInterface $form_state) {
    parent::buildOptionsForm($form, $form_state);
    $titles = [
      'heading' => $this->t('Heading'),
      'text' => $this->t('Text'),
      'reset_label' => $this->t('Reset link label'),
    ];
    foreach ($titles as $key => $title) {
      $form[$key] = [
        '#type' => 'textfield',
        '#title' => $title,
        '#default_value' => $this->options[$key],
      ];
    }
  }

  /**
   * {@inheritdoc}
   */
  public function render($empty = FALSE) {
    if (!$empty && empty($this->options['empty'])) {
      return [];
    }
    return [
      '#type' => 'component',
      '#component' => 'kchockey:camp_empty',
      '#props' => [
        'heading' => (string) $this->options['heading'],
        'text' => (string) $this->options['text'],
        'reset_label' => (string) $this->options['reset_label'],
        'reset_url' => Url::fromRoute('<current>')->toString(),
      ],
      '#cache' => ['contexts' => ['url.path']],
    ];
  }

}
