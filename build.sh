#!/bin/sh
set -eu
mkdir -p public
cp index.html public/
cp -R assets bourbon-games-live mixx-tank mixxvibe mixxbox mixxplay sunday-pours shows community mixx-wave mixx-bench mixx-measure sway partners about maison-cedro public/
cp -R tim public/
cp robots.txt sitemap.xml public/
