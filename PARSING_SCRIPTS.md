# Parsing Scripts Documentation

Этот документ описывает Python скрипты для автоматического парсинга данных из Obsidian Vault в JSON файлы для сайта.

## Обзор

Все скрипты парсинга находятся в корне проекта и следуют единому формату:

```bash
python parse_<type>.py
```

Скрипты читают Markdown файлы из Obsidian Vault и генерируют соответствующие JSON файлы в папке `data/`.

## Доступные скрипты

### 1. parse_schools.py

Парсит школы магии из Spellbook.

**Входные данные:**
```
C:\Users\Kaliguri\Documents\Obsidian Vault\E'Magios Core\E'Magios Core - 03. Spellbook\Школа Магии - *.md
```

**Выходные данные:**
```
data/schools.json
```

**Что парсит:**
- Название школы
- Редкость (Редкая, Эпическая, Скрытая)
- Свойства (Конклав, Часть Конклава, Запретная, Вспомогательная)
- Сложность (★)
- Описание
- Принципы
- Особенности
- Учебные заклинания
- Связанные школы

**Результат:** 38 школ магии

### 2. parse_spells.py

Парсит заклинания из Spellbook.

**Входные данные:**
```
C:\Users\Kaliguri\Documents\Obsidian Vault\E'Magios Core\E'Magios Core - 03. Spellbook\Заклинание — *.md
```

**Выходные данные:**
```
data/spells.json
```

**Что парсит:**
- Название заклинания
- Действие (количество действий)
- Тип действия (Действие, Реакция)
- Ресурсы
- Дистанция
- Цель/Область
- **Тип урона** — парсится в массив:
  - `"Дробящий, колющий, режущий (на выбор)"` → `["Дробящий", "Колющий", "Режущий"]` + `damageTypeNote: "на выбор"`
  - `"Колющий, яд"` → `["Колющий", "Яд"]`
  - `"Аркана"` → `["Аркана"]`
- Длительность
- Концентрация и поддержание
- Школа магии
- Источник (Учебное, Фирменное)
- Вспомогательная магия
- Тип (Атака, Защита, Контроль, Поддержка)
- Триггер
- Описание
- **Подзаклинания** — парсятся как вложенный массив `subSpells`:
  - Обрабатываются заголовки `####` и `#####` (кроме "Параметры" и "Описание")
  - Каждое подзаклинание содержит: название, параметры, описание
  - Примеры: "Трех-контурное Наступательное Усиление" (3 контура), "Трехзарядный Магический Револьвер" (4 способа использования)
  - Пустые заголовки разделов без параметров/описания пропускаются

**Результат:** 52 заклинания (включая заклинания с подзаклинаниями)

### 3. parse_effects.py

Парсит эффекты из Player's Handbook.

**Входные данные:**
```
C:\Users\Kaliguri\Documents\Obsidian Vault\E'Magios Core\E'Magios Core - 01. Player's Handbook\Эффект - *.md
```

**Выходные данные:**
```
data/effects.json
```

**Что парсит:**
- Название эффекта
- Тип действия (Обычный, Относительное)
- Описание

**Результат:** 12 эффектов

### 4. parse_archetypes.py

Парсит архетипы персонажей из Player's Handbook.

**Входные данные:**
```
C:\Users\Kaliguri\Documents\Obsidian Vault\E'Magios Core\E'Magios Core - 01. Player's Handbook\Архетип - *.md
```

**Выходные данные:**
```
data/archetypes.json
```

**Что парсит:**
- Название архетипа
- Описание
- Улучшения (название и описание для каждого)

**Результат:** 12 архетипов

### 5. parse_actions.py

Парсит базовые действия из Player's Handbook.

**Входные данные:**
```
C:\Users\Kaliguri\Documents\Obsidian Vault\E'Magios Core\E'Magios Core - 01. Player's Handbook\Базовое Действие - *.md
```

**Выходные данные:**
```
data/actions.json
```

**Что парсит:**
- Название действия
- Действие (количество)
- Дистанция
- Цель/Область
- Длительность
- Описание

**Результат:** 13 базовых действий

### 6. parse_skills.py

Парсит навыки (личности и магии) из Player's Handbook.

**Входные данные:**
```
C:\Users\Kaliguri\Documents\Obsidian Vault\E'Magios Core\E'Magios Core - 01. Player's Handbook\Навык - *.md
```

**Выходные данные:**
```
data/skills.json
```

**Что парсит:**
- Навыки личности и магические навыки собираются в один общий JSON.
- В данных есть признак типа навыка (`Личность` или `Магия`), чтобы база данных могла сортировать и фильтровать по типу.

**Структура:**
```json
{
  "id": "string",
  "name": "string",
  "type": "Личность|Магия",
  "category": "string",
  "description": "string"
}
```

### 7. (планируется) parse_action_types.py

Парсинг типов действий из Player's Handbook.

