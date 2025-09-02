#!/usr/bin/env bash
set -Eeuo pipefail
log(){ echo "[donation-python] $*"; }
PROJECT_DIR="${PROJECT_DIR:-$PWD}"
PORT="${PORT:-8080}"  # preferred starting port

pick_port() {
  local start="${1:-$PORT}"
  local end=$(( start + 20 ))
  local p="$start"
  while [[ "$p" -le "$end" ]]; do
    if ! lsof -iTCP:"$p" -sTCP:LISTEN >/dev/null 2>&1; then
      echo "$p"; return 0
    fi
    p=$((p+1))
  done
  # fallback: random high port
  python3 - <<'PY'
import socket
s=socket.socket()
s.bind(('',0))
print(s.getsockname()[1])
s.close()
PY
}

cd "$PROJECT_DIR"
if [[ -f "$PROJECT_DIR/.env" ]]; then
  # shellcheck disable=SC2046
  export $(grep -E '^[A-Z0-9_]+=' "$PROJECT_DIR/.env" | cut -d= -f1)
  set -a; . "$PROJECT_DIR/.env"; set +a
  log "Loaded env from .env"
fi
source "$PROJECT_DIR/.venv/bin/activate"

FREE_PORT="$(pick_port "$PORT")"
export PORT="$FREE_PORT"

log "Launching FastAPI (Uvicorn) on 0.0.0.0:${PORT}"
# Single worker for macOS dev; add --reload if you want live reload
exec python -m uvicorn server.app:app --host 0.0.0.0 --port "$PORT"
