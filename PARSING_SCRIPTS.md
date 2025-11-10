# 🔄 Скрипты парсинга данных из Obsidian

Эти скрипты автоматически конвертируют Markdown файлы из Obsidian Vault в JSON файлы для сайта.

## 📋 Список скриптов

### 1. `parse_schools.py` — Школы Магии
Парсит все файлы `Школа Магии - *.md` из Spellbook и создаёт `data/schools.json`.

**Что парсит:**
- Параметры (Редкость, Свойства)
- Описание
- Принципы
- Особенности
- Учебные Заклинания
- Связанные школы (из раздела "Связи:")

**Входные файлы:** `C:\Users\Kaliguri\Documents\Obsidian Vault\E'Magios Core\E'Magios Core - 03. Spellbook\Школа Магии - *.md`

**Выходной файл:** `data\schools.json`

### 2. `parse_spells.py` — Заклинания
Парсит все файлы `Заклинание — *.md` из Spellbook и создаёт `data/spells.json`.

**Что парсит:**
- Действие (число + тип: Реакция/Действие)
- Дистанция
- Цель/Область
- Длительность
- Тип урона
- Концентрация + Поддержание
- Школа Магии
- Источник Заклинания
- Тип Заклинания
- Триггер (если есть)
- Описание

**Входные файлы:** `C:\Users\Kaliguri\Documents\Obsidian Vault\E'Magios Core\E'Magios Core - 03. Spellbook\Заклинание — *.md`

**Выходной файл:** `data\spells.json`

### 3. `parse_effects.py` — Эффекты
Парсит все файлы `Эффект - *.md` из Player's Handbook и создаёт `data/effects.json`.

**Что парсит:**
- Тип Действия
- Описание

**Входные файлы:** `C:\Users\Kaliguri\Documents\Obsidian Vault\E'Magios Core\E'Magios Core - 01. Player's Handbook\Эффект - *.md`

**Выходной файл:** `data\effects.json`

## 🚀 Использование

### Запуск отдельных скриптов

```bash
# Обновить школы магии
python parse_schools.py

# Обновить заклинания
python parse_spells.py

# Обновить эффекты
python parse_effects.py
```

### Запуск всех скриптов сразу

```bash
# Windows PowerShell
python parse_schools.py; python parse_spells.py; python parse_effects.py

# Windows CMD
python parse_schools.py && python parse_spells.py && python parse_effects.py
```

## 📝 Что делают скрипты

1. **Читают** Markdown файлы из Obsidian Vault
2. **Парсят** структуру (разделы `#### Параметры`, `#### Описание` и т.д.)
3. **Очищают** wikilinks (`[[Link|Text]]` → `Text`)
4. **Удаляют** markdown форматирование (`**bold**` → `bold`)
5. **Создают** JSON с правильной структурой
6. **Сохраняют** в папку `data/`

## ⚙️ Структура данных

### Schools.json
```json
{
  "id": "bazovaya-arkana",
  "name": "Базовая Аркана",
  "rarity": "Редкая",
  "properties": [],
  "description": "Текст описания...",
  "principles": ["Принцип 1", "Принцип 2"],
  "features": ["Особенность 1", "Особенность 2"],
  "educationalSpells": ["Заклинание 1", "Заклинание 2"],
  "relatedSchools": ["Школа 1", "Школа 2"]
}
```

### Spells.json
```json
{
  "id": "vystrel-arkany",
  "name": "Выстрел Арканы",
  "actions": 1,
  "actionType": "Реакция",
  "range": "Средняя",
  "target": "Одна цель",
  "duration": "Мгновенно",
  "damageType": "Аркана",
  "concentration": "Да",
  "maintenance": "1 действие",
  "school": "Базовая Аркана",
  "source": "Учебное",
  "type": "Атака",
  "trigger": "Текст триггера",
  "description": "Описание заклинания..."
}
```

### Effects.json
```json
{
  "id": "obezdvizhen",
  "name": "Обездвижен",
  "actionType": "Обычный",
  "description": "Описание эффекта..."
}
```

## 🔧 Настройка путей

Если нужно изменить пути к Obsidian Vault или выходным файлам, отредактируйте константы в начале каждого скрипта:

```python
# Входная папка с Markdown файлами
OBSIDIAN_PATH = r"C:\Users\Kaliguri\Documents\Obsidian Vault\..."

# Выходной JSON файл
OUTPUT_PATH = r"data\имя_файла.json"
```

## ⚠️ Важно

- Скрипты **НЕ изменяют** исходные Markdown файлы в Obsidian
- Скрипты **перезаписывают** JSON файлы в папке `data/`
- Всегда проверяйте результат после парсинга
- Если структура Markdown файлов в Obsidian изменится, скрипты нужно будет обновить

## 📚 Когда использовать

- ✅ После добавления новых школ магии в Obsidian
- ✅ После добавления новых заклинаний
- ✅ После обновления описаний/параметров существующих данных
- ✅ При переносе контента из Obsidian на сайт
- ❌ НЕ запускать без проверки, если вручную редактировали JSON

## 🐛 Устранение проблем

**Проблема:** Скрипт не находит файлы

**Решение:** Проверьте путь `OBSIDIAN_PATH` в скрипте

---

**Проблема:** В JSON попали неправильные данные

**Решение:** Проверьте структуру Markdown файла в Obsidian (разделы `#### Параметры`, `#### Описание`)

---

**Проблема:** Кириллица отображается как иероглифы

**Решение:** Убедитесь, что используется кодировка UTF-8 (уже настроено в скриптах)

---

Made with ❤️ for E'Magios Core

