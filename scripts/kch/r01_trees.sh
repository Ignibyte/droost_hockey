#!/usr/bin/env bash
#
# Rung 1's Canvas trees: writes each page's tree from scripts/kch/trees/ with
# droost/bin/canvas (validate, then set). Run from the project root, after
# scripts/kch/r01_content.php, whose JSON (page ids by path, media ids by
# name) it reads on stdin or runs to get:
#
#   scripts/kch/r01_trees.sh
#
set -euo pipefail

cd "$(dirname "$0")/../.."

ids="$(ddev drush php:script scripts/kch/r01_content.php)"

page_id() { printf '%s' "$ids" | python3 -c "import json,sys; print(json.load(sys.stdin)['pages']['$1'])"; }
media_id() { printf '%s' "$ids" | python3 -c "import json,sys; print(json.load(sys.stdin)['media']['$1'])"; }

hero="$(media_id hero)"
camps="$(media_id camps)"

for tree in scripts/kch/trees/*.json; do
  name="$(basename "$tree" .json)"
  path="/$name"
  [ "$name" = "home" ] && path="/home"
  id="$(page_id "$path")"
  filled="$(sed -e "s/\"__MEDIA_HERO__\"/$hero/" -e "s/\"__MEDIA_CAMPS__\"/$camps/" "$tree")"
  if ! answer="$(printf '%s' "$filled" | droost/bin/canvas tree:validate "$id" --items=-)"; then
    echo "$path (canvas_page $id): refused"
    echo "$answer"
    exit 1
  fi
  printf '%s' "$filled" | droost/bin/canvas tree:set "$id" --items=- > /dev/null
  echo "$path (canvas_page $id): written"
done
