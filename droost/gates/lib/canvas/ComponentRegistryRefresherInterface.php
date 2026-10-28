<?php

declare(strict_types=1);

namespace DroostCms\Canvas;

/**
 * Brings the component registry up to date with what is on disk.
 *
 * A process outlives what it read: an SDC authored after it booted is
 * invisible to its cached SDC definitions and to Canvas's Component entity
 * list until something refreshes them. The tree writer asks for exactly one
 * refresh before refusing an unknown component id (R25-F1). An interface
 * because Canvas's own manager is final and the unit fixtures need a stand-in.
 */
interface ComponentRegistryRefresherInterface {

  /**
   * Clears the SDC definitions and (re)generates Canvas Component entities.
   */
  public function refresh(): void;

}
