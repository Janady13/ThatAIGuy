import { promises as fs } from 'node:fs';
import path from 'node:path';

async function ensureDir(p) {
  await fs.mkdir(p, { recursive: true }).catch(() => {});
}

function numOrUndefined(v) {
  if (v === undefined || v === null || v === '') return undefined;
  const n = Number(v);
  return Number.isFinite(n) ? n : undefined;
}

async function main() {
  const root = process.cwd();
  const staticDir = path.join(root, 'static');
  const cfgPath = path.join(staticDir, 'config.json');
  const indexPath = path.join(staticDir, 'index.html');
  await ensureDir(staticDir);

  // Load existing config if present
  let cfg = {};
  try {
    const raw = await fs.readFile(cfgPath, 'utf8');
    cfg = JSON.parse(raw);
  } catch (_) {
    cfg = {};
  }

  // Merge from environment
  const env = process.env;
  const out = { ...cfg };

  const set = (key, envName) => {
    const v = (env[envName] || '').toString().trim();
    if (v) out[key] = v;
  };
  const setNum = (key, envName) => {
    const n = numOrUndefined(env[envName]);
    if (n !== undefined) out[key] = n;
  };

  set('venmoUrl', 'VENMO_URL');
  set('venmoHandle', 'VENMO_HANDLE');
  set('cashAppUrl', 'CASHAPP_URL');
  set('cashAppHandle', 'CASHAPP_HANDLE');
  // PayPal deprecated in UI; kept for back-compat but ignored
  // set('paypalUrl', 'PAYPAL_URL');
  set('stripeUrl', 'STRIPE_URL');
  set('stripePaymentLink', 'STRIPE_PAYMENT_LINK');
  setNum('campaignRaised', 'CAMPAIGN_RAISED');
  setNum('campaignGoal', 'CAMPAIGN_GOAL');

  // Write config.json for client-side access instead of injecting inline scripts
  const json = JSON.stringify(out, null, 2) + '\n';
  await fs.writeFile(cfgPath, json, 'utf8');
  console.log(`netlify-build: wrote ${cfgPath}`);
  console.log(json);

  // Note: Donation links data is available in config.json for CSP-compliant client-side loading
  // Removed inline script injection to comply with Content Security Policy
}

main().catch((err) => {
  console.error('netlify-build failed:', err);
  process.exit(1);
});
