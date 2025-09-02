#!/usr/bin/env bash
set -euo pipefail

# Create a Stripe Payment Link and optionally write it into static/config.json
# Requirements:
# - curl, python3
# - STRIPE_SECRET_KEY in env, or /Volumes/Omnicron/env/stripe.env
#
# Usage examples:
#   create_stripe_payment_link.sh --amount 25 --name "Donation $25" --site thataiguy.org --apply
#   create_stripe_payment_link.sh --amount-cents 5000 --name "Donation $50" --apply

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
ROOT_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"
STATIC_CFG="$ROOT_DIR/static/config.json"

err() { echo "[stripe-link][ERROR] $*" >&2; }
log() { echo "[stripe-link] $*"; }

AMOUNT_DOLLARS=""
AMOUNT_CENTS=""
NAME="Donation"
CURRENCY="usd"
SITE="thataiguy.org"
APPLY=false
AFTER_REDIRECT_URL=""

while [[ $# -gt 0 ]]; do
  case "$1" in
    --amount) AMOUNT_DOLLARS="$2"; shift 2 ;;
    --amount-cents) AMOUNT_CENTS="$2"; shift 2 ;;
    --name) NAME="$2"; shift 2 ;;
    --currency) CURRENCY="$2"; shift 2 ;;
    --site) SITE="$2"; shift 2 ;;
    --after-url) AFTER_REDIRECT_URL="$2"; shift 2 ;;
    --apply) APPLY=true; shift ;;
    -h|--help)
      cat <<USAGE
Usage: $(basename "$0") [--amount 25 | --amount-cents 2500] [--name "Donation $25"] [--currency usd] [--site thataiguy.org] [--after-url https://.../success] [--apply]
USAGE
      exit 0
      ;;
    *) err "Unknown arg: $1"; exit 1 ;;
  esac
done

# Load Stripe env if available
if [[ -f "/Volumes/Omnicron/env/stripe.env" ]]; then
  # shellcheck disable=SC1091
  source "/Volumes/Omnicron/env/stripe.env" || true
fi

if [[ -z "${STRIPE_SECRET_KEY:-}" ]]; then
  err "STRIPE_SECRET_KEY not set; export it or provide /Volumes/Omnicron/env/stripe.env"
  exit 1
fi

if [[ -z "$AMOUNT_CENTS" && -z "$AMOUNT_DOLLARS" ]]; then
  err "Specify --amount <dollars> or --amount-cents <cents>"
  exit 1
fi

if [[ -n "$AMOUNT_DOLLARS" && -n "$AMOUNT_CENTS" ]]; then
  err "Provide only one of --amount or --amount-cents"
  exit 1
fi

if [[ -n "$AMOUNT_DOLLARS" ]]; then
  # Handle integer or decimal
  if [[ "$AMOUNT_DOLLARS" == *.* ]]; then
    # Convert decimal dollars to cents safely via python
    AMOUNT_CENTS=$(python3 - "$AMOUNT_DOLLARS" <<'PY'
import sys
from decimal import Decimal, ROUND_HALF_UP
v = (Decimal(sys.argv[1]) * 100).quantize(Decimal('1'), rounding=ROUND_HALF_UP)
print(int(v))
PY
)
  else
    AMOUNT_CENTS=$(( AMOUNT_DOLLARS * 100 ))
  fi
fi

if ! [[ "$AMOUNT_CENTS" =~ ^[0-9]+$ ]]; then
  err "Amount in cents must be an integer, got: $AMOUNT_CENTS"
  exit 1
fi

# Derive after-completion redirect URL
if [[ -z "$AFTER_REDIRECT_URL" ]]; then
  if [[ -n "${SUCCESS_URL_TEMPLATE:-}" ]]; then
    AFTER_REDIRECT_URL="${SUCCESS_URL_TEMPLATE//\{site\}/$SITE}"
  else
    AFTER_REDIRECT_URL="https://${SITE}/success"
  fi
fi

log "Creating Stripe Payment Link: ${CURRENCY} ${AMOUNT_CENTS} cents — ${NAME}"
API_BASE="${STRIPE_API_BASE:-https://api.stripe.com}"

RESP=$(curl -sS -u "${STRIPE_SECRET_KEY}:" -X POST "$API_BASE/v1/payment_links" \
  -d "line_items[0][price_data][currency]=$CURRENCY" \
  -d "line_items[0][price_data][unit_amount]=$AMOUNT_CENTS" \
  -d "line_items[0][price_data][product_data][name]=$NAME" \
  -d "line_items[0][quantity]=1" \
  -d "after_completion[type]=redirect" \
  -d "after_completion[redirect][url]=$AFTER_REDIRECT_URL" \
  -H "Content-Type: application/x-www-form-urlencoded") || {
    err "Stripe API request failed"; exit 1;
  }

URL=$(python3 - <<'PY'
import sys, json
data=json.load(sys.stdin)
print(data.get('url',''))
PY
<<<"$RESP")

if [[ -z "$URL" ]]; then
  err "No URL returned from Stripe. Full response:"; echo "$RESP"; exit 1
fi

log "Created Payment Link: $URL"

if $APPLY; then
  log "Writing stripePaymentLink to $STATIC_CFG"
  python3 - "$STATIC_CFG" "$URL" <<'PY'
import json, sys, pathlib
cfg_path = pathlib.Path(sys.argv[1])
url = sys.argv[2]
cfg = {}
if cfg_path.exists():
    try:
        cfg = json.loads(cfg_path.read_text())
    except Exception:
        cfg = {}
cfg['stripePaymentLink'] = url
cfg_path.write_text(json.dumps(cfg, indent=2) + "\n")
print("OK: updated", cfg_path)
PY
fi

echo "$URL"

