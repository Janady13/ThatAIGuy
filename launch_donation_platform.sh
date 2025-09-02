#!/bin/bash
set -euo pipefail

PORT=8080

# Change to the directory containing this script (project root)
cd "$(dirname "$0")"

# Kill anything using the port
PID=$(lsof -t -i :$PORT || true)
if [ -n "${PID}" ]; then
  echo "⚠️  Killing existing process on port $PORT (PID ${PID})..."
  kill -9 ${PID}
fi

# Auto-sync donation config from Omnicron env if present
if [ -f "/Volumes/Omnicron/env/payments.env" ]; then
  # Temporarily allow unset variables during sourcing
  set +u
  . "/Volumes/Omnicron/env/payments.env" || true
  set -u
  VENMO_URL_VAL=${VENMO_URL:-}
  CASHAPP_URL_VAL=${CASHAPP_URL:-}
  STRIPE_URL_VAL=${STRIPE_URL:-${STRIPE_PAYMENT_LINK:-}}
  mkdir -p static
  cat > static/config.json <<CFG
{
  "venmoUrl": "${VENMO_URL_VAL}",
  "cashAppUrl": "${CASHAPP_URL_VAL}",
  "stripeUrl": "${STRIPE_URL_VAL}"
}
CFG
  echo "✓ Synced static/config.json from /Volumes/Omnicron/env/payments.env"
fi

# Ensure virtual environment exists
if [ ! -d "venv" ]; then
  echo "❌ venv not found in $(pwd). Please create it and install dependencies."
  echo "   python3 -m venv venv && source venv/bin/activate && pip install flask gunicorn"
  exit 1
fi

# Start with Gunicorn (production-ready)
echo "🚀 Starting Donation Platform with Gunicorn on port $PORT..."
if [ -f .env ]; then
  export $(grep -E '^[A-Z0-9_]+=' .env | cut -d= -f1)
  set +u; . ./.env || true; set -u
  echo "Loaded env from .env"
fi
source venv/bin/activate
# Use the Flask static server app for compatibility with Gunicorn
exec gunicorn -w 4 -b 0.0.0.0:${PORT} flask_legacy_server:app
