# Evaluation — KCH-A · run 5: R03, the rinks (observer's half)

Pairs with `rounds/KCH-A-5-generated.md`.

| | |
|---|---|
| Run | `run-66c2dca91932`, 33 minutes, fresh session |
| Ticket | `droost/intake/tickets/R03.md` |
| Base | `01bdc0c` (R02) |
| Operator | the kickoff, and "Yes, commit it as R03." after complete |
| Result | **all four phases passed**, committed `1adf1c2` |

**Built:**
- the Rink type (7 fields), the eight rinks with placeholder phones and
  websites left empty (Q3);
- a View for `/rinks` and the home page's Find Your Ice (a View because only
  a Views field caps the amenities at three);
- the map panel;
- a small forwarding subscriber in `kchockey_site` (a rink's own address goes
  to `/rinks`), in place of the Rabbit Hole module the model named;
- sitemap entries for rinks turned off, since they only forward;
- trees through `tree:set`.

**Gates:**
- phpcs, phpstan, component_lint and house_rules (HR1) at code;
- Playwright 6/6 and parity at test;
- the regression suites of R01 and R02 re-run and pass (38/38);
- 7 criteria proven, AC-1 by a command.

**What it surfaced, and what it led to:**
- The parity gate judged the frame only, because `gates.parity.pages` was
  empty, and the agent said so, as a decision for the operator, without
  touching the lever file (which it cannot).
- The operator then measured the finished pages whole before setting the
  lever. `/rinks` passed. `/contact` (R02's, judged whole for the first
  time) failed on two of the reader's own defects (**F-349**):
  - a `<label>`'s box was held instead of its text;
  - a button input's label (`value`) was not read.

  With the fix, and the reference re-read by the new reader (the same 16
  pages, the same set-asides), both pass whole and `/camps` (not built)
  still fails. R04 runs with `pages: "/contact,/rinks"`.

**The three questions:**
- **Measured:** the frame, every rung; the whole pages, from R04 on.
  R01 to R03 were judged at frame scope only, which a reader of their
  verdicts must know.
- **Recorded honestly:** yes. The report named the gap in its own
  verification and that AC-7 rested on a hand-run check.
- **Forced:** by choice, as before.
