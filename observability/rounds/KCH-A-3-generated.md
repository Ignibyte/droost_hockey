# Evaluation — `run-68867d04c61b`

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
| Round | `run-68867d04c61b` | measured |
| Started (as recorded) | `2026-10-21T04:14:09+00:00` | reported |
| Preset | `low` | reported |
| Mode | `agentic` | reported |
| Enforcement (requested) | `soft` | reported |
| Base commit | `469cb3858660e02444904f91e94f8e589158d2f0` | reported |
| Spec | `droost/droost-workflow/tmp-spec-r01-theme-frame.md` | reported |
| Frozen-sections hash | `15fc7778cc81ed0be3f6a4025ab2a457` | hashed by droost, over the file run.json names |
| Spec frozen at | `2026-10-21T04:19:59+00:00` | droost's clock, at plan exit |
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
| `parity` | `test` | 2 | satisfied |
| `coverage` | `code` | 1 | not applicable |
| `house_rules` | `code, test` | 2 | recorded (not blocking) |
| `wiki_fresh` | `complete` | 1 | not applicable |
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
| `custom:component_lint` | `code` | satisfied | — | 0 | 5964 | yes | yes | — | — | unknown |
| `eslint` | `code` | not applicable | — | — not recorded — | — not recorded — | no | no — not applicable | — | — | — not recorded — |
| `house_rules` | `code` | recorded (not blocking) | — | 1 | 0 | yes | no — the tool never spawned (`duration_ms: 0`) | — | — | unknown |
| `mutation` | `code` | not applicable | — | — not recorded — | — not recorded — | no | no — not applicable | — | — | — not recorded — |
| `phpcs` | `code` | satisfied | — | 0 | 322 | yes | yes | — | — | unknown |
| `phpstan` | `code` | satisfied | — | 0 | 11858 | yes | yes | — | — | unknown |
| `phpunit` | `code` | not applicable | — | — not recorded — | — not recorded — | no | no — not applicable | — | — | — not recorded — |
| `prettier` | `code` | not applicable | — | — not recorded — | — not recorded — | no | no — not applicable | — | — | — not recorded — |
| `stylelint` | `code` | not applicable | — | — not recorded — | — not recorded — | no | no — not applicable | — | — | — not recorded — |
| `house_rules` | `test` | recorded (not blocking) | — | 1 | 0 | yes | no — the tool never spawned (`duration_ms: 0`) | — | — | unknown |
| `parity` | `test` | satisfied | — | 0 | 36571 | yes | yes | — | — | unknown |
| `playwright` | `test` | satisfied | — | 0 | 133854 | yes | yes | — | — | unknown |
| `wiki_fresh` | `complete` | not applicable | — | — not recorded — | — not recorded — | no | no — not applicable | — | — | — not recorded — |

**14 gates adjudicated. 5 measured something.** That second number
is the INPUT to §6's V score, and it is not the score: a gate that
could not have failed scores zero whatever its status, and no column
here knows what a gate was pointed at.

**No verdict here could be checked for expiry.** No gate recorded
a subject: each was off, could not run here, or discovers its own
paths from a config file this record cannot read (a `phpstan.neon`,
a ruleset with `<file>` entries). A gate that ran against paths
droost chose records them, and a `paths` lever records itself.
Treat every green above as unverified against the tree as it now
stands.

### Earlier attempts

The store is append-only: a retried gate gets a new row rather than
overwriting the one it failed on. This is the feedback loop, with
what it corrected. Gates that never ran in any attempt — off, or no
site to ask — are not retries and are not listed here.

- `house_rules` in `test` — 2 attempts, ending recorded (not blocking):
  - attempt 1 — recorded (not blocking) (—), exit 1, 0 ms: report — house_rules — 1 break(s) of the house rules (HR1): web/themes/custom/kchockey/templates/page.html.twig (HR1)
- `parity` in `test` — 2 attempts, ending satisfied:
  - attempt 1 — BLOCKED (environment), exit 2, — not recorded — ms: parity could not run (exit 2): no site to read: pass --base, or set DROOST_PARITY_BASE_URL — the site could not be judged against its reference; read the routes named
- `playwright` in `test` — 2 attempts, ending satisfied:
  - attempt 1 — satisfied (—), exit 0, 133854 ms: playwright passed — 29 passed — ticket scope: 1 file(s) this run changed, not the full suite [the run `droost workflow:specs` recorded at 2026-10-21T05:24:11+00:00, on this tree: not run again]

