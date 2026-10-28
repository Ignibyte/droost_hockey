#!/usr/bin/env bash
#
# Rung 4: the programs and the six camps (scripts/kch/r04_camps.php), then
# every page's Canvas tree from scripts/kch/trees/ (rung 1's r01_trees.sh
# validates and writes each; /camps gains the listing, / the featured camp and
# "Upcoming Action"). Run from anywhere, after rung 3 and with the camp
# content type and the camps View imported:
#
#   scripts/kch/r04_camps.sh
#
set -euo pipefail

cd "$(dirname "$0")/../.."

ddev drush php:script scripts/kch/r04_camps.php
scripts/kch/r01_trees.sh
