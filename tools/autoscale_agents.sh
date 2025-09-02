#!/usr/bin/env bash
set -Eeuo pipefail

# Autoscale agents based on system CPU utilization.
# - Runs only from /Volumes/Omnicron to respect "nothing on my MacBook" intent.
# - Ramp up when CPU < TARGET, cool down when CPU > HIGH.
# - Never exceed MAX_AGENTS (defaults to 50).

API="${API:-http://127.0.0.1:8081}"
STEP_UP="${STEP_UP:-5}"
STEP_DOWN="${STEP_DOWN:-5}"
SLEEP_SEC="${SLEEP_SEC:-5}"
TARGET_CPU="${TARGET_CPU:-45}"   # percent of total CPU capacity (normalized by core count)
HIGH_CPU="${HIGH_CPU:-70}"       # cool down above this
MAX_AGENTS="${MAX_AGENTS:-50}"

# Template for starting new agents
DIRECTIVE="${AGENT_DIRECTIVE:-Promote the charity ethically and add value.}"
OBJECTIVE="${AGENT_OBJECTIVE:-Increase awareness and donations via compliant content.}"
DOM1="${CHARITY_DOMAIN:-aimusicinteraction.org}"
DOM2="${CHARITY_DOMAIN_ALT:-freeaicharity.org}"
COOLDOWN="${COOLDOWN:-0.4}"
MAX_STEPS_PARAM="${MAX_STEPS_PARAM:-0}"

die(){ printf "[autoscale][ERROR] %s\n" "$*" >&2; exit 1; }
log(){ printf "[autoscale] %s\n" "$*"; }

# Ensure running from Omnicron volume
ROOT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
case "$ROOT_DIR" in
  /Volumes/Omnicron/*) ;;
  *) die "Refusing to run outside /Volumes/Omnicron (ROOT_DIR=$ROOT_DIR)" ;;
esac

get_cpu_norm(){
  local sum ncpu cpu
  # Sum all process CPU (can exceed 100 per core)
  sum=$(ps -A -o %cpu= | awk '{s+=$1} END{print s+0}')
  ncpu=$(sysctl -n hw.ncpu 2>/dev/null || echo 1)
  # Normalize to percentage of total capacity
  cpu=$(awk -v s="$sum" -v c="$ncpu" 'BEGIN{ if(c<1)c=1; printf("%.0f", (s/(c*100))*100) }')
  echo "${cpu}"
}

get_count(){ curl -fsS "$API/api/agents" | python3 - <<'PY' || echo 0
import sys, json
try:
  d=json.load(sys.stdin).get('agents',[])
  print(len(d))
except Exception:
  print(0)
PY
}

start_batch(){
  local n=$1 src=${2:-plain}
  [ "$n" -gt 0 ] || return 0
  curl -fsS -X POST "$API/api/agents/batch" -H 'Content-Type: application/json' -d "$(cat <<JSON
{
  "count": ${n},
  "template": {
    "name": "auto-${src}",
    "task": "autonomous",
    "mode": "daemon",
    "params": {
      "directive": "${DIRECTIVE}",
      "objective": "${OBJECTIVE}",
      "domains": ["${DOM1}", "${DOM2}"],
      "cooldown": ${COOLDOWN},
      "max_steps": ${MAX_STEPS_PARAM},
      "source": "${src}"
    }
  }
}
JSON
)" >/dev/null || true
}

stop_some(){
  local n=$1
  [ "$n" -gt 0 ] || return 0
  curl -fsS -X POST "$API/api/agents/stop_some" -H 'Content-Type: application/json' -d "{\"count\":${n}}" >/dev/null || true
}

log "Starting autoscaler targeting CPU < ${TARGET_CPU}% (cool down above ${HIGH_CPU}%), max agents ${MAX_AGENTS}"

while true; do
  cpu=$(get_cpu_norm)
  cur=$(get_count)
  [ "$cur" -gt "$MAX_AGENTS" ] && cur=$MAX_AGENTS

  printf "[autoscale] cpu=%s%% agents=%s\n" "$cpu" "$cur"

  if [ "$cpu" -lt "$TARGET_CPU" ] && [ "$cur" -lt "$MAX_AGENTS" ]; then
    # scale up
    room=$(( MAX_AGENTS - cur ))
    inc=$STEP_UP; [ "$inc" -gt "$room" ] && inc=$room
    log "Scale up by ${inc}"
    start_batch "$inc" env
  elif [ "$cpu" -gt "$HIGH_CPU" ] && [ "$cur" -gt 0 ]; then
    # scale down
    dec=$STEP_DOWN; [ "$dec" -gt "$cur" ] && dec=$cur
    log "Scale down by ${dec}"
    stop_some "$dec"
  fi

  sleep "$SLEEP_SEC"
done

