<?php

/**
 * @file
 * Rung 1's content: page shells, menus, legal pages, photos and settings.
 *
 * Rung 1's content: the page shells, the frame's menus, the legal pages, the
 * design's two photos as media, and the site settings that are not exported
 * configuration of their own.
 *
 * Idempotent: run it again and it finds what it made. Run it with
 *   ddev drush php:script scripts/kch/r01_content.php
 * It prints one JSON object: the page ids by path and the media ids by name,
 * which scripts/kch/r01_trees.sh fills the Canvas trees with.
 */

declare(strict_types=1);

use Drupal\Core\File\FileExists;
use Drupal\Core\File\FileSystemInterface;
use Drupal\file\Entity\File;
use Drupal\media\Entity\Media;
use Drupal\menu_link_content\Entity\MenuLinkContent;
use Drupal\node\Entity\Node;
use Drupal\system\Entity\Menu;
use Drupal\user\Entity\Role;

$etm = \Drupal::entityTypeManager();
$root = dirname(DRUPAL_ROOT);

/* The site. */
\Drupal::configFactory()->getEditable('system.site')
  ->set('name', 'KC Hockey')
  ->set('mail', 'info@kchockey.com')
  ->set('page.404', '/page-not-found')
  ->save();

// The source's favicon, from the theme.
\Drupal::configFactory()->getEditable('kchockey.settings')
  ->set('favicon.use_default', FALSE)
  ->set('favicon.path', 'themes/custom/kchockey/favicon.svg')
  ->set('favicon.mimetype', 'image/svg+xml')
  ->save();

// The home page's title is the site's name, as the source's is.
\Drupal::configFactory()->getEditable('metatag.metatag_defaults.front')
  ->set('tags.title', '[site:name]')
  ->save();

/* The design's photos, as image media an editor can swap in Canvas. */
$photos = [
  'hero' => ['hero-hockey.jpg', 'Hockey players on the ice under arena lights'],
  'camps' => ['camps-drills.jpg', 'Young players skating drills between cones'],
];
$media_ids = [];
$file_system = \Drupal::service('file_system');
$directory = 'public://kch';
$file_system->prepareDirectory($directory, FileSystemInterface::CREATE_DIRECTORY | FileSystemInterface::MODIFY_PERMISSIONS);
foreach ($photos as $key => [$filename, $alt]) {
  $uri = "$directory/$filename";
  $existing = $etm->getStorage('file')->loadByProperties(['uri' => $uri]);
  $file = reset($existing);
  if (!$file) {
    $file_system->copy("$root/design/KC-Hockey-Hub/attached_assets/generated_images/$filename", $uri, FileExists::Replace);
    $file = File::create(['uri' => $uri, 'status' => 1]);
    $file->save();
  }
  $media = $etm->getStorage('media')->loadByProperties([
    'bundle' => 'image',
    'field_media_image.target_id' => $file->id(),
  ]);
  $media = reset($media);
  if (!$media) {
    $media = Media::create([
      'bundle' => 'image',
      'name' => $filename,
      'field_media_image' => ['target_id' => $file->id(), 'alt' => $alt],
      'status' => 1,
    ]);
    $media->save();
  }
  $media_ids[$key] = (int) $media->id();
}

/* The Canvas pages: the existing Home page, and one per source address. */
$pages = [
  '/home' => [
    'Home',
    "Built by rink rats, for rink rats. Find your next camp, private lesson, or drop-in skate anywhere in the metro.",
  ],
  '/camps' => [
    'Camps & Clinics',
    'From learn-to-skate to elite power skating. Find the right development program to elevate your game this season.',
  ],
  '/rinks' => [
    'KC Rink Directory',
    'Every sheet of ice in the Kansas City metro area. Find locations, amenities, and contact info.',
  ],
  '/private-lessons' => [
    'Private Lessons',
    "1-on-1 and small group development. Work with Kansas City's top hockey and skating professionals to target specific areas of your game.",
  ],
  '/new-to-hockey' => [
    'New to Hockey',
    'Every hockey player starts somewhere. Here is the no-jargon guide to finding the right rink, gear, and first skate in Kansas City.',
  ],
  '/youth-leagues' => [
    'Youth Leagues',
    'Find the right place for your young player to learn, compete, make friends, and fall in love with the game across Kansas City.',
  ],
  '/adult-leagues' => [
    'Adult Leagues',
    'Find your next league, join a team, or lace up as a free agent. Kansas City adult hockey is fast, social, and ready for your next shift.',
  ],
  '/contact' => [
    'Contact',
    'Got a question about a camp? Want to list your clinic? Just want to talk hockey? Drop us a line.',
  ],
  '/page-not-found' => ['Page Not Found', 'The page you were looking for is not here.'],
];
$page_storage = $etm->getStorage('canvas_page');
$alias_storage = $etm->getStorage('path_alias');
$page_ids = [];
foreach ($pages as $path => [$title, $description]) {
  $page = NULL;
  foreach ($alias_storage->loadByProperties(['alias' => $path]) as $alias) {
    if (preg_match('#^/page/(\d+)$#', $alias->getPath(), $m)) {
      $page = $page_storage->load($m[1]);
    }
  }
  if (!$page) {
    $page = $page_storage->create(['title' => $title, 'status' => TRUE, 'path' => ['alias' => $path]]);
  }
  $page->set('title', $title);
  $page->set('description', $description);
  $page->setPublished();
  $page->save();
  $page_ids[$path] = (int) $page->id();
}

