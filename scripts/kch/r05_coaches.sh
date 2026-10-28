#!/usr/bin/env bash
#
# Rung 5: the four coaches (scripts/kch/r05_coaches.php), then every page's
# Canvas tree from scripts/kch/trees/ (rung 1's r01_trees.sh validates and
# writes each; /private-lessons gains the instructor spotlight, the coaches
# listing and the call-to-action band). Run from anywhere, after rung 4 and
# with the coach content type and the coaches View imported:
#
#   scripts/kch/r05_coaches.sh
#
set -euo pipefail

cd "$(dirname "$0")/../.."

ddev drush php:script scripts/kch/r05_coaches.php
scripts/kch/r01_trees.sh
