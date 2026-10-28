# KC Hockey theme

The site's theme: a sub-theme of Droost Theme carrying the KC Hockey design
(the Replit prototype in `design/KC-Hockey-Hub`). Everything a page shows is
an SDC in `components/`.

## The stylesheet

`css/kchockey.css` is compiled Tailwind v4, committed, so the site never needs
node. Its source, `css/src/kchockey.css`, holds the design's own tokens
(navy, gold, muted, border, the 0.25rem radius, the shadows), the design's
base layer (Inter body, Oswald uppercase headings) and the two typefaces.
The components use the design's utility classes directly.

Droost Theme's daisyUI stylesheets and tokens are switched off
(`libraries-override` in `kchockey.info.yml`): the design has no daisyUI.

Rebuild after changing a component, a template or the source file, inside
the DDEV container (the theme's `node_modules` are Linux builds):

```bash
ddev exec -d /var/www/html/web/themes/custom/kchockey npm install   # once
ddev exec -d /var/www/html/web/themes/custom/kchockey npm run build
```

Only utilities that appear in `components/`, `templates/` or
`kchockey.theme` are compiled in. A class used anywhere else needs an
`@source` line in the source file and a rebuild.

## Typefaces

Oswald and Inter, latin variable woff2 files in `fonts/` (copied from
`@fontsource-variable`, SIL Open Font License, see `fonts/OFL-*.txt`), served
by the site: no request goes to Google Fonts.

## The frame

`templates/page.html.twig` places the `page_frame` component around the
header, the content region and the footer. `kchockey_preprocess_page()` in
`kchockey.theme` builds:

- **the header** (`site_header`, links as `nav_link` components) from the
  `main` menu: the current page's link is highlighted; "Contact Us" goes to
  /contact. Under 768px the toggle (`site_header.js`) opens the same links.
- **the footer** (`site_footer`) from the `footer` menu (the Explore column),
  the `legal` menu (the bottom line) and **Site details**, the
  `kchockey_site` module's settings at Configuration › System › Site details
  (`/admin/config/system/site-details`): the blurb, email, phone, location
  and social addresses. The phone row and each social icon show only once
  set. A legal link shows only once its page is published, because the menu
  hides links to pages a visitor may not see.

Both carry the cacheability of the menus and Site details, so an editor's
change shows on the next page view.

The frame components (`page_frame`, `site_header`, `nav_link`,
`site_footer`, `social_link`) are disabled in the Canvas library: the page
template places them, not editors.

## Sections for Canvas pages

- `page_intro`: the band that opens a page; its Background picks one of the
  design's looks (Photo, Glow, Light, Stripes, and the three Guide looks).
- `home_hero`: the home page's opening, with two buttons.
- `ticker`: the gold band of announcements. The design names a marquee but
  gives it no motion, so the band holds still, as the design shows it.
- `not_found`: the 404 page's band (the Canvas page at /page-not-found, set
  as the site's 404 page).

The hero's and the guide intros' entrance animation stops for a visitor who
prefers reduced motion.

## The contact page

/contact (rung 2) is the intro, then `contact_section`: a narrow column (its
`aside` slot) beside a card headed by its Form heading prop (its `form` slot).
On the site the column holds the **Contact info** block (`kchockey_site`,
rendering `contact_info` from Site details) and a `callout` ("Are you a
coach?"); the card holds Webform's own block showing the `contact` webform.

The form's markup is Drupal's, so `contact_section.css` (attached with the
component) styles it to the design: uppercase labels, square fields with a
gold focus ring, Name and Email side by side from 768px, and the skewed
"Fire Away" button (the actions row is the skewed band, the input stands
upright inside it, the send icon is the row's `::after` after the words, so
the words sit on plain navy and their contrast can be measured).
Server-side errors show under their field (core's Inline Form Errors).

Once sent, the form shows `form_sent` ("Message Sent!" and "Send Another"),
fed from the webform's confirmation settings by `kchockey_site`'s form alter.
`contact_info` and `form_sent` are disabled in the Canvas library: a block and
the form place them, not editors.

## Rinks

/rinks (rung 3) is the intro, then `rink_map` (a Google map of a search, the
"Find your sheet." panel and "Open in Google Maps"; every word, the search and
the button's address are Canvas props), then the **Rinks: directory** block.
On the home page, after the ticker, `rinks_band` ("Find Your Ice", its text
and the gold "Directory of All KC Rinks" button) holds the **Rinks: home
page** block in its `rinks` slot.

Both blocks are displays of the `rinks` View (Structure › Views): published
rinks by their Sort order, then name. The View draws its rows through UI
Patterns' Views plugins, so every piece is a component:

- the rows sit in `rink_grid` (Directory: two to a row in the page's column;
  Band: three to a row);
- each row is a `rink_card` (directory) or a `rink_tile` (home), its props
  read from the rink's fields;
- the amenities are the View's Amenities field, each value an `amenity_tag`
  (light on cards, dark on tiles). The home display shows only the first
  three, with the field's own "display 3 values" setting.

A card shows the phone (a call link) and "Visit Website" (a new tab) only
once staff fill them in; with neither set, the card has no bottom row.

`rink_card`, `rink_tile`, `amenity_tag` and `rink_grid` are disabled in the
Canvas library: the View places them, not editors.

## Camps

/camps (rung 4) is the intro, then `camps_section` holding the **Camp
filter** block (`kchockey_site`, rendering `camp_filter`: "Filter By:", a
`filter_link` per program, the current one in blue) and the **Camps:
listing** block: the `camp_card`s three to a row in a `camp_grid`, or
`camp_empty` ("No camps found", "Reset Filters") when a filter matches
nothing. A card shows the "Featured Event" band when its camp is
featured, and its price as "$275" or "FREE"; "Register" opens /contact with
Camp Inquiry chosen.

On the home page, after the ticker: the **Camps: home page featured** block,
whose View style is `featured_band` (so with no camp the section goes too)
around `featured_camp` (the red tag, the camp's facts, "Register Now", and its
photo in grey with "Level Up."), then `upcoming_band` ("Upcoming Action",
"View All Events", both Canvas props) holding the **Camps: home page
upcoming** block: three `camp_tile`s ("Free" for a free camp, "Details" to
/camps).

The dates come from `kchockey_site`'s Camp dates formatter, into each
component's `date` slot. `camp_card`, `camp_tile`, `camp_grid`,
`camp_filter`, `filter_link`, `camp_empty`, `featured_camp` and
`featured_band` are disabled in the Canvas library: the View and the block
place them.

## Coaches

/private-lessons (rung 5) is the intro, then `instructor_spotlight`, then the
**Coaches: listing** block, then `cta_band`.

- `instructor_spotlight`: the "Featured Instructor" panel. Every word in it is
  a Canvas prop, written for the spotlight rather than read from a coach
  record: the gold panel's eyebrow, kicker and tagline (the tagline breaks
  after its first word: "Level / Up."), the specialty, name, rate label and
  rate ("$75/hr"), the bio, and the button ("Book a session" → /contact). Its
  `highlights` slot holds `check_item`s, one line each with a gold check.
- The listing: the `coach_card`s by sort order, one, two then four to a row
  in a `coach_grid`. A card shows the coach's photo filling the square or,
  until one is added, the initials worked out from the name (a leading
  "Coach" dropped, then the first letters of the first and last words: "MD").
  "View Profile" shows over the square on hover or keyboard focus. It is the
  design's label and links nowhere, because coaches have no page of their own.
  "Inquire" opens /contact with Private Lessons chosen.
- `cta_band`: the dark band with the gold slant, a heading, text and a gold
  button ("Need a Coach Recommendation?", "Get Matched" → /contact), all Canvas
  props, for any page that repeats the pattern.

`coach_card` and `coach_grid` are disabled in the Canvas library: the View
places them.

## New to Hockey

/new-to-hockey (rung 6) is the intro, then `first_steps`, then
`question_section`. Every word is a Canvas prop, and every step, question and
checklist line is a component an editor adds, removes or drags into order.

- `first_steps` holds `first_step` cards (an icon, a title, a sentence), one
  then three to a row. The big "01", "02", "03" are a CSS counter, so they
  follow the cards' order: reorder or add a step and the numbers follow.
- `question_section`: two columns from 1024px, its `intro` slot beside its
  `questions` slot. Intro width is Standard (two fifths, this page) or Narrow
  (three eighths, the league pages).
- `question_intro`: a gold eyebrow with an icon (question mark, shield with a
  check, or people), a heading and its second line, the text, a `checklist`
  slot and a gold button ("Find a beginner rink" → /rinks). A second, outline
  button shows once its label and link are set (the league pages have two).
  Heading size is Large (grows from 768px, this page) or Medium (the league
  pages).
- `checklist`: `check_item`s stacked, or in a row that wraps. `check_item`'s
  Icon is a plain check (the spotlight's) or a check in a circle (the
  checklists': lucide's CheckCircle2, as the source draws it).
- `faq_accordion` holds `faq_item`s. Each question is a native
  `<details>`/`<summary>`: it opens from the keyboard (Enter or Space), tells
  assistive technology whether it is open, and opens with no JavaScript.
  `faq_accordion.js` gives the accordion's questions a shared `name`, so the
  browser keeps one open at a time. A browser without named details gets the
  same from the toggle event. The answer shows at once, without the design's
  slide.

## Youth and Adult Leagues

/youth-leagues and /adult-leagues (rung 7) are the intro, two page sections of
their own, then a narrow `question_section` holding a medium `question_intro`
with two buttons and an `faq_accordion` of four questions. Every word is a
Canvas prop, and every figure, division, format and question is a component
an editor adds, removes or drags into order. The new components are in the
Canvas folder "Leagues".

- `start_panel` (youth): the bordered card, a trophy eyebrow, a heading and
  text, a `checklist` slot (a checklist in a row) and a `snapshot` slot beside
  it from 1024px.
- `season_snapshot` holds `stat_figure`s, two to a row, on the dark panel. A
  figure is text ("8+", "100%"), typed as it should read, not counted.
- `division_guide` holds `division_row`s under a dark rule. A row is the
  division, its ages, a description and a detail. Below 768px the name and
  ages share a line, the description takes the next, and the detail is left
  out, as the design does.
- `format_section` (adult): a two-line heading with a gold-ruled note beside
  it, over `format_card`s three to a row from 768px. A card's icon is people,
  a clock or a check in a circle.
- `event_spotlight`: the gold band with an eyebrow, heading and text beside
  the date, place, audience and a link ("View event details" → /camps). Its
  words are written for the page, so staff change them each season in Canvas;
  it is not tied to a camp record.

## Content scripts

`scripts/kch/r01_content.php` (pages, menus, the legal pages, the design's
photos as media, site settings) and `scripts/kch/r01_trees.sh` (each page's
Canvas tree, from `scripts/kch/trees/`) rebuild rung 1's content on a fresh
site; `scripts/kch/r02_contact.sh` makes the contact webform and writes
/contact's tree; `scripts/kch/r03_rinks.sh` makes the eight rinks
(`r03_rinks.php`) and rewrites the trees; `scripts/kch/r04_camps.sh` makes the
programs and the six camps (`r04_camps.php`) and rewrites the trees;
`scripts/kch/r05_coaches.sh` makes the four coaches (`r05_coaches.php`) and
rewrites the trees. Rungs 6 and 7 have no content of their own:
/new-to-hockey's, /youth-leagues' and /adult-leagues' trees are in
`scripts/kch/trees/`, written by `r01_trees.sh`. All are
safe to run again.

The PHP scripts are held to the Drupal coding standard and phpstan, like the
theme and module.
