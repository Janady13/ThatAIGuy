#!/usr/bin/env bash
set -Eeuo pipefail

OMNI_ENV_DIR="${OMNI_ENV_DIR:-/Volumes/Omnicron/env}"
API_HOST="${API_HOST:-127.0.0.1}"
API_PORT="${API_PORT:-8081}"
API="http://${API_HOST}:${API_PORT}"
COUNT_ENV="${COUNT_ENV:-20}"
COUNT_PLAIN="${COUNT_PLAIN:-30}"
COOLDOWN="${COOLDOWN:-0.3}"
MAX_STEPS="${MAX_STEPS:-0}"

say(){ printf "[omnicron] %s\n" "$*"; }
die(){ printf "[omnicron][ERROR] %s\n" "$*" >&2; exit 1; }

cd "$(dirname "$0")/.."

[[ -d "$OMNI_ENV_DIR" ]] || die "Missing $OMNI_ENV_DIR"

say "Importing env from $OMNI_ENV_DIR …"
bash tools/import_omnicron_env.sh "$OMNI_ENV_DIR" >/dev/null

say "Ensuring FastAPI (uvicorn) is running at ${API} …"
lsof -t -iTCP:"$API_PORT" -sTCP:LISTEN >/dev/null 2>&1 || {
  source .venv/bin/activate || die "Missing .venv. Run setup_python_server.sh first."
  # Load env and start uvicorn bound to loopback
  nohup env $(grep -E '^[A-Z0-9_]+=' .env | xargs) \
    python -m uvicorn donation_platform.server.app:app --host "$API_HOST" --port "$API_PORT" \
    > "$HOME/Library/Logs/donation_platform_uvicorn_${API_PORT}.log" 2>&1 &
  sleep 1
}

# Wait for health
for i in {1..20}; do
  if curl -fsS "$API/health" >/dev/null; then break; fi
  sleep 0.3
done
curl -fsS "$API/health" >/dev/null || die "API did not become ready at $API"

say "Stopping existing agents …"
curl -fsS -X POST "$API/api/agents/stop_all" >/dev/null || true

# directive/objective/domains from env if present
DIRECTIVE="${AGENT_DIRECTIVE:-Promote the charity ethically and add value.}"
OBJECTIVE="${AGENT_OBJECTIVE:-Increase awareness and donations via compliant content.}"
DOM1="${CHARITY_DOMAIN:-aimusicinteraction.org}"
DOM2="${CHARITY_DOMAIN_ALT:-freeaicharity.org}"

say "Launching ${COUNT_ENV} 'autonomous' agents (env‑tagged)…"
curl -fsS -X POST "$API/api/agents/batch" -H 'Content-Type: application/json' -d "$(cat <<JSON
{
  "count": ${COUNT_ENV},
  "template": {
    "name": "auto-env",
    "task": "autonomous",
    "mode": "daemon",
    "params": {
      "directive": "${DIRECTIVE}",
      "objective": "${OBJECTIVE}",
      "domains": ["${DOM1}", "${DOM2}"],
      "cooldown": ${COOLDOWN},
      "max_steps": ${MAX_STEPS},
      "source": "env"
    }
  }
}
JSON
)" >/dev/null

say "Launching ${COUNT_PLAIN} 'autonomous' agents (plain)…"
curl -fsS -X POST "$API/api/agents/batch" -H 'Content-Type: application/json' -d "$(cat <<JSON
{
  "count": ${COUNT_PLAIN},
  "template": {
    "name": "auto-plain",
    "task": "autonomous",
    "mode": "daemon",
    "params": {
      "directive": "${DIRECTIVE}",
      "objective": "${OBJECTIVE}",
      "domains": ["${DOM1}", "${DOM2}"],
      "cooldown": ${COOLDOWN},
      "max_steps": ${MAX_STEPS},
      "source": "plain"
    }
  }
}
JSON
)" >/dev/null

say "Summary:"
curl -fsS "$API/api/agents" | python3 - <<'PY'
import sys, json
d=json.load(sys.stdin).get('agents',[])
from collections import Counter
print("total:", len(d))
print("by status:", dict(Counter(a.get('status','?') for a in d)))
print("by source:", dict(Counter((a.get('params') or {}).get('source','') for a in d)))
PY

say "Use: bash tools/watch_agents.sh to monitor."

