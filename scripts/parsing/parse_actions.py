# -*- coding: utf-8 -*-
"""
Parse Basic Action files and Rest Action files from Obsidian Vault and generate actions.json
Usage: python parse_actions.py
"""
import os
import re
import json

OBSIDIAN_PATH = r"C:\Users\Kaliguri\Documents\Obsidian Vault\E'Magios Core\E'Magios Core - 01. Player's Handbook"
OUTPUT_PATH = r"data\actions.json"

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
        "kind": "Базовое",
        "actions": None,
        "range": "",
        "target": "",
        "duration": "",
        "description": ""
    }
    
    lines = content.split('\n')
    current_section = None
    
    for line in lines:
        raw_line = line.rstrip('\n')
        line = raw_line.strip()

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
        
        elif current_section == 'description':
            # Пустая строка → разрыв абзаца
            if not line:
                if action['description'] and not action['description'].endswith('\n\n'):
                    action['description'] += '\n\n'
            elif not line.startswith('#'):
                # Если это нумерованный пункт "1. ..." – всегда начинаем новый абзац
                if re.match(r'^\d+\.', line):
                    if action['description'] and not action['description'].endswith('\n\n'):
                        action['description'] += '\n\n'

                if not action['description'] or action['description'].endswith('\n\n'):
                    # Начало нового абзаца
                    action['description'] = (action['description'] or '') + line
                else:
                    # Продолжение текущего абзаца
                    action['description'] += ' ' + line
    
    # Сначала конвертируем wikilinks в HTML-ссылки, затем убираем markdown-форматирование
    if action['description']:
        desc_html = convert_wikilinks_in_text(action['description'], base_prefix='')
        action['description'] = clean_markdown_formatting(desc_html)
    
    action_clean = {k: v for k, v in action.items() if v is not None and v != ""}
    
    return action_clean

def parse_rest_action_file(filepath):
    """Parse a rest action file (Действия Отдыха - *) and extract all data."""
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()

    filename = os.path.basename(filepath)
    name = filename.replace('Действия Отдыха - ', '').replace('.md', '')

    slug = name.lower()
    slug = slug.replace('ё', 'е')
    slug = re.sub(r'[^а-яa-z0-9]+', '-', slug)
    slug = slug.strip('-')

    action = {
        "id": slug,
        "name": name,
        "kind": "Отдых",
        "cost": "",
        "availability": "",
        "description": ""
    }

    lines = content.split('\n')
    current_section = None

    for line in lines:
        raw_line = line.rstrip('\n')
        line = raw_line.strip()

        if line.startswith('#### Параметры'):
            current_section = 'parameters'
        elif line.startswith('#### Описание'):
            current_section = 'description'
        elif line.startswith('___'):
            current_section = None
        elif line.startswith('####'):
            current_section = None

        elif current_section == 'parameters' and line.startswith('-'):
            if '**Стоимость**:' in line:
                action['cost'] = clean_wikilink(line.split(':', 1)[1])
            elif '**Доступность**:' in line:
                action['availability'] = clean_wikilink(line.split(':', 1)[1])
        elif current_section == 'description':
            if not line:
                if action['description'] and not action['description'].endswith('\n\n'):
                    action['description'] += '\n\n'
            elif not line.startswith('#'):
                if re.match(r'^\d+\.', line):
                    if action['description'] and not action['description'].endswith('\n\n'):
                        action['description'] += '\n\n'

                if not action['description'] or action['description'].endswith('\n\n'):
                    action['description'] = (action['description'] or '') + line
                else:
                    action['description'] += ' ' + line

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
        elif filename.startswith('Действия Отдыха') and filename.endswith('.md'):
            filepath = os.path.join(OBSIDIAN_PATH, filename)
            print(f"Parsing rest action: {filename}")
            action = parse_rest_action_file(filepath)
            actions.append(action)
    
    actions.sort(key=lambda x: x['name'])
    
    with open(OUTPUT_PATH, 'w', encoding='utf-8') as f:
        json.dump(actions, f, ensure_ascii=False, indent=2)
    
    print(f"\nSuccessfully parsed {len(actions)} actions!")
    print(f"Output written to: {OUTPUT_PATH}")

if __name__ == '__main__':
    main()

