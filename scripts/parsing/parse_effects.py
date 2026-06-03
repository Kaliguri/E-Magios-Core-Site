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

def _append_line_to_buffer(buffer: str, line: str) -> str:
    """
    Helper to accumulate human‑readable text with paragraph breaks:
    - пустая строка → ставим двойной перенос, если его ещё нет
    - непустая строка → добавляем с пробелом, если строка не первая
    """
    stripped = line.strip()
    if not stripped:
        if buffer and not buffer.endswith('\n\n'):
            buffer += '\n\n'
        return buffer
    
    if buffer and not buffer.endswith('\n\n'):
        buffer += ' ' + stripped
    else:
        buffer += stripped
    return buffer

def parse_effect_description_and_stacks(lines):
    """
    Разобрать секцию "Описание" эффекта на:
    - общее описание (до первых заголовков уровней)
    - уровни/стеки эффекта, оформленные заголовками `#### ...`

    Пример структуры (Эффект - Слепота):
    - текст
    - #### Слепота (1) — ...
    - описание уровня 1
    - #### Слепота (2) — ...
    - описание уровня 2
    """
    description = ""
    stacks = []
    current_stack = None

    for raw_line in lines:
        line = raw_line.strip()

        # Новый уровень эффекта
        if line.startswith('####'):
            # Сохраняем предыдущий, если в нём есть содержимое
            if current_stack and current_stack.get('description'):
                stacks.append(current_stack)
            # Имя уровня — текст заголовка без ####
            stack_name = line.replace('####', '').strip()
            current_stack = {"name": stack_name, "description": ""}
            continue

        # Обычная строка описания
        if current_stack is None:
            # Базовое описание эффекта (до первого уровня)
            description = _append_line_to_buffer(description, raw_line)
        else:
            # Описание конкретного уровня/стека
            current_stack['description'] = _append_line_to_buffer(current_stack['description'], raw_line)

    # Добавляем последний стек, если он есть
    if current_stack and current_stack.get('description'):
        stacks.append(current_stack)

    return description.strip(), stacks

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
    description_lines = []
    
    for line in lines:
        stripped = line.strip()
        
        # Detect sections
        if stripped.startswith('#### Параметры'):
            current_section = 'parameters'
        elif stripped.startswith('#### Описание'):
            current_section = 'description'
        elif stripped.startswith('___'):
            current_section = None
        
        # Parse parameters
        elif current_section == 'parameters' and stripped.startswith('-'):
            if '**Тип Действия**:' in stripped:
                effect['actionType'] = strip_wikilinks_to_text(stripped.split(':', 1)[1])
        
        # Accumulate raw description lines (включая заголовки уровней-стеков)
        elif current_section == 'description':
            description_lines.append(line)
    
    # Если нашли структурированную секцию "Описание" —
    # разбираем её на базовое описание и уровни/стеки
    if description_lines:
        base_description, stacks = parse_effect_description_and_stacks(description_lines)

        if base_description:
            desc_html = convert_wikilinks_in_text(base_description, base_prefix='')
            effect['description'] = clean_markdown_formatting(desc_html)

        # Преобразуем стеки в структуру, похожую на подзаклинания:
        # каждый стек имеет name и description, отрендеренные через convert_wikilinks_in_text
        if stacks:
            effect_stacks = []
            for stack in stacks:
                desc = stack.get('description', '').strip()
                name = stack.get('name', '').strip()
                if not name and not desc:
                    continue
                stack_obj = {}
                if name:
                    stack_obj['name'] = name
                if desc:
                    desc_html = convert_wikilinks_in_text(desc, base_prefix='')
                    stack_obj['description'] = clean_markdown_formatting(desc_html)
                if stack_obj:
                    effect_stacks.append(stack_obj)
            if effect_stacks:
                effect['stacks'] = effect_stacks

    # Если структурированного описания не нашли (старый или простой формат файла),
    # используем весь текст файла как описание по умолчанию
    if not effect.get('description'):
        raw = content.strip()
        if raw:
            desc_html = convert_wikilinks_in_text(raw, base_prefix='')
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

