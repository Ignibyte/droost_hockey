<?php

declare(strict_types=1);

namespace Drupal\kchockey_site\Hook;

use Drupal\Core\Hook\Attribute\Hook;
use Drupal\Core\StringTranslation\StringTranslationTrait;

/**
 * The camps View's own area.
 */
final class CampViewsHooks {

  use StringTranslationTrait;

  /**
   * Implements hook_views_data().
   *
   * @return array<string, mixed>
   *   The global area "No camps found".
   */
  #[Hook('views_data')]
  public function viewsData(): array {
    $data['views']['kchockey_camp_empty'] = [
      'title' => $this->t('No camps found'),
      'help' => $this->t('What a filtered camp list shows when nothing matches, with a link back to every camp.'),
      'area' => ['id' => 'kchockey_camp_empty'],
    ];
    return $data;
  }

}
