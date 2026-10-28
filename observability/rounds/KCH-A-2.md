# Evaluation — KCH-A · run 2: R01, attempt 1 (observer's half)

Pairs with `rounds/KCH-A-2-generated.md` (droost's render of the evidence
store, collected by `dogfood.sh collect KCH-A-2`). The bundle (diff,
untracked files, transcript, state) is under `bin/artifacts/`; the database
is the DDEV snapshot `kch-a-r01-attempt1`.

## Round identity

| | |
|---|---|
| Run | `run-800db1ae3b86`, opened by the agent the moment the intake was approved (21:31:59), in the intake's session |
| Ticket | `droost/intake/tickets/R01.md`: the theme, the frame, the eight page shells, the home hero and ticker, the not-found page |
| Base | `3521360` (baseline 1) |
| Code | droost/workflow `867f31f`, droost_cms `a2e662b` |
| Dial | low; parity required (frame); lead autonomous |
| Result | **test FAILED** (the parity gate could not run; its one retry spent). Plan and code passed. Attempt 2 is KCH-A run 3 |

## What happened

- **Plan** (about 25 minutes): a spec, 13 EARS criteria, 11 routes; every
  knowledge call in plan (`code:symbol` ×10, `code:tree`, `code:wiki`,
  `search:arch`, `search:code`).
- **Code:**
  - the KC Hockey sub-theme of droost_theme and its SDCs (header, footer,
    page intro, home hero, ticker, not-found, icons), and eight Canvas
    pages;
  - phpcs, phpstan and component_lint passed; HR1 reported the page
    template.
  - **Canvas 1.12 broke `block_content`'s install halfway** (Canvas
    #3582851, our F-66, merge request open). The agent repaired the
    half-install by hand and moved Site details into a small custom
    module, `kchockey_site`, telling the client so in its report. Now a
    known issue in droost_cms and a trap named in the skill.
- **Test:**
  - Playwright 32/32 (`workflow:specs`, recorded).
  - The agent ran `droost-parity` itself, found the copyright line 40px
    higher at 390px (the phone row left off under Q7), and **asked the
    operator rather than fake or waive it**. The operator answered: let
    it fail, don't reverse Q7, don't start rung 2.
  - The gate then read **error-tool-missing**: it looks for
    `vendor/bin/droost-parity`, and droost lives in `tools/droost/`.
    Nothing judged; never a pass.
- **Its report to the operator:**
  - the parity runner path;
  - two route declarations it could not correct;
  - a stray file it could not delete;
  - the custom-block workaround;
  - a Drupal CMS menu link it deleted by mistake and restored.

## The three questions

1. **Measured.**
   - phpcs, phpstan, component_lint and Playwright measured.
   - Parity did not, through no fault of the agent's (F-344). Had it run,
     it would have failed on droost's own geometry (F-343).
   - `house_rules` measured and found a break, but the record says "the
     tool never spawned" (F-347).
2. **Recorded honestly.**
   - The parity gate that could not run reads BLOCKED, never passed.
   - The house-rules row under-reports a measurement (F-347).
   - The two `@403` routes stand in the record, though the agent knew
     them wrong and the help said re-declaring replaces (F-346).
3. **Forced.**
   - The agent was held at test, and asked the operator rather than
     route round the gate.
   - The guard let its editor make a file in the state directory that
     nothing could then run or remove (F-345).

## Findings (all fixed and pushed on `off-drupal`)

| | |
|---|---|
| **F-343** | a text set aside by decision kept its space in D5: 8 of 16 views failed on the subject, 16 of 16 pass after (`7f4b399`) |
| **F-344** | the parity gate looked for `vendor/bin/droost-parity`; it now runs the package's own runner (`7f4b399`) |
| **F-345** | the editor could create an orphan in the state directory (`82d6a57`) |
| **F-346** | a route's status could not be corrected, nor 404 declared (`82d6a57`) |
| **F-347** | an in-process house rule recorded `duration_ms: 0`, read as "never spawned" (`d09ad49`, after attempt 2 started) |

## Attempt 2

Same ticket, from baseline 1b (`469cb38`):
- the approved intake committed;
- the site reinstalled from the recipe;
- droost/workflow `82d6a57`, droost_cms `03c1184`;
- FRESH; probe-canvas-layer 8/8;
- the parity gate measuring (it fails all 16 views on the bare site, as it
  should).

Launched in a fresh session with the operator's kickoff naming the ticket.
