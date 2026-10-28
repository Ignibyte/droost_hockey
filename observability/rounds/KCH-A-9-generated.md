# Evaluation — `run-4aa2963e9597`

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
| Round | `run-4aa2963e9597` | measured |
| Started (as recorded) | `2026-10-21T10:25:24+00:00` | reported |
| Preset | `low` | reported |
| Mode | `agentic` | reported |
| Enforcement (requested) | `soft` | reported |
| Base commit | `20d32d17ed8ea94028d31260965931c5ce58450f` | reported |
| Spec | `droost/droost-workflow/tmp-spec-r07-leagues.md` | reported |
| Frozen-sections hash | `a17399a2bec9181827f2d2cdce3552df` | hashed by droost, over the file run.json names |
| Spec frozen at | `2026-10-21T10:27:39+00:00` | droost's clock, at plan exit |
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
| `playwright` | `test` | 1 | satisfied |
| `parity` | `test` | 1 | satisfied |
| `coverage` | `code` | 1 | not applicable |
| `house_rules` | `code, test` | 1 | satisfied |
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
| `custom:component_lint` | `code` | satisfied | — | 0 | 6047 | yes | yes | — | — | unknown |
| `eslint` | `code` | not applicable | — | — not recorded — | — not recorded — | no | no — not applicable | — | — | — not recorded — |
| `house_rules` | `code` | satisfied | — | 0 | 3 | yes | yes | — | — | unknown |
| `mutation` | `code` | not applicable | — | — not recorded — | — not recorded — | no | no — not applicable | — | — | — not recorded — |
| `phpcs` | `code` | satisfied | — | 0 | 0 | yes | no — the tool ran and examined nothing (a labeled pass) | — | — | unknown |
| `phpstan` | `code` | satisfied | — | 0 | 0 | yes | no — the tool ran and examined nothing (a labeled pass) | — | — | unknown |
| `phpunit` | `code` | not applicable | — | — not recorded — | — not recorded — | no | no — not applicable | — | — | — not recorded — |
| `prettier` | `code` | not applicable | — | — not recorded — | — not recorded — | no | no — not applicable | — | — | — not recorded — |
| `stylelint` | `code` | not applicable | — | — not recorded — | — not recorded — | no | no — not applicable | — | — | — not recorded — |
| `house_rules` | `test` | satisfied | — | 0 | 3 | yes | yes | — | — | unknown |
| `parity` | `test` | satisfied | — | 0 | 53490 | yes | yes | — | — | unknown |
| `playwright` | `test` | satisfied | — | 0 | 6759 | yes | yes | — | — | unknown |
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

### Invocations, as recorded

```
# custom:component_lint (code), attempt 1
run droost/gates/component-lint.php

# house_rules (code), attempt 1
house rules: HR1

# phpcs (code), attempt 1
phpcs (ticket scope: no changed file)

# phpstan (code), attempt 1
phpstan (ticket scope: no changed file)

# house_rules (test), attempt 1
house rules: HR1

# parity (test), attempt 1
<site>/tools/droost/vendor/droost/workflow/bin/droost-parity judge --reference droost/parity --scope frame --pages /,/contact,/rinks,/camps,/private-lessons,/new-to-hockey --json

# playwright (test), attempt 1
/var/www/html/node_modules/.bin/playwright test tests/e2e/r07-leagues.spec.ts

```

### Declarations — what the plan promised

| Kind | Declared | Audited in | State | Fault | Summary |
|---|---|---|---|---|---|
| `file` | 6 | `complete` | satisfied | — | 6 declared path(s), no undeclared changes |
| `test` | 1 | `test` | recorded (not blocking) | — | NOT VERIFIED — droost cannot see which tests a suite ran, only that one ran and how many. 1 planned, on record: r07-leagues.spec.ts. |
| `work_type` | — not recorded — | `complete` | satisfied | — | declared "theme" (theme and templates); the diff matches |
| `mandatory_measured` | — not recorded — | `complete` | recorded (not blocking) | — | phpcs, phpstan ran and measured nothing this run. A gate that analysed an empty path set has not checked anything, whatever colour it reported. Point phpcs at the code: set `gates.phpcs.paths` in droo … (cut) |

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
- `scripts/kch/trees/adult-leagues.json`
- `scripts/kch/trees/new-to-hockey.json`
- `scripts/kch/trees/youth-leagues.json`
- `tests/e2e/r07-leagues.spec.ts`
- `web/themes/custom/kchockey`

