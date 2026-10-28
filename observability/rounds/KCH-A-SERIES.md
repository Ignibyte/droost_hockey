# KCH-A: KC Hockey, from a design to a finished site (series summary)

**The series** (2026-10-20 to 21) was one install of a fresh Drupal CMS site
from the droost_cms recipe, with no droost module, and droost as one command
in `tools/droost/`. The KC Hockey design (`KC-Hockey-Hub.zip`, as the client
delivered it) went through the intake, then the eight rungs it planned, each
a governed run at `low`, autonomous.

**The roles:** the observer was also the client (owner, 2026-10-20). Every
client answer came from a brief written before the intake asked anything
(`KCH-A-1-prereg.md`).

## Outcome

| Round | Ticket | Result |
|---|---|---|
| KCH-A-1 | the intake | approved in 19 min after one "Not yet" (camp location) |
| KCH-A-2 | R01, attempt 1 | test failed: parity could not run (F-344), and would have failed on its own geometry (F-343) |
| KCH-A-3 | R01, attempt 2 | passed, 72 min |
| KCH-A-4 | R02, contact form | passed, 31 min |
| KCH-A-5 | R03, rinks | passed, 33 min |
| KCH-A-6 | R04, camps | passed, 68 min |
| KCH-A-7 | R05, coaches | passed, 36 min |
| KCH-A-8 | R06, /new-to-hockey | passed, 47 min |
| KCH-A-9 | R07, league pages | passed, 19 min |
| KCH-A-10 | R08, launch readiness | passed, 36 min |

**The site** (subject tag `kch-a-r08-done`, DDEV snapshot `kch-a-r08-done`):
- all eight routes answer 200;
- 8 rinks, 6 camps and 4 coaches, as the source has them;
- every camp references the rink the source names, through a required field;
- the placeholder phones and websites are not served;
- **the observer's final run:** the whole suite **78/78** in one run, and
  parity **16/16 views**, every page judged whole at 1280px.

## What droost was found doing wrong, and fixed

Ten findings, F-342 to F-351, each with a test or probe that fails before
its fix, all pushed on `off-drupal`:

| | |
|---|---|
| F-342 | the audit never joined a field to the record set it names (camp location → rinks) |
| F-343 | a text set aside by the client's decision kept its space in D5 |
| F-344 | the parity gate looked for its runner where droost no longer installs |
| F-345 | the editor could leave an orphan file in the state directory |
| F-346 | a route's status could not be corrected, nor 404 declared |
| F-347 | an in-process house rule read as "never spawned" |
| F-348 | **HIGH**: parity judged whatever site the environment named, unrecorded |
| F-349 | parity held boxes, not text, and missed a button input's label |
| F-350 | inside the container parity judged `html.ddev.site` (F-348's own fix) |
| F-351 | a reference did not say where it was read, so a run could choose where it passes |

Seven of the ten are about **parity**, the gate that holds the site to the
design. It was the least-used gate before this series, and this series is
where it was first held page by page against a real build.

**Observatory instruments fixed on the way:**
- `set-dial.sh` dropped the project's gates, rules and analyser paths;
- `verify-freshness.sh` expected 8 guard entries when there are 9;
- the transcript scorer read a tree *read* as a write;
- `probe-intake-walls.sh` is on the new layout, 10/10.

**droost_cms** (the recipe and its Canvas layer) was built for this series,
the first project layer besides DRUP. The Canvas tools,
`component_lint`, the `canvas-build` skill and the install script all ran in
every rung. Canvas #3582851 (`block_content`'s install) is upstream's,
documented in the recipe.

## The three questions, across the series

1. **Did each gate measure?**
   - phpcs, phpstan, component_lint, house_rules and Playwright measured
     every rung.
   - Parity measured only the frame until the operator measured each
     finished page whole and added it to `pages`, from R04; every page from
     R08.
   - type_coverage refused a `mixed` claim nothing had measured, twice
     (R05, R08).
2. **Was it recorded honestly?**
   - The intake recorded who decided each answer.
   - A blocked verdict stays in the record when superseded.
   - The agents' reports named what was not proven, and each slip they
     made.
   - The gaps were in parity's record: which site was judged (F-348), and
     where (F-351). Both are fixed.
3. **Was the agent forced?**
   - The intake could not be approved without the client's yes (probe
     10/10), and a "Not yet" held it.
   - Code changed in test sent R04 back to code.
   - type_coverage stopped R05.
   - Before F-351, where parity ran was the agent's choice. Every agent
     still chose honestly.
   - HR2 (trees through `tree:set`) was held by choice at `low`, with no
     seeker. The scorer now reports a tree written another way; none was.

## Open for the owner

- **The M6 tags.** droost/workflow `off-drupal` carries F-340 to F-351 since
  another subject run 4.
- **Climbing the dial on this subject**, from `medium` (the seeker on),
  which the protocol asks before calling a series solid. KCH-A ran at
  `low` throughout.
- **Upstream:** Canvas #3582851 (our merge request, open).
- **The client's notes from R08:** gold-on-white contrast is below AA in the
  design itself; production mail.
