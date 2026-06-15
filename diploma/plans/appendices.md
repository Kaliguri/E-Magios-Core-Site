# ПРИЛОЖЕНИЕ А. Техническое задание

## А.1 Наименование и область применения

Наименование разработки — веб-платформа для настольной ролевой системы «E'Magios Core». Область применения — цифровое сопровождение настольных ролевых игр: предоставление игрокам и ведущим структурированного справочника игровых материалов, электронных книг правил, редактора персонажей и инструмента бросков кубов с облачным хранением пользовательских данных.

## А.2 Основания для разработки

Основанием для разработки является задание на выпускную квалификационную работу, утверждённое кафедрой «Информатика и информационные технологии» Московского политехнического университета. Тема ВКР: «Разработка сайта для настольно-ролевой игры».

## А.3 Назначение разработки

Назначение системы — объединить в единой типобезопасной веб-среде справочный контент авторской ролевой системы и персональные интерактивные инструменты игрока. Цель создания системы — обеспечить удобный доступ к игровым материалам, автоматизировать расчёт характеристик персонажа, предоставить прозрачный модуль бросков кубов и разграничить доступ к закрытым материалам на основе ролей.

## А.4 Требования к программе

### А.4.1 Требования к функциональным характеристикам

Система должна обеспечивать выполнение следующих функций:

- ведение и отображение структурированной базы игровых сущностей (четырнадцать категорий) с поиском, фильтрацией и сортировкой;
- отображение электронных книг правил с навигацией, якорями и взаимными ссылками;
- создание, редактирование, импорт, экспорт и облачное хранение персонажей;
- автоматический расчёт производных характеристик персонажа по уровню (1–20);
- выполнение бросков кубов по выражениям вида `2d4+3d6-1` с учётом бонусов персонажа;
- отправку результатов бросков во внешний сервис Discord по технологии вебхуков;
- авторизацию пользователей через аккаунт Google и разграничение доступа по ролям (автор, редактор, администратор);
- аналитический дашборд с метриками контента, бросков и качества данных.

### А.4.2 Требования к входным и выходным данным

Входными данными являются справочные материалы ролевой системы, подготавливаемые в авторской среде Obsidian (формат Markdown) и преобразуемые в структурированные документы облачной базы, а также пользовательский ввод (данные персонажей, выражения бросков, настройки интеграции). Выходными данными являются отображаемые справочные карточки, рассчитанные характеристики персонажа, результаты бросков и агрегированные показатели дашборда.

### А.4.3 Требования к надёжности и безопасности

Контроль доступа к данным должен обеспечиваться декларативными правилами безопасности на стороне сервера, проверяемыми независимо от клиента. Ключевая бизнес-логика (расчёт характеристик, парсер бросков, метрики аналитики) должна быть покрыта модульными тестами. Отображение внешнего HTML-содержимого должно выполняться с санитайзингом.

### А.4.4 Требования к составу и параметрам технических средств

Клиентская часть должна работать в современном веб-браузере (Google Chrome, Mozilla Firefox, Microsoft Edge актуальных версий) на персональном компьютере или мобильном устройстве. Серверная часть не требует выделенного сервера приложения: приложение публикуется как набор статических файлов, а функции хранения и аутентификации обеспечиваются облачными сервисами Firebase.

### А.4.5 Требования к составу программного обеспечения

Стек разработки: React 18, TypeScript, Vite, React Router; облачные сервисы Firebase Authentication и Cloud Firestore; клиентское кэширование IndexedDB; модульное тестирование Vitest; контроль версий Git и публикация через GitHub Pages с конвейером непрерывной интеграции GitHub Actions.

## А.5 Стадии и этапы разработки

[ТАБЛИЦА А.1: Стадии и этапы разработки]
| Этап | Содержание этапа |
| --- | --- |
| Исследование предметной области | Анализ цифровых инструментов НРИ, аналогов, целевой аудитории |
| Разработка технического задания | Формулирование функциональных и нефункциональных требований |
| Эскизное и техническое проектирование | Проектирование архитектуры FSD, модели данных, интерфейсов |
| Программная реализация | Реализация дизайн-системы и функциональных модулей платформы |
| Тестирование | Модульное тестирование бизнес-логики, контроль качества в CI |
| Развёртывание | Публикация на GitHub Pages, настройка облачных сервисов |

## А.6 Техническая документация

По окончании работы предоставляются: пояснительная записка к ВКР, исходный код проекта в системе контроля версий, набор автоматизированных тестов и презентация результатов.

# ПРИЛОЖЕНИЕ Б. Презентация

[СЛАЙДЫ]

# ПРИЛОЖЕНИЕ В. Листинги программного кода

## В.1 Правила безопасности Cloud Firestore

