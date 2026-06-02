import { readFileSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const DATA_DIR = resolve(__dirname, '../../data');

type JsonRecord = Record<string, unknown>;

const REQUIRED_COLLECTIONS = [
  'spells.json',
  'schools.json',
  'effects.json',
  'actions.json',
  'skills.json',
  'archetypes.json',
  'basics.json',
  'action_types.json',
  'combat_components.json',
  'craft_components.json',
  'craft_professions.json',
  'craft_specializations.json',
  'recipe_types.json',
  'recipes.json',
  'news.json',
];

function readJsonArray(fileName: string): JsonRecord[] {
  const filePath = resolve(DATA_DIR, fileName);
  const raw = readFileSync(filePath, 'utf-8');
  const parsed = JSON.parse(raw) as unknown;
  if (!Array.isArray(parsed)) {
    throw new Error(`File ${fileName} must contain an array`);
  }
  return parsed as JsonRecord[];
}

function validateIds(fileName: string, records: JsonRecord[]) {
  const ids = new Set<string>();
  for (const record of records) {
    const id = String(record['id'] ?? '').trim();
    if (!id) {
      throw new Error(`File ${fileName} has record without id`);
    }
    if (ids.has(id)) {
      throw new Error(`File ${fileName} has duplicate id: ${id}`);
    }
    ids.add(id);
  }
}

function run() {
  let total = 0;
  for (const fileName of REQUIRED_COLLECTIONS) {
    const records = readJsonArray(fileName);
    validateIds(fileName, records);
    total += records.length;
    console.log(`Smoke check passed: ${fileName} (${records.length} records)`);
  }
  console.log(`Smoke check completed. Total records: ${total}`);
}

run();
