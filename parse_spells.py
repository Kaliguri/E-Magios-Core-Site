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

from link_resolver import slugify, strip_wikilinks_to_text, convert_wikilinks_in_text

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

def parse_damage_types(text):
    """Parse damage types into array.
    Examples:
    - 'Дробящий, колющий, режущий (на выбор)' -> (['Дробящий', 'Колющий', 'Режущий'], 'на выбор')
    - 'Колющий, яд' -> (['Колющий', 'Яд'], None)
    - 'Аркана' -> (['Аркана'], None)
    """
    if not text:
        return [], None
    
    # Extract note in parentheses
    note = None
    note_match = re.search(r'\(([^)]+)\)', text)
    if note_match:
        note = note_match.group(1).strip()
        # Remove the note from text
        text = re.sub(r'\s*\([^)]+\)', '', text)
    
    # Split by comma or "или"
    types = re.split(r',|\s+или\s+', text)
    types = [t.strip().capitalize() for t in types if t.strip()]
    
    return types, note

def parse_subspell(lines, start_idx):
    """Parse a subspell starting from a ##### heading."""
    subspell = {
        "name": "",
        "actions": None,
        "actionType": None,
        "resources": "",
        "range": "",
        "target": "",
        "duration": "",
        "damageType": [],
        "damageTypeNote": None,
        "type": "",
        "trigger": None,
        "description": ""
    }
    
    current_section = None
    i = start_idx
    
    while i < len(lines):
        line = lines[i].strip()
        
        # Stop at section end
        if line.startswith('___'):
            break
        
        # Stop at next subspell (only if not the current one)
        # Need to check exact heading level to avoid false positives with ######
        if i != start_idx:
            # Check for ##### heading (but not ###### or deeper)
            if line.startswith('#####') and not line.startswith('######'):
                if not (line.startswith('##### Параметры') or line.startswith('##### Описание')):
                    break
            # Check for #### heading (but not ##### or deeper)
            elif line.startswith('####') and not line.startswith('#####'):
                if not (line.startswith('#### Параметры') or line.startswith('#### Описание')):
                    break
        
        # Extract subspell name from ##### or #### heading
        if i == start_idx and (line.startswith('#####') or line.startswith('####')):
            subspell['name'] = line.replace('#####', '').replace('####', '').strip()
            i += 1
            continue
        
        # Detect sections by ###### headings
        if line.startswith('###### Параметры') or line.startswith('##### Параметры'):
            current_section = 'parameters'
            i += 1
            continue
        elif line.startswith('###### Описание') or line.startswith('##### Описание'):
            current_section = 'description'
            i += 1
            continue
        
        # Parse parameters
        if current_section == 'parameters' and line.startswith('-'):
            if '**Действие**:' in line:
                action_text = strip_wikilinks_to_text(line.split(':', 1)[1])
                subspell['actions'] = extract_action_number(action_text)
                if 'Реакция' in action_text or 'реакция' in action_text.lower():
                    subspell['actionType'] = 'Реакция'
            elif '**Ресурсы**:' in line:
                subspell['resources'] = strip_wikilinks_to_text(line.split(':', 1)[1])
            elif '**Дистанция**:' in line:
                subspell['range'] = strip_wikilinks_to_text(line.split(':', 1)[1])
            elif '**Цель/Область**:' in line:
                subspell['target'] = strip_wikilinks_to_text(line.split(':', 1)[1])
            elif '**Длительность**:' in line:
                subspell['duration'] = strip_wikilinks_to_text(line.split(':', 1)[1])
            elif '**Тип урона**:' in line:
                damage_text = strip_wikilinks_to_text(line.split(':', 1)[1])
                damage_types, damage_note = parse_damage_types(damage_text)
                subspell['damageType'] = damage_types
                if damage_note:
                    subspell['damageTypeNote'] = damage_note
            elif '**Тип Действия**:' in line or '**Тип Заклинания**:' in line:
                subspell['type'] = strip_wikilinks_to_text(line.split(':', 1)[1])
            elif '**Триггер**:' in line:
                subspell['trigger'] = strip_wikilinks_to_text(line.split(':', 1)[1])
        
        # Parse description
        elif current_section == 'description':
            if not line:
                if subspell['description'] and not subspell['description'].endswith('\n\n'):
                    subspell['description'] += '\n\n'
            elif not line.startswith('#'):
                if subspell['description'] and not subspell['description'].endswith('\n\n'):
                    subspell['description'] += ' ' + line
                else:
                    subspell['description'] += line
        
        i += 1
    
    # Clean up description: convert wikilinks to HTML and strip markdown formatting
    if subspell['description']:
        desc_html = convert_wikilinks_in_text(subspell['description'], base_prefix='')
        subspell['description'] = clean_markdown_formatting(desc_html)
    
    # Skip empty subspells (section headers without content)
    if not subspell['description'] and not subspell['actions'] and not subspell['range']:
        return None, i
    
    # Remove None/empty fields
    subspell_clean = {}
    for k, v in subspell.items():
        if v is None or v == "":
            continue
        if isinstance(v, list) and len(v) == 0:
            continue
        subspell_clean[k] = v
    
    return subspell_clean, i

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
    slug = slugify(name)
    
    spell = {
        "id": slug,
        "name": name,
        "actions": None,
        "actionType": None,
        "resources": "",
        "range": "",
        "target": "",
        "duration": "",
        "damageType": [],
        "damageTypeNote": None,
        "concentration": None,
        "maintenance": None,
        "school": "",
        "requiredLevel": None,
        "value": None,
        "supportMagic": "",
        "type": "",
        "trigger": None,
        "description": "",
        "subSpells": []
    }
    
    lines = content.split('\n')
    current_section = None
    i = 0

    # Специфичные поля для ритуалов (#### Требования к Ритуалу)
    ritual_time_lines = []
    ritual_participants_lines = []
    ritual_components_lines = []
    ritual_components_value = None
    current_ritual_subsection = None
    
    while i < len(lines):
        line = lines[i].strip()
        
        # Detect subspells section
        is_subspell = False
        
        # Check if this is a ##### heading (but not Параметры/Описание).
        # Для реальных подзаклинаний под ним дальше идут "###### Параметры/Описание".
        # Служебные блоки вроде "Время проведения" для ритуалов не должны
        # становиться подзаклинаниями.
        if line.startswith('#####') and not line.startswith('######'):
            if not (line.startswith('##### Параметры') or line.startswith('##### Описание')):
                has_content = False
                for j in range(i + 1, min(i + 20, len(lines))):
                    next_line = lines[j].strip()
                    # Ищем вложенные параметры/описание подзаклинания
                    if next_line.startswith('###### Параметры') or next_line.startswith('###### Описание'):
                        has_content = True
                        break
                    # Если встретили следующий заголовок того же уровня — выходим
                    if next_line.startswith('#####') and not next_line.startswith('######'):
                        break
                if has_content:
                    is_subspell = True
        # Check if this is a ###### heading - skip these entirely, they're internal structure
        elif line.startswith('######'):
            pass  # These are always internal to subspells, never subspells themselves
        # Check if this is a #### heading (but not Параметры/Описание and not section headers)
        elif line.startswith('####') and not line.startswith('#####'):
            if not (line.startswith('#### Параметры') or line.startswith('#### Описание')):
                # Skip section headers
                section_headers = ['Способы Использования', 'Контуры Усиления', 'Требования к Ритуалу']
                if not any(header in line for header in section_headers):
                    # Check next few lines to see if there are parameters/description
                    has_content = False
                    for j in range(i+1, min(i+15, len(lines))):
                        next_line = lines[j].strip()
                        if (next_line.startswith('##### Параметры') or next_line.startswith('##### Описание') or
                            next_line.startswith('###### Параметры') or next_line.startswith('###### Описание')):
                            has_content = True
                            break
                        # Stop if we hit another heading at same level
                        if next_line.startswith('####') and not next_line.startswith('#####'):
                            break
                    if has_content:
                        is_subspell = True
        
        if is_subspell:
            subspell, next_i = parse_subspell(lines, i)
            if subspell:
                spell['subSpells'].append(subspell)
            i = next_i
            continue
        
        # Detect sections
        if line.startswith('#### Параметры'):
            current_section = 'parameters'
        elif line.startswith('#### Описание'):
            current_section = 'description'
        elif line.startswith('#### Требования к Ритуалу'):
            current_section = 'ritual'
            current_ritual_subsection = None
        elif line.startswith('___'):
            current_section = None
        
        # Parse parameters
        elif current_section == 'parameters' and line.startswith('-'):
            if '**Действие**:' in line:
                action_text = strip_wikilinks_to_text(line.split(':', 1)[1])
                spell['actions'] = extract_action_number(action_text)
                # Check if it's Reaction or Action
                if 'Реакция' in action_text or 'реакция' in action_text.lower():
                    spell['actionType'] = 'Реакция'
            elif '**Ресурсы**:' in line:
                spell['resources'] = strip_wikilinks_to_text(line.split(':', 1)[1])
            elif '**Дистанция**:' in line:
                spell['range'] = strip_wikilinks_to_text(line.split(':', 1)[1])
            elif '**Цель/Область**:' in line:
                spell['target'] = strip_wikilinks_to_text(line.split(':', 1)[1])
            elif '**Длительность**:' in line:
                spell['duration'] = strip_wikilinks_to_text(line.split(':', 1)[1])
            elif '**Тип урона**:' in line:
                damage_text = strip_wikilinks_to_text(line.split(':', 1)[1])
                damage_types, damage_note = parse_damage_types(damage_text)
                spell['damageType'] = damage_types
                if damage_note:
                    spell['damageTypeNote'] = damage_note
            elif '**Концентрация**:' in line:
                conc_text = strip_wikilinks_to_text(line.split(':', 1)[1])
                conc_text = clean_markdown_formatting(conc_text)
                if 'Да' in conc_text or 'да' in conc_text:
                    spell['concentration'] = 'Да'
                    # Extract maintenance if present
                    if 'Поддержание' in conc_text:
                        match = re.search(r'Поддержание[:\s]*(.+?)(?:;|$)', conc_text)
                        if match:
                            spell['maintenance'] = clean_markdown_formatting(match.group(1)).strip()
            elif '**Школа Магии**:' in line:
                spell['school'] = strip_wikilinks_to_text(line.split(':', 1)[1])
            elif '**Требование к Уровню**:' in line:
                level_text = strip_wikilinks_to_text(line.split(':', 1)[1]).strip()
                level_match = re.search(r'\d+', level_text)
                if level_match:
                    spell['requiredLevel'] = int(level_match.group(0))
            elif '**Ценность**:' in line:
                value_text = strip_wikilinks_to_text(line.split(':', 1)[1]).strip()
                value_match = re.search(r'\d+', value_text)
                if value_match:
                    spell['value'] = int(value_match.group(0))
            elif '**Вспомогательная магия**:' in line:
                spell['supportMagic'] = strip_wikilinks_to_text(line.split(':', 1)[1])
            elif '**Тип Действия**:' in line or '**Тип Заклинания**:' in line:
                spell['type'] = strip_wikilinks_to_text(line.split(':', 1)[1])
            elif '**Триггер**:' in line:
                spell['trigger'] = strip_wikilinks_to_text(line.split(':', 1)[1])

        # Parse ritual requirements
        elif current_section == 'ritual':
            # Подзаголовки ритуальных требований
            if line.startswith('##### '):
                header = strip_wikilinks_to_text(line.replace('#####', '').strip())
                if header.startswith('Время проведения'):
                    current_ritual_subsection = 'time'
                elif header.startswith('Обязательные участники'):
                    current_ritual_subsection = 'participants'
                elif header.startswith('Требуемые компоненты'):
                    current_ritual_subsection = 'components'
                    # Попробуем вытащить ценность из скобок в заголовке
                    match_val = re.search(r'Ценность:\s*([^)]+)', header)
                    if match_val:
                        ritual_components_value = match_val.group(1).strip()
                else:
                    current_ritual_subsection = None
            else:
                # Накопление текста по текущему подразделу
                if current_ritual_subsection == 'time' and line and not line.startswith('#'):
                    ritual_time_lines.append(line)
                elif current_ritual_subsection == 'participants' and line and not line.startswith('#'):
                    ritual_participants_lines.append(line)
                elif current_ritual_subsection == 'components' and line and not line.startswith('#'):
                    ritual_components_lines.append(line)

        # Parse description with paragraph breaks
        elif current_section == 'description':
            if not line:
                if spell['description'] and not spell['description'].endswith('\n\n'):
                    spell['description'] += '\n\n'
            elif not line.startswith('#'):
                if spell['description'] and not spell['description'].endswith('\n\n'):
                    spell['description'] += ' ' + line
                else:
                    spell['description'] += line
        
        i += 1
    
    # Clean up description:
    # 1) конвертируем wikilinks в HTML-ссылки на сайт
    # 2) убираем markdown-форматирование (** */ и т.п.), оставляя HTML
    if spell['description']:
        desc_html = convert_wikilinks_in_text(spell['description'], base_prefix='')
        spell['description'] = clean_markdown_formatting(desc_html)

    # Собираем структуру ритуала, если есть данные
    ritual = {}
    if ritual_time_lines:
        time_html = convert_wikilinks_in_text('\n\n'.join(ritual_time_lines), base_prefix='')
        ritual['time'] = clean_markdown_formatting(time_html)
    if ritual_participants_lines:
        part_html = convert_wikilinks_in_text('\n\n'.join(ritual_participants_lines), base_prefix='')
        ritual['participants'] = clean_markdown_formatting(part_html)
    if ritual_components_lines:
        comp_html = convert_wikilinks_in_text('\n\n'.join(ritual_components_lines), base_prefix='')
        ritual['components'] = clean_markdown_formatting(comp_html)
    if ritual_components_value:
        ritual['componentsValue'] = ritual_components_value
    if ritual:
        spell['ritual'] = ritual
    
    # Remove None/empty fields (but keep non-empty arrays)
    spell_clean = {}
    for k, v in spell.items():
        if v is None or v == "":
            continue
        if isinstance(v, list) and len(v) == 0:
            continue
        spell_clean[k] = v
    
    return spell_clean

def main():
    spells = []
    
    # Get all spell files
    for filename in sorted(os.listdir(OBSIDIAN_PATH)):
        if filename.startswith('Заклинание') and filename.endswith('.md'):
            filepath = os.path.join(OBSIDIAN_PATH, filename)
            print(f"Parsing: {filename}")
            spell = parse_spell_file(filepath)
            if 'subSpells' in spell and spell['subSpells']:
                print(f"  -> Found {len(spell['subSpells'])} subspells")
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

