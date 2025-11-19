# -*- coding: utf-8 -*-
"""
Parse Basic Action files from Obsidian Vault and generate actions.json
Usage: python parse_actions.py
"""
import os
import re
import json

OBSIDIAN_PATH = r"C:\Users\Kaliguri\Documents\Obsidian Vault\E'Magios Core\E'Magios Core - 01. Player's Handbook"
OUTPUT_PATH = r"data\actions.json"

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

def parse_action_file(filepath):
    """Parse a basic action file and extract all data."""
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()
    
    filename = os.path.basename(filepath)
    name = filename.replace('Базовое Действие - ', '').replace('Базовые Действие - ', '').replace('.md', '')
    
    slug = name.lower()
    slug = slug.replace('ё', 'е')
    slug = re.sub(r'[^а-яa-z0-9]+', '-', slug)
    slug = slug.strip('-')
    
    action = {
        "id": slug,
        "name": name,
        "actions": None,
        "range": "",
        "target": "",
        "duration": "",
        "description": ""
    }
    
    lines = content.split('\n')
    current_section = None
    
    for line in lines:
        line = line.strip()
        
        if line.startswith('#### Параметры'):
            current_section = 'parameters'
        elif line.startswith('#### Описание'):
            current_section = 'description'
        elif line.startswith('___'):
            current_section = None
        elif line.startswith('####'):
            current_section = None
        
        elif current_section == 'parameters' and line.startswith('-'):
            if '**Действие**:' in line:
                action_text = clean_wikilink(line.split(':', 1)[1])
                match = re.search(r'\((\d+)\)', action_text)
                if match:
                    action['actions'] = int(match.group(1))
            elif '**Дистанция**:' in line:
                action['range'] = clean_wikilink(line.split(':', 1)[1])
            elif '**Цель/Область**:' in line:
                action['target'] = clean_wikilink(line.split(':', 1)[1])
            elif '**Длительность**:' in line:
                action['duration'] = clean_wikilink(line.split(':', 1)[1])
        
        elif current_section == 'description' and line and not line.startswith('#'):
            if action['description']:
                action['description'] += ' ' + line
            else:
                action['description'] = line
    
    action['description'] = clean_markdown_formatting(clean_wikilink(action['description']))
    
    action_clean = {k: v for k, v in action.items() if v is not None and v != ""}
    
    return action_clean

def main():
    actions = []
    
    for filename in sorted(os.listdir(OBSIDIAN_PATH)):
        if filename.startswith('Базов') and 'Действие' in filename and filename.endswith('.md'):
            filepath = os.path.join(OBSIDIAN_PATH, filename)
            print(f"Parsing: {filename}")
            action = parse_action_file(filepath)
            actions.append(action)
    
    actions.sort(key=lambda x: x['name'])
    
    with open(OUTPUT_PATH, 'w', encoding='utf-8') as f:
        json.dump(actions, f, ensure_ascii=False, indent=2)
    
    print(f"\nSuccessfully parsed {len(actions)} actions!")
    print(f"Output written to: {OUTPUT_PATH}")

if __name__ == '__main__':
    main()

