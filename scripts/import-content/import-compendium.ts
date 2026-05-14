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

const __dirname = dirname(fileURLToPath(import.meta.url));
const DATA_DIR = resolve(__dirname, '../../data');
const PROJECT_ID = 'e-magios-core-site';

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
): Promise<void> {
  const items = loadJson<Record<string, unknown>>(config.file);
  console.log(`Importing ${items.length} items into '${config.collection}'...`);

  let batch: WriteBatch = db.batch();
  let count = 0;

  for (const item of items) {
    const id = String(item['id'] ?? '');
    if (!id) {
      console.warn(`  Skipping item without id in ${config.file}`);
      continue;
    }

    const ref = db.collection(config.collection).doc(id);
    batch.set(ref, {
      ...item,
      status: 'published',
      version: 1,
      updatedAt: FieldValue.serverTimestamp(),
    });

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

  console.log(`  Done: ${count} docs written to '${config.collection}'.`);
}

async function updateManifest(
  db: FirebaseFirestore.Firestore,
  collections: CollectionConfig[],
): Promise<void> {
  const ref = db.collection('contentManifest').doc('production');
  const collectionsMap: Record<string, { version: number; updatedAt: FirebaseFirestore.FieldValue }> = {};

  for (const c of collections) {
    collectionsMap[c.collection] = {
      version: 1,
      updatedAt: FieldValue.serverTimestamp(),
    };
  }

  await ref.set({
    environment: 'production',
    publishedAt: FieldValue.serverTimestamp(),
    collections: collectionsMap,
  }, { merge: true });

  console.log('Content manifest updated.');
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

  for (const config of COLLECTIONS) {
    await importCollection(db, config);
  }

  await updateManifest(db, COLLECTIONS);
  console.log('\nAll compendium data imported successfully.');
}

main().catch(err => {
  console.error('Import failed:', err);
  process.exit(1);
});
