# Evaluation — KCH-A · run 1: the intake (observer's half)

Read against `rounds/KCH-A-1-prereg.md` (committed `1fa6dd9`, before `send`)
and the yardstick `docs/intake/KCHOCKEY-ANSWER-KEY.md`. An intake is not a
run, so droost renders no generated half for it. Its record is the intake's
own files and answer log, copied the minute the roadmap was approved into
`bin/artifacts/kch-a/run1-intake/` (`intake/`, `intake.json`,
`intake-answers.jsonl`, and the evidence store with its `-wal` and `-shm`).

## Round identity

| | |
|---|---|
| Intake | `intake-e87c3cfbf5ed`: opened 21:12:44, audited 21:16:09, approved 21:31:53 (CDT, 2026-10-20); 19 minutes |
| Host | Claude Code v2.1.304, Opus 5.5, high effort; isolated launch (`dogfood.sh`); one folder-trust prompt answered before `send` |
| Code | droost/workflow `867f31f`, droost/engine `4f263a3`, droost_cms `a2e662b` (FRESH) |
| Audit | sha256 `58ca2863…8f7047`, recorded where the agent cannot write |
| Client | the observer, from the pre-registered brief: 13 answers, every one through AskUserQuestion; nothing typed into the run outside the dialogs |

## What the intake did

1. **Started with the request verbatim**, and unpacked the zip into the
   project (`design/KC-Hockey-Hub/`).
2. **Served the source in the web container** (P8 held): it ran `pnpm` there.
   The workspace keeps only linux-x64 binaries, and the container is
   linux-arm64; the agent got the dev server up without editing the source's
   overrides. The observer's own copy needed them removed on macOS.
3. **Audited and read the audit whole** before modelling.
4. **Asked 11 questions in three batches**, then the approval. Each was
   written into `questions.md` before it was asked, so the record and the
   question match word for word. Its follow-up Q11 caught the client's
   Q6 answer naming only Name and Email as required, against the design's
   three, and asked rather than dropping a requirement.
5. **Wrote the model and an 8-rung roadmap**; `intake check` was `ready` with
   no findings.
6. **Asked "Approve this roadmap?"** The client answered "Not yet" (camp
   location, below); the agent changed the model and the ladder, re-ran the
   check, and asked again. Approved.

## Against the predictions

| # | Prediction | Result |
|---|---|---|
| P1 | All 8 routes in the model and a rung | **held** |
| P2 | Rink, Camp, Coach with the source's fields; camp location a reference | **missed, then fixed by the client**: location was plain text ("a camp may run somewhere the rink directory does not list") and Camp came before Rink. Never asked. **F-342** |
| P3 | Initials and FREE derived, not fields | **held** (price "worked out, not typed"; coaches "with initials until photos are added") |
| P4 | FAQs put to the client as a question | **missed**: decided as page copy edited in Canvas, and said so in the approval summary, not asked. The brief's "staff edit them" is met either way |
| P5 | Dates and placeholders asked | **held** (Q3, Q4, Q7) |
| P6 | Frame first, each type before its pages | **held after the correction** (rinks rung 3, camps rung 4) |
| P7 | Home a Canvas page, HR2 named | **held**: "pages are Canvas pages composed from SDCs (HR2)" |
| P8 | Served in the container, platform pins read not forced | **held** |
| P9 | Approval through AskUserQuestion, recorded by the guard | **held**: both approval answers, "Not yet" and "Approve", are rows in `intake-answers.jsonl` (`via: AskUserQuestion`) |

## Against the answer key

- **Types:** Rink, Camp and Coach, as the key has them. Camp reuses Drupal
  CMS's `event` type, relabelled "Camp or clinic"; the key lists `event` as
  the starter's own. That's defensible: it is a dated thing with a location,
  and it saves a type.
- **FAQ:** not a type; the key calls either way defensible.
- **Vocabularies:** a **Program** vocabulary drives the camp filter (the key:
  "probably the better one"). Amenities are a multi-value text field, which
  the key also calls defensible.
- **Webform** for contact, with Honeypot spam protection and the subject
  preset from a link.
- **Pages:** each a Canvas page. The not-found page is styled.
- **Ladder:** frame → contact → rinks → camps → coaches → new-to-hockey →
  leagues → launch readiness. The key put contact at 5; earlier costs nothing.
- **Out of scope correctly:** no registrations, capacity, members-only, ice
  times or seasons (Part 8's invented rungs).
- **Questions the key wanted:** dates yes, whether the records are real yes,
  the camp's location no (F-342), who edits the league copy no (decided).

## The three questions

1. **Measured.** `intake check` passed both times, correctly: what it checks
   (files, evidence ids, coverage, answers on record, ladder order) all held.
   It cannot judge a reference modelled as text, and does not claim to:
   "none of them judges whether a decision is good". The gap was the audit's,
   which saw both halves and did not join them (F-342).
2. **Recorded honestly.** Yes. Each answer is recorded with its channel,
   and `questions.md` marks each one "human" or "recommendation". A
   deferral is recorded as the recommendation's decision, never as the
   client's choice. The observer-as-client is not visible in the record
   (nothing could make it so); this file and the prereg say it.
3. **Forced.** Approval waited for an answer to its own question, and a
   "Not yet" held it. Whether a roadmap can be approved with an unanswered
   question, an edited audit or a ladder out of order is the check's
   territory; the PLAN-INTAKE probes covered it under the module shape and
   are owed again on `off-drupal` (on the bench, never this subject).

## Findings

- **F-342** (fixed, droost/workflow `0e931c5`): the audit now joins a field
  whose every value names another set's record ("location names a record
  of `d:…#RINKS` by its name (6 of 6 values): a reference to it, not text"),
  and the intake skill says to model it as a reference or ask. On this
  source it finds exactly that one among nine record sets.

## Score

S (setup arranged in advance) is not scored: the observer built and
configured the site, as in every series. The intake met the brief on every
point but one, and the client caught that one at approval, as a client
should get to. It is a pass with one miss, and the miss is now droost's to
prevent.
