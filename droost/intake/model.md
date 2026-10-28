# KC Hockey — content model

The source is a Replit/Vite prototype (`artifacts/kchockey`): eight pages, a header and a
footer, three record sets in `src/data/mock-data.ts` (camps, rinks, coaches), and page copy
typed into each page's code. The site is Drupal CMS with droost_cms: pages are Canvas pages
composed from SDCs (HR2), records are content types with SDC-composed displays, lists are
Views, and all new markup lives in SDCs (HR1). Staff editors (the existing Content editor
role) keep everything current and publish directly (Q1). Every record the source declares is
real and launches as it stands (Q3), except rink phones and websites, left empty until real
ones arrive (Q3).

## Constructs

| Construct | What it is | Evidence | Rung | Confidence | Why |
|---|---|---|---|---|---|
| KC Hockey theme | a custom theme (sub-theme of the installed droost_theme), in web/themes/custom | frame | 1 | high | the design's tokens (navy 220 60% 10%, gold 43 100% 50%, muted, border, 0.25rem radius), skewed buttons, shadows and motion live here; droost_theme is contrib and is not edited in place |
| Typefaces: Oswald and Inter | theme font assets, served by the site | frame | 1 | high | the audit draws both (Oswald on 216 texts, Inter on 425); served from the site, not Google, so no visitor data goes to a third party |
| Site name and metadata | site configuration (system.site, Metatag defaults, favicon) | frame | 1 | high | "KC Hockey", as designed (Q2); the source's meta description is Replit's placeholder and is replaced by each page's own intro |
| Header | an SDC in the theme, placed in the header region | frame, p:/#r1 | 1 | high | sticky bar: the KC Hockey mark linking home, the main menu with the current page highlighted, a "Contact Us" button, and a toggle that opens the menu at narrow widths |
| Main menu | a menu (the existing `main` menu) | frame, p:/#r1, p:/camps#r1, p:/rinks#r2, p:/private-lessons#r1, p:/new-to-hockey#r1, p:/youth-leagues#r1, p:/adult-leagues#r1, p:/contact#r1 | 1 | high | the header's seven links, editable by staff; "Contact Us" is the header's button, not a menu item |
| Footer | an SDC in the theme, placed in the footer region | frame | 1 | high | the mark, the blurb, social icons, the Explore menu, the contact details, the copyright with the current year, and the legal links |
| Footer menu ("Explore") | a menu (the existing `footer` menu) | frame, p:/#r3, p:/camps#r2, p:/rinks#r3, p:/private-lessons#r2, p:/new-to-hockey#r3, p:/youth-leagues#r2, p:/adult-leagues#r2, p:/contact#r2 | 1 | high | six links whose labels differ from the header's ("KC Rink Directory"), so a menu of its own |
| Legal menu | a menu | frame | 1 | high | Privacy Policy and Terms of Service; Drupal hides a link to an unpublished page, so each shows to visitors once staff publish its page (Q8) |
| Privacy Policy page | a basic page (the existing, unpublished `/privacy-policy` node) | frame | 1 | high | reused: Drupal CMS already made it; staff write and publish it (Q8) |
| Terms of Service page | a basic page, unpublished, at /terms-of-service | frame | 1 | high | staff write and publish it (Q8) |
| Site details | a custom block type, one block, shown in the footer and on the contact page | frame, p:/contact#r4 | 1 | high | one place in the admin for the blurb, email (info@kchockey.com), phone, location lines and social addresses (Q7, Q8); the phone and each social icon show only once set |
| Site details: email | a field (email) | frame | 1 | high | info@kchockey.com, real (Q7) |
| Site details: phone | a field (telephone), empty at launch | frame | 1 | high | the design's (816) 555-0199 is a placeholder (Q7) |
| Site details: location | fields (plain text): the footer's two lines, and the contact page's area and note | frame, p:/contact#r4 | 1 | medium | the footer says "Kansas City, MO / The Hockey Capital of the Midwest", the contact page "Kansas City Metro Area / We operate out of rinks across KC."; kept as designed (Q7) |
| Site details: social links | fields (link): Instagram, X/Twitter, Facebook, empty at launch | frame | 1 | high | every icon links to "#" in the source; hidden until set (Q8) |
| Site details: blurb | a field (plain long text) | frame | 1 | medium | the footer's "Kansas City's premier hockey resource…"; editable with the rest of the details |
| Page shells | eight Canvas pages at the source's addresses, each with its intro section | r:/, r:/camps, r:/rinks, r:/private-lessons, r:/new-to-hockey, r:/youth-leagues, r:/adult-leagues, r:/contact | 1 | high | every route answers from the first rung so the frame can be held to the source everywhere; the existing Home Canvas page (front page /home) is reused for / and its alias moved; each later rung fills its page |
| Page intro (hero) | an SDC: eyebrow, heading with an accented line, text, optional background image and pattern | p:/#s1, p:/camps#s1, p:/rinks#s1, p:/private-lessons#s1, p:/new-to-hockey#s1, p:/youth-leagues#s1, p:/adult-leagues#s1, p:/contact#s1 | 1 | high | every page opens with one; props are the page's copy, edited in Canvas (Q1) |
| Home hero | the page intro on /, with two call-to-action buttons and hero-hockey.jpg | p:/#s1 | 1 | high | "Find a Camp" → /camps, "Explore KC Rinks" → /rinks; the image is in the zip and theirs to use (Q3) |
| Home ticker | an SDC: a scrolling gold band of short announcements | p:/#r2 | 1 | high | three announcements in the source, the same text repeated; staff edit them as Canvas props (Q1); motion stops when a visitor prefers reduced motion |
| Not-found page | a Canvas page set as the site's 404 page | frame | 1 | medium | the source's not-found text is the template's ("Did you forget to add the page to the router?"); the site's says the page is missing in its own style and links home |
| Content editor role | a role (the existing `content_editor`) | frame | 1 | high | staff editors publish directly (Q1); each rung grants it what that rung builds, and rung 8 proves an editor can change each thing |
| Contact form | a Webform (the Webform module, added) | p:/contact#f1, p:/contact#s2 | 2 | high | Name, Email, Message required (Q6, Q11); Subject a select of Camp Inquiry / Private Lessons / Rink Information / Other, preset from the address (?subject=); each submission kept in the admin and emailed to info@kchockey.com (Q6); invisible spam protection; the confirmation is the design's "Message Sent!" panel with "Send Another" |
| Contact form subject options | the form's select options | p:/contact#r3 | 2 | high | the four subjects, fixed in the form; staff can change them in the Webform UI |
| Contact page | the /contact Canvas page: intro, Contact Info (from Site details), "Are you a coach?" note, the form | r:/contact, p:/contact#s1, p:/contact#s2, p:/contact#r4 | 2 | high | |
| Record pages forward to listings | redirect behaviour for rink, camp and coach pages (contrib Rabbit Hole, or a small route subscriber in custom code: the rung's call) | p:/#r5, p:/#r6, p:/private-lessons#r4 | 3 | high | no record has a page of its own; a record's address forwards to its listing (Q9) |
| Rink | a content type | d:artifacts/kchockey/src/data/mock-data.ts#Rink, d:artifacts/kchockey/src/data/mock-data.ts#RINKS, p:/rinks#r1, p:/#r6 | 3 | high | eight records the rink cards render, real (Q3) |
| Rink: name | the node title | p:/rinks#r1, p:/#r6 | 3 | high | |
| Rink: city | a field (plain text) | p:/rinks#r1, p:/#r6 | 3 | high | |
| Rink: state | a field (list: KS, MO) | p:/rinks#r1, p:/#r6 | 3 | high | the metro spans two states; a list keeps them consistent |
| Rink: description | a field (plain long text) | p:/rinks#r1 | 3 | high | |
| Rink: amenities | a field (plain text, several, in order) | p:/rinks#r1, p:/#r6 | 3 | high | the home page shows the first three; free labels, nothing filters on them |
| Rink: phone | a field (telephone), empty at launch | p:/rinks#r1 | 3 | high | the source's numbers are placeholders (Q3); shown only once set |
| Rink: website | a field (link), empty at launch | p:/rinks#r1 | 3 | high | example.com placeholders (Q3); "Visit Website" shows only once set |
| Rink: sort order | a field (integer weight) | p:/rinks#r1, p:/#r6 | 3 | medium | the source orders rinks by hand, not by name; the home page shows the first three by this order |
| Rinks listing | a View block on /rinks: every rink by sort order | p:/rinks#r1, r:/rinks | 3 | high | |
| Rink card | an SDC: the /rinks card | p:/rinks#r1 | 3 | high | |
| Rink map panel | an SDC: the Google Maps embed and the "Find your sheet." panel with "Open in Google Maps" | p:/rinks#s2 | 3 | high | the embed's search and copy are Canvas props; the audit lists the www.google.com embed |
| Home rinks | a View block on /: the first three rinks by sort order, three amenities each, inside the "Find Your Ice" section | p:/#r6, p:/#s5 | 3 | high | "View Rink" and "Directory of All KC Rinks" go to /rinks, as designed (Q9) |
| Rinks page | the /rinks Canvas page: intro, map panel, listing | r:/rinks, p:/rinks#s1, p:/rinks#s2 | 3 | high | |
| Camp | a content type (the existing `event` type, relabelled "Camp or clinic") | d:artifacts/kchockey/src/data/mock-data.ts#Camp, d:artifacts/kchockey/src/data/mock-data.ts#CAMPS, p:/camps#r3, p:/#r5 | 4 | high | reused: the site already has a dated event; six records the camp cards render, real (Q3) |
| Camp: title | the node title | p:/camps#r3, p:/#r5 | 4 | high | |
| Camp: start date | a field (the existing event date field, date only) | p:/camps#r3, p:/#r5 | 4 | high | real 2027 dates (Q4) |
| Camp: end date | a field (date), optional | p:/camps#r3, p:/#r5 | 4 | high | a one-day clinic has one date (Q4) |
| Camp date display | custom code: a date-range formatter | p:/camps#r3, p:/#r5, p:/#r4 | 4 | high | shows the design's wording from real dates: "Aug 10", "July 28–Aug 1", "Aug 18–22", "Sept 6", "Oct 4–5" (AP-style months, no year, an en dash); no core format writes "Sept" |
| Camp: location | a field (reference to one Rink, required) | p:/camps#r3, p:/#r5, d:artifacts/kchockey/src/data/mock-data.ts#RINKS | 4 | high | every camp is held at one of the eight rinks on the site, never anywhere else (the human, answering "Approve this roadmap?"); the editor picks the rink, the card shows its name; it replaces the event type's free-text location field |
| Rink delete guard | custom code: an access rule on deleting a rink | p:/camps#r3, p:/rinks#r1 | 4 | high | a camp must always have its rink; deleting a rink a camp is held at is refused, naming the camps |
| Camp: ages | a field (plain text) | p:/camps#r3, p:/#r5 | 4 | high | free text in the source ("8–14", "18+", "Adults") |
| Camp: skill level | a field (plain text) | p:/camps#r3, p:/#r5 | 4 | high | free text in the source ("Intermediate/Advanced", "Coaches") |
| Camp: price | a field (integer, dollars) | p:/camps#r3, p:/#r5 | 4 | high | a number in the source; 0 is shown as "FREE" on /camps and "Free" on the home page, worked out, not typed |
| Camp: featured | a field (boolean) | p:/#s3, p:/camps#r3 | 4 | high | the source's `featured` flag: the "Featured Event" band on /camps and the home page's featured camp |
| Camp: summary | a field (the existing body field's summary or plain long text) | p:/#s3 | 4 | high | the featured section's "Join the biggest power skating development camp…" belongs to the camp it describes |
| Camp: image | a field (the existing event image field) | p:/#s3 | 4 | high | the featured camp's photo, copied from Unsplash under its license (Q10); staff can replace it |
| Camp: programs | a field (reference to Program terms, several) | p:/camps#r4 | 4 | high | the filter buttons; the source works them out from ages and title, editors choose them instead, set on the six camps so each filter shows what the source shows |
| Program | a vocabulary: Youth Hockey, Adult/Coaches, Goalies | p:/camps#r4 | 4 | high | the filter's three choices after "All Events" |
| Camps listing | a View block on /camps: upcoming camps by start date, filtered by program | p:/camps#r3, p:/camps#r4, r:/camps | 4 | high | a camp leaves the list the day after its last day (Q4); "No camps found" with "Reset Filters" when a filter is empty |
| Camp card | an SDC: the /camps card, with an optional "Featured Event" band | p:/camps#r3 | 4 | high | "Register" opens /contact with Camp Inquiry chosen (Q5) |
| Home featured camp | a View block on /: the next upcoming featured camp | p:/#s3, p:/#r4 | 4 | high | its date, location, ages, price and summary; "Register Now" opens /contact with Camp Inquiry chosen (Q5); the "Level Up." caption is fixed |
| Home upcoming camps | a View block on /: the next three upcoming camps that are not featured | p:/#r5, p:/#s4 | 4 | high | "Details" and "View All Events" go to /camps, as designed (Q9) |
| Camps page | the /camps Canvas page: intro on camps-drills.jpg, then the listing | r:/camps, p:/camps#s1, p:/camps#s2 | 4 | high | |
| Coach | a content type | d:artifacts/kchockey/src/data/mock-data.ts#Coach, d:artifacts/kchockey/src/data/mock-data.ts#COACHES, p:/private-lessons#r4 | 5 | high | four records the coach cards render, real (Q3) |
| Coach: name | the node title | p:/private-lessons#r4 | 5 | high | "Coach Mike Donovan", as the source writes it |
| Coach: specialty | a field (plain text) | p:/private-lessons#r4 | 5 | high | |
| Coach: experience | a field (plain text) | p:/private-lessons#r4 | 5 | high | |
| Coach: rate | a field (integer, dollars per hour) | p:/private-lessons#r4 | 5 | high | |
| Coach: photo | a field (image), empty at launch | p:/private-lessons#r4 | 5 | medium | the source shows initials ("MD") where a photo would be; the initials are worked out from the name, not typed, and give way to a photo when staff add one |
| Coach: sort order | a field (integer weight) | p:/private-lessons#r4 | 5 | medium | the source orders coaches by hand |
| Coaches listing | a View block on /private-lessons: every coach by sort order | p:/private-lessons#r4, r:/private-lessons | 5 | high | "All Ages & Skill Levels" and the hover label "View Profile" are the same on every card, labels not fields; "Inquire" opens /contact with Private Lessons chosen (Q5) |
| Coach card | an SDC: the coach card | p:/private-lessons#r4 | 5 | high | |
| Featured instructor spotlight | an SDC whose props staff edit in Canvas | p:/private-lessons#s2, p:/private-lessons#r3 | 5 | medium | its copy is written for the spotlight ("Power Skating & Edge Work", a bio, four highlights) and no coach record carries it; "Book a session" → /contact, as designed |
| Call-to-action band | an SDC: dark band with heading, text and a gold button | r:/private-lessons | 5 | high | "Need a Coach Recommendation?" → /contact; reused on other pages where the design repeats the pattern |
| Private Lessons page | the /private-lessons Canvas page: intro, spotlight, coaches, call to action | r:/private-lessons, p:/private-lessons#s1, p:/private-lessons#s2 | 5 | high | |
| First steps | an SDC (numbered step cards), three on /new-to-hockey | p:/new-to-hockey#r4, d:artifacts/kchockey/src/pages/new-to-hockey.tsx#firstSteps | 6 | high | page copy, edited in Canvas (Q1); the "01–03" numbers are worked out from the order |
| FAQ accordion | an SDC (accordion of question/answer items; the installed faq_item reused where it fits) | p:/new-to-hockey#r2, p:/youth-leagues#r5, p:/adult-leagues#r3 | 6 | high | one item open at a time, as designed |
| New to Hockey FAQs | six FAQ items on /new-to-hockey | d:artifacts/kchockey/src/pages/new-to-hockey.tsx#faqs, p:/new-to-hockey#r2 | 6 | high | each FAQ list belongs to one page and is ordered with it, so it is page copy in Canvas, not a content type |
| Checklist | an SDC: gold-check list of short lines | p:/new-to-hockey#r5, p:/youth-leagues#r6, p:/private-lessons#r3 | 6 | high | the same shape on three pages, different lines on each |
| Question intro with buttons | an SDC: eyebrow, heading, text, checklist, one or two buttons, beside the FAQ accordion | p:/new-to-hockey#s2 | 6 | high | the "Questions? We've got you." block; reused on the league pages |
| New to Hockey page | the /new-to-hockey Canvas page: intro, first steps, questions and FAQs | r:/new-to-hockey, p:/new-to-hockey#s1, p:/new-to-hockey#s2 | 6 | high | "Find a beginner rink" → /rinks |
| Season snapshot stats | an SDC: four figures with labels, beside the "A team for every stage." panel | p:/youth-leagues#r4, p:/youth-leagues#s2 | 7 | high | page copy in Canvas ("5 Age pathways", "8+ KC rinks"…), not counted from records |
| Division guide | an SDC: rows of division, ages, description, detail | p:/youth-leagues#r3, d:artifacts/kchockey/src/pages/youth-leagues.tsx#divisions | 7 | high | five divisions of page copy in Canvas |
| Youth FAQs | four FAQ items on /youth-leagues | d:artifacts/kchockey/src/pages/youth-leagues.tsx#faqs, p:/youth-leagues#r5 | 7 | high | |
| Youth Leagues page | the /youth-leagues Canvas page | r:/youth-leagues, p:/youth-leagues#s1, p:/youth-leagues#s2 | 7 | high | "Find a rink" → /rinks, "New to hockey?" → /new-to-hockey |
| League format cards | an SDC: icon, level, title, description; three on /adult-leagues | p:/adult-leagues#r4, d:artifacts/kchockey/src/pages/adult-leagues.tsx#formats | 7 | high | page copy in Canvas |
| Event spotlight band | an SDC: gold band with eyebrow, heading, text, date, place, audience and a link | p:/adult-leagues#r5, p:/adult-leagues#s2 | 7 | medium | the "Fall season spotlight" copy is written for this page, not the camp record's; staff edit it in Canvas each season; "View event details" → /camps |
| Adult FAQs | four FAQ items on /adult-leagues | d:artifacts/kchockey/src/pages/adult-leagues.tsx#faqs, p:/adult-leagues#r3 | 7 | high | |
| Adult Leagues page | the /adult-leagues Canvas page | r:/adult-leagues, p:/adult-leagues#s1, p:/adult-leagues#s2 | 7 | high | "Start with the basics" → /new-to-hockey, "Browse KC rinks" → /rinks |
| Launch readiness | the Content editor role proven on every construct, the XML sitemap, and a staff handover listing what is still to supply | r:/, r:/camps, r:/rinks, r:/private-lessons, r:/new-to-hockey, r:/youth-leagues, r:/adult-leagues, r:/contact | 8 | high | what is left for staff: the phone (Q7), rink phones and websites (Q3), social links and the legal pages (Q8), production mail delivery for the form (Q6) |

## Routes

- / — the home page, a Canvas page (the existing Home page): hero, ticker, featured camp, upcoming camps, rinks
- /camps — Camps & Clinics, a Canvas page with the camps listing and its program filter
- /rinks — KC Rink Directory, a Canvas page with the map panel and the rinks listing
- /private-lessons — Private Lessons, a Canvas page with the instructor spotlight and the coaches listing
- /new-to-hockey — New to Hockey, a Canvas page
- /youth-leagues — Youth Leagues, a Canvas page
- /adult-leagues — Adult Leagues, a Canvas page
- /contact — Hit Us Up, a Canvas page with the contact form

Every page keeps the source's address, so no redirect is needed. The site adds /privacy-policy
and /terms-of-service (unpublished until staff write them) and a not-found page.

## Not built

| Evidence | Why not |
|---|---|
| d:lib/api-spec/openapi.yaml#api | a template's health check, no content |
| artifacts/api-server | the template's Express server: only /healthz, no content |
| lib/db | the template's empty database schema (the audit: no table) |
| artifacts/mockup-sandbox | Replit's component preview tool, not part of the site |
| the source's not-found text | a template's developer message; the site's not-found page replaces it |
| the source's meta description | Replit's placeholder ("built on Replit. Update this description…") |
| the source's `.dark` colour tokens | defined but never switched on; the site has one light theme, as the source shows |
| attached_assets/generated_images/about-skates.jpg | in the zip but shown on no page |
| the Toaster and the source's unused UI kit components | imported or shipped by the template, never shown |
