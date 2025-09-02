#!/usr/bin/env bash
set -euo pipefail

SITE="aimusicinteraction"
TARGET_SITE_NAME="aimusicinteraction"
TARGET_DOMAIN="aimusicinteraction.org"

# Values from your local config + updates you provided
VENMO_URL="https://venmo.com/u/FreeAICharity"
# Stripe Payment Link (defaults to $25 donation; change if desired)
STRIPE_PAYMENT_LINK="https://buy.stripe.com/14AbJ18to4Rjaglf61gMw1k"
# Cash App handle you provided (keep the leading $ literal)
CASHAPP_HANDLE='$janady07'
# Ensure URL matches handle (keeps the $)
CASHAPP_URL='https://cash.app/$janady07'

# Campaign progress
CAMPAIGN_RAISED=1200
CAMPAIGN_GOAL=5000000

cd "$(dirname "$0")"

if ! command -v netlify >/dev/null 2>&1; then
  echo "Netlify CLI not found. Install with: npm i -g netlify-cli" >&2
  exit 1
fi

echo "Logging into Netlify (a browser window may open if needed)..."
netlify login || true

echo "Ensuring this folder is linked to Netlify site: $TARGET_SITE_NAME ($TARGET_DOMAIN)"
# Try to auto-discover the site ID by name or custom domain
set +e
SITE_ID=$(netlify sites:list --json 2>/dev/null | node -e '
const fs=require("fs");
let data="";process.stdin.setEncoding("utf8");
process.stdin.on("data",d=>data+=d);
process.stdin.on("end",()=>{
  try{
    const arr=JSON.parse(data);
    const name=process.env.TARGET_SITE_NAME;
    const domain=process.env.TARGET_DOMAIN;
    let found=arr.find(s=>s.name===name);
    if(!found){
      found=arr.find(s=>[s.custom_domain,s.url,s.ssl_url].filter(Boolean).some(u=>String(u).includes(domain)));
    }
    if(found){ process.stdout.write(found.id); }
  }catch(e){/* ignore */}
});
')
set -e

if [ -n "${SITE_ID:-}" ]; then
  netlify link --id "$SITE_ID" >/dev/null 2>&1 || true
fi

# Final check: must be linked
if ! netlify status | grep -q "$TARGET_SITE_NAME"; then
  echo "This folder is not linked to $TARGET_SITE_NAME. Running interactive link..." >&2
  netlify link || true
  if ! netlify status | grep -q "$TARGET_SITE_NAME"; then
    echo "Failed to link to $TARGET_SITE_NAME. Run 'netlify link' and choose the site, then rerun." >&2
    exit 1
  fi
fi

echo "Setting environment variables on the linked site..."
netlify env:set VENMO_URL "$VENMO_URL"
netlify env:set STRIPE_PAYMENT_LINK "$STRIPE_PAYMENT_LINK"
netlify env:set CASHAPP_HANDLE "$CASHAPP_HANDLE"
netlify env:set CASHAPP_URL "$CASHAPP_URL"

# Set campaign progress envs
netlify env:set CAMPAIGN_RAISED "$CAMPAIGN_RAISED"
netlify env:set CAMPAIGN_GOAL "$CAMPAIGN_GOAL"

echo "Exporting env locally for build..."
export VENMO_URL STRIPE_PAYMENT_LINK CASHAPP_HANDLE CASHAPP_URL CAMPAIGN_RAISED CAMPAIGN_GOAL

echo "Building static/config.json locally..."
node netlify-build.mjs

echo "Deploying production build to the linked site..."
netlify deploy --prod --dir static

echo "Done. Verify your site and /config.json on Netlify."
