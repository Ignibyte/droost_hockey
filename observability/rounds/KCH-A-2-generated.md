# Evaluation — `run-800db1ae3b86`

Rendered from the evidence store. Every value below is a row droost
wrote about what it measured; the sections a human must fill say so in
place, and say why.

> **The one rule the rest hangs from.** `phases` in `run.json` is the
> subject's own summary of itself: droost writes that file, but what it
> writes there is a rollup of the run's own account, and a reader who
> wants to know whether a gate ran should not be asking a summary.
> Nothing here reads `phases`. Every VERDICT below is a row droost
> wrote from a process droost started.
> 
> The stated REASON for that rule used to be that the agent could write
> `run.json`. It cannot: the guard refuses it through both doors, the
> editing tools and the shell, as it refuses the guard itself,
> `.claude/settings.json`, the bypass grant, the baseline and this
> store. The rule survives its reason — a summary is still a summary —
> but an evaluation that argues from a wall which has moved is telling
> its reader something false about how the wall is built.
>
> **The exception, stated because it was not.** §1's preset, mode,
> enforcement, base commit and spec path are copied THROUGH `run.json`
> on their way into the store, so an agent editing that file before a
> phase changes what §1 prints. A reviewer edited `medium`/`soft` to
> `max`/`hard`, ran one phase, and §1 said `max` and `hard` while the
> frozen medium gate set was what actually ran. Those rows are marked
> `reported` below, and the two digests are marked with what they
> actually cover: droost computes them, over the file `run.json` names,
> and only across the spec's frozen sections. The gate set in §3 and
> §4 is the check on all of it.

> **What the integrity check does and does not establish.** Every
> verdict carries a digest over the previous verdict's digest and its
> own columns, and the ids are contiguous because nothing deletes from
> that table. So an altered verdict, an invented one, or a deletion in
> the middle of the record breaks the chain and is named below. So does
> a deletion from the END that leaves the run's recorded head alone, or
> blanks it: the head is written beside every verdict, so a record
> shorter than its head, and a record with verdicts but no head, are
> each visible. And the concession that an empty digest means "written
> before the chain existed" is bounded twice over — by a watermark that
> cannot exceed the rows that exist, and by a mark the file only carries
> if it really does hold rows that old — both of which are written in
> this same file, so a forger who reads the source can set them. When
> a store DOES claim that concession, the banner below says how much
> of this run it covers; absent that banner, every verdict here
> carries a digest.
> 
> It does NOT establish that the record is untampered, and cannot. Every
> input to the check — the algorithm, the digests, the head, the
> watermark — lives in a file the agent being measured can write, so
> anyone willing to read `EvidenceStore::chain()` can recompute the
> whole chain around whatever they changed. Two SQL statements are
> enough without reading anything: DELETE the verdicts from some point
> on, then repoint the head at whatever row is now last. The record that
> survives is SHORTER, not inconsistent, and nothing here can tell a
> run that recorded three verdicts from one that recorded the first of
> them and stopped. Read §4's count against what the phases claim to
> have run: that comparison is outside the chain, and it is the thing a
> truncation cannot fix.
> 
> What the chain catches is accident, corruption and casual editing, and
> it makes a deliberate forgery cost specific knowledge and several
> coordinated writes rather than one UPDATE. It does not catch a
> determined local forger, and no scheme kept entirely inside that file
> could.
> 
> If this record has to hold against that, it has to leave the machine:
> commit the rendered evaluation, where a diff shows what changed, or
> write it somewhere the agent has no credentials for. That is an
> operator's decision and droost cannot make it from in here.

## 1. Round identity

| Field | Value | Source |
|---|---|---|
| Round | `run-800db1ae3b86` | measured |
| Started (as recorded) | `2026-10-20T21:31:59-05:00` | reported |
| Preset | `low` | reported |
| Mode | `agentic` | reported |
| Enforcement (requested) | `soft` | reported |
| Base commit | `3521360f8713f5e824a0c90d3c25de480e76b0bb` | reported |
| Spec | `droost/droost-workflow/tmp-spec-r01-theme-frame.md` | reported |
| Frozen-sections hash | `fc650d94e463ca1f1f94a3df0b21fa17` | hashed by droost, over the file run.json names |
| Spec frozen at | `2026-10-20T21:36:01-05:00` | droost's clock, at plan exit |
| Ticket / request | — not recorded — | — |
| Subject (model, effort, host, version) | — not recorded — | — |
| Driver (tmux / interactive / CI) | — not recorded — | — |
| Elapsed | — not recorded — | — |
| Operator interventions | — not recorded — | — |

What §1 cannot say, and why:

- **`reported` means the value reached the store THROUGH `run.json`.**
  droost recorded it faithfully; it did not verify it. An agent that
  edits that file before a phase changes these rows, and the gate set
  that actually ran — §3 and §4 — is the check on them.
- **The frozen-sections hash is not a hash of the spec.** It covers
  grounding, criteria and routes as the plan ended them, and nothing
  else, so two specs differing elsewhere share a digest. The freeze does NOT
  rest on it — it compares the recorded TEXT row by row, because "every
  row that was there is still there" is not a question a hash can
  answer. Read the digest as a tripwire, never as a seal.
