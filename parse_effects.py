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

def clean_wikilink(text):
    """Remove wikilinks and return clean text."""
    # [[Link|Text]] -> Text
    text = re.sub(r'\[\[([^\]|]+)\|([^\]]+)\]\]', r'\2', text)
    # [[Link]] -> Link (extract just the display part)
    text = re.sub(r'\[\[([^\]#|]+)(?:#[^\]|]+)?(?:\|([^\]]+))?\]\]', lambda m: m.group(2) if m.group(2) else m.group(1).split('/')[-1], text)
    return text.strip()

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
    slug = name.lower()
    slug = slug.replace('ё', 'е')
    slug = re.sub(r'[^а-яa-z0-9]+', '-', slug)
    slug = slug.strip('-')
    
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
                effect['actionType'] = clean_wikilink(line.split(':', 1)[1])
        
        # Parse description
        elif current_section == 'description' and line and not line.startswith('#'):
            if effect['description']:
                effect['description'] += ' ' + line
            else:
                effect['description'] = line
    
    # Clean up description
    effect['description'] = clean_markdown_formatting(effect['description'])
    
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