[ЛИСТИНГ В.1: Правила доступа к данным по ролям и статусам (firestore.rules, сокращённо)]
```js
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    function userRole() {
      return request.auth != null && request.auth.token.role is string
        ? request.auth.token.role : '';
    }
    function isAuthor() { return userRole() == 'author'; }
    function isEditor() { return userRole() == 'editor'; }
    function isAdmin()  { return userRole() == 'admin'; }
    function isOwner(uid) {
      return request.auth != null && request.auth.uid == uid;
    }
    function isValidStatus(status) {
      return status in ['draft', 'review', 'published', 'archived'];
    }
    function canCreateContent() {
      return request.auth != null && (isAuthor() || isEditor() || isAdmin())
        && isValidStatus(request.resource.data.status)
        && request.resource.data.status == 'draft';
    }
    function canUpdateContent() {
      return request.auth != null && (isAuthor() || isEditor() || isAdmin())
        && isValidStatus(resource.data.status)
        && isValidStatus(request.resource.data.status) && (
          (isAuthor() && resource.data.status == 'draft'
            && request.resource.data.status in ['draft', 'review']) ||
          (isEditor() && (
            (resource.data.status == 'review'
              && request.resource.data.status in ['draft', 'published']) ||
            (resource.data.status == 'published'
              && request.resource.data.status == 'archived')
          )) || isAdmin()
        );
    }
    // Справочные коллекции: публичное чтение опубликованного,
    // запись по ролям (импорт идёт через Admin SDK в обход правил)
    match /spells/{docId} {
      allow read:   if resource.data.status == 'published';
      allow create: if canCreateContent();
      allow update: if canUpdateContent();
      allow delete: if isAdmin();
    }
    // ... остальные 13 категорий компендиума и news — аналогично ...

    // Данные пользователя — доступ только владельцу
    match /users/{userId} {
      allow read, write: if isOwner(userId);
      match /characters/{characterId} {
        allow read, write: if isOwner(userId);
      }
    }
    // Запрет всего остального
    match /{document=**} { allow read, write: if false; }
  }
}
```

## В.2 Парсер и вычислитель выражений броска

[ЛИСТИНГ В.2: Чистый парсер и роллер с инъекцией ГСЧ (rollExpression.ts, фрагмент)]
```ts
const ALLOWED_SIDES = [2, 4, 6, 8, 10, 12, 20, 100];

export function parseRollExpression(raw: string): ParsedRoll {
  const trimmed = raw.trim();
  const withoutCommand = trimmed.toLowerCase().startsWith('/roll')
    ? trimmed.slice(5).trim() : trimmed;
  if (!withoutCommand) throw new Error('Пустая команда броска.');
  const normalized = withoutCommand.replace(/\s+/g, '');
  if (!/^[0-9dD+\-*/]+$/.test(normalized)) {
    throw new Error('Допускаются только цифры, d, +, -, * и /.');
  }
  // ... разбиение на сегменты по знакам + и - ...
  const m = text.match(/^(\d*)[dD](\d+)(?:([*/])(\d+))?$/);
  const count = m[1] ? parseInt(m[1], 10) : 1;
  const sides = parseInt(m[2], 10);
  if (count <= 0 || count > 100) {
    throw new Error('Количество кубов должно быть от 1 до 100.');
  }
  if (!ALLOWED_SIDES.includes(sides)) {
    throw new Error('Разрешены только D2, D4, D6, D8, D10, D12, D20 и D100.');
  }
  return { expression: normalized, segments: parsedSegments };
}

// Роллер: ГСЧ передаётся параметром — для детерминированных тестов
export function rollExpression(parsed: ParsedRoll,
                               rng: () => number = Math.random): RollResult {
  let total = 0;
  parsed.segments.forEach((seg) => {
    if (seg.kind === 'dice') {
      let baseSum = 0;
      for (let i = 0; i < seg.count; i += 1) {
        baseSum += 1 + Math.floor(rng() * seg.sides);
      }
      let segmentTotal = baseSum;
      if (seg.scaleOp && seg.scale) {
        segmentTotal = seg.scaleOp === '*'
          ? baseSum * seg.scale : baseSum / seg.scale;
      }
      total += seg.sign * segmentTotal;
    } else {
      total += seg.sign * seg.value;
    }
  });
  return { expression: parsed.expression, total, parts, createdAt: Date.now() };
}

// Натуральная «12» на одиночном d12 — критический успех (кроме бросков наложения)
export function isCriticalRoll(result: RollResult, isApply = false): boolean {
  if (isApply) return false;
  return result.parts.some((part) => part.kind === 'dice'
    && part.sides === 12 && part.count === 1 && part.rolls.includes(12));
}
```

## В.3 Расчёт производных характеристик персонажа

[ЛИСТИНГ В.3: Табличный расчёт характеристик по уровню (characterCalculations.ts, фрагмент)]
```ts
// Таблица характеристик по уровню (1–20):
// arcana, health, will, speed, initiative, hitBonus,
// effectBonus, evasion, fortitude, actions, reactions
const STAT_TABLE: Record<number, Omit<CharacterStats, 'level'>> = {
  1:  { arcana: 1,  health: 6,  will: 4,  speed: 6,  initiative: 1,
        hitBonus: 1,  effectBonus: 1,  evasion: 10, fortitude: 10, actions: 2, reactions: 1 },
  // ... уровни 2–19 ...
  20: { arcana: 10, health: 25, will: 14, speed: 10, initiative: 10,
        hitBonus: 11, effectBonus: 11, evasion: 25, fortitude: 25, actions: 5, reactions: 3 },
};

export function calculateStats(level: number): CharacterStats {
  const clamped = Math.max(1, Math.min(20, level));
  const base = STAT_TABLE[clamped] ?? STAT_TABLE[1];
  return { level: clamped, ...base };
}
```
