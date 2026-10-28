<?php

declare(strict_types=1);

namespace Drupal\kchockey_site\Plugin\Block;

use Drupal\Core\Block\Attribute\Block;
use Drupal\Core\Block\BlockBase;
use Drupal\Core\Cache\CacheableMetadata;
use Drupal\Core\Config\ConfigFactoryInterface;
use Drupal\Core\Plugin\ContainerFactoryPluginInterface;
use Drupal\Core\StringTranslation\TranslatableMarkup;
use Drupal\kchockey_site\Form\SiteDetailsForm;
use Symfony\Component\DependencyInjection\ContainerInterface;

/**
 * The contact page's email and location, read from Site details.
 *
 * It has no settings of its own, so Canvas can place it; what it shows is
 * edited at Configuration › System › Site details.
 */
#[Block(
  id: 'kchockey_site_contact_info',
  admin_label: new TranslatableMarkup('Contact info'),
  category: new TranslatableMarkup('KC Hockey'),
)]
final class ContactInfoBlock extends BlockBase implements ContainerFactoryPluginInterface {

  /**
   * Constructs the block.
   *
   * @param array<string, mixed> $configuration
   *   The block's configuration.
   * @param string $plugin_id
   *   The plugin id.
   * @param mixed $plugin_definition
   *   The plugin definition.
   * @param \Drupal\Core\Config\ConfigFactoryInterface $configFactory
   *   Reads Site details.
   */
  public function __construct(
    array $configuration,
    $plugin_id,
    $plugin_definition,
    protected readonly ConfigFactoryInterface $configFactory,
  ) {
    parent::__construct($configuration, $plugin_id, $plugin_definition);
  }

  /**
   * Creates the block from the container.
   *
   * @param \Symfony\Component\DependencyInjection\ContainerInterface $container
   *   The service container.
   * @param array<string, mixed> $configuration
   *   The block's configuration.
   * @param string $plugin_id
   *   The plugin id.
   * @param mixed $plugin_definition
   *   The plugin definition.
   */
  public static function create(ContainerInterface $container, array $configuration, $plugin_id, $plugin_definition): self {
    return new self($configuration, $plugin_id, $plugin_definition, $container->get('config.factory'));
  }

  /**
   * {@inheritdoc}
   *
   * @return array<string, mixed>
   *   A render array.
   */
  public function build(): array {
    $details = $this->configFactory->get(SiteDetailsForm::CONFIG);
    $build = [
      '#type' => 'component',
      '#component' => 'kchockey:contact_info',
      '#props' => [
        'heading' => (string) $this->t('Contact Info'),
        'email' => trim((string) $details->get('email')),
        'area' => trim((string) $details->get('contact_area')),
        'note' => trim((string) $details->get('contact_note')),
      ],
    ];
    CacheableMetadata::createFromObject($details)->applyTo($build);
    return $build;
  }

}