### Invocations, as recorded

```
# custom:component_lint (code), attempt 1
run droost/gates/component-lint.php

# house_rules (code), attempt 1
house rules: HR1

# phpcs (code), attempt 1
<site>/vendor/bin/phpcs -q --report=json --standard=Drupal --extensions=php,module,install,inc,theme,profile,engine --ignore=*/node_modules/*,*/vendor/*,*/.claude/*,*/droost/droost-workflow/*,*/droost/baseline/*,*/.droost-workflow/* web/modules/custom/kchockey_site/src/Form/SiteDetailsForm.php web/themes/custom/kchockey/kchockey.theme

# phpstan (code), attempt 1
<site>/vendor/bin/phpstan analyse --no-progress --error-format=json --level=1 --memory-limit=1G web/modules/custom/kchockey_site/src/Form/SiteDetailsForm.php web/themes/custom/kchockey/kchockey.theme

# house_rules (test), attempt 1
house rules: HR1

# parity (test), attempt 1
<site>/tools/droost/vendor/droost/workflow/bin/droost-parity judge --reference droost/parity --scope frame --json

# playwright (test), attempt 1
<site>/node_modules/.bin/playwright test tests/e2e/r01-frame.spec.ts

```

### Declarations — what the plan promised

| Kind | Declared | Audited in | State | Fault | Summary |
|---|---|---|---|---|---|
| `file` | 5 | `complete` | satisfied | — | 5 declared path(s), no undeclared changes |
| `test` | 1 | `test` | recorded (not blocking) | — | NOT VERIFIED — droost cannot see which tests a suite ran, only that one ran and how many. 1 planned, on record: tests/e2e/r01-frame.spec.ts. |
| `type_coverage` | — not recorded — | `test` | not applicable | — | mixed work rests on phpcs, phpstan, phpunit, and none of them could produce a measurement here — turned off by the level, unreachable on this surface, or waived by the operator. Nothing in this phase  … (cut) |
| `work_type` | — not recorded — | `complete` | satisfied | — | declared "mixed" (mixed); the diff matches |

Three things read as green from a distance and none of them is.
A declared count with no audit is a promise nobody checked. An audit
with nothing declared is a check with nothing to hold the diff to.
And — the common case, so read the rows rather than the states — an
audit that RAN and could not check what it was given: `declared_tests`
is always `recorded`, because droost sees that a suite ran and how many
tests it held, never which ones. Only `declared_files` is audited
against the diff.

Files declared:

- `config/sync`
- `scripts/kch`
- `tests/e2e/r01-frame.spec.ts`
- `web/modules/custom/kchockey_site`
- `web/themes/custom/kchockey`

Tests declared:

- `tests/e2e/r01-frame.spec.ts`

### Checks that are neither gates nor declarations

Every attempt, not just the latest — there are few of them and each
one is a thing a phase could not end without.

| Kind | Item | Phase | Attempt | State | Fault | Summary |
|---|---|---|---|---|---|---|
| `check` | `plan_grounded` | `plan` | 1 | satisfied | — | plan looked: 3 knowledge call(s) this run (code:tree ×1, code:wiki ×2), and 10 Grounding citation(s) resolve (2 more do not); the code index is ready |
| `recorded_run` | `playwright` | `test` | 1 | satisfied | — | playwright passed — 29 passed — ticket scope: 1 file(s) this run changed, not the full suite |
| `spec` | `frozen_sections` | `test` | 1 | recorded (not blocking) | — | 1 frozen-section change(s) since the plan froze the spec, recorded and not blocking. What the run DID is in the gates and the ledger; the ledger in particular cannot be rewritten by the agent. |
| `spec` | `frozen_sections` | `test` | 2 | recorded (not blocking) | — | 1 frozen-section change(s) since the plan froze the spec, recorded and not blocking. What the run DID is in the gates and the ledger; the ledger in particular cannot be rewritten by the agent. |
| `spec` | `criteria_table` | `complete` | 1 | satisfied | — | 16 criteria were declared this run and are counted by their declared proofs (16 verified by a test, 0 manual, 0 unverified); the spec's table does not count them. The spec's table has 16 row(s) with m … (cut) |
| `spec` | `frozen_sections` | `complete` | 1 | recorded (not blocking) | — | 1 frozen-section change(s) since the plan froze the spec, recorded and not blocking. What the run DID is in the gates and the ledger; the ledger in particular cannot be rewritten by the agent. |

## 4a. The tool-call ledger — what droost was ACTUALLY asked

