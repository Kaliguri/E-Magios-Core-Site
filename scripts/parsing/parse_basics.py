#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Parse core PHB chapters from Obsidian Vault into data/basics.json

Links are converted to DB links only (special PHB page links disabled).
"""
import json
import os
import sys

from convert_md_to_html import convert_markdown_to_html
from link_resolver import slugify

OBSIDIAN_PATH = r"C:\Users\Kaliguri\Documents\Obsidian Vault\E'Magios Core\E'Magios Core - 01. Player's Handbook"
OUTPUT_PATH = r"data\basics.json"

# Id/title pairs are aligned with phb.html structure
BASICS = [
    ("intro", "Введение"),
    ("creation", "Создание Персонажа"),
    ("stats", "Характеристики"),
    ("study-spells", "Учебные Заклинания"),
    ("signature-spells", "Фирменные Заклинания"),
    ("spontaneous-spells", "Спонтанные Заклинания"),
    ("metamagic", "Метамагия"),
    ("abstract-categories", "Абстрактные Категории"),
    ("rituals", "Ритуалы"),
    ("combat", "Компоненты Боевой Системы"),
    ("actions", "Базовые Действия"),
    ("critical-success", "Критический Успех"),
    ("wounds", "Раны"),
    ("archetypes", "Архетипы"),
    ("leveling", "Повышение Уровня"),
    ("long-term-projects", "Долгосрочные Проекты"),
    ("equipment", "Экипировка"),
    ("crafting", "Ремесло"),
    ("effects", "Эффекты"),
]


def find_md_file(title: str) -> str:
    """
    Find a markdown file in OBSIDIAN_PATH that contains the title in its filename.
    """
    title_lower = title.lower()
    for fname in os.listdir(OBSIDIAN_PATH):
        if not fname.lower().endswith(".md"):
            continue
        if title_lower in fname.lower():
            return os.path.join(OBSIDIAN_PATH, fname)
    return ""


def parse_basic(title: str) -> str:
    path = find_md_file(title)
    if not path or not os.path.isfile(path):
        print(f"[WARN] File not found for '{title}'")
        return ""
    with open(path, "r", encoding="utf-8") as f:
        md_content = f.read()
    # Convert to HTML; disable special PHB page links so all links resolve to DB entities only
    html = convert_markdown_to_html(md_content, book_code="phb", base_prefix="", allow_special_pages=False)
    return html.strip()


def main():
    basics = []
    for slug, title in BASICS:
        content_html = parse_basic(title)
        if not content_html:
            continue
        basics.append(
            {
                "id": slugify(slug),
                "name": title,
                "description": content_html,
            }
        )

    basics.sort(key=lambda x: x["name"])

    with open(OUTPUT_PATH, "w", encoding="utf-8") as f:
        json.dump(basics, f, ensure_ascii=False, indent=2)

    print(f"Generated {len(basics)} basics entries -> {OUTPUT_PATH}")


if __name__ == "__main__":
    sys.exit(main())

