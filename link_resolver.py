# -*- coding: utf-8 -*-
"""
Common helpers to convert Obsidian-style wikilinks to site URLs/HTML.

Used by:
- parse_spells.py / parse_schools.py / parse_effects.py (JSON generation)
- convert_md_to_html.py (chapter HTML generation)
"""
from __future__ import annotations

import re
from typing import Optional


def slugify(text: str) -> str:
    """
    Convert Russian/Latin text to URL-friendly slug.

    Правила совпадают с существующими парсерами:
    - нижний регистр
    - 'ё' → 'е'
    - все, что не [а-яa-z0-9], в '-'
    - обрезка лишних '-'
    """
    value = text.strip().lower()
    value = value.replace("ё", "е")
    value = re.sub(r"[^а-яa-z0-9]+", "-", value)
    value = value.strip("-")
    return value


def strip_wikilinks_to_text(text: str) -> str:
    """
    Remove wikilinks and leave only display text.

    [[Link|Text]] -> Text
    [[Link]]      -> Link filename / last path segment
    """

    # [[Link|Text]] -> Text
    text = re.sub(r"\[\[([^\]|]+)\|([^\]]+)\]\]", r"\2", text)

    # [[Link]] / [[Path/File#Anchor]] -> last part of link or anchor text
    def _single_link(match: re.Match) -> str:
        link_target = match.group(1)
        display = match.group(2)
        if display:
            return display
        # Take last path segment
        return link_target.split("/")[-1]

    text = re.sub(
        r"\[\[([^\]#|]+)(?:#[^\]|]+)?(?:\|([^\]]+))?\]\]", _single_link, text
    )
    return text.strip()


def _resolve_special_page_link(
    full_link: str, display_text: str, base_prefix: str
) -> Optional[str]:
    """
    Handle links that go to specific rulebook chapters, not to DB objects.
    Examples:
    - 10. Компоненты Боевой Системы#Спасбросок
    - 08. Абстрактные Категории#Категории Дальности
    - 12. Критический Успех
    - 15. Повышение уровня
    """
    # Split page and anchor
    page_part = full_link
    anchor_raw = None
    if "#" in full_link:
        page_part, anchor_raw = full_link.split("#", 1)

    page_part = page_part.strip()

    # 10. Компоненты Боевой Системы → phb/combat.html
    if page_part.startswith("10. Компоненты Боевой Системы"):
        anchor_id = slugify(anchor_raw) if anchor_raw else ""
        href = f"{base_prefix}phb/combat.html"
        if anchor_id:
            href += f"#{anchor_id}"
        return f'<a href="{href}">{display_text}</a>'

    # 08. Абстрактные Категории → phb/abstract-categories.html
    if page_part.startswith("08. Абстрактные Категории"):
        anchor_id = slugify(anchor_raw) if anchor_raw else ""
        href = f"{base_prefix}phb/abstract-categories.html"
        if anchor_id:
            href += f"#{anchor_id}"
        return f'<a href="{href}">{display_text}</a>'

    # 12. Критический Успех → phb/critical-success.html
    if page_part.startswith("12. Критический Успех"):
        href = f"{base_prefix}phb/critical-success.html"
        return f'<a href="{href}">{display_text}</a>'

    # 15. Повышение уровня → phb/leveling.html
    if page_part.startswith("15. Повышение уровня"):
        href = f"{base_prefix}phb/leveling.html"
        return f'<a href="{href}">{display_text}</a>'

    # 04. Учебные Заклинания → ссылка на секцию с учебными заклинаниями
    if page_part.startswith("04. Учебные Заклинания"):
        # На сайте уже есть секция источников в PHB (через phb.html#source-*)
        # Здесь ведём просто на учебные заклинания в PHB.
        href = f"{base_prefix}phb.html#source-educational"
        return f'<a href="{href}">{display_text}</a>'

    # Неизвестная специальная страница
    return None


def _resolve_effect_link(
    last_part: str, display_text: str, base_prefix: str
) -> str:
    """
    Resolve links to Effect notes.
    """
    effect_name = last_part.replace("Эффект - ", "").strip()
    # В Spellbook есть локальный эффект Всплеск, которого нет в effects.json.
    # Для него ведём на страницу Эффектов PHB.
    if effect_name == "Всплеск":
        href = f"{base_prefix}phb/effects.html"
        return f'<a href="{href}">{display_text}</a>'

    effect_id = slugify(effect_name)
    href = f"{base_prefix}db.html?effect={effect_id}"
    return f'<a href="{href}">{display_text}</a>'


def resolve_wikilink(
    full_link: str,
    display_text: Optional[str] = None,
    base_prefix: str = "",
) -> str:
    """
    Resolve a single wikilink target to an HTML <a> tag or plain text.

    full_link  — содержимое внутри [[...]] без алиаса/текста.
    display_text — то, что пользователь хочет видеть (если есть).
    base_prefix — относительный префикс ('', '../', и т.п.).
    """
    full_link = full_link.strip()
    if display_text is None:
        display_text = full_link.split("/")[-1]

    # First try special rulebook pages (Компоненты, Абстрактные Категории и т.п.)
    special = _resolve_special_page_link(full_link, display_text, base_prefix)
    if special is not None:
        return special

    # Split path and anchor
    path_part = full_link
    if "#" in full_link:
        path_part, _ = full_link.split("#", 1)
    last_part = path_part.split("/")[-1]

    # Schools: Школа Магии - X → db.html?school={id}
    if last_part.startswith("Школа Магии - "):
        school_name = last_part.replace("Школа Магии - ", "").strip()
        school_id = slugify(school_name)
        href = f"{base_prefix}db.html?school={school_id}"
        return f'<a href="{href}">{display_text}</a>'

    # Effects: (possibly with full path)
    if last_part.startswith("Эффект - "):
        return _resolve_effect_link(last_part, display_text, base_prefix)

    # Spells: Заклинание — Школа — Название
    if last_part.startswith("Заклинание — "):
        # Структура файлов: "Заклинание — Школа — Название"
        filename = last_part.replace(".md", "")
        parts = filename.replace("Заклинание — ", "").split(" — ")
        spell_name = parts[-1].strip() if parts else filename
        spell_id = slugify(spell_name)
        href = f"{base_prefix}db.html?spell={spell_id}"
        return f'<a href="{href}">{display_text}</a>'

    # Auxiliary magic: Вспомогательная Магия - X → характеристики PHB
    if last_part.startswith("Вспомогательная Магия - "):
        aux_name = last_part.replace("Вспомогательная Магия - ", "").strip()
        aux_id = slugify(aux_name)
        href = f"{base_prefix}phb/stats.html#вспомогательная-магия-{aux_id}"
        return f'<a href="{href}">{display_text}</a>'

    # For anything else we keep just display text (no link).
    return display_text


def convert_wikilinks_in_text(text: str, base_prefix: str = "") -> str:
    """
    Replace all [[wikilinks]] and [[link|text]] occurrences in text
    with proper <a href=\"...\">text</a> when possible.
    """

    def _repl(match: re.Match) -> str:
        full_link = match.group(1)
        display = match.group(2) if match.group(2) else None
        return resolve_wikilink(full_link, display, base_prefix=base_prefix)

    return re.sub(r"\[\[([^\]|]+)(?:\|([^\]]+))?\]\]", _repl, text)


