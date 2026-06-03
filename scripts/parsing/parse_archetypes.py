# -*- coding: utf-8 -*-
"""
Parse Archetype files from Obsidian Vault and generate archetypes.json
Usage: python parse_archetypes.py
"""
import os
import re
import json

OBSIDIAN_PATH = r"C:\Users\Kaliguri\Documents\Obsidian Vault\E'Magios Core\E'Magios Core - 01. Player's Handbook"
OUTPUT_PATH = r"data\archetypes.json"

from link_resolver import convert_wikilinks_in_text

def clean_wikilink(text):
    """Remove wikilinks and return clean text."""
    text = re.sub(r'\[\[([^\]|]+)\|([^\]]+)\]\]', r'\2', text)
    text = re.sub(r'\[\[([^\]#|]+)(?:#[^\]|]+)?(?:\|([^\]]+))?\]\]', lambda m: m.group(2) if m.group(2) else m.group(1).split('/')[-1], text)
    return text.strip()

def clean_markdown_formatting(text):
    """Remove markdown formatting like ** for bold."""
    text = re.sub(r'\*\*([^\*]+)\*\*', r'\1', text)
    text = re.sub(r'\*([^\*]+)\*', r'\1', text)
    return text.strip()

def parse_archetype_file(filepath):
    """Parse an archetype file and extract all data."""
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()

    filename = os.path.basename(filepath)
    name = filename.replace('Архетип - ', '').replace('.md', '')

    slug = name.lower()
    slug = slug.replace('ё', 'е')
    slug = re.sub(r'[^а-яa-z0-9]+', '-', slug)
    slug = slug.strip('-')

    archetype = {
        "id": slug,
        "name": name,
        "description": "",
        "improvements": []
    }

    lines = content.split('\n')
    current_section = None
    current_improvement = None

    for raw in lines:
        line = raw.rstrip('\n')
        stripped = line.strip()

        if stripped.startswith('#### Описание'):
            current_section = 'description'
            current_improvement = None
            continue
        if stripped.startswith('#### Улучшение:'):
            improvement_name = stripped.replace('#### Улучшение:', '').strip()
            current_improvement = {
                "name": improvement_name,
                "description": ""
            }
            current_section = 'improvement'
            continue
        if stripped.startswith('___'):
            current_section = None
            if current_improvement and current_improvement.get('description'):
                archetype['improvements'].append(current_improvement)
            current_improvement = None
            continue
        if stripped.startswith('####'):
            current_section = None
            if current_improvement and current_improvement.get('description'):
                archetype['improvements'].append(current_improvement)
            current_improvement = None
            continue

        if current_section == 'description':
            if not stripped:
                if archetype['description'] and not archetype['description'].endswith('\n\n'):
                    archetype['description'] += '\n\n'
            elif not stripped.startswith('#'):
                # Сохраняем wikilinks как есть, обработаем их позже одним проходом
                if not archetype['description'] or archetype['description'].endswith('\n\n'):
                    archetype['description'] = (archetype['description'] or '') + stripped
                else:
                    archetype['description'] += ' ' + stripped

        elif current_section == 'improvement' and current_improvement is not None:
            if not stripped:
                if current_improvement['description'] and not current_improvement['description'].endswith('\n\n'):
                    current_improvement['description'] += '\n\n'
            elif not stripped.startswith('#'):
                if not current_improvement['description'] or current_improvement['description'].endswith('\n\n'):
                    current_improvement['description'] = (current_improvement['description'] or '') + stripped
                else:
                    current_improvement['description'] += ' ' + stripped

    if current_improvement and current_improvement.get('description'):
        archetype['improvements'].append(current_improvement)

    # Если в файле не было явного блока "#### Описание", считаем всё содержимое описанием
    if not archetype['description']:
        full_text_lines = []
        for raw in lines:
            stripped = raw.strip()
            if stripped.startswith('####') or stripped.startswith('___'):
                continue
            full_text_lines.append(stripped)
        full_text = '\n\n'.join([l for l in full_text_lines if l])
        # Конвертируем wikilinks в HTML и убираем markdown
        full_text = convert_wikilinks_in_text(full_text, base_prefix='')
        archetype['description'] = clean_markdown_formatting(full_text)
    else:
        desc_html = convert_wikilinks_in_text(archetype['description'], base_prefix='')
        archetype['description'] = clean_markdown_formatting(desc_html)

    for improvement in archetype['improvements']:
        if improvement['description']:
            imp_html = convert_wikilinks_in_text(improvement['description'], base_prefix='')
            improvement['description'] = clean_markdown_formatting(imp_html)

    if not archetype['improvements']:
        del archetype['improvements']

    return archetype

def main():
    archetypes = []
    
    for filename in sorted(os.listdir(OBSIDIAN_PATH)):
        if filename.startswith('Архетип -') and filename.endswith('.md'):
            filepath = os.path.join(OBSIDIAN_PATH, filename)
            print(f"Parsing: {filename}")
            archetype = parse_archetype_file(filepath)
            archetypes.append(archetype)
    
    archetypes.sort(key=lambda x: x['name'])
    
    with open(OUTPUT_PATH, 'w', encoding='utf-8') as f:
        json.dump(archetypes, f, ensure_ascii=False, indent=2)
    
    print(f"\nSuccessfully parsed {len(archetypes)} archetypes!")
    print(f"Output written to: {OUTPUT_PATH}")

if __name__ == '__main__':
    main()