- **Subject, driver and elapsed** are facts about the harness that ran
  the round, not about the run. Nothing writes them to the store, so
  they are captured by hand from the template's §2.
- **Enforcement in §1 is the REQUESTED value**, and `{requested,
  effective, reason}` is still computed at read time and never
  persisted — `effective` is inferred from the declared host, which is
  a claim about a claim. What the hook was OBSERVED doing is now §7a,
  written by the guard about itself. Read the two together: §1 for what
  was asked, §7a for what was there.
- **Operator interventions** leave a trace in the record only where an
  operator unblocked a check; see the `unblocked by the operator` rows
  in §4. Everything else an operator did during the round is invisible
  from here.

## 2. Environment — captured BEFORE the subject starts

**Not generated, and it cannot be.** Three of this section's rows are
unrecoverable after the fact — gate arming, enforcement effectiveness,
and whether a patch truly landed — which is exactly why the template
asks for them before the subject starts. A store written DURING the
run is the wrong side of that line.

Fill it from `.claude/templates/evaluation.md` §2 (init installs the
template there — `pack/templates/` is where it ships FROM, not where a
project reads it), with the four traps it lists.

---

## 3. The lever table

The template's `Probe`, `Expected`, `Fired?` and `Verdict` columns are
the evaluator's work — a probe is a command someone ran before the
round, and a verdict is a judgement about whether what fired matched
what was asked for. Neither is a row. What the record holds is the
value, and whether anything was adjudicated under it.

| Lever | In the record | Note |
|---|---|---|
| `mode` | `agentic` | frozen into the run at begin |
| `preset` | `low` | the effort every other lever's meaning is relative to |
| `enforcement` | `soft` | the requested value only — see §1 |
| `require_run` | — not recorded — | the guard re-reads raw YAML on every write, and writes nothing back |
| `max_gate_retries` | — not recorded — | attempts per gate are countable in §4; the configured ceiling is not stored |
| `seekers` | **off** | whether anything read the diff with intent. `off` and `on` are different facts from a clean verdict and must not be read as one — §4d says which |
| `baseline` | none | the adoption baseline this run was held to, frozen at begin. `none` means no debt was subsidised; §4's Baseline column says which verdicts leaned on it |
| `work_item` | see §1 | declared with `--work-item`, and read by any contributed check that asks |
| write gates — the seven `allow_*` | — not recorded — | a tool REFUSAL reaches the ledger as `outcome: fail` (§4a); the arming does not |

### Gates

| Gate | Adjudicated in | Attempts | Latest state |
|---|---|---|---|
| `phpcs` | `code` | 1 | satisfied |
| `phpstan` | `code` | 1 | satisfied |
| `eslint` | `code` | 1 | not applicable |
| `stylelint` | `code` | 1 | not applicable |
| `prettier` | `code` | 1 | not applicable |
| `phpunit` | `code` | 1 | not applicable |
| `mutation` | `code` | 1 | not applicable |
| `playwright` | `test` | 2 | satisfied |
| `parity` | `test` | 2 | BLOCKED |
| `coverage` | `code` | 1 | not applicable |
| `house_rules` | `code, test` | 2 | recorded (not blocking) |
| `wiki_fresh` | — not recorded — | 0 | — not recorded — |
| `custom:component_lint` | `code` | 1 | satisfied |

A gate with `— not recorded —` in the second column was never
adjudicated in this run at all — which is NOT the same as off. A gate
turned off by the preset or by the lever file still produces a row,
stated as `not applicable`. No row means the phase that owns the gate
never ran, or the recorder failed while it did.

---

## 4. Gate verdicts

A green is not a measurement. For the GATES in this table —
`satisfied` and `recorded` rest on something droost collected;
`not applicable` and `unblocked by the operator` are honest and are
NOT measurements; `asked for, could not run here` means the gate was
wanted and this surface could not perform it; and a measured state
with `duration_ms: 0` means the tool never spawned. (Elsewhere in this
document `recorded` is also used for a DECLARATION droost kept but
could not check — that is not a measurement, and the row says so.)

**Still true?** re-measures the fingerprint of what each gate examined,
as the tree stands now:

- `yes` — the subject is byte-identical to what the verdict was about.
- `**EXPIRED**` — the subject has changed since. Not a green now.
- `**EXPIRED** (subject gone)` — the gate HAD a subject and it no
  longer exists. The most complete form of expiry there is.
- `unknown` — the gate has no `paths` lever, so there is nothing to
  fingerprint and there never was. NOT the same as unchanged.

**Baseline** is the other way a green can mean less than it looks.
An adoption baseline records the debt a tree already carried, and a
consulting gate subtracts those findings from its verdict — a
deliberate, audited exception to "green means measured", which this
column is the audit of:

- `—` — no baseline was consulted. NOT the same as zero inherited.
- `0 inherited` — a baseline was consulted and subsidised nothing.
- `**N inherited**, M new` — the verdict rests on M findings and set
  N aside. A `satisfied` beside a non-zero N is a pass over debt.

