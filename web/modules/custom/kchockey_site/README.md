# KC Hockey site details

The site's own small pieces that are not a theme's.

## Site details

One configuration object, `kchockey_site.settings`, edited at Configuration ›
System › Site details (`/admin/config/system/site-details`, permission "Edit
site details", granted to Content editor): the footer's blurb, email, phone,
location lines and social addresses, and the contact page's location and
note. The footer (the `kchockey` theme) and the Contact info block read it,
with its cache tag, so a change shows on the next page view.

## The contact page's pieces

- **Contact info** block (`kchockey_site_contact_info`): the email (a mail
  link) and the location from Site details, rendered as the theme's
  `contact_info` component. It has no settings, so Canvas can place it.
- **The contact form's look** (`Hook\ContactFormHooks`, on the `contact`
  webform): the Subject select offers no empty "- Select -" choice (a
  subject is always chosen), and Webform's inline confirmation is drawn as
  the theme's `form_sent` component, with the title, message and back label
  staff set in the webform's confirmation settings.

The form itself is the `contact` webform (Structure › Webforms): Name, Email,
Subject (preset by `/contact?subject=…`) and Message; each submission is kept
and emailed to info@kchockey.com, replying to the visitor; Honeypot's hidden
field and 5-second time limit turn bots away. Content editors may list its
submissions. `scripts/kch/r02_contact.php` is how it was configured.

Because of the time limit, /contact is never served from the page cache: each
visit needs a fresh timestamp in the form.

## Record pages forward to their listings

Rinks, camps and coaches have no page of their own:
the design's links go to the listings. A content type names its listing in a
third-party setting, `kchockey_site.listing` (for rinks, `/rinks`, in
`node.type.rink`), and `EventSubscriber\RecordForwardSubscriber` answers that
type's node pages (`/node/N` and its alias, such as `/rinks/pepsi-ice-midwest`)
with a 301 to the listing, in one hop. Camps (`node.type.event`) forward to
`/camps`, coaches (`node.type.coach`) to `/private-lessons`. The redirect carries the node's and
the type's cache tags, so it is page-cached and cleared with them. Editing,
revisions and every other node route are untouched; saving a rink lands the
editor on /rinks.

To give a type the same behaviour:

```bash
ddev drush php:eval '$t = \Drupal\node\Entity\NodeType::load("event"); $t->setThirdPartySetting("kchockey_site", "listing", "/camps"); $t->save();'
ddev drush config:export -y
```

Remove the setting and the type's pages show again.

## Camps

Camps and clinics are the `event` content type ("Camp or clinic"): start and
end dates (date only; a one-day clinic leaves the end empty), the rink it is
held at (required, chosen from the rinks), ages, skill level, price (whole
dollars, 0 is free), featured, summary, photo and programs (the Program
vocabulary: Youth Hockey, Adult/Coaches, Goalies). This module adds:

- **Camp dates** formatter (`kchockey_camp_dates`, on the start date, reading
  the end date field named in its settings): "Aug 10", "Aug 18–22",
  "July 28–Aug 1", with the AP's months (Sept, not Sep) and no year.
- **End date after start date**: the `KchockeyCampEndDate` constraint on the
  end date refuses a camp that ends before it starts.
- **The rink delete guard** (`Hook\CampHooks`): a rink a camp is held at
  cannot be deleted. Node access refuses the operation (so neither the
  admin's bulk delete nor the API can do it either), the rink's edit form
  names the camps instead of offering Delete, and the delete form refuses
  the same for users who bypass node access. Every camp revision counts,
  drafts included; a camp in the Trash does not.
- **Camp filter** block (`kchockey_site_camp_filter`, no settings, so Canvas
  places it on /camps): "Filter By:", "All Events", then a link per Program
  term writing `?program=<term ID>`, which the camps View's listing reads in
  its contextual filter. (Not a View header: Views wraps its header in an HTML
  `<header>`, which reads as a second page header.)
- **The camps View's pieces** (Structure › Views › Camps): the "No camps
  found" panel (`kchockey_camp_empty`), and the default argument
  `kchockey_featured_camp`, the camp the home page features, so "Upcoming
  Action" leaves it out.

### A camp leaves the lists at midnight

The View lists camps whose end date (or start date, for a one-day clinic) is
today or later, in the site's timezone. Nothing has to change for a camp to
drop off, so caching is keyed by the day:

- the `kchockey_camp_day` Views cache plugin (tag-based) adds the
  `kchockey_day` cache context (today's date), so the View's output, and every
  page that shows it, is cached per day by the render and dynamic page caches;
- `EventSubscriber\CampDayExpirySubscriber` gives a page carrying that
  context an `Expires` header at the next midnight and caps its max-age, since
  the internal page cache ignores contexts and max-age but honours `Expires`.

`CampCalendar` is where "today" and "the next midnight" are worked out.

The View's filters compare against `now`, not `today`: for a date-only field,
core's datetime filter turns `today` into UTC midnight shifted by the site's
offset, which in Kansas City (UTC−5/−6) is the evening before.

`scripts/kch/r04_camps.php` makes the programs and the six camps.
