# Evaluation — KCH-A · run 10: R08, launch readiness (observer's half)

Pairs with `rounds/KCH-A-10-generated.md`.

| | |
|---|---|
| Run | `run-7b7b15910a19`, 36 minutes, fresh session |
| Ticket | `droost/intake/tickets/R08.md` |
| Base | `951f27f` (R07; all eight pages judged whole) |
| Operator | the kickoff and "Yes, commit it." |
| Result | **all four phases passed**, committed `dc7c20e` |

**What it found already true, and proved:**
- the Content editor role (every grant, and refused the theme, modules,
  roles and site configuration);
- changes showing to the next visitor with no cache cleared;
- one h1 a page, labelled fields, alt text and no sideways scroll on all
  eight pages at both widths;
- contrast held to WCAG AA, or where the design is lower, to the source.

**What it changed:**
- the sitemap (camps out, all eight pages in);
- the contact button's send icon, drawn by the row so contrast can be
  measured;
- `docs/staff-handover.md`: how staff edit each thing, the go-live list
  from the intake's answers (Q3, Q6, Q7, Q8), and deploy notes.

**Honest beyond what a gate asks:**
- **It owned a recording slip.** It recorded AC-6's proof before reading
  its grep's output; the grep had matched nothing. It re-ran it and
  recorded again, and both entries stand.
- `mixed` declared, blocked by type_coverage (no PHP), re-declared
  `content_model` with the reason in the spec.
- **For the client:**
  - the design's gold-on-white labels are 1.75:1, below WCAG AA;
  - mail on PHP's sendmail will not arrive in production.

**Gates:**
- Playwright 4/4;
- parity 16/16 with every page whole;
- component_lint and house rules;
- phpcs and phpstan honest about reading nothing (no PHP changed).

**The three questions:** yes, yes, yes. No finding.
