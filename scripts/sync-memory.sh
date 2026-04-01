#!/usr/bin/env bash
# sync-memory.sh — Exporta memorias de Engram filtradas y las pushea al repo
# Uso: ./scripts/sync-memory.sh
# Cron: ejecutar cada 3 días desde la Mac

set -e

REPO_DIR="$(cd "$(dirname "$0")/.." && pwd)"
EXPORT_TMP="/tmp/engram-full-$(date +%s).json"
OUTPUT="$REPO_DIR/context/memory.json"
PROJECTS="marioLanding|examya|marioSoftmedic"

echo "→ Exportando Engram..."
engram export "$EXPORT_TMP"

echo "→ Filtrando proyectos: $PROJECTS"
jq --arg projects "$PROJECTS" '
{
  version: .version,
  exported_at: .exported_at,
  observations: [
    .observations[]
    | select(.project != null and (.project | test($projects; "i")))
    | select(.deleted_at == null)
  ] | sort_by(.created_at) | reverse,
  sessions: [
    .sessions[]
    | select(.project != null and (.project | test($projects; "i")))
  ] | sort_by(.started_at) | reverse | .[0:20]
}
' "$EXPORT_TMP" > "$OUTPUT"

OBS_COUNT=$(jq '.observations | length' "$OUTPUT")
echo "→ $OBS_COUNT observaciones exportadas a context/memory.json"

rm -f "$EXPORT_TMP"

cd "$REPO_DIR"
git add context/memory.json
git diff --cached --quiet && echo "→ Sin cambios nuevos en memoria." && exit 0

git commit -m "chore: sync engram memory $(date +%Y-%m-%d)"
git push origin main
echo "→ Memory sync pusheado a GitHub."
