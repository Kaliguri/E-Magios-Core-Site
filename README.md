<!-- ============================================================
     README.md — single file, two languages.
     English block first (canonical), Русский below, anchor switcher.
     Left-aligned. No AI mentions.
     ============================================================ -->

<a id="top"></a>

<p>
  <a href="#english"><b>English</b></a>
  &nbsp;·&nbsp;
  <a href="#русский"><b>Русский</b></a>
</p>

# E'Magios Core — Companion Site

> Companion web app for the original **E'Magios Core** tabletop RPG: character editor, world compendium, and a global dice-roller widget. A diploma project built on React + Feature-Sliced Design.

<p>
  <a href="https://github.com/Kaliguri/E-Magios-Core-Site/actions"><img alt="Build" src="https://img.shields.io/github/actions/workflow/status/Kaliguri/E-Magios-Core-Site/ci.yml?branch=main&style=flat-square&label=Build&logo=githubactions&logoColor=white"/></a>
  <a href="https://kaliguri.github.io/E-Magios-Core-Site/"><img alt="Status: live" src="https://img.shields.io/badge/Status-live-2ea043?style=flat-square"/></a>
  <img alt="License: All rights reserved" src="https://img.shields.io/badge/License-All_rights_reserved-red?style=flat-square"/>
</p>

|                      |                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                            |
| -------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Frontend**         | <a href="https://react.dev/"><img alt="React 18" src="https://img.shields.io/badge/React_18-20232A?style=flat-square&logo=react&logoColor=61DAFB"/></a> <a href="https://www.typescriptlang.org/"><img alt="TypeScript 5" src="https://img.shields.io/badge/TypeScript_5-3178C6?style=flat-square&logo=typescript&logoColor=white"/></a> <a href="https://vitejs.dev/"><img alt="Vite 5" src="https://img.shields.io/badge/Vite_5-646CFF?style=flat-square&logo=vite&logoColor=white"/></a> <a href="https://reactrouter.com/"><img alt="React Router 6" src="https://img.shields.io/badge/React_Router_6-CA4245?style=flat-square&logo=reactrouter&logoColor=white"/></a> |
| **Backend & data**   | <a href="https://firebase.google.com/docs/auth"><img alt="Firebase Auth" src="https://img.shields.io/badge/Firebase_Auth-FFCA28?style=flat-square&logo=firebase&logoColor=black"/></a> <a href="https://firebase.google.com/docs/firestore"><img alt="Cloud Firestore" src="https://img.shields.io/badge/Cloud_Firestore-FFA000?style=flat-square&logo=firebase&logoColor=white"/></a> <a href="https://github.com/jakearchibald/idb"><img alt="IndexedDB" src="https://img.shields.io/badge/IndexedDB-1F6FEB?style=flat-square"/></a>                                                                                                                                     |
| **Hosting**          | <a href="https://pages.github.com/"><img alt="GitHub Pages" src="https://img.shields.io/badge/GitHub_Pages-222222?style=flat-square&logo=githubpages&logoColor=white"/></a> <a href="https://github.com/features/actions"><img alt="GitHub Actions" src="https://img.shields.io/badge/GitHub_Actions-2088FF?style=flat-square&logo=githubactions&logoColor=white"/></a> <img alt="Static export" src="https://img.shields.io/badge/Static_export-8957E5?style=flat-square"/>                                                                                                                                                                                               |
| **Content pipeline** | <a href="https://github.com/privatenumber/tsx"><img alt="tsx" src="https://img.shields.io/badge/tsx-1F6FEB?style=flat-square"/></a> <a href="https://www.python.org/"><img alt="Python" src="https://img.shields.io/badge/Python-3776AB?style=flat-square&logo=python&logoColor=white"/></a> <img alt="JSON content" src="https://img.shields.io/badge/JSON_content-8957E5?style=flat-square"/>                                                                                                                                                                                                                                                                            |
| **Tooling**          | <a href="https://eslint.org/"><img alt="ESLint 9" src="https://img.shields.io/badge/ESLint_9-4B32C3?style=flat-square&logo=eslint&logoColor=white"/></a> <a href="https://prettier.io/"><img alt="Prettier 3" src="https://img.shields.io/badge/Prettier_3-F7B93E?style=flat-square&logo=prettier&logoColor=black"/></a> <a href="https://vitest.dev/"><img alt="Vitest 2" src="https://img.shields.io/badge/Vitest_2-6E9F18?style=flat-square&logo=vitest&logoColor=white"/></a>                                                                                                                                                                                          |
| **Architecture**     | <img alt="Feature-Sliced Design" src="https://img.shields.io/badge/Feature--Sliced_Design-8957E5?style=flat-square"/> <img alt="Content as Data" src="https://img.shields.io/badge/Content_as_Data-8957E5?style=flat-square"/> <img alt="Status Workflow" src="https://img.shields.io/badge/Status_Workflow-8957E5?style=flat-square"/>                                                                                                                                                                                                                                                                                                                                    |

