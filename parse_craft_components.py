# -*- coding: utf-8 -*-
"""
Parse Craft System Component files from Obsidian Vault and generate craft_components.json
Usage: python parse_craft_components.py
"""
import os
import re
import json

from link_resolver import convert_wikilinks_in_text

OBSIDIAN_PATH = r"C:\Users\Kaliguri\Documents\Obsidian Vault\E'Magios Core\E'Magios Core - 04. Craftbook"
OUTPUT_PATH = r"data\craft_components.json"


def clean_markdown_formatting(text: str) -> str:
    """Remove basic markdown formatting like headings and ** for bold, keep HTML from wikilinks."""
    # Remove markdown headings at start of lines
    text = re.sub(r"^#+\s*", "", text, flags=re.MULTILINE)
    # Bold/italic
    text = re.sub(r"\*\*([^\*]+)\*\*", r"\1", text)
    text = re.sub(r"\*([^\*]+)\*", r"\1", text)
    return text.strip()


def slugify(name: str) -> str:
    slug = name.lower()
    slug = slug.replace("ё", "е")
    slug = re.sub(r"[^а-яa-z0-9]+", "-", slug)
    slug = slug.strip("-")
    return slug


def parse_craft_component_file(filepath: str) -> dict:
    """Parse a single Craft System Component file."""
    filename = os.path.basename(filepath)
    # "Компонент Ремесленной Системы - Уровень Рецепта.md" -> "Уровень Рецепта"
    name = filename.replace("Компонент Ремесленной Системы - ", "").replace(".md", "")

    with open(filepath, "r", encoding="utf-8") as f:
        content = f.read().strip()

    slug = slugify(name)

    if not content:
        # Even если файл пустой — всё равно добавим компонент по имени,
        # чтобы он был доступен в базе (описание можно будет дописать позже в Obsidian).
        return {
            "id": slug,
            "name": name,
        }

    # Преобразуем wikilinks в HTML, затем уберём markdown форматирование, сохранив HTML.
    desc_html = convert_wikilinks_in_text(content, base_prefix="")
    description = clean_markdown_formatting(desc_html)

    component = {
        "id": slug,
        "name": name,
        "description": description,
    }

    # Удалим пустые поля
    return {k: v for k, v in component.items() if v}


def main() -> None:
    components = []

    for filename in sorted(os.listdir(OBSIDIAN_PATH)):
        if filename.startswith("Компонент Ремесленной Системы - ") and filename.endswith(".md"):
            filepath = os.path.join(OBSIDIAN_PATH, filename)
            print(f"Parsing craft component: {filename}")
            component = parse_craft_component_file(filepath)
            components.append(component)

    # Сортируем по имени
    components.sort(key=lambda x: x["name"])

    with open(OUTPUT_PATH, "w", encoding="utf-8") as f:
        json.dump(components, f, ensure_ascii=False, indent=2)

    print(f"\nSuccessfully parsed {len(components)} craft components!")
    print(f"Output written to: {OUTPUT_PATH}")


if __name__ == "__main__":
    main()



