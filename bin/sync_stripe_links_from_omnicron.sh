#!/usr/bin/env bash
set -euo pipefail

# Import Stripe Payment Links from /Volumes/Omnicron/env/stripe_links_thataiguy_org.md
# Writes donation links to stripeLinks and business offerings to stripeBusinessLinks

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
ROOT_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"
STATIC_CFG="$ROOT_DIR/static/config.json"
SRC_MD="/Volumes/Omnicron/env/stripe_links_thataiguy_org.md"

if [[ ! -f "$SRC_MD" ]]; then
  echo "source markdown not found: $SRC_MD" >&2
  exit 1
fi

python3 - "$STATIC_CFG" "$SRC_MD" <<'PY'
import sys, json, re, pathlib
cfg_path = pathlib.Path(sys.argv[1])
md_path = pathlib.Path(sys.argv[2])

don = []
biz = []
pat = re.compile(r"^- \[(?P<label>[^\]]+)\]\((?P<url>https://buy\.stripe\.com[^\)]*)\)")
for line in md_path.read_text().splitlines():
    m = pat.match(line.strip())
    if not m:
        continue
    label = m.group('label').strip()
    url = m.group('url').strip()
    m_don = re.match(r"Donation \$(\d+)$", label)
    if m_don:
        amt = int(m_don.group(1))
        don.append({"amountCents": amt*100, "name": f"Donate ${amt}", "url": url})
    else:
        biz.append({"name": label, "url": url})

cfg = {}
if cfg_path.exists():
    try:
        cfg = json.loads(cfg_path.read_text())
    except Exception:
        cfg = {}

if don:
    don.sort(key=lambda x: int(x.get('amountCents',0)))
    cfg['stripeLinks'] = don
    # Set default stripePaymentLink based on $25 if present, otherwise smallest
    preferred = next((x['url'] for x in don if int(x.get('amountCents',0)) == 2500), None)
    if not preferred:
        preferred = don[0]['url']
    cfg['stripePaymentLink'] = preferred

if biz:
    cfg['stripeBusinessLinks'] = biz

cfg_path.write_text(json.dumps(cfg, indent=2) + "\n")
print(f"Wrote {cfg_path} (donation_links={len(don)}, business_links={len(biz)})")
PY

echo "Sync complete from $SRC_MD"
