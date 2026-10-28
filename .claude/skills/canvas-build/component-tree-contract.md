# Drupal Canvas: the `component_tree` contract

How Canvas stores a page's component tree, which is what
`droost/bin/canvas` reads, validates and writes.

**Provenance.** First captured from Canvas 1.7.1 on Drupal CMS 2.1.3
(2026-07-01, `canvas_page` 1 "Home" and the `ComponentTreeItem`,
`ComponentInputs` and `Component` sources). Re-verified on **Canvas 1.12.0,
Drupal 11.4.10** (2026-10-20, a fresh droost_cms site): the same seven
columns in `canvas_page__components`, and the same plain-value `inputs`.
Check again after a Canvas minor update.

## Where trees live

1. **Content entities**: any field of type **`component_tree`**. Do not
   assume: `droost/bin/canvas status` lists them. On Drupal CMS the only one
   is `canvas_page.components`; a node bundle has a tree only if such a
   field is added.
2. **Config entities**: `ContentTemplate`, `PageTemplate` and others extend
   `ComponentTreeConfigEntityBase` and keep trees in config. The tree verbs
   do not write these.

## The stored item (7 columns)

A tree is a **flat, ordered list**; list order is sibling order.

```json
{
    "uuid": "b7563f5f-d4db-4029-a292-593e82fda2ec",
    "component_id": "sdc.mercury.cta",
    "component_version": "7f6c40ea90b84edc",
    "parent_uuid": null,
    "slot": null,
    "inputs": "{\"heading_text\":\"Your hero content goes here\",\"level\":1}",
    "label": null
}
```

| Column | Meaning |
|---|---|
| `uuid` | The item's identity within the tree. |
| `component_id` | **A Canvas `Component` config entity id, not an SDC plugin id.** It is source-prefixed: `sdc.<provider>.<machine_name>` for an SDC, `block.<plugin>` for a block, `js.<name>` for a code component. `mercury:cta` is `sdc.mercury.cta`. |
| `component_version` | The 16-hex version of the Component the inputs were written against. **May be omitted on write**: Canvas stamps the loaded version. A version that is not the loaded one makes the item load that version. |
| `parent_uuid` | `null` for a root item; otherwise the parent item's `uuid`. |
| `slot` | `null` for a root item; otherwise the **parent component's slot** the item sits in (the CMS hero's button sits in the CTA's `actions`). |
| `inputs` | A **JSON object string** (`'{}'` when empty). `tree:get` decodes it, and `tree:set` takes a map and encodes it. |
| `label` | An optional per-item label; normally `null`. |

Computed, never stored: `component`, `parent_item`, `inputs_resolved`.

## The two `inputs` encodings

1. **Plain values**: what the editor stores for plain props, a flat
   `{prop_name: value}` map, as above. Write this.
2. **Source-wrapped**: each prop maps to an object with a `sourceType`:
   - `static:field_item:<type>` needs `value` (and may take `expression`);
   - `dynamic` needs `expression` (a host entity's field; content
     templates);
   - `adapter:<id>` needs `adapterInputs`;
   - `default-relative-url` is internal (default image paths).

Canvas validates either. Values must satisfy the component's prop schemas
(`droost/bin/canvas components <id>` prints them).

## Validation is Canvas's

`ComponentTreeItem` declares two constraints:

- **`ValidComponentTreeItem`**, per item: the component and version exist,
  the inputs decode and satisfy the schemas, and the slot exists on the
  parent.
- **`ComponentTreeMeetRequirements`**, for the tree as a whole.

`tree:validate` and `tree:set` run the host entity's own `validate()` and
print each violation by property path (`components.1.slot: …`). Before that,
the layer refuses what Canvas would only report as an opaque error:
- a key that is not one of the seven;
- a duplicate uuid;
- `parent_uuid` without `slot`, or the reverse;
- a parent that is not in the tree, or a parent chain that loops;
- `inputs` that is a list;
- a component id that is still unknown after the registry is refreshed.

## The registry the ids point into

`Drupal\canvas\Entity\Component` (the `component` config entity) is the
site's placeable components, rebuilt from eligible sources on a cache
rebuild (85 on a fresh droost_cms site: 47 SDC, 35 block, 2 page template,
1 marker). A disabled component still exists and still renders where it is
placed. Which SDCs are eligible is decided by Canvas's
`ComponentMetadataRequirementsChecker`, which is what `droost/bin/canvas
lint` runs.
