# План миграции E'Magios Core: legacy → `apps/web` (React/FSD)

> Рабочий справочник миграции. От него отталкиваемся при переносе. Документ живой —
> по мере выполнения фаз отмечаем статус и фиксируем принятые решения в разделе
> [Журнал решений](#журнал-решений).

## 0. Контекст и принципы

**Что переносим:** legacy-сайт на vanilla HTML+CSS+JS+Firebase (файлы в корне репозитория:
`db.js`, `character-editor.js`, `news.js`, `profile.js`, `dashboard.js`, `lobby.js`, статические
книги в `phb/`, `spellbook/`, `master/`, `craftbook/`, `rumors/`) → в SPA на
**React 18 + TypeScript + Vite + React Router + Firebase + idb** в `apps/web`, по архитектуре
**Feature-Sliced Design** (`entities / features / pages / widgets / shared`).

**Решения по проекту (зафиксированы):**

- Стек и архитектуру **не меняем**. React+FSD — финальный выбор. Вторая миграция — главный риск.
- Оценивается **сам веб-продукт** (функционал + UX в демо), поэтому приоритет — работающие
  и отполированные фичи витрины.
- **Lobby (реалтайм-мультиплеер) вырезается целиком** — `lobby.html`, `lobby-room.html`,
  `lobby.js`, любые `features/lobby`, `entities/lobby`, страницы lobby.
- **UI-парность со старым сайтом — пожелание, не требование.** Старый вид как база, можно
  улучшать в сторону референсов [Posleslovie](https://github.com/Kaliguri/Posleslovie) и
  [Guildmaster-Autobattler](https://github.com/Kaliguri/Guildmaster-Autobattler).
- **Dashboard — обязателен** (наличие критично). В этой итерации переносим «как есть» по
  функционалу; глубокий реворк — отдельной задачей позже.
- Дедлайн не главное — приоритет качеству и полноте.

**Принципы исполнения (применять в каждой фазе):**

1. **Вертикальный срез.** Одну фичу доводим до конца целиком: `данные → repository → state/hooks
   → UI → тесты → полировка`. Не размазываем десять фич по чуть-чуть.
2. **Один срез = один PR**, в котором `npm run check` (`apps/web`) зелёный: `lint`,
   `format:check`, `typecheck`, `test`.
3. **Источник истины поведения — старые JS-файлы.** Читаем их по фиче, а не целиком, и
   воспроизводим формулы/правила 1:1 (особенно расчёты персонажа и метрики дашборда).
4. **Сначала переиспользуем `shared/ui`**, и только если примитива нет — добавляем его туда же,
   а не локально в виджет.

---

## 1. Конвенции архитектуры (как писать, чтобы не разъехалось)

Слои FSD (импорт только «вниз»: `pages → widgets → features → entities → shared`):

| Слой | Назначение | Примеры в репозитории |
|---|---|---|
| `shared` | Технический фундамент без бизнес-смысла | `shared/ui` (примитивы), `shared/cache/idb`, `shared/firebase`, `shared/repositories`, `shared/telemetry`, `shared/config`, `shared/nav` |
| `entities` | Доменные модели + маппинг DTO↔модель | `entities/compendium` (config/dto/mappers/schema/types), `entities/content`, `entities/character`, `entities/user` |
| `features` | Пользовательские сценарии/логика поверх entity | `features/db` (filters/sort/index/detail-modal), `features/character-editor` (state/calculations/auth) |
| `widgets` | Композиционные блоки UI | `widgets/db-table`, `widgets/sidebar`, `widgets/layout` |
| `pages` | Экраны, собираемые из widgets/features | `pages/db`, `pages/character-editor`, `pages/book`, `pages/news`, `pages/profile`, `pages/ops`, `pages/home` |

**Технические конвенции (уже сложившиеся в проекте):**

- **Стили:** CSS-modules рядом с компонентом (`Component.module.css`) + дизайн-токены из
  `src/app/index.css` (`--bg-*`, `--text-*`, `--accent-*`, `--spacing-*`, `--radius-*`,
  `--sidebar-width`). Новых хардкод-цветов не вводим — только токены.
- **Доступ к данным:** только через `shared/repositories/*Repository` (Firestore), кэш — через
  `shared/cache/useCompendiumData` (idb + манифест версий). Компоненты не дёргают Firestore напрямую.
- **Роутинг:** `HashRouter` (GitHub Pages), маршруты в `src/app/App.tsx`, общий каркас — `Layout`.
- **Телеметрия:** `shared/telemetry/clientTelemetry.logTelemetry(...)`; `page_view` уже пишется
  автоматически в `App.tsx`. Загрузки данных пишут `cache_hit` / `data_fetch_*`.
- **Алиас импорта:** `@/` → `src/`.

**Базовая палитра токенов** (для справки, идентична legacy `styles.css :root`):
тёмная тема `--bg-primary #1a1a1a`, акцент `--accent-emerald #10b981`, плюс `--accent-blue`,
`--accent-purple`.

---

## 2. Текущее состояние `apps/web` (снимок на старте миграции)

| Срез | Состояние | Что есть | Главные пробелы |
|---|---|---|---|
| **Compendium / DB** | 🟢 почти готово | 14 категорий (`entities/compendium/config.ts`), `CompendiumRepository`, `useCompendiumData`, виджеты `CompendiumTable`/`FilterPanel`/`DetailModal`, `DbPage` с табами, поиском, фильтрами, сортировкой, deep-link (`?tab=&detail=`), back/forward в модалке | Сверка полноты против `db.js`, полировка `shared/ui` |
| **Character editor** | 🟡 крупный, в работе | `CharacterEditorPage` (638 строк), `useCharacterState`, `characterCalculations`, `useCharacterAuth` | Сверка формул и фич против `character-editor.js` (122 КБ), тесты на расчёты |
| **Books** | 🟡 каркас | `pages/book/BookPage`, навигация `shared/nav/books` (phb/spellbook/master/craftbook/rumors), роут `:bookKey/:chapterId` | Источник контента глав, кросс-ссылки в компендиум, `locked`-книги |
| **News** | 🟡 есть | `NewsPage` + `ContentRepository.getNews()` + `entities/content` + `LegacyText` | Сверка с `news.js`, контент-pipeline |
| **Profile** | 🟡 есть | `ProfilePage` (236 строк) | Зависит от auth (ниже) |
| **Ops** | 🟢 есть | `OpsPage` — телеметрия/логи/сводка | — |
| **Home** | 🔴 заглушка | `HomePage` (31 строка) | Полноценный лендинг |
| **Auth** | 🔴 нет | только `useCharacterAuth` (владение персонажем) | Логин-UI, определение роли, гейтинг навигации — отсутствуют |
| **Dashboard** | 🔴 нет в React | живёт как legacy `dashboard.html` + `dashboard.js` | Перенести целиком |
| **`shared/ui`** | 🟡 фундамент | `Button`, `Modal`, `LegacyText` | Нет `Card`, `Input/Select`, `Tabs`, `Table`, `Badge`, `Spinner`, `Tooltip` |
| **Lobby** | ⚫ под снос | — | Удалить остатки, если есть |

---

## Фаза 0 — Фундамент (дизайн-система + чистка)

**Зачем первой:** наибольший рычаг. Раз оценивают продукт/UX, единый набор примитивов делает
все экраны консистентными и ускоряет все последующие фазы.

**Цель:** расширить `shared/ui` до полноценного набора примитивов; убрать lobby; зафиксировать
CSS-стратегию.

**Текущее состояние:** в `shared/ui` есть `Button`, `Modal`, `LegacyText`. Токены уже в
`index.css`. CSS-modules — принятый подход.

**Шаги:**

1. Удалить остатки lobby: проверить и снести `features/lobby`, `entities/lobby`, `pages/lobby`,
   маршруты lobby в `App.tsx`, ссылки в `Sidebar`. (В корне legacy `lobby*.html/js` не трогаем —
   это старый сайт.)
2. Добавить примитивы в `shared/ui` (каждый — `*.tsx` + `*.module.css`, на токенах):
   `Card`, `Input`, `Select`, `Textarea`, `Tabs`, `Table` (sortable-ready), `Badge`, `Spinner`,
   `Tooltip`, `EmptyState`, `Toolbar`. Опираться на существующие `Button`/`Modal` по API-стилю и
   на разметку legacy `styles.css` (классы `.content-section`, `.results-table`, `.modal-*`) как
   на визуальный референс.
3. Завести «витрину» примитивов для самопроверки (storybook не нужен — достаточно временной
   dev-страницы или unit-снимков).
4. Прогнать `DbPage` и `Modal`-зависимые места на новые примитивы (без изменения поведения).

**Файлы:** `src/shared/ui/*`, `src/app/App.tsx`, `src/widgets/sidebar/Sidebar.tsx`,
удаление lobby-каталогов.

**Критерий готовности:** примитивы покрывают потребности DB/Books/Profile; lobby отсутствует;
`npm run check` зелёный; визуально ничего не сломалось.

**Риски:** соблазн переписать всё под новые примитивы сразу — нет, только то, что нужно
следующим фазам.

---

## Фаза 1 — Compendium / DB (добить хребет)

**Цель:** довести самую готовую и витринную фичу до паритета с `db.js`.

**Текущее состояние:** работает почти всё (см. таблицу). 14 категорий, фильтры/поиск/сорт,
detail-модалка с навигацией и deep-link.

**Старый источник:** `db.js` (164 КБ), `db.html`.

**Шаги:**

1. Сверить набор категорий и полей: пройтись по `db.js`/`db.html` и `parse_*.py`, убедиться, что
   все коллекции и колонки присутствуют в `entities/compendium/{config,schema}.ts`.
2. Сверить фильтры и поиск (поля поиска сейчас:
   `name/description/type/school/profession/specialization`) — добавить недостающие.
3. Сверить detail-модалку: все секции/поля, кросс-ссылки между сущностями
   (`compendiumIndex.resolveByName`), кнопки бросков/действий, если были в legacy.
4. Переодеть таблицу/панель фильтров/модалку в примитивы `shared/ui` из Фазы 0.
5. Тесты: фильтры (есть `useCompendiumFilters.test.tsx`), сортировка, резолв ссылок.

**Файлы:** `entities/compendium/*`, `features/db/*`, `widgets/db-table/*`, `pages/db/DbPage.tsx`.

**Критерий готовности:** каждая категория из legacy открывается, фильтруется, ищется, ссылки
ведут на верные записи; deep-link `#/db?tab=...&detail=...` воспроизводит состояние.

**Риски:** расхождения в формате данных Firestore vs ожиданий мапперов — проверять на реальных
данных.

---

## Фаза 2 — Books (книги/правила)

**Цель:** перенести статические книги (phb/spellbook/master/craftbook/rumors, ~40 глав) с
навигацией и кросс-ссылками.

**Текущее состояние:** есть `BookPage` и навигация `shared/nav/books.ts` (структура книг и глав
задана, ссылки на `*/*.html`). Книги `rumors` помечены `locked: true`.

**Старый источник:** HTML-главы в `phb/`, `spellbook/`, `master/`, `craftbook/`, `rumors/`;
конвертация — `convert_md_to_html.py`, разрешение ссылок — `link_resolver.py`.

**Шаги:**

1. Решить формат хранения контента глав (см. [открытые вопросы](#журнал-решений)): варианты —
   (a) импортировать главы в Firestore через `scripts/import-content` и читать через repository;
   (b) держать главы как статические ассеты (markdown/html) в `apps/web/public` и фетчить.
   Рекомендация: вариант (a) — единый контентный контур и версионирование.
2. Реализовать рендер главы в `BookPage` (markdown→React или санитайзинг готового HTML через
   `LegacyText`/безопасный рендер).
3. Кросс-ссылки: ссылки внутри книг на записи компендиума должны открывать
   `#/db?tab=...&detail=...` (переиспользовать логику `compendiumIndex`/`link_resolver.py`).
4. Обработать `locked`-книги: показывать замок и гейтить контент по auth/роли (связка с Фазой 4).
5. Навигация в `Sidebar` уже строится из `BOOKS` — проверить активные состояния и якоря глав.

**Файлы:** `pages/book/BookPage.tsx`, `shared/nav/books.ts`, `entities/content/*` (если вариант
a), `scripts/import-content/*`, `widgets/sidebar/Sidebar.tsx`.

**Критерий готовности:** все главы открываются, оглавление и якоря работают, кросс-ссылки ведут в
компендиум, `locked` корректно ограничивает доступ.

**Риски:** «грязный» legacy-HTML — нужен санитайзинг; объём контента — переносить пакетно.

---

## Фаза 3 — Character editor (редактор персонажей)

**Цель:** довести самый логически тяжёлый срез до паритета с `character-editor.js`.

**Текущее состояние:** `CharacterEditorPage` (638 строк), `useCharacterState` (221),
`characterCalculations` (290), `useCharacterAuth` (владение). Уже немалый объём.

**Старый источник:** `character-editor.js` (122 КБ), `character-editor.html`; правила расчётов
частично описаны в `plan.txt` (arcana, hit/cast, fortitude low/mid/high, attentiveness =
perception + 4, подзаклинания/сабспеллы).

**Шаги:**

1. Сверить расчёты 1:1 с legacy и обсидиан-правилами: arcana total, hit/cast (привязка к arcana),
   fortitude (база → low/mid/high), attentiveness. Зафиксировать формулы **unit-тестами** в
   `characterCalculations`.
2. Сверить структуру данных персонажа и персист: Firestore (`CharacterRepository`) + локальный
   кэш idb; автосохранение/конфликты.
3. Заклинания и **сабспеллы**: группировка родитель→дети (сворачиваемые), броски на каждом,
   отсутствие active/delete у сабспеллов (см. `plan.txt`).
4. Броски кубов: воспроизвести логику и **запись событий** (нужно для дашборда — см. Фаза 6 и
   формат `diceRollEventsLegacy`/Firestore-события).
5. Переодеть UI в `shared/ui`.

**Файлы:** `features/character-editor/*`, `pages/character-editor/*`,
`shared/repositories/CharacterRepository.ts`, `entities/character/types.ts`.

**Критерий готовности:** создание/редактирование/сохранение персонажа; корректные производные
статы (подтверждены тестами); заклинания+сабспеллы+броски работают; события бросков пишутся.

**Риски:** расхождения формул — самый частый баг; обязательно тесты. Конфликты глобальных имён из
legacy (`spellsData`, `schoolsData`) в новом коде не актуальны (изолировано модулями), но логику
переноса сверять по `plan.txt`.

---

## Фаза 4 — Auth + Profile

**Цель:** ввести аутентификацию Firebase в UI, профиль и роль-зависимую навигацию. Это
предпосылка для `locked`-книг (Фаза 2) и гейтинга дашборда (Фаза 6).

**Текущее состояние:** **полноценного auth-UI нет.** Есть только `useCharacterAuth`
(владение персонажем). `Sidebar` без логина/состояния пользователя/ролей. Роли определены на
бэке: `firestore.rules` поддерживает `author` / `editor` / `admin` (функции `isAuthor`/`isEditor`/
`isAdmin`, `userRole()`).

**Старый источник:** `auth.js`, `access.js`, `profile.js`, `profile.html`.

**Шаги:**

1. `features/auth`: провайдер сессии (Firebase Auth), хук `useAuth()` — текущий пользователь,
   состояние загрузки, методы вход/выход.
2. Определение роли: читать роль пользователя из Firestore (`entities/user`), отдавать
   `role: 'author'|'editor'|'admin'|null`.
3. UI логина (модалка/страница) на `shared/ui`; кнопка входа/выхода и аватар в `Sidebar`/`Layout`.
4. `ProfilePage`: подключить к реальному пользователю (данные, его персонажи, настройки).
5. Гейтинг навигации: показывать `Профиль`, `locked`-книги, `Dashboard` в зависимости от
   входа/роли. Защищённые маршруты — редирект неавторизованных.

**Файлы:** новый `features/auth/*`, `entities/user/types.ts`, `shared/firebase/client.ts`,
`widgets/sidebar/Sidebar.tsx`, `widgets/layout/Layout.tsx`, `pages/profile/ProfilePage.tsx`,
`src/app/App.tsx` (guard).

**Критерий готовности:** вход/выход работает; роль определяется; защищённые разделы скрыты/закрыты
для неавторизованных; профиль показывает данные текущего пользователя.

**Риски:** соответствие `firestore.rules` (клиент не должен полагаться только на UI-гейтинг —
правила уже ограничивают чтение `editor/admin`-данных).

---

## Фаза 5 — Home + News

**Цель:** финальная полировка витрины.

**Текущее состояние:** `HomePage` — заглушка (31 строка). `NewsPage` уже подключён к
`ContentRepository.getNews()` и рендерит новости (`details/summary`, `LegacyText`).

**Старый источник:** `index.html`, `news.js`/`news.html`.

**Шаги:**

1. Home: собрать лендинг из `shared/ui` (герой, разделы-ссылки на DB/книги/редактор, статус
   проекта). Опереться на `index.html` и стиль референсов.
2. News: сверить с `news.js` (полнота полей, форматирование), убедиться в контент-pipeline
   (`entities/content`, импорт).

**Файлы:** `pages/home/HomePage.tsx`, `pages/news/NewsPage.tsx`, `entities/content/*`.

**Критерий готовности:** Home выглядит цельно и ведёт во все разделы; новости отображаются
корректно из контентного контура.

**Риски:** низкие.

---

## Фаза 6 — Dashboard (обязателен)

**Цель:** перенести дашборд данных в React **по функционалу как есть** (реворк — позже).
Наличие критично для защиты.

**Текущее состояние:** в React **нет**; работает legacy `dashboard.html` + `dashboard.js` (34 КБ).
Частично пересекается с `OpsPage` (телеметрия), но дашборд — про **контент, броски и качество
данных**, это отдельный экран.

**Старый источник и его данные (`dashboard.js`):**

- **Источник контент/качество:** `reports/data_report.json` (+ `validation_report.json`).
- **Источник бросков:** `localStorage` ключ `diceRollEventsLegacy`; при отсутствии — fallback на
  блок `dice` в `reports/data_report.json`.
- Формат локального dice-события задокументирован в `README.md` (поля `eventId`, `userId`,
  `diceType`, `sides`, `result`, `modifier`, `total`, `context`, `sessionId`, `createdAt`...).
- Жёстко зашитый маппинг UID→имя (`USER_DISPLAY_NAME_BY_UID`) и список кубов
  (`d2..d100`).

**Блоки дашборда (воспроизвести):**

1. **Контент:** карточки (заклинания, школы, концентрация, подзаклинания, неполные объекты, школы
   без заклинаний) + распределение заклинаний по школам (бары).
2. **Аналитика бросков:** карточки (всего бросков, активные кубы, топ-бросок); таблица метрик по
   кубам (среднее/теоретическое/отклонение/криты); таблица по типам бросков (формула, ожидаемое);
   таблица по пользователям (кол-во, последний бросок) + модалка статистики пользователя.
3. **Качество данных:** таблица по коллекциям (ошибки/предупреждения/инфо), топ правил, сводные
   карточки.

**Шаги:**

1. `pages/dashboard/DashboardPage` + маршрут `#/dashboard`; ссылка в `Sidebar` (раздел
   «Инструменты»), **гейтинг по роли** `editor/admin` (Фаза 4).
2. Источники данных:
   - Контент/качество: читать `reports/data_report.json` как статический ассет (положить в
     `apps/web/public` или фетчить из корня) — решить в [журнале](#журнал-решений).
   - Броски: **решить** — оставить fallback на отчёт, либо перейти на Firestore-события бросков,
     которые пишет редактор персонажа (Фаза 3). Рекомендация: писать броски в Firestore и читать
     дашбордом через repository; отчётный fallback оставить.
3. Вынести числовую логику (средние/отклонения/криты/проценты) в `features/dashboard/*` с
   unit-тестами (формулы переносить из `dashboard.js` 1:1).
4. UI на `shared/ui` (карточки, таблицы, бары, модалка). Маппинг UID→имя вынести в конфиг/Firestore,
   а не хардкодить.

**Файлы:** новый `pages/dashboard/*`, `features/dashboard/*`, возможно
`entities/audit`/`entities/dice`, `shared/repositories/*`, `widgets/sidebar/Sidebar.tsx`,
`src/app/App.tsx`.

**Критерий готовности:** дашборд открывается (для editor/admin), показывает контент, броски и
качество с теми же числами, что legacy на тех же данных; модалка пользователя работает.

**Риски:** расхождение метрик с legacy — покрыть тестами; источник бросков (localStorage legacy не
переносится в SPA напрямую) — зафиксировать решение.

---

## 3. Сквозные задачи (вне фаз, поддерживать постоянно)

- **Quality gate** зелёный в каждом PR: `apps/web` → `npm run check` (+`build`).
- **Тесты** на любую перенесённую формулу/метрику (расчёты персонажа, метрики дашборда, фильтры).
- **Телеметрия** уже работает (`page_view`, `data_fetch_*`) — не ломать при рефакторинге.
- **Контентный pipeline** (`scripts/import-content`, `scripts/data-pipeline`) — источник данных
  для DB, Books, News, Dashboard; держать в согласии с мапперами `entities/*`.
- **Деплой:** CD публикует `dist-react` на GitHub Pages из `main` (`HashRouter` обязателен).
- **Удаление legacy:** старые корневые файлы (`*.js`, `*.html`, `phb/`...) удаляем только после
  того, как соответствующая фаза закрыта и проверена в проде. До тех пор — источник истины.

## 4. Порядок и зависимости

```
Фаза 0 (фундамент) ─┬─> Фаза 1 (DB)
                    ├─> Фаза 2 (Books) ──> зависит от Фазы 4 для locked
                    ├─> Фаза 3 (Character) ──> поставляет dice-события в Фазу 6
                    ├─> Фаза 4 (Auth) ──> нужна для locked-книг и гейтинга Dashboard
                    ├─> Фаза 5 (Home+News)
                    └─> Фаза 6 (Dashboard) ──> зависит от Фазы 4 (роли) и Фазы 3 (броски)
```

Рекомендуемый порядок: **0 → 1 → 2 → 4 → 3 → 6 → 5** (Auth подняли перед Character/Dashboard,
т.к. от него зависят гейтинг и часть данных). Допустимо вести параллельно независимые срезы.

## Журнал решений

| Дата | Вопрос | Решение |
|---|---|---|
| 2026-06-02 | Менять ли стек/архитектуру | Нет, React+FSD финальный |
| 2026-06-02 | Lobby | Вырезать целиком |
| 2026-06-02 | UI-парность | Пожелание, можно улучшать |
| 2026-06-02 | Dashboard | Обязателен; перенос «как есть», реворк позже |
| _TBD_ | Хранение контента книг (Firestore vs static ассеты) | _открыто; рекомендация — Firestore через import-content_ |
| _TBD_ | Источник dice-событий для дашборда (Firestore vs report fallback) | _открыто; рекомендация — писать в Firestore из редактора_ |
| _TBD_ | Доступ к `reports/data_report.json` из SPA (public-ассет vs фетч из корня) | _открыто_ |
