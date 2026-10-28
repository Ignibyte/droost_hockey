#!/usr/bin/env bash
#
# Rung 2: the contact webform (scripts/kch/r02_contact.php), then the
# /contact page's Canvas tree from scripts/kch/trees/contact.json, validated
# and written with droost/bin/canvas. Run from anywhere, after rung 1's
# scripts and with webform, webform_ui and honeypot enabled:
#
#   scripts/kch/r02_contact.sh
#
set -euo pipefail

cd "$(dirname "$0")/../.."

ddev drush php:script scripts/kch/r02_contact.php > /dev/null

id="$(ddev drush php:eval 'print \Drupal::service("path_alias.manager")->getPathByAlias("/contact");' | sed -n 's#^/page/##p')"
if [ -z "$id" ]; then
  echo "/contact is not a Canvas page: run rung 1's scripts first"
  exit 1
fi

tree=scripts/kch/trees/contact.json
if ! answer="$(droost/bin/canvas tree:validate "$id" --items="$tree")"; then
  echo "/contact (canvas_page $id): refused"
  echo "$answer"
  exit 1
fi
droost/bin/canvas tree:set "$id" --items="$tree" > /dev/null
echo "/contact (canvas_page $id): written"
