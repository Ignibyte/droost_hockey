# Evaluation — KCH-A · run 9: R07, the league pages (observer's half)

Pairs with `rounds/KCH-A-9-generated.md`.

| | |
|---|---|
| Run | `run-4aa2963e9597`, 19 minutes, fresh session |
| Ticket | `droost/intake/tickets/R07.md` |
| Base | `20d32d1` (R06; droost/workflow `7e86d58`; six pages judged whole; a reference that records it was read on darwin) |
| Operator | the kickoff and "Yes, commit it." |
| Result | **all four phases passed**, committed `2a8b47c` |

**Built:**
- season stats, the division guide and the league format cards;
- the event spotlight band;
- `/youth-leagues` and `/adult-leagues`, reusing R06's question section;
- 8 new components, every word editable in Canvas.

**Gates:**
- component_lint over 49 SDCs;
- house rules;
- Playwright 4/4;
- parity 16/16, "judged at https://kch-a.ddev.site (from .ddev/config.yaml)":
  the host, where the reference was read. No cross-platform verdict was
  possible after F-351, and none was attempted.

**Regression:** R06's suite passed 5/5. R05's failed in the container and
passed 8/8 from the host, because its spec calls `ddev drush` (the issue
recorded at R06). The agent proposed giving R05's spec R06's helper.

**After the run:**
- the operator measured both league pages whole (pass) and every page whole
  (all 8 pass);
- a reference with one heading changed fails (D2);
- R08 judges all eight pages whole at 1280px (the 390px views stay
  frame-only, by the judge's design).

**The three questions:** measured, recorded, forced, each without a gap
this run. No finding.