<p>
  <a href="https://kaliguri.github.io/E-Magios-Core-Site/"><b>▶ Open the site</b></a>
</p>

---

<details>
<summary><b>Screenshots</b></summary>

<br>

<details>
<summary>Character editor</summary>

![Character editor](docs/screenshots/character-editor.png)

</details>

<details>
<summary>Compendium & dice widget</summary>

![Compendium](docs/screenshots/compendium.png)

</details>

<details>
<summary>News</summary>

![News](docs/screenshots/news.png)

</details>

<details>
<summary>Profile & Discord integration</summary>

![Profile](docs/screenshots/profile-discord.png)

</details>

</details>

---

## English

<a href="#top"><b>[↑ Back to top]</b></a>

**E'Magios Core is an original tabletop RPG.** This repository is its digital layer: a player-facing web app built on React + Feature-Sliced Design, paired with an engineering pipeline for publishing world content. It was built as a final qualification (diploma) project.

> **What this project demonstrates:** Feature-Sliced Design at real scale, a content-as-data pipeline with audit and versioning, a role-based access model on top of Firestore, an offline cache in IndexedDB, and a zero-cost deploy guarded by a CI quality gate.

### Key features

| Feature               | Description                                                                        |
| --------------------- | ---------------------------------------------------------------------------------- |
| **Character editor**  | Full-featured character sheet with calculations, equipment, and skills             |
| **Compendium**        | World database: spells, creatures, items, schools of magic — with cross-references |
| **Dice roller**       | Global dice widget with roll history and settings                                  |
| **Content workflow**  | Status-based publication model with audit and versioning                           |
| **Observability MVP** | Free telemetry loop: page views, UI errors, load metrics, an `/ops` page           |
| **Role-based access** | `author / editor / admin` on top of Firestore Security Rules                       |

---

## Русский

<a href="#top"><b>[↑ Наверх]</b></a>

> Веб-приложение авторской настольной ролевой системы **E'Magios Core**: редактор персонажа, компендиум мира и глобальный виджет бросков кубов. Дипломный проект на React + Feature-Sliced Design.

**E'Magios Core** — авторская настольная ролевая система. Этот репозиторий — её цифровой контур: веб-приложение игрока на React + Feature-Sliced Design и инженерный конвейер публикации контента. Выполнен как выпускная квалификационная работа.

> **Что демонстрирует проект:** Feature-Sliced Design в боевом масштабе, конвейер «контент как данные» с аудитом и версионированием, ролевую модель доступа поверх Firestore, офлайн-кэш в IndexedDB и zero-cost деплой под защитой CI quality gate.

### Ключевые возможности

| Возможность             | Описание                                                                                 |
| ----------------------- | ---------------------------------------------------------------------------------------- |
| **Редактор персонажа**  | Полнофункциональный лист персонажа с расчётами, экипировкой и навыками                   |
| **Компендиум**          | База данных мира: заклинания, существа, предметы, школы магии — с перекрёстными ссылками |
| **Броски кубов**        | Глобальный виджет дайсов с историей бросков и настройками                                |
| **Контентный workflow** | Статусная модель публикации с аудитом и версионированием                                 |
| **Observability MVP**   | Бесплатный контур телеметрии: page views, ошибки UI, метрики загрузок, страница `/ops`   |
| **Ролевой доступ**      | `author / editor / admin` поверх Firestore Security Rules                                |

---

<details id="for-developers">
<summary><b>For developers</b></summary>

<br>

### Architecture

```mermaid
flowchart TD
  ContentSource[Markdown & JSON sources] --> ImportScripts[Import scripts]
  ImportScripts --> DraftDocs[status: draft]
  DraftDocs --> ReviewDocs[status: review]
  ReviewDocs --> PublishedDocs[status: published]
  PublishedDocs --> FirestoreRuntime[Firestore runtime]
  FirestoreRuntime --> WebApp[React Web App]
  WebApp --> IndexedDBCache[IndexedDB cache]
  WebApp --> OpsMetrics[Ops / Observability]
  DevPush[Push or PR] --> CIQualityGate[CI Quality Gate]
  CIQualityGate --> DeployPages[Deploy GitHub Pages]
```

