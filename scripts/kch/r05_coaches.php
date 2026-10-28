<?php

/**
 * @file
 * Rung 5's content: the source's four coaches.
 *
 * Rung 5's content: the source's four coaches, published, in the source's
 * order (sort order 1–4). No photos: the cards show the initials until staff
 * add one.
 *
 * Idempotent: a coach is found by name and set to the values below, so a
 * second run changes nothing. Run it with
 *   ddev drush php:script scripts/kch/r05_coaches.php.
 */

declare(strict_types=1);

use Drupal\node\Entity\Node;

$coaches = [
  ['Coach Mike Donovan', 'Power skating specialist', '15 years coaching, former ECHL player', 75],
  ['Coach Sarah Tillman', 'Youth development & learn-to-skate', 'USAH certified Level 4', 60],
  ['Coach Jake Reardon', 'Goalie coach', 'Former D1 college goalie', 80],
  ['Coach Elena Voss', 'Figure skating & edge work', 'ISU certified, crossover training expert', 65],
];

$storage = \Drupal::entityTypeManager()->getStorage('node');
foreach ($coaches as $i => [$name, $specialty, $experience, $rate]) {
  $found = $storage->loadByProperties(['type' => 'coach', 'title' => $name]);
  $coach = reset($found) ?: Node::create(['type' => 'coach', 'title' => $name, 'uid' => 1]);
  $values = [
    'field_coach_specialty' => $specialty,
    'field_coach_experience' => $experience,
    'field_coach_rate' => $rate,
    'field_coach_weight' => $i + 1,
  ];
  $changed = $coach->isNew() || !$coach->isPublished();
  foreach ($values as $field => $value) {
    // Stored values come back as strings.
    if ((string) $coach->get($field)->value !== (string) $value) {
      $coach->set($field, $value);
      $changed = TRUE;
    }
  }
  if ($changed) {
    $coach->set('moderation_state', 'published');
    $coach->save();
  }
  echo $name, ': ', $changed ? 'written' : 'as it was', "\n";
}
