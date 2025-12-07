# -*- coding: utf-8 -*-
"""
Parse Effect files from Obsidian Vault and generate effects.json
Usage: python parse_effects.py
"""
import os
import re
import json

OBSIDIAN_PATH = r"C:\Users\Kaliguri\Documents\Obsidian Vault\E'Magios Core\E'Magios Core - 01. Player's Handbook"
OUTPUT_PATH = r"data\effects.json"

from link_resolver import slugify, strip_wikilinks_to_text, convert_wikilinks_in_text

def clean_markdown_formatting(text):
    """Remove markdown formatting like ** for bold."""
    # Remove bold
    text = re.sub(r'\*\*([^\*]+)\*\*', r'\1', text)
    # Remove italic
    text = re.sub(r'\*([^\*]+)\*', r'\1', text)
    return text.strip()

def parse_effect_file(filepath):
    """Parse an effect file and extract all data."""
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()
    
    # Extract effect name from filename
    filename = os.path.basename(filepath)
    name = filename.replace('Эффект - ', '').replace('.md', '')
    
    # Create slug ID
    slug = slugify(name)
    
    effect = {
        "id": slug,
        "name": name,
        "actionType": "",
        "description": ""
    }
    
    lines = content.split('\n')
    current_section = None
    
    for line in lines:
        line = line.strip()
        
        # Detect sections
        if line.startswith('#### Параметры'):
            current_section = 'parameters'
        elif line.startswith('#### Описание'):
            current_section = 'description'
        elif line.startswith('___'):
            current_section = None
        elif line.startswith('####'):
            current_section = None
        
        # Parse parameters
        elif current_section == 'parameters' and line.startswith('-'):
            if '**Тип Действия**:' in line:
                effect['actionType'] = strip_wikilinks_to_text(line.split(':', 1)[1])
        
        # Parse description
        elif current_section == 'description' and line and not line.startswith('#'):
            if effect['description']:
                effect['description'] += ' ' + line
            else:
                effect['description'] = line
    
    # If no structured описание было найдено (старый или простой формат файла),
    # используем весь текст файла как описание по умолчанию
    if not effect['description']:
        raw = content.strip()
        if raw:
            desc_html = convert_wikilinks_in_text(raw, base_prefix='')
            effect['description'] = clean_markdown_formatting(desc_html)
    else:
        # В обычном случае сначала конвертируем wikilinks в HTML-ссылки,
        # затем убираем markdown-форматирование
        desc_html = convert_wikilinks_in_text(effect['description'], base_prefix='')
        effect['description'] = clean_markdown_formatting(desc_html)
    
    return effect

def main():
    effects = []
    
    # Get all effect files
    for filename in sorted(os.listdir(OBSIDIAN_PATH)):
        if filename.startswith('Эффект') and filename.endswith('.md'):
            filepath = os.path.join(OBSIDIAN_PATH, filename)
            print(f"Parsing: {filename}")
            effect = parse_effect_file(filepath)
            effects.append(effect)
    
    # Sort by name
    effects.sort(key=lambda x: x['name'])
    
    # Write to JSON
    with open(OUTPUT_PATH, 'w', encoding='utf-8') as f:
        json.dump(effects, f, ensure_ascii=False, indent=2)
    
    print(f"\nSuccessfully parsed {len(effects)} effects!")
    print(f"Output written to: {OUTPUT_PATH}")

if __name__ == '__main__':
    main()

