<?php

declare(strict_types=1);

namespace Drupal\kchockey_site\Plugin\views\argument_default;

use Drupal\Core\Cache\CacheableDependencyInterface;
use Drupal\Core\Cache\Cache;
use Drupal\Core\StringTranslation\TranslatableMarkup;
use Drupal\views\Attribute\ViewsArgumentDefault;
use Drupal\views\Plugin\views\argument_default\ArgumentDefaultPluginBase;
use Drupal\views\Views;

/**
 * The camp the home page features, so another list can leave it out.
 *
 * Runs the camps View's `home_featured` display and answers its one row's
 * node ID: the next upcoming featured camp, or the next upcoming camp when
 * none is featured. "Upcoming Action" excludes it, so the home page never
 * shows a camp twice. With no camp at all, it answers "all" (no exclusion).
 */
#[ViewsArgumentDefault(
  id: 'kchockey_featured_camp',
  title: new TranslatableMarkup('The camp the home page features'),
)]
final class FeaturedCamp extends ArgumentDefaultPluginBase implements CacheableDependencyInterface {

  /**
   * {@inheritdoc}
   */
  public function getArgument() {
    $view = Views::getView('camps');
    if (!$view || !$view->setDisplay('home_featured')) {
      return 'all';
    }
    $view->execute();
    $row = $view->result[0] ?? NULL;
    $nid = $row?->_entity?->id();
    $view->destroy();
    return $nid === NULL ? 'all' : (string) $nid;
  }

  /**
   * {@inheritdoc}
   */
  public function getCacheMaxAge() {
    return Cache::PERMANENT;
  }

  /**
   * {@inheritdoc}
   */
  public function getCacheContexts() {
    return ['kchockey_day'];
  }

  /**
   * {@inheritdoc}
   */
  public function getCacheTags() {
    return ['node_list:event'];
  }

}
