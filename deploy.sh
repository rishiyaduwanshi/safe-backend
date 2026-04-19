#!/usr/bin/env bash
set -euo pipefail

# Simple server-side deploy script.
# Intended to be executed *on the server* (via GitHub Actions SSH).

APP_DIR="${APP_DIR:-$HOME/safeindia}"
BRANCH="${DEPLOY_BRANCH:-main}"
PM2_APP_NAME="${PM2_APP_NAME:-safe-backend}"

DEPLOY_LOG="$APP_DIR/deploy.log"

log() {
  echo "[$(date -u '+%Y-%m-%dT%H:%M:%SZ')] $*" | tee -a "$DEPLOY_LOG"
}

on_exit() {
  rc=$?
  if [ $rc -eq 0 ]; then
    log "DEPLOY SUCCESS"
  else
    log "DEPLOY FAILED rc=$rc"
  fi
  exit $rc
}
trap on_exit EXIT

mkdir -p "$APP_DIR"
cd "$APP_DIR"

log "====================================="
log "Starting deployment"
log "Actor=${GITHUB_ACTOR:-unknown} SHA=${GITHUB_SHA:-unknown} RunID=${GITHUB_RUN_ID:-unknown}"
log "====================================="

# --- Git sync ---
if [ ! -d .git ]; then
  log "ERROR: $APP_DIR is not a git repo (.git missing)"
  exit 1
fi

log "Syncing repo (branch=$BRANCH)"
git fetch origin "$BRANCH" 2>&1 | tee -a "$DEPLOY_LOG"

git checkout "$BRANCH" 2>&1 | tee -a "$DEPLOY_LOG"
# Safe automation pattern: make server exactly match origin
# (avoids merge conflicts in deployments)
git reset --hard "origin/$BRANCH" 2>&1 | tee -a "$DEPLOY_LOG"

# --- Build ---
if ! command -v bun >/dev/null 2>&1; then
  log "ERROR: bun is not installed on server"
  exit 1
fi

log "Installing dependencies"
bun install --frozen-lockfile 2>&1 | tee -a "$DEPLOY_LOG"

log "Building"
bun run build 2>&1 | tee -a "$DEPLOY_LOG"

# --- Restart ---
log "Restarting service"
if command -v pm2 >/dev/null 2>&1; then
  if pm2 describe "$PM2_APP_NAME" >/dev/null 2>&1; then
    pm2 restart "$PM2_APP_NAME" --update-env 2>&1 | tee -a "$DEPLOY_LOG"
  else
    pm2 start bun --name "$PM2_APP_NAME" -- run pro 2>&1 | tee -a "$DEPLOY_LOG"
  fi
  pm2 save 2>&1 | tee -a "$DEPLOY_LOG"
else
  mkdir -p "$APP_DIR/logs"
  pkill -f "bun run dist/server.js" || true
  nohup bun run pro > "$APP_DIR/logs/prod.out" 2>&1 < /dev/null &
fi

log "Deployment completed successfully"