**Config the run changed** is the third. A config file is the
project's, and a run may change one and declare it, but a verdict
reached under rules the run set is not the verdict a reader assumes:

- `—` — the run changed none of the files this gate's tool read.
- a file — the run wrote, edited or deleted it, and the tool reads
  it. Read that file's diff before the verdict beside it.

| Gate | Phase | State | Fault | Exit | `duration_ms` | Invocation recorded | Measured anything? | Baseline | Config the run changed | Still true? |
|---|---|---|---|---|---|---|---|---|---|---|
| `coverage` | `code` | not applicable | — | — not recorded — | — not recorded — | no | no — not applicable | — | — | — not recorded — |
| `custom:component_lint` | `code` | satisfied | — | 0 | 349 | yes | yes | — | — | unknown |
| `eslint` | `code` | not applicable | — | — not recorded — | — not recorded — | no | no — not applicable | — | — | — not recorded — |
| `house_rules` | `code` | recorded (not blocking) | — | 1 | 0 | yes | no — the tool never spawned (`duration_ms: 0`) | — | — | unknown |
| `mutation` | `code` | not applicable | — | — not recorded — | — not recorded — | no | no — not applicable | — | — | — not recorded — |
| `phpcs` | `code` | satisfied | — | 0 | 146 | yes | yes | — | — | yes |
| `phpstan` | `code` | satisfied | — | 0 | 1392 | yes | yes | — | — | yes |
| `phpunit` | `code` | not applicable | — | — not recorded — | — not recorded — | no | no — not applicable | — | — | — not recorded — |
| `prettier` | `code` | not applicable | — | — not recorded — | — not recorded — | no | no — not applicable | — | — | — not recorded — |
| `stylelint` | `code` | not applicable | — | — not recorded — | — not recorded — | no | no — not applicable | — | — | — not recorded — |
| `house_rules` | `test` | recorded (not blocking) | — | 1 | 0 | yes | no — the tool never spawned (`duration_ms: 0`) | — | — | unknown |
| `parity` | `test` | BLOCKED | environment | — not recorded — | — not recorded — | yes | no — BLOCKED | — | — | — not recorded — |
| `playwright` | `test` | satisfied | — | 0 | 7974 | yes | yes | — | — | unknown |

**13 gates adjudicated. 4 measured something.** That second number
is the INPUT to §6's V score, and it is not the score: a gate that
could not have failed scores zero whatever its status, and no column
here knows what a gate was pointed at.

**2 of 13 verdicts could be re-measured against the tree as it now
stands; 0 had expired.** An expired verdict was green about code that
has since moved, which is not a green now. The rest had no resolvable
subject to fingerprint, which is not the same as unchanged.

### Earlier attempts

The store is append-only: a retried gate gets a new row rather than
overwriting the one it failed on. This is the feedback loop, with
what it corrected. Gates that never ran in any attempt — off, or no
site to ask — are not retries and are not listed here.

- `house_rules` in `test` — 2 attempts, ending recorded (not blocking):
  - attempt 1 — recorded (not blocking) (—), exit 1, 0 ms: report — house_rules — 1 break(s) of the house rules (HR1): web/themes/custom/kchockey/templates/page.html.twig (HR1)
- `parity` in `test` — 2 attempts, ending BLOCKED:
  - attempt 1 — BLOCKED (environment), exit — not recorded —, — not recorded — ms: could not run: /var/www/html/vendor/bin/droost-parity judge --reference droost/parity --scope frame --json
- `playwright` in `test` — 2 attempts, ending satisfied:
  - attempt 1 — satisfied (—), exit 0, 7974 ms: playwright passed — 32 passed — ticket scope: 1 file(s) this run changed, not the full suite [the run `droost workflow:specs` recorded at 2026-10-20T22:01:42-05:00, on this tree: not run again]

### Invocations, as recorded

```
# custom:component_lint (code), attempt 1
run droost/gates/component-lint.php

# house_rules (code), attempt 1
house rules: HR1

# phpcs (code), attempt 1
/var/www/html/vendor/bin/phpcs -q --report=json --standard=Drupal --extensions=php,module,install,inc,theme,profile,engine --ignore=*/node_modules/*,*/vendor/*,*/.claude/*,*/droost/droost-workflow/*,*/droost/baseline/*,*/.droost-workflow/* web/modules/custom/kchockey_site/src/Form/SiteDetailsForm.php web/themes/custom/kchockey/kchockey.theme

# phpstan (code), attempt 1
/var/www/html/vendor/bin/phpstan analyse --no-progress --error-format=json --level=1 --memory-limit=1G web/modules/custom/kchockey_site/src/Form/SiteDetailsForm.php web/themes/custom/kchockey/kchockey.theme

# house_rules (test), attempt 1
house rules: HR1

# parity (test), attempt 1
/var/www/html/vendor/bin/droost-parity judge --reference droost/parity --scope frame --json

# playwright (test), attempt 1
/var/www/html/node_modules/.bin/playwright test tests/e2e/r01-frame.spec.ts

```

