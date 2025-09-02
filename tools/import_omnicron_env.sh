#!/usr/bin/env bash
set -Eeuo pipefail

SRC_DIR="${1:-/Volumes/Omnicron/env}"
DEST_DIR="$(cd "$(dirname "$0")"/.. && pwd)"
SECRETS_DIR="$DEST_DIR/.secrets"
ENV_OUT="$DEST_DIR/.env"
STATIC_CFG="$DEST_DIR/static/config.json"

echo "[import] Source: $SRC_DIR"
echo "[import] Dest:   $DEST_DIR"

[[ -d "$SRC_DIR" ]] || { echo "[import][ERROR] Missing $SRC_DIR" >&2; exit 1; }

mkdir -p "$SECRETS_DIR"

# Copy known env bundles if present (do not echo contents)
for f in payments.env stripe.env netlify.env global.env neon.env akamai.env; do
  if [[ -f "$SRC_DIR/$f" ]]; then
    install -m 600 "$SRC_DIR/$f" "$SECRETS_DIR/$f"
    echo "[import] copied $f"
  fi
done

# Build .env merged (order defines override priority)
{
  [[ -f "$SECRETS_DIR/global.env" ]] && cat "$SECRETS_DIR/global.env"
  [[ -f "$SECRETS_DIR/netlify.env" ]] && cat "$SECRETS_DIR/netlify.env"
  [[ -f "$SECRETS_DIR/stripe.env" ]] && cat "$SECRETS_DIR/stripe.env"
  [[ -f "$SECRETS_DIR/payments.env" ]] && cat "$SECRETS_DIR/payments.env"
} > "$ENV_OUT.tmp"

mv "$ENV_OUT.tmp" "$ENV_OUT"
chmod 600 "$ENV_OUT"
echo "[import] wrote $ENV_OUT (merged)"

# Optionally populate static/config.json from env (safe, public values only)
VENMO_URL=$(grep -E '^VENMO_URL=' "$ENV_OUT" | sed 's/^VENMO_URL=//; s/"//g' || true)
CASHAPP_URL=$(grep -E '^CASHAPP_URL=' "$ENV_OUT" | sed 's/^CASHAPP_URL=//; s/"//g' || true)
PAYPAL_URL=$(grep -E '^PAYPAL_URL=' "$ENV_OUT" | sed 's/^PAYPAL_URL=//; s/"//g' || true)
RAISED=$(grep -E '^CAMPAIGN_RAISED=' "$ENV_OUT" | sed 's/^CAMPAIGN_RAISED=//' || echo 0)
GOAL=$(grep -E '^CAMPAIGN_GOAL=' "$ENV_OUT" | sed 's/^CAMPAIGN_GOAL=//' || echo 0)

mkdir -p "$DEST_DIR/static"
cat > "$STATIC_CFG" <<CFG
{
  "venmoUrl": "${VENMO_URL}",
  "cashAppUrl": "${CASHAPP_URL}",
  "paypalUrl": "${PAYPAL_URL}",
  "campaignRaised": ${RAISED:-0},
  "campaignGoal": ${GOAL:-0}
}
CFG
chmod 600 "$STATIC_CFG" || true
echo "[import] updated $STATIC_CFG"

echo "[import] Done. Secrets stored in $SECRETS_DIR and merged into $ENV_OUT."

