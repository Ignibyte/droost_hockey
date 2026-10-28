<?php

declare(strict_types=1);

namespace Drupal\kchockey_site\Plugin\Block;

use Drupal\Core\Block\Attribute\Block;
use Drupal\Core\Block\BlockBase;
use Drupal\Core\Entity\EntityTypeManagerInterface;
use Drupal\Core\Plugin\ContainerFactoryPluginInterface;
use Drupal\Core\StringTranslation\TranslatableMarkup;
use Drupal\Core\Url;
use Drupal\taxonomy\TermInterface;
use Symfony\Component\DependencyInjection\ContainerInterface;
use Symfony\Component\HttpFoundation\RequestStack;

/**
 * The "Filter By:" bar over the camps: "All Events", then each program.
 *
 * Each link opens the current page with the program's term ID in the
 * `program` query parameter (`?program=12`), which the camps View's listing
 * reads in its contextual filter; "All Events" opens it with none. The
 * current choice is highlighted. Rendered as the theme's camp_filter
 * component, with a filter_link per choice.
 *
 * It has no settings of its own, so Canvas can place it; the choices are the
 * Program vocabulary's terms, edited at Structure › Taxonomy.
 */
#[Block(
  id: 'kchockey_site_camp_filter',
  admin_label: new TranslatableMarkup('Camp filter'),
  category: new TranslatableMarkup('KC Hockey'),
)]
final class CampFilterBlock extends BlockBase implements ContainerFactoryPluginInterface {

  /**
   * The vocabulary whose terms are the choices.
   */
  private const VOCABULARY = 'program';

  /**
   * The query parameter the camps View's listing reads.
   */
  private const PARAMETER = 'program';

  /**
   * Constructs the block.
   *
   * @param array<string, mixed> $configuration
   *   The block's configuration.
   * @param string $plugin_id
   *   The plugin id.
   * @param mixed $plugin_definition
   *   The plugin definition.
   * @param \Drupal\Core\Entity\EntityTypeManagerInterface $entityTypeManager
   *   Loads the programs.
   * @param \Symfony\Component\HttpFoundation\RequestStack $requestStack
   *   Gives the current choice.
   */
  public function __construct(
    array $configuration,
    $plugin_id,
    $plugin_definition,
    protected readonly EntityTypeManagerInterface $entityTypeManager,
    protected readonly RequestStack $requestStack,
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
    return new self($configuration, $plugin_id, $plugin_definition, $container->get('entity_type.manager'), $container->get('request_stack'));
  }

  /**
   * {@inheritdoc}
   *
   * @return array<string, mixed>
   *   A render array.
   */
  public function build(): array {
    $current = (string) $this->requestStack->getCurrentRequest()?->query->get(self::PARAMETER, '');

    $choices = [$this->choice((string) $this->t('All Events'), Url::fromRoute('<current>'), $current === '')];
    $terms = $this->entityTypeManager->getStorage('taxonomy_term')->loadTree(self::VOCABULARY, 0, 1, TRUE);
    foreach ($terms as $term) {
      if (!$term instanceof TermInterface || !$term->isPublished()) {
        continue;
      }
      $url = Url::fromRoute('<current>', [], ['query' => [self::PARAMETER => $term->id()]]);
      $choices[] = $this->choice((string) $term->label(), $url, $current === (string) $term->id());
    }

    return [
      '#type' => 'component',
      '#component' => 'kchockey:camp_filter',
      '#props' => [
        'label' => (string) $this->t('Filter By:'),
      ],
      '#slots' => [
        'choices' => $choices,
      ],
    ];
  }

  /**
   * {@inheritdoc}
   */
  public function getCacheContexts() {
    return array_merge(parent::getCacheContexts(), ['url.path', 'url.query_args:' . self::PARAMETER]);
  }

  /**
   * {@inheritdoc}
   */
  public function getCacheTags() {
    return array_merge(parent::getCacheTags(), ['taxonomy_term_list:' . self::VOCABULARY]);
  }

  /**
   * One choice of the bar, as a filter_link component.
   *
   * @return array<string, mixed>
   *   A render array.
   */
  private function choice(string $label, Url $url, bool $active): array {
    return [
      '#type' => 'component',
      '#component' => 'kchockey:filter_link',
      '#props' => [
        'label' => $label,
        'url' => $url->toString(),
        'active' => $active,
      ],
    ];
  }

}
