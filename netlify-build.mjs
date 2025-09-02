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

  const json = JSON.stringify(out, null, 2) + '\n';
  await fs.writeFile(cfgPath, json, 'utf8');
  console.log(`netlify-build: wrote ${cfgPath}`);
  console.log(json);

  // Inject build-time donation links into index.html between markers
  try {
    let html = await fs.readFile(indexPath, 'utf8');
    const start = '<!-- DONATION_LINKS_START -->';
    const end = '<!-- DONATION_LINKS_END -->';
    const startIdx = html.indexOf(start);
    const endIdx = html.indexOf(end);
    if (startIdx !== -1 && endIdx !== -1 && endIdx > startIdx) {
      const before = html.slice(0, startIdx + start.length);
      const after = html.slice(endIdx);
      const script = `\n  <script>window.DONATION_LINKS = ${JSON.stringify(out)};<\/script>\n`;
      html = before + script + after;
      await fs.writeFile(indexPath, html, 'utf8');
      console.log('netlify-build: injected DONATION_LINKS into index.html');
    } else {
      console.warn('netlify-build: donation links markers not found in index.html');
    }
  } catch (e) {
    console.warn('netlify-build: failed to inject donation links into index.html', e);
  }
}

main().catch((err) => {
  console.error('netlify-build failed:', err);
  process.exit(1);
});
