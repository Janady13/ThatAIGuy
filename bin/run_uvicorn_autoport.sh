#!/usr/bin/env bash
set -Eeuo pipefail
PROJECT_DIR="${PROJECT_DIR:-$HOME/donation_platform}"
PY="$PROJECT_DIR/.venv/bin/python"
APP="server.app:app"
PREFERRED_PORT="${PREFERRED_PORT:-}"

pick_port() {
  local p="$PREFERRED_PORT"
  if [[ -n "$p" ]]; then
    if "$PY" - "$p" 2>/dev/null <<'PY'
import socket, sys
s=socket.socket()
try:
    s.bind(("0.0.0.0", int(sys.argv[1])))
    print(sys.argv[1])
finally:
    s.close()
PY
    then
      echo "$p"; return 0
    fi
  fi
  "$PY" - <<'PY'
import socket
s=socket.socket(); s.bind(("0.0.0.0",0))
print(s.getsockname()[1])
s.close()
PY
}

PORT="$(pick_port)"
mkdir -p "$PROJECT_DIR/logs"
echo "$PORT" > "$PROJECT_DIR/logs/port.txt"
printf '{"port": %s}\n' "$PORT" > "$PROJECT_DIR/logs/port.json"
echo "[donation-python] Starting uvicorn on 0.0.0.0:${PORT}"
exec "$PY" -m uvicorn "$APP" --host 0.0.0.0 --port "$PORT"
