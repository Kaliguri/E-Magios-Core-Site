import { initializeApp, cert, type ServiceAccount } from 'firebase-admin/app';
import { getFirestore, FieldValue } from 'firebase-admin/firestore';
import { readFileSync } from 'fs';
import { dirname, resolve } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const PROJECT_ID = 'e-magios-core-site';

type ContentStatus = 'draft' | 'review' | 'published' | 'archived';
type Role = 'author' | 'editor' | 'admin';

const COLLECTIONS = [
  'spells',
  'schools',
  'effects',
  'actions',
  'skills',
  'archetypes',
  'basics',
  'action_types',
  'combat_components',
  'craft_components',
  'craft_professions',
  'craft_specializations',
  'recipe_types',
  'recipes',
  'news',
] as const;

function parseArgs() {
  const map = new Map<string, string>();
  for (const arg of process.argv.slice(2)) {
    if (!arg.startsWith('--')) continue;
    const [key, value] = arg.slice(2).split('=');
    if (key && value) map.set(key, value);
  }
  return {
    from: (map.get('from') ?? 'draft') as ContentStatus,
    to: (map.get('to') ?? 'review') as ContentStatus,
    role: (map.get('role') ?? 'author') as Role,
    actorId: map.get('actorId') ?? 'system',
    collection: map.get('collection') ?? 'all',
    changeSummary: map.get('changeSummary') ?? 'Status transition',
  };
}

function getServiceAccount(): ServiceAccount {
  const saPath = resolve(__dirname, 'service-account.json');
  return JSON.parse(readFileSync(saPath, 'utf-8')) as ServiceAccount;
}

function isAllowedTransition(from: ContentStatus, to: ContentStatus, role: Role): boolean {
  if (from === to) return false;
  if (role === 'admin') return true;
  if (role === 'author') return from === 'draft' && to === 'review';
  if (role === 'editor') {
    return (
      (from === 'review' && to === 'published') ||
      (from === 'published' && to === 'archived') ||
      (from === 'review' && to === 'draft')
    );
  }
  return false;
}

async function transitionCollection(
  collectionName: string,
  from: ContentStatus,
  to: ContentStatus,
  role: Role,
  actorId: string,
  changeSummary: string,
) {
  const db = getFirestore();
  const snapshot = await db.collection(collectionName).where('status', '==', from).get();
  if (snapshot.empty) {
    console.log(`No documents in ${collectionName} with status ${from}`);
    return;
  }

  const batch = db.batch();
  let updated = 0;

  for (const doc of snapshot.docs) {
    const ref = db.collection(collectionName).doc(doc.id);
    const data: Record<string, unknown> = {
      status: to,
      updatedAt: FieldValue.serverTimestamp(),
      changeSummary,
    };

    if (to === 'review') data['reviewRequestedAt'] = FieldValue.serverTimestamp();
    if (to === 'published') data['publishedAt'] = FieldValue.serverTimestamp();
    if (to === 'published' || to === 'archived' || to === 'draft') data['reviewerId'] = actorId;

    batch.set(ref, data, { merge: true });

    const logRef = db.collection('content_publication_log').doc();
    batch.set(logRef, {
      collection: collectionName,
      docId: doc.id,
      fromStatus: from,
      toStatus: to,
      actorRole: role,
      actorId,
      changeSummary,
      createdAt: FieldValue.serverTimestamp(),
    });

    updated++;
  }

  await batch.commit();
  console.log(`Transitioned ${updated} docs in ${collectionName}: ${from} -> ${to}`);
}

async function run() {
  const args = parseArgs();

  if (!isAllowedTransition(args.from, args.to, args.role)) {
    throw new Error(`Transition ${args.from} -> ${args.to} is not allowed for role ${args.role}`);
  }

  initializeApp({
    credential: cert(getServiceAccount()),
    projectId: PROJECT_ID,
  });

  const targetCollections = args.collection === 'all' ? [...COLLECTIONS] : [args.collection];
  for (const collectionName of targetCollections) {
    await transitionCollection(
      collectionName,
      args.from,
      args.to,
      args.role,
      args.actorId,
      args.changeSummary,
    );
  }
}

run().catch((error) => {
  console.error(error);
  process.exit(1);
});
