<?php

declare(strict_types=1);

namespace Drupal\kchockey_site\EventSubscriber;

use Drupal\Core\Cache\CacheableResponseInterface;
use Drupal\kchockey_site\CampCalendar;
use Symfony\Component\EventDispatcher\EventSubscriberInterface;
use Symfony\Component\HttpKernel\Event\ResponseEvent;
use Symfony\Component\HttpKernel\KernelEvents;

/**
 * Expires a page that lists camps at the next midnight.
 *
 * The internal page cache keeps a page until its cache tags are cleared and
 * ignores cache contexts and max-age; it does honour the Expires header. A
 * page whose cacheability carries the `kchockey_day` context (the camp
 * lists) is given an Expires header at the next midnight, so the next
 * visitor after it gets the new day's lists, and its Cache-Control max-age
 * is cut so a browser or proxy does not keep it past then either.
 */
final class CampDayExpirySubscriber implements EventSubscriberInterface {

  public function __construct(
    private readonly CampCalendar $calendar,
  ) {}

  /**
   * {@inheritdoc}
   */
  public static function getSubscribedEvents(): array {
    // After core's FinishResponseSubscriber (0) has set the cache headers,
    // and before the page cache middleware stores the response.
    return [KernelEvents::RESPONSE => ['expire', -10]];
  }

  /**
   * Sets Expires (and caps max-age) on a page that lists camps.
   */
  public function expire(ResponseEvent $event): void {
    $response = $event->getResponse();
    if (!$event->isMainRequest() || !$response instanceof CacheableResponseInterface) {
      return;
    }
    if (!in_array('kchockey_day', $response->getCacheableMetadata()->getCacheContexts(), TRUE)) {
      return;
    }

    $response->setExpires($this->calendar->nextMidnight());
    $max_age = $response->getMaxAge();
    $left = $this->calendar->secondsUntilMidnight();
    if ($response->headers->hasCacheControlDirective('public') && ($max_age === NULL || $max_age > $left)) {
      $response->setMaxAge($left);
    }
  }

}
