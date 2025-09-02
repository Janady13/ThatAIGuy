#!/usr/bin/env bash
set -Eeuo pipefail

echo "==> Fixing code/Debug overlay on aimusicinteraction.org"

ROOT="$HOME/donation_platform"
SITE="$ROOT/static"
INDEX="$SITE/index.html"

if [[ ! -f "$INDEX" ]]; then
  echo "ERROR: $INDEX not found. Are you in the right repo?"
  exit 1
fi

STAMP="$(date +%Y%m%d_%H%M%S)"
BACKUP="$INDEX.bak.$STAMP"
cp "$INDEX" "$BACKUP"
echo "Backed up index.html -> $BACKUP"

# 1) Strip any obvious debug/code-dump blocks that slipped into index.html
#    Remove blocks between common DEBUG markers if present
perl -0777 -pe 's|<!--\s*(DEBUG|DEV(?:EL)OP?MENT)(?: OVERLAY)?\s*START\s*-->.*?<!--\s*\1(?: OVERLAY)?\s*END\s*-->||gis' "$INDEX" > "$INDEX.tmp" && mv "$INDEX.tmp" "$INDEX"

#    Remove <pre>/<code> blocks that contain telltale tokens from your screenshot/logs
perl -0777 -pe 's|<(pre|code)([^>]*)>.*?(ai_brain|netlify/functions|marketing_worker|jobs_queue\.txt|node-fetch|coindesk|reddit\.com).*?</\1>||gis' "$INDEX" > "$INDEX.tmp" && mv "$INDEX.tmp" "$INDEX"

# 2) Add a CSS kill-switch to hide any remaining overlays (belt-and-suspenders)
mkdir -p "$SITE/css"
CSS="$SITE/css/fix-overlay.css"
cat > "$CSS" <<'CSS'
/* Kill any debug/code overlay that might slip into prod */
#debug, #debug-overlay, .debug, .dev-overlay, pre.debug, .code-dump { display:none !important; }
pre[style*="position: fixed"], pre[style*="z-index: 999"], code[style*="position: fixed"] { display:none !important; }
/* Target only debug-related elements; avoid hiding legitimate overlays */
[id*="debug"], [class*="debug"] { display:none !important; }
CSS
echo "Wrote $CSS"

# Inject CSS once (before </head>)
if ! grep -q 'css/fix-overlay.css' "$INDEX"; then
  perl -0777 -pe 's|</head>|  <link rel="stylesheet" href="css/fix-overlay.css"/>\n</head>|i' "$INDEX" > "$INDEX.tmp" && mv "$INDEX.tmp" "$INDEX"
  echo "Injected CSS kill-switch into <head>."
else
  echo "CSS kill-switch already linked."
fi

# 3) Regenerate config.json locally so you see current env reflected
if [[ -f "$ROOT/netlify-build.mjs" ]]; then
  echo "Exporting env and regenerating static/config.json via netlify-build.mjs ..."
  export VENMO_URL="https://venmo.com/u/FreeAICharity"
  export STRIPE_PAYMENT_LINK="https://buy.stripe.com/test_123"
  export CASHAPP_HANDLE='$janady07'
  export CASHAPP_URL='https://cash.app/$janady07'
  export CAMPAIGN_RAISED=1200
  export CAMPAIGN_GOAL=5000000
  (cd "$ROOT" && node netlify-build.mjs) || true
fi

# 4) Deploy to Netlify
echo "==> Deploying to Netlify (prod)"
cd "$ROOT"
netlify deploy --prod --dir "$SITE"

# 5) Quick post-deploy smoke-check: look for leaked tokens in live HTML
echo "==> Verifying that debug tokens are not present in prod HTML..."
if curl -fsSL https://aimusicinteraction.org | grep -E 'netlify/functions|marketing_worker|node-fetch|reddit\.com|coindesk|jobs_queue\.txt' >/dev/null; then
  echo "WARNING: Suspicious tokens still found in live HTML. The build pipeline may be re-injecting them."
else
  echo "OK: No suspicious tokens found in live HTML."
fi

# Open the site for a visual check
open "https://aimusicinteraction.org" || true

echo "✅ Done."
