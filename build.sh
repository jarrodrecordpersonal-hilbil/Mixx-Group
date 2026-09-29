#!/bin/sh
set -eu
mkdir -p public
cp index.html public/
cp -R assets bourbon-games-live mixx-tank mixxvibe public/
