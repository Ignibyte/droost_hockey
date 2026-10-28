# KC Hockey — staff handover

How the site's staff keep it current, and what is still to supply before it goes live.

Everything below is done signed in with the **Content editor** role. That role can change every
piece of content on the site; it cannot change the theme, install or remove modules, change
roles or permissions, or touch the site's configuration. Nobody needs to clear a cache: a saved
change shows to visitors on their next visit.

## Before go-live: what staff still supply

| What | Where it goes | Until it is set |
|---|---|---|
| **The phone number** (Q7) | Site details → Contact → Phone (`/admin/config/system/site-details`) | The footer shows no phone. |
| **Each rink's phone and website** (Q3) — all eight rinks: Pepsi Ice Midwest, Cable Dahmer Arena, Central Park Ice Arena, Twin Rinks Ice Pavilion, Olathe Ice Arena, Blade Runners Ice Complex, Summit Ice Arena, Swope Memorial Ice Rink | Content → the rink → Phone, Website | The rink's card on /rinks shows no call link and no "Visit Website". |
| **The social addresses** (Q8): Instagram, X / Twitter, Facebook | Site details → Social addresses | Each icon stays hidden in the footer until its address is entered. |
| **The legal pages** (Q8): Privacy Policy and Terms of Service | Content → the page → write it, then set it to Published | The footer's Privacy Policy and Terms of Service links stay hidden until each page is published. |
| **Production mail settings** (Q6) | Your host or developer, not the admin | See "The contact form's email" below. |

### The contact form's email (Q6)

Every message sent from /contact is stored on the site (see "Contact messages" below) and
emailed to **info@kchockey.com**, from the site's address (info@kchockey.com, the reply going
to the sender). The site sends mail with Symfony Mailer Lite's **native (sendmail)** transport,
which on most production hosts either goes nowhere or lands in spam. Before launch, the host
or developer must:

1. Give the production server a working way to send mail: an SMTP account or a mail service
   (Postmark, SES, Mailgun and the like) for the kchockey.com domain.
2. Add that transport in *Configuration → System → Symfony Mailer Lite → Transport* (`/admin/config/system/symfony-mailer-lite/transport`) and make it the
   default; keep its password in the server's settings, never in the repository.
3. Set up SPF and DKIM for kchockey.com so the messages are not marked as spam.
4. Send a test message from /contact and confirm it arrives at info@kchockey.com.

Until then, messages are still kept on the site, so none are lost.

## How to edit each thing

### Camps and clinics

*Content → Add content → Camp or clinic*, or edit one from *Content* (`/admin/content`).

- **Location** is one of the site's rinks; add the rink first if it is new.
- **Featured**: tick it to show the camp as the home page's featured camp (the soonest featured
  camp wins) and with the "Featured Event" badge on /camps.
- **Unpublish**: set *Change to* to *Unpublished* and save. The camp leaves /camps and the home page.
- A camp drops off by itself the day after its last date; there is nothing to do.
- Camps have no page of their own: "Details" and "Register" go to the listing and the contact
  form, as designed (Q5, Q9).

### Rinks

*Content → Add content → Rink*, or edit one from *Content*.

- **Sort order** decides the order on /rinks: lowest number first. The home page shows the
  first three.
- **Phone** and **Website** show on the rink's card once entered.
- A rink that still has camps cannot be deleted; move or remove its camps first.

### Coaches

*Content → Add content → Coach*, or edit one from *Content*.

- **Sort order** decides the order on /private-lessons: lowest number first.

### The eight pages' copy

*Content → Pages* (`/admin/content/pages`), then *Edit* opens the page in the Canvas editor:
/ (Home), /camps, /rinks, /private-lessons, /new-to-hockey, /youth-leagues, /adult-leagues,
/contact, and the page-not-found page. Click a section to change its words, buttons and
questions, then publish the changes.

The camp, rink and coach lists on those pages come from the content above, not from the page;
edit the records, not the page.

### Site details

*Configuration → System → Site details* (`/admin/config/system/site-details`): the footer blurb,
the two location lines, the contact email and phone, the contact page's area and note, and the
social addresses.

### Menus

*Structure → Menus* (`/admin/structure/menu`):

- **Main navigation** — the header's links.
- **Footer** — the footer's "Explore" links.
- **Legal** — Privacy Policy and Terms of Service.

Rename a link, change where it goes, drag to reorder, or add one.

### The legal pages

*Content*: Privacy Policy (`/privacy-policy`) and Terms of Service (`/terms-of-service`). Write
the text, set *Change to* to *Published* and save, and the footer link appears.

### Contact messages

*Structure → Webforms → Contact → Results* (`/admin/structure/webform/manage/contact/results/submissions`):
every message sent from /contact, newest first.

## For whoever deploys it

- Deploy with `drush deploy` (database updates, then `config:import`, then a cache rebuild).
  Content (camps, rinks, coaches, the pages) lives in the database, not in the repository: move
  the database, or run the content scripts in `scripts/kch/`, to seed a new environment.
- Cron must run. The site's own automated cron runs every three hours on a visitor's request;
  a real cron job (every hour, `drush cron`) is better. Cron regenerates the XML sitemap
  (`/sitemap.xml`), which lists the eight pages; camps, rinks and coaches are left out, since
  they have no pages of their own (Q9). The legal pages join it once published.
- Pages are sent with `Cache-Control: public, max-age=900`. With no CDN or proxy in front, a
  saved change shows at once. If a CDN or Varnish is put in front, either add a purge module so
  saves clear it, or lower *Configuration → Development → Performance → Browser and proxy cache
  maximum age*; otherwise visitors may see a page up to 15 minutes old.
- Production needs the mail transport above, and a real `trusted_host_patterns` and
  `hash_salt` in its own `settings.php`.
