# Evaluation — KCH-A · run 6: R04, the camps (observer's half)

Pairs with `rounds/KCH-A-6-generated.md`.

| | |
|---|---|
| Run | `run-c00b866e6506`, 68 minutes, fresh session |
| Ticket | `droost/intake/tickets/R04.md` |
| Base | `c031b2a` (R03, droost/workflow `728a420`, parity judging `/contact` and `/rinks` whole) |
| Operator | the kickoff, and "Yes, commit it. And keep the skate photo." after complete |
| Result | **all four phases passed**, committed `6995ce8` |

**Built:**
- Camp on the reused `event` type ("Camp or clinic"): date-only start and
  end, a **required Rink reference** (the intake's correction), ages, skill
  level, price (0 shown as FREE), featured, programs;
- the Program vocabulary and the filter bar;
- the camps View for `/camps` and the home page's featured camp and Upcoming
  Action;
- a rink-delete guard on every route (single, bulk, API);
- trees through `tree:set`.

**The gate loop worked as designed.** The agent changed PHP during test
(the filter bar moved from the View's header into a block, after parity saw
a second page header on `/camps`). droost sent the run back to code to
re-measure the tree as it stood, spending no retry, then test again:
Playwright 13/13, parity 16/16 with `/contact` and `/rinks` whole.

**Judgement no gate asked for:**
- **The source's "hockey" photo is a basketball.** The Unsplash image the
  design hotlinks, alt text "Hockey player on ice", shows a basketball in a
  hoop. The intake's Q10 recommendation (copy it) was made on the alt text,
  and the agent looked. It departed from Q10 and said so in the spec, used
  the client's own unused skate photo, and offered a one-line revert. The
  client kept the skate.
- A timezone bug that made "upcoming" a day behind in Kansas City, caught by
  its own test; per-day caching so a camp drops off at midnight with no one
  acting.

**Noted for the intake (no finding):** the intake skill already says never
to describe a broken image from its file name or alt text. A *working*
image described by its alt text is the same mistake, and the skill could say
so; the client's answer to Q10 deferred to the recommendation, so no client
decision was overturned.

**The three questions:**
- **Measured:** yes. 7+ gates measured; parity held two pages whole and the
  frame everywhere. After the run, `/` and `/camps` were measured passing
  whole and added to the lever, and `/private-lessons` (unbuilt) failed as
  the control.
- **Recorded honestly:** yes. The report names what no reviewer read: the
  filter block written during test.
- **Forced:** the return to code was droost's, not the agent's choice.