One row per tool result, successes and refusals alike. This is the
only place in the system that is not the subject's account of itself.

| Measure | Value | Reading |
|---|---|---|
| Total calls | 4 | every tool result, successes and refusals alike |
| Distinct tools | 3 | — |
| **Knowledge calls** (the codegraph, search, wiki, introspection and the brief: `KNOWLEDGE_TOOLS`) | 4 | the codebase was reached |
| Refusals (`outcome: fail`) | 0 | each one is a gate that was off, or an argument that was wrong |

### By phase

The JSONL ledger this replaced carried no phase, so its lines could
not be attributed to one from the record alone.

| Phase | Calls | Distinct tools | Knowledge |
|---|---|---|---|
| `code` | 1 | 1 | 1 |
| `plan` | 3 | 2 | 3 |

### Every tool called

| Tool | Calls | Class |
|---|---|---|
| `code:wiki` | 2 | knowledge |
| `code:symbol` | 1 | knowledge |
| `code:tree` | 1 | knowledge |

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

component_lint passed: 9 custom SDC(s) meet Canvas's requirements (2 advisory(ies), which never fail it).

```

#### `phpcs` — `code`, attempt 1, `stdout` — satisfied

```
{"totals":{"errors":0,"warnings":0,"fixable":0},"files":{"<site>\/web\/modules\/custom\/kchockey_site\/src\/Form\/SiteDetailsForm.php":{"errors":0,"warnings":0,"messages":[]},"<site>\/web\/themes\/custom\/kchockey\/kchockey.theme":{"errors":0,"warnings":0,"messages":[]}}}

```

#### `phpstan` — `code`, attempt 1, `stdout` — satisfied

```
{"totals":{"errors":0,"file_errors":0},"files":{},"errors":[]}
```

#### `parity` — `test`, attempt 1, `stdout` — BLOCKED

```
{"parity":{"status":"invalid","summary":"no site to read: pass --base, or set DROOST_PARITY_BASE_URL"}}

