#!/usr/bin/env bash
set -Eeuo pipefail

API="${API:-http://127.0.0.1:8081}"
ENV_COUNT="${ENV_COUNT:-20}"
PLAIN_COUNT="${PLAIN_COUNT:-30}"

say(){ printf "[agents] %s\n" "$*"; }

# Stop existing agents
say "Stopping any existing agents…"
curl -fsS -X POST "$API/api/agents/stop_all" >/dev/null || true

# Build env-templated params
ORG1="${ORG1:-aimusicinteraction.org}"
ORG2="${ORG2:-freeaicharity.org}"
INTERVAL="${INTERVAL:-0.25}"

say "Launching $ENV_COUNT env-tagged agents…"
curl -fsS -X POST "$API/api/agents/batch" \
  -H 'Content-Type: application/json' \
  -d "{\"count\":$ENV_COUNT,\"template\":{\"name\":\"env\",\"task\":\"heartbeat\",\"mode\":\"daemon\",\"params\":{\"interval\":$INTERVAL,\"domains\":[\"$ORG1\",\"$ORG2\"],\"source\":\"env\"}}}" >/dev/null

say "Launching $PLAIN_COUNT plain agents…"
curl -fsS -X POST "$API/api/agents/batch" \
  -H 'Content-Type: application/json' \
  -d "{\"count\":$PLAIN_COUNT,\"template\":{\"name\":\"plain\",\"task\":\"heartbeat\",\"mode\":\"daemon\",\"params\":{\"interval\":$INTERVAL,\"source\":\"plain\"}}}" >/dev/null

say "Done. Current counts:"
curl -fsS "$API/api/agents" | python3 - <<'PY'
import sys, json
d=json.load(sys.stdin).get('agents',[])
from collections import Counter
print(dict(Counter(a.get('mode','?')+':'+a.get('status','?') for a in d)))
PY

