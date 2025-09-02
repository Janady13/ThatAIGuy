#!/usr/bin/env bash
set -Eeuo pipefail

API="${API:-http://127.0.0.1:8081}"
INTERVAL="${INTERVAL:-1}"

while true; do
  printf "\033c"  # clear screen
  date '+%Y-%m-%d %H:%M:%S'
  echo "== Agents Overview =="
  if DATA=$(curl -fsS "$API/api/agents" 2>/dev/null); then
    COUNT=$(python3 - <<'PY'
import sys, json
d=json.load(sys.stdin).get('agents',[])
from collections import Counter
import time
c=Counter(a.get('status','?') for a in d)
print(len(d), c.get('running',0), c.get('stopped',0), c.get('done',0))
PY
<<<"$DATA")
  fi
  TOTAL=$(echo "${COUNT:-0 0 0 0}" | awk '{print $1}')
  RUN=$(echo   "${COUNT:-0 0 0 0}" | awk '{print $2}')
  STOP=$(echo  "${COUNT:-0 0 0 0}" | awk '{print $3}')
  DONE=$(echo  "${COUNT:-0 0 0 0}" | awk '{print $4}')
  printf "Agents: total=%s running=%s stopped=%s done=%s\n" "$TOTAL" "$RUN" "$STOP" "$DONE"

  echo
  echo "== System CPU (top 5) =="
  if command -v ps >/dev/null; then
    ps -A -o pid,comm,%cpu -r | head -n 6
  fi

  echo
  echo "== Sample Agent Logs (first running) =="
  AG=$(python3 - <<'PY'
import sys, json
try:
  d=json.load(sys.stdin).get('agents',[])
  for a in d:
    if a.get('status')=='running':
      print(a['id']); break
except Exception:
  pass
PY
<<<"$DATA")
  [ -n "$AG" ] && { echo "agent=$AG"; curl -fsS "$API/api/agents/$AG/logs" | tail -n 12; } || echo "no running agents"

  echo
  echo "Refresh every ${INTERVAL}s — Ctrl+C to exit"
  sleep "$INTERVAL"
done
