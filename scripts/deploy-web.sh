#!/usr/bin/env bash
#
# Build the web demo and publish it to the gh-pages branch.
#
#   ./scripts/deploy-web.sh
#
# Live at https://qsoftwaredevelopment.github.io/catch-app/
#
# Layout on the published branch:
#   /index.html      phone-framed wrapper (web-demo/index.html)
#   /404.html        copy of the app shell — see the note below
#   /app/            the Expo web export
#
# GitHub Pages has no rewrite rules, so a direct hit on a client route such as
# /catch-app/app/log-in is a real 404. Pages serves the SITE ROOT 404.html for any
# unmatched path, so putting the app shell there lets Expo Router boot and handle the
# URL. The shell must live at the root, not in /app — a 404.html inside /app is never
# consulted.

set -euo pipefail

REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
REMOTE="git@github-qsoft:QSoftwareDevelopment/catch-app.git"
STAGE="$(mktemp -d)"

cd "$REPO_ROOT"

echo "==> Exporting web bundle"
rm -rf dist
# Pages serves this from a repo subpath, so assets need the prefix. app.config.js reads
# this; without it the export assumes the domain root and every asset 404s.
CATCH_WEB_BASE_URL=/catch-app/app npx expo export --platform web --output-dir dist/app

echo "==> Assembling site"
cp web-demo/index.html dist/index.html
cp dist/app/index.html dist/404.html   # SPA fallback, must be at site root
touch dist/.nojekyll                   # stop Jekyll eating _expo/

echo "==> Publishing to gh-pages"
git clone --quiet --depth 1 "$REMOTE" "$STAGE/repo"
cd "$STAGE/repo"
git checkout --quiet --orphan gh-pages
git rm -rq --cached . >/dev/null 2>&1 || true
find . -mindepth 1 -maxdepth 1 ! -name .git -exec rm -rf {} +
cp -R "$REPO_ROOT/dist/." .
git add -A
git commit -q -m "deploy: catch web demo"
git push -f --quiet origin gh-pages

cd "$REPO_ROOT"
rm -rf "$STAGE"

echo "==> Done: https://qsoftwaredevelopment.github.io/catch-app/"
echo "    Pages takes ~30-60s to rebuild."
