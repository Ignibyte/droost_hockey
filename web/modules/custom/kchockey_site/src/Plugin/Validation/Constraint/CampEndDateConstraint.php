<?php

declare(strict_types=1);

namespace Drupal\kchockey_site\Plugin\Validation\Constraint;

use Drupal\Core\StringTranslation\TranslatableMarkup;
use Drupal\Core\Validation\Attribute\Constraint;
use Symfony\Component\Validator\Constraint as SymfonyConstraint;

/**
 * A camp's end date is not before its start date.
 */
#[Constraint(
  id: 'KchockeyCampEndDate',
  label: new TranslatableMarkup('Camp end date', [], ['context' => 'Validation']),
)]
final class CampEndDateConstraint extends SymfonyConstraint {

  /**
   * The message when the end date is before the start date.
   */
  public string $message = 'The end date cannot be before the start date.';

}