```

#### `parity` — `test`, attempt 2, `stdout` — satisfied

```
{"parity":{"status":"pass","scope":"frame","source":"http://localhost:5199","summary":"16 view(s) (8 route(s) at 1280 and 390px) as the reference against http://localhost:5199 (captured 2026-10-21T02:09:29.306Z) (D1–D7, frame scope); set aside by decision: \"(816) 555-0199\" on * (Q7), \"Privacy Policy\" on * (Q8), \"Terms of Service\" on * (Q8), \"Visit Website\" on /rinks (Q3), \"(913) 555-0101\" on /rinks (Q3), \"(816) 555-0202\" on /rinks (Q3), \"(816) 555-0303\" on /rinks (Q3), \"(816) 555-0404\" on /rinks (Q3), \"(913) 555-0505\" on /rinks (Q3), \"(816) 555-0606\" on /rinks (Q3), \"(816) 555-0707\" on /rinks (Q3), \"(816) 555-0808\" on /rinks (Q3)","routes":[{"route":"/","view":"/","width":1280,"scope":"frame","verdict":"PASS","failing":[]},{"route":"/","view":"/@390","width":390,"scope":"frame","verdict":"PASS","failing":[]},{"route":"/rinks","view":"/rinks","width":1280,"scope":"frame","verdict":"PASS","failing":[]},{"route":"/rinks","view":"/rinks@390","width":390,"scope":"fra

… 1916 of 3916 characters cut from the middle (evidence --full shows them all) …

decided":"Q3","why":"a placeholder rink phone, left empty until the real one is sent"},{"route":"/rinks","text":"(816) 555-0202","decided":"Q3","why":"a placeholder rink phone, left empty until the real one is sent"},{"route":"/rinks","text":"(816) 555-0303","decided":"Q3","why":"a placeholder rink phone, left empty until the real one is sent"},{"route":"/rinks","text":"(816) 555-0404","decided":"Q3","why":"a placeholder rink phone, left empty until the real one is sent"},{"route":"/rinks","text":"(913) 555-0505","decided":"Q3","why":"a placeholder rink phone, left empty until the real one is sent"},{"route":"/rinks","text":"(816) 555-0606","decided":"Q3","why":"a placeholder rink phone, left empty until the real one is sent"},{"route":"/rinks","text":"(816) 555-0707","decided":"Q3","why":"a placeholder rink phone, left empty until the real one is sent"},{"route":"/rinks","text":"(816) 555-0808","decided":"Q3","why":"a placeholder rink phone, left empty until the real one is sent"}]}}

```

#### `playwright` — `test`, attempt 1, `stderr` — satisfied

```
 [success] Added content_editor role to r01_editor

```

#### `playwright` — `test`, attempt 1, `stdout` — satisfied

```

Running 29 tests using 1 worker

  ✓   1 [chromium] › tests/e2e/r01-frame.spec.ts:103:9 › AC-1: / answers 200 with the header and footer at 1280px (403ms)
  ✓   2 [chromium] › tests/e2e/r01-frame.spec.ts:103:9 › AC-1: /camps answers 200 with the header and footer at 1280px (88ms)
  ✓   3 [chromium] › tests/e2e/r01-frame.spec.ts:103:9 › AC-1: /rinks answers 200 with the header and footer at 1280px (87ms)
  ✓   4 [chromium] › tests/e2e/r01-frame.spec.ts:103:9 › AC-1: /private-lessons answers 200 with the header and footer at 1280px (81ms)
  ✓   5 [chromium] › tests/e2e/r01-frame.spec.ts:103:9 › AC-1: /new-to-hockey answers 200 with the header and footer at 1280px (76ms)
  ✓   6 [chromium] › tests/e2e/r01-frame.spec.ts:103:9 › AC-1: /youth-leagues answers 200 with the header and footer at 1280px (80ms)
  ✓   7 [chromium] › tests/e2e/r01-frame.spec.ts:103:9 › AC-1: /adult-leagues answers 200 with the header and footer at 1280px (78ms)
  ✓   8 [chromium] › tests/e2e/r01-frame.spec.ts:103:9

… 1943 of 3943 characters cut from the middle (evidence --full shows them all) …

 is published (16.4s)
  ✓  23 [chromium] › tests/e2e/r01-frame.spec.ts:252:5 › AC-10: a Content editor adds, renames and reorders main and footer menu links (23.0s)
  ✓  24 [chromium] › tests/e2e/r01-frame.spec.ts:298:5 › AC-11: the home page opens with the hero, then the gold ticker (82ms)
  ✓  25 [chromium] › tests/e2e/r01-frame.spec.ts:318:5 › AC-12: the hero and the ticker are Canvas props a Content editor can change (43.9s)
  ✓  26 [chromium] › tests/e2e/r01-frame.spec.ts:349:5 › AC-13: with reduced motion the entrance animations and the ticker do not move (1.5s)
  ✓  27 [chromium] › tests/e2e/r01-frame.spec.ts:376:5 › AC-14: headings in Oswald and text in Inter, both served by the site (101ms)
  ✓  28 [chromium] › tests/e2e/r01-frame.spec.ts:392:5 › AC-15: an unknown address answers 404 with the not-found page inside the frame (133ms)
  ✓  29 [chromium] › tests/e2e/r01-frame.spec.ts:403:5 › AC-16: each other page shows its intro as the source draws it (426ms)

  29 passed (2.2m)

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
| `/` | `plan` | home: hero and ticker |
| `/camps` | `plan` | shell with its intro |
| `/rinks` | `plan` | shell with its intro |
| `/private-lessons` | `plan` | shell with its intro |
| `/new-to-hockey` | `plan` | shell with its intro |
| `/youth-leagues` | `plan` | shell with its intro |
| `/adult-leagues` | `plan` | shell with its intro |
| `/contact` | `plan` | shell with its intro |
| `/page-not-found` | `plan` | the site's 404 page |
| `/admin/config/system/site-details@403` | `plan` | Site details form, staff only |
| `/privacy-policy@404` | `plan` | unpublished until staff write it |
| `/terms-of-service@404` | `plan` | unpublished until staff write it |

### Criteria declared, and what proves each

| Ref | Statement | Proven by | Wordings |
|---|---|---|---|
| `AC-1` | When a visitor opens /, /camps, /rinks, /private-lessons, /new-to-hockey, /youth-leagues, /adult-leagues or /contact, the site shall answer 200 with the header and footer as the source shows them, at  … (cut) | tests/e2e/r01-frame.spec.ts › AC-1 (16 tests: 8 routes × 1280/390, 200 + header + footer, no sideways scroll); droost-parity judge --scope frame: 16/16 views pass D1–D7 | 1 |
| `AC-2` | The header shall show the KC Hockey mark linking to /, then Home, Camps & Clinics, Private Lessons, KC Rinks, New to Hockey, Youth Leagues, Adult Leagues, then a "Contact Us" button to /contact, in th … (cut) | tests/e2e/r01-frame.spec.ts › AC-2: mark → /, the seven links then Contact Us → /contact in order; position sticky, header at y=0 after scrolling 800px | 1 |
| `AC-3` | When a visitor is on a page the main menu links to, the header shall highlight that link. | tests/e2e/r01-frame.spec.ts › AC-3: on each of the seven pages exactly its link has aria-current=page in gold; none on /contact | 1 |
| `AC-4` | While the window is narrower than 768px, the header shall show a menu toggle that opens and closes the same links and the Contact Us button. | tests/e2e/r01-frame.spec.ts › AC-4 (browser at 390px): toggle opens/closes the panel with the 7 links + Contact Us, Escape closes; toggle hidden at 1280 | 1 |
| `AC-5` | The footer shall show the blurb, the Explore links (Camps & Clinics, Private Lessons, KC Rink Directory, New to Hockey, Youth Leagues, Adult Leagues), "Kansas City, MO / The Hockey Capital of the Midw … (cut) | tests/e2e/r01-frame.spec.ts › AC-5: blurb, Explore labels and targets in order, location lines, mailto link, © current year KCHockey line | 1 |
| `AC-6` | While the Site details phone is empty the footer shall show no phone; when staff enter one, the footer shall show it as a call link. | tests/e2e/r01-frame.spec.ts › AC-6, AC-7, AC-9: no tel link at launch; editor sets (816) 555-0100 → tel:+18165550100 link; cleared → gone | 1 |
| `AC-7` | While a social address is empty the footer shall hide that icon; when staff set it, the icon shall link to it. | tests/e2e/r01-frame.spec.ts › AC-6, AC-7, AC-9: no social icons at launch; editor sets Instagram → only that icon, linking to it; cleared → gone | 1 |
| `AC-8` | While the Privacy Policy or Terms of Service page is unpublished the footer shall not show its link to visitors; when staff publish it, the link shall show. | tests/e2e/r01-frame.spec.ts › AC-8: no legal link at launch (both pages unpublished); Terms published → its link shows; unpublished → gone | 1 |
| `AC-9` | When a Content editor changes the blurb, email, phone, location or a social address in Site details, the footer shall show the change. | tests/e2e/r01-frame.spec.ts › AC-6, AC-7, AC-9: a Content editor saves blurb, email, phone, location line and Instagram in the Site details form; a fresh visitor sees each | 1 |
| `AC-10` | When a Content editor adds, renames or reorders a main or footer menu link, the header or footer shall show the change. | tests/e2e/r01-frame.spec.ts › AC-10: a Content editor renames a main link, renames+reorders a footer link, adds a footer link through the menu UI; header and footer show each | 1 |
| `AC-11` | The home page shall open with the hero as the source shows it ("The Heart of KC Hockey", "Kansas City's Ice Headquarters", the paragraph, "Find a Camp" → /camps, "Explore KC Rinks" → /rinks, on hero-h … (cut) | tests/e2e/r01-frame.spec.ts › AC-11: badge, two-line heading, paragraph, Find a Camp → /camps, Explore KC Rinks → /rinks, hero-hockey.jpg background; next section the gold ticker with the three announ … (cut) | 1 |
| `AC-12` | When a Content editor edits the hero's or the ticker's text in Canvas, the home page shall show it. | tests/e2e/r01-frame.spec.ts › AC-12: the editor opens /canvas/editor/canvas_page/1 (200), home_hero and ticker enabled in the library; a change to their props in the page's tree shows on /. Not proven … (cut) | 1 |
| `AC-13` | While a visitor prefers reduced motion, the ticker and the entrance animations shall not move. | tests/e2e/r01-frame.spec.ts › AC-13: without the preference the hero animates (kch-rise); with reduced motion every entrance animation is none on /, /new-to-hockey, /youth-leagues, /adult-leagues and  … (cut) | 1 |
| `AC-14` | Headings shall draw in Oswald and body text in Inter, served by the site itself. | tests/e2e/r01-frame.spec.ts › AC-14: h1 Oswald, text Inter, both faces loaded, every font request same-origin, none to Google | 1 |
| `AC-15` | When a visitor opens an address the site does not have, the site shall answer 404 with a not-found page in the site's style, inside the header and footer, linking home. | tests/e2e/r01-frame.spec.ts › AC-15: /no-such-page-r01 answers 404 with the not_found band (navy), Back to Home → /, inside header and footer | 1 |
| `AC-16` | Each of the other seven pages shall show its intro section as the source shows it (heading, eyebrow, text, background). | tests/e2e/r01-frame.spec.ts › AC-16: each of the seven intros: heading, eyebrow where the source has one, text, background colour, camps-drills.jpg on /camps; screenshots compared with the source's ma … (cut) | 1 |

**16 declared, 0 with nothing proving them.** A proof is RECORDED,
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
| `operator-commands` | allow | — | 132 |
| `pre-tool-use` | allow | — | 58 |
| `nudge` | allow | `traverse` | 6 |
| `nudge` | note | `traverse:noted` | 2 |

**198 invocation(s), 0 refusal(s), 0 nudge(s).** The hook was
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

#### `frozen_sections` — `complete`, attempt 1 — recorded (not blocking) (—), 1 finding

| # | File | Line | Rule | Message | Detail |
|---|---|---|---|---|---|
| 0 | — not recorded — | — not recorded — | `spec_freeze.drift` | ## Acceptance criteria (16 row(s) removed or rewritten; frozen as "AC-1\|When a visitor opens /, /camps, /rinks, /private-lessons, /new-to-hockey, /youth-lea…", "AC-2\|The header shall show the KC Hoc … (cut) | — not recorded — |

#### `frozen_sections` — `test`, attempt 1 — recorded (not blocking) (—), 1 finding — **superseded** by attempt 2 (recorded (not blocking))

| # | File | Line | Rule | Message | Detail |
|---|---|---|---|---|---|
| 0 | — not recorded — | — not recorded — | `spec_freeze.drift` | ## Acceptance criteria (16 row(s) removed or rewritten; frozen as "AC-1\|When a visitor opens /, /camps, /rinks, /private-lessons, /new-to-hockey, /youth-lea…", "AC-2\|The header shall show the KC Hoc … (cut) | — not recorded — |

#### `frozen_sections` — `test`, attempt 2 — recorded (not blocking) (—), 1 finding

| # | File | Line | Rule | Message | Detail |
|---|---|---|---|---|---|
| 0 | — not recorded — | — not recorded — | `spec_freeze.drift` | ## Acceptance criteria (16 row(s) removed or rewritten; frozen as "AC-1\|When a visitor opens /, /camps, /rinks, /private-lessons, /new-to-hockey, /youth-lea…", "AC-2\|The header shall show the KC Hoc … (cut) | — not recorded — |

#### `house_rules` — `test`, attempt 1 — recorded (not blocking) (—), 1 finding — **superseded** by attempt 2 (recorded (not blocking))

| # | File | Line | Rule | Message | Detail |
|---|---|---|---|---|---|
| 0 | `web/themes/custom/kchockey/templates/page.html.twig` | 0 | `HR1` | HR1: markup outside a single-directory component (no *.component.yml beside it) | {"detail":"warning"} |

#### `house_rules` — `test`, attempt 2 — recorded (not blocking) (—), 1 finding

| # | File | Line | Rule | Message | Detail |
|---|---|---|---|---|---|
| 0 | `web/themes/custom/kchockey/templates/page.html.twig` | 0 | `HR1` | HR1: markup outside a single-directory component (no *.component.yml beside it) | {"detail":"warning"} |

#### `playwright` — `test`, attempt 1 — satisfied (—), 1 finding

| # | File | Line | Rule | Message | Detail |
|---|---|---|---|---|---|
| 0 | — not recorded — | — not recorded — | — not recorded — | — not recorded — | {"key":"totals","detail":{"passed":29,"failed":0,"flaky":0,"skipped":0,"interrupted":0,"did not run":0}} |

#### `playwright` — `test`, attempt 1 — satisfied (—), 1 finding — **superseded** by attempt 2 (satisfied)

| # | File | Line | Rule | Message | Detail |
|---|---|---|---|---|---|
| 0 | — not recorded — | — not recorded — | — not recorded — | — not recorded — | {"key":"totals","detail":{"passed":29,"failed":0,"flaky":0,"skipped":0,"interrupted":0,"did not run":0}} |

#### `playwright` — `test`, attempt 2 — satisfied (—), 1 finding

| # | File | Line | Rule | Message | Detail |
|---|---|---|---|---|---|
| 0 | — not recorded — | — not recorded — | — not recorded — | — not recorded — | {"key":"totals","detail":{"passed":29,"failed":0,"flaky":0,"skipped":0,"interrupted":0,"did not run":0}} |

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
