# -*- coding: utf-8 -*-
"""
Parse Spell files from Obsidian Vault and generate spells.json
Usage: python parse_spells.py
"""
import os
import re
import json

OBSIDIAN_PATH = r"C:\Users\Kaliguri\Documents\Obsidian Vault\E'Magios Core\E'Magios Core - 03. Spellbook"
OUTPUT_PATH = r"data\spells.json"

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

def extract_action_number(text):
    """Extract action number from text like 'Действие (2)' -> 2."""
    match = re.search(r'\((\d+)\)', text)
    if match:
        return int(match.group(1))
    return None

def parse_spell_file(filepath):
    """Parse a spell file and extract all data."""
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()
    
    # Extract spell name from filename
    # Format: "Заклинание — Школа — Название.md"
    filename = os.path.basename(filepath)
    parts = filename.replace('Заклинание — ', '').replace('.md', '').split(' — ')
    name = parts[-1] if len(parts) > 1 else parts[0]
    
    # Create slug ID
    slug = name.lower()
    slug = slug.replace('ё', 'е')
    slug = re.sub(r'[^а-яa-z0-9]+', '-', slug)
    slug = slug.strip('-')
    
    spell = {
        "id": slug,
        "name": name,
        "actions": None,
        "actionType": None,
        "range": "",
        "target": "",
        "duration": "",
        "damageType": "",
        "concentration": None,
        "maintenance": None,
        "school": "",
        "source": "",
        "type": "",
        "trigger": None,
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
            if '**Действие**:' in line:
                action_text = clean_wikilink(line.split(':', 1)[1])
                spell['actions'] = extract_action_number(action_text)
                # Check if it's Reaction or Action
                if 'Реакция' in action_text or 'реакция' in action_text.lower():
                    spell['actionType'] = 'Реакция'
            elif '**Дистанция**:' in line:
                spell['range'] = clean_wikilink(line.split(':', 1)[1])
            elif '**Цель/Область**:' in line:
                spell['target'] = clean_wikilink(line.split(':', 1)[1])
            elif '**Длительность**:' in line:
                spell['duration'] = clean_wikilink(line.split(':', 1)[1])
            elif '**Тип урона**:' in line:
                spell['damageType'] = clean_wikilink(line.split(':', 1)[1])
            elif '**Концентрация**:' in line:
                conc_text = clean_wikilink(line.split(':', 1)[1])
                if 'Да' in conc_text or 'да' in conc_text:
                    spell['concentration'] = 'Да'
                    # Extract maintenance if present
                    if 'Поддержание' in conc_text:
                        match = re.search(r'Поддержание[:\s]*(.+?)(?:;|$)', conc_text)
                        if match:
                            spell['maintenance'] = match.group(1).strip()
            elif '**Школа Магии**:' in line:
                spell['school'] = clean_wikilink(line.split(':', 1)[1])
            elif '**Источник Заклинания**:' in line:
                spell['source'] = clean_wikilink(line.split(':', 1)[1])
            elif '**Тип Заклинания**:' in line:
                spell['type'] = clean_wikilink(line.split(':', 1)[1])
            elif '**Триггер**:' in line:
                spell['trigger'] = clean_wikilink(line.split(':', 1)[1])
        
        # Parse description
        elif current_section == 'description' and line and not line.startswith('#'):
            if spell['description']:
                spell['description'] += ' ' + line
            else:
                spell['description'] = line
    
    # Clean up description
    spell['description'] = clean_markdown_formatting(spell['description'])
    
    # Remove None/empty fields
    spell_clean = {k: v for k, v in spell.items() if v is not None and v != ""}
    
    return spell_clean

def main():
    spells = []
    
    # Get all spell files
    for filename in sorted(os.listdir(OBSIDIAN_PATH)):
        if filename.startswith('Заклинание') and filename.endswith('.md'):
            filepath = os.path.join(OBSIDIAN_PATH, filename)
            print(f"Parsing: {filename}")
            spell = parse_spell_file(filepath)
            spells.append(spell)
    
    # Sort by name
    spells.sort(key=lambda x: x['name'])
    
    # Write to JSON
    with open(OUTPUT_PATH, 'w', encoding='utf-8') as f:
        json.dump(spells, f, ensure_ascii=False, indent=2)
    
    print(f"\nSuccessfully parsed {len(spells)} spells!")
    print(f"Output written to: {OUTPUT_PATH}")

if __name__ == '__main__':
    main()