Tests declared:

- `r07-leagues.spec.ts`

### Checks that are neither gates nor declarations

Every attempt, not just the latest — there are few of them and each
one is a thing a phase could not end without.

| Kind | Item | Phase | Attempt | State | Fault | Summary |
|---|---|---|---|---|---|---|
| `check` | `plan_grounded` | `plan` | 1 | satisfied | — | plan looked: 5 knowledge call(s) this run (code:symbol ×2, code:tree ×1, code:wiki ×1, search:arch ×1), and 8 Grounding citation(s) resolve; the code index is ready |
| `recorded_run` | `playwright` | `test` | 1 | satisfied | — | playwright passed — 4 passed — ticket scope: 1 file(s) this run changed, not the full suite |
| `spec` | `criteria_table` | `complete` | 1 | satisfied | — | 4 criteria were declared this run and are counted by their declared proofs (4 verified by a test, 0 manual, 0 unverified); the spec's table does not count them. |

## 4a. The tool-call ledger — what droost was ACTUALLY asked

One row per tool result, successes and refusals alike. This is the
only place in the system that is not the subject's account of itself.

| Measure | Value | Reading |
|---|---|---|
| Total calls | 5 | every tool result, successes and refusals alike |
| Distinct tools | 4 | — |
| **Knowledge calls** (the codegraph, search, wiki, introspection and the brief: `KNOWLEDGE_TOOLS`) | 5 | the codebase was reached |
| Refusals (`outcome: fail`) | 0 | each one is a gate that was off, or an argument that was wrong |

### By phase

The JSONL ledger this replaced carried no phase, so its lines could
not be attributed to one from the record alone.

| Phase | Calls | Distinct tools | Knowledge |
|---|---|---|---|
| `plan` | 5 | 4 | 5 |

### Every tool called

| Tool | Calls | Class |
|---|---|---|
| `code:symbol` | 2 | knowledge |
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

component_lint passed: 49 custom SDC(s) meet Canvas's requirements (6 advisory(ies), which never fail it).