### Environment blocks, and who may lift them

A block carrying `environment` cannot be satisfied from where the
agent stands. The phase still does not advance — an OPERATOR lifts
it, recorded as `unblocked by the operator`, and the agent may propose
that and never perform it. What `environment` alone carries is a
REMEDY: a command the record prints. A block with any other fault can
also be lifted by the operator — `gate-waive` refuses only the
mandatory trio, and does not consult the fault — but nothing tells
them how, because for those the answer is to change the work. Read a
waiver on an `agent` fault as exactly that: somebody decided to ship
past it, with no remedy printed because there was none to print.

- `parity` (gate) in `test` — could not run: /var/www/html/vendor/bin/droost-parity judge --reference droost/parity --scope frame --json
  - This cannot be fixed from where you are. Show the OPERATOR the remedy below and ask them to run it in their terminal; do not run it yourself and do not retry around it.
  - remedy: `Install parity so the gate can run — `composer require --dev` or `npm install` it, whichever owns it in this project — or, if this project genuinely does not use parity, ask the OPERATOR to turn the gate off in droost/droost.yml (`gates.parity.on: false`). An agent cannot decide either of those.`

### Declarations — what the plan promised

| Kind | Declared | Audited in | State | Fault | Summary |
|---|---|---|---|---|---|
| `file` | 6 | `code` | recorded (not blocking) | — | 6 declared path(s), no undeclared changes. But 7 changed path(s) are covered only by a later re-declaration, not by the first declaration (2026-10-20T21:36:25-05:00): web/modules/custom/kchockey_site/ … (cut) |
| `test` | 1 | `code` | recorded (not blocking) | — | NOT VERIFIED — droost cannot see which tests a suite ran, only that one ran and how many. 1 planned, on record: r01-frame.spec.ts. |
| `type_coverage` | — not recorded — | `code` | satisfied | — | mixed work: phpcs, phpstan all measured something |
| `work_type` | — not recorded — | `code` | satisfied | — | declared "mixed" (mixed); the diff matches |

Three things read as green from a distance and none of them is.
A declared count with no audit is a promise nobody checked. An audit
with nothing declared is a check with nothing to hold the diff to.
And — the common case, so read the rows rather than the states — an
audit that RAN and could not check what it was given: `declared_tests`
is always `recorded`, because droost sees that a suite ran and how many
tests it held, never which ones. Only `declared_files` is audited
against the diff.

Files declared:

- `.gitignore`
- `config/sync`
- `scripts/kch`
- `tests/e2e`
- `web/modules/custom/kchockey_site`
- `web/themes/custom/kchockey`

Tests declared:

- `r01-frame.spec.ts`

### Checks that are neither gates nor declarations

Every attempt, not just the latest — there are few of them and each
one is a thing a phase could not end without.

| Kind | Item | Phase | Attempt | State | Fault | Summary |
|---|---|---|---|---|---|---|
| `check` | `plan_grounded` | `plan` | 1 | satisfied | — | plan looked: 13 knowledge call(s) this run (code:symbol ×10, code:tree ×1, code:wiki ×1, search:arch ×1), and 9 Grounding citation(s) resolve; the code index is ready |
| `recorded_run` | `playwright` | `test` | 1 | satisfied | — | playwright passed — 32 passed — ticket scope: 1 file(s) this run changed, not the full suite |
| `recorded_run` | `playwright` | `test` | 2 | satisfied | — | playwright passed — 32 passed — ticket scope: 1 file(s) this run changed, not the full suite |

## 4a. The tool-call ledger — what droost was ACTUALLY asked

One row per tool result, successes and refusals alike. This is the
only place in the system that is not the subject's account of itself.

| Measure | Value | Reading |
|---|---|---|
| Total calls | 14 | every tool result, successes and refusals alike |
| Distinct tools | 5 | — |
| **Knowledge calls** (the codegraph, search, wiki, introspection and the brief: `KNOWLEDGE_TOOLS`) | 14 | the codebase was reached |
| Refusals (`outcome: fail`) | 0 | each one is a gate that was off, or an argument that was wrong |

### By phase

The JSONL ledger this replaced carried no phase, so its lines could
not be attributed to one from the record alone.

| Phase | Calls | Distinct tools | Knowledge |
|---|---|---|---|
| `code` | 1 | 1 | 1 |
| `plan` | 13 | 4 | 13 |

### Every tool called

| Tool | Calls | Class |
|---|---|---|
| `code:symbol` | 10 | knowledge |
| `search:code` | 1 | knowledge |
| `code:tree` | 1 | knowledge |
| `code:wiki` | 1 | knowledge |
| `search:arch` | 1 | knowledge |

What this section still cannot answer, and the template's §4a asks
for: **scaffold-vs-handwritten** (how many added files came from a
blueprint and how many were typed). It needs the diff, which is not in
the store.

## 4b. Grounding — the three tiers, and whether each was reached

