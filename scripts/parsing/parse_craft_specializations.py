# -*- coding: utf-8 -*-
"""
Parse Craft Specializations from Obsidian Vault and generate craft_specializations.json
Usage: python parse_craft_specializations.py
"""
import os
import re
import json

from link_resolver import convert_wikilinks_in_text

OBSIDIAN_PATH = r"C:\Users\Kaliguri\Documents\Obsidian Vault\E'Magios Core\E'Magios Core - 04. Craftbook"
OUTPUT_PATH = r"data\craft_specializations.json"


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


def parse_specialization_file(filepath: str) -> dict:
    """Parse a single specialization file."""
    filename = os.path.basename(filepath)
    # "Специализация - Алхимик - Зельевар.md" -> profession="Алхимик", name="Зельевар"
    base = filename.replace("Специализация - ", "").replace(".md", "")
    parts = [p.strip() for p in base.split(" - ", 1)]
    if len(parts) == 2:
        profession, name = parts
    else:
        profession = ""
        name = base

    with open(filepath, "r", encoding="utf-8") as f:
        content = f.read().strip()

    slug = slugify(f"{profession} {name}" if profession else name)

    if content:
        desc_html = convert_wikilinks_in_text(content, base_prefix="")
        description = clean_markdown_formatting(desc_html)
    else:
        description = ""

    specialization = {
        "id": slug,
        "name": name,
    }

    if profession:
        specialization["profession"] = profession
    if description:
        specialization["description"] = description

    return specialization


def main() -> None:
    specializations = []

    for filename in sorted(os.listdir(OBSIDIAN_PATH)):
        if not filename.startswith("Специализация - ") or not filename.endswith(".md"):
            continue

        filepath = os.path.join(OBSIDIAN_PATH, filename)
        print(f"Parsing craft specialization: {filename}")
        specializations.append(parse_specialization_file(filepath))

    specializations.sort(key=lambda x: (x.get("profession", ""), x["name"]))

    with open(OUTPUT_PATH, "w", encoding="utf-8") as f:
        json.dump(specializations, f, ensure_ascii=False, indent=2)

    print(f"\nSuccessfully parsed {len(specializations)} craft specializations!")
    print(f"Output written to: {OUTPUT_PATH}")


if __name__ == "__main__":
    main()



