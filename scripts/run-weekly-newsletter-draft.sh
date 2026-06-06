#!/usr/bin/env bash
set -euo pipefail

# Generates the weekly Healthbits Brief draft and visual preview locally.
# This script is safe by design: it never sends email and never approves a draft.

REPO_DIR="/Users/marioinostroza/repos/marioLanding_blog"
VAULT_NEWSLETTERS_DIR="$HOME/Library/Mobile Documents/iCloud~md~obsidian/Documents/Proyectos/05_Blog/newsletters"
LOG_DIR="$VAULT_NEWSLETTERS_DIR/logs"
DAYS="${NEWSLETTER_DAYS:-7}"
PNPM_BIN="${PNPM_BIN:-/usr/local/bin/pnpm}"

mkdir -p "$LOG_DIR"
LOG_FILE="$LOG_DIR/weekly-newsletter-$(date +%Y-%m-%d).log"

exec > >(tee -a "$LOG_FILE") 2>&1

echo "[newsletter:weekly] started $(date)"
echo "[newsletter:weekly] repo=$REPO_DIR"
echo "[newsletter:weekly] days=$DAYS"

cd "$REPO_DIR"

# Pull only when the repo is clean. If there is active local work, do not risk changing it.
if git diff --quiet && git diff --cached --quiet; then
  echo "[newsletter:weekly] repo clean; attempting git pull --ff-only"
  git pull --ff-only || echo "[newsletter:weekly] git pull failed; continuing with local files"
else
  echo "[newsletter:weekly] repo has local changes; skipping git pull"
fi

"$PNPM_BIN" newsletter:digest --days "$DAYS"

DRAFT_PATH=$(ls -t "$VAULT_NEWSLETTERS_DIR/drafts"/*-healthbits-brief.md | head -1)
echo "[newsletter:weekly] latest draft=$DRAFT_PATH"

"$PNPM_BIN" newsletter:validate --allow-pending "$DRAFT_PATH"
"$PNPM_BIN" newsletter:preview "$DRAFT_PATH"

PREVIEW_PATH="$VAULT_NEWSLETTERS_DIR/previews/$(basename "$DRAFT_PATH" .md)-premium.pdf"
echo "[newsletter:weekly] preview=$PREVIEW_PATH"

/usr/bin/osascript -e "display notification \"Draft y preview listos para revisar en Obsidian.\" with title \"Healthbits Brief\" subtitle \"Newsletter semanal\"" || true

echo "[newsletter:weekly] finished $(date)"
