import { promises as fs } from 'node:fs';
import path from 'node:path';

// Helper functions with improved error handling
const ensureDir = async (p) => {
  try {
    await fs.mkdir(p, { recursive: true });
  } catch (error) {
    // Ignore if directory already exists
    if (error.code !== 'EEXIST') throw error;
  }
};

const numOrUndefined = (v) => {
  if (v === undefined || v === null || v === '') return undefined;
  const n = Number(v);
  return Number.isFinite(n) ? n : undefined;
};

// Environment variable setters with improved validation
const createSetters = (env, out) => ({
  set: (key, envName) => {
    const value = env[envName]?.toString().trim();
    if (value) out[key] = value;
  },
  setNum: (key, envName) => {
    const num = numOrUndefined(env[envName]);
    if (num !== undefined) out[key] = num;
  }
});

async function main() {
  const root = process.cwd();
  const staticDir = path.join(root, 'static');
  const cfgPath = path.join(staticDir, 'config.json');
  const indexPath = path.join(staticDir, 'index.html');
  
  await ensureDir(staticDir);

  // Load existing config with better error handling
  let cfg = {};
  try {
    const raw = await fs.readFile(cfgPath, 'utf8');
    cfg = JSON.parse(raw);
  } catch (error) {
    console.log('No existing config found, creating new one');
    cfg = {};
  }

  // Merge from environment using modern destructuring
  const env = process.env;
  const out = { ...cfg };
  const { set, setNum } = createSetters(env, out);

  // Set environment variables with improved organization
  const envMappings = [
    ['venmoUrl', 'VENMO_URL'],
    ['venmoHandle', 'VENMO_HANDLE'],
    ['cashAppUrl', 'CASHAPP_URL'],
    ['cashAppHandle', 'CASHAPP_HANDLE'],
    ['stripeUrl', 'STRIPE_URL'],
    ['stripePaymentLink', 'STRIPE_PAYMENT_LINK']
  ];

  const numericMappings = [
    ['campaignRaised', 'CAMPAIGN_RAISED'],
    ['campaignGoal', 'CAMPAIGN_GOAL']
  ];

  // Apply mappings efficiently
  envMappings.forEach(([key, envName]) => set(key, envName));
  numericMappings.forEach(([key, envName]) => setNum(key, envName));

  // Write config with consistent formatting
  const json = JSON.stringify(out, null, 2) + '\n';
  await fs.writeFile(cfgPath, json, 'utf8');
  console.log(`netlify-build: wrote ${cfgPath}`);
  console.log(json);

  // Inject build-time donation links into index.html between markers
  try {
    let html = await fs.readFile(indexPath, 'utf8');
    const markers = {
      start: '<!-- DONATION_LINKS_START -->',
      end: '<!-- DONATION_LINKS_END -->'
    };
    
    const startIdx = html.indexOf(markers.start);
    const endIdx = html.indexOf(markers.end);
    
    if (startIdx !== -1 && endIdx !== -1 && endIdx > startIdx) {
      const before = html.slice(0, startIdx + markers.start.length);
      const after = html.slice(endIdx);
      const script = `\n  <script>window.DONATION_LINKS = ${JSON.stringify(out)};</script>\n`;
      
      html = before + script + after;
      await fs.writeFile(indexPath, html, 'utf8');
      console.log('netlify-build: injected DONATION_LINKS into index.html');
    } else {
      console.warn('netlify-build: donation links markers not found in index.html');
    }
  } catch (error) {
    console.warn('netlify-build: failed to inject donation links into index.html', error.message);
  }
}

main().catch((err) => {
  console.error('netlify-build failed:', err);
  process.exit(1);
});
