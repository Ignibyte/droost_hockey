<?php

declare(strict_types=1);

namespace Drupal\kchockey_site\EventSubscriber;

use Drupal\Core\Routing\LocalRedirectResponse;
use Drupal\Core\Routing\RouteMatchInterface;
use Drupal\Core\Url;
use Drupal\node\NodeInterface;
use Drupal\node\NodeTypeInterface;
use Symfony\Component\EventDispatcher\EventSubscriberInterface;
use Symfony\Component\HttpKernel\Event\RequestEvent;
use Symfony\Component\HttpKernel\KernelEvents;

/**
 * Forwards a record's own page to its listing.
 *
 * Rinks, camps and coaches have no page of their own (the design's links go
 * to the listings): a content type that names a listing in its
 * `kchockey_site.listing` third-party setting has its nodes' canonical
 * address answered with a 301 to that listing. Editing and revisions keep
 * their own routes.
 */
final class RecordForwardSubscriber implements EventSubscriberInterface {

  public function __construct(
    private readonly RouteMatchInterface $routeMatch,
  ) {}

  /**
   * {@inheritdoc}
   */
  public static function getSubscribedEvents(): array {
    // After the router (32) has matched the route and checked access, and
    // before the redirect module's route normalizer (30) would first send
    // /node/N to the node's alias.
    return [KernelEvents::REQUEST => ['forward', 31]];
  }

  /**
   * Answers a record's canonical page with a redirect to its listing.
   */
  public function forward(RequestEvent $event): void {
    if (!$event->isMainRequest() || $this->routeMatch->getRouteName() !== 'entity.node.canonical') {
      return;
    }
    $node = $this->routeMatch->getParameter('node');
    if (!$node instanceof NodeInterface) {
      return;
    }
    $type = $node->get('type')->entity;
    if (!$type instanceof NodeTypeInterface) {
      return;
    }
    $listing = $type->getThirdPartySetting('kchockey_site', 'listing');
    if (!is_string($listing) || $listing === '') {
      return;
    }

    $url = Url::fromUserInput($listing)->toString(TRUE);
    $response = new LocalRedirectResponse($url->getGeneratedUrl(), 301);
    $response->addCacheableDependency($url);
    $response->addCacheableDependency($node);
    $response->addCacheableDependency($type);
    $event->setResponse($response);
  }

}