```

#### `parity` — `test`, attempt 1, `stdout` — satisfied

```
{"parity":{"status":"pass","scope":"frame","source":"http://localhost:5199","summary":"16 view(s) (8 route(s) at 1280 and 390px) as the reference against http://localhost:5199 (captured 2026-10-21T10:16:03.905Z) (D1–D7, frame scope; page scope for /, /contact, /rinks, /camps, /private-lessons, /new-to-hockey at 1280px); judged at https://kch-a.ddev.site (from .ddev/config.yaml); set aside by decision: \"(816) 555-0199\" on * (Q7), \"Privacy Policy\" on * (Q8), \"Terms of Service\" on * (Q8), \"Visit Website\" on /rinks (Q3), \"(913) 555-0101\" on /rinks (Q3), \"(816) 555-0202\" on /rinks (Q3), \"(816) 555-0303\" on /rinks (Q3), \"(816) 555-0404\" on /rinks (Q3), \"(913) 555-0505\" on /rinks (Q3), \"(816) 555-0606\" on /rinks (Q3), \"(816) 555-0707\" on /rinks (Q3), \"(816) 555-0808\" on /rinks (Q3)","base":"https://kch-a.ddev.site","base_from":".ddev/config.yaml","routes":[{"route":"/","view":"/","width":1280,"scope":"page","verdict":"PASS","failing":[]},{"route":"/","view":"/@390","wi

… 2123 of 4123 characters cut from the middle (evidence --full shows them all) …

decided":"Q3","why":"a placeholder rink phone, left empty until the real one is sent"},{"route":"/rinks","text":"(816) 555-0202","decided":"Q3","why":"a placeholder rink phone, left empty until the real one is sent"},{"route":"/rinks","text":"(816) 555-0303","decided":"Q3","why":"a placeholder rink phone, left empty until the real one is sent"},{"route":"/rinks","text":"(816) 555-0404","decided":"Q3","why":"a placeholder rink phone, left empty until the real one is sent"},{"route":"/rinks","text":"(913) 555-0505","decided":"Q3","why":"a placeholder rink phone, left empty until the real one is sent"},{"route":"/rinks","text":"(816) 555-0606","decided":"Q3","why":"a placeholder rink phone, left empty until the real one is sent"},{"route":"/rinks","text":"(816) 555-0707","decided":"Q3","why":"a placeholder rink phone, left empty until the real one is sent"},{"route":"/rinks","text":"(816) 555-0808","decided":"Q3","why":"a placeholder rink phone, left empty until the real one is sent"}]}}

```

#### `playwright` — `test`, attempt 1, `stderr` — satisfied

```
 [success] Added content_editor role to r07_editor

```

#### `playwright` — `test`, attempt 1, `stdout` — satisfied

```

Running 4 tests using 1 worker

  ✓  1 [chromium] › tests/e2e/r07-leagues.spec.ts:128:5 › AC-1: /youth-leagues shows the intro, the start panel beside the season snapshot, the division guide, then the questions (366ms)
  ✓  2 [chromium] › tests/e2e/r07-leagues.spec.ts:176:5 › AC-2: /adult-leagues shows the intro, the format cards, the season spotlight, then the questions (213ms)
  ✓  3 [chromium] › tests/e2e/r07-leagues.spec.ts:218:5 › AC-3: at phone width each division keeps its name and ages on one line, the description below at full width, and no detail (159ms)
  ✓  4 [chromium] › tests/e2e/r07-leagues.spec.ts:237:5 › AC-4: a Content editor edits a figure, a division, a format, the spotlight and a question in Canvas, and the pages show it (4.5s)

  4 passed (6.4s)

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
| `/youth-leagues` | `plan` | the start panel, season snapshot, division guide and questions |
| `/adult-leagues` | `plan` | the format cards, event spotlight and questions |

### Criteria declared, and what proves each

| Ref | Statement | Proven by | Wordings |
|---|---|---|---|
| `AC-1` | When a visitor opens /youth-leagues, the site shall show the intro, the Start here panel beside the Season snapshot figures, the Division guide's five divisions with ages, descriptions and details, th … (cut) | tests/e2e/r07-leagues.spec.ts › AC-1 passes; droost-parity judges /youth-leagues whole at 1280px: as the reference | 1 |
| `AC-2` | When a visitor opens /adult-leagues, the site shall show the intro, A league for every level. with its side note, the three format cards with level and description, the Fall season spotlight band (Adu … (cut) | tests/e2e/r07-leagues.spec.ts › AC-2 passes; droost-parity judges /adult-leagues whole at 1280px: as the reference | 1 |
| `AC-3` | While the window is narrow (390px), the division guide shall show each division's name and ages on one line and its description on a full-width line below, with no detail. | tests/e2e/r07-leagues.spec.ts › AC-3 passes (390px); droost-parity judges /youth-leagues@390 whole: as the reference | 1 |
| `AC-4` | When a staff editor edits a figure, a division, a format, the spotlight or a question in the page's Canvas tree, the page shall show the change. | tests/e2e/r07-leagues.spec.ts › AC-4 passes (both trees edited through canvas tree:set, then restored) | 1 |

**4 declared, 0 with nothing proving them.** A proof is RECORDED,
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
| `operator-commands` | allow | — | 56 |
| `pre-tool-use` | allow | — | 5 |
| `nudge` | note | `traverse:noted` | 2 |
| `operator-commands` | refuse | `protected-path:variable-program` | 1 |

**64 invocation(s), 1 refusal(s), 0 nudge(s).** The hook was
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


#### `playwright` — `test`, attempt 1 — satisfied (—), 1 finding

| # | File | Line | Rule | Message | Detail |
|---|---|---|---|---|---|
| 0 | — not recorded — | — not recorded — | — not recorded — | — not recorded — | {"key":"totals","detail":{"passed":4,"failed":0,"flaky":0,"skipped":0,"interrupted":0,"did not run":0}} |

#### `playwright` — `test`, attempt 1 — satisfied (—), 1 finding

| # | File | Line | Rule | Message | Detail |
|---|---|---|---|---|---|
| 0 | — not recorded — | — not recorded — | — not recorded — | — not recorded — | {"key":"totals","detail":{"passed":4,"failed":0,"flaky":0,"skipped":0,"interrupted":0,"did not run":0}} |

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
