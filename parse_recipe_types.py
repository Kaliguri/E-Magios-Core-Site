# -*- coding: utf-8 -*-
"""
Parse Recipe Type files from Obsidian Vault and generate recipe_types.json
Usage: python parse_recipe_types.py
"""
import os
import re
import json

from link_resolver import convert_wikilinks_in_text

OBSIDIAN_PATH = r"C:\Users\Kaliguri\Documents\Obsidian Vault\E'Magios Core\E'Magios Core - 04. Craftbook"
OUTPUT_PATH = r"data\recipe_types.json"


def clean_markdown_formatting(text: str) -> str:
    """Remove basic markdown formatting like headings and ** for bold, keep HTML from wikilinks."""
    text = re.sub(r"^#+\s*", "", text, flags=re.MULTILINE)
    text = re.sub(r"\*\*([^\*]+)\*\*", r"\1", text)
    text = re.sub(r"\*([^\*]+)\*", r"\1", text)
    return text.strip()


def slugify(name: str) -> str:
    slug = name.lower()
    slug = slug.replace("ё", "е")
    slug = re.sub(r"[^а-яa-z0-9]+", "-", slug)
    slug = slug.strip("-")
    return slug


def parse_recipe_type_file(filepath: str) -> dict:
    """Parse a single recipe type file."""
    filename = os.path.basename(filepath)
    name = filename.replace("Тип Рецепта - ", "").replace(".md", "")

    with open(filepath, "r", encoding="utf-8") as f:
        content = f.read().strip()

    slug = slugify(name)

    # Файл может быть пустым — тогда просто отдаём тип по имени
    if not content:
        return {
            "id": slug,
            "name": name,
        }

    desc_html = convert_wikilinks_in_text(content, base_prefix="")
    description = clean_markdown_formatting(desc_html)

    recipe_type = {
        "id": slug,
        "name": name,
    }
    if description:
        recipe_type["description"] = description

    return recipe_type


def main() -> None:
    types = []

    for filename in sorted(os.listdir(OBSIDIAN_PATH)):
        if not filename.startswith("Тип Рецепта - ") or not filename.endswith(".md"):
            continue
        filepath = os.path.join(OBSIDIAN_PATH, filename)
        print(f"Parsing recipe type: {filename}")
        types.append(parse_recipe_type_file(filepath))

    types.sort(key=lambda x: x["name"])

    with open(OUTPUT_PATH, "w", encoding="utf-8") as f:
        json.dump(types, f, ensure_ascii=False, indent=2)

    print(f"\nSuccessfully parsed {len(types)} recipe types!")
    print(f"Output written to: {OUTPUT_PATH}")


if __name__ == "__main__":
    main()



