# Import Content Scripts

Scripts to seed Firestore from local `data/*.json` files.

## Prerequisites

1. Download a Firebase service account key:
   - Firebase Console → Project Settings → Service accounts → Generate new private key
   - Save as `scripts/import-content/service-account.json` (never commit this file)

2. Install dependencies:
   ```bash
   cd scripts/import-content
   npm install
   ```

## Import all compendium data

```bash
cd scripts/import-content
npx tsx import-compendium.ts
```

Writes to Firestore collections: `spells`, `schools`, `effects`, `actions`, `skills`, `archetypes`, `basics`, `action_types`, `combat_components`, `craft_components`, `craft_professions`, `craft_specializations`, `recipe_types`, `recipes`.

Also merges version info into `contentManifest/production` without removing manifest entries owned by other import scripts.

## Import news

```bash
cd scripts/import-content
npx tsx import-news.ts
```

Writes to Firestore `news` collection from `data/news.json`.

## Notes

- Document IDs are taken from the `id` field in each JSON record
- Import status defaults to `draft` (`IMPORT_STATUS=published` can override this behavior)
- Version increases only when payload changes; unchanged records keep existing `version`
- Safe to re-run — uses merge writes and preserves workflow metadata
- Run both imports after changing local `data/*.json` content so Firestore and JSON fallback stay aligned

## Content workflow commands

```bash
cd scripts/import-content
npm run workflow:submit-review
npm run workflow:publish
npm run workflow:archive
```

Custom transition example:

```bash
npx tsx content-workflow.ts --from=draft --to=review --role=author --actorId=kaliguri --collection=spells --changeSummary="Spell revision batch"
```
