# -*- coding: utf-8 -*-
"""
Parse Craft Professions from Obsidian Vault and generate craft_professions.json
Usage: python parse_craft_professions.py
"""
import os
import re
import json

from link_resolver import convert_wikilinks_in_text

OBSIDIAN_PATH = r"C:\Users\Kaliguri\Documents\Obsidian Vault\E'Magios Core\E'Magios Core - 04. Craftbook"
OUTPUT_PATH = r"data\craft_professions.json"


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


def collect_specializations() -> dict:
    """
    Собираем список специализаций по профессиям на основе имён файлов:
    'Специализация - Алхимик - Зельевар.md' -> profession='Алхимик', spec='Зельевар'
    """
    mapping: dict[str, list[str]] = {}

    for filename in os.listdir(OBSIDIAN_PATH):
        if not filename.startswith("Специализация - ") or not filename.endswith(".md"):
            continue
        base = filename.replace("Специализация - ", "").replace(".md", "")
        # Ожидаемый формат: "<Профессия> - <Специализация>"
        parts = [p.strip() for p in base.split(" - ", 1)]
        if len(parts) != 2:
            continue
        profession, spec = parts
        mapping.setdefault(profession, []).append(spec)

    # Отсортируем специализации внутри профессий
    for prof, specs in mapping.items():
        mapping[prof] = sorted(specs)

    return mapping


def parse_profession_file(filepath: str, specializations_by_prof: dict) -> dict:
    """Parse a single profession file."""
    filename = os.path.basename(filepath)
    name = filename.replace("Профессия - ", "").replace(".md", "")

    with open(filepath, "r", encoding="utf-8") as f:
        content = f.read().strip()

    slug = slugify(name)

    if content:
        desc_html = convert_wikilinks_in_text(content, base_prefix="")
        description = clean_markdown_formatting(desc_html)
    else:
        description = ""

    profession = {
        "id": slug,
        "name": name,
    }

    if description:
        profession["description"] = description

    specs = specializations_by_prof.get(name)
    if specs:
        profession["specializations"] = specs

    return profession


def main() -> None:
    professions = []

    specializations_by_prof = collect_specializations()

    for filename in sorted(os.listdir(OBSIDIAN_PATH)):
        if not filename.startswith("Профессия - ") or not filename.endswith(".md"):
            continue
        # Пропустим LEGACY‑версии, чтобы не плодить устаревшие записи
        if "LEGACY" in filename:
            continue

        filepath = os.path.join(OBSIDIAN_PATH, filename)
        print(f"Parsing craft profession: {filename}")
        professions.append(parse_profession_file(filepath, specializations_by_prof))

    professions.sort(key=lambda x: x["name"])

    with open(OUTPUT_PATH, "w", encoding="utf-8") as f:
        json.dump(professions, f, ensure_ascii=False, indent=2)

    print(f"\nSuccessfully parsed {len(professions)} craft professions!")
    print(f"Output written to: {OUTPUT_PATH}")


if __name__ == "__main__":
    main()



