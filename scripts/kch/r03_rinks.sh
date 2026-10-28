#!/usr/bin/env bash
#
# Rung 3: the eight rinks (scripts/kch/r03_rinks.php), then every page's
# Canvas tree from scripts/kch/trees/ (rung 1's r01_trees.sh validates and
# writes each; /rinks gains the map panel and the directory, / the Find Your
# Ice band). Run from anywhere, after rungs 1 and 2 and with the rink content
# type and the rinks View imported:
#
#   scripts/kch/r03_rinks.sh
#
set -euo pipefail

cd "$(dirname "$0")/../.."

ddev drush php:script scripts/kch/r03_rinks.php
scripts/kch/r01_trees.sh
