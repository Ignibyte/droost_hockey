<?php

declare(strict_types=1);

namespace Drupal\kchockey_site\Plugin\Field\FieldFormatter;

use Drupal\Core\Field\Attribute\FieldFormatter;
use Drupal\Core\Field\FieldDefinitionInterface;
use Drupal\Core\Field\FieldItemListInterface;
use Drupal\Core\Field\FormatterBase;
use Drupal\Core\Form\FormStateInterface;
use Drupal\Core\StringTranslation\TranslatableMarkup;

/**
 * A camp's dates as the design writes them: "Aug 10", "Aug 18–22".
 *
 * Formats a date-only start field together with the end date field named in
 * its settings: one day as "Aug 10", a range within a month as "Aug 18–22",
 * across months as "July 28–Aug 1". Months are the AP's (Sept, not Sep;
 * March to July in full), the range takes an en dash, and there is no year.
 * No core date format writes these.
 */
#[FieldFormatter(
  id: 'kchockey_camp_dates',
  label: new TranslatableMarkup('Camp dates (Aug 18–22)'),
  field_types: ['datetime'],
)]
final class CampDatesFormatter extends FormatterBase {

  /**
   * The AP's month abbreviations, by month number.
   */
  private const MONTHS = [
    1 => 'Jan',
    2 => 'Feb',
    3 => 'March',
    4 => 'April',
    5 => 'May',
    6 => 'June',
    7 => 'July',
    8 => 'Aug',
    9 => 'Sept',
    10 => 'Oct',
    11 => 'Nov',
    12 => 'Dec',
  ];

  /**
   * {@inheritdoc}
   */
  public static function defaultSettings() {
    return ['end_field' => 'field_camp_end_date'] + parent::defaultSettings();
  }

  /**
   * {@inheritdoc}
   */
  public static function isApplicable(FieldDefinitionInterface $field_definition) {
    return $field_definition->getFieldStorageDefinition()->getSetting('datetime_type') === 'date';
  }

  /**
   * {@inheritdoc}
   */
  public function settingsForm(array $form, FormStateInterface $form_state) {
    $form['end_field'] = [
      '#type' => 'textfield',
      '#title' => $this->t('End date field'),
      '#description' => $this->t('The machine name of the date-only field holding the last day. Empty on an entity, the dates are one day.'),
      '#default_value' => $this->getSetting('end_field'),
      '#required' => TRUE,
    ];
    return $form;
  }

  /**
   * {@inheritdoc}
   */
  public function settingsSummary() {
    return [$this->t('End date from @field', ['@field' => $this->getSetting('end_field')])];
  }

  /**
   * {@inheritdoc}
   */
  public function viewElements(FieldItemListInterface $items, $langcode) {
    $entity = $items->getEntity();
    $end_field = (string) $this->getSetting('end_field');
    $end = $entity->hasField($end_field) ? $entity->get($end_field)->value : NULL;

    $elements = [];
    foreach ($items as $delta => $item) {
      if ($item->value) {
        $elements[$delta] = ['#plain_text' => self::format((string) $item->value, $end ? (string) $end : NULL)];
      }
    }
    return $elements;
  }

  /**
   * Writes a start and an optional end date (Y-m-d) as the design does.
   */
  public static function format(string $start, ?string $end = NULL): string {
    [$start_year, $start_month, $start_day] = array_map('intval', explode('-', substr($start, 0, 10)));
    $first = self::MONTHS[$start_month] . ' ' . $start_day;
    if ($end === NULL || substr($end, 0, 10) <= substr($start, 0, 10)) {
      return $first;
    }

    [$end_year, $end_month, $end_day] = array_map('intval', explode('-', substr($end, 0, 10)));
    if ($end_year === $start_year && $end_month === $start_month) {
      return $first . '–' . $end_day;
    }
    return $first . '–' . self::MONTHS[$end_month] . ' ' . $end_day;
  }

}