**Ожидаемые входные данные:**
```
E'Magios Core - 01. Player's Handbook\Тип Действия - *.md
```

**Выходные данные:**
```
data/action_types.json
```

**Предполагаемая структура:**
```json
{
  "id": "string",
  "name": "string",
  "category": "string",
  "description": "string"
}
```

### 8. parse_combat_components.py

Парсит компоненты боевой системы (ключевые элементы из разделов «Компоненты Боевой Системы» и связанных страниц).

**Входные данные:**
```
E'Magios Core - 01. Player's Handbook\Боевой Компонент - *.md
```

**Выходные данные:**
```
data/combat_components.json
```

**Структура:**
```json
{
  "id": "string",
  "name": "string",
  "section": "string",
  "page": "string",
  "description": "string"
}
```

## Общие возможности

Все парсеры имеют следующие возможности:

1. **Обработка wikilinks**: Автоматическое извлечение текста из `[[wikilinks]]` и `[[link|display text]]`
2. **Очистка форматирования**: Удаление Markdown форматирования (`**bold**`, `*italic*`)
3. **Генерация ID**: Создание URL-friendly идентификаторов из названий
4. **Обработка параметров**: Извлечение структурированных данных из разделов `#### Параметры`
5. **Fallback**: Graceful обработка отсутствующих полей

## Использование

### Обновление данных

Чтобы обновить все данные из Obsidian Vault:

```bash
python parse_schools.py
python parse_spells.py
python parse_effects.py
python parse_archetypes.py
python parse_actions.py
```

### Требования

- Python 3.x
- Доступ к локальному Obsidian Vault по пути:
  ```
  C:\Users\Kaliguri\Documents\Obsidian Vault\E'Magios Core
  ```

### Кодировка

Все скрипты используют UTF-8 кодировку для корректной работы с русским текстом.

## Структура данных

### Schools (schools.json)

```json
{
  "id": "string",
  "name": "string",
  "rarity": "Редкая|Эпическая|Скрытая",
  "properties": ["string"],
  "difficulty": number,
  "description": "string",
  "principles": ["string"],
  "features": ["string"],
  "educationalSpells": ["string"],
  "relatedSchools": ["string"]
}
```

### Spells (spells.json)

```json
{
  "id": "string",
  "name": "string",
  "actions": number,
  "actionType": "Действие|Реакция",
  "resources": "string",
  "range": "string",
  "target": "string",
  "duration": "string",
  "damageType": ["string", "..."],  // Массив типов урона
  "damageTypeNote": "на выбор",     // Опционально: пометка о выборе
  "concentration": "Да",
  "maintenance": "string",
  "school": "string",
  "source": "Учебное|Фирменное",
  "supportMagic": "string",
  "type": "string",
  "trigger": "string",
  "description": "string"
}
```

### Effects (effects.json)

```json
{
  "id": "string",
  "name": "string",
  "actionType": "Обычный|Относительное",
  "description": "string"
}
```

### Archetypes (archetypes.json)

```json
{
  "id": "string",
  "name": "string",
  "description": "string",
  "improvements": [
    {
      "name": "string",
      "description": "string"
    }
  ]
}
```

### Actions (actions.json)

```json
{
  "id": "string",
  "name": "string",
  "actions": number,
  "range": "string",
  "target": "string",
  "duration": "string",
  "description": "string"
}
```

## Важные замечания

1. **НЕ редактируйте JSON вручную** - всегда используйте парсеры для обновления данных
2. **Проверяйте результаты** после парсинга - убедитесь что количество объектов соответствует ожиданиям
3. **Obsidian - источник правды** - при расхождениях приоритет всегда имеют файлы в Obsidian Vault
4. **Резервные копии** - парсеры перезаписывают JSON файлы, делайте backup перед массовым обновлением

## Troubleshooting

### Проблема: FileNotFoundError

**Причина:** Неверный путь к Obsidian Vault или отсутствие файлов

**Решение:** 
- Проверьте что Obsidian Vault находится по пути `C:\Users\Kaliguri\Documents\Obsidian Vault`
- Убедитесь что в папке есть нужные файлы

### Проблема: Кодировка символов

**Причина:** Проблемы с UTF-8 в Windows

**Решение:**
- Все скрипты используют `encoding='utf-8'`
- При необходимости проверьте кодировку исходных файлов

### Проблема: Неправильные данные в JSON

**Причина:** Несоответствие формата MD файлов ожидаемому

**Решение:**
- Проверьте файл `099. Требования к оформлению.md` в Obsidian Vault
- Убедитесь что структура файлов соответствует требованиям

## Обновления

При добавлении новых типов данных:

1. Создайте новый парсер по аналогии с существующими
2. Обновите эту документацию
3. Обновите `db.html` и `db.js` для поддержки нового типа
4. Добавьте новую вкладку в базу данных (если требуется)

---

*Последнее обновление: 2025-11-19*
