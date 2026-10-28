# KC Hockey — roadmap

Each rung is one run (`/droost:workflow:start` with its ticket), in order. Each builds
something whole (a type with its content, its displays and its pages) and consumes a rung
below it. The frame is held to the source on every page from rung 1; each rung's pages are
its parity routes, judged whole.

Rinks come before camps: every camp is held at one of the site's rinks, so a camp's location
is a rink the site already holds.

| Rung | Ticket | Builds | Consumes | Pages |
|---|---|---|---|---|
| 1 | tickets/R01.md | the KC Hockey theme (tokens, typefaces), the header, footer and their menus, Site details, the legal pages, eight page shells with their intros, the home hero and ticker, the not-found page | — | frame, / |
| 2 | tickets/R02.md | the contact form (Webform), its emails and stored submissions, the /contact page | 1 | /contact |
| 3 | tickets/R03.md | Rink, the eight rinks, /rinks with the map panel, the home page's "Find Your Ice" rinks, record pages forwarding to their listings | 2 | /rinks, / |
| 4 | tickets/R04.md | Camp (the reused event type, its location a required rink), Program, the date display, the six camps, /camps with its filter, the home page's featured and upcoming camps, the rink delete guard | 3 | /camps, / |
| 5 | tickets/R05.md | Coach, the four coaches, the instructor spotlight, the call-to-action band, /private-lessons | 4 | /private-lessons |
| 6 | tickets/R06.md | first steps, the FAQ accordion, the checklist, the question intro, /new-to-hockey | 5 | /new-to-hockey |
| 7 | tickets/R07.md | season stats, the division guide, league format cards, the event spotlight band, /youth-leagues and /adult-leagues | 6 | /youth-leagues, /adult-leagues |
| 8 | tickets/R08.md | launch readiness: the Content editor role proven on everything, the sitemap, the staff handover, every page held whole to the source | 7 | /, /camps, /rinks, /private-lessons, /new-to-hockey, /youth-leagues, /adult-leagues, /contact |
