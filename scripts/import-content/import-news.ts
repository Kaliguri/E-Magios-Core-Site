/**
 * Seed Firestore news collection from data/news.json
 *
 * Usage:
 *   GOOGLE_APPLICATION_CREDENTIALS=./service-account.json npx tsx import-news.ts
 */

import { readFileSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';
import { initializeApp, cert, type ServiceAccount } from 'firebase-admin/app';
import { getFirestore, FieldValue } from 'firebase-admin/firestore';

const __dirname = dirname(fileURLToPath(import.meta.url));
const DATA_DIR = resolve(__dirname, '../../data');
const PROJECT_ID = 'e-magios-core-site';

interface NewsItem {
  id: string;
  date: string;
  title: string;
  brief: string;
  features: string[];
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

  const newsPath = resolve(DATA_DIR, 'news.json');
  const items = JSON.parse(readFileSync(newsPath, 'utf-8')) as NewsItem[];

  console.log(`Importing ${items.length} news items...`);

  const batch = db.batch();

  for (const item of items) {
    const ref = db.collection('news').doc(item.id);
    batch.set(ref, {
      ...item,
      status: 'published',
      version: 1,
      updatedAt: FieldValue.serverTimestamp(),
      publishedAt: FieldValue.serverTimestamp(),
    });
  }

  await batch.commit();

  // Update manifest for news collection
  const manifestRef = db.collection('contentManifest').doc('production');
  await manifestRef.set({
    collections: {
      news: {
        version: 1,
        updatedAt: FieldValue.serverTimestamp(),
      },
    },
  }, { merge: true });

  console.log(`Done: ${items.length} news items written.`);
}

main().catch(err => {
  console.error('Import failed:', err);
  process.exit(1);
});
