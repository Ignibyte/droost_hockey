/**
 * @file
 * The FAQ accordion keeps one question open: opening one closes the others.
 *
 * Its questions share a `name`, so the browser itself keeps one open, at the
 * moment it opens. A browser without named details gets the same from the
 * toggle event instead, which arrives a moment later.
 */
((Drupal, once) => {
  const named = 'name' in HTMLDetailsElement.prototype;
  let count = 0;

  Drupal.behaviors.kchockeyFaqAccordion = {
    attach(context) {
      once('kchockey-faq-accordion', '[data-faq-accordion]', context).forEach(
        (accordion) => {
          count += 1;
          const name = `kchockey-faq-${count}`;
          const own = () =>
            [...accordion.querySelectorAll('[data-faq-item]')].filter(
              (item) => item.closest('[data-faq-accordion]') === accordion,
            );

          if (named) {
            own().forEach((item) => {
              item.name = name;
            });
            return;
          }

          // A details element's toggle event does not bubble; listen while it
          // is captured on its way down.
          accordion.addEventListener(
            'toggle',
            (event) => {
              const opened = event.target;
              if (!opened.matches('[data-faq-item]') || !opened.open) {
                return;
              }
              own().forEach((item) => {
                if (item !== opened) {
                  item.open = false;
                }
              });
            },
            true,
          );
        },
      );
    },
  };
})(Drupal, once);
