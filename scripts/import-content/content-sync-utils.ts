type JsonRecord = Record<string, unknown>;

const METADATA_FIELDS = new Set([
  'status',
  'version',
  'authorId',
  'reviewerId',
  'changeSummary',
  'createdAt',
  'updatedAt',
  'publishedAt',
  'reviewRequestedAt',
  'schemaVersion',
]);

function sortObject(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(sortObject);
  if (value && typeof value === 'object') {
    return Object.keys(value as JsonRecord)
      .sort()
      .reduce<JsonRecord>((acc, key) => {
        acc[key] = sortObject((value as JsonRecord)[key]);
        return acc;
      }, {});
  }
  return value;
}

export function normalizedPayload(data: JsonRecord): JsonRecord {
  return Object.keys(data).reduce<JsonRecord>((acc, key) => {
    if (!METADATA_FIELDS.has(key)) acc[key] = data[key];
    return acc;
  }, {});
}

export function hasPayloadChanges(existing: JsonRecord | null, incoming: JsonRecord): boolean {
  if (!existing) return true;
  const a = JSON.stringify(sortObject(normalizedPayload(existing)));
  const b = JSON.stringify(sortObject(normalizedPayload(incoming)));
  return a !== b;
}

export function nextVersion(existing: JsonRecord | null, changed: boolean): number {
  const prev = Number(existing?.['version'] ?? 0);
  if (prev <= 0) return 1;
  return changed ? prev + 1 : prev;
}
