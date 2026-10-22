#!/usr/bin/env bash
# Собирает статический сайт в dist/ для GitHub Pages (все пути относительные).
set -euo pipefail
cd "$(dirname "$0")"
rm -rf dist
mkdir dist
cp -r index.html css js fonts img dist/
touch dist/.nojekyll
echo "dist/ готов"
