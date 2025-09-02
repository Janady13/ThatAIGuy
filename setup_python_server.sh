#!/usr/bin/env bash
set -Eeuo pipefail

log(){ echo "[donation-python] $*"; }
warn(){ echo "[donation-python][WARN] $*" >&2; }
die(){ echo "[donation-python][ERROR] $*" >&2; exit 1; }

PROJECT_DIR="${PROJECT_DIR:-$PWD}"
STATIC_DIR="$PROJECT_DIR/static"
PORT="${PORT:-8080}"          # preferred starting port (auto-fallback if busy)
PY="${PYTHON_BIN:-python3}"   # allow override if needed

log "Project dir: $PROJECT_DIR"
[[ -d "$STATIC_DIR" ]] || die "Missing $STATIC_DIR — build your static assets first."

# Heal common macOS junk (safe no-ops if absent)
log "Cleaning macOS junk files (._*, .DS_Store)…"
find "$PROJECT_DIR" -name '._*' -type f -delete 2>/dev/null || true
find "$PROJECT_DIR" -name '.DS_Store' -type f -delete 2>/dev/null || true

# Ensure venv
if [[ ! -d "$PROJECT_DIR/.venv" ]]; then
  log "Creating virtualenv at $PROJECT_DIR/.venv"
  $PY -m venv "$PROJECT_DIR/.venv"
fi

# Activate venv and install deps
source "$PROJECT_DIR/.venv/bin/activate"
python -m pip install --upgrade pip wheel >/dev/null
pip install "fastapi>=0.115" "uvicorn[standard]>=0.30" >/dev/null

# Write server files
mkdir -p "$PROJECT_DIR/server"

cat > "$PROJECT_DIR/server/app.py" <<'PY'
import os, json
from pathlib import Path
from fastapi import FastAPI, Response
from fastapi.responses import FileResponse, JSONResponse, PlainTextResponse
from fastapi.staticfiles import StaticFiles

BASE_DIR = Path(__file__).resolve().parent.parent
STATIC_DIR = BASE_DIR / "static"

app = FastAPI(title="Donation Platform (Python)")

# Serve /static/* directly
app.mount("/static", StaticFiles(directory=str(STATIC_DIR), html=False), name="static")

@app.get("/health")
def health():
    return {"ok": True, "service": "donation-platform", "mode": "python", "static_exists": STATIC_DIR.exists()}

@app.get("/config.json")
def config_json():
    """Serve static/config.json if present; otherwise synthesize from env."""
    cfg_path = STATIC_DIR / "config.json"
    if cfg_path.exists():
        return FileResponse(str(cfg_path), media_type="application/json")
    # Fallback from env
    data = {
        "venmoUrl": os.getenv("VENMO_URL", ""),
        "cashAppUrl": os.getenv("CASHAPP_URL", ""),
        "cashAppHandle": os.getenv("CASHAPP_HANDLE", ""),
        "stripeUrl": os.getenv("STRIPE_URL", ""),
        "stripePaymentLink": os.getenv("STRIPE_PAYMENT_LINK", ""),
        "campaignRaised": int(os.getenv("CAMPAIGN_RAISED", "0") or 0),
        "campaignGoal": int(os.getenv("CAMPAIGN_GOAL", "0") or 0),
    }
    return JSONResponse(data)

@app.get("/")
def root():
    """Serve static index.html if available, else a minimal landing page."""
    idx = STATIC_DIR / "index.html"
    if idx.exists():
        return FileResponse(str(idx), media_type="text/html")
    return PlainTextResponse("Static index.html not found under /static. Build or copy your UI.", status_code=200)
PY

# Simple runner
cat > "$PROJECT_DIR/run_python_server.sh" <<'PYRUN'
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
source "$PROJECT_DIR/.venv/bin/activate"

FREE_PORT="$(pick_port "$PORT")"
export PORT="$FREE_PORT"

log "Launching FastAPI (Uvicorn) on 0.0.0.0:${PORT}"
# Single worker for macOS dev; add --reload if you want live reload
exec python -m uvicorn server.app:app --host 0.0.0.0 --port "$PORT"
PYRUN
chmod +x "$PROJECT_DIR/run_python_server.sh"

# Print env guidance (user can export before running to override)
cat > "$PROJECT_DIR/env.example.sh" <<'ENV'
# Example donation platform env (source this before launching if desired)
export VENMO_URL="https://venmo.com/u/FreeAICharity"
export STRIPE_PAYMENT_LINK="https://buy.stripe.com/test_123"
export CASHAPP_HANDLE="@janady07"
export CASHAPP_URL="https://cash.app/$janady07"
export CAMPAIGN_RAISED=1200
export CAMPAIGN_GOAL=5000000
# Preferred port (will auto-fallback if busy)
export PORT=8080
ENV

log "Wrote: server/app.py, run_python_server.sh, env.example.sh"

# Launch it (respect any already-exported env)
log "Starting server…"
bash "$PROJECT_DIR/run_python_server.sh" &
PID=$!
sleep 0.8

# Try to open in Chrome (falls back to default browser)
URL="http://127.0.0.1:${PORT}"
if command -v open >/dev/null; then
  open -ga "Google Chrome" "$URL" 2>/dev/null || open "$URL"
fi

log "Server PID: $PID"
log "Health check: curl -fsS ${URL}/health || true"
curl -fsS "${URL}/health" || true
log "Ready: ${URL}"
wait $PID
