/**
 * Seed Firestore compendium collections from data/*.json
 *
 * Usage:
 *   GOOGLE_APPLICATION_CREDENTIALS=./service-account.json npx tsx import-compendium.ts
 *
 * Place service-account.json in scripts/import-content/ (never commit it).
 */

import { readFileSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';
import { initializeApp, cert, type ServiceAccount } from 'firebase-admin/app';
import { getFirestore, FieldValue, type WriteBatch } from 'firebase-admin/firestore';
import { hasPayloadChanges, nextVersion } from './content-sync-utils';

const __dirname = dirname(fileURLToPath(import.meta.url));
const DATA_DIR = resolve(__dirname, '../../data');
const PROJECT_ID = 'e-magios-core-site';
const IMPORT_STATUS = (process.env.IMPORT_STATUS ?? 'draft').toLowerCase();
const IMPORT_AUTHOR_ID = process.env.IMPORT_AUTHOR_ID ?? 'import-bot';
const IMPORT_CHANGE_SUMMARY = process.env.IMPORT_CHANGE_SUMMARY ?? 'Compendium import from local data';

function loadJson<T>(file: string): T[] {
  const path = resolve(DATA_DIR, file);
  const raw = readFileSync(path, 'utf-8');
  return JSON.parse(raw) as T[];
}

interface CollectionConfig {
  file: string;
  collection: string;
}

const COLLECTIONS: CollectionConfig[] = [
  { file: 'spells.json', collection: 'spells' },
  { file: 'schools.json', collection: 'schools' },
  { file: 'effects.json', collection: 'effects' },
  { file: 'actions.json', collection: 'actions' },
  { file: 'skills.json', collection: 'skills' },
  { file: 'archetypes.json', collection: 'archetypes' },
  { file: 'basics.json', collection: 'basics' },
  { file: 'action_types.json', collection: 'action_types' },
  { file: 'combat_components.json', collection: 'combat_components' },
  { file: 'craft_components.json', collection: 'craft_components' },
  { file: 'craft_professions.json', collection: 'craft_professions' },
  { file: 'craft_specializations.json', collection: 'craft_specializations' },
  { file: 'recipe_types.json', collection: 'recipe_types' },
  { file: 'recipes.json', collection: 'recipes' },
];

const BATCH_SIZE = 400;

async function importCollection(
  db: FirebaseFirestore.Firestore,
  config: CollectionConfig,
): Promise<{ changed: number; total: number }> {
  const items = loadJson<Record<string, unknown>>(config.file);
  console.log(`Importing ${items.length} items into '${config.collection}'...`);

  let batch: WriteBatch = db.batch();
  let count = 0;
  let changed = 0;

  for (const item of items) {
    const id = String(item['id'] ?? '');
    if (!id) {
      console.warn(`  Skipping item without id in ${config.file}`);
      continue;
    }

    const ref = db.collection(config.collection).doc(id);
    const existingSnap = await ref.get();
    const existing = existingSnap.exists ? (existingSnap.data() as Record<string, unknown>) : null;
    const payloadChanged = hasPayloadChanges(existing, item);
    const version = nextVersion(existing, payloadChanged);
    const prevStatus = String(existing?.['status'] ?? IMPORT_STATUS);
    const nextStatus = payloadChanged ? IMPORT_STATUS : prevStatus;

    batch.set(ref, {
      ...item,
      status: nextStatus,
      version,
      authorId: String(existing?.['authorId'] ?? IMPORT_AUTHOR_ID),
      reviewerId: existing?.['reviewerId'] ?? null,
      changeSummary: payloadChanged ? IMPORT_CHANGE_SUMMARY : String(existing?.['changeSummary'] ?? ''),
      createdAt: existing?.['createdAt'] ?? FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
    }, { merge: true });

    if (payloadChanged) {
      const logRef = db.collection('content_publication_log').doc();
      batch.set(logRef, {
        collection: config.collection,
        docId: id,
        actorId: IMPORT_AUTHOR_ID,
        actorRole: 'author',
        fromStatus: prevStatus,
        toStatus: nextStatus,
        changeSummary: IMPORT_CHANGE_SUMMARY,
        createdAt: FieldValue.serverTimestamp(),
      });
      changed++;
    }

    count++;
    if (count % BATCH_SIZE === 0) {
      await batch.commit();
      batch = db.batch();
      console.log(`  Committed ${count} docs...`);
    }
  }

  if (count % BATCH_SIZE !== 0) {
    await batch.commit();
  }

  console.log(`  Done: ${count} docs written to '${config.collection}', changed: ${changed}.`);
  return { changed, total: count };
}

async function updateManifest(
  db: FirebaseFirestore.Firestore,
  results: Record<string, { changed: number; total: number }>,
): Promise<void> {
  const ref = db.collection('contentManifest').doc('production');
  const prevSnap = await ref.get();
  const prevManifest = prevSnap.exists ? (prevSnap.data() as Record<string, unknown>) : {};
  const prevCollections = (prevManifest['collections'] ?? {}) as Record<string, Record<string, unknown>>;
  const prevRelease =
    Number((prevManifest['release'] as Record<string, unknown> | undefined)?.['version'] ?? 0) || 0;

  const collectionsMap: Record<string, { version: number; updatedAt: FirebaseFirestore.FieldValue }> =
    {};
  let changedCollections = 0;
  let changedDocsTotal = 0;

  for (const [collection, result] of Object.entries(results)) {
    const prevVersion = Number(prevCollections[collection]?.['version'] ?? 0) || 0;
    const changed = result.changed > 0;
    collectionsMap[collection] = {
      version: changed ? prevVersion + 1 : Math.max(1, prevVersion),
      updatedAt: FieldValue.serverTimestamp(),
    };
    if (changed) changedCollections++;
    changedDocsTotal += result.changed;
  }

  const releaseVersion = changedDocsTotal > 0 ? prevRelease + 1 : prevRelease;

  await ref.set({
    environment: 'production',
    publishedAt: FieldValue.serverTimestamp(),
    contentRevision: releaseVersion,
    release: {
      version: releaseVersion,
      tag: `r${releaseVersion}`,
      changedCollections,
      changedDocs: changedDocsTotal,
      updatedAt: FieldValue.serverTimestamp(),
    },
    collections: collectionsMap,
  }, { merge: true });

  console.log(`Content manifest updated. Release r${releaseVersion}, changed docs: ${changedDocsTotal}.`);
}

async function main(): Promise<void> {
  let serviceAccount: ServiceAccount;
  try {
    const saPath = resolve(__dirname, 'service-account.json');
    serviceAccount = JSON.parse(readFileSync(saPath, 'utf-8')) as ServiceAccount;
  } catch {
    console.error(
      'service-account.json not found. Download it from Firebase Console > Project Settings > Service accounts.',
    );
    process.exit(1);
  }

  initializeApp({
    credential: cert(serviceAccount),
    projectId: PROJECT_ID,
  });

  const db = getFirestore();
  const results: Record<string, { changed: number; total: number }> = {};

  for (const config of COLLECTIONS) {
    results[config.collection] = await importCollection(db, config);
  }

  await updateManifest(db, results);
  console.log('\nAll compendium data imported successfully.');
}

main().catch(err => {
  console.error('Import failed:', err);
  process.exit(1);
});
