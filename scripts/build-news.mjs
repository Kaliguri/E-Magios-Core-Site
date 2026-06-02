/**
 * Generates the fully-resolved news feed for the React app from the legacy
 * NEWS_ENTRIES definition + the compendium data files. Mirrors the rendering
 * logic of the legacy news.js so the new site shows the same content:
 *   - "Новый функционал на сайте" (features) + "См. также" links
 *   - "Новые объекты в базе данных" (object lists resolved to DB deep-links)
 *   - "Статистика после обновления" (baked snapshots)
 *
 * Output: apps/web/public/data/news.json
 * Run:    node scripts/build-news.mjs
 */
import { readFileSync, writeFileSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const DATA_DIR = resolve(__dirname, '../apps/web/public/data');

const read = (name) => JSON.parse(readFileSync(resolve(DATA_DIR, name), 'utf-8'));

const data = {
  spells: read('spells.json'),
  schools: read('schools.json'),
  effects: read('effects.json'),
  archetypes: read('archetypes.json'),
  actions: read('actions.json'),
  basics: read('basics.json'),
  skills: read('skills.json'),
  actionTypes: read('action_types.json'),
  combatComponents: read('combat_components.json'),
  craftComponents: read('craft_components.json'),
  craftProfessions: read('craft_professions.json'),
  craftSpecializations: read('craft_specializations.json'),
  recipeTypes: read('recipe_types.json'),
  recipes: read('recipes.json'),
};

const INITIAL_SPELL_NAMES = ['Аркановое Оружие','Аркановый Залп','Аркановый Разрез','Благословение Быка','Благословенный Ветрами','Взрыв Арканы','Взрыв Разума','Водяной Щит','Водяные Иглы','Воздушный Кулак','Волна','Выстрел Арканы','Генератор Щита','Головокружение','Двойная Вспышка','Защита Разума','Земляная Защита','Земляная Тюрьма','Мгновенный Шаг','Метка Пламени','Облако Яда','Огненный Шар','Огненный Щит','Перенаправление Снаряда','Поджег','Приказ','Рой Насекомых','Сверхлегкий Клинок [+4]','Слабовольность','Смена Приспособления','Смертельная Игла','Сонный Паралич','Стремительный Рывок','Твердыня','Терновая клетка','Тошнотворный Цветок','Трех-контурное Наступательное Усиление [+3]','Трехзарядный Магический Револьвер [+4]','Тяжелая Энергетическая Броня','Удар Парящего Змея','Управление Скалой','Усиленный Удар','Ускорение','Целительная Вода','Цепи Арканы','Цепь Молний','Чувство Земли','Щит Арканы','Электрическая Перегрузка','Яд-Поглотитель','Ядовитая Аура','Язык Лягушки'];
const INITIAL_EFFECT_NAMES = ['В укрытии','Замедление','Невидимость','Немота','Обездвиженность','Оглушение','Ослепление','Подавление Магии','Сбитый с ног','Скованность','Сон','Тошнота'];
const DB_UPDATE_SPELL_NAMES = ['Блуждающий Разум','Великое Обнаружение Магии','Великое Подводное Дыхание','Взрывные Грибы','Вихрь из Меток Пламени','Влюбленность','Водяная Клетка','Возведение Земли','Всполох Мести','Генератор Щита МК1','Глаз Бури','Глаз-Разведчик МК1','Животные Чувства','Жнец МК1','Защита Территории','Защитник МК1','Изучение крови','Источник Огня','Коррозийная Стрела','Магический Слуга','Обнаружение Магии','Обнаружение Ядов','Общение Воспоминаниями','Огненная Бомба','Огненная Вспышка','Огненная Кара','Огненная Стена','Передача образа','Поглощение Стихии','Подводное Дыхание','Поиск Следов','Поиск животных и растений','Призыв Землетрясения','Призыв Торнадо','Призыв Цунами','Призыв воды','Пробуждение вулкана','Противоядие','Психический Щит','Путешествие в Воспоминание','Разговор с Животными','Разрушение в Защиту','Робот-Рука МК1','Сбивающий яд','Сверхлегкий Клинок М1','Слепая Ярость','Слияние с Природой','Смертельный Сон','Телепатическая Связь','Трех-контурное Наступательное Усиление','Трехзарядный Магический Револьвер М1','Универсальный Протез Руки М1','Устройства Связи','Усыпляющий Дождь','Хождение по Воде','Энергетическая Броня МК1'];
const DB_UPDATE_ACTION_NAMES = ['Вспомнить Информацию','Длительный отдых','Заклинания','Исследование','Концентрация','Короткий отдых','Лечение ран','Медитация','Оборона','Передвижение','Поиск Слабого Места','Починка','Преодоление','Создание','Создание Метамагии','Создание Спотнанного Заклинания','Спасбросок','Удар','Фокус'];
const DB_UPDATE_COMBAT_COMPONENT_NAMES = ['Аркана','Атакующие действия','Бонус к Наложению','Бонус к Попаданию','Воля','Действия в ходу','Защита','Здоровье','Концентрация','Правило Наибольшего Значения','Реакции','Сопротивление','Спасбросок','Стойкость','Уклонение','Уровень','Уровни Повреждений','Уязвимость'];

// type → DB tab key (matches entities/compendium/config.ts + DbPage deep-link).
const TAB_BY_TYPE = {
  spell: 'spells', school: 'schools', effect: 'effects', archetype: 'archetypes',
  action: 'actions', basic: 'basics', skill: 'skills', actionType: 'action-types',
  combatComponent: 'combat', craftComponent: 'craft-components',
  craftProfession: 'craft-professions', craftSpecialization: 'craft-specializations',
  recipeType: 'recipe-types', recipe: 'recipes',
};

function route(type, id) {
  return `#/db?tab=${TAB_BY_TYPE[type]}&detail=${encodeURIComponent(id)}`;
}

function items(list, type) {
  return list.filter(Boolean).map((it) => ({ name: it.name, route: route(type, it.id) }));
}

const byId = (list, ids) => ids.map((id) => list.find((x) => x.id === id)).filter(Boolean);
const byName = (list, names) => names.map((n) => list.find((x) => x.name === n)).filter(Boolean);

function resolveEntry(entry) {
  const o = entry.newObjects || {};
  const isInitial = entry.id === '2025-11-27-initial';
  const isDbUpdate = entry.id === '2025-11-28-db-update';

  const newSpells = isInitial
    ? data.spells.filter((s) => INITIAL_SPELL_NAMES.includes(s.name))
    : isDbUpdate
      ? byName(data.spells, DB_UPDATE_SPELL_NAMES)
      : o.spells === 'all'
        ? data.spells
        : byId(data.spells, o.spells || []);

  const newSchools = o.schools === 'all' ? data.schools : data.schools.filter((s) => (o.schools || []).includes(s.id));

  const newEffects = isInitial
    ? data.effects.filter((e) => INITIAL_EFFECT_NAMES.includes(e.name))
    : isDbUpdate
      ? data.effects.filter((e) => !INITIAL_EFFECT_NAMES.includes(e.name))
      : o.effects === 'all'
        ? data.effects
        : byId(data.effects, o.effects || []);

  const newArchetypes = o.archetypes === 'all' ? data.archetypes : data.archetypes.filter((a) => (o.archetypes || []).includes(a.id));

  const newActions = isDbUpdate
    ? byName(data.actions, DB_UPDATE_ACTION_NAMES)
    : o.actions === 'all'
      ? data.actions
      : data.actions.filter((a) => (o.actions || []).includes(a.id));

  const newBasics = o.basics === 'all' ? data.basics : byId(data.basics, o.basics || []);
  const newSkills = o.skills === 'all' ? data.skills : byId(data.skills, o.skills || []);
  const newActionTypes = o.actionTypes === 'all' ? data.actionTypes : byId(data.actionTypes, o.actionTypes || []);

  const newCombat = isDbUpdate
    ? byName(data.combatComponents, DB_UPDATE_COMBAT_COMPONENT_NAMES)
    : o.combatComponents === 'all'
      ? data.combatComponents
      : byId(data.combatComponents, o.combatComponents || []);

  const groups = [
    { label: 'Новые заклинания', items: items(newSpells, 'spell') },
    { label: 'Новые школы', items: items(newSchools, 'school') },
    { label: 'Новые эффекты', items: items(newEffects, 'effect') },
    { label: 'Новые архетипы', items: items(newArchetypes, 'archetype') },
    { label: 'Новые базовые действия', items: items(newActions, 'action') },
    { label: 'Новые основы системы', items: items(newBasics, 'basic') },
    { label: 'Новые навыки', items: items(newSkills, 'skill') },
    { label: 'Новые типы действий', items: items(newActionTypes, 'actionType') },
    { label: 'Новые компоненты боевой системы', items: items(newCombat, 'combatComponent') },
  ];

  if (entry.id === '2025-12-07-fortune-blessing') {
    const all = (key, type) => (o[key] === 'all' ? data[key] : byId(data[key], o[key] || []));
    groups.push(
      { label: 'Новые ремесленные компоненты', items: items(all('craftComponents'), 'craftComponent') },
      { label: 'Новые профессии ремесла', items: items(all('craftProfessions'), 'craftProfession') },
      { label: 'Новые специализации ремесла', items: items(all('craftSpecializations'), 'craftSpecialization') },
      { label: 'Новые типы рецептов', items: items(all('recipeTypes'), 'recipeType') },
      { label: 'Новые рецепты', items: items(all('recipes'), 'recipe') },
    );
  }

  let stats = null;
  if (isDbUpdate) {
    stats = [
      { label: 'Всего символов в данных базы', value: '140 477' },
      { label: 'Всего глав (разделов) в книгах', value: '39' },
      { label: 'Всего объектов в базе данных', value: '230 (заклинания: 103, школы: 38, эффекты: 17, архетипы: 13, базовые действия: 19, навыки: 10, типы действий: 12, компоненты боя: 18)' },
    ];
  } else if (entry.id === '2025-12-07-fortune-blessing' || entry.id === '2025-12-08-alfred-gift') {
    const c = { spells: 113, schools: 38, effects: 18, archetypes: 13, actions: 22, skills: 10, actionTypes: 13, combatComponents: 21, craftComponents: 11, craftProfessions: 6, craftSpecializations: 21, recipeTypes: 3, recipes: 1 };
    stats = [
      { label: 'Всего символов в контенте (Книги, БД)', value: (207093).toLocaleString('ru-RU') },
      { label: 'Всего глав (разделов) в книгах', value: '38' },
      {
        label: 'Всего объектов в базе данных',
        value: `290 (заклинания: ${c.spells}, школы: ${c.schools}, эффекты: ${c.effects}, архетипы: ${c.archetypes}, базовые действия: ${c.actions}, основы системы: ${data.basics.length}, навыки: ${c.skills}, типы действий: ${c.actionTypes}, компоненты боя: ${c.combatComponents}, ремесленные компоненты: ${c.craftComponents}, профессии ремесла: ${c.craftProfessions}, специализации ремесла: ${c.craftSpecializations}, типы рецептов: ${c.recipeTypes}, рецепты: ${c.recipes})`,
      },
    ];
  }

  return {
    id: entry.id,
    date: entry.date,
    title: entry.title,
    brief: entry.brief,
    features: entry.features.map((f) => f.text),
    links: (entry.links || []).map((l) => ({ text: l.text, route: mapLink(l.url) })),
    objectGroups: groups,
    stats,
  };
}

function mapLink(url) {
  if (url === 'profile.html') return '#/profile';
  if (url === 'character-editor.html') return '#/character-editor';
  if (url === 'db.html') return '#/db';
  if (url === 'phb.html') return '#/phb/intro';
  if (url === 'spellbook.html') return '#/spellbook/intro';
  const m = url.match(/^db\.html\?openTab=([\w-]+)$/);
  if (m) return `#/db?tab=${m[1]}`;
  return '#/';
}

// Source-of-truth entry definitions (features text + newObjects + links).
const NEWS_ENTRIES = JSON.parse(readFileSync(resolve(__dirname, 'news-entries.json'), 'utf-8'));

const out = NEWS_ENTRIES.map(resolveEntry);
writeFileSync(resolve(DATA_DIR, 'news.json'), JSON.stringify(out, null, 2) + '\n', 'utf-8');
console.log(`Wrote ${out.length} news entries to apps/web/public/data/news.json`);
