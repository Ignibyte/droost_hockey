# KCH-A · run 1 — pre-registration (the intake)

Committed before `send`, and never shown to the subject. The yardstick is
`docs/intake/KCHOCKEY-ANSWER-KEY.md`; this file adds the round's identity, the
client's answers, fixed before any question is asked, and the predictions
the round is read against.

## Identity

| | |
|---|---|
| Round | KCH-A · run 1: the intake on KC Hockey's source |
| Subject | `<site>`, tag `kch-a-baseline-1` |
| Source | `design/KC-Hockey-Hub.zip`, sha256 `3489c53def1b67da33555d85d56c21795f5b7802cd42a5372f677ee9e9e330e7` (779 files, as delivered) |
| Stack | Drupal CMS 11.4.10, Canvas 1.12.0, ui_patterns 2.0.23; droost_cms `off-drupal` `a2e662b`; droost/workflow `off-drupal` `867f31f`, droost/engine `off-drupal` `4f263a3` |
| Dial | `low`, read resolved: retries 1, enforcement soft, require_run hard, seekers off; parity required, `scope: frame`; playwright required; `component_lint` at code; HR1 (gate, report) and HR2 (seeker) |
| Lead | autonomous (`lead: autonomous`; `mode: agentic`) |
| Reference | 16 pages (the 8 routes at 1280 and 390), captured by the observer from the source served at `localhost:5199` |
| Client and observer | **the same session** (owner, 2026-10-20): the observer sends the request, answers the intake's questions from the brief below, and approves. Each answer is typed into the pane and recorded with `bin/dogfood.sh say` |

That the observer is also the client is the round's main limit. The brief
below is the guard against it: the client answers what a club would know,
from this file, and never how anything should be built.

## The request (verbatim, what `send` types)

> We're Kansas City Hockey Hub. Build us our website in Drupal off this
> design: design/KC-Hockey-Hub.zip. It's a prototype a designer made for us;
> we want the real thing, looking like that, that our staff can keep up to
> date. No mistakes.

## The client's brief (answers fixed before the intake asks)

What the club knows. A question outside this brief is answered "we don't
mind, do what you think is best", and recorded as such.

| Topic | The client's answer |
|---|---|
| Are the camps, rinks and coaches real? | Yes, launch with them. **The phone numbers and websites are placeholders**: leave them empty until we send real ones. The images in the zip are ours to use. |
| Camp dates | Real start and end dates (a one-day clinic has one date), summer 2027. |
| Camp location | Always one of the eight rinks on the site. |
| Camp price | US dollars; 0 shows as FREE. |
| Featured camp | Staff pick it, one at a time. |
| Camp filters (All Events, Youth Hockey, Adult/Coaches, Goalies) | Yes: staff tag each camp with one of those. |
| Register button on a camp | For now it goes to the contact page with the camp named; no online payment yet. |
| Coaches | Staff keep them up to date, rate in dollars per hour; "Book a session" goes to the contact page. |
| League pages' questions (FAQs) | Staff edit them. The divisions, formats and first steps change about once a year: fixed copy is fine. |
| Contact form | Kept on the site and emailed to info@kchockey.com. Name and email required. |
| The map on /rinks | The embedded Google map is fine as it is. |
| Who edits the home page | Staff, now and then: the hero text and which camp is featured. |
| Anything about how to build it | "We don't mind, do what you think is best." |
| Approval | Approve if the roadmap covers the 8 pages and what we said; ask for a change only where it contradicts this brief. |

## Predictions (read against the record after the run)

| # | Prediction | Why |
|---|---|---|
| P1 | All 8 routes are in the model and in a rung. | the audit reads the router's table, and coverage is checked at approval |
| P2 | Rink, Camp and Coach become types with the source's fields, Camp's location a reference to Rink. | `renders d:…#CAMPS` and the rink names in `location` |
| P3 | Coach's initials (`imageFallback`) are not a field, and FREE is derived from 0. | the skill's "a value worked out from another" rule |
| P4 | The FAQs are put to the client as a question (content or fixed copy), not decided silently. | the key's question; it has gone both ways in tuning |
| P5 | The intake asks about dates and the placeholder phones and websites. | the key's questions; the README says they are placeholders, but the zip's README is not the one the key quotes |
| P6 | The frame is rung 1, and each type comes before the pages that show it. | the ladder check |
| P7 | The home page is a Canvas page, and HR2 is named in the plan. | the layer's agents.md paragraph and the canvas-build skill |
| P8 | The source is served from the container under DDEV, and the pnpm platform pins are met and read, not forced (the skill warns). | the skill's own step 2 |
| P9 | The approval goes through AskUserQuestion, and the guard records the client's answer. | decision 20's mechanism, which the intake reuses |

## What the round answers (the mission's three questions, for the intake)

1. **Measured:** did `intake check` refuse anything it should (a route left
   out, an answer not on record)? A check that passed over an incomplete
   model scores zero.
2. **Recorded honestly:** does the record say who answered each question,
   and is the observer-as-client visible in it?
3. **Forced:** could the roadmap have been approved without the audit, the
   answers or the ladder? A probe after the run tries one of each.