/* The legal pages: the existing Privacy Policy, and Terms of Service. Both
 * stay unpublished until staff write and publish them. */
$terms = $etm->getStorage('node')->loadByProperties(['type' => 'page', 'title' => 'Terms of Service']);
$terms = reset($terms);
if (!$terms) {
  $terms = Node::create([
    'type' => 'page',
    'title' => 'Terms of Service',
    'status' => 0,
    'moderation_state' => 'draft',
    'path' => ['alias' => '/terms-of-service', 'pathauto' => 0],
  ]);
  $terms->save();
}
$privacy = Node::load(1);
if ($privacy && $privacy->label() !== 'Privacy Policy') {
  $privacy->setTitle('Privacy Policy');
  $privacy->save();
}

/* The menus. */
if (!Menu::load('legal')) {
  Menu::create([
    'id' => 'legal',
    'label' => 'Legal',
    'description' => "The links on the footer's bottom line. A link to an unpublished page shows only once the page is published.",
  ])->save();
}

$link_storage = $etm->getStorage('menu_link_content');
$put_link = function (string $menu, string $title, string $uri, int $weight, bool $enabled = TRUE, ?string $uuid = NULL) use ($link_storage): void {
  $link = NULL;
  if ($uuid) {
    $found = $link_storage->loadByProperties(['uuid' => $uuid]);
    $link = reset($found) ?: NULL;
  }
  if (!$link) {
    $found = $link_storage->loadByProperties(['menu_name' => $menu, 'link.uri' => $uri]);
    $link = reset($found) ?: NULL;
  }
  $link ??= MenuLinkContent::create(['menu_name' => $menu]);
  $link->set('menu_name', $menu);
  $link->set('title', $title);
  $link->set('link', ['uri' => $uri]);
  $link->set('weight', $weight);
  $link->set('enabled', $enabled);
  $link->set('expanded', FALSE);
  $link->save();
};

// The header: the existing Home link now goes to the front page itself.
$put_link('main', 'Home', 'internal:/', 0, TRUE, '51295fed-6dc9-4d68-8ed5-ace33045861b');
$main = [
  '/camps' => 'Camps & Clinics',
  '/private-lessons' => 'Private Lessons',
  '/rinks' => 'KC Rinks',
  '/new-to-hockey' => 'New to Hockey',
  '/youth-leagues' => 'Youth Leagues',
  '/adult-leagues' => 'Adult Leagues',
];
$weight = 1;
foreach ($main as $path => $title) {
  $put_link('main', $title, 'entity:canvas_page/' . $page_ids[$path], $weight++);
}

// The footer's Explore links: their own labels ("KC Rink Directory").
$explore = [
  '/camps' => 'Camps & Clinics',
  '/private-lessons' => 'Private Lessons',
  '/rinks' => 'KC Rink Directory',
  '/new-to-hockey' => 'New to Hockey',
  '/youth-leagues' => 'Youth Leagues',
  '/adult-leagues' => 'Adult Leagues',
];
$weight = 0;
foreach ($explore as $path => $title) {
  $put_link('footer', $title, 'entity:canvas_page/' . $page_ids[$path], $weight++);
}

// The legal line. Drupal CMS's "Privacy policy" and its disabled "My privacy
// settings" links move here from the footer menu, keeping their uuids: the
// ECA model privacy_setting_link finds the latter by its uuid.
$put_link('legal', 'Privacy Policy', 'entity:node/1', 0, TRUE, 'd393a906-1f82-46f3-8c2e-3e1322a717a9');
$put_link('legal', 'Terms of Service', 'entity:node/' . $terms->id(), 1);
$put_link('legal', 'My privacy settings', 'internal:#', 2, FALSE, 'd7f4f1b2-af94-46b8-ac63-a8a5b14fb0f5');

/* Staff editors change Site details (Q1). */
$editor = Role::load('content_editor');
if ($editor && !$editor->hasPermission('edit site details')) {
  $editor->grantPermission('edit site details')->save();
}

print json_encode(['pages' => $page_ids, 'media' => $media_ids, 'terms' => (int) $terms->id()], JSON_PRETTY_PRINT) . "\n";
