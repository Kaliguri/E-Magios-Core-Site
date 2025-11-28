# -*- coding: utf-8 -*-
"""
Parse Combat Component files from Obsidian Vault and generate combat_components.json
Usage: python parse_combat_components.py
"""
import os
import re
import json

from link_resolver import convert_wikilinks_in_text

OBSIDIAN_PATH = r"C:\Users\Kaliguri\Documents\Obsidian Vault\E'Magios Core\E'Magios Core - 01. Player's Handbook"
OUTPUT_PATH = r"data\combat_components.json"


def clean_markdown_formatting(text):
    """Remove basic markdown formatting like headings and ** for bold."""
    text = re.sub(r'^#+\s*', '', text, flags=re.MULTILINE)
    text = re.sub(r'\*\*([^\*]+)\*\*', r'\1', text)
    text = re.sub(r'\*([^\*]+)\*', r'\1', text)
    return text.strip()


def clean_wikilink(text):
    """Remove wikilinks and return clean text."""
    text = re.sub(r'\[\[([^\]|]+)\|([^\]]+)\]\]', r'\2', text)
    text = re.sub(
        r'\[\[([^\]#|]+)(?:#[^\]|]+)?(?:\|([^\]]+))?\]\]',
        lambda m: m.group(2) if m.group(2) else m.group(1).split('/')[-1],
        text
    )
    return text.strip()


def parse_combat_component_file(filepath):
    """Parse a single combat component file."""
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()

    filename = os.path.basename(filepath)
    name = filename.replace('Компонент Боевой Системы - ', '').replace('.md', '')

    slug = name.lower()
    slug = slug.replace('ё', 'е')
    slug = re.sub(r'[^а-яa-z0-9]+', '-', slug)
    slug = slug.strip('-')

    lines = content.split('\n')
    description_lines = []
    section = ''
    page = ''
    in_body = False

    for line in lines:
        stripped = line.strip()

        if stripped.startswith('## '):
            # Заголовок раздела, пропускаем, но используем как section если нужно
            heading = stripped[3:].strip()
            if not section:
                section = heading
            in_body = True
            continue

        if stripped.startswith('___'):
            # Нижний блок с "Связи"
            in_body = False
            continue

        if stripped.startswith('Связи:'):
            wikilink_pattern = r'\[\[([^\]|]+)\|([^\]]+)\]\]'
            match = re.search(wikilink_pattern, stripped)
            if match:
                page = clean_wikilink(match.group(1))
                if not section:
                    section = clean_wikilink(match.group(2))
            continue

        if in_body and stripped and not stripped.startswith('#'):
            description_lines.append(stripped)

    # Сначала wikilinks → HTML (чтобы, например, ссылки на главы PHB стали кликабельными),
    # затем убираем markdown-форматирование, оставляя HTML нетронутым.
    raw_description = '\n\n'.join(description_lines)
    desc_html = convert_wikilinks_in_text(raw_description, base_prefix='')
    description = clean_markdown_formatting(desc_html)

    component = {
        "id": slug,
        "name": name,
        "section": section,
        "page": page,
        "description": description
    }

    # Remove empty fields
    component_clean = {k: v for k, v in component.items() if v}

    return component_clean


def main():
    components = []

    for filename in sorted(os.listdir(OBSIDIAN_PATH)):
        if filename.startswith('Компонент Боевой Системы - ') and filename.endswith('.md'):
            filepath = os.path.join(OBSIDIAN_PATH, filename)
            print(f"Parsing combat component: {filename}")
            component = parse_combat_component_file(filepath)
            components.append(component)

    components.sort(key=lambda x: x['name'])

    with open(OUTPUT_PATH, 'w', encoding='utf-8') as f:
        json.dump(components, f, ensure_ascii=False, indent=2)

    print(f"\nSuccessfully parsed {len(components)} combat components!")
    print(f"Output written to: {OUTPUT_PATH}")


if __name__ == '__main__':
    main()


