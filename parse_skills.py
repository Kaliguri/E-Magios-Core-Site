# -*- coding: utf-8 -*-
"""
Parse Skill files (Навык Личности / Навык Магии) from Obsidian Vault and generate skills.json
Usage: python parse_skills.py
"""
import os
import re
import json

from link_resolver import convert_wikilinks_in_text

OBSIDIAN_PATH = r"C:\Users\Kaliguri\Documents\Obsidian Vault\E'Magios Core\E'Magios Core - 01. Player's Handbook"
OUTPUT_PATH = r"data\skills.json"


def clean_markdown_formatting(text):
    """Remove basic markdown formatting like headings and ** for bold."""
    text = re.sub(r'^#+\s*', '', text, flags=re.MULTILINE)
    text = re.sub(r'\*\*([^\*]+)\*\*', r'\1', text)
    text = re.sub(r'\*([^\*]+)\*', r'\1', text)
    return text.strip()


def parse_skill_file(filepath, skill_type):
    """Parse a single skill file (личности или магии)."""
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()

    filename = os.path.basename(filepath)
    if skill_type == 'Личность':
        name = filename.replace('Навык Личности - ', '').replace('.md', '')
    else:
        name = filename.replace('Навык Магии - ', '').replace('.md', '')

    slug = name.lower()
    slug = slug.replace('ё', 'е')
    slug = re.sub(r'[^а-яa-z0-9]+', '-', slug)
    slug = slug.strip('-')

    # Сначала конвертируем wikilinks в HTML, затем убираем markdown-форматирование
    html_with_links = convert_wikilinks_in_text(content, base_prefix='')
    description = clean_markdown_formatting(html_with_links)

    skill = {
        "id": slug,
        "name": name,
        "type": skill_type,
        "description": description
    }

    return skill


def main():
    skills = []

    for filename in sorted(os.listdir(OBSIDIAN_PATH)):
        if filename.startswith('Навык Личности - ') and filename.endswith('.md'):
            filepath = os.path.join(OBSIDIAN_PATH, filename)
            print(f"Parsing personality skill: {filename}")
            skill = parse_skill_file(filepath, 'Личность')
            skills.append(skill)
        elif filename.startswith('Навык Магии - ') and filename.endswith('.md'):
            filepath = os.path.join(OBSIDIAN_PATH, filename)
            print(f"Parsing magic skill: {filename}")
            skill = parse_skill_file(filepath, 'Магия')
            skills.append(skill)

    skills.sort(key=lambda x: x['name'])

    with open(OUTPUT_PATH, 'w', encoding='utf-8') as f:
        json.dump(skills, f, ensure_ascii=False, indent=2)

    print(f"\nSuccessfully parsed {len(skills)} skills!")
    print(f"Output written to: {OUTPUT_PATH}")


if __name__ == '__main__':
    main()


