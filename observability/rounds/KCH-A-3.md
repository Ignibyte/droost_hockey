# Evaluation — KCH-A · run 3: R01, attempt 2 (observer's half)

Pairs with `rounds/KCH-A-3-generated.md`. The bundle is under
`bin/artifacts/`, collected before the commit the client then asked for.

## Round identity

| | |
|---|---|
| Run | `run-68867d04c61b`, 04:14 to 05:26 UTC (72 min), in a fresh session |
| Ticket | `droost/intake/tickets/R01.md`, the same ticket as attempt 1 |
| Base | `469cb38` (baseline 1b) |
| Code | droost/workflow `82d6a57` (F-342 to F-346), droost_cms `03c1184` |
| Dial | low; parity required (frame); lead autonomous |
| Operator | the kickoff naming the ticket, and "Yes, commit it as rung 1" after complete. Nothing else typed, no question asked |
| Result | **all four phases passed**, committed as `6df785f` |

## What it built

- the `kchockey` sub-theme of droost_theme: 9 SDCs (header, footer, page
  intro, home hero, ticker, not-found, icon, nav link, social link), the
  design's tokens, Oswald and Inter served from the site;
- eight Canvas pages at the source's addresses and a styled 404;
- Site details as a settings form in a small `kchockey_site` module (the
  skill's new trap, Canvas #3582851, was avoided outright this time);
- menus for the header, the footer and the legal links;
- **every page tree through `droost/bin/canvas`**:
  `scripts/kch/r01_trees.sh` runs `tree:validate` then `tree:set` per page,
  and the content script only creates the pages. Zero writes to a
  `components` field outside `tree:set` (`transcript_facts.py`, narrowed
  this run so a read no longer counts).

## Gates

| Gate | Verdict | Measured? |
|---|---|---|
| phpcs, phpstan | passed | yes |
| component_lint | passed, 9 custom SDCs | **yes**, the first measured pass (attempt 1's base had none) |
| house_rules | reported HR1 (the page template) | yes, though the record says "never spawned" (F-347, fixed after this run started) |
| playwright | 29/29 | yes (`workflow:specs`, recorded) |
| parity | 16/16 views, frame scope, the set-aside phone's space allowed (F-343) | yes, with the base URL the agent set (below) |

16 criteria, all proven by a named test; the test suite also caught a real
bug (the Site details form could not save until its config had a langcode).

## The three questions

1. **Measured.** Five gates measured something, and every green was one
   that could have failed: parity failed all 16 views on the bare site an
   hour before. The parity *base* was the gap: droost ran on the host this
   time, where DDEV sets no URL. The gate first read "could not run" (honest),
   then the agent set `DROOST_PARITY_BASE_URL` to the site, checked the judge
   by hand, and spent its retry.
2. **Recorded honestly.**
   - The previous attempt and its reason are in `previous_attempts`.
   - But the verdict named only the reference's source, never the site
     judged, and the agent chose that site (**F-348**, fixed: the project's
     DDEV site first, and every verdict says "judged at <url> (from
     <where>)").
   - The agent's report named what was not proven (AC-12 only partly:
     Canvas's own editor UI was not driven) and what its tests left on the
     site (a test user, a legal page's state).
3. **Forced.** HR2 was held by the agent's own choice, not mechanically:
   nothing stops a `php:eval` tree write except the seeker, which is off at
   `low`. The instrument now reports one if it happens.

## Findings

- **F-348** (HIGH, fixed `08db4ea`): parity judged whatever site the run's
  environment named, and the record did not say which.
