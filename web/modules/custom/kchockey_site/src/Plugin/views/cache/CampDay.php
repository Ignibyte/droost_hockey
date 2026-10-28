<?php

declare(strict_types=1);

namespace Drupal\kchockey_site\Plugin\views\cache;

use Drupal\Core\Cache\CacheableMetadata;
use Drupal\Core\StringTranslation\TranslatableMarkup;
use Drupal\views\Attribute\ViewsCache;
use Drupal\views\Plugin\views\cache\Tag;

/**
 * Tag-based caching that also varies by today's date.
 *
 * For displays filtered against today (the camps): what they list changes
 * at midnight without any entity changing, so the output varies by the
 * `kchockey_day` cache context as well as clearing with its tags.
 */
#[ViewsCache(
  id: 'kchockey_camp_day',
  title: new TranslatableMarkup('Tag based, renewed at midnight'),
  help: new TranslatableMarkup('Tag based caching that also starts afresh each day, for lists filtered against today.'),
)]
final class CampDay extends Tag {

  /**
   * {@inheritdoc}
   */
  public function summaryTitle() {
    return $this->t('Tag, daily');
  }

  /**
   * {@inheritdoc}
   */
  public function alterCacheMetadata(CacheableMetadata $cache_metadata) {
    $cache_metadata->addCacheContexts(['kchockey_day']);
  }

}
