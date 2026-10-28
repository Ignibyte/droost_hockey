---
name: canvas-build
description: Build what a Drupal CMS site shows — Canvas pages, SDC-composed displays, lists — through droost/bin/canvas and config, never by pasting HTML. Use when a ticket adds or changes a page, a layout, a component, a content type's display, or a listing on a site built from the droost_cms recipe.
---

# Building a Drupal CMS site's pages

Every visible surface renders through Single Directory Components (SDC). For
each thing on screen, decide first what it is:

| It is… | Build it as… | With… |
|---|---|---|
| A landing page, marketing page, one-off layout | a **Canvas page** (`canvas_page`, or any entity with a `component_tree` field) | `droost/bin/canvas tree:set` |
| Repeatable content with fields (events, people, rinks…) | a **content type** whose view display is composed from SDCs | a `core.entity_view_display` YAML using UI Patterns formatters, imported |
| A list of those entities | a **View** rendering the bundle's SDC-composed teasers | a `views.view` YAML, imported |

Most sites need all three. Never leave a content type on raw default
formatters, and never paste HTML into a body field to fake a layout.

## Before you build: what is there

```bash
droost/bin/canvas status                 # Canvas version, placeable components, where trees live
droost/bin/canvas components             # every placeable id, its slots
droost/bin/canvas components sdc.droost_theme.hero   # one: slots, prop schemas, template behaviour
```

Tree items use the **Canvas Component id** (`sdc.<provider>.<name>`), never
the SDC's `provider:name`. `components <id>` also reports
`template_behavior`: props the template never reads (setting them changes
nothing) and props that render only when another prop is set. Read it before
you choose a component, not after the page looks wrong.

Reuse a component before you write one. `droost_theme` ships 21 SDCs (hero,
card, section, grid, stats, steps, timeline, tabs, carousel, faq_item…).

## A Canvas page

1. Create the page if it does not exist (`drush php:eval` creating a
   `canvas_page`, or the Canvas UI), and note its id.
2. Read its tree: `droost/bin/canvas tree:get <id> > tree.json`. The items
   it prints are `tree:set`'s input as they stand.
3. Write the tree you want in a file: `{"items": [...]}`, in display order.
   Roots omit `parent_uuid` and `slot`; a child names its parent's `uuid`
   and the parent's slot. `inputs` is a map of prop name to value. Omitted
   uuids are generated, and omitted versions take the component's active
   one. Keep the uuids from `tree:get` when you edit, so that writing the
   same tree twice writes the same page. The full contract, both `inputs`
   encodings and what Canvas validates are in
   [component-tree-contract.md](component-tree-contract.md).
4. `droost/bin/canvas tree:validate <id> --items=tree.json`. This runs
   Canvas's own constraints on a copy that is thrown away.
5. `droost/bin/canvas tree:set <id> --items=tree.json`. It writes all or
   nothing: a refused tree leaves the page as it was, and the message names
   each violation by path. A prop with a schema `default` you left out is
   filled, and the answer says which.
6. Look at the page in a browser. A tree that validates can still be the
   wrong page.

Every verb prints one JSON object (`exit`, `ok`, `message`, `data`) and exits
0 (ok), 1 (refused) or 2 (could not answer: no site, a bad argument).

## A new component

Put it in the project's own theme or module (`themes/custom/<theme>/components/<name>/`):
`<name>.component.yml` and `<name>.twig`, plus CSS if it needs it. Then:

```bash
droost/bin/canvas lint <provider>:<name>    # Canvas's requirements checker, and advisories
drush cr                                    # Canvas makes its Component entity on rebuild
droost/bin/canvas components sdc.<provider>.<name>
```

A component that fails Canvas's requirements gets no Component entity, so it
cannot be placed. The usual reason is a required prop with no `examples`
(Canvas uses `examples[0]` as the editor's default). Type the `attributes`
prop as `Drupal\Core\Template\Attribute`, never `object`. The
`component_lint` gate runs the same check over every custom SDC at code.

## A structured display

The recipe's `event` content type is the worked example:
`recipes/droost_cms/config/core.entity_view_display.node.event.default.yml`.
Each field uses the `ui_patterns_component_per_item` formatter, naming a
component (`droost_theme:section`), its props (`heading` from
`field_label`) and its slots (the field's own formatter into `content`).
Write yours the same way, then:

```bash
drush config:import --partial --source=<dir with the yml> -y
drush config:inspect --only-error         # schema errors, if any
drush config:export -y                    # the site's config is the record
```

Anything not listed under `content:` is hidden. A list's teaser binds
**one** anchor field (say, the image) to a card component and pulls the
other fields through token sources (`title ← [node:title]`). Its link is an
`entity_link` source with **`source: {template: canonical}`**: without that
setting the link renders nothing, and nothing says so.

## A list

A View whose row plugin renders the bundle's teaser view mode is then a grid
of components. Build it as `views.view.<id>.yml`, import it the same way,
and check that it returns rows on real content.

## A known trap

Do not install core's Custom block module (`block_content`): on Canvas 1.12 it
stops halfway and leaves a module enabled with no table (Canvas
[#3582851](https://www.drupal.org/project/canvas/issues/3582851)). Keep
site-wide details (contact lines, social links) in a small custom module's
config instead.

## What droost checks

- `component_lint` (at code) fails a custom SDC that Canvas would refuse.
  When there is no custom SDC it records that it examined nothing, which is
  not a pass.
- The `sdc_markup` house rule (HR1 in the layer's droost.yml block) names
  every Twig file the run changed in custom code that sits in no component's
  directory, and every Canvas code component (`canvas.js_component.*`):
  components are SDCs here.
- None of this proves the page looks right. That is the browser's job, and
  the test phase's.
