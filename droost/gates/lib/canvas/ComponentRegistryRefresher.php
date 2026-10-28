<?php

declare(strict_types=1);

namespace DroostCms\Canvas;

use Drupal\Core\Plugin\DefaultPluginManager;
use Drupal\canvas\ComponentSource\ComponentSourceManager;

/**
 * The live refresher: the SDC plugin manager plus Canvas's source manager.
 *
 * `generateComponents()` is the call Canvas's own cache-rebuild hook makes
 * to materialise one Component config entity per discovered SDC, so a
 * component that `drush cr` would have made placeable becomes placeable here
 * without a server reconnect (round 25, R25-F1).
 */
final class ComponentRegistryRefresher implements ComponentRegistryRefresherInterface {

  /**
   * Constructs a ComponentRegistryRefresher.
   *
   * @param \Drupal\Core\Plugin\DefaultPluginManager $sdcManager
   *   The SDC plugin manager (Canvas's re-classed one on a bridged site).
   * @param \Drupal\canvas\ComponentSource\ComponentSourceManager $componentSources
   *   Canvas's component-source manager.
   */
  public function __construct(
    private readonly DefaultPluginManager $sdcManager,
    private readonly ComponentSourceManager $componentSources,
  ) {}

  /**
   * {@inheritdoc}
   */
  public function refresh(): void {
    $this->sdcManager->clearCachedDefinitions();
    $this->componentSources->generateComponents();
  }

}
