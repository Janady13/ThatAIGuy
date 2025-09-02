#!/usr/bin/env bash
set -Eeuo pipefail
LABEL="org.donation.platform"
PLIST="$HOME/Library/LaunchAgents/${LABEL}.plist"
PROJECT_DIR="$HOME/donation_platform"

mkdir -p "$HOME/Library/LaunchAgents"

# Create bin directory and autoport runner
mkdir -p "$PROJECT_DIR/bin" "$PROJECT_DIR/logs"
cat > "$PROJECT_DIR/bin/run_uvicorn_autoport.sh" <<'RUN'
#!/usr/bin/env bash
set -Eeuo pipefail
PROJECT_DIR="${PROJECT_DIR:-$HOME/donation_platform}"
PY="$PROJECT_DIR/.venv/bin/python"
APP="server.app:app"
PREFERRED_PORT="${PREFERRED_PORT:-}"

pick_port() {
  local p="$PREFERRED_PORT"
  if [[ -n "$p" ]] && "$PY" - <<PY 2>/dev/null; then
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
RUN
chmod +x "$PROJECT_DIR/bin/run_uvicorn_autoport.sh"

# Write LaunchAgent plist (expand vars now, but escape $ for Cash App URL)
cat > "$PLIST" <<PLIST
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN"
 "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0"><dict>
  <key>Label</key><string>${LABEL}</string>
  <key>ProgramArguments</key>
  <array>
    <string>${PROJECT_DIR}/bin/run_uvicorn_autoport.sh</string>
  </array>
  <key>WorkingDirectory</key><string>${PROJECT_DIR}</string>
  <key>EnvironmentVariables</key>
  <dict>
    <key>VENMO_URL</key><string>https://venmo.com/u/FreeAICharity</string>
    <key>STRIPE_PAYMENT_LINK</key><string>https://buy.stripe.com/test_123</string>
    <key>CASHAPP_HANDLE</key><string>@janady07</string>
    <key>CASHAPP_URL</key><string>https://cash.app/\$janady07</string>
    <key>CAMPAIGN_RAISED</key><string>1200</string>
    <key>CAMPAIGN_GOAL</key><string>5000000</string>
  </dict>
  <key>RunAtLoad</key><true/>
  <key>KeepAlive</key><true/>
  <key>StandardOutPath</key><string>${PROJECT_DIR}/logs/out.log</string>
  <key>StandardErrorPath</key><string>${PROJECT_DIR}/logs/err.log</string>
</dict></plist>
PLIST



launchctl unload "$PLIST" 2>/dev/null || true
launchctl load "$PLIST"
launchctl start "$LABEL"
echo "[donation-python] Installed LaunchAgent: $PLIST"
echo "[donation-python] Status: launchctl list | grep ${LABEL}"
