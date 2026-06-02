/**
 * Deploy firestore.rules via the Firebase Rules REST API using the
 * Admin SDK service account token (avoids the firebase CLI's serviceusage
 * precheck, which the adminsdk service account lacks permission for).
 *
 * Usage: node deploy-rules.mjs
 */
import { readFileSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';
import admin from 'firebase-admin';

const __dirname = dirname(fileURLToPath(import.meta.url));
const PROJECT_ID = 'e-magios-core-site';
const RULES_PATH = resolve(__dirname, '../../firestore.rules');
const SA_PATH = resolve(__dirname, 'service-account.json');
const BASE = `https://firebaserules.googleapis.com/v1/projects/${PROJECT_ID}`;

const serviceAccount = JSON.parse(readFileSync(SA_PATH, 'utf-8'));
const rulesContent = readFileSync(RULES_PATH, 'utf-8');

admin.initializeApp({ credential: admin.credential.cert(serviceAccount), projectId: PROJECT_ID });

async function token() {
  const { access_token } = await admin.app().options.credential.getAccessToken();
  return access_token;
}

async function api(method, path, body) {
  const res = await fetch(`${BASE}${path}`, {
    method,
    headers: {
      Authorization: `Bearer ${await token()}`,
      'Content-Type': 'application/json',
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  const text = await res.text();
  if (!res.ok) throw new Error(`${method} ${path} -> ${res.status}: ${text}`);
  return text ? JSON.parse(text) : {};
}

async function main() {
  console.log('Creating ruleset from firestore.rules...');
  const ruleset = await api('POST', '/rulesets', {
    source: { files: [{ name: 'firestore.rules', content: rulesContent }] },
  });
  console.log('  ruleset:', ruleset.name);

  const releaseName = `projects/${PROJECT_ID}/releases/cloud.firestore`;
  try {
    await api('PATCH', '/releases/cloud.firestore', {
      release: { name: releaseName, rulesetName: ruleset.name },
    });
    console.log('Updated existing release -> live.');
  } catch (err) {
    if (String(err).includes('404') || String(err).includes('NOT_FOUND')) {
      await api('POST', '/releases', { name: releaseName, rulesetName: ruleset.name });
      console.log('Created release -> live.');
    } else {
      throw err;
    }
  }
  console.log('\nFirestore rules deployed successfully.');
}

main().catch((err) => {
  console.error('Rules deploy failed:', err.message ?? err);
  process.exit(1);
});
