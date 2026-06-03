# -*- coding: utf-8 -*-
"""
Parse Recipe files from Obsidian Vault and generate recipes.json

Фокус на структуру, аналогичную референсу
«Рецепт - Алхимик - Зельевар - Зимнее Лечебное Зелье 0 Ранга».

Usage: python parse_recipes.py
"""
import os
import re
import json
from typing import List, Dict, Any

from link_resolver import convert_wikilinks_in_text

OBSIDIAN_PATH = r"C:\Users\Kaliguri\Documents\Obsidian Vault\E'Magios Core\E'Magios Core - 04. Craftbook"
OUTPUT_PATH = r"data\recipes.json"


def clean_markdown_formatting(text: str) -> str:
    """Remove basic markdown formatting like headings and ** for bold, keep HTML from wikilinks."""
    text = re.sub(r"^#+\s*", "", text, flags=re.MULTILINE)
    text = re.sub(r"\*\*([^\*]+)\*\*", r"\1", text)
    text = re.sub(r"\*([^\*]+)\*", r"\1", text)
    return text.strip()


def clean_wikilink(text: str) -> str:
    """Remove wikilinks and return clean visible text."""
    text = re.sub(r"\[\[([^\]|]+)\|([^\]]+)\]\]", r"\2", text)
    text = re.sub(
        r"\[\[([^\]#|]+)(?:#[^\]|]+)?(?:\|([^\]]+))?\]\]",
        lambda m: m.group(2) if m.group(2) else m.group(1).split("/")[-1],
        text,
    )
    return text.strip()


def slugify(name: str) -> str:
    slug = name.lower()
    slug = slug.replace("ё", "е")
    slug = re.sub(r"[^а-яa-z0-9]+", "-", slug)
    slug = slug.strip("-")
    return slug


def parse_parameters_line(line: str) -> (str, str):
    """
    Parse a parameter line from the '#### Параметры' block:
    'Профессия: [[Профессия - Алхимик|Алхимик]]'
    """
    if ":" not in line:
        return "", ""
    key, value = line.split(":", 1)
    key = key.strip()
    value = value.strip()
    value = clean_wikilink(value)
    return key, value


def parse_steps_table(lines: List[str]) -> List[Dict[str, Any]]:
    """
    Parse markdown table under '#### Этапы Создания'.
    Expected header like:
    | Этап Создания | Очки Прогресса |
    """
    rows = []
    for raw in lines:
        line = raw.strip()
        if not line.startswith("|"):
            continue

        # Skip header separator rows like:
        # | :------ | :----: |
        core = line.replace("|", "").strip()
        if core and all(ch in "-:" for ch in core.replace(" ", "")):
            continue

        parts = [p.strip() for p in line.strip("|").split("|")]
        if len(parts) < 2:
            continue
        step_name = parts[0]
        # Пропускаем заголовок таблицы
        if step_name.lower().startswith("этап создания"):
            continue
        progress_raw = parts[1]
        try:
            progress = int(progress_raw)
        except ValueError:
            stripped = re.sub(r"\D+", "", progress_raw)
            progress = int(stripped) if stripped.isdigit() else None
        row: Dict[str, Any] = {"name": clean_wikilink(step_name)}
        if progress is not None:
            row["progress"] = progress
        rows.append(row)
    return rows


