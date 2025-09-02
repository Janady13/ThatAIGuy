#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
ROOT_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"
STATIC_CFG="$ROOT_DIR/static/config.json"
MD_SRC="/Volumes/Omnicron/env/stripe_links_thataiguy_org.md"

AMOUNTS=("1" "5" "10" "20" "25" "50" "100" "1000")
SITE="thataiguy.org"

while [[ $# -gt 0 ]]; do
  case "$1" in
    --amounts) shift; IFS=',' read -r -a AMOUNTS <<< "$1"; shift || true ;;
    --site) SITE="$2"; shift 2 ;;
    -h|--help)
      echo "Usage: $(basename "$0") [--amounts 1,5,10,...] [--site thataiguy.org]"; exit 0;;
    *) echo "Unknown arg: $1" >&2; exit 1 ;;
  esac
done

declare -A URLS

if [[ -f "$MD_SRC" ]]; then
  # Parse existing markdown for Donation $X links
  while IFS= read -r line; do
    if [[ "$line" =~ \-\ \[Donation\ \$([0-9]+)\]\((https://buy\.stripe\.com[^\)]*)\) ]]; then
      AMT="${BASH_REMATCH[1]}"; URL="${BASH_REMATCH[2]}"
      URLS["$AMT"]="$URL"
    fi
  done < "$MD_SRC"
fi

CREATE_BIN="$SCRIPT_DIR/create_stripe_payment_link.sh"

for amt in "${AMOUNTS[@]}"; do
  if [[ -z "${URLS[$amt]:-}" ]]; then
    if [[ -x "$CREATE_BIN" && -n "${STRIPE_SECRET_KEY:-}" ]]; then
      echo "Creating Stripe Payment Link for \$${amt}..."
      NEW_URL=$("$CREATE_BIN" --amount "$amt" --name "Donation \$${amt}" --site "$SITE") || true
      if [[ -n "$NEW_URL" ]]; then
        URLS["$amt"]="$NEW_URL"
      else
        echo "WARN: Failed to create link for \$${amt}" >&2
      fi
    else
      echo "INFO: No existing link for \$${amt} and creation not available (missing STRIPE_SECRET_KEY)." >&2
    fi
  fi
done

# Build JSON array
TMP_JSON=$(mktemp)
{
  echo "["
  first=1
  for amt in "${AMOUNTS[@]}"; do
    url="${URLS[$amt]:-}"
    if [[ -n "$url" ]]; then
      cents=$(( amt * 100 ))
      [[ $first -eq 0 ]] && echo ","
      printf "  { \"amountCents\": %d, \"name\": \"Donate \$%d\", \"url\": \"%s\" }" "$cents" "$amt" "$url"
      first=0
    fi
  done
  echo
  echo "]"
} > "$TMP_JSON"

echo "Updating $STATIC_CFG with stripeLinks..."
python3 - "$STATIC_CFG" "$TMP_JSON" <<'PY'
import sys, json, pathlib
cfg_path = pathlib.Path(sys.argv[1])
links = json.load(open(sys.argv[2]))
cfg = {}
if cfg_path.exists():
    try:
        cfg = json.loads(cfg_path.read_text())
    except Exception:
        cfg = {}
cfg['stripeLinks'] = links
# Choose a default payment link (prefer $25, else smallest)
default = None
for pref in (25,):
    for it in links:
        if int(it.get('amountCents',0)) == pref*100:
            default = it['url']; break
    if default: break
if not default and links:
    default = sorted(links, key=lambda x: int(x.get('amountCents',0)))[0]['url']
if default:
    cfg['stripePaymentLink'] = default
cfg_path.write_text(json.dumps(cfg, indent=2) + "\n")
print("Wrote", cfg_path)
PY

rm -f "$TMP_JSON"
echo "Done."