**The store holds no grounding rows for this run.** That is not a
verdict on the round's grounding. `plan_grounded` resolves the
spec's table at plan and records its verdict among the checks (§4),
and §4a says whether any knowledge command was called at all. The
two halves fail independently, and a pass on one tells you nothing
about the other.

## 4c. Transcripts — what the tool actually said

What droost parsed is in §4 and §8a. This is what the tool wrote,
which is the only thing that helps when the parse was wrong or the
tool died before producing anything structured.

#### `custom:component_lint` — `code`, attempt 1, `stdout` — satisfied

```

component_lint passed: 9 custom SDC(s) meet Canvas's requirements (19 advisory(ies), which never fail it).

```

#### `phpcs` — `code`, attempt 1, `stdout` — satisfied

```
{"totals":{"errors":0,"warnings":0,"fixable":0},"files":{"\/var\/www\/html\/web\/modules\/custom\/kchockey_site\/src\/Form\/SiteDetailsForm.php":{"errors":0,"warnings":0,"messages":[]},"\/var\/www\/html\/web\/themes\/custom\/kchockey\/kchockey.theme":{"errors":0,"warnings":0,"messages":[]}}}

```

#### `phpstan` — `code`, attempt 1, `stdout` — satisfied

```
{"totals":{"errors":0,"file_errors":0},"files":{},"errors":[]}
```

#### `playwright` — `test`, attempt 1, `stdout` — satisfied

```

Running 32 tests using 7 workers

  ✓   4 [chromium] › tests/e2e/r01-frame.spec.ts:46:11 › AC-1, AC-12: every page answers with the frame and its intro › /camps at 1280px (266ms)
  ✓   6 [chromium] › tests/e2e/r01-frame.spec.ts:46:11 › AC-1, AC-12: every page answers with the frame and its intro › /new-to-hockey at 1280px (263ms)
  ✓   5 [chromium] › tests/e2e/r01-frame.spec.ts:46:11 › AC-1, AC-12: every page answers with the frame and its intro › /adult-leagues at 1280px (265ms)
  ✓   3 [chromium] › tests/e2e/r01-frame.spec.ts:46:11 › AC-1, AC-12: every page answers with the frame and its intro › /rinks at 1280px (302ms)
  ✓   7 [chromium] › tests/e2e/r01-frame.spec.ts:46:11 › AC-1, AC-12: every page answers with the frame and its intro › /private-lessons at 1280px (270ms)
  ✓   2 [chromium] › tests/e2e/r01-frame.spec.ts:46:11 › AC-1, AC-12: every page answers with the frame and its intro › /youth-leagues at 1280px (297ms)
  ✓   1 [chromium] › tests/e2e/r01-frame.spec.ts:46:11 › AC-1

… 2953 of 4953 characters cut from the middle (evidence --full shows them all) …

(543ms)
  ✓  28 [chromium] › tests/e2e/r01-frame.spec.ts:293:7 › AC-11: the not-found page › an unknown address answers 404 inside the frame, linking home (219ms)
  ✓  30 [chromium] › tests/e2e/r01-frame.spec.ts:304:7 › AC-13: reduced motion › the hero does not animate when the visitor prefers reduced motion (242ms)
  ✓  26 [chromium] › tests/e2e/r01-frame.spec.ts:262:7 › AC-9: the home page hero and announcement band › a Content editor may edit the home page in Canvas (346ms)
  ✓  29 [chromium] › tests/e2e/r01-frame.spec.ts:163:7 › AC-5…AC-8: the footer and its sources › AC-5, AC-6: a phone and social addresses show once set (1.5s)
  ✓  31 [chromium] › tests/e2e/r01-frame.spec.ts:183:7 › AC-5…AC-8: the footer and its sources › AC-7: a legal link shows once its page is published (1.1s)
  ✓  32 [chromium] › tests/e2e/r01-frame.spec.ts:200:7 › AC-5…AC-8: the footer and its sources › AC-8: a Content editor changes Site details and a menu link; visitors see both (3.5s)

  32 passed (7.8s)

```

#### `playwright` — `test`, attempt 2, `stdout` — satisfied

