# Evaluation — KCH-A · run 8: R06, /new-to-hockey (observer's half)

Pairs with `rounds/KCH-A-8-generated.md`.

| | |
|---|---|
| Run | `run-3c46f0d6043a`, 47 minutes, fresh session |
| Ticket | `droost/intake/tickets/R06.md` |
| Base | `39e5227` (R05; phpcs and phpstan reading `scripts/`; five pages judged whole) |
| Operator | the kickoff and "Yes, commit it." |
| Result | **all four phases passed**, committed `f5e9443` |

**Built:**
- first-step cards numbered from their order;
- an FAQ accordion on native `<details>` grouping, keyboard-operable,
  announced to screen readers and working without JavaScript; the agent
  found and fixed a race in its first version;
- a checklist and a questions section, every word editable in Canvas.

**The debt named after R05 was paid.** With phpcs and phpstan reading
`scripts/`, the agent fixed all 41 phpcs errors in the R01 to R05 content
scripts and phpstan's one, re-ran every script, and confirmed the config
export was unchanged. `mixed` was declared again, and this time
type_coverage passed on a real measurement.

**Where parity runs decided its verdict (F-350, F-351).**
- The agent ran the spec and parity inside the container, where `/` failed
  D5, and from the host, where it passed. It ran the gate from the host
  and reported the difference in plain words ("it's the container's
  browser, not this rung").
- Reading the transcript showed two things beneath that:
  1. **F-350:** in the container the judge read "judged at
     `https://html.ddev.site`". F-348's DDEV-config derivation took the
     project's directory as its name, and inside the container that is
     `/var/www/html`. Fixed (`829e354`): DDEV's own `DDEV_PRIMARY_URL`
     comes first in the container.
  2. **F-351:** with the right URL, `/` still fails in the container and
     passes on the host. The reference was read on macOS; Linux Chromium
     lays the ticker's text out differently. Nothing recorded where a
     reference was read, and the run could choose where to judge. Fixed
     (`f943bd6`): a capture records `read_on` {platform, browser}, and a
     judge elsewhere reads INVALID, saying where to judge. On the subject,
     after re-capturing: host pass, container INVALID. The test skill now
     says the operator decides where, never the verdict (`7e86d58`).

**Also worth recording:**
- the full regression (67 tests) timed out three tests under parallel
  workers on `ddev drush` from the host, all passing with one worker;
- the agent's R06 helper calls drush inside the container directly
  (4.5 s against a minute).

**The three questions:**
- **Measured:** yes, but where it was measured mattered, and is now forced.
- **Recorded honestly:** the agent said so; the record did not say which
  site or platform was judged until F-348 and F-351.
- **Forced:** before F-351 the run could pick the passing place; after,
  only the one where the reference was read.
