<?php

/**
 * @file
 * Rung 4's content: the three programs and the six camps.
 *
 * Rung 4's content: the three programs and the source's six camps, dated
 * 2027 (Q4), each at its rink, published. The featured camp's photo is the
 * zip's skate photo: the source hotlinks an Unsplash photo of a basketball,
 * so the client's own power-skating shot stands in (staff can replace it).
 *
 * Idempotent: a term or camp is found by its name and set to the values
 * below, so a second run changes nothing. Run it with
 *   ddev drush php:script scripts/kch/r04_camps.php.
 */

declare(strict_types=1);

use Drupal\Core\File\FileExists;
use Drupal\Core\File\FileSystemInterface;
use Drupal\file\Entity\File;
use Drupal\node\Entity\Node;
use Drupal\taxonomy\Entity\Term;

$etm = \Drupal::entityTypeManager();
$root = dirname(DRUPAL_ROOT);

/* The programs: the /camps filter, in its order. */
$programs = [];
foreach (['Youth Hockey', 'Adult/Coaches', 'Goalies'] as $weight => $name) {
  $found = $etm->getStorage('taxonomy_term')->loadByProperties(['vid' => 'program', 'name' => $name]);
  $term = reset($found) ?: Term::create(['vid' => 'program', 'name' => $name]);
  if ($term->isNew() || (int) $term->getWeight() !== $weight) {
    $term->setWeight($weight)->save();
  }
  $programs[$name] = (int) $term->id();
}

/* The featured camp's photo. */
$file_system = \Drupal::service('file_system');
$directory = 'public://kch';
$file_system->prepareDirectory($directory, FileSystemInterface::CREATE_DIRECTORY | FileSystemInterface::MODIFY_PERMISSIONS);
$uri = "$directory/about-skates.jpg";
$existing = $etm->getStorage('file')->loadByProperties(['uri' => $uri]);
$photo = reset($existing);
if (!$photo) {
  $file_system->copy("$root/design/KC-Hockey-Hub/attached_assets/generated_images/about-skates.jpg", $uri, FileExists::Replace);
  $photo = File::create(['uri' => $uri, 'status' => 1]);
  $photo->save();
}

/* The rinks, by name. */
$rinks = [];
foreach ($etm->getStorage('node')->loadByProperties(['type' => 'rink']) as $rink) {
  $rinks[$rink->label()] = (int) $rink->id();
}

$summary = 'Join the biggest power skating development camp in the Midwest. Limited spots available for the upcoming session.';
$camps = [
  // Title, start, end, rink, ages, level, price, featured, programs.
  [
    'Summer Power Skating Camp',
    '2027-07-28',
    '2027-08-01',
    'Pepsi Ice Midwest',
    '8–14',
    'All Skill Levels',
    275,
    TRUE,
    ['Youth Hockey'],
  ],
  [
    'Goalie Clinic',
    '2027-08-10',
    NULL,
    'Central Park Ice Arena',
    '10–18',
    'Intermediate/Advanced',
    95,
    FALSE,
    ['Youth Hockey', 'Goalies'],
  ],
  [
    'Back-to-School Skills Camp',
    '2027-08-18',
    '2027-08-22',
    'Cable Dahmer Arena',
    '6–16',
    'Beginner/Intermediate',
    250,
    FALSE,
    ['Youth Hockey'],
  ],
  [
    'Fall Puck Development Clinic',
    '2027-09-06',
    NULL,
    'Pepsi Ice Midwest',
    '12–18',
    'Advanced',
    85,
    FALSE,
    ['Youth Hockey'],
  ],
  [
    'Adult Hockey League Showcase',
    '2027-09-14',
    NULL,
    'Twin Rinks Ice Pavilion',
    '18+',
    'All Levels',
    0,
    FALSE,
    ['Adult/Coaches'],
  ],
  [
    'USAH Level 1 Coaching Clinic',
    '2027-10-04',
    '2027-10-05',
    'Olathe Ice Arena',
    'Adults',
    'Coaches',
    150,
    FALSE,
    ['Adult/Coaches'],
  ],
];

$storage = $etm->getStorage('node');
foreach ($camps as [$title, $start, $end, $rink, $ages, $level, $price, $featured, $camp_programs]) {
  if (!isset($rinks[$rink])) {
    throw new \RuntimeException("No rink named $rink: run scripts/kch/r03_rinks.sh first.");
  }
  $found = $storage->loadByProperties(['type' => 'event', 'title' => $title]);
  $camp = reset($found) ?: Node::create(['type' => 'event', 'title' => $title, 'uid' => 1]);
  $values = [
    'field_event_date' => $start,
    'field_camp_end_date' => $end,
    'field_camp_rink' => $rinks[$rink],
    'field_camp_ages' => $ages,
    'field_camp_level' => $level,
    'field_camp_price' => $price,
    'field_camp_featured' => (int) $featured,
    'field_camp_summary' => $featured ? $summary : NULL,
    'field_camp_programs' => array_map(fn ($name) => $programs[$name], $camp_programs),
  ];
  $changed = $camp->isNew() || !$camp->isPublished();
  foreach ($values as $field => $value) {
    $item = $camp->get($field);
    $column = $item->getFieldDefinition()->getFieldStorageDefinition()->getMainPropertyName();
    // Stored values come back as strings.
    $current = array_map('strval', array_column($item->getValue(), $column));
    if ($current !== array_map('strval', $value === NULL ? [] : (array) $value)) {
      $camp->set($field, $value);
      $changed = TRUE;
    }
  }
  if ($featured && (int) $camp->get('field_event_image')->target_id !== (int) $photo->id()) {
    $camp->set('field_event_image', ['target_id' => $photo->id(), 'alt' => 'A hockey skate cutting into the ice']);
    $changed = TRUE;
  }
  if ($changed) {
    $camp->set('moderation_state', 'published');
    $camp->save();
  }
  echo $title, ': ', $changed ? 'written' : 'as it was', "\n";
}