The project is structured as a hybrid of three layers:

- **Content pipeline** (`scripts/data-pipeline`, `scripts/import-content`) — normalization and validation of sources, a `draft → review → published → archived` status workflow, content versioning, and a publication audit.
- **Serverless backend** — Firebase Auth + Firestore with a role-based access model in `firestore.rules`; the app reads published documents only.
- **Web app** (`apps/web`) — React + TypeScript + Vite on a Feature-Sliced Design architecture, with an offline cache in IndexedDB and its own observability loop.

### Tech stack

|                      |                                                 |
| -------------------- | ----------------------------------------------- |
| **Frontend**         | React 18, TypeScript 5, Vite 5, React Router 6  |
| **Architecture**     | Feature-Sliced Design                           |
| **Backend**          | Firebase Auth + Cloud Firestore                 |
| **Cache / offline**  | IndexedDB (via `idb`)                           |
| **Content pipeline** | TypeScript (`tsx`) + Python                     |
| **Quality**          | ESLint 9, Prettier 3, Vitest 2, Testing Library |
| **CI/CD**            | GitHub Actions + GitHub Pages                   |

### Repository layout

```text
E-Magios-Core-Site/
├── apps/web/                    # React + TypeScript + Vite (Feature-Sliced Design)
├── scripts/import-content/      # Firestore import + workflow + smoke checks
├── scripts/data-pipeline/       # normalize / validate / relations / report
├── data/                        # source JSON for import
├── reports/                     # generated validation and data reports
├── docs/                        # project documentation and UX audit
├── .github/workflows/           # CI and deploy
├── firestore.rules              # role-based access model
└── firestore.indexes.json       # Firestore indexes
```

### Local development

**Web app:**

```bash
cd apps/web
npm install
npm run dev
```

**Import scripts:**

```bash
cd scripts/import-content
npm install
npm run check
```

**Data processing:**

```bash
python scripts/data-pipeline/process_data.py --no-fail-on-errors
```

> Importing into Firestore requires `scripts/import-content/service-account.json`.

### Quality gate

`apps/web`:

```bash
npm run lint
npm run format:check
npm run typecheck
npm run test
npm run check    # aggregator
```

`scripts/import-content`:

```bash
npm run typecheck
npm run smoke
npm run check    # aggregator
```

### CI/CD

| Workflow                       | Trigger                              | Purpose                                                                                                                           |
| ------------------------------ | ------------------------------------ | --------------------------------------------------------------------------------------------------------------------------------- |
| `.github/workflows/ci.yml`     | `pull_request`, `push` to `main/dev` | Install dependencies, run `check` + `build` for `apps/web` and `import-content`, generate data-pipeline reports, verify artifacts |
| `.github/workflows/deploy.yml` | `push` to `main`                     | Build `apps/web` → publish `dist-react` to GitHub Pages                                                                           |

### Content workflow

Supported statuses: `draft`, `review`, `published`, `archived`. Transitions run through `scripts/import-content/content-workflow.ts`; the audit trail is written to `content_publication_log`.

```bash
cd scripts/import-content
npm run workflow:submit-review
npm run workflow:publish
npm run workflow:archive
```

### Content versioning

- `doc.version` is incremented only on a real payload change;
- unchanged documents keep their previous version;
- the `contentManifest/production` manifest updates `collections.<name>.version`, `contentRevision`, `release.version`, `release.tag`, `release.changedCollections`, and `release.changedDocs`.

### Observability MVP

A free observability loop:

- `ErrorBoundary` records UI failures to `client_telemetry`;
- routing writes `page_view`;
- data loads write `cache_hit`, `data_fetch_success`, `data_fetch_error`;
- the `/ops` page shows recent telemetry events, publication logs, and an aggregated summary.

### Security & roles

`firestore.rules` support the `author`, `editor`, and `admin` roles. For content collections:

- public read only when `status == "published"`;
- create/update are restricted by role and by allowed status transitions;
- `content_publication_log` and `client_telemetry` are readable only by `editor/admin`;
- `client_telemetry` allows `create` only for authenticated users.

</details>

---

## License

© 2026 Гайдарь М.Д. (Max Gaida). All rights reserved.

This repository is public for portfolio and demonstration purposes only.
No license is granted to use, copy, modify, or distribute any part of it
without prior written permission from the author.

See [LICENSE.md](LICENSE.md) for details.
