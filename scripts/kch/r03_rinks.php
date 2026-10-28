<?php

/**
 * @file
 * Rung 3's content: the source's eight rinks.
 *
 * Rung 3's content: the source's eight rinks, published, in the source's
 * order (sort order 1–8). Phones and websites stay empty: the source's are
 * placeholders, and staff enter the real ones (Q3).
 *
 * Idempotent: a rink is found by its name and set to the values below, so a
 * second run changes nothing. Run it with
 *   ddev drush php:script scripts/kch/r03_rinks.php.
 */

declare(strict_types=1);

use Drupal\node\Entity\Node;

$rinks = [
  [
    'Pepsi Ice Midwest',
    'Overland Park',
    'KS',
    'A premier facility offering a full NHL sheet, dedicated pro shop, and extensive programming for all ages.',
    ['NHL Sheet', 'Pro Shop', 'Lessons', 'Leagues'],
  ],
  [
    'Cable Dahmer Arena',
    'Independence',
    'MO',
    "Home of the ECHL's Kansas City Mavericks. A professional venue with excellent ice quality and seating.",
    ['Professional Venue', 'Event Seating', 'Concessions', 'Team Store'],
  ],
  [
    'Central Park Ice Arena',
    'Kansas City',
    'MO',
    "The heart of KC's recreational skating. Great for families, beginners, and casual drop-in hockey.",
    ['Public Skate', 'Learn-to-Skate', 'Youth Leagues', 'Snack Bar'],
  ],
  [
    'Twin Rinks Ice Pavilion',
    'Liberty',
    'MO',
    "A massive dual-sheet facility hosting the region's largest tournaments and figure skating competitions.",
    ['Two Sheets', 'Tournaments', 'Figure Skating', 'Meeting Rooms'],
  ],
  [
    'Olathe Ice Arena',
    'Olathe',
    'KS',
    'A tight-knit community rink focused on youth development and consistent stick-and-puck sessions.',
    ['Community Rink', 'Youth Leagues', 'Stick-and-Puck', 'Party Rooms'],
  ],
  [
    'Blade Runners Ice Complex',
    'Blue Springs',
    'MO',
    'State-of-the-art training center with two sheets of ice, dedicated off-ice facilities, and competitive leagues.',
    ['Two Sheets', 'Leagues', 'Camps', 'Dryland Training'],
  ],
  [
    'Summit Ice Arena',
    "Lee's Summit",
    'MO',
    'Family-friendly environment perfect for birthday parties, introductory classes, and local youth hockey.',
    ['Public Skate', 'Youth Hockey', 'Birthday Parties', 'Cafe'],
  ],
  [
    'Swope Memorial Ice Rink',
    'Kansas City',
    'MO',
    'A historic, seasonal outdoor rink offering a classic winter skating experience right in the city.',
    ['Historic Venue', 'Outdoor Skating', 'Seasonal Events', 'Skate Rentals'],
  ],
];

$storage = \Drupal::entityTypeManager()->getStorage('node');
foreach ($rinks as $i => [$name, $city, $state, $description, $amenities]) {
  $found = $storage->loadByProperties(['type' => 'rink', 'title' => $name]);
  $rink = reset($found) ?: Node::create(['type' => 'rink', 'title' => $name, 'uid' => 1]);
  $values = [
    'field_rink_city' => $city,
    'field_rink_state' => $state,
    'field_rink_description' => $description,
    'field_rink_amenities' => $amenities,
    'field_rink_weight' => $i + 1,
  ];
  $changed = $rink->isNew() || !$rink->isPublished();
  foreach ($values as $field => $value) {
    // Stored values come back as strings.
    $current = array_map('strval', array_column($rink->get($field)->getValue(), 'value'));
    if ($current !== array_map('strval', (array) $value)) {
      $rink->set($field, $value);
      $changed = TRUE;
    }
  }
  if ($changed) {
    $rink->set('moderation_state', 'published');
    $rink->save();
  }
  echo $name, ': ', $changed ? 'written' : 'as it was', "\n";
}
