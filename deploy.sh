#!/usr/bin/env bash
# deploy.sh — runs on the cPanel prod server, inside the project directory.
#
# Pulls the latest code, refreshes vendor + assets, migrates, warms the
# caches, installs the scheduler cron, and brings the site back up. The
# Node build runs here with a heap cap so chunk rendering doesn't OOM
# the box.
#
# Usage (on prod, from the project root):
#   ./deploy.sh                       # full deploy
#   SKIP_BUILD=1 ./deploy.sh          # reuse the existing public/build (fast)
#   BRANCH=dev ./deploy.sh            # deploy a different branch
#   NODE_HEAP_MB=1536 ./deploy.sh     # bump the Node heap cap

set -euo pipefail

# ---------- configuration (override via env) ----------
: "${BRANCH:=prod}"
: "${SKIP_BUILD:=0}"
: "${NODE_HEAP_MB:=1024}"
# ------------------------------------------------------

log()  { printf '\n\033[1;36m==> %s\033[0m\n' "$*"; }
warn() { printf '\033[1;33m%s\033[0m\n' "$*"; }
fail() { printf '\033[1;31m%s\033[0m\n' "$*"; exit 1; }

cleanup_on_error() {
    warn "Deploy failed — site may still be in maintenance mode."
    warn "Run: php artisan up"
}
trap cleanup_on_error ERR

# Always operate from the script's directory so it works regardless of where
# it's invoked from.
cd "$(dirname "$0")"

log "Maintenance ON"
php artisan down --retry=10 || true

log "Pull '$BRANCH'"
git fetch origin
git reset --hard "origin/$BRANCH"

log "Composer install"
composer install --no-dev --optimize-autoloader --no-interaction

if [[ "$SKIP_BUILD" == "1" ]]; then
    warn "SKIP_BUILD=1 — skipping npm build"
else
    log "NPM install + build (Node heap cap: ${NODE_HEAP_MB}MB)"
    npm install --no-audit --no-fund --no-progress
    NODE_OPTIONS="--max-old-space-size=$NODE_HEAP_MB" npm run build
    [[ -f public/build/manifest.json ]] || fail "manifest.json missing after build."
fi

log "Migrate"
php artisan migrate --force

log "Cache reset + warm"
php artisan optimize:clear
php artisan config:cache
php artisan route:cache
php artisan view:cache
php artisan event:cache 2>/dev/null || true
php artisan queue:restart 2>/dev/null || true

# The scheduler drives all time-based email notifications (notifications:scan,
# backups). Without this cron they only ever fire as a side-effect of web
# requests, so emails stall until someone opens the app.
log "Scheduler cron"
PHP_BIN="$(command -v php)"
CRON_LINE="* * * * * cd $(pwd) && $PHP_BIN artisan schedule:run >> /dev/null 2>&1"
if ! command -v crontab >/dev/null 2>&1; then
    warn "crontab not available on this host — add this line via cPanel > Cron Jobs:"
    warn "  $CRON_LINE"
elif crontab -l 2>/dev/null | grep -qF "artisan schedule:run"; then
    log "Scheduler cron already installed."
else
    if { crontab -l 2>/dev/null || true; echo "$CRON_LINE"; } | crontab -; then
        log "Scheduler cron installed."
    else
        warn "Could not install the cron automatically — add this line via cPanel > Cron Jobs:"
        warn "  $CRON_LINE"
    fi
fi

log "Maintenance OFF"
php artisan up

trap - ERR
log "Deploy complete ✔"