```

Running 32 tests using 7 workers

  ✓   6 [chromium] › tests/e2e/r01-frame.spec.ts:46:11 › AC-1, AC-12: every page answers with the frame and its intro › /private-lessons at 1280px (270ms)
  ✓   3 [chromium] › tests/e2e/r01-frame.spec.ts:46:11 › AC-1, AC-12: every page answers with the frame and its intro › /camps at 1280px (271ms)
  ✓   1 [chromium] › tests/e2e/r01-frame.spec.ts:46:11 › AC-1, AC-12: every page answers with the frame and its intro › /adult-leagues at 1280px (294ms)
  ✓   5 [chromium] › tests/e2e/r01-frame.spec.ts:46:11 › AC-1, AC-12: every page answers with the frame and its intro › /youth-leagues at 1280px (296ms)
  ✓   2 [chromium] › tests/e2e/r01-frame.spec.ts:46:11 › AC-1, AC-12: every page answers with the frame and its intro › /rinks at 1280px (349ms)
  ✓   4 [chromium] › tests/e2e/r01-frame.spec.ts:46:11 › AC-1, AC-12: every page answers with the frame and its intro › /new-to-hockey at 1280px (357ms)
  ✓   7 [chromium] › tests/e2e/r01-frame.spec.ts:46:11 › AC-1

… 2954 of 4954 characters cut from the middle (evidence --full shows them all) …

e the frame, linking home (168ms)
  ✓  21 [chromium] › tests/e2e/r01-frame.spec.ts:102:7 › AC-2, AC-3: the header › highlights the page the visitor is on (458ms)
  ✓  26 [chromium] › tests/e2e/r01-frame.spec.ts:262:7 › AC-9: the home page hero and announcement band › a Content editor may edit the home page in Canvas (340ms)
  ✓  30 [chromium] › tests/e2e/r01-frame.spec.ts:304:7 › AC-13: reduced motion › the hero does not animate when the visitor prefers reduced motion (191ms)
  ✓  29 [chromium] › tests/e2e/r01-frame.spec.ts:163:7 › AC-5…AC-8: the footer and its sources › AC-5, AC-6: a phone and social addresses show once set (1.6s)
  ✓  31 [chromium] › tests/e2e/r01-frame.spec.ts:183:7 › AC-5…AC-8: the footer and its sources › AC-7: a legal link shows once its page is published (816ms)
  ✓  32 [chromium] › tests/e2e/r01-frame.spec.ts:200:7 › AC-5…AC-8: the footer and its sources › AC-8: a Content editor changes Site details and a menu link; visitors see both (3.6s)

  32 passed (7.7s)

```

## 4d. The seeker's findings — what an adversarial read caught

**This round was NOT adversarially reviewed.** `seekers` was `off`,
so no inspection was due and none ran. Nothing here read the diff with
intent, asked whether a passing test asserts anything, or checked a
display against the data it will actually meet.

That is a statement about COVERAGE, not about quality. The gates that
ran are in §4 and they measured what they measure. What is missing is
the only reader in the system that judges rather than measures — and
a round has already been observed where five green gates passed over a
display that rendered nothing on an empty optional field, and the
seeker was what caught it.

`seekers: { on: true }` in `droost/droost.yml` is one line, and
`medium` and above turn it on by preset.

## 4e. The declared spec — structure written by a tool call

A declared row cannot be mis-shaped. Each line below is a tool call
that happened, and the engine's question about it is a count — not
whether a heading sat in the right place or whether a list was
fenced.

### Routes declared

| Path | Declared at | Why |
|---|---|---|
| `/` | `code` | — not recorded — |
| `/camps` | `code` | — not recorded — |
| `/rinks` | `code` | — not recorded — |
| `/private-lessons` | `code` | — not recorded — |
| `/new-to-hockey` | `code` | — not recorded — |
| `/youth-leagues` | `code` | — not recorded — |
| `/adult-leagues` | `code` | — not recorded — |
| `/contact` | `code` | — not recorded — |
| `/page-not-found` | `code` | — not recorded — |
| `/terms-of-service@403` | `code` | "unpublished until staff write it" |
| `/privacy-policy@403` | `code` | "unpublished until staff write it" |

### Criteria declared, and what proves each

