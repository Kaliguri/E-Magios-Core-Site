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
import { hasPayloadChanges, nextVersion } from './content-sync-utils';

const __dirname = dirname(fileURLToPath(import.meta.url));
const DATA_DIR = resolve(__dirname, '../../data');
const PROJECT_ID = 'e-magios-core-site';
const IMPORT_STATUS = (process.env.IMPORT_STATUS ?? 'draft').toLowerCase();
const IMPORT_AUTHOR_ID = process.env.IMPORT_AUTHOR_ID ?? 'import-bot';
const IMPORT_CHANGE_SUMMARY = process.env.IMPORT_CHANGE_SUMMARY ?? 'News import from local data';

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
  let changed = 0;

  for (const item of items) {
    const ref = db.collection('news').doc(item.id);
    const existingSnap = await ref.get();
    const existing = existingSnap.exists ? (existingSnap.data() as Record<string, unknown>) : null;
    const payloadChanged = hasPayloadChanges(existing, item as unknown as Record<string, unknown>);
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
      publishedAt: nextStatus === 'published' ? FieldValue.serverTimestamp() : existing?.['publishedAt'] ?? null,
    }, { merge: true });

    if (payloadChanged) {
      const logRef = db.collection('content_publication_log').doc();
      batch.set(logRef, {
        collection: 'news',
        docId: item.id,
        actorId: IMPORT_AUTHOR_ID,
        actorRole: 'author',
        fromStatus: prevStatus,
        toStatus: nextStatus,
        changeSummary: IMPORT_CHANGE_SUMMARY,
        createdAt: FieldValue.serverTimestamp(),
      });
      changed++;
    }
  }

  await batch.commit();

  const manifestRef = db.collection('contentManifest').doc('production');
  const manifestSnap = await manifestRef.get();
  const manifest = manifestSnap.exists ? (manifestSnap.data() as Record<string, unknown>) : {};
  const prevCollections = (manifest['collections'] ?? {}) as Record<string, Record<string, unknown>>;
  const prevNewsVersion = Number(prevCollections['news']?.['version'] ?? 0) || 0;
  const prevRelease =
    Number((manifest['release'] as Record<string, unknown> | undefined)?.['version'] ?? 0) || 0;
  const nextRelease = changed > 0 ? prevRelease + 1 : prevRelease;

  await manifestRef.set({
    contentRevision: nextRelease,
    release: {
      version: nextRelease,
      tag: `r${nextRelease}`,
      changedCollections: changed > 0 ? 1 : 0,
      changedDocs: changed,
      updatedAt: FieldValue.serverTimestamp(),
    },
    collections: {
      news: {
        version: changed > 0 ? prevNewsVersion + 1 : Math.max(1, prevNewsVersion),
        updatedAt: FieldValue.serverTimestamp(),
      },
    },
  }, { merge: true });

  console.log(`Done: ${items.length} news items written. Changed: ${changed}.`);
}

main().catch(err => {
  console.error('Import failed:', err);
  process.exit(1);
});
