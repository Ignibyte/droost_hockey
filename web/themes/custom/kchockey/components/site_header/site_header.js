/**
 * @file
 * The header's narrow-width menu: the toggle opens and closes the panel.
 */
((Drupal, once) => {
  Drupal.behaviors.kchockeySiteHeader = {
    attach(context) {
      once('kchockey-site-header', '[data-site-header]', context).forEach(
        (header) => {
          const toggle = header.querySelector('[data-site-header-toggle]');
          const panel = header.querySelector('[data-site-header-panel]');
          if (!toggle || !panel) {
            return;
          }

          const setOpen = (open) => {
            panel.hidden = !open;
            toggle.setAttribute('aria-expanded', open ? 'true' : 'false');
            toggle
              .querySelector('[data-icon-open]')
              .classList.toggle('hidden', open);
            toggle
              .querySelector('[data-icon-close]')
              .classList.toggle('hidden', !open);
            toggle
              .querySelector('[data-label-open]')
              .classList.toggle('hidden', open);
            toggle
              .querySelector('[data-label-close]')
              .classList.toggle('hidden', !open);
          };

          toggle.addEventListener('click', () => setOpen(panel.hidden));
          // A link in the panel takes the visitor away; close behind it.
          panel.addEventListener('click', (event) => {
            if (event.target.closest('a')) {
              setOpen(false);
            }
          });
          header.addEventListener('keydown', (event) => {
            if (event.key === 'Escape' && !panel.hidden) {
              setOpen(false);
              toggle.focus();
            }
          });
        },
      );
    },
  };
})(Drupal, once);