| Ref | Statement | Proven by | Wordings |
|---|---|---|---|
| `AC-1` | "When a visitor opens /, /camps, /rinks, /private-lessons, /new-to-hockey, /youth-leagues, /adult-leagues or /contact, the site shall answer 200 with the header and footer as the source shows them at  … (cut) | "tests/e2e/r01-frame.spec.ts: AC-1/AC-12 — 16 tests: each of the 8 pages answers 200 with header and footer at 1280 and 390, no sideways scroll; droost-parity judge --scope frame: as the reference at  … (cut) | 1 |
| `AC-2` | "The header shall show the KC Hockey mark → /, then Home, Camps & Clinics, Private Lessons, KC Rinks, New to Hockey, Youth Leagues, Adult Leagues, then a "Contact Us" button → /contact, in that order, … (cut) | "tests/e2e/r01-frame.spec.ts: 'mark, main menu in order, and the Contact Us button' and 'stays at the top of the window as the page scrolls' pass" | 1 |
| `AC-3` | "When a visitor is on a page the main menu links to, the header shall highlight that link." | "tests/e2e/r01-frame.spec.ts: 'highlights the page the visitor is on' passes for all 7 main-menu pages" | 1 |
| `AC-4` | "While the window is narrower than 768px, the header shall show a toggle that opens and closes the same links and the Contact Us button." | "tests/e2e/r01-frame.spec.ts: 'a toggle opens and closes the same links and the Contact Us button' (390px, click, Escape) and 'at desktop width the toggle is hidden' pass" | 1 |
| `AC-5` | "The footer shall show the blurb, the six Explore links, "Kansas City, MO / The Hockey Capital of the Midwest", info@kchockey.com as a mail link and "© <current year> KCHockey. All rights reserved.";  … (cut) | "tests/e2e/r01-frame.spec.ts: 'AC-5: blurb, Explore, location, email, copyright, and no phone' and 'AC-5, AC-6: a phone and social addresses show once set' pass" | 1 |
| `AC-6` | "While a social address is empty the footer shall hide that icon; once set, the icon links to it." | "tests/e2e/r01-frame.spec.ts: 'AC-5, AC-6: a phone and social addresses show once set' passes (Instagram shows once set; Facebook and X stay hidden)" | 1 |
| `AC-7` | "While the Privacy Policy or Terms of Service page is unpublished, the footer shall not show its link to visitors; once published, it shall." | "tests/e2e/r01-frame.spec.ts: 'AC-7: a legal link shows once its page is published' passes (publish shows Privacy Policy; unpublish hides it)" | 1 |
| `AC-8` | "When a Content editor changes Site details or a main/footer menu link, the frame shall show the change without a cache clear." | "tests/e2e/r01-frame.spec.ts: 'AC-8: a Content editor changes Site details and a menu link; visitors see both' passes, logged in as a content_editor user, no cache clear" | 1 |
| `AC-9` | "The home page shall open with the hero as the source shows it (badge, two-line heading, paragraph, "Find a Camp" → /camps, "Explore KC Rinks" → /rinks, hero-hockey.jpg) and then the gold band of the  … (cut) | "tests/e2e/r01-frame.spec.ts: 'hero as the source shows it, then the gold band' and 'a Content editor may edit the home page in Canvas' pass" | 1 |
| `AC-10` | "Headings shall draw in Oswald and body text in Inter, served from the site's own address." | "tests/e2e/r01-frame.spec.ts: 'headings in Oswald, text in Inter, both from the site itself' passes (fonts loaded, woff2 from the site origin)" | 1 |
| `AC-11` | "When a visitor opens an address the site does not have, the site shall answer 404 with a not-found page inside the header and footer that links home." | "tests/e2e/r01-frame.spec.ts: 'an unknown address answers 404 inside the frame, linking home' passes" | 1 |
| `AC-12` | "Each of the other seven pages shall show its intro section as the source shows it." | "tests/e2e/r01-frame.spec.ts: AC-1/AC-12 tests check each page's h1, the guide pages' eyebrow and gold line, and the camps photo; droost-parity --pages: intros pass D3-D5 on all 7 inner pages" | 1 |
| `AC-13` | "While a visitor prefers reduced motion, the hero's entrance animation shall not run." | "tests/e2e/r01-frame.spec.ts: 'the hero does not animate when the visitor prefers reduced motion' passes (animation-name none vs kch-fade-up)" | 1 |

**13 declared, 0 with nothing proving them.** A proof is RECORDED,
never judged: `manual — <reason>` is a legitimate answer and is
reported as manual, and whether a named test is a real test is the
suite's business. What this section can say is whether the promise
was made before the proof, which is the one thing a record cannot
survive getting wrong.

## 5. Build verdict

**Not generated, and it must not be.** This section checks the
spec's own EARS acceptance criteria as they behave on a running
site — **verified live, not from the run record**. Generating it
from the run record instead would be exactly the
circularity the template exists to prevent: the run record is the
subject's account of itself, and a verdict derived from it would
agree with the subject by construction, every time, including the
times the subject was wrong.

Fill one row per criterion, against a running site:

| # | Criterion (EARS) | How verified | Result |
|---|---|---|---|

Everything droost knows that bears on this is already above: §4 says
which gates measured anything, §4a says what the agent actually asked
for, §8a says what the gates found. None of it says the thing got
built.

## 6. Score — `S / V / B`

**Not generated.** Three numbers, never collapsed — a product can be
disciplined and useless at once — and not one of them is a query:

- **S** (setup) asks whether a stranger could install droost and build
  one thing with no operator rescue. Zero if this round arranged setup
  in advance. Nothing in the store knows what was arranged.
- **V** (verification) is not §4's count of gates that measured
  something. That count is its input. A gate that could not have
  failed scores zero whatever its status, and whether a gate could
  have failed is a judgement about what it was pointed at.
- **B** (build) rests on §5, which is not generated for the reason
  given there.

| Axis | Score | Basis |
|---|---|---|
| **S** setup | `/10` | Could a stranger install it and build one thing with no operator rescue? **Zero if this round arranged setup in advance.** |
| **V** verification | `/10` | Of the gates claiming green, how many measured something (§4)? A gate that could not have failed scores zero whatever its status. |
| **B** build | `/10` | Did the requested thing get built, correctly, against §5? |

Comparable only to a round at the same preset, install shape and §2.

---

## 7a. Enforcement — was the hook there, and did it fire

Rows the GUARD wrote about itself, ingested at phase close. This is the
one thing the record could not show before: `enforcement` in §1 is the
level somebody requested, and the status document's `effective` is
inferred from the host the session declared — a claim about a claim.
These are invocations.

