<?php

declare(strict_types=1);

namespace Drupal\kchockey_site;

use Drupal\Component\Datetime\TimeInterface;

/**
 * The day the camps are listed for.
 *
 * A camp leaves the lists the day after its last day, with nobody acting:
 * whatever shows camps varies by today's date (the `kchockey_day` cache
 * context) and expires at the next midnight. Both are worked out in the
 * current user's timezone, the same one core's datetime Views filter
 * compares date-only fields in (the site's, America/Chicago, for visitors).
 */
final class CampCalendar {

  public function __construct(
    private readonly TimeInterface $time,
  ) {}

  /**
   * Today's date, as Y-m-d.
   */
  public function today(): string {
    return $this->now()->format('Y-m-d');
  }

  /**
   * The next midnight, when today's lists stop being true.
   */
  public function nextMidnight(): \DateTimeImmutable {
    return $this->now()->modify('tomorrow');
  }

  /**
   * Seconds from now until the next midnight.
   */
  public function secondsUntilMidnight(): int {
    return max(1, $this->nextMidnight()->getTimestamp() - $this->time->getCurrentTime());
  }

  /**
   * The current time in the current user's timezone.
   */
  private function now(): \DateTimeImmutable {
    return (new \DateTimeImmutable('@' . $this->time->getCurrentTime()))
      ->setTimezone(new \DateTimeZone(date_default_timezone_get()));
  }

}
