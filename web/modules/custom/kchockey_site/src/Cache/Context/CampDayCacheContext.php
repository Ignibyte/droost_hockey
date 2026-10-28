<?php

declare(strict_types=1);

namespace Drupal\kchockey_site\Cache\Context;

use Drupal\Core\Cache\CacheableMetadata;
use Drupal\Core\Cache\Context\CacheContextInterface;
use Drupal\Core\StringTranslation\TranslatableMarkup;
use Drupal\kchockey_site\CampCalendar;

/**
 * Varies by today's date: what lists the camps changes at midnight.
 *
 * Cache context ID: 'kchockey_day'.
 *
 * A max-age would not do: the render cache hands back a stored max-age
 * unchanged on a hit, so a nested one can outlast midnight by hours. A
 * context keyed by the date is exact at every level that honours contexts;
 * the internal page cache, which does not, is given an Expires header by
 * \Drupal\kchockey_site\EventSubscriber\CampDayExpirySubscriber.
 */
final class CampDayCacheContext implements CacheContextInterface {

  public function __construct(
    private readonly CampCalendar $calendar,
  ) {}

  /**
   * {@inheritdoc}
   */
  public static function getLabel(): TranslatableMarkup {
    return new TranslatableMarkup("Today's date (camps)");
  }

  /**
   * {@inheritdoc}
   */
  public function getContext(): string {
    return $this->calendar->today();
  }

  /**
   * {@inheritdoc}
   */
  public function getCacheableMetadata(): CacheableMetadata {
    return new CacheableMetadata();
  }

}
