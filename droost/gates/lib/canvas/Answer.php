<?php

declare(strict_types=1);

namespace DroostCms\Canvas;

/**
 * A verb's answer, thrown so it ends the verb wherever it is given.
 *
 * Its message is the JSON envelope cli.php prints. Drush owns the process's
 * exit code, so the verb's own code travels in the envelope instead.
 */
final class Answer extends \Exception {}
