<?php

declare(strict_types=1);

namespace Drupal\kchockey_site\Plugin\Validation\Constraint;

use Drupal\Core\Field\FieldItemListInterface;
use Symfony\Component\Validator\Constraint;
use Symfony\Component\Validator\ConstraintValidator;

/**
 * Validates the KchockeyCampEndDate constraint.
 */
final class CampEndDateConstraintValidator extends ConstraintValidator {

  /**
   * {@inheritdoc}
   */
  public function validate(mixed $value, Constraint $constraint): void {
    if (!$value instanceof FieldItemListInterface || !$constraint instanceof CampEndDateConstraint) {
      return;
    }
    $end = $value->value;
    $entity = $value->getEntity();
    $start = $entity->hasField('field_event_date') ? $entity->get('field_event_date')->value : NULL;
    // Date-only values (Y-m-d) compare as strings.
    if ($end && $start && substr((string) $end, 0, 10) < substr((string) $start, 0, 10)) {
      $this->context->addViolation($constraint->message);
    }
  }

}
