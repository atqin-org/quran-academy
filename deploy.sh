#!/usr/bin/env bash
# deploy.sh — local-build deploy to cPanel via SSH + rsync.
#
# The build runs locally to avoid OOM on the prod box. Prod just pulls code,
# refreshes vendor, receives the built assets, runs migrations, and warms
# the caches. SSH/rsync will prompt for your password 3 times per run.
#
# Usage:
#   ./deploy.sh                       # build + deploy
#   PROD_BRANCH=dev ./deploy.sh       # deploy a different branch
#   SKIP_BUILD=1 ./deploy.sh          # reuse the existing public/build (fast)

set -euo pipefail

# ---------- configuration (override via env) ----------
: "${PROD_HOST:=oulama62@makemake-shared}"
: "${PROD_PATH:=/home/oulama62/academy}"
: "${PROD_BRANCH:=prod}"
: "${SKIP_BUILD:=0}"
# ------------------------------------------------------

log()  { printf '\n\033[1;36m==> %s\033[0m\n' "$*"; }
warn() { printf '\033[1;33m%s\033[0m\n' "$*"; }
fail() { printf '\033[1;31m%s\033[0m\n' "$*"; exit 1; }

cleanup_on_error() {
    warn "Deploy failed — prod may still be in maintenance mode."
    warn "SSH in and run: cd $PROD_PATH && php artisan up"
}
trap cleanup_on_error ERR

# ---------- pre-flight ----------
log "Pre-flight checks"
git diff --quiet            || fail "Working tree has unstaged changes."
git diff --cached --quiet   || fail "Working tree has staged-but-uncommitted changes."

current_branch=$(git rev-parse --abbrev-ref HEAD)
[[ "$current_branch" == "$PROD_BRANCH" ]] \
    || fail "Local branch is '$current_branch' but PROD_BRANCH='$PROD_BRANCH'. Switch first."

# ---------- push code ----------
log "Push '$PROD_BRANCH' to origin"
git push origin "$PROD_BRANCH"

# ---------- build locally ----------
if [[ "$SKIP_BUILD" == "1" ]]; then
    warn "SKIP_BUILD=1 — reusing existing public/build/"
    [[ -f public/build/manifest.json ]] || fail "public/build/manifest.json missing; cannot SKIP_BUILD."
else
    log "Build frontend locally"
    npm ci
    npm run build
    [[ -f public/build/manifest.json ]] || fail "Build finished but manifest.json is missing."
fi

# ---------- remote: maintenance on, pull code, composer install ----------
log "Prod: maintenance ON + git pull + composer install"
ssh "$PROD_HOST" bash -s <<EOF
set -e
cd "$PROD_PATH"
php artisan down --retry=10 || true
git fetch origin
git reset --hard "origin/$PROD_BRANCH"
composer install --no-dev --optimize-autoloader --no-interaction
EOF

# ---------- transfer built assets ----------
log "Rsync public/build/ → prod"
rsync -avz --delete --no-perms --no-owner --no-group \
    public/build/ \
    "$PROD_HOST:$PROD_PATH/public/build/"

# ---------- remote: migrate, cache, maintenance off ----------
log "Prod: migrate, cache, queue restart, maintenance OFF"
ssh "$PROD_HOST" bash -s <<EOF
set -e
cd "$PROD_PATH"
php artisan migrate --force
php artisan optimize:clear
php artisan config:cache
php artisan route:cache
php artisan view:cache
php artisan event:cache 2>/dev/null || true
php artisan queue:restart 2>/dev/null || true
php artisan up
EOF

trap - ERR
log "Deploy complete ✔"