| Mode | Verdict | Rule | Calls |
|---|---|---|---|
| `operator-commands` | allow | — | 127 |
| `pre-tool-use` | allow | — | 35 |
| `nudge` | allow | `traverse` | 7 |
| `nudge` | note | `traverse:noted` | 1 |
| `operator-commands` | refuse | `operator-command:script-written-here` | 1 |
| `operator-commands` | refuse | `protected-path:shell` | 1 |
| `pre-tool-use` | refuse | `protected-path:editor` | 1 |

**173 invocation(s), 3 refusal(s), 0 nudge(s).** The hook was
demonstrably live, so `soft` in §1 describes something that was actually
there.

**Every row says what the guard decided.** Each refusal left
through the guard's one blocking exit and names the wall that refused
it; a `nudge` is a soft wall that let the call through, counted on
every hit and not only the first; `allow` means nothing objected. The
counts above are totals.

## 7. Observability — the entire chain

**Not generated.** The chain's links are observed while the round runs
— a guard refusal on a custom write, a tool refusal's text, an
artefact on disk — and a store written by droost can only report the
links droost itself is on. Link 8 in particular (`phases`) is
subject-written by design, and corroborating it is the evaluator's
job.

Fill §7.1, §7.2 and §7.3 from `.claude/templates/evaluation.md`. Two of
its blind spots are now lit and should be answered from above rather
than listed as dark: knowledge-layer usage is §4a, and tool refusals
are the refusal count in §4a. Enforcement effectiveness — the largest
of them, and dark in every round to date — is §7a: whether the hook
was there at all is now a row rather than an assumption, and each
refusal names the wall that made it. §7a says whether its counts are
totals or, for rows an older guard wrote, a floor.

---

## 8. Findings

Two different things share this heading in the template, and only one
of them is a row. They are split here so the more valuable one is not
quietly retired by the one that generates itself.

### 8a. Check findings — what the run's checks found in the code


#### `house_rules` — `code`, attempt 1 — recorded (not blocking) (—), 1 finding

| # | File | Line | Rule | Message | Detail |
|---|---|---|---|---|---|
| 0 | `web/themes/custom/kchockey/templates/page.html.twig` | 0 | `HR1` | HR1: markup outside a single-directory component (no *.component.yml beside it) | {"detail":"warning"} |

#### `house_rules` — `test`, attempt 1 — recorded (not blocking) (—), 1 finding — **superseded** by attempt 2 (recorded (not blocking))

| # | File | Line | Rule | Message | Detail |
|---|---|---|---|---|---|
| 0 | `web/themes/custom/kchockey/templates/page.html.twig` | 0 | `HR1` | HR1: markup outside a single-directory component (no *.component.yml beside it) | {"detail":"warning"} |

#### `house_rules` — `test`, attempt 2 — recorded (not blocking) (—), 1 finding

| # | File | Line | Rule | Message | Detail |
|---|---|---|---|---|---|
| 0 | `web/themes/custom/kchockey/templates/page.html.twig` | 0 | `HR1` | HR1: markup outside a single-directory component (no *.component.yml beside it) | {"detail":"warning"} |

#### `playwright` — `test`, attempt 1 — satisfied (—), 1 finding — **superseded** by attempt 2 (satisfied)

| # | File | Line | Rule | Message | Detail |
|---|---|---|---|---|---|
| 0 | — not recorded — | — not recorded — | — not recorded — | — not recorded — | {"key":"totals","detail":{"passed":32,"failed":0,"flaky":0,"skipped":0,"interrupted":0,"did not run":0}} |

#### `playwright` — `test`, attempt 1 — satisfied (—), 1 finding — **superseded** by attempt 2 (satisfied)

| # | File | Line | Rule | Message | Detail |
|---|---|---|---|---|---|
| 0 | — not recorded — | — not recorded — | — not recorded — | — not recorded — | {"key":"totals","detail":{"passed":32,"failed":0,"flaky":0,"skipped":0,"interrupted":0,"did not run":0}} |

#### `playwright` — `test`, attempt 2 — satisfied (—), 1 finding

| # | File | Line | Rule | Message | Detail |
|---|---|---|---|---|---|
| 0 | — not recorded — | — not recorded — | — not recorded — | — not recorded — | {"key":"totals","detail":{"passed":32,"failed":0,"flaky":0,"skipped":0,"interrupted":0,"did not run":0}} |

#### `playwright` — `test`, attempt 2 — satisfied (—), 1 finding

| # | File | Line | Rule | Message | Detail |
|---|---|---|---|---|---|
| 0 | — not recorded — | — not recorded — | — not recorded — | — not recorded — | {"key":"totals","detail":{"passed":32,"failed":0,"flaky":0,"skipped":0,"interrupted":0,"did not run":0}} |

### 8b. Round findings — what this round found in droost

**Not generated.** These are defects the ROUND exposed in the product,
and there is no table anywhere that holds them: finding one is the
reading, not the record. Nothing above can be promoted into this
section — a gate finding is droost working.

| # | Finding | Evidence (`file:line` / command + output) | Severity | Fixed at source? |
|---|---|---|---|---|

> A finding names a file and line, or a command and its output, or a
> field in a recorded artefact. "The agent said it passed" is not
> evidence — it is the thing under test.
