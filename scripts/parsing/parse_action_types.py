# -*- coding: utf-8 -*-
"""
Parse Action Type files from Obsidian Vault and generate action_types.json
Usage: python parse_action_types.py
"""
import os
import re
import json

from link_resolver import convert_wikilinks_in_text

OBSIDIAN_PATH = r"C:\Users\Kaliguri\Documents\Obsidian Vault\E'Magios Core\E'Magios Core - 03. Spellbook"
OUTPUT_PATH = r"data\action_types.json"


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


def parse_action_type_file(filepath):
    """Parse a single action type file."""
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()

    filename = os.path.basename(filepath)
    name = filename.replace('Тип Действия - ', '').replace('.md', '')

    slug = name.lower()
    slug = slug.replace('ё', 'е')
    slug = re.sub(r'[^а-яa-z0-9]+', '-', slug)
    slug = slug.strip('-')

    lines = content.split('\n')
    description_lines = []
    in_body = False
    sub_actions = []
    current_sub = None

    for raw in lines:
        line = raw.rstrip('\n')
        stripped = line.strip()

        if stripped.startswith('## '):
            # Заголовок, тело начинается после него
            in_body = True
            continue

        # Примеры и дополнительные блоки вида "##### Тип: Автоматон" считаем подзаписями, а не частью общего описания
        if stripped.startswith('##### '):
            # Не пишем этот заголовок в общее описание
            continue

        if stripped.startswith('___'):
            # Блок связей, описание закончилось
            in_body = False
            continue

        if not in_body:
            continue

        # Подзаписи: строки с "- "
        if stripped.startswith('- '):
            # Сначала завершим предыдущую подзапись
            if current_sub and current_sub.get("description"):
                # Конвертируем wikilinks в HTML, затем убираем markdown
                desc_html = convert_wikilinks_in_text(current_sub["description"], base_prefix='')
                current_sub["description"] = clean_markdown_formatting(desc_html)
                sub_actions.append(current_sub)

            title = clean_wikilink(stripped[2:].strip())
            current_sub = {
                "name": title,
                "description": ""
            }
            continue

        # Описание для текущей подзаписи
        if current_sub is not None:
            if not stripped:
                if current_sub["description"] and not current_sub["description"].endswith('\n\n'):
                    current_sub["description"] += '\n\n'
            elif not stripped.startswith('#'):
                if not current_sub["description"] or current_sub["description"].endswith('\n\n'):
                    current_sub["description"] = (current_sub["description"] or '') + stripped
                else:
                    current_sub["description"] += ' ' + stripped
        else:
            # Общая часть описания типа действия (до списков)
            if stripped and not stripped.startswith('#'):
                description_lines.append(stripped)

    # Добавим последнюю подзапись, если она есть
    if current_sub and current_sub.get("description"):
        desc_html = convert_wikilinks_in_text(current_sub["description"], base_prefix='')
        current_sub["description"] = clean_markdown_formatting(desc_html)
        sub_actions.append(current_sub)

    # Описание типа действия: сначала wikilinks → HTML, потом убираем markdown
    raw_description = '\n\n'.join(description_lines)
    desc_html = convert_wikilinks_in_text(raw_description, base_prefix='')
    description = clean_markdown_formatting(desc_html)

    action_type = {
        "id": slug,
        "name": name,
        "description": description
    }

    # Специальный разбор примера для Автоматона как поддействия "Тип: Автоматон"
    if slug == 'автоматон':
        example = parse_automaton_example(content)
        if example:
            sub_actions = [example]

    if sub_actions:
        action_type["subActions"] = sub_actions

    return action_type


def parse_automaton_example(content):
    """Parse the example block 'Тип: Автоматон' as a sub-action."""
    lines = content.split('\n')
    start = None
    for idx, raw in enumerate(lines):
        if raw.strip().startswith('##### Тип: Автоматон'):
            start = idx
            break

    if start is None:
        return None

    current_section = None
    params = []
    desc = ""

    for raw in lines[start + 1:]:
        stripped = raw.strip()

        if stripped.startswith('___'):
            break

        if stripped.startswith('###### Параметры'):
            current_section = 'params'
            continue
        if stripped.startswith('###### Описание'):
            current_section = 'description'
            continue

        if current_section == 'params':
            if stripped.startswith('-'):
                text = stripped[1:].strip()
                text = clean_markdown_formatting(clean_wikilink(text))
                if text:
                    params.append(text)
        elif current_section == 'description':
            if not stripped:
                if desc and not desc.endswith('\n\n'):
                    desc += '\n\n'
            elif not stripped.startswith('#'):
                if not desc or desc.endswith('\n\n'):
                    desc = (desc or '') + clean_wikilink(stripped)
                else:
                    desc += ' ' + clean_wikilink(stripped)

    full_desc_parts = []
    if params:
        full_desc_parts.append(' '.join(params))
    if desc:
        full_desc_parts.append(desc)

    full_desc = '\n\n'.join(full_desc_parts)
    full_desc = clean_markdown_formatting(full_desc)

    return {
        "name": "Тип: Автоматон",
        "description": full_desc
    }


def main():
  types = []

  for filename in sorted(os.listdir(OBSIDIAN_PATH)):
    if filename.startswith('Тип Действия - ') and filename.endswith('.md'):
      filepath = os.path.join(OBSIDIAN_PATH, filename)
      print(f"Parsing action type: {filename}")
      action_type = parse_action_type_file(filepath)
      types.append(action_type)

  types.sort(key=lambda x: x['name'])

  with open(OUTPUT_PATH, 'w', encoding='utf-8') as f:
    json.dump(types, f, ensure_ascii=False, indent=2)

  print(f"\nSuccessfully parsed {len(types)} action types!")
  print(f"Output written to: {OUTPUT_PATH}")


if __name__ == '__main__':
  main()


