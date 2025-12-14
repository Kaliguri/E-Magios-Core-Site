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
    - 03. Характеристики
    - 07/11. Базовые действия
    - 09/22. Заклинания
    - 10/17. Экипировка
    - 11/20. Эффекты
    """
    # Split page and anchor
    page_part = full_link
    anchor_raw = None
    if "#" in full_link:
        page_part, anchor_raw = full_link.split("#", 1)

    page_part = page_part.strip()
    normalized = page_part.lower()

    # 10. Компоненты Боевой Системы → база / basics:combat
    if "компоненты боевой системы" in normalized:
        return _make_basic_link("combat", display_text, base_prefix)

    # 08. Абстрактные Категории → база / basics:abstract-categories
    if "абстрактные категории" in normalized:
        return _make_basic_link("abstract-categories", display_text, base_prefix)

    # 12. Критический Успех → база / basics:critical-success
    if "критический успех" in normalized:
        return _make_basic_link("critical-success", display_text, base_prefix)

    # 15. Повышение уровня → база / basics:leveling
    if "повышение уровня" in normalized:
        return _make_basic_link("leveling", display_text, base_prefix)

    # 03. Характеристики → база / basics:stats
    if "характеристики" in normalized:
        return _make_basic_link("stats", display_text, base_prefix)

    # 07/11. Базовые действия → база / basics:actions
    if "базовые действия" in normalized:
        return _make_basic_link("actions", display_text, base_prefix)

    # 09/22. Заклинания → вкладка spells в базе
    if normalized.rstrip(". ").endswith("заклинания"):
        return _make_tab_link("spells", display_text, base_prefix)

    # 10/17. Экипировка → база / basics:equipment
    if "экипировка" in normalized:
        return _make_basic_link("equipment", display_text, base_prefix)

    # 11/20. Эффекты → база / basics:effects
    if "эффекты" in normalized:
        return _make_basic_link("effects", display_text, base_prefix)

    # 04. Учебные Заклинания → база / basics:study-spells
    if "учебные заклинания" in normalized:
        return _make_basic_link("study-spells", display_text, base_prefix)

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
    # Для него ведём на общую страницу эффектов в базе.
    if effect_name == "Всплеск":
        return _make_basic_link("effects", display_text, base_prefix)

    effect_id = slugify(effect_name)
    return _make_db_link("effect", effect_id, display_text, base_prefix)


def _make_basic_link(basic_id: str, display_text: str, base_prefix: str) -> str:
    """
    Build link to Basics (общие статьи) в базе.
    """
    if base_prefix == "":
        return (
            f'<a href="javascript:void(0)" onclick="switchTab(\'basics\'); '
            f"showBasicPage('{basic_id}')\""
            f' style="color: var(--accent-emerald); text-decoration: none;">{display_text}</a>'
        )

    href = f"{base_prefix}db.html?openTab=basics&basic={basic_id}"
    return f'<a href="{href}">{display_text}</a>'


def _make_tab_link(tab_name: str, display_text: str, base_prefix: str) -> str:
    """
    Build link that открывает нужную вкладку базы.
    """
    if base_prefix == "":
        return (
            f'<a href="javascript:void(0)" onclick="switchTab(\'{tab_name}\')"'
            f' style="color: var(--accent-emerald); text-decoration: none;">{display_text}</a>'
        )

    href = f"{base_prefix}db.html?openTab={tab_name}"
    return f'<a href="{href}">{display_text}</a>'


def _make_db_link(kind: str, obj_id: str, display_text: str, base_prefix: str) -> str:
    """
    Build link to DB entity.

    - Если base_prefix == '' → JSON для db.html: используем JS-обработчики (showSpellPage и др.),
      чтобы НЕ менять URL при открытии попапов.
    - Если base_prefix != '' → обычная ссылка db.html?... для глав PHB и других страниц.
    """
    if kind == "basic":
        return _make_basic_link(obj_id, display_text, base_prefix)

    # Используем JS‑обработчики только когда ссылка будет отображаться внутри db.html
    if base_prefix == "":
        if kind == "spell":
            return (
                f'<a href="javascript:void(0)" onclick="showSpellPage(\'{obj_id}\')"'
                f' style="color: var(--accent-emerald); text-decoration: none;">{display_text}</a>'
            )
        if kind == "school":
            return (
                f'<a href="javascript:void(0)" onclick="showSchoolPage(\'{obj_id}\')"'
                f' style="color: var(--accent-emerald); text-decoration: none;">{display_text}</a>'
            )
        if kind == "effect":
            return (
                f'<a href="javascript:void(0)" onclick="showEffectPage(\'{obj_id}\')"'
                f' style="color: var(--accent-emerald); text-decoration: none;">{display_text}</a>'
            )
        if kind == "action":
            return (
                f'<a href="javascript:void(0)" onclick="showActionPage(\'{obj_id}\')"'
                f' style="color: var(--accent-emerald); text-decoration: none;">{display_text}</a>'
            )
        if kind == "skill":
            return (
                f'<a href="javascript:void(0)" onclick="showSkillPage(\'{obj_id}\')"'
                f' style="color: var(--accent-emerald); text-decoration: none;">{display_text}</a>'
            )
        if kind == "actionType":
            return (
                f'<a href="javascript:void(0)" onclick="showActionTypePage(\'{obj_id}\')"'
                f' style="color: var(--accent-emerald); text-decoration: none;">{display_text}</a>'
            )
        if kind == "combat":
            return (
                f'<a href="javascript:void(0)" onclick="showCombatPage(\'{obj_id}\')"'
                f' style="color: var(--accent-emerald); text-decoration: none;">{display_text}</a>'
            )

    # Поведение по умолчанию — обычная ссылка на db.html
    href = f"{base_prefix}db.html?{kind}={obj_id}"
    return f'<a href="{href}">{display_text}</a>'


def resolve_wikilink(
    full_link: str,
    display_text: Optional[str] = None,
    base_prefix: str = "",
    allow_special_pages: bool = True,
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
    if allow_special_pages:
        special = _resolve_special_page_link(full_link, display_text, base_prefix)
        if special is not None:
            return special

    # Split path and anchor
    path_part = full_link
    if "#" in full_link:
        path_part, _ = full_link.split("#", 1)
    last_part = path_part.split("/")[-1]

    # === Сущности базы данных ===
    # Schools: Школа Магии - X → db.html?school={id}
    if last_part.startswith("Школа Магии - "):
        school_name = last_part.replace("Школа Магии - ", "").strip()
        school_id = slugify(school_name)
        return _make_db_link("school", school_id, display_text, base_prefix)

    # Effects: (possibly with full path) → db.html?effect={id}
    if last_part.startswith("Эффект - "):
        return _resolve_effect_link(last_part, display_text, base_prefix)

    # Spells: Заклинание — Школа — Название → db.html?spell={id}
    if last_part.startswith("Заклинание — "):
        # Структура файлов: "Заклинание — Школа — Название"
        filename = last_part.replace(".md", "")
        parts = filename.replace("Заклинание — ", "").split(" — ")
        spell_name = parts[-1].strip() if parts else filename
        spell_id = slugify(spell_name)
        return _make_db_link("spell", spell_id, display_text, base_prefix)

    # Combat components: Компонент Боевой Системы - X → db.html?combat={id}
    if last_part.startswith("Компонент Боевой Системы - "):
        comp_name = last_part.replace("Компонент Боевой Системы - ", "").strip()
        comp_id = slugify(comp_name)
        return _make_db_link("combat", comp_id, display_text, base_prefix)

    # Base / rest actions: Базовое Действие - X / Действия Отдыха - X → db.html?action={id}
    if last_part.startswith("Базовое Действие - ") or last_part.startswith("Базовые Действие - "):
        act_name = (
            last_part.replace("Базовое Действие - ", "")
            .replace("Базовые Действие - ", "")
            .strip()
        )
        act_id = slugify(act_name)
        return _make_db_link("action", act_id, display_text, base_prefix)
    if last_part.startswith("Действия Отдыха - "):
        act_name = last_part.replace("Действия Отдыха - ", "").strip()
        act_id = slugify(act_name)
        return _make_db_link("action", act_id, display_text, base_prefix)

    # Action types: Тип Действия - X → db.html?actionType={id}
    if last_part.startswith("Тип Действия - "):
        t_name = last_part.replace("Тип Действия - ", "").strip()
        t_id = slugify(t_name)
        return _make_db_link("actionType", t_id, display_text, base_prefix)

    # Skills: Навык Личности - X / Навык Магии - X → db.html?skill={id}
    if last_part.startswith("Навык Личности - ") or last_part.startswith("Навык Магии - "):
        s_name = (
            last_part.replace("Навык Личности - ", "")
            .replace("Навык Магии - ", "")
            .strip()
        )
        s_id = slugify(s_name)
        return _make_db_link("skill", s_id, display_text, base_prefix)

    # Archetypes: Архетип - X → db.html?archetype={id}
    if last_part.startswith("Архетип - "):
        a_name = last_part.replace("Архетип - ", "").strip()
        a_id = slugify(a_name)
        return _make_db_link("archetype", a_id, display_text, base_prefix)

    # For anything else we keep just display text (no link).
    return display_text


def convert_wikilinks_in_text(
    text: str, base_prefix: str = "", allow_special_pages: bool = True
) -> str:
    """
    Replace all [[wikilinks]] and [[link|text]] occurrences in text
    with proper <a href=\"...\">text</a> when possible.
    """

    def _repl(match: re.Match) -> str:
        full_link = match.group(1)
        display = match.group(2) if match.group(2) else None
        return resolve_wikilink(
            full_link, display, base_prefix=base_prefix, allow_special_pages=allow_special_pages
        )

    return re.sub(r"\[\[([^\]|]+)(?:\|([^\]]+))?\]\]", _repl, text)


