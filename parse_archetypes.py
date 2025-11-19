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
    
    for line in lines:
        line = line.strip()
        
        if line.startswith('#### Описание'):
            current_section = 'description'
            current_improvement = None
        elif line.startswith('#### Улучшение:'):
            improvement_name = line.replace('#### Улучшение:', '').strip()
            current_improvement = {
                "name": improvement_name,
                "description": ""
            }
            current_section = 'improvement'
        elif line.startswith('___'):
            current_section = None
            current_improvement = None
        elif line.startswith('####'):
            current_section = None
            current_improvement = None
        
        elif current_section == 'description' and line and not line.startswith('#'):
            if archetype['description']:
                archetype['description'] += ' ' + line
            else:
                archetype['description'] = line
        
        elif current_section == 'improvement' and line and not line.startswith('#'):
            if current_improvement:
                if current_improvement['description']:
                    current_improvement['description'] += ' ' + line
                else:
                    current_improvement['description'] = line
        
        if current_improvement and current_section != 'improvement':
            if current_improvement['description']:
                archetype['improvements'].append(current_improvement)
            current_improvement = None
    
    if current_improvement and current_improvement['description']:
        archetype['improvements'].append(current_improvement)
    
    archetype['description'] = clean_markdown_formatting(clean_wikilink(archetype['description']))
    
    for improvement in archetype['improvements']:
        improvement['description'] = clean_markdown_formatting(clean_wikilink(improvement['description']))
    
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