def parse_recipe_file(filepath: str) -> Dict[str, Any] | None:
    """Parse a single recipe file into structured JSON."""
    filename = os.path.basename(filepath)
    if "LEGACY" in filename:
        # Явно пропускаем LEGACY‑версии
        return None

    # "Рецепт - Алхимик - Зельевар - Зимнее Лечебное Зелье 0 Ранга.md"
    base = filename.replace("Рецепт - ", "").replace(".md", "")
    parts = [p.strip() for p in base.split(" - ")]
    profession = ""
    specialization = ""
    item_name = base
    if len(parts) >= 3:
        profession = parts[0]
        specialization = parts[1]
        item_name = " - ".join(parts[2:])

    with open(filepath, "r", encoding="utf-8") as f:
        content = f.read()

    lines = content.splitlines()

    params: Dict[str, str] = {}
    steps_lines: List[str] = []
    notes_lines: List[str] = []
    description_lines: List[str] = []

    section = None  # None | "params" | "steps" | "notes" | "description"

    for raw in lines:
        line = raw.rstrip("\n")
        stripped = line.strip()

        if stripped.startswith("#### "):
            title = stripped[5:].strip().lower()
            if title.startswith("параметр"):
                section = "params"
            elif "этапы создания" in title:
                section = "steps"
            elif "описание" in title:
                section = "description"
            else:
                section = None
            continue

        if section == "params":
            if not stripped:
                continue
            key, value = parse_parameters_line(stripped)
            if key and value:
                params[key] = value
            continue

        if section == "steps":
            # Внутри блока этапов:
            # - строки таблицы (| ... |) сохраняем как шаги
            # - обычный текст считаем пояснительными ремесленными заметками
            if stripped.startswith("|"):
                steps_lines.append(stripped)
            elif stripped:
                notes_lines.append(stripped)
            continue

        if section == "description":
            description_lines.append(stripped)
        else:
            # Всё, что идёт между Этапами и Описанием (или после таблицы),
            # считаем ремесленными заметками
            if stripped:
                notes_lines.append(stripped)

    # Постобработка: wikilinks → HTML, затем markdown → чистый текст, но оставляем HTML.
    crafting_notes = ""
    if notes_lines:
        raw_notes = "\n\n".join(notes_lines)
        notes_html = convert_wikilinks_in_text(raw_notes, base_prefix="")
        crafting_notes = clean_markdown_formatting(notes_html)

    item_description = ""
    if description_lines:
        raw_desc = "\n\n".join(description_lines)
        desc_html = convert_wikilinks_in_text(raw_desc, base_prefix="")
        item_description = clean_markdown_formatting(desc_html)

    steps = parse_steps_table(steps_lines) if steps_lines else []

    # Если рецепт совсем пустой (нет шагов и описания) — не включаем его в базу
    if not steps and not item_description:
        return None

    recipe: Dict[str, Any] = {
        "id": slugify(filename.replace(".md", "")),
        "name": item_name,
    }

    if profession:
        recipe["profession"] = profession
    if specialization:
        recipe["specialization"] = specialization

    # Параметры из блока "Параметры"
    if "Профессия" in params:
        recipe["profession"] = params["Профессия"]
    if "Специализация" in params:
        recipe["specialization"] = params["Специализация"]

    # Уровень Рецепта (приведём к числу, если возможно)
    level_str = params.get("Уровень Рецепта") or params.get("Уровень рецепта")
    if level_str:
        digits = re.sub(r"\D+", "", level_str)
        if digits.isdigit():
            recipe["recipeLevel"] = int(digits)
        else:
            recipe["recipeLevel"] = level_str

    rarity = params.get("Редкость Рецепта") or params.get("Редкость рецепта")
    if rarity:
        recipe["recipeRarity"] = rarity

    cost = params.get("Стоимость Рецепта") or params.get("Стоимость рецепта")
    if cost:
        recipe["recipeCost"] = cost

    recipe_types_raw = params.get("Тип Рецепта") or params.get("Тип рецепта")
    if recipe_types_raw:
        # "Крафт, Зелье, Расходуемое"
        parts = [clean_wikilink(p).strip() for p in recipe_types_raw.split(",")]
        types = [p for p in parts if p]
        if types:
            recipe["recipeTypes"] = types

    if steps:
        recipe["steps"] = steps
    if crafting_notes:
        recipe["craftingNotes"] = crafting_notes
    if item_description:
        recipe["itemDescription"] = item_description

    return recipe


def main() -> None:
    recipes: List[Dict[str, Any]] = []

    for filename in sorted(os.listdir(OBSIDIAN_PATH)):
        if not filename.startswith("Рецепт - ") or not filename.endswith(".md"):
            continue
        filepath = os.path.join(OBSIDIAN_PATH, filename)
        print(f"Parsing recipe: {filename}")
        parsed = parse_recipe_file(filepath)
        if parsed:
            recipes.append(parsed)

    # Сортируем по названию рецепта
    recipes.sort(key=lambda x: x["name"])

    with open(OUTPUT_PATH, "w", encoding="utf-8") as f:
        json.dump(recipes, f, ensure_ascii=False, indent=2)

    print(f"\nSuccessfully parsed {len(recipes)} recipes!")
    print(f"Output written to: {OUTPUT_PATH}")


if __name__ == "__main__":
    main()



